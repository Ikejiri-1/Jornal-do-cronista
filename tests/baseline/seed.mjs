// Popula o banco LOCAL com dados fixos para a linha de base visual (mesmos textos a cada execução).
// Uso: DATABASE_URL=<banco local> BASE_URL=http://127.0.0.1:3100 node tests/baseline/seed.mjs
import postgres from 'postgres';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100';
const DB_URL = process.env.DATABASE_URL || '';
export const PASS = 'SenhaForte#12345';
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(DB_URL)) throw new Error('DATABASE_URL precisa ser o Postgres local de teste.');
const db = postgres(DB_URL, { ssl: false, max: 1 });

async function call(who, method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (who.cookie) headers.Cookie = who.cookie;
  if (who.csrf) headers['X-CSRF-Token'] = who.csrf;
  if (method !== 'GET') headers.Origin = BASE;
  const payload = body !== undefined && (method === 'PUT' || method === 'PATCH') ? { data: body } : body;
  const res = await fetch(BASE + path, { method, headers, body: payload === undefined ? undefined : JSON.stringify(payload) });
  const set = res.headers.getSetCookie().find((x) => x.startsWith('sid='));
  if (set) who.cookie = set.split(';')[0];
  const json = await res.json().catch(() => ({}));
  if (res.status >= 400) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json.data;
}
async function enter(name, email) {
  const who = {};
  await call(who, 'POST', '/api/auth/register', { name, email, password: PASS });
  const s = await call(who, 'GET', '/api/auth/session');
  who.csrf = s.csrfToken; who.id = s.id;
  return who;
}

await db`truncate public.sessions, public.login_failures, public.rate_hits, public.docs, public.doc_changes, public.users cascade`;
const chefe = await enter('Raul Chefe', 'chefe@teste.com');
const ana = await enter('Ana Autora', 'ana@teste.com');
const beto = await enter('Beto Autor', 'beto@teste.com');

const T = 1_700_000_000_000; // datas fixas e antigas: a tela de envios da semana fica vazia e o autor pode escrever
const text = (s) => (s + ' ').repeat(40).trim();
await call(chefe, 'PUT', '/api/db/works/obra1', { title: 'A Noite do Farol', genre: 'Contos', text: text('O farol acendeu sozinho naquela noite e ninguém soube explicar.'), at: T, earlyUntil: 0, behind: 'Escrito numa madrugada de chuva.' });
await call(chefe, 'PUT', '/api/db/works/obra2', { title: 'Poema do Mar de Tinta', genre: 'Poemas', text: text('Mar de tinta, barco de papel, a história que o vento escreveu.'), at: T + 1000, earlyUntil: 0, behind: '' });
const item = (id, pen, title, genre, n) => ({ id, pen, bio: 'Autor de teste', title, genre, text: text(`Conto ${n}: uma história inventada para a linha de base.`), at: T + n * 1000, status: 'aprovada' });
await call(chefe, 'PUT', `/api/db/stories/${ana.id}`, { items: [item('a1', 'Ana Autora', 'O Relógio Parado', 'Contos', 1), item('a2', 'Ana Autora', 'Carta Sem Endereço', 'Crônicas', 2)], consent: { ok: true, at: T, v: '2026-10' } });
await call(chefe, 'PUT', `/api/db/stories/${beto.id}`, { items: [item('b1', 'Beto Autor', 'A Última Estação', 'Aventuras', 3)], consent: { ok: true, at: T, v: '2026-10' } });
await call(ana, 'PUT', `/api/db/profiles/${ana.id}`, { name: 'Ana Autora', bio: 'Escreve contos curtos.' });
await call(beto, 'PUT', `/api/db/profiles/${beto.id}`, { name: 'Beto Autor', bio: 'Aventuras e viagens.' });
await call(ana, 'PUT', `/api/db/likes/${ana.id}`, { ids: [`${beto.id}:b1`] });
console.log('seed ok:', { chefe: chefe.id, ana: ana.id, beto: beto.id });
await db.end();
