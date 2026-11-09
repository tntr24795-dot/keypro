import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptKey } from '@/lib/crypto';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const token = /^Bearer (.+)$/i.exec(req.headers.get('authorization') || '')?.[1];
  if (!token) return NextResponse.json({error:'Authentication required'},{status:401,headers:{'Cache-Control':'no-store'}});
  const url=process.env.SUPABASE_URL, secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!secret) return NextResponse.json({error:'Service unavailable'},{status:503});
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user) return NextResponse.json({error:'Invalid session'},{status:401,headers:{'Cache-Control':'no-store'}});
  const {data:orders,error:ordersError}=await admin.from('orders').select('id,status,quantity,amount,currency,created_at,product_id').eq('customer_id',user.id).order('created_at',{ascending:false}).limit(100);
  if(ordersError) return NextResponse.json({error:'Unable to load orders'},{status:500});
  const ids=(orders||[]).filter(o=>o.status==='fulfilled').map(o=>o.id);
  const {data:deliveries,error:deliveryError}=ids.length?await admin.from('customer_deliveries').select('order_id,license_key_id').eq('customer_id',user.id).in('order_id',ids):{data:[],error:null};
  if(deliveryError) return NextResponse.json({error:'Unable to load deliveries'},{status:500});
  const keyIds=(deliveries||[]).map(d=>d.license_key_id);
  const {data:keys,error:keysError}=keyIds.length?await admin.from('license_keys').select('id,key_encrypted,status,order_id').in('id',keyIds).eq('status','sold'):{data:[],error:null};
  if(keysError) return NextResponse.json({error:'Unable to load licenses'},{status:500});
  const licenses=(deliveries||[]).flatMap(d=>{const key=(keys||[]).find(k=>k.id===d.license_key_id&&k.order_id===d.order_id);return key?[{orderId:d.order_id,key:decryptKey(key.key_encrypted)}]:[]});
  return NextResponse.json({orders:orders||[],licenses},{headers:{'Cache-Control':'private, no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff'}});
}
