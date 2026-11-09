import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionToken, verifyToken } from '@/lib/adminAuth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const link = await verifyToken(url.searchParams.get('token') ?? undefined, 'l');
  if (!link) return NextResponse.redirect(new URL('/admin/login?err=2', req.url));
  const res = NextResponse.redirect(new URL('/admin', req.url));
  res.cookies.set(SESSION_COOKIE, await sessionToken(link.e), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 3600,
  });
  return res;
}
