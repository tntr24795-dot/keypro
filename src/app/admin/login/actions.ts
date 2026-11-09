'use server';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {issueToken,SESSION_COOKIE,validAdminCredentials} from '@/lib/adminAuth';
export async function login(form:FormData){
 const email=String(form.get('email')||'').trim().toLowerCase();
 const password=String(form.get('password')||'');
 if(!validAdminCredentials(email,password))redirect('/admin/login?error=1');
 cookies().set(SESSION_COOKIE,issueToken(email),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:8*60*60});
 redirect('/admin');
}
export async function logout(){
 cookies().set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});
 redirect('/admin/login');
}
