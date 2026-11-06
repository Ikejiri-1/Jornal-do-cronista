import { NextRequest, NextResponse } from 'next/server';
import { readSession } from './auth';

type Extra = { field?: string; retryAfter?: number };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public extra: Extra = {}) { super(message); }
}
export const fail = (status: number, code: string, message: string, extra?: Extra) => new ApiError(status, code, message, extra);
export const ok = (data: unknown) => NextResponse.json({ data });
export const SESSION_COOKIE = 'sid';
export const IS_PROD = process.env.NODE_ENV === 'production';

// Atrás de um proxy confiável (TRUST_PROXY=1) usa o IP real; sem proxy não há IP confiável e o limite vira global.
export const clientIp = (req: NextRequest) => (process.env.TRUST_PROXY ? (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() : '') || 'local';

export const getAuth = (req: NextRequest) => readSession(req.cookies.get(SESSION_COOKIE)?.value);

// Escritas: Origin do mesmo site + token CSRF da sessão (duas camadas).
export function guardWrite(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch { /* origem inválida */ }
    if (host !== req.headers.get('host')) throw fail(403, 'CSRF', 'Origem não permitida.');
  }
  const auth = getAuth(req);
  if (auth && req.headers.get('x-csrf-token') !== auth.csrf) throw fail(403, 'CSRF', 'Sessão inválida. Recarregue a página.');
  return auth;
}

export const setSessionCookie = (res: NextResponse, sid: string) =>
  res.cookies.set(SESSION_COOKIE, sid, { httpOnly: true, sameSite: 'lax', secure: IS_PROD, path: '/', maxAge: sid ? 12 * 3600 : 0 });

// Um formato de erro só; nunca devolve pilha nem detalhe interno.
export function handle<C>(fn: (req: NextRequest, ctx: C) => Promise<Response> | Response) {
  return async (req: NextRequest, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      const known = error instanceof ApiError ? error : null;
      if (!known) console.error(error);
      const res = NextResponse.json(
        { error: { code: known ? known.code : 'ERRO_INTERNO', message: known ? known.message : 'Algo deu errado. Tente de novo.', field: known?.extra.field } },
        { status: known ? known.status : 500 },
      );
      if (known?.extra.retryAfter) res.headers.set('Retry-After', String(known.extra.retryAfter));
      return res;
    }
  };
}
