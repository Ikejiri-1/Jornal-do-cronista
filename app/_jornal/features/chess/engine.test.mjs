import test from 'node:test';
import assert from 'node:assert/strict';
import { CE, mvName } from './engine.js';
import { PZ_DIA, PZ_DOM } from './puzzles.js';

const perft = (S, d) => (d === 0 ? 1 : CE.legal(S).reduce((n, m) => n + perft(CE.apply(S, m), d - 1), 0));
const play = (fen, line) => line.reduce((S, mv) => {
  const m = CE.legal(S).find((x) => mvName(x) === mv);
  assert.ok(m, `lance ilegal ${mv} em ${fen}`);
  return CE.apply(S, m);
}, CE.parse(fen));

// Contagens oficiais (chessprogramming.org). Só vão até onde não há en passant nem promoção, que o motor não implementa.
test('perft: posição inicial', () => {
  const S = CE.parse('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -');
  assert.equal(perft(S, 1), 20);
  assert.equal(perft(S, 2), 400);
  assert.equal(perft(S, 3), 8902);
});
test('perft: Kiwipete (roque dos dois lados, cravadas)', () => {
  assert.equal(perft(CE.parse('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -'), 1), 48);
});
test('perft: posição 3 (xeque descoberto)', () => {
  const S = CE.parse('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -');
  assert.equal(perft(S, 1), 14);
  assert.equal(perft(S, 2), 191);
});
test('mate do pastor e mate do louco', () => {
  assert.ok(CE.mated(play('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -', ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4', 'g8f6', 'h5f7'])));
  assert.ok(CE.mated(play('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -', ['f2f3', 'e7e5', 'g2g4', 'd8h4'])));
});
test('roque: não passa por casa atacada nem sai de xeque', () => {
  const ok = CE.legal(CE.parse('4k3/8/8/8/8/8/8/R3K2R w KQ -')).map(mvName);
  assert.ok(ok.includes('e1g1') && ok.includes('e1c1'));
  const atacada = CE.legal(CE.parse('4kr2/8/8/8/8/8/8/4K2R w K -')).map(mvName); // f1 atacada pela torre em f8
  assert.ok(!atacada.includes('e1g1'));
  const xeque = CE.legal(CE.parse('4k3/8/8/8/8/8/4r3/R3K2R w KQ -')).map(mvName);
  assert.ok(!xeque.includes('e1g1') && !xeque.includes('e1c1'));
});

test('puzzles do dia: a linha é legal, termina em mate e a jogada-chave é única', () => {
  for (const [fen, line, n] of PZ_DIA) {
    const mv = line.split(' ');
    const S0 = CE.parse(fen + ' -');
    assert.equal(CE.need(S0, n), n, `mate em ${n} esperado: ${fen}`);
    assert.ok(CE.mated(play(fen + ' -', mv)), `a linha não termina em mate: ${fen}`);
  }
});
test('puzzles de domingo: a linha é legal e termina em mate', () => {
  assert.ok(PZ_DOM.length > 0);
  for (const z of PZ_DOM) assert.ok(CE.mated(play(z.fen, z.line)), `não termina em mate: ${z.fen}`);
});
