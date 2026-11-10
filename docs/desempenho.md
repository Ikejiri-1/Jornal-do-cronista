# Desempenho: de onde vinha a lentidão e o que mudou

Medido no Postgres local de teste (Docker), com `next build` + `next start`. Reproduzir: `docs/testes.md`.

## Por que criar e remover conto demorava

1. **A tela esperava até 15 s para se atualizar.** Depois de gravar, o front só mostrava o resultado na próxima consulta de "o que mudou" (a cada 15 s). Corrigido no front (cache local com atualização na hora), na camada de dados do `engine.js`.
2. **A tela abria com 14 requisições**, cada uma com a sua checagem de sessão no banco. Agora é 1 (`GET /api/db/bootstrap`).
3. **Cada consulta ao banco paga a ida e volta de rede.** O banco (Supabase) fica em `sa-east-1` e a função da Vercel rodava na região padrão (EUA), sem `vercel.json`. Corrigido com `regions: ["gru1"]`. **Esta é a causa provável da maior parte da lentidão em produção e não pode ser medida aqui**: precisa ser conferida depois do deploy.
4. **Idas ao banco em fila por requisição.** A sessão fazia 2 consultas; gravar fazia BEGIN, leitura, gravação e COMMIT; remover conto no front fazia 4 chamadas em sequência.
5. **Um atraso de propósito na máquina de escrever, que existia no site antigo e que era a maior parte do "criar conto demora".** Medido no navegador, no site antigo e no novo com a mesma API: a gravação termina em ~100 ms, a confirmação "Enviado ao editor" aparece em ~110 ms, mas a máquina de escrever só fechava e levava a "Enviados" ~3,5 s depois do clique, porque consultava o resultado a cada 400 ms e depois segurava mais 2,6 s. Agora consulta a cada 50 ms e segura 0,9 s: **clique até a máquina fechar passou de ~3,5 s para ~1,1 a 1,5 s**. É uma mudança de comportamento (a máquina fica aberta menos tempo depois do envio); o tempo só precisa dar para ler a confirmação e ouvir o carro voltar. Para voltar ao tempo antigo, é só mudar `FECHA_APOS_MS` em `app/_jornal/features/typewriter/Typewriter.tsx`.

## Idas ao banco por operação (contadas no log do Postgres e no código)

| Operação | Antes | Agora |
|---|---|---|
| Ler a sessão | 2 | 1 |
| Gravar documento sem regra de validação (curtidas, perfil, etc.) | 6 (sessão 2 + 4) | 2 |
| Gravar conto (com validação, transação) | 6 | 4 |
| `PATCH` (mesclar) | 7 (sessão 2 + checagem + 4) | 4 |
| `changes` (o que mudou) | 4 (sessão 2 + 2 em fila) | 2 (as duas consultas vão juntas) |
| Abrir a tela | 14 requisições, ~9 etapas em fila | 1 requisição, 2 etapas |
| Remover conto como chefe (front) | 4 chamadas em fila | 2 etapas (leituras juntas, gravações juntas), tela atualiza ao fim da 1ª |

"Antes" foi contado lendo o código anterior; "agora" foi confirmado no log (`log_statement=all`).

## Números medidos

Cada linha é a mediana de N chamadas (25 diretas, 12 com latência), servidor local.

**Direto, sem latência de rede** (`tests/perf/perf.mjs`):

| Operação | mediana | p95 |
|---|---|---|
| Sessão | 4 ms | 5 ms |
| Abertura nova (1 bootstrap) | 8 ms | 10 ms |
| Abertura antiga (14 leituras) | 32 ms | 43 ms |
| Changes | 6 ms | 7 ms |
| Gravar curtidas | 9 ms | 14 ms |
| Enviar conto | 10 ms | 15 ms |
| PATCH perfil | 11 ms | 15 ms |
| Remover | 4 ms | 8 ms |

**Com latência simulada** (proxy `tests/perf/latency-proxy.mjs`, 50 ms em cada sentido):

| Operação | mediana | p95 |
|---|---|---|
| Sessão | 249 ms | 252 ms |
| Abertura nova (1 bootstrap) | 497 ms | 499 ms |
| Abertura antiga (14 leituras) | 2242 ms | 2262 ms |
| Changes | 498 ms | 622 ms |
| Gravar curtidas | 495 ms | 499 ms |
| Enviar conto | 993 ms | 1240 ms |
| PATCH perfil | 992 ms | 999 ms |
| Remover | 497 ms | 500 ms |

### Como ler isso (limites)

- **Com o proxy, uma consulta custa ~250 ms, não os 100 ms nominais** (o driver troca mais de um pacote por consulta). Os números absolutos com latência são, portanto, pessimistas. O que vale é a proporção: o tempo é proporcional ao número de idas ao banco em fila.
- **A abertura nova é 4,5 vezes mais rápida que a antiga** com latência (497 contra 2242 ms) e 4 vezes mais rápida sem latência.
- **Meta do plano não cumprida em um ponto:** "enviar conto" fica em ~1 s com o proxy (4 idas em fila: sessão, BEGIN, leitura com trava, gravação e COMMIT). Menos que isso exigiria tirar a transação (perde a proteção contra escrita simultânea nas regras "só acrescenta") ou guardar a sessão em memória (a sessão revogada continuaria valendo por alguns segundos). Não fiz nenhuma das duas sem a decisão do dono do projeto.
- **Em produção com `gru1`** a ida e volta app↔banco deve ficar na casa de poucos milissegundos, e o envio de conto tende a ficar abaixo de 100 ms. Isto é estimativa, não medição: conferir depois do deploy (Vercel → logs da função, `Duration`).

### No navegador, de ponta a ponta (`tests/e2e/fluxos.mjs`, servidor e banco locais, build de produção)

| Ação | Medido |
|---|---|
| Criar conto: da ação até a máquina de escrever fechar | ~1,1 a 1,5 s (antes ~3,5 s; a confirmação aparece em ~110 ms nos dois) |
| Remover conto como chefe: da confirmação até a tela mudar | ~170 a 320 ms |
| Abrir a tela | 2 requisições (`session` e `bootstrap`) em vez de 14 (medido no navegador no site antigo: `session`, `changes` e 12 leituras) |
| JS comprimido da home (`tests/perf/bundle.mjs`) | 237,9 KB (meta era 200 KB: **não atingida**; o framework sozinho tem ~118 KB) |

Sem latência de rede. Com o banco longe do servidor, some a ida e volta de cada consulta (tabela anterior), por isso o `gru1` importa.

## Consultas e índices (5 mil documentos, banco local)

- Listar uma coleção: ~2,5 ms (varredura da tabela, ordenação em memória). Sem problema nesse tamanho.
- Abertura (`bootstrap`): a consulta antiga ordenava a linha inteira com o JSON e gravava 6 MB em arquivo temporário (20 ms). A nova ordena só colunas pequenas e busca o JSON depois: 393 KB em memória, 16 ms, sem disco.
- `changes` e `max(seq)`: usam a chave primária (0,4 ms e 0,07 ms).
- **O banco real só tem a chave primária `(collection, id)` em `docs`.** Não criei índice `(collection, updated_at desc)` porque, no tamanho atual (1 documento em produção quando olhei), seria custo sem ganho. Se uma coleção passar de alguns milhares de documentos, vale uma migração com esse índice; ela exige o seu OK por mexer no banco real.
- Limpeza: `doc_changes` e `rate_hits` são apagadas pelo app (2% das chamadas), linhas com mais de 1 dia. Tem índice em `at` e `(key, hit_at)`.
