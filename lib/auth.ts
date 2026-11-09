// Contas, senha, sessão e limite de tentativas. Tudo no Postgres, então vale para várias instâncias (Vercel) e sobrevive a reinício.
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { fail } from './http';
import * as store from './store';
import { constraintOf, sql } from './db';

const ARGON2_OPTIONS = { type: argon2.argon2id as 2, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
const SESSION_IDLE_MS = 30 * 60 * 1000;
const SESSION_MAX_MS = 12 * 60 * 60 * 1000;
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCK_STEPS_MS = [15 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000];
const PASSWORD_MIN = 15; // NIST 800-63B: 15 quando a senha é o único fator
const PASSWORD_MAX = 128;
const COMMON_PASSWORDS = ['123456789012345', 'passwordpassword', 'senhasenhasenha', 'qwertyuiopasdfg', 'aaaaaaaaaaaaaaa', 'contistacontista'];

let dummyHash: string | undefined;

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
export const normalizeEmail = (email: unknown) => String(email || '').normalize('NFKC').trim().toLowerCase();
const isEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export async function rateLimitByIp(ip: string, route: string, max: number, windowMs: number) {
  const key = ip + ':' + route, db = sql();
  if (Math.random() < 0.02) await db`delete from public.rate_hits where hit_at < now() - interval '1 day'`;
  const [{ n }] = await db<{ n: number }[]>`select count(*)::int as n from public.rate_hits where key = ${key} and hit_at > now() - (${windowMs}::int * interval '1 millisecond')`;
  if (n >= max) throw fail(429, 'LIMITE_EXCEDIDO', 'Muitas tentativas. Aguarde um pouco.', { retryAfter: Math.ceil(windowMs / 1000) });
  await db`insert into public.rate_hits (key) values (${key})`;
}

async function checkLock(emailKey: string) {
  const [record] = await sql()<{ wait: number }[]>`select ceil(extract(epoch from (locked_until - now())))::int as wait from public.login_failures where email_hash = ${emailKey} and locked_until > now()`;
  if (record) throw fail(429, 'LIMITE_EXCEDIDO', 'Muitas tentativas erradas. Tente de novo mais tarde.', { retryAfter: record.wait });
}

type FailureRow = { count: number; first_at: Date; locked_until: Date | null; repeats: number; repeats_at: Date };
async function recordFailure(emailKey: string) {
  await sql().begin(async (tx) => {
    const [old] = await tx<FailureRow[]>`select count, first_at, locked_until, repeats, repeats_at from public.login_failures where email_hash = ${emailKey} for update`;
    const now = Date.now();
    let { count, repeats } = old || { count: 0, repeats: 0 };
    let firstAt = old ? old.first_at.getTime() : now, repeatsAt = old ? old.repeats_at.getTime() : now;
    let lockedUntil: number | null = old?.locked_until ? old.locked_until.getTime() : null;
    if (!old || now - firstAt > FAILURE_WINDOW_MS) { count = 0; firstAt = now; }
    if (now - repeatsAt > 24 * 3600 * 1000) { repeats = 0; repeatsAt = now; }
    count += 1;
    if (count >= MAX_FAILURES) {
      lockedUntil = now + LOCK_STEPS_MS[Math.min(repeats, LOCK_STEPS_MS.length - 1)];
      repeats += 1; count = 0; firstAt = now;
    }
    await tx`insert into public.login_failures (email_hash, count, first_at, locked_until, repeats, repeats_at)
      values (${emailKey}, ${count}, ${new Date(firstAt)}, ${lockedUntil ? new Date(lockedUntil) : null}, ${repeats}, ${new Date(repeatsAt)})
      on conflict (email_hash) do update set count = excluded.count, first_at = excluded.first_at, locked_until = excluded.locked_until, repeats = excluded.repeats, repeats_at = excluded.repeats_at`;
  });
}

function validatePassword(password: unknown, email: string) {
  if (typeof password !== 'string') throw fail(422, 'VALIDACAO', 'Senha inválida.', { field: 'password' });
  const normalized = password.normalize('NFKC'), localPart = email.split('@')[0];
  if (normalized.length < PASSWORD_MIN) throw fail(422, 'VALIDACAO', `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres. Uma frase longa serve.`, { field: 'password' });
  if (normalized.length > PASSWORD_MAX) throw fail(422, 'VALIDACAO', `A senha pode ter no máximo ${PASSWORD_MAX} caracteres.`, { field: 'password' });
  if (COMMON_PASSWORDS.includes(normalized.toLowerCase()) || (localPart.length >= 6 && normalized.toLowerCase().includes(localPart))) {
    throw fail(422, 'VALIDACAO', 'Essa senha é fácil de adivinhar. Escolha outra frase.', { field: 'password' });
  }
  return normalized;
}

export async function register(ip: string, body: Record<string, unknown>) {
  await rateLimitByIp(ip, 'register', 10, 60 * 60 * 1000);
  const email = normalizeEmail(body.email);
  const name = String(body.name || '').normalize('NFKC').replace(/[\u0000-\u001F]/g, ' ').trim();
  if (!isEmail(email)) throw fail(422, 'VALIDACAO', 'Informe um e-mail válido.', { field: 'email' });
  if (name.length < 2 || name.length > 40) throw fail(422, 'VALIDACAO', 'O nome de autor precisa ter de 2 a 40 caracteres.', { field: 'name' });
  const password = validatePassword(body.password, email);
  // shortcut: sem verificação de e-mail (não há serviço de e-mail), então o cadastro duplicado revela que a conta existe.
  if (await store.findUserByEmail(email)) throw fail(409, 'CONFLITO', 'Não foi possível criar a conta com esses dados.');
  const wantsChefe = !!process.env.CHEFE_EMAIL && normalizeEmail(process.env.CHEFE_EMAIL) === email;
  const user: store.User = {
    id: 'u' + crypto.randomBytes(9).toString('base64url'),
    email,
    name,
    passwordHash: await argon2.hash(password, ARGON2_OPTIONS),
    role: 'reader',
    createdAt: Date.now(),
  };
  // O banco garante e-mail único e um chefe só (users_one_chefe): se já existe chefe, a conta nasce leitor.
  for (const role of wantsChefe ? (['chefe', 'reader'] as const) : (['reader'] as const)) {
    try { user.role = role; await store.addUser(user); return user; } catch (error) {
      const violated = constraintOf(error);
      if (violated === 'users_email_unique') throw fail(409, 'CONFLITO', 'Não foi possível criar a conta com esses dados.');
      if (violated !== 'users_one_chefe') throw error;
    }
  }
  return user;
}

export async function login(ip: string, body: Record<string, unknown>) {
  await rateLimitByIp(ip, 'login', 20, 60 * 1000);
  const email = normalizeEmail(body.email), password = typeof body.password === 'string' ? body.password.normalize('NFKC') : '';
  const emailKey = sha256(email);
  await checkLock(emailKey);
  const user = await store.findUserByEmail(email);
  dummyHash ||= await argon2.hash('senha-falsa-para-igualar-tempo', ARGON2_OPTIONS); // e-mail inexistente gasta o mesmo tempo
  const valid = password.length <= PASSWORD_MAX && await argon2.verify(user ? user.passwordHash : dummyHash, password).catch(() => false);
  if (!user || !valid) {
    await recordFailure(emailKey);
    throw fail(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha incorretos.');
  }
  await sql()`delete from public.login_failures where email_hash = ${emailKey}`;
  if (argon2.needsRehash(user.passwordHash, ARGON2_OPTIONS)) {
    user.passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
    await store.setPasswordHash(user.id, user.passwordHash);
  }
  return user;
}

export async function createSession(user: store.User) {
  const sid = crypto.randomBytes(32).toString('base64url'), csrf = crypto.randomBytes(24).toString('base64url');
  await sql()`insert into public.sessions (token_hash, user_id, csrf) values (${sha256(sid)}, ${user.id}, ${csrf})`;
  return { sid, csrf };
}

// Só o hash do identificador fica no banco. Expira após 30 min parado ou 12 h no total.
export async function readSession(sid?: string) {
  if (!sid) return null;
  const key = sha256(sid), db = sql();
  // Sessão e usuário numa consulta só: cada ida ao banco custa a latência da rede (a Vercel e o Supabase ficam em lugares diferentes).
  const [row] = await db<(store.UserRow & { csrf: string; idle: number; age: number })[]>`
    select u.id, u.email, u.name, u.password_hash, u.role, u.created_at, s.csrf,
      extract(epoch from (now() - s.last_seen)) * 1000 as idle, extract(epoch from (now() - s.created_at)) * 1000 as age
    from public.sessions s join public.users u on u.id = s.user_id where s.token_hash = ${key}`;
  if (!row) return null;
  if (row.idle > SESSION_IDLE_MS || row.age > SESSION_MAX_MS) { await db`delete from public.sessions where token_hash = ${key}`; return null; }
  if (row.idle > 60_000) await db`update public.sessions set last_seen = now() where token_hash = ${key}`; // renova sem gravar a cada clique
  return { user: store.toUser(row), csrf: row.csrf };
}

export const destroySession = (sid?: string) => sql()`delete from public.sessions where token_hash = ${sha256(sid || '')}`;
export const publicUser = (user: store.User, csrf: string) => ({ id: user.id, name: user.name, canEdit: store.isChefe(user), csrfToken: csrf });
