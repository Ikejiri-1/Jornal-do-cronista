import { NextRequest, NextResponse } from 'next/server';
import { getAuth, handle } from '@/lib/http';
import * as store from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Substitui o SSE (a Vercel não mantém conexão aberta). Sem `since`, devolve só o número atual.
export const GET = handle(async (req: NextRequest) => {
  const raw = req.nextUrl.searchParams.get('since');
  const since = raw !== null && /^\d{1,15}$/.test(raw) ? Number(raw) : null;
  return NextResponse.json({ data: await store.changesSince(since, (await getAuth(req))?.user ?? null) }, { headers: { 'Cache-Control': 'no-store' } });
});
