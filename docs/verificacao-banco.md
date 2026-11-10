# Verificação do banco real (Supabase) antes de publicar

Objetivo: conferir que o banco real tem tudo o que o código assume. As consultas abaixo só leem metadados (nada de dados de usuários). **Foram rodadas contra o banco real em 2026-11-09, com a autorização do dono; o resultado está logo abaixo.** Para repetir: SQL Editor do Supabase, projeto `jornal-do-cronista`.

Comparei `db/schema.sql` (esquema usado nos testes) com `docs/modelo-de-dados.md` e com as consultas do código (`lib/auth.ts`, `lib/store.ts`). Os três concordam entre si, com uma ressalva: o `db/schema.sql` é a minha reconstrução do banco real, e a conferência contra o banco real está no resultado abaixo.

## Resultado da verificação no banco real (2026-11-09)

**Conclusão: o banco real tem tudo o que o código assume. Nada impede publicar.** Só leitura de metadados; nenhuma linha de usuário foi lida e nada foi alterado.

| Item | Resultado |
|---|---|
| Gatilho de `doc_changes` | **Confere.** `trg_docs_mudanca`, `AFTER INSERT OR DELETE OR UPDATE ON docs FOR EACH ROW`, função `fn_registrar_mudanca()`. Trata DELETE (grava `old.collection` e `old.id`), então remoções de outro usuário chegam ao front. Não é `SECURITY DEFINER`, o que é ok porque `app_rw` tem INSERT em `doc_changes` e política que o permite. |
| Constraints | **Conferem.** `users_email_len_check` (≤ 254), `users_email_unique`, `users_name_len_check` (2 a 40), `users_role_check` (`reader`/`chefe`), `login_failures_count_check` (`count >= 0` e `repeats >= 0`), `docs_collection_check`, `docs_id_check`, `docs_data_object_check`, `docs_data_size_check`; `sessions_user_id_fkey` com **`ON DELETE CASCADE`**. |
| Colunas de identidade | **Conferem.** `doc_changes.seq` e `rate_hits.id` são `GENERATED ALWAYS`. |
| Privilégios de `app_rw` | **Cobrem tudo que o código faz.** `doc_changes`: DELETE, INSERT, SELECT; `docs`, `login_failures`, `sessions`: DELETE, INSERT, SELECT, UPDATE; `rate_hits` e `users`: DELETE, INSERT, SELECT, UPDATE. `anon` e `authenticated`: nenhum privilégio. |
| RLS e políticas | **Conferem.** As 6 tabelas têm RLS ligada. Cada uma tem uma única política (`pol_<tabela>_backend`), só para `app_rw`, comando `ALL`. Nenhuma política para `anon` ou `authenticated`. |
| Papel `app_rw` | **Confere.** `statement_timeout=5s`, limite de 20 conexões, sem `rolsuper` e sem `rolbypassrls`. |
| Índices | **Conferem**, os 12 esperados e nenhum a mais: `doc_changes_pkey`, `doc_changes_at_idx`, `docs_pk`, `login_failures_pkey`, `rate_hits_pk`, `rate_hits_key_idx (key, hit_at)`, `sessions_pkey`, `sessions_user_idx`, `sessions_last_seen_idx`, `users_pkey`, `users_email_unique`, `users_one_chefe`. |

Observações, nenhuma bloqueia:
1. **Privilégios maiores que o necessário.** `app_rw` pode apagar linhas de `users` e atualizar `rate_hits`, e o código não faz nenhuma das duas coisas. Retirar `DELETE` em `users` e `UPDATE` em `rate_hits` seria um endurecimento opcional; exige migração no banco real e portanto o OK do dono. **Não foi feito.**
2. **Limite de tamanho de `docs`.** O banco real usa `pg_column_size(data) <= 1000000`; o `db/schema.sql` de teste usa 1048576. O app já limita o tamanho antes de gravar (documentos comuns 300 KB; `profiles` 1 MB), então o caso extremo é só um perfil com foto muito grande.
3. **`db/schema.sql` tem diferenças de nome e de detalhe em relação ao banco real,** sem efeito nos testes: a função do gatilho é `docs_mudanca` (no real, `fn_registrar_mudanca`); o limite de tamanho acima; `login_failures_count_check` só confere `count` (no real, também `repeats`); e nomes de algumas constraints (`users_email_len_check`, `users_name_len_check`, `docs_collection_check`, `docs_id_check`, `docs_data_object_check`, `docs_data_size_check`). Não alinhei o arquivo.

O restante deste documento são as consultas usadas, para repetir a verificação quando o banco mudar.

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

## As consultas (para repetir a verificação; compare com o "esperado")

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
