# RelatÃ³rio do Agente 2 (Etapa 2)

## Passo 0: engine.js dividido em mÃ³dulos ES (feito)
- `app/_jornal/core/` (base, seguranca, dados, localdb, remotedb) e `app/_jornal/views/` (uma por seÃ§Ã£o do engine.js). `core/app.js` reexporta `state` e `render`.
- As seÃ§Ãµes da Etapa 3 continuam em `app/_jornal/engine.js` (funÃ§Ãµes exportadas, cÃ³digo de carga em `init_<seÃ§Ã£o>()`). O Agente 3 as move para `features/`.
- `main.js` Ã© o ponto de entrada (`Jornal.tsx` importa ele) e chama os `init` na ordem original do arquivo.
- MecÃ¢nico: o corpo de cada funÃ§Ã£o Ã© idÃªntico ao original. VariÃ¡veis de topo viraram `export let`; atribuiÃ§Ã£o vinda de outro mÃ³dulo (`noteTimer`, `render`, `twSound`, `artN`, `inLock`, `inLeaving`, `inDiveCtl`) passa por `__set_<nome>()`.
- Conferido: nenhum identificador global novo em relaÃ§Ã£o ao original; `tsc` e `next build` passam; build de produÃ§Ã£o abre, as 6 abas trocam, console sem erro.

## NÃ£o conferido / nÃ£o feito
- Fluxos que usam os setters (som da mÃ¡quina de escrever, introduÃ§Ã£o animada atÃ© o fim), login, enviar/remover conto, xadrez: nÃ£o testados neste passo.
- Tarefas 2 a 6 da Etapa 2 (db.ts tipado + testes, telas em React, desempenho, seguranÃ§a do front, remover engine.js): nÃ£o iniciadas.
- ComparaÃ§Ã£o com a linha de base da Etapa 1: ainda nÃ£o existe (`tests/baseline/`).

## Tarefa 2: camada de dados tipada (feita)
- app/_jornal/core/db.ts (makeRemoteDB em TypeScript, com Env injetável) substitui a versão em remotedb.js. Mesma interface, cache, bootstrap, consulta de mudanças e otimismo.
- 10 testes de unidade em core/db.test.ts (abertura em 1 requisição, otimismo, desfazer em erro, ordem, reconciliação com o servidor, fallback, CSRF): node --test app/_jornal/core/db.test.ts passa.
- tsc e next build passam. No build de produção: login como chefe e gravação de texto pela tela funcionam e persistem; console sem erro.
- Não coberto por teste: o atraso da atualização otimista em rede lenta e a medição < 200 ms na tela.


## Tarefa 3: telas em React
### Assinatura (feita)
- views/AssinaturaView.tsx (React) substitui os construtores de HTML de foto.js. Mesmos data-act; cliques continuam no ouvinte global. Todo texto do banco passa pelo escape do React; o link de pagamento só vira link se for https.
- Comparado com a versão antiga no navegador (3 cenários: chefe com plano editor, chefe na banca, chefe com pedidos/lista): DOM idêntico (atributos em ordem canônica). Salvar pagamento e entrar na lista de espera funcionam; console sem erro.
- Padrão para as próximas telas: componente em views/<Nome>View.tsx (não use o mesmo nome do .js: o Windows ignora maiúsculas), mount com flushSync, d.ts mínimos para os módulos .js que o TSX importa.

### Perfil (feito)
- views/PerfilView.tsx e views/kit.tsx (Avatar, Excerpt, OpenBtn, StatusChip) substituem os construtores de HTML de perfil.js e foto.js. Quando um texto está aberto no Perfil, o React é solto e o leitor antigo desenha em innerHTML (some quando a Leitura for convertida).
- Reset de CSS do HTML antigo devolvido ao topo de jornal.css (achado do Agente 1).

### Verificação (linha de base do Agente 1, commit 4466ff0)
- Depois do merge da agente-3 (b620ce9): tests/baseline/compare.mjs passa nas 24 telas (desktop e celular), texto idêntico e diferença de pixels dentro do limite.
- tsc sem erro, next build ok, 22 testes de unidade passam (node --test "app/_jornal/features/**/*.test.mjs" "app/_jornal/core/*.test.ts").

### Falta da Etapa 2
- Converter: Capa, Leituras, Enviados da semana, Edição do Autor, Introdução. Depois: desempenho percebido (tarefa 4), revisão de segurança do front (5), remover engine.js (6).
- Medição de 200 ms para criar/remover conto e roteiro manual completo ainda não feitos.

### Capa (feita)
- views/CapaView.tsx (abas, manchete, páginas 2 a 5, colunas) e views/pecas.tsx (AuthorLink, Byline, LikeBtn, Stars, ReaderTools, CommentsBox, ArtSvg/ArtFigure, ChessSlot) substituem coverHtml/renderCapa e os construtores de edicao.js/semana.js para essa tela. As peças valem também para Leituras, Enviados e Autor.
- O xadrez continua carregado sob demanda pelo engine.js (chessHtml em uma casca React).
- Único dangerouslySetInnerHTML: as ilustrações fixas do projeto (IN_SC, IN_ONCE), nunca texto de usuário.
- Verificado: linha de base 24/24 (capa em desktop e celular), as 6 páginas abrem sem erro de console, com estrelas, caixa de comentários e SVGs esperados.
- NÃO verificado: abrir um texto a partir da Capa (modo leitura) e voltar; curtir/avaliar/comentar na Capa; páginas 2 a 6 contra a linha de base (ela só cobre a página 1).

### Enviados, Leituras e Autor (feitos)
- views/EnviosView.tsx, views/LeiturasView.tsx (Autor + Leituras), views/historia.tsx (StoryTools, StoryPiece, WorkTools, LeituraPiece).
- Linha de base: só difere o relógio "Fecha em X dias e Y h" (varia com a hora; texto e imagem iguais fora isso).

### Limpeza do engine.js (feita)
- renderCapa -> views/capa.js; renderEnvios -> views/envios.js; dvPage, introDive e inDiveCtl -> views/modalidade.js; chipOf removido (PerfilView usa StatusChip).
- engine.js ficou só com as pontes para features/ (Agente 3) e o carregador do xadrez. Não tem mais lógica de tela.

## Fechamento da Etapa 2

### Segurança do front (tarefa 5)
- Os 3 dangerouslySetInnerHTML: Jornal.tsx (marcação fixa do projeto) e 2 em pecas.tsx (ilustrações fixas IN_SC/IN_ONCE). Nenhum recebe texto de usuário.
- Telas em React: todo texto do banco escapado pelo React. Nas que ainda usam innerHTML (render.js, imersivo.js, foto.js honorRoll, mesa.js opções, remotedb.js conta/avisos, modalidade/introducao): auditei cada uma, todas passam o texto do banco por esc() ou só têm texto fixo. INJ_RE/limpezas seguem em core/seguranca.js; toda escrita sai por core/db.ts com X-CSRF-Token.
- Leitor de texto (articleHtml em html.js) continua em string, com esc() em tudo; é a próxima candidata a converter.

### Desempenho percebido (tarefa 4)
- render() só desenha a aba ativa; o React só mexe no que mudou. Gravar é otimista (core/db.ts).
- Medido no build de produção, banco local: remover conto como chefe some da tela em 34 ms (e o servidor confirma); o envio mostra a primeira resposta em 24 ms e o "Enviado ao editor" logo depois.

### Roteiro manual no build de produção (banco local, 1 conto removido de cada vez)
- Passou: cadastro, login, criar conto, remover conto como chefe (a tela muda na hora; o aviso do autor foi gravado em `notices`), editar perfil (salva; atualiza a tela depois de sair do campo), assinatura (salvar pagamento, lista de espera), sair, Capa páginas 1 a 6. Console sem erro em todas.

### O que NÃO foi feito ou verificado (ressalvas)
- Introdução animada (introducao.js, modalidade.js): NÃO convertida para React. É animação imperativa (SVG/timers) com texto fixo e sem dado de usuário; converter só aumentaria o risco. Fica como módulo ES.
- Leitor de texto (articleHtml) ainda em string com esc().
- Não testados na tela: curtir, avaliar, comentar, seguir, trocar foto, ativar assinatura pelo painel, celular/iOS manual, modo leitura a partir da Capa.
- Os testes de unidade cobrem só core/db.ts (10) e os da Etapa 3.
