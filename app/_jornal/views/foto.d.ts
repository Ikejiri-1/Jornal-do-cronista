export function readerCodeOf(readerId: string): string;
export function currentReaderPlan(): string;
export function waitlistPlanOfCurrentReader(): string;
export function subscriptionPlanRank(plan: string): number;
export function formatSubscriberNumber(n: number): string;
export function formatMonthAndYear(ts: number): string;
export function renderSubscription(): void;
export function safePaymentUrl(v: unknown): string;
