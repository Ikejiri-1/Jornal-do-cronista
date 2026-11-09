// Compara o site novo (/) com a linha de base do legado, tela a tela: texto visível idêntico e imagem quase idêntica.
// Uso: node tests/baseline/compare.mjs [prefixo-da-pagina-nova]   (padrão "/")  — com o seed já aplicado e o servidor no ar.
// Variáveis: BASE_URL, LIMITE (fração de pixels diferentes aceita, padrão 0.005).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const BASELINE = path.resolve('tests/baseline/legado');
const NOVO = path.resolve('tests/baseline/novo');
const LIMITE = Number(process.env.LIMITE || 0.005);
const PAGE = process.argv[2] || '/';

fs.rmSync(NOVO, { recursive: true, force: true });
execFileSync(process.execPath, ['tests/baseline/capture.mjs', NOVO, PAGE], { stdio: 'inherit', env: { ...process.env, MSYS_NO_PATHCONV: '1' } });

const rows = [];
let falhas = 0;
for (const view of fs.readdirSync(BASELINE)) {
  const dirA = path.join(BASELINE, view);
  if (!fs.statSync(dirA).isDirectory()) continue;
  for (const file of fs.readdirSync(dirA).filter((f) => f.endsWith('.png')).sort()) {
    const name = file.replace('.png', '');
    const a = PNG.sync.read(fs.readFileSync(path.join(dirA, file)));
    const pngB = path.join(NOVO, view, file);
    if (!fs.existsSync(pngB)) { rows.push({ tela: `${view}/${name}`, texto: 'FALTA', 'pixels %': '-', altura: '-' }); falhas++; continue; }
    const b = PNG.sync.read(fs.readFileSync(pngB));
    const txtA = fs.readFileSync(path.join(dirA, name + '.txt'), 'utf8');
    const txtB = fs.readFileSync(path.join(NOVO, view, name + '.txt'), 'utf8');
    const mesmoTexto = txtA === txtB;
    // Alturas diferentes: compara só a parte em comum e conta a diferença de altura como falha.
    const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
    const crop = (img) => { const out = new PNG({ width: w, height: h }); PNG.bitblt(img, out, 0, 0, w, h, 0, 0); return out; };
    const diff = pixelmatch(crop(a).data, crop(b).data, null, w, h, { threshold: 0.1 });
    const ratio = diff / (w * h);
    const ok = mesmoTexto && ratio <= LIMITE && a.height === b.height && a.width === b.width;
    if (!ok) falhas++;
    rows.push({ tela: `${view}/${name}`, texto: mesmoTexto ? 'igual' : 'DIFERENTE', 'pixels %': (ratio * 100).toFixed(2), altura: a.height === b.height ? 'igual' : `${a.height} -> ${b.height}`, ok: ok ? 'ok' : 'FALHA' });
  }
}
console.table(rows);
const erros = fs.existsSync(path.join(NOVO, 'erros-de-script.txt')) ? fs.readFileSync(path.join(NOVO, 'erros-de-script.txt'), 'utf8').trim() : '';
if (erros) { console.log('Erros de script no novo:\n' + erros); falhas++; }
console.log(falhas ? `${falhas} diferença(s) acima do limite` : 'tudo igual ao legado');
process.exit(falhas ? 1 : 0);
