# Como rodar os testes

Tudo roda contra um **Postgres local** e um servidor local. Os scripts recusam rodar se `DATABASE_URL` não apontar para `127.0.0.1` ou `localhost` (eles apagam as tabelas). Nunca aponte para o Supabase real.

## 1. Banco local (Docker Desktop aberto)

```
docker run -d --name jornal-pg -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=jornal -p 54329:5432 postgres:17-alpine
docker exec -i jornal-pg psql -U postgres -d jornal -v ON_ERROR_STOP=1 < db/schema.sql
```
No Git Bash, prefixe com `MSYS_NO_PATHCONV=1`. Com vários agentes, use um nome de contêiner e uma porta por agente.
`db/schema.sql` espelha o banco real (mesmos índices e constraints), sem os dados.

## 2. Servidor (build de produção)

PowerShell, na mesma sessão:
```
$env:DATABASE_URL='postgresql://postgres:teste@127.0.0.1:54329/jornal'
$env:DATABASE_SSL='off'
$env:CHEFE_EMAIL='chefe@teste.com'
npx next build; npx next start -p 3100
```
Use `next start`, não `next dev`: no Windows o `dev` falha no WebSocket de recarga e a página não hidrata.
Ao reiniciar, encerre o processo antigo da porta (senão ele continua respondendo com a versão velha).

## 3. Testes

Com o servidor no ar (`DATABASE_URL` igual à do passo 2, `BASE_URL` com a porta do servidor):

| Comando | O que faz |
|---|---|
| `npm test` | 20 testes da API (`tests/api/api.test.mjs`): cadastro, login e bloqueio, sessão, CSRF, regras de cada coleção, `bootstrap`, `changes`, concorrência, limites, erros sem vazamento |
| `npm run test:perf` | mede cada operação (mediana e p95). `LABEL` e `N` ajustam o título e as repetições |
| `node tests/perf/latency-proxy.mjs 54335 54329 50` | proxy que atrasa o banco; aponte um segundo servidor para a porta 54335 e rode o perf com `BASE_URL` dele |
| `node tests/baseline/seed.mjs` | popula dados fixos (chefe, 2 autores, obras, histórias) |
| `npm run test:baseline` | captura `/` e compara com a linha de base do legado: texto idêntico e no máximo 0,5% de pixels diferentes, em desktop (1280) e celular (390). Precisa do seed antes |
| `node tests/e2e/fluxos.mjs` | 11 fluxos no navegador: criar conto, aprovar, curtir, avaliar, comentar, seguir, remover como chefe (com aviso ao autor), editar perfil. Precisa do seed antes. Falha se a máquina de escrever demorar mais de 2,5 s para fechar depois de enviar |
| `node tests/perf/bundle.mjs` | tamanho do JS comprimido que a home baixa |
| `node tests/baseline/capture.mjs <pasta> [prefixo]` | captura as telas (usada pelo `compare`); recusa rodar fora do seed |

A pasta `tests/baseline/legado/` é a **referência congelada** do site antigo (imagens e textos de 12 telas, em desktop e celular). O HTML antigo foi removido, então ela não pode mais ser regerada; para isso seria preciso o commit `553fa7d` (`public/legacy/index.html`). O novo espaçamento entre palavras (`word-spacing: .2em`, a pedido do dono) entrou na baseline porque foi aplicado também ao HTML antigo antes de ele sair, e a captura foi refeita. Se a aparência mudar de propósito de novo, regere as imagens a partir do site novo e registre o motivo no commit.

Os testes de unidade do front (xadrez, vistoria, camada de dados) vivem junto do código (`app/_jornal/**`): `node --test "app/_jornal/features/**/*.test.mjs" "app/_jornal/core/*.test.ts"`.

Requisitos: `npm install` (traz `playwright-core`, `pixelmatch`, `pngjs`) e o navegador Edge instalado (o Playwright usa o Edge do sistema, sem baixar navegador).

## O que os testes garantem (e como sei que pegam erro)

Cada regra de acesso tem pelo menos um teste que falha se ela for afrouxada. Verifiquei de propósito: troquei no servidor `likes` (escrita só do dono), `works` (só chefe) e `reports` (leitura só chefe) por "qualquer um", e 4 testes falharam; depois restaurei o arquivo e os 20 voltaram a passar.

## Armadilhas

- Cada leitor envia 1 conto por semana; para repetir envio use outro e-mail (ou rode o seed).
- O cookie de sessão é `Secure` em produção: o `curl` por HTTP não o reenvia sozinho; passe `-H "Cookie: sid=..."`.
- O Git Bash converte argumentos que começam com `/`; use `MSYS_NO_PATHCONV=1`.
- A linha de base esconde relógio, data, fundo animado e o código de leitor (vem do id aleatório do usuário) para não variar entre execuções.
