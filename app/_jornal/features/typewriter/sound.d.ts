export type KbKind = 'k' | 'space' | 'enter' | 'back';
export interface Sound {
  /** Cria (ou retoma) o AudioContext. Só chamar a partir de um gesto da pessoa. */
  ctx(): AudioContext | null;
  hit(t: number, o: { d: number; g: number; f: number; q?: number; type?: BiquadFilterType }): void;
  thump(t: number, fq: number, d: number, g: number, ty?: OscillatorType): void;
  ring(t: number, fq: number, d: number, g: number): void;
  kbHit(kind: KbKind, r: number): void;
  ac(): AudioContext | null;
}
export function createSound(getMode: () => string): Sound;
