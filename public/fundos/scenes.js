/* Cenários de fundo por tema: 3 ideias para cada um dos 7 temas. Canvas 2D, sem shaders, sem vermelho.
   Cada cenário: function (c) { ...preparo...; return function (t, dt) { ...desenho... }; } */
(function () {
  'use strict';
  var TAU = Math.PI * 2, PAPER = '#f4ecd8', INK = '#17130f', AMBER = '#ffc477';
  var WORDS = 'ContosPoemasCrônicasSonhoTintaVersoAsas';

  function sky(c, stops, to) {
    var g = c.ctx.createLinearGradient(0, 0, 0, to || c.H);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    c.ctx.fillStyle = g; c.ctx.fillRect(0, 0, c.W, c.H);
  }
  function poly(ctx, pts, fill) { ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fill(); }
  function glow(ctx, x, y, r, rgb, a) { var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  // letras que sobem (dir -1) ou caem (dir 1)
  function floaters(c, o) {
    var list = [], i;
    for (i = 0; i < o.n; i++) list.push({ x: c.rnd() * c.W, y: c.rnd() * c.H, v: o.vmin + c.rnd() * (o.vmax - o.vmin), s: o.smin + c.rnd() * (o.smax - o.smin), ch: (o.words || WORDS).charAt(Math.floor(c.rnd() * (o.words || WORDS).length)), ph: c.rnd() * 6 });
    return function (t, dt) {
      var ctx = c.ctx; ctx.textAlign = 'center'; ctx.fillStyle = o.color; ctx.globalAlpha = o.alpha;
      list.forEach(function (l) {
        l.y += o.dir * l.v * dt; if (l.y > c.H + 20) l.y = -20; if (l.y < -20) l.y = c.H + 20;
        ctx.font = (o.italic ? 'italic ' : '') + l.s + 'px "Old Standard TT", Georgia, serif'; ctx.fillText(l.ch, l.x + Math.sin(t * .6 + l.ph) * 14, l.y);
      });
      ctx.globalAlpha = 1;
    };
  }
  function hills(c, color, base, amp, f, off) {
    var ctx = c.ctx; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, c.H);
    for (var x = 0; x <= c.W; x += 20) ctx.lineTo(x, base + Math.sin(x * f + off) * amp + Math.sin(x * f * 2.3 + off * 2) * amp * .4);
    ctx.lineTo(c.W, c.H); ctx.closePath(); ctx.fill();
  }
  function textLines(ctx, x, y, w, h, color) { ctx.fillStyle = color; for (var yy = y + 4; yy < y + h - 3; yy += 6) ctx.fillRect(x + 3, yy, w - 6 - (yy % 4) * 5, 1.5); }

  // Ajudantes de luz usados pelos cenários: estrelas, lua com halo, bokeh de primeiro plano.
  function starfield(c, n, ymax) {
    var l = [], i; for (i = 0; i < n; i++) l.push({ x: c.rnd() * c.W, y: c.rnd() * c.H * ymax, r: .6 + c.rnd() * 1.2, ph: c.rnd() * 6 });
    return function (t) { var ctx = c.ctx; l.forEach(function (s) { ctx.fillStyle = 'rgba(255,240,215,' + (.25 + .35 * Math.sin(t * 1.4 + s.ph)) + ')'; ctx.fillRect(s.x, s.y, s.r, s.r); }); };
  }
  function moon(ctx, x, y, r, rgb) {
    addGlow(ctx, x, y, r * 5, rgb, .25); addGlow(ctx, x, y, r * 2, rgb, .35);
    var g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, '#fffbe8'); g.addColorStop(1, '#e8d6a8'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function bokehLayer(c, n, rgb, a) {
    var l = [], i; for (i = 0; i < n; i++) l.push({ x: c.rnd() * c.W, y: c.rnd() * c.H, r: 16 + c.rnd() * 30, v: 2 + c.rnd() * 5, ph: c.rnd() * 6 });
    return function (t, dt) {
      var ctx = c.ctx; ctx.globalCompositeOperation = 'lighter';
      l.forEach(function (b) { b.y -= b.v * dt; if (b.y < -b.r) b.y = c.H + b.r; var x = b.x + Math.sin(t * .2 + b.ph) * 18; ctx.fillStyle = 'rgba(' + rgb + ',' + a + ')'; ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(' + rgb + ',' + a * 1.6 + ')'; ctx.lineWidth = 1.5; ctx.stroke(); });
      ctx.globalCompositeOperation = 'source-over';
    };
  }

  var S = {};

    /* ================= CONTOS ================= */
  S.contos = [
    { name: 'Vila de casinhas de papel', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), st = starfield(c, 60, .5), bk = bokehLayer(c, 7, '255,200,130', .05), houses = [], smoke = [], fireflies = [], base = H * .8, x = -20, mx = W * .78, my = H * .2, i;
      while (x < W + 40) { var w = 50 + rnd() * 50, h = 36 + rnd() * 40; houses.push({ x: x, w: w, h: h, lit: rnd() < .7, ph: rnd() * 6, chim: rnd() < .6 }); x += w + 8 + rnd() * 26; }
      for (i = 0; i < 22; i++) fireflies.push({ x: rnd() * W, y: base - rnd() * H * .3, ph: rnd() * 6 });
      return function (t, dt) {
        sky(c, [[0, '#070d24'], [.55, '#1d2c5e'], [1, '#7a6a96']], base); st(t); moon(ctx, mx, my, 16, '200,215,255');
        hills(c, '#16224a', base - 46, 24, .007, 1);
        var fg = ctx.createLinearGradient(0, base - 70, 0, base); fg.addColorStop(0, 'rgba(120,130,190,0)'); fg.addColorStop(1, 'rgba(120,130,190,.35)'); ctx.fillStyle = fg; ctx.fillRect(0, base - 70, W, 70); // névoa no vale
        hills(c, '#0f1938', base - 26, 18, .011, 4);
        var gg = ctx.createLinearGradient(0, base, 0, H); gg.addColorStop(0, '#0e1636'); gg.addColorStop(1, '#050813'); ctx.fillStyle = gg; ctx.fillRect(0, base, W, H - base);
        houses.forEach(function (hs) {
          var top = base - hs.h, on = hs.lit && Math.sin(t * .8 + hs.ph) > -.85;
          ctx.fillStyle = '#8f8aa0'; ctx.fillRect(hs.x, top, hs.w, hs.h); ctx.fillStyle = 'rgba(200,215,255,.3)'; ctx.fillRect(hs.x + hs.w - 6, top, 6, hs.h); // luz da lua na quina
          ctx.fillStyle = 'rgba(10,14,40,.35)'; ctx.fillRect(hs.x, top, hs.w * .4, hs.h); textLines(ctx, hs.x, top, hs.w, hs.h, 'rgba(23,19,15,.18)');
          poly(ctx, [[hs.x - 5, top], [hs.x + hs.w / 2, top - hs.w * .45], [hs.x + hs.w + 5, top]], '#1c2745'); ctx.strokeStyle = 'rgba(200,215,255,.65)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hs.x + hs.w / 2, top - hs.w * .45); ctx.lineTo(hs.x + hs.w + 5, top); ctx.stroke();
          if (hs.chim) { ctx.fillStyle = '#2a2638'; ctx.fillRect(hs.x + hs.w * .7, top - hs.w * .4, 8, hs.w * .3); if (Math.random() < .03) smoke.push({ x: hs.x + hs.w * .7 + 4, y: top - hs.w * .4, a: 0, ch: WORDS.charAt(Math.floor(Math.random() * WORDS.length)) }); }
          ctx.fillStyle = on ? '#ffd27a' : '#2a3556'; ctx.fillRect(hs.x + hs.w * .25, top + hs.h * .3, 9, 12); ctx.fillRect(hs.x + hs.w * .6, top + hs.h * .3, 9, 12);
          if (on) { addGlow(ctx, hs.x + hs.w * .3, top + hs.h * .45, 46, '255,190,110', .45); addGlow(ctx, hs.x + hs.w * .65, top + hs.h * .45, 46, '255,190,110', .4); ctx.save(); ctx.translate(hs.x + hs.w / 2, base + 6); ctx.scale(2.2, .3); glow(ctx, 0, 0, hs.w * .5, '255,190,110', .35); ctx.restore(); }
        });
        ctx.textAlign = 'center'; smoke = smoke.filter(function (s) { s.y -= 18 * dt; s.x += 8 * dt; s.a += dt; ctx.globalAlpha = Math.max(0, .8 - s.a / 6); ctx.fillStyle = PAPER; ctx.font = '16px "Old Standard TT",serif'; ctx.fillText(s.ch, s.x, s.y); ctx.globalAlpha = 1; return s.a < 6; });
        ctx.fillStyle = '#050813'; for (x = 0; x < W; x += 9) { ctx.fillRect(x, H - 26 - (x % 27 < 9 ? 6 : 0), 5, 30); } ctx.fillRect(0, H - 12, W, 12); // cerca em primeiro plano
        fireflies.forEach(function (f) { var a = .5 + .5 * Math.sin(t * 2 + f.ph); addGlow(ctx, f.x + Math.sin(t * .5 + f.ph) * 30, f.y + Math.cos(t * .4 + f.ph) * 14, 14, '255,230,150', a * .6); });
        bk(t, dt); film(.55);
      };
    } },
    { name: 'Estrada com ônibus noturno', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, hz = H * .55, film = finish(c), st = starfield(c, 50, .45), bk = bokehLayer(c, 6, '255,200,130', .05), fl = floaters(c, { n: 26, dir: -1, vmin: 8, vmax: 20, smin: 12, smax: 22, color: PAPER, alpha: .5 });
      return function (t, dt) {
        sky(c, [[0, '#0d0826'], [.7, '#3b2a6a'], [1, '#d8a070']], hz); st(t); addGlow(ctx, W / 2, hz, W * .5, '255,170,110', .3);
        hills(c, '#1d1545', hz - 10, 18, .006, 2); hills(c, '#120d30', hz - 2, 10, .011, 5);
        var gd = ctx.createLinearGradient(0, hz, 0, H); gd.addColorStop(0, '#1a1428'); gd.addColorStop(1, '#0a0812'); ctx.fillStyle = gd; ctx.fillRect(0, hz, W, H - hz);
        poly(ctx, [[W * .46, hz], [W * .54, hz], [W * 1.1, H], [-W * .1, H]], '#241f34'); // estrada molhada em perspectiva
        var k, z, y, w;
        for (k = 0; k < 9; k++) { z = ((k / 9 + t * .12) % 1); y = hz + z * z * (H - hz); w = 2 + z * 14; ctx.fillStyle = '#e9dcb0'; ctx.fillRect(W / 2 - w / 2, y, w, 4 + z * 40); }
        for (k = 0; k < 6; k++) { var zz = ((k / 6 + t * .12) % 1), side = k % 2 ? 1 : -1, px = W / 2 + side * (W * .08 + zz * zz * W * .62), py = hz + zz * zz * (H - hz), sc = .2 + zz * 1.6;
          ctx.fillStyle = '#0a0812'; ctx.fillRect(px - 2 * sc, py - 90 * sc, 4 * sc, 90 * sc); ctx.fillRect(px - 2 * sc, py - 90 * sc, side * -14 * sc, 3 * sc);
          var lx = px - side * 14 * sc, ly = py - 88 * sc; addGlow(ctx, lx, ly, 70 * sc, '255,196,119', .6);
          ctx.save(); ctx.translate(px, py + 8 * sc); ctx.scale(.18, 1); addGlow(ctx, 0, 0, 120 * sc, '255,196,119', .12 + .1 * zz); ctx.restore(); // reflexo do poste no asfalto
          ctx.fillStyle = '#ffe9b0'; ctx.fillRect(lx - 3 * sc, ly - 1, 6 * sc, 3 * sc); }
        var bx = ((t * 40) % (W + 400)) - 200, by = hz + 26; // ônibus cruzando uma travessa distante
        ctx.fillStyle = '#e8d9a8'; roundBox(ctx, bx, by - 46, 150, 46, 10); ctx.fill(); ctx.fillStyle = 'rgba(20,12,40,.4)'; ctx.fillRect(bx, by - 18, 150, 18);
        ctx.fillStyle = '#ffd27a'; for (k = 0; k < 6; k++) { ctx.fillRect(bx + 10 + k * 23, by - 38, 16, 14); addGlow(ctx, bx + 18 + k * 23, by - 31, 24, '255,196,119', .35); }
        ctx.fillStyle = '#0a0812'; ctx.beginPath(); ctx.arc(bx + 30, by, 8, 0, TAU); ctx.arc(bx + 120, by, 8, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; var bm = ctx.createLinearGradient(bx + 150, 0, bx + 330, 0); bm.addColorStop(0, 'rgba(255,236,170,.4)'); bm.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = bm; ctx.beginPath(); ctx.moveTo(bx + 150, by - 14); ctx.lineTo(bx + 330, by - 50); ctx.lineTo(bx + 330, by + 12); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; // farol
        addGlow(ctx, bx + 156, by - 14, 50, '255,236,170', .8); ctx.save(); ctx.translate(bx + 75, by + 6); ctx.scale(2.4, .25); glow(ctx, 0, 0, 80, '255,196,119', .3); ctx.restore();
        fl(t, dt); bk(t, dt); film(.6);
      };
    } },
    { name: 'Telhados à noite e a gata', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), bk = bokehLayer(c, 6, '200,215,255', .04), stars = [], far = [], roofs = [], smoke = [], mx = W * .28, my = H * .24, sc = Math.max(.8, Math.min(1.2, H / 300)), cat, x, i;
      for (i = 0; i < 36; i++) stars.push({ x: rnd() * W, y: rnd() * H * .42, w: ['sonho', 'luz', 'conto', 'noite', 'gata'][Math.floor(rnd() * 5)], s: 12 + rnd() * 8, ph: rnd() * 6 });
      for (x = -30; x < W + 40; x += 50 + rnd() * 50) far.push({ x: x, w: 60 + rnd() * 50, e: H * (.5 + rnd() * .08) });
      for (x = -20; x < W + 40;) { var w = 90 + rnd() * 70; roofs.push({ x: x, w: w, e: H * (.6 + rnd() * .12), rise: w * (.2 + rnd() * .1), win: rnd() < .6, chim: rnd() < .5 }); x += w; }
      cat = roofs.reduce(function (b, r) { return Math.abs(r.x + r.w / 2 - W * .68) < Math.abs(b.x + b.w / 2 - W * .68) ? r : b; }); // a gata senta na cumeeira do telhado mais próximo de 68% da largura
      return function (t, dt) {
        sky(c, [[0, '#08102a'], [.7, '#1f2f5c'], [1, '#6a6a96']]); addGlow(ctx, mx, my, W * .4, '170,190,255', .22);
        ctx.textAlign = 'center'; stars.forEach(function (s) { ctx.globalAlpha = .3 + .35 * Math.sin(t + s.ph); ctx.fillStyle = PAPER; ctx.font = 'italic ' + s.s + 'px "Old Standard TT",serif'; ctx.fillText(s.w, s.x, s.y); }); ctx.globalAlpha = 1;
        moon(ctx, mx, my, 30, '200,215,255');
        far.forEach(function (f) { ctx.fillStyle = '#2a3868'; ctx.fillRect(f.x, f.e, f.w, H); poly(ctx, [[f.x - 4, f.e + 2], [f.x + f.w / 2, f.e - f.w * .22], [f.x + f.w + 4, f.e + 2]], '#2a3868'); }); // casas distantes, azuladas pela distância
        roofs.forEach(function (r) {
          var px = r.x + r.w / 2, py = r.e - r.rise, cx = r.x + r.w * .66;
          ctx.fillStyle = '#0b122c'; ctx.fillRect(r.x, r.e, r.w, H); // parede
          if (r.chim) { ctx.fillRect(cx, py - 6, 9, r.rise * .8 + 8); if (Math.random() < .02) smoke.push({ x: cx + 4, y: py - 8, a: 0 }); }
          poly(ctx, [[r.x - 6, r.e + 3], [px, py], [r.x + r.w + 6, r.e + 3]], '#0e1735'); // telhado de duas águas, caimento suave
          ctx.strokeStyle = 'rgba(190,205,255,' + (r.x < mx ? .7 : .35) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x - 6, r.e + 3); ctx.lineTo(px, py); ctx.lineTo(r.x + r.w + 6, r.e + 3); ctx.stroke(); // luz de borda da lua
          if (r.win) { ctx.fillStyle = '#ffd27a'; ctx.fillRect(r.x + r.w * .25, r.e + 14, 9, 12); addGlow(ctx, r.x + r.w * .25 + 4, r.e + 20, 34, '255,190,110', .45); }
        });
        smoke = smoke.filter(function (s) { s.y -= 12 * dt; s.x += 6 * dt; s.a += dt; addGlow(ctx, s.x, s.y, 12 + s.a * 5, '150,165,215', Math.max(0, .18 - s.a / 30)); return s.a < 5; });
        var gx = cat.x + cat.w / 2, gy = cat.e - cat.rise + 2, sw = Math.sin(t * 1.5) * 3; // a gata de perfil, sentada na cumeeira, olhando a lua
        ctx.save(); ctx.translate(gx, gy); ctx.scale(sc, sc); ctx.fillStyle = ctx.strokeStyle = '#03050a';
        ctx.beginPath(); ctx.ellipse(2, -9, 8, 11, -.1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-4, -24, 6.5, 0, TAU); ctx.fill();
        poly(ctx, [[-10.5, -26], [-9.5, -35], [-4.5, -29.5]], '#03050a'); poly(ctx, [[-4, -29.5], [.5, -35], [1.5, -25]], '#03050a');
        ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(8, -3); ctx.quadraticCurveTo(24, 1, 22 + sw, -14); ctx.stroke(); // cauda
        ctx.strokeStyle = 'rgba(190,205,255,.65)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-4, -24, 6.5, Math.PI * .6, Math.PI * 1.2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(2, -9, 8, 11, -.1, Math.PI * .7, Math.PI * 1.2); ctx.stroke();
        if (Math.sin(t * .7) < .97) { addGlow(ctx, -8, -24, 8, '255,215,120', .9); ctx.fillStyle = '#ffd77a'; ctx.fillRect(-9, -25, 2, 2); }
        ctx.restore();
        bk(t, dt); film(.6);
      };
    } },
  ];

  /* ================= POEMAS ================= */
  S.poemas = [
    { name: 'Chuva de versos na janela', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), drops = [], lights = [], VERSOS = ['chuva', 'saudade', 'silêncio', 'vidro', 'verso', 'gota'], i;
      for (i = 0; i < 46; i++) drops.push({ x: rnd() * W, y: rnd() * H, r: 3 + rnd() * 6, v: 14 + rnd() * 40, w: VERSOS[Math.floor(rnd() * VERSOS.length)], tail: 40 + rnd() * 90 });
      for (i = 0; i < 26; i++) lights.push({ x: rnd() * W, y: H * (.35 + rnd() * .5), r: 16 + rnd() * 34, rgb: ['255,200,120', '150,190,255', '255,225,170', '190,170,255'][Math.floor(rnd() * 4)], ph: rnd() * 6 });
      return function (t, dt) {
        sky(c, [[0, '#18233a'], [1, '#33425c']]);
        lights.forEach(function (l) { addGlow(ctx, l.x, l.y, l.r * 2.2, l.rgb, .22 + .08 * Math.sin(t * .6 + l.ph)); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(' + l.rgb + ',.12)'; ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }); // a cidade desfocada atrás do vidro
        ctx.fillStyle = 'rgba(190,205,225,.12)'; ctx.fillRect(0, 0, W, H); // embaçado
        drops.forEach(function (d) {
          d.y += d.v * dt; if (d.y > H + d.tail) { d.y = -10; d.x = Math.random() * W; }
          var g = ctx.createLinearGradient(0, d.y - d.tail, 0, d.y); g.addColorStop(0, 'rgba(230,240,255,0)'); g.addColorStop(1, 'rgba(230,240,255,.3)');
          ctx.strokeStyle = g; ctx.lineWidth = d.r * .5; ctx.beginPath(); ctx.moveTo(d.x, d.y - d.tail); ctx.lineTo(d.x, d.y); ctx.stroke();
          var gd = ctx.createRadialGradient(d.x - d.r * .3, d.y - d.r * .3, d.r * .1, d.x, d.y, d.r); gd.addColorStop(0, 'rgba(255,255,255,.5)'); gd.addColorStop(.55, 'rgba(190,210,235,.1)'); gd.addColorStop(1, 'rgba(15,25,45,.55)');
          ctx.fillStyle = gd; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill(); addGlow(ctx, d.x + d.r * .3, d.y + d.r * .35, d.r * 1.2, '255,205,140', .25); // a gota é lente: pega a luz da cidade
          ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(d.x - d.r * .35, d.y - d.r * .35, d.r * .25, 0, TAU); ctx.fill();
          ctx.globalAlpha = .35; ctx.fillStyle = PAPER; ctx.font = 'italic 15px "Old Standard TT",serif'; ctx.textAlign = 'center'; ctx.fillText(d.w, d.x, d.y - d.tail * .6); ctx.globalAlpha = 1;
        });
        ctx.fillStyle = '#0a111c'; ctx.fillRect(0, 0, W * .025, H); ctx.fillRect(W * .975, 0, W * .025, H); ctx.fillStyle = 'rgba(190,205,225,.5)'; ctx.fillRect(W * .025, 0, 1.5, H); // caixilho da janela
        var sl = ctx.createLinearGradient(0, H * .9, 0, H); sl.addColorStop(0, 'rgba(10,17,28,0)'); sl.addColorStop(1, '#0a111c'); ctx.fillStyle = sl; ctx.fillRect(0, H * .9, W, H * .1);
        film(.5);
      };
    } },
    { name: 'Pena, tinteiro e versos', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), bk = bokehLayer(c, 8, '255,200,130', .05), VERSOS = ['luz', 'verso', 'saudade', 'voz', 'rima', 'lua', 'sonho', 'silêncio'], parts = [], dy = H * .8, ix = W * .3, cx = W * .72, sc = Math.max(.75, Math.min(1.2, H / 300)), i;
      function spawn(age) { var vy = -(10 + rnd() * 8), vx = (rnd() - .3) * 60; return { x: ix + 4 + vx * age, y: dy - 30 * sc + vy * age, vx: vx, vy: vy, life: age, max: 5 + rnd() * 3, w: VERSOS[Math.floor(rnd() * VERSOS.length)], s: 14 + rnd() * 8, ph: rnd() * 6 }; }
      for (i = 0; i < 14; i++) parts.push(spawn(rnd() * 4)); // já começa com versos no ar (quadro único em movimento reduzido)
      return function (t, dt) {
        sky(c, [[0, '#1a1218'], [1, '#3a2418']], dy); addGlow(ctx, cx, dy - 60 * sc, W * .45, '255,170,90', .3);
        var dg = ctx.createLinearGradient(0, dy, 0, H); dg.addColorStop(0, '#4a2e1a'); dg.addColorStop(1, '#241408'); ctx.fillStyle = dg; ctx.fillRect(0, dy, W, H - dy); ctx.fillStyle = 'rgba(255,200,130,.3)'; ctx.fillRect(0, dy, W, 1.5); // mesa de madeira
        ctx.save(); ctx.translate(W * .5, dy + (H - dy) * .55); ctx.rotate(-.05); ctx.fillStyle = '#f1e6c8'; ctx.fillRect(-60, -14, 120, 28); textLines(ctx, -60, -14, 120, 28, 'rgba(23,19,15,.4)'); ctx.restore(); // folha com versos escritos
        ctx.save(); ctx.translate(ix, dy); ctx.scale(sc, sc); // tinteiro e pena
        var sway = Math.sin(t * .8) * .02; ctx.save(); ctx.rotate(sway); ctx.lineCap = 'round';
        ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(44, -122); ctx.stroke();
        ctx.save(); ctx.translate(30, -92); ctx.rotate(Math.atan2(-92, 44)); ctx.fillStyle = 'rgba(244,236,216,.92)'; ctx.beginPath(); ctx.ellipse(0, 0, 38, 9, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(23,19,15,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-38, 0); ctx.lineTo(38, 0); ctx.stroke(); ctx.restore(); ctx.restore();
        ctx.fillStyle = '#0c0a12'; ctx.fillRect(-17, -24, 34, 26); ctx.fillRect(-10, -31, 20, 8); ctx.beginPath(); ctx.ellipse(0, -31, 10, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-14, -22, 3, 20); ctx.restore();
        ctx.save(); ctx.translate(cx, dy); ctx.scale(sc, sc); // vela
        ctx.fillStyle = '#b8893a'; ctx.fillRect(-14, -4, 28, 6); var cg = ctx.createLinearGradient(-6, 0, 6, 0); cg.addColorStop(0, '#d8caa0'); cg.addColorStop(1, '#f6ecd0'); ctx.fillStyle = cg; ctx.fillRect(-6, -52, 12, 48); ctx.fillStyle = '#2a1a10'; ctx.fillRect(-.75, -57, 1.5, 5);
        var f = 1 + .08 * Math.sin(t * 11) + .05 * Math.sin(t * 7.3); addGlow(ctx, 0, -66, 36, '255,190,110', .5); ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.ellipse(0, -66, 4, 10 * f, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.ellipse(0, -63, 2, 5 * f, 0, 0, TAU); ctx.fill(); ctx.restore();
        if (parts.length < 26 && Math.random() < dt * 2.2) parts.push(spawn(0)); // versos sobem da tinta como fumaça
        ctx.textAlign = 'center'; parts = parts.filter(function (p) {
          p.life += dt; if (p.life > p.max) return false; p.y += p.vy * dt; p.x += p.vx * dt + Math.sin(p.life * 1.2 + p.ph) * 10 * dt;
          ctx.globalAlpha = Math.sin(Math.PI * p.life / p.max) * .85; ctx.fillStyle = '#ffd6a0'; ctx.font = 'italic ' + p.s + 'px "Old Standard TT",serif'; ctx.fillText(p.w, p.x, p.y); ctx.globalAlpha = 1; return true;
        });
        bk(t, dt); film(.55);
      };
    } },
    { name: 'Lago de tinta com ondas', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), st = starfield(c, 50, .4), bk = bokehLayer(c, 6, '255,200,130', .05), ripples = [], falling = [], reeds = [], VERSOS = ['luz', 'verso', 'sombra', 'voz', 'rio', 'sonho'], next = 0, hz = H * .45, mx = W * .5, my = H * .2, i;
      for (i = 0; i < 16; i++) reeds.push({ x: i % 2 ? W * (.86 + rnd() * .14) : W * rnd() * .14, h: H * (.2 + rnd() * .3), ph: rnd() * 6 });
      return function (t, dt) {
        sky(c, [[0, '#04090f'], [.5, '#0e2a30'], [1, '#04090c']]); st(t);
        sky(c, [[0, '#0b1d2a'], [1, '#133a40']], hz); st(t); moon(ctx, mx, my, 26, '255,225,170');
        ctx.fillStyle = '#04090c'; ctx.beginPath(); ctx.moveTo(0, hz); for (var x = 0; x <= W; x += 24) ctx.lineTo(x, hz - 6 - Math.abs(Math.sin(x * .013)) * 12); ctx.lineTo(W, hz); ctx.fill(); // margem distante
        var lg = ctx.createLinearGradient(0, hz, 0, H); lg.addColorStop(0, '#0c2830'); lg.addColorStop(1, '#03080b'); ctx.fillStyle = lg; ctx.fillRect(0, hz, W, H - hz);
        ctx.globalCompositeOperation = 'lighter'; for (var y = hz + 2; y < H; y += 4) { var f = (y - hz) / (H - hz), w = (22 + f * 70) * (.6 + .4 * Math.sin(y * .4 + t * 1.6)), o = Math.sin(y * .2 + t) * 6 * f; ctx.fillStyle = 'rgba(255,225,170,' + (.5 - f * .35) + ')'; ctx.fillRect(mx - w / 2 + o, y, w, 1.6); } ctx.globalCompositeOperation = 'source-over'; // reflexo da lua tremendo na água
        var mg = ctx.createLinearGradient(0, hz - 10, 0, hz + 50); mg.addColorStop(0, 'rgba(150,190,190,0)'); mg.addColorStop(.4, 'rgba(150,190,190,.18)'); mg.addColorStop(1, 'rgba(150,190,190,0)'); ctx.fillStyle = mg; ctx.fillRect(0, hz - 10, W, 60); // névoa na linha d'água
        if (t > next) { next = t + .9 + Math.random() * 1.2; falling.push({ x: Math.random() * W, y: -20, y1: hz + (H - hz) * (.2 + Math.random() * .7), w: VERSOS[Math.floor(Math.random() * VERSOS.length)] }); }
        ctx.textAlign = 'center';
        falling = falling.filter(function (f) { f.y += 220 * dt; ctx.fillStyle = PAPER; ctx.font = 'italic 18px "Old Standard TT",serif'; ctx.fillText(f.w, f.x, f.y); addGlow(ctx, f.x, f.y - 4, 22, '255,196,119', .35); if (f.y >= f.y1) { ripples.push({ x: f.x, y: f.y1, r: 0 }); return false; } return true; });
        ripples = ripples.filter(function (r) { r.r += 60 * dt; var a = Math.max(0, 1 - r.r / 220); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,196,119,' + a * .6 + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * .3, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,196,119,' + a * .3 + ')'; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * .6, r.r * .18, 0, 0, TAU); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; return a > 0; });
        ctx.strokeStyle = '#02060a'; ctx.lineWidth = 3; reeds.forEach(function (r) { ctx.beginPath(); ctx.moveTo(r.x, H); ctx.quadraticCurveTo(r.x + Math.sin(t * .8 + r.ph) * 6, H - r.h * .5, r.x + Math.sin(t * .8 + r.ph) * 14, H - r.h); ctx.stroke(); });
        ctx.fillStyle = '#02060a'; ctx.fillRect(0, H - 4, W, 4); bk(t, dt); film(.6);
      };
    } },
  ];

  /* ================= AVENTURAS ================= */
  S.aventuras = [
    { name: 'Mapa antigo vivo', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), par = document.createElement('canvas'), g = par.getContext('2d'), pts = [], i, k;
      par.width = W; par.height = H;
      var bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#cdb07c'); bg.addColorStop(1, '#a8884f'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (i = 0; i < 260; i++) glow(g, rnd() * W, rnd() * H, 10 + rnd() * 60, '90,55,20', .04 + rnd() * .06); // manchas de tempo
      for (i = 0; i < 500; i++) { var fx = rnd() * W, fy = rnd() * H; g.strokeStyle = 'rgba(80,50,20,' + (.04 + rnd() * .06) + ')'; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + (rnd() - .5) * 30, fy + (rnd() - .5) * 30); g.stroke(); } // fibras do papel
      g.fillStyle = 'rgba(70,45,20,.08)'; for (var y = 0; y < H; y += 60) g.fillRect(0, y, W, 1); for (var x = 0; x < W; x += 60) g.fillRect(x, 0, 1, H);
      g.strokeStyle = 'rgba(60,40,20,.35)'; g.lineWidth = 1.2; for (i = 0; i < 70; i++) { var wx = rnd() * W, wy = rnd() * H; g.beginPath(); g.arc(wx, wy, 5, .2, Math.PI - .2); g.arc(wx + 10, wy, 5, .2, Math.PI - .2); g.stroke(); } // ondinhas do mar
      for (i = 0; i < 6; i++) { // ilhas com sombra, hachura e montanhas
        var ix = rnd() * W, iy = rnd() * H, ir = 22 + rnd() * 40, ph = rnd() * 6;
        function shape(dx, dy) { g.beginPath(); for (var a = 0; a <= TAU + .1; a += .4) { var rr = ir * (1 + .25 * Math.sin(a * 3 + ph)); g.lineTo(ix + dx + Math.cos(a) * rr, iy + dy + Math.sin(a) * rr * .7); } g.closePath(); }
        shape(4, 5); g.fillStyle = 'rgba(60,35,10,.3)'; g.fill(); shape(0, 0); g.fillStyle = '#dcc590'; g.fill(); g.save(); g.clip(); g.strokeStyle = 'rgba(90,61,28,.25)'; for (k = -ir; k < ir * 2; k += 5) { g.beginPath(); g.moveTo(ix - ir + k, iy - ir); g.lineTo(ix - ir + k - ir, iy + ir); g.stroke(); } g.restore();
        g.strokeStyle = '#5a3d1c'; g.lineWidth = 2; shape(0, 0); g.stroke();
        for (k = 0; k < 3; k++) { var mx = ix + (k - 1) * ir * .35, my = iy - 2 + (k % 2) * 5; g.fillStyle = '#8a6a3c'; g.beginPath(); g.moveTo(mx - 7, my + 6); g.lineTo(mx, my - 8); g.lineTo(mx + 7, my + 6); g.fill(); g.fillStyle = 'rgba(255,235,190,.5)'; g.beginPath(); g.moveTo(mx - 7, my + 6); g.lineTo(mx, my - 8); g.lineTo(mx, my + 6); g.fill(); }
      }
      var ev = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75); ev.addColorStop(0, 'rgba(40,24,8,0)'); ev.addColorStop(1, 'rgba(40,24,8,.65)'); g.fillStyle = ev; g.fillRect(0, 0, W, H); // bordas queimadas
      for (i = 0; i < 7; i++) pts.push([W * (.08 + i * .14) + (rnd() - .5) * 40, H * (.25 + .5 * rnd())]);
      var len = 0, seg = []; for (i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); len += d; }
      function at(f) { var dist = f * len, k2 = 0; while (k2 < seg.length - 1 && dist > seg[k2]) { dist -= seg[k2]; k2++; } var u = dist / seg[k2]; return [pts[k2][0] + (pts[k2 + 1][0] - pts[k2][0]) * u, pts[k2][1] + (pts[k2 + 1][1] - pts[k2][1]) * u]; }
      return function (t) {
        ctx.drawImage(par, 0, 0);
        ctx.strokeStyle = '#3a2610'; ctx.lineWidth = 3; ctx.setLineDash([10, 9]); ctx.lineDashOffset = -t * 12; ctx.beginPath(); pts.forEach(function (p, j) { j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke(); ctx.setLineDash([]);
        var e = pts[pts.length - 1]; addGlow(ctx, e[0], e[1], 60, '255,190,90', .5 + .15 * Math.sin(t * 3)); ctx.strokeStyle = '#3a2610'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(e[0] - 12, e[1] - 12); ctx.lineTo(e[0] + 12, e[1] + 12); ctx.moveTo(e[0] + 12, e[1] - 12); ctx.lineTo(e[0] - 12, e[1] + 12); ctx.stroke(); // X do tesouro
        var b = at((t * .04) % 1); ctx.save(); ctx.translate(b[0], b[1] + Math.sin(t * 2) * 2); ctx.rotate(Math.sin(t * 1.5) * .08); ctx.fillStyle = 'rgba(40,24,8,.3)'; ctx.fillRect(-14, 10, 30, 4); poly(ctx, [[-16, 0], [16, 0], [10, 9], [-10, 9]], '#3a2610'); poly(ctx, [[0, -2], [0, -26], [14, -2]], '#fbf6e6'); poly(ctx, [[0, -2], [0, -26], [-10, -2]], '#e0d2ae'); ctx.restore();
        var cx = W * .86, cy = H * .2; ctx.strokeStyle = '#3a2610'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 44, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 38, 0, TAU); ctx.stroke(); // bússola
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * .7) * .5); poly(ctx, [[0, -40], [7, 0], [0, 40], [-7, 0]], '#3a2610'); poly(ctx, [[0, -40], [7, 0], [-7, 0]], '#e8d9a8'); ctx.restore();
        var fk = .5 + .5 * Math.sin(t * 7) * Math.sin(t * 2.3); addGlow(ctx, W * .1, H * .12, W * .55, '255,185,100', .16 + .08 * fk); // luz de vela vacilando
        ctx.fillStyle = 'rgba(20,10,0,' + (.08 + .05 * (1 - fk)) + ')'; ctx.fillRect(0, 0, W, H); film(.4);
      };
    } },
    { name: 'Mar em tempestade', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), hz = H * .45, flash = 0, next = 2, bolt = [], rain = [], blobs = [], i;
      for (i = 0; i < 120; i++) rain.push({ x: rnd() * W, y: rnd() * H, v: 500 + rnd() * 300 });
      for (i = 0; i < 8; i++) blobs.push({ x: rnd() * W, y: 20 + rnd() * hz * .6, r: 90 + rnd() * 120, v: 6 + rnd() * 10 });
      return function (t, dt) {
        sky(c, [[0, '#0b121c'], [1, '#3b4a60']], hz);
        blobs.forEach(function (b) { b.x += b.v * dt; if (b.x > W + b.r) b.x = -b.r; ctx.save(); ctx.translate(b.x, b.y); ctx.scale(2, .6); glow(ctx, 0, 0, b.r, '10,16,26', .75); glow(ctx, 0, b.r * .2, b.r * .6, '60,75,100', .25 * flash); ctx.restore(); });
        if (t > next) { flash = 1; next = t + 2.5 + Math.random() * 3.5; var bx = W * (.15 + Math.random() * .7), by = 0; bolt = [[bx, by]]; while (by < hz) { bx += (Math.random() - .5) * 40; by += 14 + Math.random() * 20; bolt.push([bx, Math.min(by, hz)]); } }
        flash = Math.max(0, flash - dt * 2.5);
        if (flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(190,210,255,' + flash * .22 + ')'; ctx.fillRect(0, 0, W, hz); ctx.strokeStyle = 'rgba(235,242,255,' + flash + ')'; ctx.lineWidth = 2.2; ctx.beginPath(); bolt.forEach(function (p, j) { j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke(); ctx.strokeStyle = 'rgba(150,180,255,' + flash * .35 + ')'; ctx.lineWidth = 9; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
        for (var r = 0; r < 9; r++) {
          var y0 = hz + Math.pow(r / 9, 1.5) * (H - hz), L = 90 + r * 40, amp = 10 + r * 9, off = (t * (14 + r * 9)) % L, pts = [];
          ctx.fillStyle = 'rgb(' + (20 + r * 2 + Math.round(flash * 30)) + ',' + (40 + r * 4 + Math.round(flash * 36)) + ',' + (66 + r * 5 + Math.round(flash * 46)) + ')'; ctx.beginPath(); ctx.moveTo(-L, H);
          for (var x = -L; x <= W + L; x += L / 2) { var yy = y0 + (Math.round(x / (L / 2)) % 2 ? -amp : amp * .4); pts.push([x - off, yy]); ctx.lineTo(x - off, yy); } ctx.lineTo(W + L, H); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(225,238,255,' + (.18 + flash * .5) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); pts.forEach(function (p, j) { j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke(); // espuma na crista
          if (r === 6) { ctx.save(); ctx.translate(W * .72, y0 - amp); ctx.rotate(Math.sin(t * 1.4) * .25); poly(ctx, [[-30, 0], [30, 0], [20, 16], [-20, 16]], '#1a120c'); var sl = 190 + Math.round(flash * 60); poly(ctx, [[0, -4], [0, -46], [26, -4]], 'rgb(' + sl + ',' + sl + ',' + (sl - 20) + ')'); poly(ctx, [[0, -4], [0, -46], [-16, -4]], 'rgb(' + (sl - 50) + ',' + (sl - 50) + ',' + (sl - 60) + ')'); ctx.restore(); var lp = Math.sin(t * 1.4) * .25; addGlow(ctx, W * .72 + Math.sin(lp) * 46, y0 - amp - Math.cos(lp) * 46, 44, '255,190,100', .75); }
        }
        ctx.strokeStyle = 'rgba(200,215,235,.22)'; ctx.lineWidth = 1; ctx.beginPath(); rain.forEach(function (d) { d.y += d.v * dt; d.x -= d.v * .25 * dt; if (d.y > H) { d.y = -10; d.x = Math.random() * (W + 120); } ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 3, d.y - 14); }); ctx.stroke();
        film(.6);
      };
    } },
    { name: 'Montanhas de papel e a trilha', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), bk = bokehLayer(c, 6, '255,235,190', .06), layers = [], sx = W * .2, sy = H * .28, sc = Math.max(.8, Math.min(1.15, H / 300)), i, j;
      var cols = ['#d8b880', '#b09a78', '#7a8a82', '#4a6862', '#27434a'];
      for (i = 0; i < 5; i++) { var pts = [], x = -40; while (x < W + 80) { pts.push([x, H * (.24 + i * .06) - rnd() * H * .12]); x += 60 + rnd() * 80; } layers.push(pts); }
      function crest(x) { return H * .66 + Math.sin(x * .012) * H * .04 + Math.sin(x * .031) * H * .015; } // crista em primeiro plano: o chão onde o caminhante pisa
      return function (t, dt) {
        sky(c, [[0, '#8fb8c8'], [1, '#f6e4be']]); addGlow(ctx, sx, sy, W * .45, '255,200,130', .3); addGlow(ctx, sx, sy, 60, '255,240,200', .8);
        layers.forEach(function (pts, k) {
          poly(ctx, [[-40, H]].concat(pts, [[W + 80, H]]), cols[k]);
          for (j = 0; j < pts.length - 1; j++) { var a = pts[j], b = pts[j + 1]; ctx.fillStyle = b[1] > a[1] ? 'rgba(20,30,50,.2)' : 'rgba(255,238,200,.22)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0], H); ctx.lineTo(a[0], H); ctx.fill(); } // faces dobradas: luz do lado do sol, sombra do outro
          var fg = ctx.createLinearGradient(0, H * (.3 + k * .08), 0, H * (.6 + k * .08)); fg.addColorStop(0, 'rgba(255,236,200,0)'); fg.addColorStop(.45, 'rgba(255,236,200,' + (.3 - k * .04) + ')'); fg.addColorStop(1, 'rgba(255,236,200,0)'); ctx.fillStyle = fg; ctx.fillRect(0, H * (.3 + k * .08), W, H * .35); // neblina: o que é longe perde contraste
        });
        for (i = 0; i < 4; i++) { var cx2 = ((t * (6 + i * 3) + i * 400) % (W + 300)) - 150; ctx.save(); ctx.translate(cx2, 40 + i * 30); ctx.scale(2.2, .5); glow(ctx, 0, 0, 60, '255,255,255', .5); glow(ctx, 0, 14, 40, '130,150,175', .2); ctx.restore(); }
        ctx.fillStyle = '#1b2f33'; ctx.beginPath(); ctx.moveTo(0, H); for (var gx = 0; gx <= W; gx += 10) ctx.lineTo(gx, crest(gx)); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,238,200,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (gx = 0; gx <= W; gx += 10) gx ? ctx.lineTo(gx, crest(gx)) : ctx.moveTo(gx, crest(gx)); ctx.stroke(); // luz do sol na crista
        var hx = ((t * 14) % (W + 100)) - 50, hy = crest(hx) + 2, ph = t * 4, s = sc * 1.5; // caminhante de costas para o sol, andando na crista
        ctx.fillStyle = 'rgba(10,20,22,.4)'; ctx.beginPath(); ctx.ellipse(hx + 6 * s, hy, 12 * s, 3 * s, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 3 * s;
        [0, Math.PI].forEach(function (o) { var sw = Math.sin(ph + o); ctx.beginPath(); ctx.moveTo(hx, hy - 14 * s); ctx.lineTo(hx + sw * 6 * s, hy - Math.max(0, Math.cos(ph + o)) * 3 * s); ctx.stroke(); }); // pernas alternadas
        ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(hx, hy - 14 * s); ctx.lineTo(hx + 2 * s, hy - 27 * s); ctx.stroke();
        ctx.fillStyle = '#e0a526'; ctx.fillRect(hx - 8 * s, hy - 27 * s, 7 * s, 13 * s); // mochila
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + 3 * s, hy - 31 * s, 4.2 * s, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx + 3 * s, hy - 34 * s, 7 * s, 1.8 * s, 0, 0, TAU); ctx.fill(); // chapéu
        ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(hx + 2 * s, hy - 24 * s); ctx.lineTo(hx + 8 * s, hy - 20 * s); ctx.moveTo(hx + 8 * s, hy - 20 * s); ctx.lineTo(hx + 9 * s + Math.sin(ph) * 2 * s, hy); ctx.stroke(); // braço e cajado
        bk(t, dt); film(.45);
      };
    } },
  ];

/* ================= FANTASIA ================= */
  // Luz somada (aditiva): brilho que se acumula em vez de cor chapada.
  function addGlow(ctx, x, y, r, rgb, a) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y, r, rgb, a); ctx.globalCompositeOperation = 'source-over'; }
  // Acabamento comum: vinheta + grão de filme (ladrilho de ruído em modo overlay, deslocado a cada quadro).
  function finish(c) {
    var tile = document.createElement('canvas'), g = tile.getContext('2d'), d, i;
    tile.width = tile.height = 128; d = g.createImageData(128, 128);
    for (i = 0; i < d.data.length; i += 4) { d.data[i] = d.data[i + 1] = d.data[i + 2] = c.rnd() * 255; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
    var pat = c.ctx.createPattern(tile, 'repeat');
    return function (vig) {
      var ctx = c.ctx, W = c.W, H = c.H, v = ctx.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .35, W / 2, H * .45, Math.max(W, H) * .8);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + vig + ')'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H - 3); ctx.clip(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .12; ctx.translate(Math.floor(Math.random() * 128), Math.floor(Math.random() * 128));
      ctx.fillStyle = pat; ctx.fillRect(-128, -128, W + 256, H + 256); ctx.restore(); // sem grão nas 3 últimas linhas: a base é esticada pelo base.js
    };
  }
  function roundBox(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

  S.fantasia = [
    /* ---- 1. Biblioteca-oceano ---- */
    { name: 'Biblioteca-oceano', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), i, k;
      var COVERS = ['#d9a23a', '#3f8f9a', '#e0883c', '#7a64b8', '#e6d8b0'];

      // Estantes viram recifes: pré-renderizadas em camadas (longe = azulada e enevoada, perto = escura com luz de borda).
      function reef(cfg) {
        var cv = document.createElement('canvas'), g = cv.getContext('2d'), n;
        cv.width = W; cv.height = H;
        cfg.ranges.forEach(function (rg) {
          var x = rg[0];
          while (x < rg[1]) {
            var w = cfg.wmin + rnd() * (cfg.wmax - cfg.wmin), top = H * (cfg.top + rnd() * cfg.vary), rows = Math.ceil((H - top) / cfg.row), r, bx, y;
            g.fillStyle = cfg.back; g.fillRect(x, top, w, H - top);
            for (r = 0; r < rows; r++) {
              y = top + r * cfg.row; bx = x + 3;
              while (bx < x + w - 4) {
                var bw = 3 + rnd() * 5, bh = cfg.row * (.55 + rnd() * .4);
                if (rnd() < .07) { bx += bw * 2; continue; }
                g.save(); g.translate(bx, y + cfg.row - 2); g.rotate(rnd() < .08 ? (rnd() - .5) * .5 : 0);
                g.fillStyle = cfg.cols[Math.floor(rnd() * cfg.cols.length)]; g.fillRect(0, -bh, bw, bh);
                g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(bw * .62, -bh, bw * .38, bh);
                if (rnd() < .5) { g.fillStyle = cfg.band; g.fillRect(0, -bh * .7, bw, 1.5); }
                g.fillStyle = cfg.rim; g.fillRect(0, -bh, bw, 1.3);
                g.restore(); bx += bw + .4;
              }
              g.fillStyle = cfg.plank; g.fillRect(x, y + cfg.row - 2, w, 3);
            }
            g.fillStyle = cfg.plank; g.fillRect(x, top, 2.5, H - top); g.fillRect(x + w - 2.5, top, 2.5, H - top);
            // livros crescendo no topo, em leque, como coral
            for (n = 0; n < 7; n++) {
              var an = -Math.PI / 2 + (n - 3) * .26 + (rnd() - .5) * .12, len = cfg.row * (.7 + rnd() * .9);
              g.save(); g.translate(x + w / 2 + (n - 3) * (w / 9), top); g.rotate(an + Math.PI / 2);
              g.fillStyle = cfg.cols[Math.floor(rnd() * cfg.cols.length)]; g.fillRect(-3, -len, 6, len); g.fillStyle = cfg.rim; g.fillRect(-3, -len, 6, 1.3); g.restore();
            }
            x += w + cfg.gap * rnd();
          }
        });
        var f = g.createLinearGradient(0, 0, 0, H); f.addColorStop(0, 'rgba(' + cfg.fog + ',' + cfg.fogTop + ')'); f.addColorStop(1, 'rgba(' + cfg.fog + ',' + cfg.fogA + ')');
        g.globalCompositeOperation = 'source-atop'; g.fillStyle = f; g.fillRect(0, 0, W, H);
        return cv;
      }
      var far = reef({ ranges: [[-20, W]], wmin: 90, wmax: 160, gap: 30, top: .22, vary: .25, row: 20, cols: ['#2d7a86', '#3a8f94', '#26606e', '#4a7f7a', '#9a7a45'], back: '#0d3844', plank: '#0b2f3a', rim: 'rgba(255,214,150,.45)', band: 'rgba(240,200,120,.5)', fog: '10,64,78', fogTop: .35, fogA: .6 });
      var mid = reef({ ranges: [[-20, W * .35], [W * .55, W]], wmin: 70, wmax: 130, gap: 70, top: .42, vary: .25, row: 26, cols: ['#14505c', '#1c6670', '#0f3f4c', '#b07a30', '#5a4a88'], back: '#07222c', plank: '#051a22', rim: 'rgba(255,205,130,.55)', band: 'rgba(240,200,120,.4)', fog: '6,40,52', fogTop: .1, fogA: .4 });
      var near = reef({ ranges: [[-30, W * .17], [W * .85, W + 30]], wmin: 60, wmax: 90, gap: 6, top: .36, vary: .2, row: 32, cols: ['#0b2630', '#0f323d', '#12202a', '#2a1d10', '#16222e'], back: '#030e14', plank: '#02090d', rim: 'rgba(255,200,120,.7)', band: 'rgba(240,190,110,.35)', fog: '2,12,18', fogTop: 0, fogA: .1 });

      var fish = [], bubbles = [], tiny = [], snow = [], bokeh = [], kelp = [];
      for (i = 0; i < 26; i++) fish.push({ d: i * .1 + rnd() * .06, ox: (rnd() - .5) * 110, oy: (rnd() - .5) * 70, s: 10 + rnd() * 9, col: COVERS[Math.floor(rnd() * COVERS.length)], ph: rnd() * 6 });
      for (i = 0; i < 14; i++) bubbles.push({ x: rnd() * W, y: rnd() * H, r: 6 + rnd() * 6, v: 14 + rnd() * 16, ph: rnd() * 6, ch: WORDS.charAt(Math.floor(rnd() * WORDS.length)) });
      for (i = 0; i < 30; i++) tiny.push({ x: rnd() * W, y: rnd() * H, r: 1 + rnd() * 2, v: 18 + rnd() * 30, ph: rnd() * 6 });
      for (i = 0; i < 70; i++) snow.push({ x: rnd() * W, y: rnd() * H, r: .6 + rnd() * 1.4, v: 3 + rnd() * 8, ph: rnd() * 6 });
      for (i = 0; i < 7; i++) bokeh.push({ x: rnd() * W, y: rnd() * H, r: 16 + rnd() * 30, v: 2 + rnd() * 5, ph: rnd() * 6 });
      for (i = 0; i < 8; i++) kelp.push({ x: i % 2 ? W * (.84 + rnd() * .14) : W * (.02 + rnd() * .14), h: H * (.25 + rnd() * .3), col: ['#0b3a40', '#123a4a', '#2a2418'][i % 3], ph: rnd() * 6 });
      function lead(t) { return [W * (.5 + .36 * Math.cos(t * .19)), H * (.4 + .16 * Math.sin(t * .37 + 1))]; }

      function drawFish(f, t) {
        var p = lead(t - f.d), q = lead(t - f.d + .05), dx = q[0] - p[0], dy = q[1] - p[1], dir = dx < 0 ? -1 : 1, s = f.s, flap = Math.sin(t * 9 + f.ph) * .4;
        ctx.save(); ctx.translate(p[0] + f.ox + Math.sin(t * 1.7 + f.ph) * 4, p[1] + f.oy + Math.cos(t * 1.3 + f.ph) * 3); ctx.scale(dir, 1); ctx.rotate(Math.atan2(dy, Math.abs(dx)));
        poly(ctx, [[-s, 0], [-s * 1.9, -s * .5 + flap * s], [-s * 1.8, flap * s * .2]], '#f1e6c8'); poly(ctx, [[-s, 0], [-s * 1.9, s * .5 + flap * s], [-s * 1.8, flap * s * .1]], '#c9bb98');
        ctx.fillStyle = f.col; roundBox(ctx, -s, -s * .55, s * 2, s * 1.1, 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-s, s * .1, s * 2, s * .45); // sombra da barriga: luz vem de cima
        ctx.fillStyle = '#f1e6c8'; ctx.fillRect(s * .72, -s * .5, s * .28, s); // borda de páginas no focinho
        ctx.fillStyle = 'rgba(255,214,150,.9)'; ctx.fillRect(-s * .9, -s * .55, s * 1.6, 1.2); // luz de borda
        ctx.fillStyle = 'rgba(255,230,170,.7)'; ctx.fillRect(-s * .5, -s * .15, s * .8, 1.3); // título
        ctx.fillStyle = '#10161c'; ctx.beginPath(); ctx.arc(s * .45, -s * .15, Math.max(1.2, s * .13), 0, TAU); ctx.fill();
        poly(ctx, [[-s * .3, -s * .55], [0, -s * .95 - flap * 2], [s * .3, -s * .55]], f.col);
        ctx.restore();
      }

      return function (t, dt) {
        var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1f7078'); g.addColorStop(.35, '#0f4452'); g.addColorStop(.75, '#07222f'); g.addColorStop(1, '#030e16'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        addGlow(ctx, W * .7, -H * .1, W * .6, '255,190,100', .5);
        // feixes de luz âmbar descendo da superfície
        ctx.globalCompositeOperation = 'lighter';
        for (k = 0; k < 7; k++) {
          var x0 = W * (.2 + k * .12) + Math.sin(t * .3 + k) * 30, x1 = x0 - H * .35 + Math.sin(t * .2 + k * 2) * 40, wd = 24 + (k % 3) * 18, gr = ctx.createLinearGradient(0, 0, 0, H * .95);
          gr.addColorStop(0, 'rgba(255,196,119,.2)'); gr.addColorStop(1, 'rgba(255,196,119,0)'); ctx.fillStyle = gr;
          ctx.beginPath(); ctx.moveTo(x0 - wd, 0); ctx.lineTo(x0 + wd, 0); ctx.lineTo(x1 + wd * 2.4, H * .95); ctx.lineTo(x1 - wd * 2.4, H * .95); ctx.closePath(); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(far, 0, 0); ctx.drawImage(mid, 0, 0);
        ctx.globalCompositeOperation = 'lighter'; // neve marinha: poeira suspensa que pega a luz
        snow.forEach(function (s) { s.y += s.v * dt; if (s.y > H) s.y = 0; ctx.fillStyle = 'rgba(255,225,170,' + (.25 + .25 * Math.sin(t + s.ph)) + ')'; ctx.fillRect(s.x + Math.sin(t * .4 + s.ph) * 8, s.y, s.r, s.r); });
        ctx.globalCompositeOperation = 'source-over';
        fish.forEach(function (f) { drawFish(f, t); });
        ctx.drawImage(near, 0, 0);
        kelp.forEach(function (kp) { // marcadores de página balançando na correnteza
          ctx.strokeStyle = kp.col; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(kp.x, H);
          for (var s = 1; s <= 8; s++) ctx.lineTo(kp.x + Math.sin(t * .9 + kp.ph + s * .5) * s * 3, H - kp.h * s / 8);
          ctx.stroke();
        });
        tiny.forEach(function (b) { b.y -= b.v * dt; if (b.y < -5) { b.y = H; b.x = Math.random() * W; } ctx.strokeStyle = 'rgba(200,245,240,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x + Math.sin(t + b.ph) * 4, b.y, b.r, 0, TAU); ctx.stroke(); });
        ctx.textAlign = 'center';
        bubbles.forEach(function (b) { // bolhas de letras
          b.y -= b.v * dt; if (b.y < -20) { b.y = H + 10; b.x = Math.random() * W; }
          var x = b.x + Math.sin(t * .8 + b.ph) * 8;
          ctx.fillStyle = 'rgba(170,230,230,.1)'; ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(210,248,242,.55)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = 'rgba(244,236,216,.75)'; ctx.font = 'italic ' + b.r * 1.1 + 'px "Old Standard TT",serif'; ctx.fillText(b.ch, x, b.y + b.r * .35);
          ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,214,150,.7)'; ctx.beginPath(); ctx.arc(x, b.y, b.r * .75, -2.5, -1.6); ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
        });
        var fl = ctx.createLinearGradient(0, H * .86, 0, H); fl.addColorStop(0, 'rgba(3,14,22,0)'); fl.addColorStop(1, '#030e16'); ctx.fillStyle = fl; ctx.fillRect(0, H * .86, W, H * .14); // fundo do mar: última linha sólida
        ctx.globalCompositeOperation = 'lighter'; // bokeh de primeiro plano
        bokeh.forEach(function (b) { b.y -= b.v * dt; if (b.y < -b.r) b.y = H + b.r; var x = b.x + Math.sin(t * .2 + b.ph) * 20; ctx.fillStyle = 'rgba(255,200,130,.05)'; ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,214,160,.08)'; ctx.lineWidth = 1.5; ctx.stroke(); });
        var sf = ctx.createLinearGradient(0, 0, 0, H * .08); sf.addColorStop(0, 'rgba(255,214,150,.5)'); sf.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = sf; ctx.fillRect(0, 0, W, H * .08); // superfície
        ctx.globalCompositeOperation = 'source-over';
        film(.55);
      };
    } },

    /* ---- 2. Dragão de tinta ---- */
    { name: 'Portal na floresta encantada', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), bk = bokehLayer(c, 7, '150,230,255', .05), u = H / 224, gy = H * .8, R = Math.min(H * .3, W * .14), px = W * .6, py = gy - R - 7 * u, layers = [], flies = [], motes = [], fogs = [], ferns = [], caps = [], i, j;
      for (j = 0; j < 3; j++) { var list = [], n = 7 + j * 3; for (i = 0; i < n; i++) list.push({ x: (i + rnd() * .8) / n * W, w: (7 + j * 7 + rnd() * 8) * u, lean: (rnd() - .5) * .04 }); layers.push(list); } // troncos em 3 profundidades
      for (i = 0; i < 46; i++) flies.push({ x: rnd() * W, y: H * (.25 + rnd() * .55), sp: .3 + rnd() * .6, ph: rnd() * 6, r: 1.5 + rnd() * 2 });
      for (i = 0; i < 40; i++) motes.push({ off: rnd(), sp: .03 + rnd() * .05, dx: (rnd() - .5) * R * 1.6, ph: rnd() * 6 });
      for (i = 0; i < 9; i++) fogs.push({ x: rnd() * W, y: gy - H * (.02 + rnd() * .2), r: W * (.1 + rnd() * .12), v: (3 + rnd() * 6) * (rnd() < .5 ? -1 : 1), a: .05 + rnd() * .07 });
      for (i = 0; i < 16; i++) ferns.push({ x: rnd() * W, s: (12 + rnd() * 22) * u, n: 6 + Math.floor(rnd() * 3), ph: rnd() * 6 });
      for (i = 0; i < 7; i++) caps.push({ x: px + (rnd() - .5) * R * 4.5, s: (3 + rnd() * 4) * u, ph: rnd() * 6 });
      function trunks(list, j, t) { var shade = ['#0f2a36', '#0a1d28', '#050f16'][j]; list.forEach(function (tr) { if (j > 0 && Math.abs(tr.x - px) < R * 1.5) return; var sw = Math.sin(t * .2 + tr.x) * 2; ctx.fillStyle = shade; poly(ctx, [[tr.x - tr.w / 2, gy + 6], [tr.x + tr.w / 2, gy + 6], [tr.x + tr.w * .35 + sw + tr.lean * H, -10], [tr.x - tr.w * .35 + sw + tr.lean * H, -10]], shade); ctx.strokeStyle = 'rgba(140,230,255,' + (.1 + j * .05) + ')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(tr.x + (tr.x < px ? tr.w / 2 : -tr.w / 2), gy); ctx.lineTo(tr.x + (tr.x < px ? tr.w * .35 : -tr.w * .35) + sw + tr.lean * H, 0); ctx.stroke(); }); } // luz de borda do lado do portal
      return function (t, dt) {
        var k, fl = .85 + .15 * Math.sin(t * 2.3);
        sky(c, [[0, '#04101a'], [.55, '#0d2a34'], [1, '#143c44']], gy);
        addGlow(ctx, px, py, W * .45, '90,200,230', .16 * fl);
        for (k = 0; k < 6; k++) { var rx = W * (.12 + k * .16) + Math.sin(t * .15 + k) * 14, rg = ctx.createLinearGradient(rx, 0, rx + 60, gy); rg.addColorStop(0, 'rgba(200,255,230,' + (.12 + .05 * Math.sin(t * .4 + k)) + ')'); rg.addColorStop(1, 'rgba(200,255,230,0)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg; poly(ctx, [[rx, 0], [rx + 24 * u, 0], [rx + 90 * u, gy], [rx + 30 * u, gy]], rg); ctx.restore(); } // raios de luz entre as copas
        trunks(layers[0], 0, t);
        var f0 = ctx.createLinearGradient(0, 0, 0, gy); f0.addColorStop(0, 'rgba(60,130,150,0)'); f0.addColorStop(1, 'rgba(60,130,150,.28)'); ctx.fillStyle = f0; ctx.fillRect(0, 0, W, gy); // neblina de profundidade
        trunks(layers[1], 1, t);
        // chão com musgo e reflexo do portal
        var gg = ctx.createLinearGradient(0, gy, 0, H); gg.addColorStop(0, '#0a1e22'); gg.addColorStop(1, '#030a0e'); ctx.fillStyle = gg; ctx.fillRect(0, gy, W, H - gy);
        ctx.save(); ctx.translate(px, gy + 3 * u); ctx.scale(1, .22); glow(ctx, 0, 0, R * 1.8, '140,230,255', .5 * fl); ctx.restore();
        // arco de pedra: anel com blocos, musgo e luz de borda
        ctx.lineCap = 'butt'; ctx.strokeStyle = '#1c2c36'; ctx.lineWidth = 13 * u; ctx.beginPath(); ctx.arc(px, py, R, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#33505c'; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(px, py, R + 3.5 * u, Math.PI * .95, Math.PI * 1.9); ctx.stroke();
        ctx.strokeStyle = 'rgba(8,16,22,.8)'; ctx.lineWidth = 1.2; for (k = 0; k < 24; k++) { var a = k / 24 * TAU; ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * (R - 6.5 * u), py + Math.sin(a) * (R - 6.5 * u)); ctx.lineTo(px + Math.cos(a) * (R + 6.5 * u), py + Math.sin(a) * (R + 6.5 * u)); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(110,200,90,.75)'; ctx.lineWidth = 3.5 * u; ctx.beginPath(); ctx.arc(px, py, R + 4 * u, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke(); ctx.beginPath(); ctx.arc(px, py, R + 4 * u, Math.PI * .1, Math.PI * .3); ctx.stroke(); // musgo
        ctx.fillStyle = '#1c2c36'; ctx.fillRect(px - R - 9 * u, gy - 4 * u, 18 * u, 8 * u); ctx.fillRect(px + R - 9 * u, gy - 4 * u, 18 * u, 8 * u);
        // disco do portal: núcleo branco, azul elétrico nas bordas, redemoinho e ondas
        var ri = R - 6.5 * u, pg = ctx.createRadialGradient(px, py, 0, px, py, ri); pg.addColorStop(0, 'rgba(255,255,255,.98)'); pg.addColorStop(.25, 'rgba(170,245,255,.95)'); pg.addColorStop(.7, 'rgba(40,130,210,.92)'); pg.addColorStop(1, 'rgba(8,40,100,.95)');
        ctx.save(); ctx.beginPath(); ctx.arc(px, py, ri, 0, TAU); ctx.clip(); ctx.fillStyle = pg; ctx.fillRect(px - ri, py - ri, ri * 2, ri * 2); ctx.globalCompositeOperation = 'lighter';
        for (k = 0; k < 7; k++) { var rr = ri * (.15 + k * .13), a0 = t * (.7 - k * .08) + k * 1.1; ctx.strokeStyle = 'rgba(255,255,255,' + (.38 - k * .03) + ')'; ctx.lineWidth = 2.4 * u; ctx.beginPath(); ctx.arc(px, py, rr, a0, a0 + 1.7); ctx.stroke(); ctx.strokeStyle = 'rgba(255,215,130,.28)'; ctx.lineWidth = 1.4 * u; ctx.beginPath(); ctx.arc(px, py, rr + 3 * u, a0 + 2.6, a0 + 3.8); ctx.stroke(); }
        for (k = 0; k < 3; k++) { var wv = (t * .35 + k / 3) % 1; ctx.strokeStyle = 'rgba(200,250,255,' + (1 - wv) * .5 + ')'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(px, py, ri * wv, 0, TAU); ctx.stroke(); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(170,240,255,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, ri, 0, TAU); ctx.stroke(); // luz na borda interna da pedra
        addGlow(ctx, px, py, R * 1.1, '200,245,255', .45 * fl); addGlow(ctx, px, py, R * 3, '110,210,255', .2 * fl);
        for (k = 0; k < 8; k++) { var ra = t * .3 + k / 8 * TAU, rxp = px + Math.cos(ra) * (R + 22 * u), ryp = py + Math.sin(ra) * (R + 22 * u) * .85; ctx.save(); ctx.translate(rxp, ryp); ctx.rotate(ra); ctx.fillStyle = 'rgba(255,225,150,' + (.5 + .4 * Math.sin(t * 2 + k)) + ')'; ctx.fillRect(-2 * u, -3.5 * u, 4 * u, 7 * u); addGlow(ctx, 0, 0, 12 * u, '255,210,120', .35); ctx.restore(); } // runas orbitando
        // musgo, samambaias e cogumelos que brilham
        ferns.forEach(function (f) { ctx.strokeStyle = '#06161a'; ctx.lineWidth = 1.6 * u; ctx.beginPath(); for (var q = 0; q < f.n; q++) { var an = -Math.PI / 2 + (q - (f.n - 1) / 2) * .38 + Math.sin(t * .6 + f.ph) * .04; ctx.moveTo(f.x, gy + 4 * u); ctx.quadraticCurveTo(f.x + Math.cos(an) * f.s * .5, gy + 4 * u + Math.sin(an) * f.s * .9, f.x + Math.cos(an) * f.s, gy + 4 * u + Math.sin(an) * f.s * .8); } ctx.stroke(); });
        caps.forEach(function (m) { var gl = .6 + .4 * Math.sin(t * 1.5 + m.ph); ctx.fillStyle = '#d8f4ff'; ctx.fillRect(m.x - m.s * .14, gy - m.s * .2, m.s * .28, m.s * .9); ctx.fillStyle = 'rgba(70,170,230,.95)'; ctx.beginPath(); ctx.ellipse(m.x, gy - m.s * .25, m.s * .8, m.s * .5, 0, Math.PI, TAU); ctx.fill(); addGlow(ctx, m.x, gy - m.s * .2, m.s * 3.5, '90,210,255', .3 * gl); });
        trunks(layers[2], 2, t);
        motes.forEach(function (m) { var age = (t * m.sp + m.off) % 1, x = px + m.dx * (.3 + age) + Math.sin(t + m.ph) * 6 * u, y = py + R * .5 - age * (py + R * .5), a = Math.sin(age * Math.PI) * .7; addGlow(ctx, x, y, 5 * u, '190,240,255', a * .5); ctx.fillStyle = 'rgba(235,250,255,' + a + ')'; ctx.fillRect(x, y, 1.6, 1.6); }); // esporos subindo do portal
        flies.forEach(function (f) { var x = f.x + Math.sin(t * f.sp + f.ph) * 30 * u, y = f.y + Math.cos(t * f.sp * .7 + f.ph) * 14 * u, a = .4 + .6 * Math.max(0, Math.sin(t * 1.6 + f.ph)); addGlow(ctx, x, y, f.r * 6, '220,255,120', .5 * a); ctx.fillStyle = 'rgba(255,255,210,' + a + ')'; ctx.fillRect(x - f.r / 2, y - f.r / 2, f.r, f.r); }); // vaga-lumes
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; fogs.forEach(function (f) { var x = ((f.x + f.v * t) % (W + 2 * f.r) + W + 2 * f.r) % (W + 2 * f.r) - f.r; ctx.save(); ctx.translate(x, f.y); ctx.scale(2.6, .5); glow(ctx, 0, 0, f.r, '150,225,240', f.a); ctx.restore(); }); ctx.restore();
        var vg = ctx.createLinearGradient(0, 0, 0, H * .4); vg.addColorStop(0, 'rgba(2,8,12,.75)'); vg.addColorStop(1, 'rgba(2,8,12,0)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H * .4); // copas fechando o alto
        bk(t, dt); film(.6);
      };
    } },

    /* ---- 3. Castelo flutuante de papel dobrado ---- */
    { name: 'Castelo flutuante de papel dobrado', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), i, k;
      var S3 = Math.min(1.2, H * .9 / 460, W / 650), sx = W * .15, sy = H * .72, cx = W * .6, baseY = H * .04 + 250 * S3;
      var ISL = [[-190, 0], [190, 0], [150, 30], [120, 70], [90, 95], [60, 150], [20, 205], [-10, 170], [-40, 140], [-80, 100], [-120, 60], [-160, 28]];
      var stars = [], isles = [], puffs = [], pages = [], birds = [], drops = [], bokeh = [];
      for (i = 0; i < 50; i++) stars.push({ x: rnd() * W, y: rnd() * H * .4, r: .6 + rnd() * 1.2, ph: rnd() * 6 });
      for (i = 0; i < 5; i++) isles.push({ x: rnd() * W, y: H * (.28 + rnd() * .22), s: 18 + rnd() * 26, v: 1.5 + rnd() * 2 });
      [[0, 12, .5, .68, 40, 70, 4], [1, 12, .66, .82, 60, 90, 8], [2, 10, .85, .98, 90, 130, 14]].forEach(function (L) {
        for (i = 0; i < L[1]; i++) puffs.push({ d: L[0], x: rnd() * (W + 300) - 150, y: H * (L[2] + rnd() * (L[3] - L[2])), r: L[4] + rnd() * (L[5] - L[4]), v: L[6] * (.6 + rnd() * .8) });
      });
      for (i = 0; i < 18; i++) pages.push({ x: rnd() * W, y: rnd() * H * .8, s: 4 + rnd() * 5, ph: rnd() * 6, v: 8 + rnd() * 14, rot: rnd() * TAU });
      for (i = 0; i < 4; i++) birds.push({ x: rnd() * W, y: H * (.1 + rnd() * .3), v: 20 + rnd() * 20, ph: rnd() * 6, s: 12 + rnd() * 10 });
      for (i = 0; i < 30; i++) drops.push({ off: rnd(), dx: (rnd() - .5) * 8 });
      for (i = 0; i < 8; i++) bokeh.push({ x: rnd() * W, y: rnd() * H, r: 18 + rnd() * 34, v: 3 + rnd() * 6, ph: rnd() * 6 });

      function cloud(p) { // sombra violeta por baixo, topo aceso na cor do sol
        var a = [.5, .75, .95][p.d];
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, .6); glow(ctx, 0, p.r * .3, p.r, '104,74,150', a * .8); glow(ctx, -p.r * .2, -p.r * .1, p.r * .85, '255,214,176', a); ctx.restore();
      }
      function tower(x, h, w, t, ph) {
        var lg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0), rg = ctx.createLinearGradient(x - w / 2 - 7, 0, x + w / 2 + 7, 0), fy = -h - w, wy, n;
        lg.addColorStop(0, '#ffe2b4'); lg.addColorStop(.45, '#d6bcc4'); lg.addColorStop(1, '#6d5c96'); ctx.fillStyle = lg; ctx.fillRect(x - w / 2, -h, w, h);
        textLines(ctx, x - w / 2, -h, w, h, 'rgba(60,40,80,.16)');
        rg.addColorStop(0, '#7f93e0'); rg.addColorStop(.5, '#3b4890'); rg.addColorStop(1, '#171d48'); poly(ctx, [[x - w / 2 - 7, -h], [x, fy], [x + w / 2 + 7, -h]], rg);
        ctx.strokeStyle = 'rgba(255,214,160,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - w / 2 - 7, -h); ctx.lineTo(x, fy); ctx.stroke();
        ctx.strokeStyle = '#2a2244'; ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x, fy - 16); ctx.stroke(); poly(ctx, [[x, fy - 16], [x + 14, fy - 12 + Math.sin(t * 4 + ph) * 3], [x, fy - 8]], '#ffd27a'); // bandeira
        for (wy = -h * .75, n = 0; wy < -14; wy += 28, n++) { var on = Math.sin(t * .9 + ph + n * 2.1) > -.8; ctx.fillStyle = on ? '#ffd27a' : '#3a2f58'; ctx.fillRect(x - 4, wy, 8, 13); if (on) addGlow(ctx, x, wy + 6, 30, '255,196,119', .55); }
      }
      function island() {
        var g = ctx.createLinearGradient(0, 0, 0, 205), lit = ctx.createLinearGradient(-190, 0, 40, 0), y;
        g.addColorStop(0, '#6a5890'); g.addColorStop(.5, '#2e2456'); g.addColorStop(1, '#150f33'); poly(ctx, ISL, g);
        ctx.save(); ctx.beginPath(); ISL.forEach(function (pt, j) { j ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); }); ctx.closePath(); ctx.clip();
        lit.addColorStop(0, 'rgba(255,190,130,.4)'); lit.addColorStop(1, 'rgba(255,190,130,0)'); ctx.fillStyle = lit; ctx.fillRect(-200, 0, 260, 210);
        ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; for (y = 22; y < 200; y += 18) { ctx.beginPath(); ctx.moveTo(-200, y); ctx.quadraticCurveTo(0, y + 8 * Math.sin(y), 200, y - 6); ctx.stroke(); } // estratos de páginas
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,205,150,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-190, 0); ctx.lineTo(-160, 28); ctx.lineTo(-120, 60); ctx.lineTo(-80, 100); ctx.lineTo(-40, 140); ctx.lineTo(-10, 170); ctx.lineTo(20, 205); ctx.stroke(); // luz de borda do lado do sol
        var pl = ctx.createLinearGradient(0, -8, 0, 0); pl.addColorStop(0, '#fff0d0'); pl.addColorStop(1, '#d8c39c'); poly(ctx, [[-190, 0], [190, 0], [184, -8], [-184, -8]], pl);
      }

      return function (t, dt) {
        var g = ctx.createLinearGradient(0, 0, 0, H), bob = Math.sin(t * .6) * 8;
        g.addColorStop(0, '#2c2466'); g.addColorStop(.45, '#8a5c9c'); g.addColorStop(.75, '#f0a07c'); g.addColorStop(1, '#ffd6a0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        stars.forEach(function (st) { ctx.fillStyle = 'rgba(255,240,220,' + (.2 + .3 * Math.sin(t * 1.4 + st.ph)) + ')'; ctx.fillRect(st.x, st.y, st.r, st.r); });
        addGlow(ctx, sx, sy, W * .5, '255,190,120', .5); addGlow(ctx, sx, sy, 120, '255,240,200', .9); ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.arc(sx, sy, 22, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; // raios do sol varrendo o céu
        for (k = 0; k < 6; k++) {
          var an = -.1 - k * .17 + Math.sin(t * .2 + k) * .03, rg = ctx.createLinearGradient(sx, sy, sx + Math.cos(an) * W, sy + Math.sin(an) * W), a1 = an - .045, a2 = an + .045;
          rg.addColorStop(0, 'rgba(255,220,160,.14)'); rg.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = rg;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a1) * W * 1.4, sy + Math.sin(a1) * W * 1.4); ctx.lineTo(sx + Math.cos(a2) * W * 1.4, sy + Math.sin(a2) * W * 1.4); ctx.closePath(); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        puffs.forEach(function (p) { p.x += p.v * dt; if (p.x > W + p.r * 2) p.x = -p.r * 2; if (p.d === 0) cloud(p); });
        isles.forEach(function (is) { is.x += is.v * dt; if (is.x > W + 60) is.x = -60; var s = is.s; poly(ctx, [[is.x - s, is.y], [is.x + s, is.y], [is.x + s * .5, is.y + s * .6], [is.x, is.y + s * 1.2], [is.x - s * .5, is.y + s * .5]], 'rgba(150,118,178,.55)'); poly(ctx, [[is.x - s * .3, is.y], [is.x, is.y - s * .8], [is.x + s * .3, is.y]], 'rgba(150,118,178,.55)'); });

        ctx.save(); ctx.translate(cx, baseY + bob); ctx.scale(S3, S3);
        var wl = ctx.createLinearGradient(-135, 0, 120, 0); wl.addColorStop(0, '#e8c9b4'); wl.addColorStop(.5, '#9a86b0'); wl.addColorStop(1, '#5b4a82');
        island(); ctx.fillStyle = wl; ctx.fillRect(-135, -48, 255, 48); for (k = -135; k < 120; k += 14) ctx.fillRect(k, -56, 8, 8);
        tower(-20, 170, 50, t, 0); [[-120, 70, 60], [-40, 110, 80], [40, 90, 70], [110, 60, 50]].forEach(function (tw, j) { tower(tw[0], tw[1], tw[2], t, j + 1); });
        ctx.globalCompositeOperation = 'lighter'; // cachoeira que cai da ilha
        for (k = 0; k < drops.length; k++) { var d = drops[k], f = (d.off + t * .5) % 1, yy = 28 + f * 270; ctx.fillStyle = 'rgba(255,236,200,' + (.5 * (1 - f)) + ')'; ctx.fillRect(150 + d.dx + f * 12, yy, 1.5, 14); }
        glow(ctx, 162, 300, 70, '255,220,190', .4); ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        puffs.forEach(function (p) { if (p.d === 1) cloud(p); });
        birds.forEach(function (b) { b.x += b.v * dt; if (b.x > W + 40) b.x = -40; var fl = Math.sin(t * 5 + b.ph); ctx.save(); ctx.translate(b.x, b.y + Math.sin(t + b.ph) * 14); poly(ctx, [[0, 0], [-b.s, -b.s * .8 * fl], [-b.s * .3, b.s * .3]], '#fff0d2'); poly(ctx, [[0, 0], [b.s, -b.s * .8 * fl], [b.s * .3, b.s * .3]], '#c9a9b8'); poly(ctx, [[0, 0], [b.s * 1.4, b.s * .2], [0, b.s * .35]], '#fff0d2'); ctx.restore(); });
        ctx.globalCompositeOperation = 'lighter';
        pages.forEach(function (p) { p.x += p.v * dt; p.y -= p.v * .3 * dt; if (p.x > W + 10) { p.x = -10; p.y = Math.random() * H * .8; } if (p.y < -10) p.y = H * .8; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + t * .8); ctx.fillStyle = 'rgba(255,236,200,' + (.45 + .3 * Math.sin(t * 2 + p.ph)) + ')'; ctx.fillRect(-p.s / 2, -p.s * .65, p.s, p.s * 1.3); ctx.restore(); });
        ctx.globalCompositeOperation = 'source-over';
        puffs.forEach(function (p) { if (p.d === 2) cloud(p); });
        var bf = ctx.createLinearGradient(0, H * .92, 0, H); bf.addColorStop(0, 'rgba(201,138,160,0)'); bf.addColorStop(1, '#c98aa0'); ctx.fillStyle = bf; ctx.fillRect(0, H * .92, W, H * .08); // última linha sólida
        ctx.globalCompositeOperation = 'lighter';
        bokeh.forEach(function (b) { b.y -= b.v * dt; if (b.y < -b.r) b.y = H + b.r; var x = b.x + Math.sin(t * .25 + b.ph) * 18; ctx.fillStyle = 'rgba(255,214,160,.06)'; ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,190,.09)'; ctx.lineWidth = 1.5; ctx.stroke(); });
        ctx.globalCompositeOperation = 'source-over';
        film(.45);
      };
    } },
  ];

    /* ================= CRÔNICAS ================= */
  S.cronicas = [
    { name: 'Cidade de jornal de manhã', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), bk = bokehLayer(c, 8, '255,225,170', .06), ground = H * .84, layer = document.createElement('canvas'), people = [], birds = [], sx = W * .16, sy = H * .5, i;
      layer.width = W; layer.height = H; var g = layer.getContext('2d');
      var sk = g.createLinearGradient(0, 0, 0, ground); sk.addColorStop(0, '#8fbfe4'); sk.addColorStop(.7, '#fbe0b8'); sk.addColorStop(1, '#ffd9a6'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
      glow(g, sx, sy, W * .4, '255,190,120', .35); glow(g, sx, sy, 70, '255,240,200', .85);
      // três fileiras de prédios; cada uma recebe bruma por cima, então o que está atrás fica mais claro e de baixo contraste
      function row(col, mn, mx, wm, wx, win, haze) {
        var x = -20;
        while (x < W + 20) {
          var w = wm + rnd() * (wx - wm), h = H * (mn + rnd() * (mx - mn)), top = ground - h;
          g.fillStyle = col; g.fillRect(x, top, w, h);
          g.fillStyle = 'rgba(255,230,180,.28)'; g.fillRect(x, top, Math.max(3, w * .14), h); // quina acesa voltada ao sol nascente
          g.fillStyle = 'rgba(30,25,50,.16)'; g.fillRect(x + w * .55, top, w * .45, h);
          g.fillStyle = 'rgba(23,19,15,.09)'; for (var y = top + 6; y < ground; y += 6) g.fillRect(x + 4, y, w - 8 - (y % 4) * 6, 1.5);
          g.fillStyle = 'rgba(23,19,15,.16)'; g.fillRect(x + 4, top + 8, w * .55, 7);
          if (win) for (var wy = top + 30; wy < ground - 14; wy += 20) for (var wx = x + 8; wx < x + w - 12; wx += 18) if (rnd() < .5) { g.fillStyle = rnd() < .3 ? 'rgba(255,220,150,.9)' : 'rgba(120,170,210,.8)'; g.fillRect(wx, wy, 8, 11); }
          x += w + 2 + rnd() * 8;
        }
        g.fillStyle = 'rgba(255,215,170,' + haze + ')'; g.fillRect(0, 0, W, ground);
      }
      row('#d8c8a4', .14, .36, 40, 90, false, .35); row('#c9b690', .2, .5, 50, 110, true, .22); row('#b0997a', .26, .6, 70, 150, true, 0);
      var gr = g.createLinearGradient(0, ground, 0, H); gr.addColorStop(0, '#a38f6a'); gr.addColorStop(1, '#8a7656'); g.fillStyle = gr; g.fillRect(0, ground, W, H - ground);
      for (i = 0; i < 8; i++) people.push({ x: rnd() * W, v: 14 + rnd() * 22, h: 36 + rnd() * 14, dir: rnd() < .5 ? 1 : -1 });
      for (i = 0; i < 6; i++) birds.push({ x: rnd() * W, y: H * (.1 + rnd() * .25), v: 20 + rnd() * 20, ph: rnd() * 6 });
      return function (t, dt) {
        ctx.drawImage(layer, 0, 0);
        ctx.globalCompositeOperation = 'lighter'; for (var k = 0; k < 5; k++) { var an = .1 + k * .17 + Math.sin(t * .2 + k) * .02, rg = ctx.createLinearGradient(sx, sy, sx + Math.cos(an) * W, sy + Math.sin(an) * W); rg.addColorStop(0, 'rgba(255,225,170,.14)'); rg.addColorStop(1, 'rgba(255,225,170,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(an - .035) * W * 1.4, sy + Math.sin(an - .035) * W * 1.4); ctx.lineTo(sx + Math.cos(an + .035) * W * 1.4, sy + Math.sin(an + .035) * W * 1.4); ctx.fill(); } ctx.globalCompositeOperation = 'source-over'; // raios entre os prédios
        people.forEach(function (p) { p.x += p.v * p.dir * dt; if (p.x > W + 20) p.x = -20; if (p.x < -20) p.x = W + 20; var y = ground + 18; ctx.fillStyle = 'rgba(40,30,30,.3)'; ctx.beginPath(); ctx.ellipse(p.x + p.h * .6, y, p.h * .7, 3, 0, 0, TAU); ctx.fill(); // sombra comprida do sol baixo
          ctx.fillStyle = '#2b3a55'; ctx.fillRect(p.x - 5, y - p.h, 10, p.h * .6); ctx.beginPath(); ctx.arc(p.x, y - p.h - 5, 5, 0, TAU); ctx.fill(); var s = Math.sin(t * 6 + p.x) * 4; ctx.fillRect(p.x - 4 + s, y - p.h * .4, 3, p.h * .4); ctx.fillRect(p.x + 1 - s, y - p.h * .4, 3, p.h * .4); ctx.fillStyle = 'rgba(255,225,170,.6)'; ctx.fillRect(p.x - 5, y - p.h, 2, p.h * .6); });
        birds.forEach(function (b) { b.x += b.v * dt; if (b.x > W + 30) b.x = -30; var f = Math.sin(t * 6 + b.ph) * 8; poly(ctx, [[b.x, b.y], [b.x - 12, b.y - f], [b.x - 4, b.y + 3]], '#fffaf0'); poly(ctx, [[b.x, b.y], [b.x + 12, b.y - f], [b.x + 4, b.y + 3]], '#d9c8a8'); });
        bk(t, dt); film(.4);
      };
    } },
    { name: 'Mesa de café vista de cima', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), tb = document.createElement('canvas'), g = tb.getContext('2d'), steam = [], motes = [], cx = W * .5, cy = H * .5, i;
      tb.width = W; tb.height = H;
      var wd = g.createLinearGradient(0, 0, W, H); wd.addColorStop(0, '#76502e'); wd.addColorStop(1, '#4a3019'); g.fillStyle = wd; g.fillRect(0, 0, W, H);
      for (var y = 0; y < H; y += 22) { g.strokeStyle = 'rgba(20,10,0,' + (.12 + rnd() * .12) + ')'; g.lineWidth = 1 + rnd() * 2; g.beginPath(); g.moveTo(0, y); for (var x = 0; x <= W; x += 40) g.lineTo(x, y + Math.sin(x * .01 + y) * 3); g.stroke(); } // veios da madeira
      for (i = 0; i < 6; i++) { var p = { x: rnd() < .5 ? rnd() * W * .22 : W * (.78 + rnd() * .22), y: rnd() * H, w: 200 + rnd() * 120, h: 140 + rnd() * 100, r: (rnd() - .5) * .6 };
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowOffsetX = 7; g.shadowOffsetY = 9; g.shadowBlur = 8; g.fillStyle = '#f1e8d0'; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.shadowColor = 'transparent'; g.fillStyle = INK; g.fillRect(-p.w / 2 + 10, -p.h / 2 + 10, p.w * .55, 12); textLines(g, -p.w / 2, -p.h / 2 + 24, p.w, p.h - 24, 'rgba(23,19,15,.4)'); g.restore(); }
      g.save(); g.translate(cx - 190, cy + 40); g.rotate(.4); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowOffsetX = 6; g.shadowOffsetY = 8; g.shadowBlur = 6; g.fillStyle = '#d9a35a'; g.beginPath(); g.ellipse(0, 0, 70, 34, 0, 0, TAU); g.fill(); g.shadowColor = 'transparent'; g.fillStyle = 'rgba(255,235,190,.4)'; g.beginPath(); g.ellipse(-12, -8, 38, 12, 0, 0, TAU); g.fill(); g.restore(); // pão
      g.save(); g.translate(cx + 150, cy - 90); g.rotate(-.5); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowOffsetX = 4; g.shadowOffsetY = 5; g.fillStyle = '#e0a526'; g.fillRect(-60, -4, 120, 8); g.fillStyle = '#17130f'; g.fillRect(60, -4, 10, 8); g.restore(); // lápis
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowOffsetX = 11; g.shadowOffsetY = 13; g.shadowBlur = 10; g.fillStyle = '#efe9dc'; g.beginPath(); g.arc(cx, cy, 90, 0, TAU); g.fill(); g.shadowColor = 'transparent'; // pires
      g.fillStyle = '#d8d0c0'; g.beginPath(); g.arc(cx, cy, 70, 0, TAU); g.fill(); g.fillStyle = '#fbf8ef'; g.beginPath(); g.arc(cx, cy, 62, 0, TAU); g.fill(); g.fillStyle = '#3b2412'; g.beginPath(); g.arc(cx, cy, 52, 0, TAU); g.fill();
      g.strokeStyle = '#fbf8ef'; g.lineWidth = 8; g.beginPath(); g.arc(cx + 62, cy, 20, -1.2, 1.2); g.stroke();
      var cf = g.createRadialGradient(cx - 14, cy - 14, 4, cx, cy, 52); cf.addColorStop(0, 'rgba(255,220,170,.35)'); cf.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = cf; g.beginPath(); g.arc(cx, cy, 52, 0, TAU); g.fill();
      for (i = 0; i < 12; i++) steam.push({ a: rnd(), ch: WORDS.charAt(Math.floor(rnd() * WORDS.length)) });
      for (i = 0; i < 40; i++) motes.push({ x: rnd() * W, y: rnd() * H, v: 3 + rnd() * 6, ph: rnd() * 6, r: .8 + rnd() * 1.6 });
      var vg = g.createRadialGradient(cx, cy, Math.min(W, H) * .3, cx, cy, Math.max(W, H) * .7); vg.addColorStop(0, 'rgba(20,8,0,0)'); vg.addColorStop(1, 'rgba(20,8,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
      return function (t, dt) {
        ctx.drawImage(tb, 0, 0);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(W * .08 + Math.sin(t * .2) * 8, -H * .1); ctx.transform(1, 0, -.55, 1, 0, 0); // janela projeta quatro quadros de luz na mesa
        for (var ix = 0; ix < 2; ix++) for (var iy = 0; iy < 2; iy++) { var lg = ctx.createLinearGradient(0, 0, 0, H * 1.2); lg.addColorStop(0, 'rgba(255,225,160,.22)'); lg.addColorStop(1, 'rgba(255,225,160,.05)'); ctx.fillStyle = lg; ctx.fillRect(W * .1 + ix * W * .24, H * .1 + iy * H * .5, W * .22, H * .46); }
        ctx.restore();
        addGlow(ctx, cx - 14, cy - 14, 22, '255,235,200', .7); ctx.fillStyle = 'rgba(255,245,225,.55)'; ctx.beginPath(); ctx.ellipse(cx - 22, cy - 20, 14, 6, -.6, 0, TAU); ctx.fill(); // brilho no café
        ctx.textAlign = 'center'; ctx.globalCompositeOperation = 'lighter'; steam.forEach(function (s) { var f = (s.a + t * .08) % 1; ctx.globalAlpha = (1 - f) * .7; ctx.fillStyle = PAPER; ctx.font = (14 + f * 14) + 'px "Old Standard TT",serif'; ctx.fillText(s.ch, cx + Math.sin(f * 8 + s.a * 9) * 20, cy - f * 170); }); ctx.globalAlpha = 1;
        motes.forEach(function (m) { m.y -= m.v * dt; if (m.y < 0) m.y = H; ctx.fillStyle = 'rgba(255,230,170,' + (.2 + .25 * Math.sin(t + m.ph)) + ')'; ctx.fillRect(m.x + Math.sin(t * .5 + m.ph) * 10, m.y, m.r, m.r); }); // poeira na luz
        ctx.globalCompositeOperation = 'source-over'; film(.35);
      };
    } },
    { name: 'Praça ao fim da tarde', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), bk = bokehLayer(c, 8, '255,170,100', .06), hz = H * .56, pigeons = [], trees = [], sx = W * .18, sy = hz - 26, i;
      for (i = 0; i < 9; i++) pigeons.push({ x: rnd() * W, y: H * (.72 + rnd() * .22), v: 10 + rnd() * 14, ph: rnd() * 6, fly: 0, dir: rnd() < .5 ? 1 : -1 });
      for (i = 0; i < 6; i++) trees.push({ x: (i + .5) / 6 * W + (rnd() - .5) * 60, s: 50 + rnd() * 40 });
      return function (t, dt) {
        sky(c, [[0, '#3d3a6e'], [.5, '#c9607a'], [1, '#ffb36b']], hz); addGlow(ctx, sx, hz, W * .6, '255,140,80', .35); addGlow(ctx, sx, sy, 70, '255,190,120', .6);
        ctx.fillStyle = '#ffe2a8'; ctx.beginPath(); ctx.arc(sx, sy, 24, 0, TAU); ctx.fill(); // sol baixo, quase no horizonte
        var gg = ctx.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, '#7a6a5a'); gg.addColorStop(1, '#3d3440'); ctx.fillStyle = gg; ctx.fillRect(0, hz, W, H - hz);
        ctx.fillStyle = '#8a6a5a'; ctx.beginPath(); ctx.ellipse(W / 2, H * .85, W * .6, H * .14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,170,110,.25)'; ctx.beginPath(); ctx.ellipse(W / 2, H * .83, W * .55, H * .1, 0, 0, TAU); ctx.fill(); // calçada
        trees.forEach(function (tr) {
          ctx.fillStyle = 'rgba(30,20,40,.35)'; ctx.beginPath(); ctx.ellipse(tr.x + tr.s * 1.2, hz + 6, tr.s * 1.6, 8, 0, 0, TAU); ctx.fill(); // sombra longa de sol baixo
          ctx.fillStyle = '#2c1c12'; ctx.fillRect(tr.x - 5, hz - tr.s * .6, 10, tr.s * .7);
          var cg = ctx.createRadialGradient(tr.x - tr.s * .3, hz - tr.s * 1.1, tr.s * .1, tr.x, hz - tr.s * .8, tr.s * 1.1); cg.addColorStop(0, '#8a8a4a'); cg.addColorStop(.6, '#4a6034'); cg.addColorStop(1, '#26381f'); ctx.fillStyle = cg;
          ctx.beginPath(); ctx.arc(tr.x, hz - tr.s * .9, tr.s * .7, 0, TAU); ctx.arc(tr.x + tr.s * .4, hz - tr.s * .7, tr.s * .5, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,170,100,.3)'; ctx.fillRect(tr.x - tr.s * .3, hz - tr.s, tr.s * .4, 2);
        });
        ctx.globalCompositeOperation = 'lighter'; for (var k = 0; k < 4; k++) { var an = .25 + k * .14, rg = ctx.createLinearGradient(sx, sy, sx + Math.cos(an) * W, sy + Math.sin(an) * W); rg.addColorStop(0, 'rgba(255,170,100,.15)'); rg.addColorStop(1, 'rgba(255,170,100,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(an - .035) * W * 1.4, sy + Math.sin(an - .035) * W * 1.4); ctx.lineTo(sx + Math.cos(an + .035) * W * 1.4, sy + Math.sin(an + .035) * W * 1.4); ctx.fill(); } ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#1c2438'; ctx.fillRect(W * .12, hz + 4, 6, 100); ctx.beginPath(); ctx.arc(W * .12 + 3, hz, 12, 0, TAU); ctx.fill(); addGlow(ctx, W * .12 + 3, hz, 50, '255,200,120', .5); // poste com a luz acendendo
        ctx.fillStyle = '#3a2616'; ctx.fillRect(W * .8, hz + 40, 110, 8); ctx.fillRect(W * .8 + 6, hz + 48, 6, 24); ctx.fillRect(W * .8 + 98, hz + 48, 6, 24); ctx.fillStyle = 'rgba(255,170,100,.5)'; ctx.fillRect(W * .8, hz + 40, 110, 2); // banco
        pigeons.forEach(function (p) { if (Math.random() < .002) p.fly = 1.2; p.fly = Math.max(0, p.fly - dt); var up = p.fly > 0; p.x += p.v * p.dir * (up ? 4 : 1) * dt; if (p.x > W + 20) p.x = -20; if (p.x < -20) p.x = W + 20; var y = p.y - (up ? 60 * Math.sin((1.2 - p.fly) * 2.6) : 0), f = up ? Math.sin(t * 18) * 12 : 0;
          ctx.fillStyle = 'rgba(30,20,40,.3)'; ctx.beginPath(); ctx.ellipse(p.x + 5, p.y + 10, 12, 3, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#e8d4c0'; ctx.beginPath(); ctx.ellipse(p.x, y, 12, 7, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(p.x + 11 * p.dir, y - 6, 5, 0, TAU); ctx.fill(); poly(ctx, [[p.x, y], [p.x - 8, y - 4 - f], [p.x + 8, y - 4 - f]], '#bfa88c'); ctx.fillStyle = '#d9a35a'; ctx.fillRect(p.x + 15 * p.dir, y - 6, 4, 2); });
        bk(t, dt); film(.5);
      };
    } },
  ];

  /* ================= FICÇÃO CIENTÍFICA ================= */
  S.ficcao = [
    { name: 'Estação espacial de jornal', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), st = starfield(c, 110, 1), bk = bokehLayer(c, 5, '120,220,210', .04), fl = floaters(c, { n: 30, dir: -1, vmin: 4, vmax: 10, smin: 12, smax: 20, color: PAPER, alpha: .55 }), sunx = W * .96, suny = H * .08, sc = Math.max(.65, Math.min(1.1, H / 330));
      function ring(cx, cy, R, ry, front, t) { // metade do anel: a de trás escura, a da frente iluminada, com janelas acesas
        ctx.strokeStyle = front ? '#c9c4b0' : '#5a5a68'; ctx.lineWidth = 9 * sc; ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(10,14,30,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
        if (!front) return; for (var i = 0; i < 18; i++) { var a = i / 18 * TAU + t * .3; if (Math.sin(a) <= 0) continue; var wx = cx + Math.cos(a) * R, wy = cy + Math.sin(a) * ry; ctx.fillStyle = '#ffd27a'; ctx.fillRect(wx - 2, wy - 2, 4, 4); addGlow(ctx, wx, wy, 14, '255,196,119', .5); }
      }
      function ship(x, y, t) { // nave de lado, de frente para a direita: casco, cabine, asas e motor aceso
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * .8) * .04); ctx.scale(sc * 1.3, sc * 1.3);
        var f = 16 + Math.sin(t * 30) * 4; ctx.globalCompositeOperation = 'lighter'; var fg = ctx.createLinearGradient(-26 - f - 10, 0, -26, 0); fg.addColorStop(0, 'rgba(111,214,200,0)'); fg.addColorStop(1, 'rgba(111,214,200,.9)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-26, -3); ctx.lineTo(-26 - f - 10, 0); ctx.lineTo(-26, 3); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; addGlow(ctx, -28, 0, 22, '111,214,200', .7);
        poly(ctx, [[-4, -8], [-18, -24], [-22, -24], [-16, -8]], '#9a9684'); poly(ctx, [[-4, 8], [-18, 24], [-22, 24], [-16, 8]], '#8a8674'); // asas
        var hg = ctx.createLinearGradient(0, -8, 0, 8); hg.addColorStop(0, '#f2eddc'); hg.addColorStop(1, '#8a8674'); poly(ctx, [[30, 0], [14, -7], [-14, -8], [-22, -5], [-22, 5], [-14, 8], [14, 7]], hg);
        ctx.fillStyle = '#2a2a38'; ctx.fillRect(-26, -4, 4, 8); ctx.strokeStyle = '#ffc477'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(10, 0); ctx.stroke(); // motor e faixa
        ctx.fillStyle = '#5fd0d8'; ctx.beginPath(); ctx.ellipse(14, -3, 8, 4, .15, 0, TAU); ctx.fill(); addGlow(ctx, 14, -3, 12, '120,230,220', .4); // cabine
        ctx.restore();
      }
      return function (t, dt) {
        var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#02030a'); g.addColorStop(1, '#0a1230'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); st(t);
        addGlow(ctx, sunx, suny, W * .5, '255,225,170', .22); addGlow(ctx, sunx, suny, 60, '255,245,220', .9);
        var cx = W * .66, cy = H * .46, R = 118 * sc, ry = 30 * sc, i; // estação: anel giratório, eixo central e painéis solares
        ring(cx, cy, R, ry, false, t);
        ctx.strokeStyle = '#8a8a98'; ctx.lineWidth = 3 * sc; for (i = 0; i < 4; i++) { var a = t * .3 + i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * ry); ctx.stroke(); } // raios do anel
        var hg = ctx.createLinearGradient(cx - 11 * sc, 0, cx + 11 * sc, 0); hg.addColorStop(0, '#6a6a7a'); hg.addColorStop(.7, '#f2eddc'); hg.addColorStop(1, '#fff6e0'); ctx.fillStyle = hg; roundBox(ctx, cx - 11 * sc, cy - 52 * sc, 22 * sc, 104 * sc, 8 * sc); ctx.fill(); // eixo, iluminado do lado do sol
        ctx.fillStyle = '#4a4a58'; ctx.fillRect(cx - 14 * sc, cy + 52 * sc, 28 * sc, 8 * sc); ctx.fillRect(cx - 1, cy - 70 * sc, 2, 18 * sc); // módulo de acoplamento e antena
        [-1, 1].forEach(function (s) { var x0 = cx + s * 11 * sc, w = 62 * sc, x1 = s > 0 ? x0 + 8 * sc : x0 - 8 * sc - w; ctx.strokeStyle = '#8a8a98'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, cy - 34 * sc); ctx.lineTo(x1 + (s > 0 ? 0 : w), cy - 34 * sc); ctx.stroke(); ctx.fillStyle = '#2a5f9a'; ctx.fillRect(x1, cy - 42 * sc, w, 16 * sc); ctx.strokeStyle = 'rgba(180,220,255,.45)'; ctx.lineWidth = 1; for (var j = 1; j < 5; j++) { ctx.beginPath(); ctx.moveTo(x1 + w * j / 5, cy - 42 * sc); ctx.lineTo(x1 + w * j / 5, cy - 26 * sc); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x1, cy - 34 * sc); ctx.lineTo(x1 + w, cy - 34 * sc); ctx.stroke(); }); // painéis solares
        ring(cx, cy, R, ry, true, t);
        if (Math.sin(t * 3) > 0) { addGlow(ctx, cx, cy - 70 * sc, 18, '120,230,220', .8); ctx.fillStyle = '#9ff'; ctx.fillRect(cx - 1.5, cy - 72 * sc, 3, 3); } // luz de navegação piscando
        ship(((t * 40) % (W + 240)) - 120, H * .74 + Math.sin(t * .8) * 4, t);
        fl(t, dt); bk(t, dt); film(.55);
      };
    } },
    { name: 'Chuva de código em manchetes', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), cols = [], step = 22, n = Math.ceil(W / step), G = 'CONTOSPOEMASNOTÍCIAS0123456789', i;
      for (i = 0; i < n; i++) cols.push({ y: rnd() * H, v: 60 + rnd() * 140, len: 8 + Math.floor(rnd() * 14), z: .5 + rnd() * .5, chars: Array.from({ length: 24 }, function () { return G.charAt(Math.floor(rnd() * G.length)); }) });
      return function (t, dt) {
        var bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .7); bg.addColorStop(0, '#05211d'); bg.addColorStop(1, '#010807'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(244,236,216,.05)'; for (var y = 0; y < H; y += 8) for (var x = (y / 8 % 2) * 4; x < W; x += 8) ctx.fillRect(x, y, 1.5, 1.5);
        ctx.textAlign = 'center'; ctx.globalCompositeOperation = 'lighter';
        cols.forEach(function (col, i) {
          col.y += col.v * dt * col.z; if (col.y - col.len * 18 > H) { col.y = 0; col.v = 60 + Math.random() * 140; }
          ctx.font = Math.round(13 + col.z * 6) + 'px "Special Elite","Courier New",monospace';
          for (var k = 0; k < col.len; k++) { var yy = col.y - k * 18; if (yy < -10 || yy > H + 10) continue; var a = (1 - k / col.len) * col.z; ctx.fillStyle = k === 0 ? 'rgba(244,236,216,' + a + ')' : 'rgba(79,227,193,' + a * .7 + ')'; ctx.fillText(col.chars[(k + Math.floor(t * 4 + i)) % col.chars.length], i * step + step / 2, yy); if (k === 0 && yy > 0 && yy < H) glow(ctx, i * step + step / 2, yy, 18, '150,255,230', .5 * col.z); } // a cabeça de cada coluna brilha
        });
        ctx.globalCompositeOperation = 'source-over';
        var sy = (t * 90) % (H + 80) - 40, sg = ctx.createLinearGradient(0, sy - 30, 0, sy + 30); sg.addColorStop(0, 'rgba(79,227,193,0)'); sg.addColorStop(.5, 'rgba(79,227,193,.08)'); sg.addColorStop(1, 'rgba(79,227,193,0)'); ctx.fillStyle = sg; ctx.fillRect(0, sy - 30, W, 60); // varredura de monitor
        addGlow(ctx, W / 2, H / 2, Math.max(W, H) * .5, '79,227,193', .08);
        var bf = ctx.createLinearGradient(0, H * .9, 0, H); bf.addColorStop(0, 'rgba(1,8,7,0)'); bf.addColorStop(1, '#010807'); ctx.fillStyle = bf; ctx.fillRect(0, H * .9, W, H * .1);
        film(.6);
      };
    } },
    { name: 'Planeta de papel com anéis de texto', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, film = finish(c), st = starfield(c, 90, 1), bk = bokehLayer(c, 5, '255,214,150', .04), RING = 'CONTOS POEMAS CRÔNICAS AVENTURAS FANTASIA ', ships = [{ a: 0, r: 1.5, v: .5 }, { a: 2, r: 1.9, v: -.35 }, { a: 4, r: 1.3, v: .7 }], sx = W * .1, sy = H * .12;
      return function (t, dt) {
        var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04061a'); g.addColorStop(1, '#0c0f30'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); st(t); addGlow(ctx, sx, sy, W * .5, '255,214,150', .2); addGlow(ctx, sx, sy, 40, '255,240,210', .9);
        var cx = W * .5, cy = H * .38, R = Math.min(W, H) * .2, rx = R * 2.1, ry = R * .5;
        function ring(front) { ctx.textAlign = 'center'; ctx.font = '15px "Old Standard TT",serif'; for (var k = 0; k < 90; k++) { var a = k / 90 * TAU + t * .12, isFront = Math.sin(a) > 0; if (isFront !== front) continue; ctx.fillStyle = 'rgba(244,236,216,' + (.5 + .4 * Math.sin(a)) + ')'; ctx.save(); ctx.translate(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); ctx.rotate(-Math.cos(a) * .35); ctx.fillText(RING.charAt(k % RING.length), 0, 0); ctx.restore(); } }
        addGlow(ctx, cx, cy, R * 2.4, '255,200,130', .18);
        ring(false);
        var pg = ctx.createRadialGradient(cx - R * .5, cy - R * .5, R * .1, cx, cy, R); pg.addColorStop(0, '#fff0cc'); pg.addColorStop(.6, '#c9a864'); pg.addColorStop(1, '#4a3820'); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(23,19,15,.5)'; for (var y = -R; y <= R; y += 9) for (var x = -R; x <= R; x += 9) { var d = (x + y + R * 2) / (R * 4); ctx.beginPath(); ctx.arc(cx + x, cy + y, .4 + d * 3.2, 0, TAU); ctx.fill(); } // retícula de sombra
        ctx.fillStyle = 'rgba(4,6,26,.5)'; ctx.beginPath(); ctx.ellipse(cx, cy + ry * .1, rx * 1.05, ry * .2, 0, 0, TAU); ctx.fill(); ctx.restore(); // sombra do anel no planeta
        ctx.strokeStyle = 'rgba(255,225,170,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke(); // borda iluminada do lado do sol
        ring(true);
        ships.forEach(function (s) { var a = s.a + t * s.v, x = cx + Math.cos(a) * rx * s.r * .8, y = cy + Math.sin(a) * ry * s.r * 1.6, dir = Math.cos(a) * (s.v > 0 ? -1 : 1); poly(ctx, [[x, y], [x + 14 * dir, y + 5], [x, y + 10]], PAPER); addGlow(ctx, x - 2 * dir, y + 5, 14, '120,230,220', .6); });
        var bf = ctx.createLinearGradient(0, H * .92, 0, H); bf.addColorStop(0, 'rgba(12,15,48,0)'); bf.addColorStop(1, '#0c0f30'); ctx.fillStyle = bf; ctx.fillRect(0, H * .92, W, H * .08);
        bk(t, dt); film(.5);
      };
    } },
  ];

  /* ================= TERROR E SUSPENSE ================= */
  S.terror = [
    { name: 'Corredor com portas', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, film = finish(c), bk = bokehLayer(c, 6, '255,196,119', .03), cx = W / 2, cy = H * .42, F = Math.min(W, H) * .9, doors = [];
      function P(X, Y, z) { return [cx + X / z * F, cy + Y / z * F]; }
      for (var i = 0; i < 6; i++) doors.push({ side: i % 2 ? 1 : -1, z0: 1 + i * 2.2, open: i === 2 });
      return function (t, dt) {
        ctx.fillStyle = '#04080c'; ctx.fillRect(0, 0, W, H);
        var far = 14, fl = .5 + .5 * Math.sin(t * 17) * Math.sin(t * 5.3), lp = P(0, 0, far);
        poly(ctx, [P(-1.4, -1, 1), P(1.4, -1, 1), P(1.4, -1, far), P(-1.4, -1, far)], '#0d1c22'); poly(ctx, [P(-1.4, 1, 1), P(1.4, 1, 1), P(1.4, 1, far), P(-1.4, 1, far)], '#10242a');
        poly(ctx, [P(-1.4, -1, 1), P(-1.4, 1, 1), P(-1.4, 1, far), P(-1.4, -1, far)], '#0a161c'); poly(ctx, [P(1.4, -1, 1), P(1.4, 1, 1), P(1.4, 1, far), P(1.4, -1, far)], '#0a161c');
        var fp = P(0, 1, 1), fq = P(0, 1, far); ctx.globalCompositeOperation = 'lighter'; var fg = ctx.createLinearGradient(0, fp[1], 0, fq[1]); fg.addColorStop(0, 'rgba(255,196,119,0)'); fg.addColorStop(1, 'rgba(255,196,119,' + (.1 + fl * .12) + ')'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(P(-.5, 1, 1)[0], fp[1]); ctx.lineTo(P(.5, 1, 1)[0], fp[1]); ctx.lineTo(P(.05, 1, far)[0], fq[1]); ctx.lineTo(P(-.05, 1, far)[0], fq[1]); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; // reflexo da lâmpada no piso
        var list = doors.map(function (d) { var z = ((d.z0 - t * .5 - 1) % 13 + 13) % 13 + 1; return { z: z, side: d.side, open: d.open }; }).sort(function (a, b) { return b.z - a.z; });
        list.forEach(function (d) { var X = d.side * 1.4, z1 = d.z, z2 = d.z + .9, o = d.open ? .55 + .25 * Math.sin(t * 3) : 0; poly(ctx, [P(X, -.35, z1), P(X, 1, z1), P(X, 1, z2), P(X, -.35, z2)], d.open ? 'rgb(' + Math.round(120 + o * 100) + ',' + Math.round(100 + o * 90) + ',' + Math.round(60 + o * 40) + ')' : '#1d3a44'); ctx.strokeStyle = '#04080c'; ctx.lineWidth = 2; ctx.stroke();
          if (d.open) { var dp = P(X, .3, z1 + .45); addGlow(ctx, dp[0], dp[1], 90 / z1 * 2, '255,196,119', .45); } else { var k = P(X, .4, z1 + .15); ctx.fillStyle = '#d9b36a'; ctx.fillRect(k[0] - 2, k[1] - 2, 4, 4); } });
        addGlow(ctx, lp[0], lp[1], Math.min(W, H) * .25, '255,196,119', .15 + fl * .5); addGlow(ctx, lp[0], lp[1], 14, '255,236,190', .5 + fl * .5);
        var fg2 = ctx.createRadialGradient(lp[0], lp[1], 0, lp[0], lp[1], H * .5); fg2.addColorStop(0, 'rgba(110,150,150,.18)'); fg2.addColorStop(1, 'rgba(110,150,150,0)'); ctx.fillStyle = fg2; ctx.fillRect(0, 0, W, H); // neblina no fundo
        var v = ctx.createRadialGradient(cx, cy, Math.min(W, H) * .25, cx, cy, Math.max(W, H) * .7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
        bk(t, dt); film(.3);
      };
    } },
    { name: 'Floresta de névoa e olhos', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), st = starfield(c, 30, .4), layers = [], eyes = [], fogs = [], flies = [], mx = W * .7, my = H * .2, i;
      function tree(g, x, y, len, ang, depth) { if (depth === 0 || len < 6) return; var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len; g.lineWidth = depth * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); tree(g, x2, y2, len * .74, ang - .4 - rnd() * .3, depth - 1); tree(g, x2, y2, len * .74, ang + .4 + rnd() * .3, depth - 1); }
      for (i = 0; i < 3; i++) { var l = document.createElement('canvas'); l.width = W; l.height = H; var g = l.getContext('2d'); g.strokeStyle = ['#17383a', '#0a1c20', '#030a0e'][i]; g.lineCap = 'round'; for (var k = 0; k < 5 + i * 2; k++) tree(g, rnd() * W, H * (.92 + i * .03), H * (.12 + i * .05), -Math.PI / 2, 7); layers.push(l); }
      for (i = 0; i < 5; i++) eyes.push({ x: rnd() * W, y: H * (.45 + rnd() * .4), s: 5 + rnd() * 5, next: rnd() * 8, on: 0 });
      for (i = 0; i < 6; i++) fogs.push({ y: H * (.4 + rnd() * .5), v: 6 + rnd() * 10, x: rnd() * W, w: W * (.5 + rnd() * .5) });
      for (i = 0; i < 14; i++) flies.push({ x: rnd() * W, y: H * (.5 + rnd() * .4), ph: rnd() * 6 });
      function fog(f, a) { ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, .5); glow(ctx, 0, 0, f.w * .6, '150,180,180', a); ctx.restore(); }
      return function (t, dt) {
        sky(c, [[0, '#04100f'], [.6, '#0f2a2c'], [1, '#2b4a4a']]); st(t); moon(ctx, mx, my, 22, '180,215,205');
        ctx.drawImage(layers[0], 0, 0); fogs.forEach(function (f, k) { f.x += f.v * dt; if (f.x > W + f.w) f.x = -f.w; if (k % 2 === 0) fog(f, .22); });
        ctx.drawImage(layers[1], 0, 0); fogs.forEach(function (f, k) { if (k % 2 === 1) fog(f, .24); });
        ctx.drawImage(layers[2], 0, 0);
        eyes.forEach(function (e) { if (t > e.next) { e.on = .8 + Math.random() * 1.2; e.next = t + 4 + Math.random() * 6; } e.on = Math.max(0, e.on - dt); if (e.on > 0 && e.on < 2) { var a = Math.min(1, e.on * 3, (2 - e.on) * 3); addGlow(ctx, e.x - e.s * 2, e.y, e.s * 4, '255,196,119', a * .6); addGlow(ctx, e.x + e.s * 2, e.y, e.s * 4, '255,196,119', a * .6); ctx.fillStyle = 'rgba(255,225,150,' + a + ')'; ctx.beginPath(); ctx.ellipse(e.x - e.s * 2, e.y, e.s, e.s * .5, 0, 0, TAU); ctx.ellipse(e.x + e.s * 2, e.y, e.s, e.s * .5, 0, 0, TAU); ctx.fill(); } });
        flies.forEach(function (f) { var a = .5 + .5 * Math.sin(t * 1.5 + f.ph); addGlow(ctx, f.x + Math.sin(t * .4 + f.ph) * 30, f.y + Math.cos(t * .3 + f.ph) * 16, 10, '170,255,210', a * .5); });
        var bf = ctx.createLinearGradient(0, H * .93, 0, H); bf.addColorStop(0, 'rgba(3,10,14,0)'); bf.addColorStop(1, '#030a0e'); ctx.fillStyle = bf; ctx.fillRect(0, H * .93, W, H * .07);
        film(.6);
      };
    } },
    { name: 'Casarão na neblina', init: function (c) {
      var ctx = c.ctx, W = c.W, H = c.H, rnd = c.rnd, film = finish(c), u = H / 224, hu = u * 1.2, hx = W * .62, gy = H * .76, fogs = [], trees = [], stars = [], i;
      for (i = 0; i < 10; i++) fogs.push({ x: rnd() * W, y: H * (.5 + rnd() * .4), r: W * (.12 + rnd() * .15), v: (4 + rnd() * 8) * (rnd() < .5 ? -1 : 1), a: .1 + rnd() * .1, front: i % 2 });
      for (i = 0; i < 30; i++) stars.push({ x: rnd() * W, y: rnd() * H * .5, r: .6 + rnd() * 1, ph: rnd() * 6 });
      function branch(list, x, y, ang, len, w, depth) { var x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len; list.push([x, y, x1, y1, w]); if (depth > 0) { branch(list, x1, y1, ang - .5 - rnd() * .4, len * .7, w * .65, depth - 1); branch(list, x1, y1, ang + .4 + rnd() * .5, len * .68, w * .6, depth - 1); } }
      [W * .16, W * .4, W * .92].forEach(function (x) { var list = []; branch(list, x, gy + 2, -Math.PI / 2 + (rnd() - .5) * .3, 34 * u * (.8 + rnd() * .5), 4 * u, 4); trees.push(list); }); // árvores secas
      function fogLayer(t, front) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fogs.forEach(function (f) { if (f.front !== front) return; var x = ((f.x + f.v * t) % (W + 2 * f.r) + W + 2 * f.r) % (W + 2 * f.r) - f.r; ctx.save(); ctx.translate(x, f.y); ctx.scale(2.6, .5); glow(ctx, 0, 0, f.r, '150,170,190', f.a); ctx.restore(); }); ctx.restore(); }
      return function (t, dt) {
        var fl = .7 + .3 * Math.sin(t * 13) * Math.sin(t * 3.1), fig = Math.pow(Math.max(0, Math.sin(t * .5)), 3);
        sky(c, [[0, '#070b16'], [.6, '#1a2638'], [1, '#3a4a5c']], gy); stars.forEach(function (s) { ctx.fillStyle = 'rgba(220,230,255,' + (.2 + .3 * Math.sin(t + s.ph)) + ')'; ctx.fillRect(s.x, s.y, s.r, s.r); });
        moon(ctx, W * .3, H * .2, 18 * u, '190,205,230'); ctx.fillStyle = 'rgba(10,14,24,.55)'; ctx.beginPath(); ctx.ellipse(W * .3 + Math.sin(t * .1) * 30, H * .2, 70 * u, 6 * u, 0, 0, TAU); ctx.fill(); // nuvem rasgando a lua
        fogLayer(t, 0);
        var gg = ctx.createLinearGradient(0, gy, 0, H); gg.addColorStop(0, '#0b1019'); gg.addColorStop(1, '#04060a'); ctx.fillStyle = gg; ctx.fillRect(0, gy, W, H - gy);
        ctx.save(); ctx.translate(hx, gy); ctx.scale(hu, hu); // casarão torto: corpo, ala baixa, torre, telhados e chaminés
        ctx.fillStyle = '#070a14'; ctx.fillRect(-46, -46, 72, 46); poly(ctx, [[-52, -46], [-14, -88], [32, -46]], '#070a14'); ctx.fillRect(-80, -30, 34, 30); poly(ctx, [[-84, -30], [-62, -50], [-42, -30]], '#070a14');
        ctx.fillRect(26, -70, 24, 70); poly(ctx, [[22, -70], [38, -106], [54, -70]], '#070a14'); ctx.fillRect(-30, -86, 6, 22); ctx.fillRect(10, -76, 7, 22);
        ctx.strokeStyle = 'rgba(170,190,230,.4)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-52, -46); ctx.lineTo(-14, -88); ctx.moveTo(22, -70); ctx.lineTo(38, -106); ctx.moveTo(-84, -30); ctx.lineTo(-62, -50); ctx.stroke(); // luz da lua nas arestas
        ctx.fillStyle = '#0d1220'; [[-38, -36], [-20, -36], [-38, -18], [8, -36], [-70, -22]].forEach(function (p) { ctx.fillRect(p[0], p[1], 9, 12); }); ctx.strokeStyle = '#05070d'; ctx.lineWidth = 1; [[-38, -36], [-20, -36], [-38, -18], [8, -36], [-70, -22]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0] + 4.5, p[1]); ctx.lineTo(p[0] + 4.5, p[1] + 12); ctx.moveTo(p[0], p[1] + 6); ctx.lineTo(p[0] + 9, p[1] + 6); ctx.stroke(); }); // janelas apagadas
        ctx.fillStyle = '#05070d'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-12, -16); ctx.arc(-6, -16, 6, Math.PI, 0); ctx.lineTo(0, 0); ctx.fill();
        ctx.fillStyle = 'rgba(255,190,100,' + (.6 + .4 * fl) + ')'; ctx.fillRect(34, -58, 8, 12); ctx.fillStyle = 'rgba(5,7,13,' + fig + ')'; ctx.beginPath(); ctx.arc(38, -54, 2.2, 0, TAU); ctx.fill(); ctx.fillRect(35.6, -52, 4.8, 6); // janela acesa e o vulto que aparece e some
        addGlow(ctx, 38, -52, 40, '255,170,80', .35 * fl); ctx.restore();
        ctx.strokeStyle = '#05070d'; ctx.lineWidth = 1.4 * u; ctx.beginPath(); for (i = -16; i <= 16; i++) { if (i % 5 === 0) continue; var fx = hx + i * 7 * u, tilt = (i % 3) * 1.5 * u; ctx.moveTo(fx, gy + 4 * u); ctx.lineTo(fx + tilt, gy - 13 * u); } ctx.moveTo(hx - 112 * u, gy - 4 * u); ctx.lineTo(hx + 112 * u, gy - 4 * u); ctx.stroke(); // cerca de ferro com falhas
        ctx.strokeStyle = '#05070d'; ctx.lineCap = 'round'; trees.forEach(function (list) { list.forEach(function (sg) { ctx.lineWidth = sg[4]; ctx.beginPath(); ctx.moveTo(sg[0], sg[1]); ctx.lineTo(sg[2], sg[3]); ctx.stroke(); }); });
        fogLayer(t, 1); film(.6);
      };
    } },
  ];

  window.TEMAS = [
    { id: 'contos', name: 'Contos' }, { id: 'poemas', name: 'Poemas' }, { id: 'aventuras', name: 'Aventuras' }, { id: 'fantasia', name: 'Fantasia' },
    { id: 'cronicas', name: 'Crônicas' }, { id: 'ficcao', name: 'Ficção Científica' }, { id: 'terror', name: 'Terror e Suspense' },
  ];
  window.CENAS = S;
})();
