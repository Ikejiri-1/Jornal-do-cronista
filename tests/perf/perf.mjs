// Mede a latência das operações do jornal. Servidor e banco LOCAIS (veja docs/testes.md).
// Uso: DATABASE_URL=<banco local direto> BASE_URL=http://127.0.0.1:3100 LABEL=direto node tests/perf/perf.mjs
import postgres from 'postgres';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100';
const N = Number(process.env.N || 25);
const PASS = 'SenhaForte#12345';
const DB_URL = process.env.DATABASE_URL || '';
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(DB_URL)) throw new Error('DATABASE_URL precisa ser o Postgres local de teste.');
const db = postgres(DB_URL, { ssl: false, max: 1 });

async function call(who, method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (who?.cookie) headers.Cookie = who.cookie;
  if (who?.csrf) headers['X-CSRF-Token'] = who.csrf;
  if (method !== 'GET') headers.Origin = BASE;
  const payload = body !== undefined && (method === 'PUT' || method === 'PATCH') ? { data: body } : body; // a API de documentos espera { data }
  const res = await fetch(BASE + path, { method, headers, body: payload === undefined ? undefined : JSON.stringify(payload) });
  const set = res.headers.getSetCookie().find((x) => x.startsWith('sid='));
  if (set && who) who.cookie = set.split(';')[0];
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
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const p95 = (a) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * 0.95))];

await db`truncate public.sessions, public.login_failures, public.rate_hits, public.docs, public.doc_changes, public.users cascade`;
const chefe = await enter('Raul Chefe', 'chefe@teste.com');
const ana = await enter('Ana Autora', 'ana@teste.com');
await call(chefe, 'PUT', '/api/db/works/w1', { title: 'Obra', genre: 'Contos', text: 'texto' });
await call(ana, 'PUT', `/api/db/profiles/${ana.id}`, { name: 'Ana' });
const seq = (await call(null, 'GET', '/api/db/changes')).seq;
const readColls = ['works', 'profiles', 'follows', 'subscriptions', 'stories', 'likes', 'ratings', 'comments', 'reviews'];

const cases = {
  'sessão (GET /api/auth/session)': () => call(ana, 'GET', '/api/auth/session'),
  'abertura NOVA (1 bootstrap)': () => call(ana, 'GET', '/api/db/bootstrap'),
  'abertura ANTIGA (14 leituras juntas)': () => Promise.all([...readColls, ...readColls.slice(0, 4)].map((c) => call(ana, 'GET', `/api/db/${c}`))),
  'o que mudou (changes)': () => call(ana, 'GET', `/api/db/changes?since=${seq}`),
  'gravar curtidas (PUT, troca simples)': () => call(ana, 'PUT', `/api/db/likes/${ana.id}`, { ids: ['a:b'] }),
  'enviar conto (PUT stories, com validação)': () => call(ana, 'PUT', `/api/db/stories/${ana.id}`, { items: [{ id: 'c1', title: 'T', text: 'x' }], consent: { ok: true, v: '1' } }),
  'mesclar perfil (PATCH)': () => call(ana, 'PATCH', `/api/db/profiles/${ana.id}`, { bio: 'olá' }),
  'remover (DELETE)': () => call(ana, 'DELETE', `/api/db/likes/${ana.id}`),
};

const rows = [];
for (const [name, fn] of Object.entries(cases)) {
  await fn(); // aquece
  const t = [];
  for (let i = 0; i < N; i++) { const t0 = performance.now(); await fn(); t.push(performance.now() - t0); }
  rows.push({ operação: name, 'mediana ms': Math.round(median(t)), 'p95 ms': Math.round(p95(t)) });
}
console.log(`\n${process.env.LABEL || 'medição'} (N=${N} por operação)`);
console.table(rows);
await db.end();
