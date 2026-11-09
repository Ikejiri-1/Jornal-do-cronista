# Migração do Jornal do Cronista para Next.js: plano para 3 agentes em paralelo

**Objetivo (do dono do projeto):** o site inteiro em Next.js, funcionando exatamente como hoje, só que mais rápido. Hoje criar e remover contos demora. Só se entrega quando estiver completo e sem erros.

**Como ler este arquivo:** cada agente cumpre a sua etapa (1, 2 ou 3), mexe só nos arquivos que são dele e segue as regras gerais. A seção "Estado atual" diz o que já foi feito.

---

## 0. Regras gerais (valem para os 3 agentes)

1. **Um worktree e uma branch por agente**, partindo do mesmo commit base:
   `git worktree add ../jornal-agente-N -b agente-N` (N = 1, 2 ou 3). Nunca trabalhe direto na `main`.
2. **Só edite os arquivos da sua etapa** (lista em cada etapa). Se precisar de algo fora, escreva em `docs/pendencias-agente-N.md` o que precisa e quem deve fazer.
3. Em `app/_jornal/engine.js`, que ainda é um arquivo só, cada agente mexe apenas nas seções (comentários `/* ---------- ... ---------- */`) citadas na sua etapa. Isso evita conflito de merge.
4. **Nunca use o banco real (Supabase) para testar.** O `.env` aponta para ele. Não leia, não imprima e não copie o `.env`. Teste sempre no Postgres local (seção 2).
5. **Teste com build de produção** (`next build` + `next start`). O `next dev` no Windows falha no WebSocket de recarga e a página não hidrata nele.
6. **Comportamento idêntico ao de hoje.** A referência é `public/legacy/index.html`, que continua no repositório até a etapa final. Compare tela a tela (captura + DOM) antes de apagar qualquer coisa.
7. Não commitar segredos, `.env`, `*.log`, `.playwright-mcp/`, `.next*`. Commits pequenos, em português, com o motivo.
8. Ao terminar, rode a lista de "Pronto quando" da sua etapa e escreva o resultado em `docs/relatorio-agente-N.md` (o que passou, o que falhou, o que ficou de fora).

## 1. Estado atual (já feito e ainda sem commit na `main`)

Feito:
- **Causas da lentidão achadas:** (a) a tela abria com ~14 requisições e, depois de gravar, esperava até 15 s para atualizar; (b) a sessão fazia 2 consultas em sequência; (c) sem `vercel.json`, a função rodava longe do banco (Supabase em `sa-east-1`); (d) remover conto fazia 4 chamadas em fila.
- `lib/auth.ts`: `readSession` virou 1 consulta (join sessão + usuário).
- `lib/store.ts`: nova `bootstrap(user)` (todas as coleções legíveis + número da última mudança em 1 ida ao banco); `writeDoc` devolve o documento gravado.
- `app/api/db/bootstrap/route.ts` (novo); PUT/PATCH em `app/api/db/[collection]/[id]/route.ts` devolvem o documento salvo.
- `vercel.json` com `regions: ["gru1"]`. `lib/db.ts` aceita `DATABASE_SSL=off` (só para o Postgres local).
- `db/schema.sql`: esquema para o Postgres local de teste.
- **Front dentro do Next:** a página legada foi extraída para `app/_jornal/` (`jornal.css`, `body.ts` com a marcação, `engine.js` com toda a lógica, `Jornal.tsx` que a carrega) e servida por `app/page.tsx`. O rewrite de `/` para o HTML antigo foi removido. A textura de 388 KB saiu do CSS para `public/jornal/papel.webp`.
- `engine.js`: `makeRemoteDB` reescrito com cache em memória, abertura por `/api/db/bootstrap`, consulta de mudanças só dos documentos alterados, gravação otimista com desfazer, e `delStory` com leituras e gravações em paralelo.
- Teclados novos na máquina de escrever (máquina, escritório, mecânico, membrana) e barra de fundo escondida na tela de escrever.

Conferido no navegador (build de produção, banco local): home abre com 2 requisições (`session` + `bootstrap`); login pela tela; máquina de escrever abre; envio de conto funciona.

**Ainda não conferido:** remoção de conto pelo chefe na tela, comparação visual completa com o legado, mobile/iOS, xadrez, perfil/foto, assinatura, votação, painel do chefe. Nada disso está provado pelo que foi feito até aqui.

## 2. Ambiente de teste (todos os agentes)

Postgres local (Docker Desktop precisa estar aberto):
```
docker run -d --name jornal-pg-N -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=jornal -p 5433N:5432 postgres:17-alpine
MSYS_NO_PATHCONV=1 docker exec -i jornal-pg-N psql -U postgres -d jornal -v ON_ERROR_STOP=1 < db/schema.sql
```
Use uma porta e um nome de contêiner diferentes por agente (N = 1, 2, 3) e uma porta do Next diferente (3101, 3102, 3103).

Variáveis (PowerShell), definidas na mesma sessão que roda o Next:
```
$env:DATABASE_URL='postgresql://postgres:teste@127.0.0.1:5433N/jornal'
$env:DATABASE_SSL='off'
$env:CHEFE_EMAIL='chefe@teste.com'
npx next build; npx next start -p 310N
```
Contas de teste: cadastre pela tela `/login`. Quem se cadastra com `chefe@teste.com` vira o chefe. Senha precisa de 15+ caracteres.

Armadilhas já encontradas:
- Cada leitor envia **1 conto por semana**: para repetir o teste de envio, use outro e-mail ou apague a linha em `docs`.
- Git Bash converte caminhos que começam com `/`: use `MSYS_NO_PATHCONV=1`.
- Ao reiniciar o Next, mate o processo antigo pela porta (`Get-NetTCPConnection -LocalPort ... | Stop-Process`), senão ele continua respondendo com a versão velha.
- A introdução animada aparece uma vez por sessão (`sessionStorage 'gazeta-intro'`). Para pular: botão "Pular introdução".
- O botão "Enviar minha história ao editor" fica na aba **Capa do Jornal**.

---

## ETAPA 1: Servidor, dados, desempenho e rede de segurança de testes (Agente 1)

**Dono dos arquivos:** `lib/**`, `app/api/**`, `db/**`, `vercel.json`, `next.config.mjs`, `docs/**`, `package.json`, pasta nova `tests/**`.

Tarefas:
1. **Testes automatizados da API** (`tests/api/`), rodando contra o Postgres local: cadastro, login, bloqueio por tentativas, sessão, CSRF, regras de cada coleção (`RULES` em `lib/store.ts`: leitor não grava o que é do chefe, autor não remove conto publicado, `reports` só chefe lê, etc.), `bootstrap` respeita as regras de leitura (anônimo não vê `waitlist`/`requests`/`reports`; leitor só vê o próprio `notices`), `changes`. Usar o executor de testes do Node (`node --test`), sem dependência nova.
2. **Medir antes/depois** com um script (`tests/perf/`): latência de `session`, `bootstrap`, `PUT stories`, `DELETE`, com e sem latência artificial de rede (ex.: 100 ms por consulta, simulando Vercel longe do banco). Registrar os números em `docs/desempenho.md`.
3. **Reduzir consultas por requisição** onde ainda houver ida extra ao banco: `guardWrite` + regra + `writeDoc` (hoje a transação faz BEGIN, SELECT FOR UPDATE, INSERT, COMMIT; avaliar se `INSERT ... ON CONFLICT` com checagem na própria consulta basta para coleções sem `validate`). Não abrir mão de: lock contra escrita simultânea nas coleções com regra "só acrescenta", CSRF, autorização no servidor.
4. **Índices e limites:** revisar `docs` e `doc_changes` (`explain analyze` com 5 mil documentos), limpeza de `doc_changes` e `rate_hits`, `statement_timeout`.
5. **Rede de segurança do front:** gerar a **linha de base do legado** em `tests/baseline/`: para cada tela do `public/legacy/index.html` (Capa, Leituras, Enviados da semana, Autor, Assinatura, Perfil, máquina de escrever, painel do chefe, login), uma captura e um dump do DOM visível, com viewport desktop (1280x800) e celular (390x844). Usar Playwright (MCP ou `npx playwright`), com dados de teste fixos (script que popula o banco local). As Etapas 2 e 3 comparam com isto.
6. **Atualizar os documentos:** `docs/contrato-api.md` (novo `GET /api/db/bootstrap`, PUT/PATCH devolvem o documento salvo), `docs/modelo-de-dados.md`, `.env.example` (`DATABASE_SSL`).
7. **Etapa final, só depois de 2 e 3 estarem mescladas e aprovadas:** apagar `public/legacy/`, rodar a suíte inteira e o build, conferir `git status` limpo.

Pronto quando:
- `node --test tests/` passa inteiro; `npx tsc --noEmit` e `npx next build` sem erro.
- `docs/desempenho.md` mostra `bootstrap` e escrita abaixo de 150 ms localmente e abaixo de 500 ms com 100 ms de latência por consulta.
- Linha de base do legado completa (todas as telas, 2 viewports).
- Nenhuma regra de acesso afrouxada (cada regra tem teste que falha se for removida).

---

## ETAPA 2: Telas principais, estado e camada de dados do front (Agente 2)

**Dono dos arquivos:** `app/_jornal/**` **exceto** `features/**` (Etapa 3), `app/page.tsx`, `app/layout.tsx`, `app/login/**`, `app/chefe/**`, `public/jornal/**`, `public/surreal.css`.

Seções do `engine.js` que são suas: segurança/limpeza de dados, dados, pedaços de HTML, camadas do autor/leituras/capa, mesa do redator, render geral, ações, assinatura, perfil dos autores, extras de leitura, semana (envios/votação/capa), páginas da edição (avaliação, comentários, autores), jornal imersivo, introdução, `makeRemoteDB`/`makeLocalDB`, boot.

Tarefas:
1. **Passo 0 (primeiro, rápido, sem mudar comportamento):** dividir `engine.js` em módulos ES por seção em `app/_jornal/core/` e `app/_jornal/views/`, com o `state` e o `render()` exportados de um módulo só. Commitar e avisar os outros agentes (as seções da Etapa 3 ficam em `engine.js` até o Agente 3 movê-las).
2. **Camada de dados tipada** em `app/_jornal/core/db.ts`: mover `makeRemoteDB` para TypeScript com tipos de `Doc`, `Snapshot`, erros; manter cache, bootstrap, consulta de mudanças e otimismo. Cobrir com testes de unidade (cache, desfazer em erro, ordem, reconciliação com o servidor).
3. **Converter as telas para React/TSX, uma por vez**, na ordem: Capa, Leituras (leitor de texto), Enviados da semana, Edição do Autor, Assinatura, Perfil (+ foto), Introdução. Para cada tela: componente em `app/_jornal/views/`, sem `innerHTML` com dado do banco (escapar sempre; hoje tudo vem "não confiável"), e comparar com a linha de base da Etapa 1.
4. **Desempenho percebido:** render só do que mudou (não redesenhar a página inteira a cada notificação de coleção), `schedule()` com agrupamento, listas longas com limite, nada que bloqueie o clique por mais de 100 ms. Conferir no navegador: criar conto e remover conto mudam a tela em menos de 200 ms.
5. **Segurança do front:** nenhum `dangerouslySetInnerHTML` com texto do usuário; manter `INJ_RE`/limpezas existentes; CSRF em toda escrita.
6. Remover o rewrite/`engine.js` restante só quando todas as seções estiverem convertidas (as da Etapa 3 chegam por merge).

Pronto quando:
- Cada tela convertida é visualmente igual à linha de base (diferença só de antialiasing) em desktop e celular.
- Fluxos manuais passam no build de produção: cadastro, login, criar conto (a tela atualiza na hora), remover conto como chefe (a tela atualiza na hora e o autor vê o aviso), curtir, avaliar, comentar, seguir, editar perfil, trocar foto, assinatura, sair.
- Console do navegador sem erro (exceto avisos conhecidos de terceiros).
- `tsc`, `next build` e testes de unidade passam.

---

## ETAPA 3: Funcionalidades isoladas (Agente 3)

**Dono dos arquivos:** `app/_jornal/features/**` (pasta nova), `public/fundos/**`, e as seções do `engine.js` listadas abaixo (que ele **move** para `features/` e deixa só a chamada no lugar).

Seções do `engine.js` que são suas: máquina de escrever e teclados (`tw*`), vistoria de originalidade (anti-plágio), "Como anda o mundo do xadrez" (puzzle da semana, curiosidades, motor de xadrez, puzzle interativo), correções de iOS, UX (rascunho automático, atalho de envio, teclado nas abas), idioma/atalhos/erros amigáveis, fundos ilustrados (`public/fundos/scenes.js` de 97 KB e `fundos.js`).

Tarefas:
1. **Máquina de escrever e teclados** → `features/typewriter/`: componente React com os 4 modelos (máquina, escritório, mecânico, membrana), áudio em um hook (`useTypewriterSound`) que cria o `AudioContext` só no primeiro gesto, desenho do teclado como componente, modelo salvo no navegador (`gazeta-tw-mode`, com migração de `gazeta-tw-kb`). Manter: rascunho automático, trava de envio, foco, iOS (visualViewport).
2. **Xadrez** → `features/chess/`: motor (lances legais, xeque, mate, roque) em TypeScript puro com **testes de unidade** (posições conhecidas, perft pequeno, mate em 1/2 do puzzle da semana), carregado sob demanda (`import()` só ao abrir a seção), para sair do carregamento inicial.
3. **Vistoria de originalidade** → `features/originality/`: lógica pura testável; garantir que não bloqueia a digitação (usar `requestIdleCallback`/worker se passar de 50 ms).
4. **Fundos ilustrados:** carregar `scenes.js` sob demanda e só quando o fundo estiver visível; respeitar `prefers-reduced-motion`; pausar a animação com a aba oculta.
5. **Carregamento inicial:** medir com `next build` o tamanho do JS da home e reduzir (divisão por rota/seção, imagens com `next/image` onde fizer sentido, fontes com `next/font`). Meta: JS inicial da home abaixo de 200 KB comprimido.
6. **Acessibilidade e iOS:** foco, `aria-*`, teclado, rolagem travada ao abrir a máquina de escrever, áreas seguras.

Pronto quando:
- Os testes de unidade do xadrez e da vistoria passam.
- Escrever, trocar de teclado (4 modelos, com som), salvar rascunho, enviar conto e fechar funcionam no build de produção, em desktop e celular.
- O xadrez só é baixado ao abrir a seção (conferir na aba Rede).
- Relatório com o tamanho do JS antes e depois.

---

## Ordem de merge

1. Commit base da `main` com o "Estado atual" (o dono do projeto decide quando commitar).
2. Etapa 2, Passo 0 (divisão em módulos) entra primeiro.
3. Etapas 1 e 3 entram em qualquer ordem; Etapa 2 vai mesclando as telas.
4. Por fim, Etapa 1 item 7 (apagar o legado) e a verificação geral.

## Definição de "entregue"

- O site se comporta como hoje em todas as telas e fluxos (comparado com a linha de base).
- Criar e remover conto atualizam a tela em menos de 200 ms no navegador e a API responde dentro das metas de `docs/desempenho.md`.
- `tsc`, `next build`, testes de API, de unidade e roteiro manual em desktop e celular passam.
- Sem `public/legacy/`, sem `engine.js` monolítico, sem dado do usuário entrando em `innerHTML`.
