import { db } from '@/lib/supabase';
import { nowpaymentsVerify } from '@/lib/payments';
import { fulfillOrder } from '@/lib/fulfill';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !nowpaymentsVerify(body, req.headers.get('x-nowpayments-sig'))) {
    return new Response('invalid signature', { status: 400 });
  }
  const supa = db();
  const { data: order } = await supa.from('orders').select('*').eq('id', String(body.order_id)).maybeSingle();
  if (!order || order.provider !== 'nowpayments') return Response.json({ ok: true });

  const status = String(body.payment_status);
  const priceOk = Number(body.price_amount) >= Number(order.amount) - 0.01
    && String(body.price_currency).toLowerCase() === order.currency;

  if (status === 'finished' && priceOk) {
    await supa.from('orders').update({ capture_ref: String(body.payment_id ?? '') }).eq('id', order.id);
    await fulfillOrder(order.id);
  } else if ((status === 'expired' || status === 'failed') && order.status === 'pending') {
    await supa.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
  }
  return Response.json({ ok: true });
}
