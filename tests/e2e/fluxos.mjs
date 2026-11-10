// Roteiro de ponta a ponta no navegador (build de produção + Postgres local + seed).
// Ordem: autor cria um conto -> chefe aprova -> leitora curte, avalia, comenta e segue -> chefe remove -> autor vê o aviso.
// Uso: node tests/baseline/seed.mjs && BASE_URL=http://127.0.0.1:3114 node tests/e2e/fluxos.mjs
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100';
const PASS = 'SenhaForte#12345';
const TITULO = 'O Farol de Papel';
const resultados = [];
const browser = await chromium.launch({ channel: 'msedge' });

async function sessao(who, mobile = false) {
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'pt-BR' }
    : { viewport: { width: 1280, height: 800 }, locale: 'pt-BR' });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('gazeta-intro', '1'); } catch (e) { /* sem storage */ } });
  const r = await ctx.request.post(BASE + '/api/auth/login', { data: { email: who + '@teste.com', password: PASS }, headers: { Origin: BASE } });
  if (!r.ok()) throw new Error('login ' + who + ' ' + r.status());
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|WebSocket|404/.test(m.text())) erros.push(m.text()); });
  page.erros = erros;
  // o cookie é Secure: só o navegador o reenvia por HTTP local (a chamada de API do Playwright não)
  await page.goto(BASE + '/api/auth/session');
  const id = JSON.parse(await page.locator('body').innerText()).data.id;
  return { ctx, page, id };
}
const abrir = async (page, hash) => { await page.goto('about:blank'); await page.goto(BASE + '/' + hash, { waitUntil: 'load' }); await page.waitForTimeout(1800); };
async function passo(nome, fn) {
  const t0 = Date.now();
  try { const extra = await fn(); resultados.push({ fluxo: nome, resultado: 'passou', ms: Date.now() - t0, detalhe: extra || '' }); }
  catch (e) { resultados.push({ fluxo: nome, resultado: 'FALHOU', ms: Date.now() - t0, detalhe: String(e.message).split('\n')[0].slice(0, 110) }); }
}
const esperar = async (cond, ms = 6000, passo = 25) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await cond()) return Date.now() - t0; await new Promise((r) => setTimeout(r, passo)); } throw new Error('tempo esgotado esperando a condição'); };
const docs = async (ctx, colecao) => (await (await ctx.request.get(`${BASE}/api/db/${colecao}`)).json()).data; // coleções públicas: não precisam de sessão
// Os contos aprovados da semana disputam em "Enviados da semana" e só viram Capa na segunda-feira.
const abrirNaCapa = async (page) => { await abrir(page, '#envios'); await page.getByText(TITULO).first().click(); await page.locator('.article button.like').first().waitFor({ timeout: 6000 }); };

const ana = await sessao('ana'), beto = await sessao('beto'), chefe = await sessao('chefe');

// ---- autor (Beto) cria um conto: mede da ação até a tela confirmar
let tempoCriar = 0;
await passo('criar conto na máquina de escrever', async () => {
  await abrir(beto.page, '#capa');
  await beto.page.locator('#btnNewStory').click();
  await beto.page.locator('#s-title').waitFor({ timeout: 5000 });
  await beto.page.fill('#s-pen', 'Beto Autor');
  await beto.page.fill('#s-title', TITULO);
  await beto.page.fill('#s-text', 'Era uma vez um farol feito de papel, que iluminava o mar de tinta durante a noite inteira. '.repeat(6));
  const consent = beto.page.locator('#s-consent'); if (!(await consent.isChecked())) await consent.check();
  const t0 = Date.now();
  await beto.page.locator('#s-save').click();
  await beto.page.getByText('Enviado ao editor').first().waitFor({ timeout: 8000 });
  // a máquina de escrever fecha sozinha e leva a Enviados: antes segurava ~3,5 s depois de o servidor já ter respondido
  await beto.page.locator('#tw').waitFor({ state: 'hidden', timeout: 5000 });
  tempoCriar = Date.now() - t0;
  if (tempoCriar > 2500) throw new Error(`a máquina de escrever demorou ${tempoCriar} ms para fechar (limite 2500)`);
  if (!JSON.stringify(await docs(beto.ctx, 'stories')).includes(TITULO)) throw new Error('conto não chegou ao servidor');
  return `clique até a máquina fechar: ${tempoCriar} ms`;
});

// ---- chefe aprova
await passo('chefe vê o conto em análise e aprova (fica aprovado depois de recarregar)', async () => {
  await abrir(chefe.page, '#envios');
  await chefe.page.getByText(TITULO).first().waitFor({ timeout: 8000 });
  const aprovar = chefe.page.getByRole('button', { name: /Aprovar para concorrer/ });
  const antes = await aprovar.count();
  await chefe.page.locator('article, .piece, .card').filter({ hasText: TITULO }).first().getByRole('button', { name: /Aprovar para concorrer/ }).click();
  await esperar(async () => (await aprovar.count()) < antes);
  // a tela muda na hora (otimista); o servidor confirma logo depois: espera, em vez de ler antes da gravação terminar
  const statusNoServidor = async () => ((await docs(chefe.ctx, 'stories')).flatMap((d) => d.data.items).find((i) => i.title === TITULO) || {}).status;
  await esperar(async () => (await statusNoServidor()) === 'aprovada').catch(() => { throw new Error('status no servidor não ficou aprovada'); });
  await abrir(chefe.page, '#envios'); // depois de recarregar, o conto continua aprovado (fora de "Em análise")
  await chefe.page.getByText(TITULO).first().waitFor({ timeout: 6000 });
  if ((await chefe.page.getByRole('button', { name: /Aprovar para concorrer/ }).count()) !== antes - 1) throw new Error('depois de recarregar o conto voltou para a fila de análise');
});

// ---- leitora (Ana) interage com o conto aprovado, que agora está na Capa
await passo('abrir o conto em Enviados da semana', async () => { await abrirNaCapa(ana.page); });
await passo('curtir (e continuar curtida ao recarregar)', async () => {
  await ana.page.locator('.article button.like').first().click();
  await esperar(async () => (await ana.page.locator('.article button.like').first().getAttribute('aria-pressed')) === 'true');
  if (!(await docs(ana.ctx, 'likes')).some((d) => d.id === ana.id && d.data.ids.length === 2)) throw new Error('curtida não chegou ao servidor (esperava a do seed + esta)');
  await abrirNaCapa(ana.page);
  await esperar(async () => (await ana.page.locator('.article button.like').first().getAttribute('aria-pressed')) === 'true');
});
// Estrelas e comentários só existem para histórias já publicadas na Capa (semana passada): o chefe publica uma pela API.
const PUBLICADA = 'A Biblioteca Submersa';
// Semana de segunda a domingo: meio-dia da quarta-feira da semana anterior (cai sempre dentro dela, seja qual for o dia de hoje).
const quartaDaSemanaPassada = () => { const d = new Date(); const seg = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); return new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() - 7 + 2, 12).getTime(); };
await passo('preparar uma história da semana passada na Capa', async () => {
  const csrf = await chefe.page.evaluate(async () => (await (await fetch('/api/auth/session')).json()).data.csrfToken);
  const atual = (await docs(chefe.ctx, 'stories')).find((d) => d.id === beto.id).data;
  const item = { id: 'pub1', pen: 'Beto Autor', bio: '', title: PUBLICADA, genre: 'Contos', text: 'A biblioteca afundou numa noite de chuva e os livros aprenderam a respirar debaixo da água. '.repeat(8), at: quartaDaSemanaPassada(), status: 'aprovada', check: { v: 1, at: Date.now(), revisadoPorEditor: true } };
  const r = await chefe.page.evaluate(async ([id, body, token]) => (await fetch('/api/db/stories/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify({ data: body }) })).status, [beto.id, { items: [...atual.items, item], consent: atual.consent }, csrf]);
  if (r !== 200) throw new Error('PUT ' + r);
  await abrir(ana.page, '#capa');
  await ana.page.locator('[data-act="page"]', { hasText: '1ª Página' }).first().click(); // estrelas e comentário ficam nas páginas da edição
  await ana.page.locator('[data-act="rate"][data-n="4"]:visible').first().waitFor({ timeout: 6000 });
});
await passo('avaliar com 4 estrelas', async () => {
  await ana.page.locator('[data-act="rate"][data-n="4"]:visible').first().click();
  await esperar(async () => (await docs(ana.ctx, 'ratings')).length === 1);
});
await passo('comentar e ver o comentário', async () => {
  await ana.page.locator('.cm-input:visible').first().fill('Gostei muito, parabéns!');
  await ana.page.locator('[data-act="cmsend"]:visible').first().click();
  await ana.page.getByText('Gostei muito, parabéns!').first().waitFor({ timeout: 5000 });
  if (!JSON.stringify(await docs(ana.ctx, 'comments')).includes('Gostei muito')) throw new Error('comentário não chegou ao servidor');
});
await passo('seguir o autor (pelo perfil)', async () => {
  await abrirNaCapa(ana.page);
  await ana.page.locator('[data-act="profile"]').first().click();
  const seguir = ana.page.locator(`[data-act="follow"][data-profile="${beto.id}"]`);
  await seguir.waitFor({ timeout: 5000 });
  await seguir.click();
  await esperar(async () => (await docs(ana.ctx, 'follows')).some((d) => d.id === ana.id && d.data.ids.includes(beto.id)));
});

// ---- chefe remove o conto: mede da confirmação até a tela mudar; o autor vê o aviso
let tempoRemover = 0;
await passo('chefe remove o conto (a tela muda na hora) e o autor vê o aviso com o motivo', async () => {
  await abrir(chefe.page, '#envios');
  await chefe.page.evaluate(() => { window.prompt = () => 'Motivo de teste do roteiro'; });
  await chefe.page.getByText(TITULO).first().waitFor({ timeout: 8000 });
  await chefe.page.getByText(TITULO).first().click(); // abre o leitor do conto aprovado
  const rm = chefe.page.locator('.article [data-act="delstory"]').first();
  await rm.waitFor({ timeout: 5000 });
  await rm.click(); // 1º clique arma ("Confirmar remoção")
  const confirmar = chefe.page.getByRole('button', { name: /Confirmar remoção/ });
  await confirmar.first().waitFor({ timeout: 3000 });
  const t0 = Date.now();
  await confirmar.first().click();
  await esperar(async () => (await confirmar.count()) === 0, 6000, 10);
  tempoRemover = Date.now() - t0;
  if (JSON.stringify(await docs(chefe.ctx, 'stories')).includes(TITULO)) throw new Error('conto continua no servidor');
  await abrir(beto.page, '#capa');
  await beto.page.getByText('Motivo de teste do roteiro').first().waitFor({ timeout: 8000 });
  return `tela mudou em ${tempoRemover} ms`;
});

// ---- perfil
await passo('editar o perfil e ver depois de recarregar', async () => {
  await abrir(ana.page, '#perfil');
  await ana.page.locator('[data-act="editprofile"]').first().click();
  const bio = ana.page.locator('#pf-bio-input'); await bio.waitFor({ timeout: 5000 });
  await bio.fill('Bio nova escrita pelo roteiro.');
  await ana.page.locator('[data-act="saveprofile"]').click();
  await esperar(async () => JSON.stringify(await docs(ana.ctx, 'profiles')).includes('Bio nova escrita pelo roteiro.'));
  await abrir(ana.page, '#perfil');
  await ana.page.getByText('Bio nova escrita pelo roteiro.').first().waitFor({ timeout: 5000 });
});

await passo('nenhum erro de script no console (todas as sessões)', async () => {
  const todos = [...ana.page.erros, ...beto.page.erros, ...chefe.page.erros];
  if (todos.length) throw new Error(todos[0].slice(0, 100));
});

await browser.close();
console.table(resultados);
const falhas = resultados.filter((r) => r.resultado !== 'passou').length;
console.log(falhas ? `${falhas} fluxo(s) falharam` : 'todos os fluxos passaram');
console.log(`criar conto: ${tempoCriar} ms · remover conto: ${tempoRemover} ms (da ação até a tela confirmar, servidor local)`);
process.exit(falhas ? 1 : 0);
