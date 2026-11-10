# Relatório do Agente 1 (servidor, dados, desempenho e testes)

Branch `agente-1`, worktree `C:\Users\ikeji\jornal-agente-1`. Banco local `jornal-pg-1` (porta 54331).

## Integração (branch `integracao`, worktree `C:\Users\ikeji\jornal-integracao`)

`integracao` = `agente-3` (que já continha a `agente-2`) + `agente-1`, mais as mudanças abaixo. **Não foi mesclada na `main`**: isso fica para o dono decidir.

Verificado na árvore integrada, com build de produção normal (`next build`, Turbopack) e Postgres local, **depois de apagar `public/legacy/`**:
- `tsc` limpo; build sem erro.
- 20 de 20 testes da API; 22 de 22 testes de unidade do front.
- 11 de 11 fluxos no navegador (`tests/e2e/fluxos.mjs`): criar conto, aprovar, curtir, avaliar, comentar, seguir, remover como chefe com aviso ao autor, editar perfil, sem erro de script no console.
- 24 de 24 telas iguais à linha de base, em desktop e celular (`tests/baseline/compare.mjs`).

Mudanças feitas na integração:
- **Criar conto: o atraso de propósito da máquina de escrever caiu de ~3,5 s para ~1,1 a 1,5 s** (consulta a cada 50 ms em vez de 400 ms e segura 0,9 s em vez de 2,6 s). Estava igual no site antigo; era a maior parte do "criar conto demora" (a gravação em si leva ~100 ms). Detalhes em `docs/desempenho.md`.
- Espaçamento entre palavras (`word-spacing: .2em`) na fonte da máquina de escrever, a pedido do dono: bloco gerado no fim do `jornal.css` por `scripts/espaco-entre-palavras.mjs`, mais as 7 regras de `login.module.css` e `chefe.module.css`.
- `public/legacy/` removido (consta no histórico, commit `553fa7d`); a baseline em `tests/baseline/legado/` ficou como referência congelada.
- Roteiro `tests/e2e/fluxos.mjs` e medição `tests/perf/bundle.mjs`.

**Ainda não provado ou não atingido:**
- JS inicial da home: **237,9 KB comprimido, meta de 200 KB não atingida** (framework ~118 KB; o resto está no motor do jornal).
- A introdução animada continua como módulo ES (animação imperativa, sem dado do usuário) e o leitor de texto ainda monta HTML por string com `esc()` (relatado pelo Agente 2). Não os reescrevi.
- Velocidade **em produção** não medida (só depois do deploy). Estimativa: com `gru1` a ida e volta ao banco cai para poucos ms.
- Celular: só o que a comparação de telas cobre e a emulação do Playwright; **não testei em iPhone/Android reais** (nem o Agente 3).
- O envio de conto com a rede simulada (proxy) continua ~1 s no servidor; ver o relatório mais abaixo (decisão do dono).

## O que passou (verificado, na branch `agente-1`)

- `npx tsc --noEmit` e `npx next build` sem erro.
- `npm test`: 20 de 20 testes da API, depois de todas as otimizações. Teste dos testes: 3 regras de acesso afrouxadas de propósito derrubaram 4 testes; restaurado, voltaram a passar.
- Linha de base do legado: 12 telas × 2 viewports (24 capturas, imagem + texto) em `tests/baseline/legado`, estável entre execuções. Já foi usada pelo Agente 2: no commit base, todas as telas tinham o mesmo texto do legado, mas 8 a 25% dos pixels diferiam por falta do reset de CSS (`body{margin:0}` etc.) que estava na 1ª linha do HTML antigo. Com o reset, 24 de 24 ficam em 0,00% (testei no meu worktree). O Agente 2 já aplicou a correção na branch dele.
- Desempenho: ver `docs/desempenho.md`. Em resumo: idas ao banco por gravação simples 6 → 2; sessão 2 → 1; `changes` 4 → 2; abertura da tela 14 requisições → 1 (4 a 4,5 vezes mais rápida medida).

## O que mudou no servidor

- `lib/auth.ts`: `readSession` em 1 consulta; `destroySession` não faz consulta sem cookie.
- `lib/store.ts`: `bootstrap`; `writeDoc` devolve o documento guardado, troca simples em 1 consulta (coleções sem validação), mesclar com 404 dentro da transação; `changesSince` com consultas em paralelo; consulta do `bootstrap` sem ordenar o JSON.
- `app/api/db/bootstrap/route.ts` (novo), PUT/PATCH devolvem o documento, PATCH sem leitura extra.
- `vercel.json`: função em `gru1`. `lib/db.ts`: `DATABASE_SSL=off` só para o banco local.
- Regras de acesso: **nenhuma afrouxada**. A autorização continua antes de `writeDoc` na rota; só mudou como a gravação é feita.

## O que NÃO foi feito ou não está provado

1. **Item 7 (apagar `public/legacy/`) não foi feito.** Só pode ser depois de as etapas 2 e 3 estarem mescladas e aprovadas, e a linha de base depende dele para ser regerada.
2. **Deploy não verificado.** O ganho esperado do `gru1` (função perto do banco) não pôde ser medido aqui. Conferir depois do deploy, nos logs da função da Vercel.
3. **Meta do plano não cumprida para "enviar conto":** com latência simulada fica em ~1 s (4 idas ao banco em fila), acima da meta de 500 ms; sem latência, 10 ms. Para baixar mais seria preciso (a) tirar a transação, perdendo a proteção contra escrita simultânea nas regras "só acrescenta", ou (b) guardar a sessão em memória, deixando uma sessão revogada valer por alguns segundos. **Decisão do dono do projeto.**
4. O proxy de latência cobra ~250 ms por consulta, não os 100 ms nominais; os absolutos são pessimistas (detalhe em `docs/desempenho.md`).
5. Não medi o tempo no navegador de ponta a ponta (da ação até a tela mudar): é da Etapa 2.
6. Não rodei os testes do front das outras etapas (estão nas branches deles).
7. Não criei índice novo no banco real nem rodei migração. O banco real só tem a chave primária em `docs`; se uma coleção passar de alguns milhares de documentos, vale um índice `(collection, updated_at desc)`, com o seu OK.
8. A leitura do banco real foi só de metadados (lista de índices) para deixar `db/schema.sql` fiel; nenhum dado lido ou gravado lá.

## Decisões para o dono do projeto

- **Campo `check` da vistoria (DECIDIDO pelo dono: manter como está):** o servidor descarta o `check` enviado pelo leitor e força `status:'analise'`. É o padrão seguro (um `check` do navegador pode ser forjado), mas o chefe vê "esta história não tem registro de vistoria". Se quiser guardar o motivo, o servidor teria de aceitar um `check` sanitizado (só texto curto e números) e a tela do chefe deveria dizer que é informado pelo autor, não verificado. Achado do Agente 3. Decisão: o servidor continua descartando o `check` do leitor e forçando `status:'analise'`; o chefe usa "Reverificar" na tela dele. Nada a mudar no servidor.
- **Sessão em memória** (item 3 acima): mais velocidade, com a contrapartida descrita.
- **Índice em `docs`** (item 7): só quando o volume justificar.

## Para os outros agentes

- `.git/info/exclude` é compartilhado entre worktrees e tem a linha `tests/`: impede `git add` de arquivos novos em `tests/` (uso `git add -f`). Quem pôs deve trocar por uma regra local.
- Ordem para comparar com o legado: `node tests/baseline/seed.mjs` e depois `node tests/baseline/compare.mjs`.
