// Contas, senha, sessão e limite de tentativas. Em memória (sem banco por enquanto).
// shortcut: contadores e sessões somem ao reiniciar e valem por processo; trocar por Redis ao ter mais de um processo.
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { fail } from './http';
import * as store from './store';

const ARGON2_OPTIONS = { type: argon2.argon2id as 2, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
const SESSION_IDLE_MS = 30 * 60 * 1000;
const SESSION_MAX_MS = 12 * 60 * 60 * 1000;
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCK_STEPS_MS = [15 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000];
const PASSWORD_MIN = 15; // NIST 800-63B: 15 quando a senha é o único fator
const PASSWORD_MAX = 128;
const COMMON_PASSWORDS = ['123456789012345', 'passwordpassword', 'senhasenhasenha', 'qwertyuiopasdfg', 'aaaaaaaaaaaaaaa', 'contistacontista'];

type Session = { userId: string; csrf: string; createdAt: number; lastSeen: number };
type Failure = { count: number; firstAt: number; lockedUntil: number; repeats: number; repeatsAt: number };
type AuthState = { sessions: Map<string, Session>; failures: Map<string, Failure>; ipHits: Map<string, number[]>; dummy?: string };
const globalState = globalThis as unknown as { __auth?: AuthState };
const state: AuthState = (globalState.__auth ||= { sessions: new Map(), failures: new Map(), ipHits: new Map() });

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
export const normalizeEmail = (email: unknown) => String(email || '').normalize('NFKC').trim().toLowerCase();
const isEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export function rateLimitByIp(ip: string, route: string, max: number, windowMs: number) {
  const key = ip + ':' + route, now = Date.now();
  const hits = (state.ipHits.get(key) || []).filter((time) => now - time < windowMs);
  if (hits.length >= max) throw fail(429, 'LIMITE_EXCEDIDO', 'Muitas tentativas. Aguarde um pouco.', { retryAfter: Math.ceil(windowMs / 1000) });
  hits.push(now);
  state.ipHits.set(key, hits);
}

function checkLock(emailKey: string) {
  const record = state.failures.get(emailKey), now = Date.now();
  if (record && record.lockedUntil > now) {
    throw fail(429, 'LIMITE_EXCEDIDO', 'Muitas tentativas erradas. Tente de novo mais tarde.', { retryAfter: Math.ceil((record.lockedUntil - now) / 1000) });
  }
}

function recordFailure(emailKey: string) {
  const now = Date.now();
  let record = state.failures.get(emailKey);
  if (!record || now - record.firstAt > FAILURE_WINDOW_MS) {
    record = { count: 0, firstAt: now, lockedUntil: 0, repeats: record?.repeats || 0, repeatsAt: record?.repeatsAt || now };
  }
  if (now - record.repeatsAt > 24 * 3600 * 1000) { record.repeats = 0; record.repeatsAt = now; }
  record.count += 1;
  if (record.count >= MAX_FAILURES) {
    record.lockedUntil = now + LOCK_STEPS_MS[Math.min(record.repeats, LOCK_STEPS_MS.length - 1)];
    record.repeats += 1; record.count = 0; record.firstAt = now;
  }
  state.failures.set(emailKey, record);
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
  rateLimitByIp(ip, 'register', 10, 60 * 60 * 1000);
  const email = normalizeEmail(body.email);
  const name = String(body.name || '').normalize('NFKC').replace(/[\u0000-\u001F]/g, ' ').trim();
  if (!isEmail(email)) throw fail(422, 'VALIDACAO', 'Informe um e-mail válido.', { field: 'email' });
  if (name.length < 2 || name.length > 40) throw fail(422, 'VALIDACAO', 'O nome de autor precisa ter de 2 a 40 caracteres.', { field: 'name' });
  const password = validatePassword(body.password, email);
  // shortcut: sem verificação de e-mail (não há serviço de e-mail), então o cadastro duplicado revela que a conta existe.
  if (store.findUserByEmail(email)) throw fail(409, 'CONFLITO', 'Não foi possível criar a conta com esses dados.');
  const user: store.User = {
    id: 'u' + crypto.randomBytes(9).toString('base64url'),
    email,
    name,
    passwordHash: await argon2.hash(password, ARGON2_OPTIONS),
    role: process.env.EDITOR_EMAIL && normalizeEmail(process.env.EDITOR_EMAIL) === email ? 'editor' : 'reader',
    createdAt: Date.now(),
  };
  store.addUser(user);
  return user;
}

export async function login(ip: string, body: Record<string, unknown>) {
  rateLimitByIp(ip, 'login', 20, 60 * 1000);
  const email = normalizeEmail(body.email), password = typeof body.password === 'string' ? body.password.normalize('NFKC') : '';
  const emailKey = sha256(email);
  checkLock(emailKey);
  const user = store.findUserByEmail(email);
  state.dummy ||= await argon2.hash('senha-falsa-para-igualar-tempo', ARGON2_OPTIONS); // e-mail inexistente gasta o mesmo tempo
  const valid = password.length <= PASSWORD_MAX && await argon2.verify(user ? user.passwordHash : state.dummy, password).catch(() => false);
  if (!user || !valid) {
    recordFailure(emailKey);
    throw fail(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha incorretos.');
  }
  state.failures.delete(emailKey);
  if (argon2.needsRehash(user.passwordHash, ARGON2_OPTIONS)) {
    user.passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
    store.save();
  }
  return user;
}

export function createSession(user: store.User) {
  const sid = crypto.randomBytes(32).toString('base64url');
  state.sessions.set(sha256(sid), { userId: user.id, csrf: crypto.randomBytes(24).toString('base64url'), createdAt: Date.now(), lastSeen: Date.now() });
  return sid;
}

export function readSession(sid?: string) {
  if (!sid) return null;
  const key = sha256(sid), session = state.sessions.get(key), now = Date.now();
  if (!session) return null;
  if (now - session.lastSeen > SESSION_IDLE_MS || now - session.createdAt > SESSION_MAX_MS) { state.sessions.delete(key); return null; }
  const user = store.findUserById(session.userId);
  if (!user) { state.sessions.delete(key); return null; }
  session.lastSeen = now;
  return { user, csrf: session.csrf };
}

export const destroySession = (sid?: string) => state.sessions.delete(sha256(sid || ''));
export const publicUser = (user: store.User, csrf: string) => ({ id: user.id, name: user.name, canEdit: store.isEditor(user), csrfToken: csrf });
