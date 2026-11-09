/* Fundo por tema: 3 cenários (Canvas 2D) para cada seção, barra no topo com 1·2·3 e setinha para esconder.
   scenes.js define window.TEMAS e window.CENAS. API: Fundos.tema(nomeOuId) troca de seção; a opção 1-3 de cada tema fica salva no navegador. */
(function init() {
  'use strict';
  // scenes.js (97 KB) só é baixado quando o fundo vai ser desenhado; o layout carrega apenas este arquivo
  if (!window.CENAS) {
    if (!window.__cenasCarregando) { window.__cenasCarregando = 1; var sc = document.createElement('script'); sc.src = '/fundos/scenes.js'; sc.async = true; document.head.appendChild(sc); }
    return void setTimeout(init, 50);
  }
  var KEY = 'fundo-opt', canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  canvas.id = 'dream'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Fundo ilustrado do tema escolhido.');
  document.body.insertBefore(canvas, document.body.firstChild);
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tema = TEMAS[0], opt = 1, current = null, draw = null, last = 0, start = performance.now(), saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function setup() {
    if (!current) return;
    var dpr = Math.min(devicePixelRatio || 1, 1.5), W = innerWidth, H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.textAlign = 'start';
    // o cenário ocupa uma faixa no topo (stage); abaixo dela a última linha é esticada e a folha do jornal começa logo depois
    var stage = Math.round(Math.max(220, Math.min(H * .32, 340)));
    document.documentElement.style.setProperty('--stage', stage + 'px');
    var inner = current({ ctx: ctx, W: W, H: stage, rnd: mulberry(7) });
    draw = function (t, dt) {
      inner(t, dt); ctx.globalAlpha = 1;
      if (H > stage) ctx.drawImage(canvas, 0, (stage - 2) * dpr, W * dpr, 2 * dpr, 0, stage, W, H - stage + 1);
      var g = ctx.createLinearGradient(0, stage, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); ctx.fillStyle = g; ctx.fillRect(0, stage, W, H - stage);
    };
    draw(0, 0);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || !draw || now - last < 33) return;
    var dt = Math.min((now - last) / 1000, .1); last = now; draw((now - start) / 1000, dt);
  }

  var bar = document.createElement('nav'); bar.id = 'fundo-bar'; bar.setAttribute('aria-label', 'Fundo do tema');
  bar.innerHTML = '<strong id="fundo-tema"></strong><span id="fundo-opts"></span><button type="button" id="fundo-toggle" aria-expanded="true" aria-label="Ocultar barra de fundos" title="Ocultar barra de fundos">▲</button>';
  document.body.appendChild(bar);
  var cap = document.createElement('div'); cap.id = 'fundo-cap'; document.body.appendChild(cap);
  var nameEl = bar.querySelector('#fundo-tema'), optsEl = bar.querySelector('#fundo-opts'), tg = bar.querySelector('#fundo-toggle');
  tg.onclick = function () {
    var h = document.body.classList.toggle('fundo-oculto'), txt = h ? 'Mostrar barra de fundos' : 'Ocultar barra de fundos';
    tg.textContent = h ? '▼' : '▲'; tg.setAttribute('aria-expanded', String(!h)); tg.setAttribute('aria-label', txt); tg.title = txt;
  };
  function show() {
    nameEl.textContent = cap.textContent = tema.name; optsEl.innerHTML = '';
    [1, 2, 3].forEach(function (n) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.title = CENAS[tema.id][n - 1].name;
      b.setAttribute('aria-pressed', String(n === opt));
      b.onclick = function () { opt = n; saved[tema.id] = n; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} show(); };
      optsEl.appendChild(b);
    });
    current = CENAS[tema.id][opt - 1].init; start = performance.now(); setup();
  }
  window.Fundos = {
    // aceita id ("contos") ou nome ("Contos"); seção desconhecida (criada pela pessoa) mantém o tema atual
    tema: function (x) {
      var t = TEMAS.filter(function (k) { return k.id === x || k.name === x; })[0];
      if (!t || t === tema && current) return;
      tema = t; opt = saved[t.id] >= 1 && saved[t.id] <= 3 ? saved[t.id] : 1; show();
    }
  };
  addEventListener('resize', function () { clearTimeout(window.__fundoR); window.__fundoR = setTimeout(setup, 150); });
  opt = saved[tema.id] >= 1 && saved[tema.id] <= 3 ? saved[tema.id] : 1; show();
  if (!reduced) requestAnimationFrame(frame);
})();
