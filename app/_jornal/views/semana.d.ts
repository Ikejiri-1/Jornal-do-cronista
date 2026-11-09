export function hashStr(t: unknown): number;
export const ART_SC: Record<string, string>;
export const ART_CAP: Record<string, string>;
export const ART_ST: Record<string, string[]>;
export function weekNow(): number;
export function weekRange(n: number): [Date, Date];
export function closeLabel(): string;
export function dShort(d: Date): string;
export function weekLabel(n: number): string;
export function weekNoOf(ms: number): number;
export function likeCounts(): Record<string, number>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function editionData(): { week: number; mode: string; list: any[]; pick: any; cols: any[] };
