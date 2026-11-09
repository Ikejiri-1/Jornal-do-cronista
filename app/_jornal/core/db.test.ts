// Testes de unidade da camada de dados. Rodar: node --test app/_jornal/core/
import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error o Node exige a extensão .ts; o tsconfig não permite
import { makeRemoteDB } from './db.ts';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mk: any = makeRemoteDB;

type Call = { method: string; url: string; body?: { data?: unknown } };

// Servidor falso: responde por "METHOD url"; função em vez de objeto = resposta calculada na hora.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fake(routes: Record<string, unknown>) {
  const calls: Call[] = [];
  const gates: Record<string, () => void> = {};
  const env: any = {
    fetch: async (url: string, init: RequestInit) => {
      const method = init.method as string;
      calls.push({ method, url, body: init.body ? JSON.parse(init.body as string) : undefined });
      const r = routes[method + ' ' + url];
      if (typeof r === 'function') await r(gates);
      const res = r instanceof Error ? r : r;
      if (res instanceof Error) return { ok: false, status: 403, json: async () => ({ error: { code: 'PROIBIDO', message: res.message } }) } as Response;
      return { ok: true, status: 200, json: async () => ({ data: res }) } as Response;
    },
    setInterval: () => 0,
    isHidden: () => false,
    onVisible: () => {},
  };
  return { env, calls };
}
const boot = (docs: { id: string; data: object }[]) => ({ collections: { stories: docs }, seq: 5 });
const tick = () => new Promise((r) => setTimeout(r, 0));

test('abre com uma requisição e entrega a coleção ao assinante', async () => {
  const { env, calls } = fake({ 'GET /api/db/bootstrap': boot([{ id: 'a', data: { t: 1 } }]) });
  const db = mk('tok', false, env);
  const got: unknown[] = [];
  db.collection('stories').onSnapshot((s: any) => got.push(s.docs.map((d: any) => d.id)));
  db.collection('stories').doc('a').onSnapshot((s: any) => got.push(s.exists));
  await tick();
  assert.deepEqual(got, [['a'], true]);
  assert.equal(calls.length, 1);
});

test('gravação otimista: a tela muda antes do servidor responder e o servidor tem a palavra final', async () => {
  const { env } = fake({
    'GET /api/db/bootstrap': boot([]),
    'PUT /api/db/stories/n': (g: Record<string, () => void>) => new Promise<void>((res) => { g.put = res; }),
  });
  const db = mk('tok', true, env); // chefe: gravação otimista também em stories
  const seen: unknown[] = [];
  db.collection('stories').doc('n').onSnapshot((s: { exists: boolean; data(): unknown }) => seen.push(s.exists ? s.data() : null));
  await tick();
  const p = db.collection('stories').doc('n').set({ v: 1 });
  assert.deepEqual(seen.at(-1), { v: 1 }, 'otimista antes da resposta');
  void p;
});

test('desfaz o palpite quando o servidor recusa (documento novo some)', async () => {
  const { env } = fake({ 'GET /api/db/bootstrap': boot([]), 'PUT /api/db/stories/n': new Error('não pode') });
  const db = mk('tok', true, env);
  const seen: unknown[] = [];
  db.collection('stories').doc('n').onSnapshot((s: any) => seen.push(s.exists));
  await tick();
  await assert.rejects(db.collection('stories').doc('n').set({ v: 1 }), { message: 'não pode', code: 'PROIBIDO', status: 403 });
  assert.deepEqual(seen, [false, true, false]);
});

test('desfaz para o valor antigo quando a atualização falha', async () => {
  const { env } = fake({ 'GET /api/db/bootstrap': boot([{ id: 'a', data: { v: 1 } }]), 'PATCH /api/db/stories/a': new Error('x') });
  const db = mk('tok', true, env);
  const seen: unknown[] = [];
  db.collection('stories').doc('a').onSnapshot((s: { data(): unknown }) => seen.push(s.data()));
  await tick();
  await assert.rejects(db.collection('stories').doc('a').update({ w: 2 }));
  assert.deepEqual(seen, [{ v: 1 }, { v: 1, w: 2 }, { v: 1 }]);
});

test('leitor em stories não faz palpite: usa a resposta do servidor', async () => {
  const { env } = fake({ 'GET /api/db/bootstrap': boot([]), 'PUT /api/db/stories/n': { v: 1, status: 'analise' } });
  const db = mk('tok', false, env);
  const seen: unknown[] = [];
  db.collection('stories').doc('n').onSnapshot((s: { exists: boolean; data(): unknown }) => seen.push(s.exists ? s.data() : null));
  await tick();
  const p = db.collection('stories').doc('n').set({ v: 1 });
  assert.equal(seen.length, 1, 'sem otimismo antes da resposta');
  await p;
  assert.deepEqual(seen.at(-1), { v: 1, status: 'analise' });
});

test('novo documento fica no topo da lista (mais recente primeiro)', async () => {
  const { env } = fake({ 'GET /api/db/bootstrap': boot([{ id: 'a', data: {} }]), 'PUT /api/db/stories/b': { ok: 1 } });
  const db = mk('tok', true, env);
  let ids: string[] = [];
  db.collection('stories').onSnapshot((s: any) => { ids = s.docs.map((d: any) => d.id); });
  await tick();
  await db.collection('stories').doc('b').set({ ok: 1 });
  assert.deepEqual(ids, ['b', 'a']);
});

test('remover some na hora e volta se o servidor recusar', async () => {
  const { env } = fake({ 'GET /api/db/bootstrap': boot([{ id: 'a', data: { v: 1 } }]), 'DELETE /api/db/stories/a': new Error('x') });
  const db = mk('tok', true, env);
  const seen: boolean[] = [];
  db.collection('stories').doc('a').onSnapshot((s: any) => seen.push(s.exists));
  await tick();
  await assert.rejects(db.collection('stories').doc('a').delete());
  assert.deepEqual(seen, [true, false, true]);
});

test('consulta de mudanças busca só os documentos alterados', async () => {
  let tickFn: () => void = () => {};
  const { env, calls } = fake({
    'GET /api/db/bootstrap': boot([{ id: 'a', data: { v: 1 } }, { id: 'b', data: { v: 1 } }]),
    'GET /api/db/changes?since=5': { seq: 6, items: [{ c: 'stories', id: 'a' }] },
    'GET /api/db/stories/a': { exists: true, data: { v: 2 } },
  });
  env.setInterval = (fn: () => void) => { tickFn = fn; return 0; };
  const db = mk('tok', false, env);
  const seen: unknown[] = [];
  db.collection('stories').doc('a').onSnapshot((s: { data(): unknown }) => seen.push(s.data()));
  await tick();
  tickFn();
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(seen, [{ v: 1 }, { v: 2 }]);
  assert.deepEqual(calls.map((c) => c.url), ['/api/db/bootstrap', '/api/db/changes?since=5', '/api/db/stories/a']);
});

test('se a abertura em lote falha, cada assinatura busca o seu', async () => {
  const { env } = fake({ 'GET /api/db/bootstrap': new Error('fora'), 'GET /api/db/stories/a': { exists: true, data: { v: 9 } } });
  const db = mk('tok', false, env);
  const seen: unknown[] = [];
  db.collection('stories').doc('a').onSnapshot((s: { data(): unknown }) => seen.push(s.data()));
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(seen, [{ v: 9 }]);
});

test('envia o token CSRF em toda requisição', async () => {
  const seenHeaders: Record<string, string>[] = [];
  const { env } = fake({ 'GET /api/db/bootstrap': boot([]) });
  const base = env.fetch;
  env.fetch = (url: string, init: RequestInit) => { seenHeaders.push(init.headers as Record<string, string>); return base(url, init); };
  mk('tok123', false, env).collection('stories').onSnapshot(() => {});
  await tick();
  assert.equal(seenHeaders[0]['X-CSRF-Token'], 'tok123');
});
