import { NextResponse } from 'next/server';
import { publicUser } from '@/lib/auth';
import { getAuth, handle } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Quem sou eu. Também serve de "continuar conectado": cada chamada renova os 30 min.
export const GET = handle(async (req) => {
  const session = await getAuth(req);
  return NextResponse.json({ data: session ? publicUser(session.user, session.csrf) : null }, { headers: { 'Cache-Control': 'no-store' } });
});
