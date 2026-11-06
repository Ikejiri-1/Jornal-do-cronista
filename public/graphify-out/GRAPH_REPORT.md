# Graph Report - temas  (2026-11-05)

## Corpus Check
- Corpus is ~20,719 words - fits in a single context window. You may not need a graph.

## Summary
- 41 nodes · 51 edges · 8 communities (3 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dragão de tinta
- base.js laço de animação
- Castelo flutuante
- Biblioteca-oceano
- Árvore recursiva (terror)
- Árvore recursiva (backup)

## God Nodes (most connected - your core abstractions)
1. `poly()` - 4 edges
2. `addGlow()` - 4 edges
3. `drawFish()` - 4 edges
4. `tower()` - 4 edges
5. `tree()` - 3 edges
6. `glow()` - 3 edges
7. `drawHead()` - 3 edges
8. `tree()` - 3 edges
9. `mulberry()` - 2 edges
10. `setup()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `drawFish()` --calls--> `poly()`  [EXTRACTED]
  scenes.js → scenes.js  _Bridges community 4 → community 5_
- `tower()` --calls--> `addGlow()`  [EXTRACTED]
  scenes.js → scenes.js  _Bridges community 2 → community 4_

## Import Cycles
- None detected.

## Communities (8 total, 5 thin omitted)

### Community 2 - "Dragão de tinta"
Cohesion: 0.40
Nodes (4): addGlow(), cloud(), drawHead(), glow()

### Community 4 - "Castelo flutuante"
Cohesion: 0.50
Nodes (4): island(), poly(), textLines(), tower()

### Community 5 - "Biblioteca-oceano"
Cohesion: 0.67
Nodes (3): drawFish(), lead(), roundBox()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `drawHead()` connect `Dragão de tinta` to `scenes.js e helpers`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `addGlow()` connect `Dragão de tinta` to `scenes.js e helpers`, `Castelo flutuante`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `poly()` connect `Castelo flutuante` to `scenes.js e helpers`, `Biblioteca-oceano`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._