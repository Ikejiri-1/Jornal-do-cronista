'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { flushSync } from 'react-dom';
import { IOS } from '../ios/platform.js';
import { getDeps, registerTypewriter } from './controller';
import { useTypewriterSound } from './useTypewriterSound';
import type { Mode } from './useTypewriterSound';

// Máquina de escrever em tela cheia. Os formulários de história e de obra continuam na marcação do jornal:
// ao abrir, o formulário é movido para #tw-slot (React nunca toca nos filhos desse div) e devolvido ao fechar.
const MODES: Mode[] = ['type', 'office', 'mech', 'mem'];
const LABEL: Record<Mode, string> = { type: 'máquina', office: 'escritório', mech: 'mecânico', mem: 'membrana' };
const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
type Cell = string | { k?: string; n?: string; w?: number; s?: number; m?: number };
const KB: Cell[][] = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', { k: '⌫', n: 'BACK', w: 1.6 }],
  [{ s: .5 }, 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', { s: 1.1 }],
  [{ s: .75 }, 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', { k: '↵', n: 'ENTER', w: 1.85 }],
  [{ s: 1.25 }, 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', { s: 1.35 }],
  [{ k: 'Ctrl', m: 1, w: 1.3 }, { k: 'Alt', m: 1, w: 1.3 }, { n: ' ', w: 5.5 }, { k: 'Alt', m: 1, w: 1.3 }, { k: 'Ctrl', m: 1, w: 1.3 }, { s: .9 }],
];
const BIG = ['#s-text', '#w-text'];
const FIELDS = ['#s-text', '#s-title', '#s-pen', '#s-bio', '#w-text', '#w-title', '#w-genre-new', '#w-behind'];
const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T | null;
const lsGet = (k: string): unknown => { try { return JSON.parse(localStorage.getItem(k) as string); } catch { return null; } };

export default function Typewriter() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('type');
  const [lock, setLock] = useState('');
  const [where, setWhere] = useState('Redação · O Contista');
  const [date, setDate] = useState('');
  const [msg, setMsg] = useState({ t: '', err: false });
  const [fit, setFit] = useState<{ h: number; top: number; compact: boolean } | null>(null);
  const snd = useTypewriterSound(mode);

  const openRef = useRef(false);
  const modeRef = useRef<Mode>('type'); modeRef.current = mode;
  const sndRef = useRef(snd); sndRef.current = snd;
  const kind = useRef('story');
  const form = useRef<HTMLElement | null>(null);
  const home = useRef<{ p: ParentNode | null; n: Node | null } | null>(null);
  const base = useRef(0);
  const slot = useRef<HTMLDivElement>(null);
  const keys = useRef<Record<string, HTMLElement>>({});
  const kbKeys = useRef<Record<string, HTMLElement>>({});
  const kb = () => modeRef.current !== 'type';

  const press = (name: string, useKb: boolean) => {
    const el = (useKb ? kbKeys : keys).current[name]; if (!el) return;
    el.classList.add('down'); setTimeout(() => el.classList.remove('down'), 90);
  };
  const auto = (t?: HTMLElement | null) => {
    const el = t || $(kind.current === 'work' ? '#w-text' : '#s-text'); if (!el) return;
    el.style.height = 'auto'; el.style.height = el.scrollHeight + 4 + 'px';
  };
  const doFit = () => {
    const vv = window.visualViewport, h = vv ? vv.height : window.innerHeight;
    setFit({ h, top: vv ? vv.offsetTop : 0, compact: h < 560 });
  };

  const openTw = (k?: string) => {
    const d = getDeps(); k = k || 'story';
    if (openRef.current) return true;
    if (!d) return false;
    const f = $(k === 'work' ? '#workForm' : '#storyForm'), first = $<HTMLInputElement>(k === 'work' ? '#w-title' : '#s-pen');
    if (!f || !first || !slot.current) return false;
    kind.current = k; form.current = f; home.current = { p: f.parentNode, n: f.nextSibling };
    if (k === 'story' && !first.value) { try { first.value = localStorage.getItem('gazeta-pen') || ''; } catch { /* sem storage */ } }
    let why = '';
    if (k === 'story') {
      if (!d.state.uid) why = 'Você pode escrever agora. Ao enviar, pedimos o seu login e guardamos o rascunho.';
      else if (d.state.canWrite === false) why = 'Seu acesso a esta página é só de leitura. Você pode escrever aqui, mas para publicar peça ao dono acesso de colaborador.';
    }
    const sv = $<HTMLButtonElement>(k === 'work' ? '#w-save' : '#s-save'); if (sv) sv.disabled = !!why && !!d.state.uid;
    slot.current.appendChild(f); f.hidden = false;
    $('.sheet')?.classList.add('in-hidden'); document.body.style.overflow = 'hidden';
    base.current = d.state.lastPost; window.scrollTo(0, 0);
    openRef.current = true;
    let dt = ''; try { dt = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(); } catch { /* sem Intl */ }
    flushSync(() => { setLock(why); setWhere(k === 'work' ? 'Mesa do redator · Original' : 'Redação · O Contista'); setDate(dt); setMsg({ t: '', err: false }); setOpen(true); });
    return true;
  };
  const closeTw = () => {
    const d = getDeps(); if (!openRef.current || !d) return; openRef.current = false;
    if (form.current && home.current?.p) home.current.p.insertBefore(form.current, home.current.n);
    flushSync(() => { setOpen(false); setLock(''); });
    document.body.style.overflow = ''; $('.sheet')?.classList.remove('in-hidden');
    if (kind.current === 'work') { d.state.workFormOpen = false; d.state.editing = null; } else d.state.composerOpen = false;
    auto($('#s-text')); auto($('#w-text')); d.render();
    $(kind.current === 'work' ? '[data-act="newwork"]' : '#btnNewStory')?.focus({ preventScroll: true });
    form.current = null; home.current = null;
    const sv = $<HTMLButtonElement>('#s-save'); if (sv) sv.disabled = false;
    if (d.state.goEnvios) { d.state.goEnvios = false; d.state.layer = 'envios'; d.state.reading = null; d.render(); d.toTop(); }
  };
  const fns = useRef({ openTw, closeTw, doFit, auto, press });
  fns.current = { openTw, closeTw, doFit, auto, press };

  // ao abrir: ajusta a altura, o campo e restaura o rascunho (o #tw já está visível aqui)
  useLayoutEffect(() => {
    if (!open) return;
    const d = getDeps(), k = kind.current; if (!d) return;
    fns.current.doFit(); fns.current.auto();
    if (k === 'story') d.draftRestore();
    const first = $<HTMLInputElement>(k === 'work' ? '#w-title' : '#s-pen');
    const focus = () => { try { (k === 'story' && $<HTMLInputElement>('#s-pen')?.value ? $('#s-title') : first)?.focus({ preventScroll: true }); } catch { /* campo sumiu */ } };
    if (IOS) focus();
    const t = setTimeout(focus, 60);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const m = lsGet('gazeta-tw-mode');
    const next: Mode = MODES.includes(m as Mode) ? (m as Mode) : lsGet('gazeta-tw-kb') === 1 ? 'office' : 'type'; // migra a escolha antiga (0/1)
    setMode(next); modeRef.current = next;
    sndRef.current.load();
    registerTypewriter({
      open: (k) => fns.current.openTw(k), close: () => fns.current.closeTw(), isOpen: () => openRef.current, fit: () => fns.current.doFit(),
      sound: () => sndRef.current.isOn(), setSound: (v) => sndRef.current.setOn(v),
      ctx: () => sndRef.current.ctx(), ac: () => sndRef.current.ac(),
      hit: (t, o) => sndRef.current.hit(t, o), thump: (t, fq, d, g, ty) => sndRef.current.thump(t, fq, d, g, ty), ring: (t, fq, d, g) => sndRef.current.ring(t, fq, d, g),
    });
    const offs: Array<() => void> = [];
    const on = (t: EventTarget | null, ev: string, fn: EventListener, o?: boolean) => { if (!t) return; t.addEventListener(ev, fn, o); offs.push(() => t.removeEventListener(ev, fn, o)); };
    on(document, 'keydown', (e) => { if (openRef.current && (e as KeyboardEvent).key === 'Escape') fns.current.closeTw(); });
    const refit = () => { if (openRef.current) fns.current.doFit(); };
    on(window.visualViewport, 'resize', refit); on(window.visualViewport, 'scroll', refit); on(window, 'resize', refit);
    on(document.getElementById('tw'), 'click', (e) => { if ((e.target as Element).closest('[data-act="closestory"],[data-act="cancelwork"]')) fns.current.closeTw(); });
    FIELDS.forEach((sel) => on($(sel), 'input', (e) => {
      const el = e.currentTarget as HTMLTextAreaElement, ev = e as InputEvent, big = BIG.includes(sel), t = ev.inputType || '', ch = ev.data, s = sndRef.current, useKb = kb();
      if (big) fns.current.auto(el);
      if (!openRef.current) return;
      if (t === 'insertLineBreak' || (big && ch === '\n')) { if (useKb) fns.current.press('ENTER', true); s.enter(useKb); }
      else if (t.indexOf('delete') === 0) { if (useKb) fns.current.press('BACK', true); s.back(useKb); }
      else if (ch) {
        const name = ch.toUpperCase();
        fns.current.press(name, useKb);
        s.strike(ch, useKb);
      }
      if (big) {
        const v = el.value, pos = el.selectionStart ?? 0, ls = v.lastIndexOf('\n', pos - 1) + 1;
        if (t.indexOf('insert') === 0 && pos - ls === 60) s.bell(useKb);
        if (pos === v.length) { const sc = $('#tw-scroll'); if (sc) sc.scrollTop = sc.scrollHeight; }
      }
    }));
    // depois de enviar, espera o resultado e fecha sozinha (a história leva à aba Enviados)
    const watch = (done: (d: NonNullable<ReturnType<typeof getDeps>>) => boolean, then: () => void) => {
      if (!openRef.current) return; let n = 0;
      const iv = setInterval(() => {
        const d = getDeps(); n++;
        if (!openRef.current || n > 220 || !d) { clearInterval(iv); return; }
        if (done(d)) { clearInterval(iv); then(); }
      }, 400);
      offs.push(() => clearInterval(iv));
    };
    on($('#workForm'), 'submit', () => watch((d) => !d.state.workFormOpen, () => setTimeout(() => { if (openRef.current) fns.current.closeTw(); }, 2200)));
    on($('#storyForm'), 'submit', () => { const t0 = base.current; watch((d) => d.state.lastPost > t0, () => setTimeout(() => { const d = getDeps(); if (openRef.current && d) { d.state.goEnvios = true; fns.current.closeTw(); } }, 2600)); });
    const note = $('#note');
    if (note) {
      const mo = new MutationObserver(() => { if (openRef.current) setMsg({ t: note.hidden ? '' : note.textContent || '', err: note.classList.contains('err') }); });
      mo.observe(note, { childList: true, characterData: true, subtree: true, attributes: true });
      offs.push(() => mo.disconnect());
    }
    return () => { registerTypewriter(null); offs.forEach((f) => f()); };
  }, []);

  const useKb = mode !== 'type';
  const nextMode = () => {
    const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    modeRef.current = next; setMode(next);
    try { localStorage.setItem('gazeta-tw-mode', JSON.stringify(next)); } catch { /* sem storage */ }
    if (openRef.current) fns.current.doFit();
    snd.preview(next !== 'type');
    if (openRef.current) $(kind.current === 'work' ? '#w-text' : '#s-text')?.focus({ preventScroll: true });
  };
  const toggleSound = () => { snd.setOn(!snd.isOn()); if (snd.isOn()) { snd.ctx(); snd.bell(useKb); } };
  const cls = [useKb ? 'kb' : '', 'm-' + mode, fit?.compact ? 'compact' : ''].filter(Boolean).join(' ');
  const reg = (store: RefObject<Record<string, HTMLElement>>, name: string) => (el: HTMLElement | null) => { if (el && store.current) store.current[name] = el; };

  return (
    <div id="tw" role="dialog" aria-modal="true" aria-labelledby="tw-h" hidden={!open} className={cls}
      style={fit ? { height: fit.h + 'px', top: fit.top + 'px' } : undefined}>
      <div className="tw-top"><b id="tw-h">Máquina de escrever</b><span>
        <button className="btn small" type="button" id="tw-sound" aria-pressed={snd.enabled} onClick={toggleSound}>Som: {snd.enabled ? 'ligado' : 'desligado'}</button>{' '}
        <button className="btn small" type="button" id="tw-kbtoggle" title="Trocar o teclado: máquina de escrever, escritório, mecânico ou membrana" onClick={nextMode}>Teclado: {LABEL[mode]}</button>{' '}
        <button className="btn small" type="button" id="tw-exit" onClick={() => closeTw()}>Sair</button></span></div>
      <div className="tw-scroll" id="tw-scroll"><div className="tw-paper">
        <p className="tw-head"><span id="tw-where">{where}</span><span id="tw-date">{date}</span></p>
        <p className="tw-msg err" id="tw-lock" role="status">{lock}</p>
        <div id="tw-slot" ref={slot}></div>
        <p className={'tw-msg' + (msg.err ? ' err' : '')} id="tw-msg" role="status">{msg.t}</p>
      </div></div>
      <div className="tw-machine" aria-hidden="true"><div className="tw-platen"><i></i><i></i></div><div className="tw-body"><span className="tw-plate">O CONTISTA · MOD. 1926</span>
        <div id="tw-keys">
          {ROWS.map((r) => <div className="tw-row" key={r}>{r.split('').map((c) => <span className="tw-key" data-k={c} key={c} ref={reg(keys, c)}>{c}</span>)}</div>)}
          <div className="tw-row"><span className="tw-key sp" data-k=" " ref={reg(keys, ' ')}></span></div>
        </div></div></div>
      <div className="tw-kbd" id="tw-kbd" aria-hidden="true"><div className="kb-wrap">
        {KB.map((row, i) => <div className="kb-r" key={i}>{row.map((c, j) => {
          if (typeof c === 'string') return <span className="kb-k" data-k={c} key={j} ref={reg(kbKeys, c)}>{c}</span>;
          if (c.s) return <span className="kb-s" style={{ flexGrow: c.s }} key={j}></span>;
          return <span className={'kb-k' + (c.m ? ' mod' : '')} data-k={c.n} style={{ flexGrow: c.w || 1 }} key={j} ref={c.n ? reg(kbKeys, c.n) : undefined}>{c.k || ''}</span>;
        })}</div>)}
      </div></div>
    </div>
  );
}
