import { NextResponse } from 'next/server';
import * as auth from '@/lib/auth';
import { clientIp, guardWrite, handle, setSessionCookie } from '@/lib/http';

export const runtime = 'nodejs';

export const POST = handle(async (req) => {
  await guardWrite(req, false); // sem CSRF: quem entra pode ter uma sessão velha; a Origin continua checada
  const user = await auth.register(clientIp(req), (await req.json().catch(() => ({}))) || {});
  const { sid, csrf } = await auth.createSession(user);
  const res = NextResponse.json({ data: auth.publicUser(user, csrf) });
  setSessionCookie(res, sid);
  return res;
});
