import { NextResponse } from 'next/server';
import * as auth from '@/lib/auth';
import { guardWrite, handle, SESSION_COOKIE, setSessionCookie } from '@/lib/http';

export const runtime = 'nodejs';

export const POST = handle((req) => {
  guardWrite(req);
  auth.destroySession(req.cookies.get(SESSION_COOKIE)?.value);
  const res = NextResponse.json({ data: null });
  setSessionCookie(res, '');
  return res;
});
