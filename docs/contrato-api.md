# Contrato da API (Next.js + Postgres no Supabase)

Rodar: `npm install`, `npm run build` e `npm start` (http://localhost:3000), ou `npm run dev`.
Para ter o chefe (Raul, único): `CHEFE_EMAIL=seu@email npm start` e cadastre-se com esse e-mail.
Atrás de proxy HTTPS: `NODE_ENV=production` e `TRUST_PROXY=1` (sem isso o limite de tentativas por IP é global).
Dados: Postgres (Supabase), acessado só pelo servidor como o papel `app_rw` (`DATABASE_URL`, pooler porta 6543). Usuários, sessões e limites de tentativa têm tabelas próprias; as coleções do jornal ficam em `docs` (JSONB). Migração: `schema_inicial_jornal` (ver `docs/modelo-de-dados.md`).

Estrutura: `app/api/**` (Route Handlers), `lib/` (auth, store, http), `app/login` (React), `public/legacy/index.html` (app do jornal, servido em `/` por rewrite em `next.config.mjs`, migra para React por partes), `public/surreal.css` + `public/dream.js` (tema).

Envelope: sucesso `{data}`; erro `{error:{code,message,field?}}`. Códigos: VALIDACAO, CREDENCIAIS_INVALIDAS, NAO_AUTENTICADO, NAO_ENCONTRADO, CONFLITO, CSRF, LIMITE_EXCEDIDO (com Retry-After), PAYLOAD_GRANDE, ERRO_INTERNO.

## Auth (`/api/auth`)
- `POST /register {name,email,password}` cria conta e entra. Senha de 15 a 128 caracteres (NIST: senha é o único fator).
- `POST /login {email,password}` argon2id; 5 erros em 15 min bloqueiam 15/30/60 min (reincidência), mesmo com a senha certa; resposta igual para e-mail inexistente.
- `POST /logout`, `GET /session` (renova os 30 min; devolve `{id,name,canEdit,csrfToken}` ou `null`).
- Cookie `sid`: HttpOnly, SameSite=Lax, Secure em produção; expira após 30 min parado, máximo 12 h.
- Escritas exigem `X-CSRF-Token` e Origin do mesmo site.

## Documentos (`/api/db/:colecao[/:id]`)
GET lista/lê (público, exceto waitlist/requests/reports), PUT grava, PATCH mescla, DELETE apaga, `GET /api/db/changes?since=N` (o que mudou depois do número N, só o que o usuário pode ler; o navegador consulta a cada 15 s no lugar do SSE). Regras em `lib/store.ts` (RULES): dono do documento ou editor; recurso alheio devolve 404.
`stories`: autor comum só acrescenta (não altera nem remove); história nova entra com `status:'analise'` e só o chefe aprova, altera ou remove. `notices/:idDoAutor`: aviso do chefe sobre história removida; só o chefe grava, o autor lê e dispensa.

## Desvios a confirmar com quem gerencia o projeto
- Sem verificação de e-mail, redefinição de senha, login com Google e 2FA: faltam serviço de e-mail e provedor. Sem verificação, o cadastro duplicado revela que o e-mail existe e quem registrar `CHEFE_EMAIL` primeiro vira chefe.
- Documentos do jornal em JSONB (`docs`) em vez de uma tabela por coleção: foge da D3 (3ª forma normal) porque o HTML legado depende do formato coleção/documento. Autorizado por quem gerencia o projeto; normalizar quando uma coleção virar relatório pesado.
- Autorização no código do servidor (`lib/store.ts`), não em RLS por usuário: o navegador nunca fala com o banco. As tabelas têm RLS ligada, sem política para `anon`/`authenticated` (a API pública do Supabase nega tudo); só `app_rw` tem política. Autorizado por quem gerencia o projeto.
- Tempo real por consulta a cada 15 s (a Vercel não mantém SSE).
- Plano gratuito do Supabase: sem PITR e com pausa após 1 semana sem uso; faça cópias periódicas (D4).
- A vistoria de originalidade por IA não roda neste servidor: toda história espera aprovação do editor.
- O app do jornal ainda é HTML + JS legado dentro do Next; só o login é React.
