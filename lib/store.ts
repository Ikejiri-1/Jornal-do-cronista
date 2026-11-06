// Armazenamento em memória com a mesma forma "coleção/documento" que o front já usa.
// Sem banco por enquanto: um snapshot JSON em data/store.json mantém os dados entre reinícios.
// shortcut: grava o arquivo inteiro a cada mudança; trocar por banco (PostgreSQL) quando houver uso real.
import fs from 'node:fs';
import path from 'node:path';
import { fail } from './http';

export type User = { id: string; email: string; name: string; passwordHash: string; role: 'reader' | 'editor'; createdAt: number };
type Doc = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Listener = { user: User | null; send: (event: { c: string; id: string }) => void };
type Rule = {
  read: (user: User | null, id: string) => boolean;
  write: (user: User | null, id: string) => boolean;
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
    (saved.users || []).forEach((user: User) => initial.users.set(user.id, user));
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
export const addUser = (user: User) => { state.users.set(user.id, user); save(); };

// ---- regras de acesso (autorização sempre no servidor) ----
export const isEditor = (user: User | null) => !!user && user.role === 'editor';
const isOwner = (user: User | null, id: string) => !!user && user.id === id;
const ownerOrEditor = (user: User | null, id: string) => isOwner(user, id) || isEditor(user);
const anyone = () => true;
const editorOnly = (user: User | null) => isEditor(user);

// Autor comum nunca decide a própria aprovação: história nova ou alterada entra "em análise".
// shortcut: a vistoria automática por IA não existe aqui, então a aprovação é do editor.
function validateStories(user: User, _id: string, data: Doc, previous?: Doc) {
  if (!Array.isArray(data.items) || data.items.length > 20) return 'Limite de 20 histórias.';
  if (isEditor(user)) return;
  const before = new Map<string, Doc>(((previous && previous.items) || []).map((item: Doc) => [item.id, item]));
  const clip = (value: unknown, limit: number) => (typeof value === 'string' ? value.slice(0, limit) : '');
  data.items = data.items.map((item: Doc) => {
    if (!item || typeof item.id !== 'string' || !SAFE_ID.test(item.id)) return null;
    const old = before.get(item.id);
    if (old && old.text === item.text && old.title === item.title) return old;
    return { id: item.id, pen: clip(item.pen, 40), bio: clip(item.bio, 160), title: clip(item.title, 120), genre: clip(item.genre, 40) || 'Contos', text: clip(item.text, 6000), at: Date.now(), status: 'analise' };
  }).filter(Boolean);
  if (data.items.length > before.size && !(data.consent && data.consent.ok === true)) return 'É preciso concordar com a política de privacidade.';
  data.consent = data.consent && data.consent.ok === true ? { ok: true, at: Date.now(), v: String(data.consent.v || '').slice(0, 20) } : (previous && previous.consent) || null;
}

const RULES: Record<string, Rule> = {
  works: { read: anyone, write: editorOnly },
  stories: { read: anyone, write: ownerOrEditor, validate: validateStories },
  likes: { read: anyone, write: isOwner },
  ratings: { read: anyone, write: isOwner },
  follows: { read: anyone, write: isOwner },
  comments: { read: anyone, write: ownerOrEditor },
  profiles: { read: anyone, write: ownerOrEditor },
  subscriptions: { read: anyone, write: editorOnly },
  reviews: { read: anyone, write: editorOnly },
  meta: { read: anyone, write: editorOnly },
  waitlist: { read: ownerOrEditor, write: ownerOrEditor },
  requests: { read: ownerOrEditor, write: ownerOrEditor },
  reports: {
    read: editorOnly,
    write: (user) => !!user,
    validate: (user, _id, data, previous) => {
      if (previous && !isEditor(user)) return 'Denúncia já registrada.';
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
