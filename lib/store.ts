// Armazenamento em memória com a mesma forma "coleção/documento" que o front já usa.
// Sem banco por enquanto: um snapshot JSON em data/store.json mantém os dados entre reinícios.
// shortcut: grava o arquivo inteiro a cada mudança; trocar por banco (PostgreSQL) quando houver uso real.
import fs from 'node:fs';
import path from 'node:path';
import { fail } from './http';

export type User = { id: string; email: string; name: string; passwordHash: string; role: 'reader' | 'chefe'; createdAt: number };
type Doc = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Listener = { user: User | null; send: (event: { c: string; id: string }) => void };
type Rule = {
  read: (user: User | null, id: string) => boolean;
  write: (user: User | null, id: string) => boolean;
  remove?: (user: User | null, id: string) => boolean; // padrão: a regra de escrita
  validate?: (user: User, id: string, data: Doc, previous?: Doc) => string | void;
};
type StoreState = { users: Map<string, User>; docs: Record<string, Record<string, Doc>>; listeners: Set<Listener>; saveTimer?: NodeJS.Timeout };

export const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const FILE = path.join(process.cwd(), 'data', 'store.json');
const MAX_DOC_BYTES: Record<string, number> = { profiles: 1_000_000, default: 300_000 };

const globalState = globalThis as unknown as { __store?: StoreState };
const state: StoreState = (globalState.__store ||= (() => {
  const initial: StoreState = { users: new Map(), docs: {}, listeners: new Set() };
  try {
    const saved = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    (saved.users || []).forEach((user: User) => initial.users.set(user.id, (user.role as string) === 'editor' ? { ...user, role: 'chefe' } : user)); // 'editor' era o nome antigo do papel
    Object.assign(initial.docs, saved.docs || {});
  } catch { /* primeira execução */ }
  return initial;
})());

export const listeners = state.listeners;

export function save() {
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const temporary = FILE + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify({ users: [...state.users.values()], docs: state.docs }));
    fs.renameSync(temporary, FILE);
  }, 300);
}

export const findUserById = (id: string) => state.users.get(id) || null;
export const findUserByEmail = (email: string) => { for (const user of state.users.values()) if (user.email === email) return user; return null; };
export const hasChefe = () => [...state.users.values()].some((user) => user.role === 'chefe');
export const addUser = (user: User) => { state.users.set(user.id, user); save(); };

// ---- regras de acesso (autorização sempre no servidor) ----
export const isChefe = (user: User | null) => !!user && user.role === 'chefe';
const isOwner = (user: User | null, id: string) => !!user && user.id === id;
const ownerOrChefe = (user: User | null, id: string) => isOwner(user, id) || isChefe(user);
const anyone = () => true;
const chefeOnly = (user: User | null) => isChefe(user);

// Autor comum só acrescenta: história publicada não é alterada nem removida por ele (só o chefe).
// História nova entra "em análise"; o autor nunca decide a própria aprovação.
// shortcut: a vistoria automática por IA não existe aqui, então a aprovação é do chefe.
function validateStories(user: User, _id: string, data: Doc, previous?: Doc) {
  if (!Array.isArray(data.items) || data.items.length > 20) return 'Limite de 20 histórias.';
  if (isChefe(user)) return;
  const kept: Doc[] = (previous && previous.items) || [];
  const known = new Set(kept.map((item: Doc) => item.id));
  const clip = (value: unknown, limit: number) => (typeof value === 'string' ? value.slice(0, limit) : '');
  const added = data.items.filter((item: Doc) => item && typeof item.id === 'string' && SAFE_ID.test(item.id) && !known.has(item.id)).map((item: Doc) => (
    { id: item.id, pen: clip(item.pen, 40), bio: clip(item.bio, 160), title: clip(item.title, 120), genre: clip(item.genre, 40) || 'Contos', text: clip(item.text, 6000), at: Date.now(), status: 'analise' }));
  data.items = [...kept, ...added];
  if (data.items.length > 20) return 'Limite de 20 histórias.';
  if (added.length && !(data.consent && data.consent.ok === true)) return 'É preciso concordar com a política de privacidade.';
  data.consent = data.consent && data.consent.ok === true ? { ok: true, at: Date.now(), v: String(data.consent.v || '').slice(0, 20) } : (previous && previous.consent) || null;
}

const RULES: Record<string, Rule> = {
  works: { read: anyone, write: chefeOnly },
  stories: { read: anyone, write: ownerOrChefe, remove: chefeOnly, validate: validateStories },
  // Aviso do chefe ao autor de uma história removida (id = id do autor). O autor só lê e dispensa.
  notices: { read: ownerOrChefe, write: chefeOnly, remove: ownerOrChefe },
  likes: { read: anyone, write: isOwner },
  ratings: { read: anyone, write: isOwner },
  follows: { read: anyone, write: isOwner },
  comments: { read: anyone, write: ownerOrChefe },
  profiles: { read: anyone, write: ownerOrChefe },
  subscriptions: { read: anyone, write: chefeOnly },
  reviews: { read: anyone, write: chefeOnly },
  meta: { read: anyone, write: chefeOnly },
  waitlist: { read: ownerOrChefe, write: ownerOrChefe },
  requests: { read: ownerOrChefe, write: ownerOrChefe },
  reports: {
    read: chefeOnly,
    write: (user) => !!user,
    validate: (user, _id, data, previous) => {
      if (previous && !isChefe(user)) return 'Denúncia já registrada.';
      if (data.by !== user.id) return 'Denúncia inválida.';
    },
  },
};

export const ruleFor = (collection: string) => (Object.prototype.hasOwnProperty.call(RULES, collection) ? RULES[collection] : null);
export const getDoc = (collection: string, id: string) => state.docs[collection]?.[id];

export function listDocs(collection: string, user: User | null) {
  const rule = RULES[collection], all = state.docs[collection] || {};
  return Object.keys(all).filter((id) => rule.read(user, id)).map((id) => ({ id, data: all[id] }));
}

function notify(collection: string, id: string) {
  for (const listener of state.listeners) if (RULES[collection].read(listener.user, id)) listener.send({ c: collection, id });
}

export function writeDoc(collection: string, id: string, data: unknown, user: User, merge = false) {
  const previous = getDoc(collection, id), rule = RULES[collection];
  const next = merge ? { ...previous, ...(data as Doc) } : (data as Doc);
  if (!next || typeof next !== 'object' || Array.isArray(next)) throw fail(422, 'VALIDACAO', 'Documento inválido.');
  const problem = rule.validate && rule.validate(user, id, next, previous);
  if (problem) throw fail(422, 'VALIDACAO', problem);
  if (Buffer.byteLength(JSON.stringify(next)) > (MAX_DOC_BYTES[collection] || MAX_DOC_BYTES.default)) throw fail(413, 'PAYLOAD_GRANDE', 'Conteúdo grande demais.');
  (state.docs[collection] ||= {})[id] = next;
  save();
  notify(collection, id);
}

export function deleteDoc(collection: string, id: string) {
  if (state.docs[collection] && id in state.docs[collection]) { delete state.docs[collection][id]; save(); notify(collection, id); }
}
