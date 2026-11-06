import { NextResponse } from 'next/server';
import { fail, getAuth, handle } from '@/lib/http';
import * as store from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handle(async (req, { params }: { params: Promise<{ collection: string }> }) => {
  const { collection } = await params;
  if (!store.ruleFor(collection)) throw fail(404, 'NAO_ENCONTRADO', 'Coleção inexistente.');
  return NextResponse.json({ data: store.listDocs(collection, getAuth(req)?.user ?? null) }, { headers: { 'Cache-Control': 'no-store' } });
});
