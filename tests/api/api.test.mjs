// Testes da API contra um servidor e um Postgres LOCAIS (veja docs/testes.md). Rodar: node --test tests/api
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import postgres from 'postgres';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100';
const DB_URL = process.env.DATABASE_URL || '';
const PASS = 'SenhaForte#12345';

// Os testes apagam todas as tabelas: só rodam em banco local.
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(DB_URL)) throw new Error('DATABASE_URL precisa apontar para um Postgres local de teste (nunca o Supabase real).');
const db = postgres(DB_URL, { ssl: false, max: 1 });

// Cliente mínimo com cookie de sessão e token CSRF.
function client() {
  const c = { cookie: '', csrf: '', id: '' };
  c.call = async (method, path, body, extra = {}) => {
    const headers = { 'Content-Type': 'application/json', ...extra.headers };
    if (c.cookie) headers.Cookie = c.cookie;
    if (extra.csrf !== null && c.csrf) headers['X-CSRF-Token'] = extra.csrf || c.csrf;
    if (extra.origin !== null && method !== 'GET') headers.Origin = extra.origin || BASE;
    const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = res.headers.getSetCookie().find((x) => x.startsWith('sid='));
    if (set) c.cookie = set.split(';')[0];
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json, data: json.data, headers: res.headers };
  };
  c.enter = async (path, body) => {
    const r = await c.call('POST', path, body);
    assert.equal(r.status, 200, `${path}: ${JSON.stringify(r.json)}`);
    const s = await c.call('GET', '/api/auth/session');
    c.csrf = s.data.csrfToken; c.id = s.data.id; c.canEdit = s.data.canEdit;
    return c;
  };
  return c;
}
const signup = (name, email) => client().enter('/api/auth/register', { name, email, password: PASS });
const put = (c, col, id, data) => c.call('PUT', `/api/db/${col}/${id}`, { data });
const get = (c, col, id) => c.call('GET', `/api/db/${col}/${id}`);
const story = (id, over = {}) => ({ id, pen: 'Autor', title: 'Título', genre: 'Contos', text: 'Texto do conto.', ...over });

let chefe, ana, beto, anon;
before(async () => {
  await db`truncate public.sessions, public.login_failures, public.rate_hits, public.docs, public.doc_changes, public.users cascade`;
  anon = client();
  chefe = await signup('Raul Chefe', 'chefe@teste.com'); // CHEFE_EMAIL do servidor de teste
  ana = await signup('Ana Autora', 'ana@teste.com');
  beto = await signup('Beto Autor', 'beto@teste.com');
});
after(() => db.end());

test('cadastro: o e-mail do chefe vira chefe; os outros viram leitores', () => {
  assert.equal(chefe.canEdit, true);
  assert.equal(ana.canEdit, false);
});

test('cadastro: valida senha, e-mail e duplicidade', async () => {
  const c = client();
  assert.equal((await c.call('POST', '/api/auth/register', { name: 'Fulano', email: 'f@teste.com', password: 'curta' })).status, 422);
  assert.equal((await c.call('POST', '/api/auth/register', { name: 'Fulano', email: 'invalido', password: PASS })).status, 422);
  assert.equal((await c.call('POST', '/api/auth/register', { name: 'F', email: 'f@teste.com', password: PASS })).status, 422);
  assert.equal((await c.call('POST', '/api/auth/register', { name: 'Ana Outra', email: 'ANA@teste.com', password: PASS })).status, 409);
});

test('login: senha errada dá 401 e 5 erros seguidos bloqueiam a conta', async () => {
  await db`truncate public.rate_hits, public.login_failures`;
  const c = client();
  for (let i = 0; i < 5; i++) assert.equal((await c.call('POST', '/api/auth/login', { email: 'beto@teste.com', password: 'errada-errada-errada' })).status, 401);
  const locked = await c.call('POST', '/api/auth/login', { email: 'beto@teste.com', password: PASS });
  assert.equal(locked.status, 429);
  assert.ok(Number(locked.headers.get('retry-after')) > 0);
  await db`truncate public.rate_hits, public.login_failures`;
});

test('sessão: anônimo recebe null; logado recebe token CSRF', async () => {
  assert.equal((await anon.call('GET', '/api/auth/session')).data, null);
  assert.ok(ana.csrf.length > 20);
});

test('logout encerra a sessão', async () => {
  const c = await client().enter('/api/auth/login', { email: 'ana@teste.com', password: PASS });
  assert.equal((await c.call('POST', '/api/auth/logout')).status, 200);
  assert.equal((await c.call('GET', '/api/auth/session')).data, null);
});

test('escrita: exige sessão, CSRF e origem do mesmo site', async () => {
  assert.equal((await put(anon, 'likes', ana.id, { ids: [] })).status, 401);
  assert.equal((await ana.call('PUT', `/api/db/likes/${ana.id}`, { data: { ids: [] } }, { csrf: 'errado' })).status, 403);
  assert.equal((await ana.call('PUT', `/api/db/likes/${ana.id}`, { data: { ids: [] } }, { origin: 'https://outro-site.com' })).status, 403);
  assert.equal((await put(ana, 'likes', ana.id, { ids: ['a:b'] })).status, 200);
});

test('regras por coleção: dono grava o seu, não o dos outros; chefe-only protegido', async () => {
  assert.equal((await put(ana, 'likes', beto.id, { ids: [] })).status, 404, 'curtidas de outro');
  assert.equal((await put(ana, 'works', 'w1', { title: 'x' })).status, 404, 'works é do chefe');
  assert.equal((await put(ana, 'meta', 'settings', { hideSamples: true })).status, 404, 'meta é do chefe');
  assert.equal((await put(chefe, 'works', 'w1', { title: 'Obra', genre: 'Contos', text: 'texto' })).status, 200);
  assert.equal((await put(ana, 'profiles', ana.id, { name: 'Ana' })).status, 200);
  assert.equal((await put(ana, 'profiles', beto.id, { name: 'Beto falso' })).status, 404);
});

test('coleção ou id inválidos dão 404', async () => {
  assert.equal((await get(anon, 'inexistente', 'x')).status, 404);
  assert.equal((await get(anon, 'likes', 'id com espaço')).status, 404);
  assert.equal((await anon.call('GET', '/api/db/inexistente')).status, 404);
});

test('histórias: entra em análise, autor não decide a aprovação nem apaga o publicado', async () => {
  const sent = await put(ana, 'stories', ana.id, { items: [story('s1', { status: 'aprovada' })], consent: { ok: true, v: '1' } });
  assert.equal(sent.status, 200);
  assert.equal(sent.data.items[0].status, 'analise', 'a resposta traz o documento como o servidor guardou');
  // tentativa de trocar a lista inteira, sem o conto anterior
  const again = await put(ana, 'stories', ana.id, { items: [story('s2')], consent: { ok: true, v: '1' } });
  assert.deepEqual(again.data.items.map((i) => i.id), ['s1', 's2'], 'o que já existia é mantido');
  assert.equal((await ana.call('DELETE', `/api/db/stories/${ana.id}`)).status, 404, 'autor não remove');
  assert.equal((await put(beto, 'stories', ana.id, { items: [] })).status, 404, 'outro autor não escreve');
});

test('histórias: exige consentimento e respeita o limite de 20', async () => {
  const noConsent = await put(beto, 'stories', beto.id, { items: [story('b1')] });
  assert.equal(noConsent.status, 422);
  const many = Array.from({ length: 21 }, (_, i) => story('m' + i));
  assert.equal((await put(beto, 'stories', beto.id, { items: many, consent: { ok: true, v: '1' } })).status, 422);
});

test('histórias: o chefe edita e remove', async () => {
  const items = (await get(chefe, 'stories', ana.id)).data.data.items.map((i) => ({ ...i, status: 'aprovada' }));
  assert.equal((await put(chefe, 'stories', ana.id, { items, consent: null })).data.items[0].status, 'aprovada');
  assert.equal((await chefe.call('DELETE', `/api/db/stories/${ana.id}`)).status, 200);
  assert.equal((await get(anon, 'stories', ana.id)).data.exists, false);
});

test('avisos (notices): só o chefe grava; só o dono lê e dispensa', async () => {
  assert.equal((await put(ana, 'notices', ana.id, { items: [] })).status, 404);
  assert.equal((await put(chefe, 'notices', ana.id, { items: [{ id: 's1', title: 'T', reason: 'motivo', at: 1 }] })).status, 200);
  assert.equal((await get(ana, 'notices', ana.id)).data.exists, true);
  assert.equal((await get(beto, 'notices', ana.id)).data.exists, false, 'outro leitor não vê');
  assert.equal((await get(anon, 'notices', ana.id)).data.exists, false, 'anônimo não vê');
  assert.equal((await ana.call('DELETE', `/api/db/notices/${ana.id}`)).status, 200);
});

test('denúncias: qualquer logado cria a sua; só o chefe lê', async () => {
  assert.equal((await put(ana, 'reports', 'r1', { by: beto.id, key: 'x' })).status, 422, 'não pode denunciar em nome de outro');
  assert.equal((await put(ana, 'reports', 'r1', { by: ana.id, key: 'k1' })).status, 200);
  assert.equal((await put(ana, 'reports', 'r1', { by: ana.id, key: 'outra' })).status, 422, 'não reescreve a própria denúncia');
  assert.equal((await get(ana, 'reports', 'r1')).data.exists, false);
  assert.equal((await get(chefe, 'reports', 'r1')).data.exists, true);
});

test('listas respeitam a regra de leitura', async () => {
  await put(ana, 'waitlist', ana.id, { plan: 'leitor', at: 1 });
  assert.equal((await ana.call('GET', '/api/db/waitlist')).data.length, 1);
  assert.equal((await beto.call('GET', '/api/db/waitlist')).data.length, 0);
  assert.equal((await anon.call('GET', '/api/db/waitlist')).data.length, 0);
  assert.equal((await chefe.call('GET', '/api/db/waitlist')).data.length, 1);
  assert.equal((await anon.call('GET', '/api/db/reports')).data.length, 0);
});

test('bootstrap: mesmas regras de leitura que as listas', async () => {
  const b = async (c) => (await c.call('GET', '/api/db/bootstrap')).data;
  const [fromAnon, fromAna, fromChefe] = [await b(anon), await b(ana), await b(chefe)];
  assert.equal(fromAnon.collections.reports.length, 0);
  assert.equal(fromAnon.collections.waitlist.length, 0);
  assert.equal(fromAna.collections.waitlist.length, 1);
  assert.equal(fromChefe.collections.reports.length, 1);
  assert.equal(fromChefe.collections.works.length, 1);
  assert.equal(fromAnon.collections.works.length, 1, 'obras são públicas');
  assert.ok(Number(fromAnon.seq) > 0);
  assert.deepEqual(Object.keys(fromAnon.collections).sort(), ['comments', 'follows', 'likes', 'meta', 'notices', 'profiles', 'ratings', 'reports', 'requests', 'reviews', 'stories', 'subscriptions', 'waitlist', 'works']);
});

test('changes: devolve o que mudou e só o que o usuário pode ler', async () => {
  const start = (await anon.call('GET', '/api/db/changes')).data.seq;
  await put(chefe, 'notices', beto.id, { items: [{ id: 'z', title: 'T', reason: 'r', at: 1 }] });
  await put(ana, 'likes', ana.id, { ids: ['k:1'] });
  const seen = async (c) => (await c.call('GET', `/api/db/changes?since=${start}`)).data.items.map((i) => `${i.c}/${i.id}`).sort();
  assert.deepEqual(await seen(anon), [`likes/${ana.id}`]);
  assert.deepEqual(await seen(beto), [`likes/${ana.id}`, `notices/${beto.id}`]);
  assert.deepEqual(await seen(chefe), [`likes/${ana.id}`, `notices/${beto.id}`]);
  assert.deepEqual((await anon.call('GET', '/api/db/changes?since=999999999')).data.items, []);
});

test('PATCH mescla campos; PATCH em documento inexistente dá 404', async () => {
  await put(ana, 'profiles', ana.id, { name: 'Ana', bio: 'antiga' });
  const r = await ana.call('PATCH', `/api/db/profiles/${ana.id}`, { data: { bio: 'nova' } });
  assert.deepEqual(r.data, { name: 'Ana', bio: 'nova' });
  assert.equal((await ana.call('PATCH', `/api/db/comments/${ana.id}`, { data: { items: [] } })).status, 404);
});

test('escritas simultâneas no mesmo documento não se perdem', async () => {
  await put(ana, 'profiles', ana.id, { name: 'Ana' });
  const keys = Array.from({ length: 8 }, (_, i) => 'campo' + i);
  const results = await Promise.all(keys.map((k) => ana.call('PATCH', `/api/db/profiles/${ana.id}`, { data: { [k]: 1 } })));
  assert.ok(results.every((r) => r.status === 200));
  const final = (await get(ana, 'profiles', ana.id)).data.data;
  for (const k of keys) assert.equal(final[k], 1, k + ' perdido');
});

test('documento grande demais dá 413; corpo inválido dá 422', async () => {
  assert.equal((await put(ana, 'profiles', ana.id, { name: 'x'.repeat(1_100_000) })).status, 413);
  assert.equal((await ana.call('PUT', `/api/db/profiles/${ana.id}`, { data: [1, 2] })).status, 422);
  assert.equal((await ana.call('PUT', `/api/db/profiles/${ana.id}`, { data: 'texto' })).status, 422);
});

test('respostas de erro não vazam detalhe interno', async () => {
  const r = await ana.call('PUT', `/api/db/profiles/${ana.id}`, { data: [] });
  assert.deepEqual(Object.keys(r.json), ['error']);
  assert.ok(!/at .*\.(ts|js)|postgres|select /i.test(JSON.stringify(r.json)));
});
