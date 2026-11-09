export function ratingStats(item: unknown): { avg: number; n: number; mine: number };
export const MESL: string[];
export function nameOf(it: { kind: string; pen?: string }): string;
export function bioOf(it: unknown): string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function commentsFor(it: unknown): { uid: string; id: string; p: string; t: string; at: number }[];
