// Captura cada tela (imagem + texto visível) em desktop e celular.
// Uso: node tests/baseline/capture.mjs <pasta-de-saida> [prefixo-da-pagina]   (prefixo: /legacy/index.html para o legado, / para o Next)
// Variáveis: BASE_URL (padrão http://127.0.0.1:3100). Precisa do seed (tests/baseline/seed.mjs) já aplicado.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100';
const OUT = path.resolve(process.argv[2] || 'tests/baseline/saida');
const PAGE = process.argv[3] || '/';
const PASS = 'SenhaForte#12345';
const VIEWS = {
  desktop: { viewport: { width: 1280, height: 800 } },
  celular: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
};
const LAYERS = ['capa', 'autor', 'leituras', 'envios', 'assinatura', 'perfil'];

// Remove o que muda a cada execução (relógio, data, animações, fundo animado, código de leitor, que vem do id aleatório do usuário) sem tocar no que o usuário vê.
const FREEZE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
#dl-clock,#dl-date,#dream,#fundo-bar,#fundo-cap,#fo-r,#fo-l,.sub-code{visibility:hidden!important}`;

async function login(context, email) {
  const res = await context.request.post(BASE + '/api/auth/login', { data: { email, password: PASS }, headers: { Origin: BASE } });
  if (!res.ok()) throw new Error('login falhou para ' + email + ': ' + res.status());
}

async function shot(page, dir, name) {
  fs.mkdirSync(dir, { recursive: true });
  await page.addStyleTag({ content: FREEZE });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, name + '.png'), fullPage: true });
  const text = await page.evaluate(() => document.body.innerText.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim());
  fs.writeFileSync(path.join(dir, name + '.txt'), text + '\n');
}

async function open(browser, view, who) {
  const context = await browser.newContext({ ...VIEWS[view], reducedMotion: 'reduce', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  await context.addInitScript(() => { try { sessionStorage.setItem('gazeta-intro', '1'); } catch (e) { /* sem storage */ } });
  if (who) await login(context, who + '@teste.com');
  return context;
}
async function go(page, url, wait = 1800) {
  await page.goto('about:blank'); // trocar só o #hash não recarrega a página, e o motor só lê o hash ao abrir
  await page.goto(BASE + url, { waitUntil: 'load' });
  await page.waitForTimeout(wait); // o motor renderiza depois da abertura em lote
  await revealLazy(page);
}
// Blocos que carregam só quando aparecem (ex.: puzzle de xadrez): rola a página inteira e espera o tabuleiro, se houver o bloco.
async function revealLazy(page) {
  await page.evaluate(async () => { for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
  if (await page.locator('#chess-slot, #chess-board').count()) await page.waitForSelector('#chess-board', { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(300);
}

// Trava: a linha de base só vale com os dados do seed (outro conteúdo no banco muda as telas sem que nada tenha quebrado).
const probe = await fetch(BASE + '/api/db/works/obra1').then((r) => r.json()).catch(() => ({}));
const stories = await fetch(BASE + '/api/db/stories').then((r) => r.json()).catch(() => ({}));
if (!probe.data?.exists || stories.data?.length !== 2) throw new Error('banco sem os dados do seed: rode antes node tests/baseline/seed.mjs');

const browser = await chromium.launch({ channel: 'msedge' });
const errors = [];
for (const view of Object.keys(VIEWS)) {
  const dir = path.join(OUT, view);
  // visitante
  let context = await open(browser, view, null), page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`${view}/anon: ${e.message}`));
  for (const layer of ['capa', 'leituras']) { await go(page, `${PAGE}#${layer}`); await shot(page, dir, `anonimo-${layer}`); }
  await go(page, '/login', 800); await shot(page, dir, 'login');
  await context.close();

  // autora logada: todas as camadas, leitor de texto e máquina de escrever
  context = await open(browser, view, 'ana'); page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`${view}/ana: ${e.message}`));
  for (const layer of LAYERS) { await go(page, `${PAGE}#${layer}`); await shot(page, dir, `autora-${layer}`); }
  await go(page, `${PAGE}#leituras`);
  const piece = page.locator('[data-act="read"], .piece a, .piece button').first();
  if (await piece.count()) { await piece.click(); await page.waitForTimeout(1200); await shot(page, dir, 'autora-leitor'); }
  await go(page, `${PAGE}#capa`);
  await page.locator('#btnNewStory').click({ timeout: 5000 }).catch(() => errors.push(`${view}/ana: botão de escrever não abriu`));
  await page.waitForTimeout(800); await shot(page, dir, 'autora-maquina-de-escrever');
  await context.close();

  // chefe: capa com ferramentas do chefe e painel
  context = await open(browser, view, 'chefe'); page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`${view}/chefe: ${e.message}`));
  await go(page, `${PAGE}#capa`); await shot(page, dir, 'chefe-capa');
  await go(page, '/chefe', 1500); await shot(page, dir, 'chefe-painel');
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'erros-de-script.txt'), errors.join('\n') + (errors.length ? '\n' : ''));
console.log(`capturas em ${OUT} (${errors.length} erro(s) de script)`);
if (errors.length) console.log(errors.join('\n'));
