// Ponte entre o resto do jornal (JS imperativo) e o componente Typewriter. O componente se registra ao montar.
export interface TwDeps {
  state: Record<string, any>;
  render(): void;
  toTop(): void;
  draftRestore(): void;
}
export interface TwApi {
  open(kind?: string): boolean;
  close(): void;
  isOpen(): boolean;
  fit(): void;
  sound(): boolean;
  setSound(v: boolean): void;
  ctx(): AudioContext | null;
  ac(): AudioContext | null;
  hit(t: number, o: { d: number; g: number; f: number; q?: number; type?: BiquadFilterType }): void;
  thump(t: number, fq: number, d: number, g: number, ty?: OscillatorType): void;
  ring(t: number, fq: number, d: number, g: number): void;
}
let api: TwApi | null = null;
let deps: TwDeps | null = null;
export const registerTypewriter = (a: TwApi | null) => { api = a; };
export const initTypewriter = (d: TwDeps) => { deps = d; };
export const getDeps = () => deps;
/** Fachada usada por engine.js e ios: funciona mesmo antes de o componente montar. */
export const tw = {
  open: (k?: string) => (api ? api.open(k) : false),
  close: () => api?.close(),
  isOpen: () => !!api && api.isOpen(),
  fit: () => api?.fit(),
  sound: () => (api ? api.sound() : true),
  setSound: (v: boolean) => api?.setSound(v),
  ctx: () => (api ? api.ctx() : null),
  ac: () => (api ? api.ac() : null),
  hit: (t: number, o: Parameters<TwApi['hit']>[1]) => api?.hit(t, o),
  thump: (t: number, fq: number, d: number, g: number, ty?: OscillatorType) => api?.thump(t, fq, d, g, ty),
  ring: (t: number, fq: number, d: number, g: number) => api?.ring(t, fq, d, g),
};
