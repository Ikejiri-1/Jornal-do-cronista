# Contrato da API (Next.js, sem banco de dados por enquanto)

Rodar: `npm install`, `npm run build` e `npm start` (http://localhost:3000), ou `npm run dev`.
Para ter um editor: `EDITOR_EMAIL=seu@email npm start` e cadastre-se com esse e-mail.
Atrás de proxy HTTPS: `NODE_ENV=production` e `TRUST_PROXY=1` (sem isso o limite de tentativas por IP é global).
Dados: memória + snapshot em `data/store.json` (ignorado pelo git). Sessões e contadores somem ao reiniciar.

Estrutura: `app/api/**` (Route Handlers), `lib/` (auth, store, http), `app/login` (React), `public/legacy/index.html` (app do jornal, servido em `/` por rewrite em `next.config.mjs`, migra para React por partes), `public/surreal.css` + `public/dream.js` (tema).

Envelope: sucesso `{data}`; erro `{error:{code,message,field?}}`. Códigos: VALIDACAO, CREDENCIAIS_INVALIDAS, NAO_AUTENTICADO, NAO_ENCONTRADO, CONFLITO, CSRF, LIMITE_EXCEDIDO (com Retry-After), PAYLOAD_GRANDE, ERRO_INTERNO.

## Auth (`/api/auth`)
- `POST /register {name,email,password}` cria conta e entra. Senha de 15 a 128 caracteres (NIST: senha é o único fator).
- `POST /login {email,password}` argon2id; 5 erros em 15 min bloqueiam 15/30/60 min (reincidência), mesmo com a senha certa; resposta igual para e-mail inexistente.
- `POST /logout`, `GET /session` (renova os 30 min; devolve `{id,name,canEdit,csrfToken}` ou `null`).
- Cookie `sid`: HttpOnly, SameSite=Lax, Secure em produção; expira após 30 min parado, máximo 12 h.
- Escritas exigem `X-CSRF-Token` e Origin do mesmo site.

## Documentos (`/api/db/:colecao[/:id]`)
GET lista/lê (público, exceto waitlist/requests/reports), PUT grava, PATCH mescla, DELETE apaga, `GET /api/db/stream` (SSE de mudanças). Regras em `lib/store.ts` (RULES): dono do documento ou editor; recurso alheio devolve 404.
`stories`: autor comum nunca aprova a si mesmo; história nova ou alterada entra com `status:'analise'` e só o editor aprova.

## Desvios a confirmar com quem gerencia o projeto
- Sem verificação de e-mail, redefinição de senha, login com Google e 2FA: faltam serviço de e-mail e provedor. Sem verificação, o cadastro duplicado revela que o e-mail existe e quem registrar `EDITOR_EMAIL` primeiro vira editor.
- Contadores de tentativa e sessões em memória (a skill pede Redis).
- A vistoria de originalidade por IA não roda neste servidor: toda história espera aprovação do editor.
- O app do jornal ainda é HTML + JS legado dentro do Next; só o login é React.
