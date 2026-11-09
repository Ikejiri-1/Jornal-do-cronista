import { useMemo, useRef, useState } from 'react';
import { createSound } from './sound.js';
import type { Sound } from './sound.js';

export type Mode = 'type' | 'office' | 'mech' | 'mem';
const KEY = 'gazeta-tw-sound';

function stored(): boolean {
  try { return JSON.parse(localStorage.getItem(KEY) as string) !== 0; } catch { return true; }
}

/** Som da máquina de escrever e dos teclados. O AudioContext só nasce no primeiro uso (ctx()), que sempre vem de um gesto. */
export function useTypewriterSound(mode: Mode) {
  const modeRef = useRef(mode); modeRef.current = mode;
  const sound = useRef<Sound | null>(null);
  const on = useRef<boolean | null>(null);
  const [enabled, setEnabledState] = useState(true);
  return useMemo(() => {
    const get = () => (sound.current ||= createSound(() => modeRef.current));
    const isOn = () => (on.current ??= stored());
    // devolve o som pronto para tocar, ou null se estiver desligado ou o navegador não deixar
    const ready = () => (isOn() && get().ctx() ? get() : null);
    const now = (s: Sound) => (s.ac() as AudioContext).currentTime + 0.002;
    return {
      enabled,
      /** relê o valor salvo (depois de montar, para não divergir do HTML do servidor) */
      load() { setEnabledState(isOn()); },
      isOn,
      setOn(v: boolean) { on.current = v; setEnabledState(v); try { localStorage.setItem(KEY, JSON.stringify(v ? 1 : 0)); } catch {} },
      ctx: () => get().ctx(),
      ac: () => sound.current?.ac() ?? null,
      hit: (t: number, o: Parameters<Sound['hit']>[1]) => get().hit(t, o),
      thump: (t: number, fq: number, d: number, g: number, ty?: OscillatorType) => get().thump(t, fq, d, g, ty),
      ring: (t: number, fq: number, d: number, g: number) => get().ring(t, fq, d, g),
      /** letra digitada */
      strike(ch: string, kb: boolean) {
        const s = ready(); if (!s) return;
        if (kb) return s.kbHit(ch === ' ' ? 'space' : 'k', Math.random());
        const t = now(s), r = Math.random();
        if (ch === ' ') { s.thump(t, 85 + r * 10, .1, .45); s.hit(t, { d: .05, g: .3, f: 900, q: .8 }); s.hit(t + .03, { d: .06, g: .12, f: 380, q: .7 }); return; }
        s.hit(t, { d: .016, g: .5 + r * .15, f: 3000 + r * 1100, q: 1.3 });
        s.thump(t + .004, 115 + r * 40, .075, .4);
        s.hit(t + .014, { d: .05, g: .16, f: 620 + r * 120, q: .8 });
        s.hit(t + .05, { d: .03, g: .08, f: 1500, q: 2 });
      },
      back(kb: boolean) {
        const s = ready(); if (!s) return;
        if (kb) return s.kbHit('back', Math.random());
        const t = now(s);
        s.hit(t, { d: .02, g: .25, f: 2200, q: 1 }); s.thump(t, 150, .05, .18); s.hit(t + .03, { d: .03, g: .1, f: 900, q: 1 });
      },
      /** Enter / retorno do carro */
      enter(kb: boolean) {
        const s = ready(); if (!s) return;
        if (kb) return s.kbHit('enter', Math.random());
        const t = now(s);
        s.hit(t, { d: .03, g: .4, f: 1800, q: 1.2 });
        s.hit(t + .04, { d: .34, g: .1, f: 520, type: 'lowpass', q: .7 });
        for (let i = 0; i < 14; i++) s.hit(t + .05 + i * .022, { d: .011, g: .17, f: 2700 + i * 45, q: 2 });
        s.thump(t + .38, 72, .16, .55); s.hit(t + .38, { d: .07, g: .4, f: 620, q: .8 });
      },
      /** sininho ao passar de 60 colunas */
      bell(kb: boolean) {
        if (kb) return;
        const s = ready(); if (!s) return;
        const t = now(s);
        s.hit(t, { d: .01, g: .3, f: 5000, q: 1 });
        s.ring(t, 2400, 1.5, .2); s.ring(t, 2400 * 2.76, .9, .1); s.ring(t, 2400 * 5.4, .5, .05); s.ring(t, 2410, 1.2, .1);
      },
      /** som ao trocar de teclado ou ligar o som */
      preview(kb: boolean) {
        const s = ready(); if (!s) return;
        if (kb) s.kbHit('k', .5); else this.bell(false);
      },
    };
  }, [enabled]);
}
