// Mede o JS que a home baixa (tamanho comprimido, como trafega) antes e depois de rolar a página.
// Uso: BASE_URL=http://127.0.0.1:3114 node tests/perf/bundle.mjs   (servidor de produção: next build + next start)
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100';
const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => sessionStorage.setItem('gazeta-intro', '1'));
const page = await ctx.newPage();
const js = new Map();
page.on('response', async (res) => {
  if (!/\.js(\?|$)/.test(res.url())) return;
  const sizes = await res.request().sizes().catch(() => null);
  if (sizes) js.set(res.url().replace(BASE, ''), sizes.responseBodySize);
});
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const total = () => [...js.values()].reduce((a, b) => a + b, 0);

await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const inicial = total(), antes = new Map(js);
await page.evaluate(async () => { for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
await page.waitForTimeout(2000);
console.log(`JS comprimido na abertura da home: ${kb(inicial)} (${antes.size} arquivos)`);
console.log(`JS depois de rolar a página inteira: ${kb(total())} (${js.size} arquivos)`);
const maiores = [...antes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
for (const [url, size] of maiores) console.log(`  ${kb(size).padStart(9)}  ${url.slice(0, 70)}`);
const novos = [...js.entries()].filter(([u]) => !antes.has(u));
if (novos.length) console.log('baixados só depois de rolar:', novos.map(([u, s]) => `${u.split('/').pop()} (${kb(s)})`).join(', '));
await browser.close();
