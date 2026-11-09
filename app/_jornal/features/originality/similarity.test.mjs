import test from 'node:test';
import assert from 'node:assert/strict';
import { localCheck, localCheckIdle, wordsOf } from './similarity.js';

const lorem = (n, seed = 1) => { let x = seed * 2654435761 >>> 0; return Array.from({ length: n }, () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return 'p' + (x >>> 12); }).join(' '); };

test('texto igual a outro é pego (semelhança alta e trecho longo)', () => {
  const t = lorem(120);
  const r = localCheck(t, [{ t, n: 'a história “X”' }]);
  assert.ok(r.p >= 0.5 && r.run >= 60);
  assert.equal(r.onde, 'a história “X”');
});
test('texto diferente passa', () => {
  const r = localCheck(lorem(120, 1), [{ t: lorem(120, 2), n: 'outra' }]);
  assert.ok(r.p < 0.2 && r.run < 30);
});
test('acentos e pontuação não enganam a comparação', () => {
  const a = 'A noite caía devagar, sobre a cidade; ninguém percebia o silêncio dos sinos.';
  const b = 'a noite caia devagar sobre a cidade ninguem percebia o silencio dos sinos';
  assert.deepEqual(wordsOf(a), wordsOf(b));
  assert.ok(localCheck(a, [{ t: b, n: 'b' }]).p >= 0.9);
});
test('sem outros textos, sem acusação', () => {
  assert.equal(localCheck(lorem(50), []).p, 0);
});
// A vistoria só roda ao enviar (nunca a cada tecla), e em fatias: nenhuma fatia segura o navegador por mais de ~1 texto.
test('vistoria em fatias: mesmo resultado e nenhuma fatia passa de 50 ms (100 textos de 500 palavras)', async () => {
  const outros = Array.from({ length: 100 }, (_, i) => ({ t: lorem(500, i + 10), n: 'o' + i }));
  outros.push({ t: lorem(500, 999), n: 'igual' });
  let fatia = Date.now(), maior = 0;
  const idle = () => new Promise((r) => { maior = Math.max(maior, Date.now() - fatia); setImmediate(() => { fatia = Date.now(); r(); }); });
  const r = await localCheckIdle(lorem(500, 999), outros, idle);
  maior = Math.max(maior, Date.now() - fatia);
  console.log('maior fatia:', maior, 'ms');
  assert.deepEqual(r, localCheck(lorem(500, 999), outros));
  assert.equal(r.onde, 'igual');
  assert.ok(maior < 50);
});
