import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifyToken } from './adminAuth';

export async function requireAdmin() {
  const s = await verifyToken(cookies().get(SESSION_COOKIE)?.value, 's');
  if (!s) redirect('/admin/login');
  return s.e;
}
