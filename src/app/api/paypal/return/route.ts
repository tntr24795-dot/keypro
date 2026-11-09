import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { paypalCapture } from '@/lib/payments';
import { fulfillOrder } from '@/lib/fulfill';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const oid = url.searchParams.get('oid') || '';
  const token = url.searchParams.get('token') || '';
  const home = new URL('/', req.url);
  if (!UUID.test(oid) || !token) return NextResponse.redirect(home);

  const supa = db();
  const { data: order } = await supa.from('orders').select('*').eq('id', oid).maybeSingle();
  if (!order || order.provider !== 'paypal' || order.provider_ref !== token) return NextResponse.redirect(home);

  if (order.status === 'pending' || order.status === 'cancelled') {
    const cap = await paypalCapture(token);
    if (cap && cap.currency === order.currency && Math.abs(cap.value - Number(order.amount)) < 0.01) {
      await supa.from('orders').update({ capture_ref: cap.captureId }).eq('id', order.id);
      try { await fulfillOrder(order.id); } catch (e) { console.error(e); }
    }
  }
  return NextResponse.redirect(new URL(`/success?o=${order.id}`, req.url));
}
