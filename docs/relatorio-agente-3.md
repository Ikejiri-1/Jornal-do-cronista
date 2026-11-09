# Relatório do Agente 3 (Etapa 3)

Branch `agente-3`, criada em cima de `cb935a1` (Etapa 2, tarefa 2). Merge: `git merge agente-3` na branch do Agente 2 ou o contrário; os arquivos tocados estão listados abaixo.

## O que mudou
- `app/_jornal/features/` (novo): `typewriter/` (index + sound), `originality/` (index + similarity pura), `chess/` (engine, puzzles, ui), `ux/`, `ios/`. Cada um é uma função `createX(ctx)` que recebe o que usa do núcleo (`state`, `$`, `note`...). O código foi movido sem reescrever a lógica.
- `engine.js` ficou só com a chamada de cada módulo. Perdeu cerca de 930 linhas.
- Xadrez: o bloco da Capa mostra um espaço reservado e só baixa o módulo (puzzles + motor + tabuleiro, 21 KB gz) quando chega a 300 px da tela (`IntersectionObserver`). No celular, o chunk só aparece na aba Rede depois de rolar até ele. No desktop, o bloco já cabe na primeira tela da Capa, então baixa na hora.
- Vistoria: a comparação local roda em fatias de ~12 ms (`localCheckIdle`) e cede a vez ao navegador. Só roda ao enviar, nunca a cada tecla.
- Fundos: `layout.tsx` carrega só `fundos.js`; ele baixa `scenes.js` (26 KB gz) em seguida.
- Testes: `node --test "app/_jornal/features/**/*.test.mjs"` (12 testes: perft da posição inicial até profundidade 3, Kiwipete e posição 3, mates, roque, todos os puzzles do dia e de domingo, similaridade, maior fatia da vistoria < 50 ms).

## Arquivos de outros agentes que esta branch toca (mínimo)
- `app/_jornal/engine.js`: ficou só com `coverHtml`, `renderCapa`, `chipOf`, `renderEnvios`, `dvPage`, `introDive` (Etapa 2) e as pontes (`isTwOpen`, `twSoundOn`, `openTypewriter`, `goLogin`...) que as views já importavam.
- `views/semana.js`: removido o bloco de dados do xadrez (foi para `features/chess/puzzles.js`).
- `views/capa.js` e `views/imersivo.js`: `twOpen`/`twSound`/`twAC` viraram chamadas (`isTwOpen()`, `twSoundOn()`, `twAc()`, `twSetSound()`).
- `app/layout.tsx` e `public/fundos/fundos.js`: scenes.js sob demanda.

## Bug achado e corrigido
O servidor (`validateStories` em `lib/store.ts`) descarta o `check` que o leitor envia e força `status:'analise'`. Depois que o chefe aprovava, o `check` ficava sem `v:1` e a história voltava para "Em análise" para sempre (botão Aprovar nunca sumia). `approveStory` agora grava `v:1`. Consequência para o Agente 1: o motivo da vistoria nunca chega ao banco; o chefe vê "Esta história não tem registro de vistoria". Se quiserem guardar o motivo, o servidor precisa aceitar um `check` sanitizado.

## Conferido (build de produção, Chromium headless, desktop 1280x800 e celular 390x844)
Capa abre, tabuleiro com 64 casas, máquina de escrever abre/fecha (Esc), 4 teclados alternam, rascunho salva em `gazeta-draft`, modelo salvo em `gazeta-tw-mode`, rolagem trava e destrava, botão de som alterna. Console sem erro.
Fluxo com login (Postgres local, build webpack porque o worktree usa junção de node_modules): leitora cadastra, escreve, marca a privacidade e envia; a vistoria cai em "Em análise" (sem IA); o chefe vê Aprovar, aprova, o botão some e o estado persiste ao recarregar. `tsc --noEmit` e `next build` passam.

## JS inicial da home (gzip)
- Antes: ~259 KB (engine inteiro + fundos).
- Depois: 238 KB, sendo 209 KB sem `fundos.js`+`scenes.js`. React/Next somam 117 KB e o `engine.js` 72 KB.
- **Meta de 200 KB não atingida.** O que falta está em `engine.js` (introdução, textos de exemplo, telas), que é da Etapa 2.

## Não feito / diferente do pedido
- Máquina de escrever **não virou componente React** nem hook `useTypewriterSound`: ela mexe no DOM do formulário que vive no `body.ts`. Fica como módulo com áudio separado (`sound.js`, `AudioContext` só no primeiro uso). Converter exige a Etapa 2.
- `scenes.js` não espera o fundo ficar "visível"; o fundo está sempre visível. Já respeitava `prefers-reduced-motion` e pausa com a aba oculta.
- Acessibilidade/iOS: nenhuma mudança além do que já existia, e não testei em iPhone real.
- Não exercitados: Reverificar, Auditar, Bloquear autor e remover conto.

## Pendências para outros agentes
- `app/layout.tsx` (Etapa 2): removi a linha do `scenes.js`.
- O Agente 2 já tem o Passo 0 em `agente-2` (`engine.js` com `export` e `init_<seção>()`). Minhas seções precisam ser refeitas em cima disso: o conteúdo de `features/` vem do `engine.js` antigo, então vale reaplicar o corte na versão dele em vez de mesclar.

## Atualização: máquina de escrever em React (pedido do Agente 1)
- `features/typewriter/Typewriter.tsx` renderiza o #tw (mesmos ids e classes), `useTypewriterSound.ts` guarda o áudio (AudioContext só no primeiro gesto) e `controller.ts` é a ponte para o resto do jornal (`tw.open`, `tw.isOpen`, `tw.ctx`...). `sound.js` continua sendo o motor de áudio, com `sound.d.ts`.
- O bloco #tw saiu de `body.ts`, que agora tem uma linha por linha da marcação (menos conflito no Git). `Jornal.tsx` renderiza `<Typewriter />` depois do HTML.
- Os formulários de história/obra continuam na marcação: ao abrir, são movidos para #tw-slot (React não toca nesse div) e devolvidos ao fechar.
- Conferido no build de produção: 4 teclados (classes kb/m-*), tecla com .down, AudioContext = 0 antes de qualquer gesto, modo e som persistem após recarregar, rascunho restaurado, Esc fecha e devolve o formulário, Mesa do redator (obra) abre e fecha, envio de conto fecha sozinha e leva a Enviados. compare.mjs: 22/24 ok; os 2 que falham são Enviados (desktop e celular) só pelo relógio "Fecha em X h".

## Fluxos do chefe (build de produção, seed do Agente 1)
Passou: Auditar, Reverificar, Bloquear autor, Desbloquear autor, Remover conto (a tela muda em ~100 ms), autor vê o aviso com o motivo. Bug achado e corrigido: Bloquear autor nunca confirmava (views/foto.js:409 zerava state.armed; já era assim no legado).

## Não verificado
Acessibilidade e iOS sem aparelho real; leitor de tela; "fundo só quando visível" (descartado).
