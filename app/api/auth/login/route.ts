import { NextResponse } from 'next/server';
import * as auth from '@/lib/auth';
import { clientIp, guardWrite, handle, SESSION_COOKIE, setSessionCookie } from '@/lib/http';

export const runtime = 'nodejs';

export const POST = handle(async (req) => {
  await guardWrite(req, false); // sem CSRF: quem entra pode ter uma sessão velha; a Origin continua checada
  const user = await auth.login(clientIp(req), (await req.json().catch(() => ({}))) || {});
  await auth.destroySession(req.cookies.get(SESSION_COOKIE)?.value); // sessão nova a cada login (evita fixação)
  const { sid, csrf } = await auth.createSession(user);
  const res = NextResponse.json({ data: auth.publicUser(user, csrf) });
  setSessionCookie(res, sid);
  return res;
});
