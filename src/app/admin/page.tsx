import { requireAdmin } from '@/lib/requireAdmin';
import { db } from '@/lib/supabase';
import { addKeys } from './actions';
import { logout } from './login/actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'KEY PRO | Admin', robots: { index: false, follow: false } };

export default async function AdminDashboard({ searchParams }: { searchParams: { added?: string; bad?: string; dup?: string } }) {
  await requireAdmin();
  const previewUnconfigured = process.env.VERCEL_ENV === 'preview' && (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL || new URL(process.env.SUPABASE_URL).hostname.split('.')[0] === 'qonprqiftlmxofygrcbv' || !process.env.KEYPRO_PREVIEW_DB_APPROVED);
  // The test schema shares a Supabase project, but only this explicitly scoped RPC is permitted.
  // Do not use db() here: it deliberately rejects all production-project access in Preview.
  if (process.env.VERCEL_ENV === 'preview' && process.env.KEYPRO_SHARED_TEST_SCHEMA === '1') {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return <main style={{padding:32}}><h1>KEY PRO — Test Admin</h1><p>Test connection is not configured.</p></main>;
    const { createClient } = await import('@supabase/supabase-js');
    const scoped = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error} = await scoped.rpc('keypro_test_dashboard');
    if (error || !data || typeof data !== 'object') return <main style={{padding:32}}><h1>KEY PRO — Test Admin</h1><p>Test dashboard unavailable. No production data was loaded.</p></main>;
    const result = data as {products?:Array<{id:string;name:string;price:number;available:number}>;orders?:Array<{id:string;email:string;status:string;amount:number}>;refunds?:Array<{id:string;order_id:string;status:string}>};
    return <main style={{maxWidth:1080,margin:'32px auto',padding:28,fontFamily:'system-ui',background:'#101722',color:'#e8edf5',borderRadius:16}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><h1>KEY PRO — Test Admin</h1><p>Isolated test schema • Read-only dashboard • No real payments</p></div><form action={logout}><button type="submit">Sign out</button></form></header>
      <h2>Test inventory</h2>{(result.products||[]).map(p=><article key={p.id} style={{border:'1px solid #334155',padding:16,marginBottom:12,borderRadius:10}}><strong>{p.name}</strong><p>USD {p.price} · Available: {p.available}</p></article>)}
      <h2>Test orders</h2>{(result.orders||[]).length ? (result.orders||[]).map(o=><p key={o.id}>{o.id.slice(0,8)} · {o.email} · {o.status} · USD {o.amount}</p>) : <p>No test orders yet.</p>}
      <h2>Test refunds</h2>{(result.refunds||[]).length ? (result.refunds||[]).map(f=><p key={f.id}>{f.order_id.slice(0,8)} · {f.status}</p>) : <p>No test refunds yet.</p>}
      <p>Import, checkout and refund actions remain disabled until sandbox workflows are verified.</p>
    </main>;
  }
  if (previewUnconfigured) return <main style={{maxWidth:900,margin:'40px auto',padding:28,fontFamily:'system-ui'}}><h1>KEY PRO — Admin Dashboard</h1><p>Admin login successful.</p><p>Preview database is not configured. Inventory, orders, key imports and refunds are disabled to protect production data.</p><form action={logout}><button type="submit">Sign out</button></form></main>;
  const client = db();
  const { data: products, error: productError } = await client.from('products').select('id,slug,name_en,price,currency,active').order('slug');
  if (productError) throw new Error('Unable to load products');
  const { data: keys, error: stockError } = await client.from('license_keys').select('product_id,status');
  if (stockError) throw new Error('Unable to load inventory');
  const { data: orders, error: orderError } = await client.from('orders').select('id,email,quantity,amount,currency,status,created_at').order('created_at', { ascending: false }).limit(30);
  if (orderError) throw new Error('Unable to load orders');
  const stock = (id: string, status: string) => (keys || []).filter(k => k.product_id === id && k.status === status).length;
  return <main style={{maxWidth:1100,margin:'32px auto',padding:24,fontFamily:'system-ui',color:'#e8edf5',background:'#101722',borderRadius:16}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div><h1>KEY PRO — Admin Dashboard</h1><p>Private inventory and order management</p></div>
      <form action={logout}><button type="submit">Sign out</button></form>
    </header>
    <section><h2>Inventory</h2>
      {(products || []).map(p => <article key={p.id} style={{padding:20,marginBottom:16,border:'1px solid #334155',borderRadius:12}}>
        <h3>{p.name_en} {p.active ? '(Active)' : '(Inactive)'}</h3>
        <p>Price: {p.currency.toUpperCase()} {p.price} | Available: {stock(p.id,'available')} | Sold: {stock(p.id,'sold')} | Revoked: {stock(p.id,'revoked')}</p>
        {p.slug === 'windows-11-pro' ? <form action={addKeys}>
          <input type="hidden" name="product_id" value={p.id}/>
          <label htmlFor="keys">Add unused Windows 11 Pro keys (one per line)</label>
          <textarea id="keys" name="keys" required rows={5} style={{display:'block',width:'100%',margin:'12px 0',padding:12}} placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"/>
          <button type="submit">Import encrypted keys</button>
        </form> : <p>Key import is disabled until this product is approved.</p>}
      </article>)}
      {searchParams.added !== undefined && <p role="status">Added: {searchParams.added} | Duplicates: {searchParams.dup || 0} | Invalid: {searchParams.bad || 0}</p>}
    </section>
    <section><h2>Recent orders</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Order</th><th>Email</th><th>Qty</th><th>Amount</th><th>Status</th></tr></thead><tbody>
      {(orders || []).map(o => <tr key={o.id}><td>{o.id.slice(0,8)}</td><td>{o.email}</td><td>{o.quantity}</td><td>{o.currency} {o.amount}</td><td>{o.status}</td></tr>)}
    </tbody></table></div></section>
  </main>;
}
