import { requireAdmin } from '@/lib/requireAdmin';
import { db } from '@/lib/supabase';
import { addKeys } from './actions';
import { logout } from './login/actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'KEY PRO | Admin', robots: { index: false, follow: false } };

export default async function AdminDashboard({ searchParams }: { searchParams: { added?: string; bad?: string; dup?: string } }) {
  await requireAdmin();
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
