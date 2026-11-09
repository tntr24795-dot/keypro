import 'server-only';
import { db } from './supabase';

/**
 * Fulfillment is never a payment-verification step.
 * Only a separately verified paid order may be fulfilled.
 */
export async function fulfillOrder(orderId: string) {
  const client = db();
  const { data: order, error } = await client.from('orders')
    .select('id,customer_id,quantity,status').eq('id',orderId).maybeSingle();
  if (error || !order) throw new Error('Order not found');
  if (order.status === 'refunded') throw new Error('Refunded order');
  if (order.status !== 'paid' && order.status !== 'fulfilled')
    throw new Error('Payment has not been independently verified');
  if (!order.customer_id) throw new Error('Customer account must be linked before delivery');

  const { data: keys, error: claimError } = await client.rpc('claim_keys',{p_order_id:orderId});
  if (claimError) throw new Error('Unable to allocate license inventory');
  if (!keys || keys.length !== order.quantity)
    throw new Error('Insufficient available keys; order remains pending fulfillment');

  const deliveries = keys.map((key: {id:string}) => ({
    order_id: orderId, customer_id: order.customer_id, license_key_id: key.id
  }));
  const {error: deliveryError} = await client.from('customer_deliveries')
    .upsert(deliveries,{onConflict:'license_key_id',ignoreDuplicates:true});
  if(deliveryError) throw new Error('Unable to record customer delivery');

  const {data: saved, error: verifyError} = await client.from('customer_deliveries')
    .select('license_key_id').eq('order_id',orderId).eq('customer_id',order.customer_id);
  if(verifyError || !saved || saved.length !== order.quantity)
    throw new Error('Delivery record verification failed');

  const {error: statusError} = await client.from('orders')
    .update({status:'fulfilled'}).eq('id',orderId).in('status',['paid','fulfilled']);
  if(statusError) throw new Error('Unable to finalize fulfillment');
  return 'fulfilled';
}
