# Modelo de dados (Postgres, Supabase)

Migração `schema_inicial_jornal`. A aplicação conecta como `app_rw` (sem superusuário, sem DDL, `statement_timeout` 5 s, 20 conexões). `anon` e `authenticated` não têm privilégio nenhum nas tabelas, e todas têm RLS ligada.

| Tabela | Para quê | Constraints |
|---|---|---|
| `users` | contas | PK `id`; `users_email_unique`; `users_role_check` (reader/chefe); `users_one_chefe` (índice único parcial: no máximo um chefe); tamanhos de e-mail e nome |
| `sessions` | sessões (guarda só o hash do cookie) | PK `token_hash`; FK `user_id` → `users` (apaga junto); índices em `user_id` e `last_seen` |
| `login_failures` | bloqueio por tentativas erradas (por hash do e-mail) | PK `email_hash`; `login_failures_count_check` |
| `rate_hits` | limite de requisições por IP e rota | índice `(key, hit_at)`; linhas com mais de 1 dia são apagadas pelo app |
| `docs` | coleções do jornal (`stories`, `works`, `notices`, ...) em JSONB | PK `(collection, id)`; formato de coleção e id; `data` objeto; limite de 1 MB |
| `doc_changes` | fila "o que mudou" (substitui o SSE) | PK `seq`; preenchida pelo gatilho `trg_docs_mudanca`; linhas com mais de 1 dia são apagadas pelo app |

Quem pode ler ou gravar cada coleção está em `RULES` no `lib/store.ts`.
