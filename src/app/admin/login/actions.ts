'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminEmails, signToken, sessionToken, SESSION_COOKIE } from '@/lib/adminAuth';
import { sendAdminLoginEmail } from '@/lib/email';

const cookieOpts = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: 7 * 24 * 3600 };

export async function sendLoginLink(form: FormData) {
  const email = String(form.get('email') || '').trim().toLowerCase();
  if (adminEmails().includes(email)) {
    const token = await signToken({ e: email, k: 'l', exp: Date.now() + 15 * 60 * 1000 });
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/login/verify?token=${encodeURIComponent(token)}`;
    await sendAdminLoginEmail(email, url);
  }
  redirect('/admin/login?sent=1');
}

export async function passwordLogin(form: FormData) {
  const email = String(form.get('email') || '').trim().toLowerCase();
  const pw = String(form.get('password') || '');
  const ok = adminEmails().includes(email) && !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
  if (!ok) redirect('/admin/login?err=1');
  cookies().set(SESSION_COOKIE, await sessionToken(email), cookieOpts);
  redirect('/admin');
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect('/admin/login');
}
