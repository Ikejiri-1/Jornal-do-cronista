# Verificação do banco real (Supabase) antes de publicar

Objetivo: conferir que o banco real tem tudo o que o código assume. **Nada aqui foi rodado contra o banco real nesta etapa.** As consultas abaixo só leem metadados (nada de dados de usuários) e quem decide rodar é o dono: SQL Editor do Supabase, projeto `jornal-do-cronista`.

Comparei `db/schema.sql` (esquema usado nos testes) com `docs/modelo-de-dados.md` e com as consultas do código (`lib/auth.ts`, `lib/store.ts`). Os três concordam entre si, com uma ressalva: o `db/schema.sql` é a minha reconstrução; o banco real só foi conferido em tabelas, colunas e nomes de índices (leitura de metadados feita antes, durante a Etapa 1), e **não** em gatilho, privilégios, políticas de RLS, `ON DELETE` e configuração do papel.

## O que o código faz em cada tabela

| Tabela | Operações feitas pelo código (como `app_rw`) |
|---|---|
| `users` | SELECT por `id` e por `email`; INSERT; UPDATE de `password_hash` |
| `sessions` | INSERT; SELECT com JOIN em `users`; UPDATE de `last_seen`; DELETE |
| `login_failures` | SELECT; INSERT … ON CONFLICT DO UPDATE; DELETE |
| `rate_hits` | SELECT count; INSERT; DELETE (limpeza de linhas com mais de 1 dia) |
| `docs` | SELECT (inclusive `FOR UPDATE` e a consulta de abertura com `row_number()` e JOIN na chave primária); INSERT … ON CONFLICT DO UPDATE; DELETE |
| `doc_changes` | SELECT `max(seq)` e `distinct collection, id`; DELETE (limpeza). O INSERT vem do gatilho em `docs` |

## O que já bate (conferido antes, só metadados)

Tabelas e colunas das 6 tabelas, `users_email_unique`, `users_one_chefe` (índice parcial), chaves primárias, e estes índices: `doc_changes_at_idx`, `rate_hits_key_idx (key, hit_at)`, `sessions_last_seen_idx`, `sessions_user_idx`, `docs_pk (collection, id)`, `rate_hits_pk`. Diferenças só de nome ou de detalhe, sem efeito no código: o real chama a chave de `docs` de `docs_pk` e a de `rate_hits` de `rate_hits_pk`; o `db/schema.sql` local tem uma verificação extra de tamanho em `docs.data` (o app já limita o tamanho no servidor).

## O que falta conferir (rode e compare com o "esperado")

**1. Gatilho que alimenta `doc_changes`** (o front depende dele para ver gravações e remoções de outros usuários):
```sql
select t.tgname, pg_get_triggerdef(t.oid) as definicao, p.prosecdef as security_definer, p.prosrc
from pg_trigger t join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'public.docs'::regclass and not t.tgisinternal;
```
Esperado: um gatilho `trg_docs_mudanca`, `AFTER INSERT OR UPDATE OR DELETE … FOR EACH ROW`, que insere `(collection, id)` em `doc_changes`. **Precisa tratar DELETE** (usar `old` quando `new` é nulo): o front reage a remoções. Se a função não for `SECURITY DEFINER`, `app_rw` precisa de INSERT em `doc_changes` (e política de RLS que permita).

**2. Constraints**
```sql
select conrelid::regclass as tabela, conname, pg_get_constraintdef(oid) as definicao
from pg_constraint where connamespace = 'public'::regnamespace order by 1, 2;
```
Esperado, entre outras: `users_role_check` (`reader`/`chefe`); tamanhos de e-mail (≤ 254) e nome (2 a 40); `login_failures_count_check`; em `docs`, formato de `collection` (`^[a-z]{1,32}$`), de `id` (`^[A-Za-z0-9_-]{1,64}$`) e `data` ser objeto; `sessions_user_id_fkey` com **`ON DELETE CASCADE`** (o modelo de dados diz "apaga junto").

**3. Colunas de identidade**
```sql
select c.relname, a.attname, a.attidentity   -- 'a' = GENERATED ALWAYS
from pg_attribute a join pg_class c on c.oid = a.attrelid
where c.relnamespace = 'public'::regnamespace and a.attidentity <> '' and not a.attisdropped;
```
Esperado: `rate_hits.id` e `doc_changes.seq` com `a`.

**4. Privilégios de `app_rw`** (e de `anon` e `authenticated`, que devem ficar sem nenhum)
```sql
select grantee, table_name, string_agg(privilege_type, ', ' order by privilege_type) as privilegios
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('app_rw', 'anon', 'authenticated')
group by 1, 2 order by 2, 1;
```
Esperado para `app_rw`: `users` SELECT, INSERT, UPDATE; `sessions` SELECT, INSERT, UPDATE, DELETE; `login_failures` SELECT, INSERT, UPDATE, DELETE; `rate_hits` SELECT, INSERT, DELETE; `docs` SELECT, INSERT, UPDATE, DELETE; `doc_changes` SELECT, DELETE (mais INSERT se o gatilho não for `SECURITY DEFINER`). Para `anon` e `authenticated`: nenhuma linha.

**5. RLS e políticas**
```sql
select c.relname, c.relrowsecurity from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' order by 1;
select tablename, policyname, roles, cmd from pg_policies where schemaname = 'public' order by 1, 2;
```
Esperado: as 6 tabelas com `relrowsecurity = true`, e políticas só para `app_rw` cobrindo as operações da tabela acima. Atenção a `docs`: `SELECT … FOR UPDATE` exige também permissão de UPDATE, e o `ON CONFLICT DO UPDATE` exige política de UPDATE.

**6. Papel `app_rw`**
```sql
select rolname, rolconfig, rolconnlimit, rolsuper, rolbypassrls from pg_roles where rolname = 'app_rw';
```
Esperado: `statement_timeout=5s` em `rolconfig`, limite de 20 conexões, sem `rolsuper` e sem `rolbypassrls`.

**7. Índices (para confirmar nada mudou desde a leitura anterior)**
```sql
select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by 1, 2;
```

## Se algo divergir
- Falta de privilégio ou política: o sintoma é erro 500 em gravações (`ERRO_INTERNO` no log da função); corrigir o banco, não o código.
- Gatilho sem tratar DELETE: remoções feitas por outro usuário só aparecem no outro navegador ao recarregar a página.
- Nada no código exige índice novo. Quando uma coleção passar de alguns milhares de documentos, um índice `(collection, updated_at desc)` em `docs` ajuda a listagem; precisa de migração, e portanto do OK do dono.
