import { NextResponse } from 'next/server';
import * as auth from '@/lib/auth';
import { clientIp, guardWrite, handle, setSessionCookie } from '@/lib/http';

export const runtime = 'nodejs';

export const POST = handle(async (req) => {
  guardWrite(req);
  const user = await auth.register(clientIp(req), (await req.json().catch(() => ({}))) || {});
  const sid = auth.createSession(user);
  const csrf = auth.readSession(sid)!.csrf;
  const res = NextResponse.json({ data: auth.publicUser(user, csrf) });
  setSessionCookie(res, sid);
  return res;
});
