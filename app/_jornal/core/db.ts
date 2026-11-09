// Camada de dados do jornal: mesma interface coleção/documento do Firestore antigo, agora pela API própria.
// Cache em memória alimentado por UMA requisição na abertura (/api/db/bootstrap) e mantido por consulta de "o que mudou".
// Gravar atualiza a tela na hora (otimista) e desfaz se o servidor recusar.

export type Doc = Record<string, unknown>;
export type DocSnap = { id: string; exists: boolean; data(): Doc | undefined };
export type ColSnap = { docs: DocSnap[] };
export type Snapshot = DocSnap | ColSnap;
export type DbError = Error & { code?: string; status?: number };

type Listener = (s: Snapshot) => void;
type Sub = { c: string; id: string | undefined; cb: Listener; fail?: (e: unknown) => void };
type Cache = Record<string, Map<string, Doc>>;
type ApiDoc = { id: string; data: Doc };
export type Env = {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  setInterval: (fn: () => void, ms: number) => unknown;
  isHidden: () => boolean;
  onVisible: (fn: () => void) => void;
};

const browserEnv = (): Env => ({
  fetch: (url, init) => fetch(url, init),
  setInterval: (fn, ms) => setInterval(fn, ms),
  isHidden: () => document.hidden,
  onVisible: (fn) => document.addEventListener('visibilitychange', fn),
});

export function makeRemoteDB(csrfToken: string | undefined, isChief: boolean, env: Env = browserEnv()) {
  let subs: Sub[] = [];
  let cache: Cache | null = null;
  let boot: Promise<boolean> | null = null;
  let seq: number | null = null;
  let polling = false;

  async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    const r = await env.fetch(url, {
      method, credentials: 'same-origin', headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e: DbError = new Error(j.error?.message || 'Erro');
      e.code = j.error?.code; e.status = r.status;
      throw e;
    }
    return j.data as T;
  }
  const path = (c: string, id?: string) => '/api/db/' + encodeURIComponent(c) + (id === undefined ? '' : '/' + encodeURIComponent(id));
  const docSnap = (id: string, r: { exists?: boolean; data?: Doc } | null | undefined): DocSnap =>
    ({ id, exists: !!(r && r.exists), data: () => (r && r.exists ? r.data : undefined) });

  function snapOf(sub: Sub): Snapshot | null {
    const m = cache && cache[sub.c]; if (!m) return null;
    if (sub.id === undefined) return { docs: Array.from(m, ([id, d]) => ({ id, exists: true, data: () => d })) };
    return m.has(sub.id) ? docSnap(sub.id, { exists: true, data: m.get(sub.id) }) : docSnap(sub.id, { exists: false });
  }
  function emit(c: string, id?: string) {
    subs.slice().forEach((sub) => {
      if (sub.c === c && (id === undefined || sub.id === undefined || sub.id === id)) { const s = snapOf(sub); if (s) sub.cb(s); }
    });
  }
  // mais recente primeiro, como o servidor lista
  function put(c: string, id: string, v: Doc) {
    const m = new Map<string, Doc>([[id, v]]);
    (cache![c] || new Map<string, Doc>()).forEach((x, k) => { if (k !== id) m.set(k, x); });
    cache![c] = m;
  }
  function drop(c: string, id: string) { if (cache![c]) { const m = new Map(cache![c]); m.delete(id); cache![c] = m; } }
  async function pull(c: string, id: string) {
    const r = await api<{ exists?: boolean; data: Doc } | null>('GET', path(c, id));
    if (!cache) return;
    if (r && r.exists) put(c, id, r.data); else drop(c, id);
    emit(c, id);
  }
  // caminho de reserva: se a abertura em lote falhar, cada assinatura busca o seu
  function refetch(sub: Sub) {
    const p = sub.id === undefined
      ? api<ApiDoc[]>('GET', path(sub.c)).then((list) => sub.cb({ docs: list.map((d) => ({ id: d.id, exists: true, data: () => d.data })) }))
      : api<{ exists?: boolean; data?: Doc }>('GET', path(sub.c, sub.id)).then((r) => sub.cb(docSnap(sub.id as string, r)));
    p.catch((e) => { if (sub.fail) sub.fail(e); });
  }
  function load(): Promise<boolean> {
    return boot || (boot = api<{ collections: Record<string, ApiDoc[]>; seq: number }>('GET', '/api/db/bootstrap').then((r) => {
      const c: Cache = {};
      Object.keys(r.collections).forEach((k) => { c[k] = new Map(r.collections[k].map((d) => [d.id, d.data] as [string, Doc])); });
      cache = c; seq = r.seq; return true;
    }).catch(() => false));
  }
  function tick() {
    if (env.isHidden() || !cache) return;
    api<{ seq: number; items: { c: string; id: string }[] }>('GET', '/api/db/changes?since=' + seq)
      .then((r) => { seq = r.seq; r.items.forEach((m) => { pull(m.c, m.id).catch(() => {}); }); })
      .catch(() => {});
  }
  function open() { if (polling) return; polling = true; env.setInterval(tick, 15000); env.onVisible(tick); }
  function listen(c: string, id: string | undefined, cb: Listener, fail?: (e: unknown) => void) {
    const sub: Sub = { c, id, cb, fail }; subs.push(sub); open();
    load().then((ok) => {
      if (subs.indexOf(sub) < 0) return;
      const s = ok && cache![c] ? snapOf(sub) : null;
      if (s) cb(s); else refetch(sub);
    });
    return () => { subs = subs.filter((x) => x !== sub); };
  }
  // shortcut: nas histórias o servidor reescreve o documento (status, data, consentimento), então ali a tela usa a resposta dele em vez do palpite local
  async function write(c: string, id: string, method: string, v: Doc, guess: (old: Doc | undefined) => Doc) {
    if (!cache) return api(method, path(c, id), { data: v });
    const old = cache[c] && cache[c].get(id);
    const optimistic = c !== 'stories' || !!isChief; // a gravação do chefe nas histórias não é reescrita pelo servidor
    if (optimistic) { put(c, id, guess(old)); emit(c, id); }
    try {
      const saved = await api<Doc | null>(method, path(c, id), { data: v });
      if (saved && typeof saved === 'object') { put(c, id, saved); emit(c, id); }
    } catch (e) {
      if (optimistic) { if (old === undefined) drop(c, id); else put(c, id, old); emit(c, id); }
      throw e;
    }
  }
  function docRef(c: string, id: string) {
    return {
      get: () => api<{ exists?: boolean; data?: Doc }>('GET', path(c, id)).then((r) => docSnap(id, r)),
      set: (v: Doc) => write(c, id, 'PUT', v, () => v),
      update: (v: Doc) => write(c, id, 'PATCH', v, (old) => Object.assign({}, old, v)),
      async delete() {
        if (!cache) return api('DELETE', path(c, id));
        const old = cache[c] && cache[c].get(id); drop(c, id); emit(c, id);
        try { return await api('DELETE', path(c, id)); } catch (e) { if (old !== undefined) { put(c, id, old); emit(c, id); } throw e; }
      },
      onSnapshot: (cb: Listener, fail?: (e: unknown) => void) => listen(c, id, cb, fail),
    };
  }
  return {
    collection: (c: string) => ({
      doc: (id: string) => docRef(c, id),
      onSnapshot: (cb: Listener, fail?: (e: unknown) => void) => listen(c, undefined, cb, fail),
    }),
    doc(p: string) { const i = p.indexOf('/'); return docRef(p.slice(0, i), p.slice(i + 1)); },
  };
}
