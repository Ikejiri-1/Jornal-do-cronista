-- Esquema do jornal (espelho da migração schema_inicial_jornal do Supabase), usado para subir um Postgres local de teste.
create table public.users (
  id text primary key,
  email text not null constraint users_email_unique unique check (char_length(email) <= 254),
  name text not null check (char_length(name) between 2 and 40),
  password_hash text not null,
  role text not null default 'reader' constraint users_role_check check (role in ('reader','chefe')),
  created_at timestamptz not null default now()
);
create unique index users_one_chefe on public.users (role) where role = 'chefe';
create table public.sessions (
  token_hash text primary key,
  user_id text not null references public.users(id) on delete cascade,
  csrf text not null,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index sessions_user_idx on public.sessions (user_id);
create index sessions_last_seen_idx on public.sessions (last_seen);
create table public.login_failures (
  email_hash text primary key,
  count integer not null default 0 constraint login_failures_count_check check (count >= 0),
  first_at timestamptz not null default now(),
  locked_until timestamptz,
  repeats integer not null default 0,
  repeats_at timestamptz not null default now()
);
create table public.rate_hits (
  id bigint generated always as identity primary key,
  key text not null,
  hit_at timestamptz not null default now()
);
create index rate_hits_key_idx on public.rate_hits (key, hit_at);
create table public.docs (
  collection text not null check (collection ~ '^[a-z]{1,32}$'),
  id text not null check (id ~ '^[A-Za-z0-9_-]{1,64}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 1048576),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
create table public.doc_changes (
  seq bigint generated always as identity primary key,
  collection text not null,
  id text not null,
  at timestamptz not null default now()
);
create index doc_changes_at_idx on public.doc_changes (at);
create function public.docs_mudanca() returns trigger language plpgsql as $$
begin
  insert into public.doc_changes (collection, id) values (coalesce(new.collection, old.collection), coalesce(new.id, old.id));
  return null;
end $$;
create trigger trg_docs_mudanca after insert or update or delete on public.docs for each row execute function public.docs_mudanca();
