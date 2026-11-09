// Acesso aos dados no Postgres (Supabase), com a mesma forma "coleção/documento" que o front já usa.
// Usuários têm tabela própria (com constraints); as coleções do jornal ficam em `docs` (JSONB).
// shortcut: documentos em JSONB em vez de uma tabela por coleção (foge da 3ª forma normal); normalizar se alguma coleção virar relatório pesado.
import { fail } from './http';
import { sql, Tx } from './db';

export type User = { id: string; email: string; name: string; passwordHash: string; role: 'reader' | 'chefe'; createdAt: number };
type Doc = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Rule = {
  read: (user: User | null, id: string) => boolean;
  write: (user: User | null, id: string) => boolean;
  remove?: (user: User | null, id: string) => boolean; // padrão: a regra de escrita
  validate?: (user: User, id: string, data: Doc, previous?: Doc) => string | void;
};

export const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_DOC_BYTES: Record<string, number> = { profiles: 1_000_000, default: 300_000 };
const MAX_LIST = 500;

type UserRow = { id: string; email: string; name: string; password_hash: string; role: User['role']; created_at: Date };
const toUser = (row: UserRow): User => ({ id: row.id, email: row.email, name: row.name, passwordHash: row.password_hash, role: row.role, createdAt: row.created_at.getTime() });

export async function findUserById(id: string) {
  const [row] = await sql()<UserRow[]>`select id, email, name, password_hash, role, created_at from public.users where id = ${id}`;
  return row ? toUser(row) : null;
}
export async function findUserByEmail(email: string) {
  const [row] = await sql()<UserRow[]>`select id, email, name, password_hash, role, created_at from public.users where email = ${email}`;
  return row ? toUser(row) : null;
}
// Quem viola users_email_unique ou users_one_chefe recebe o erro do banco; o chamador traduz.
export const addUser = (user: User) => sql()`
  insert into public.users (id, email, name, password_hash, role, created_at)
  values (${user.id}, ${user.email}, ${user.name}, ${user.passwordHash}, ${user.role}, ${new Date(user.createdAt)})`;
export const setPasswordHash = (id: string, hash: string) => sql()`update public.users set password_hash = ${hash} where id = ${id}`;

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

export async function getDoc(collection: string, id: string): Promise<Doc | undefined> {
  const [row] = await sql()<{ data: Doc }[]>`select data from public.docs where collection = ${collection} and id = ${id}`;
  return row?.data;
}

export async function listDocs(collection: string, user: User | null) {
  const rule = RULES[collection];
  const rows = await sql()<{ id: string; data: Doc }[]>`select id, data from public.docs where collection = ${collection} order by updated_at desc limit ${MAX_LIST}`;
  return rows.filter((row) => rule.read(user, row.id)).map((row) => ({ id: row.id, data: row.data }));
}

// Leitura e gravação na mesma transação, com a linha travada: PATCH e regras de "só acrescenta" não perdem escrita simultânea.
export async function writeDoc(collection: string, id: string, data: unknown, user: User, merge = false) {
  const rule = RULES[collection];
  await sql().begin(async (tx: Tx) => {
    const [row] = await tx<{ data: Doc }[]>`select data from public.docs where collection = ${collection} and id = ${id} for update`;
    const previous = row?.data;
    const next = merge ? { ...previous, ...(data as Doc) } : (data as Doc);
    if (!next || typeof next !== 'object' || Array.isArray(next)) throw fail(422, 'VALIDACAO', 'Documento inválido.');
    const problem = rule.validate && rule.validate(user, id, next, previous);
    if (problem) throw fail(422, 'VALIDACAO', problem);
    if (Buffer.byteLength(JSON.stringify(next)) > (MAX_DOC_BYTES[collection] || MAX_DOC_BYTES.default)) throw fail(413, 'PAYLOAD_GRANDE', 'Conteúdo grande demais.');
    await tx`insert into public.docs (collection, id, data) values (${collection}, ${id}, ${tx.json(next)})
      on conflict (collection, id) do update set data = excluded.data, updated_at = now()`;
  });
}

export const deleteDoc = (collection: string, id: string) => sql()`delete from public.docs where collection = ${collection} and id = ${id}`;

// Substitui o SSE: o navegador pergunta "o que mudou depois do número N". Só devolve o que o usuário pode ler.
export async function changesSince(since: number | null, user: User | null) {
  const db = sql();
  if (Math.random() < 0.02) await db`delete from public.doc_changes where at < now() - interval '1 day'`;
  const [{ seq }] = await db<{ seq: string }[]>`select coalesce(max(seq), 0)::text as seq from public.doc_changes`;
  if (since === null || since > Number(seq)) return { seq: Number(seq), items: [] as { c: string; id: string }[] };
  const rows = await db<{ collection: string; id: string }[]>`select distinct collection, id from public.doc_changes where seq > ${since} limit 500`;
  const items = rows.filter((row) => RULES[row.collection]?.read(user, row.id)).map((row) => ({ c: row.collection, id: row.id }));
  return { seq: Number(seq), items };
}
