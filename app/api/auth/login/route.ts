import { NextResponse } from 'next/server';
import * as auth from '@/lib/auth';
import { clientIp, guardWrite, handle, SESSION_COOKIE, setSessionCookie } from '@/lib/http';

export const runtime = 'nodejs';

export const POST = handle(async (req) => {
  guardWrite(req, false); // sem CSRF: quem entra pode ter uma sessão velha; a Origin continua checada
  const user = await auth.login(clientIp(req), (await req.json().catch(() => ({}))) || {});
  auth.destroySession(req.cookies.get(SESSION_COOKIE)?.value); // sessão nova a cada login (evita fixação)
  const sid = auth.createSession(user);
  const res = NextResponse.json({ data: auth.publicUser(user, auth.readSession(sid)!.csrf) });
  setSessionCookie(res, sid);
  return res;
});
