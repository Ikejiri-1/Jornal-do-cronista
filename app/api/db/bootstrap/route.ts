import { NextRequest, NextResponse } from 'next/server';
import { getAuth, handle } from '@/lib/http';
import * as store from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Uma requisição só traz o que a tela precisa para abrir.
export const GET = handle(async (req: NextRequest) =>
  NextResponse.json({ data: await store.bootstrap((await getAuth(req))?.user ?? null) }, { headers: { 'Cache-Control': 'no-store' } }));
