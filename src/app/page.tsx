import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type Product = { id:string; slug:string; name_en:string; name_th:string; price:number|null; currency:string; active:boolean };
async function catalog(): Promise<{product:Product; available:number}[]> {
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || (process.env.VERCEL_ENV === 'preview' && (new URL(url).hostname.split('.')[0] === 'qonprqiftlmxofygrcbv' || !process.env.KEYPRO_PREVIEW_DB_APPROVED))) return [];
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:products,error}=await client.from('products').select('id,slug,name_en,name_th,price,currency,active').order('sort');
  if(error) throw new Error('Catalog is temporarily unavailable');
  const {data:counts,error:stockError}=await client.from('license_keys').select('product_id').eq('status','available');
  if(stockError) throw new Error('Inventory is temporarily unavailable');
  return (products||[]).map(p=>({product:p,available:(counts||[]).filter(k=>k.product_id===p.id).length}));
}

export default async function Home() {
  const items=await catalog();
  return <main style={{maxWidth:1120,margin:'0 auto',padding:'32px 20px',fontFamily:'system-ui'}}>
    <header style={{marginBottom:36}}><h1>KEY PRO</h1><p>Digital Software Keys</p></header>
    <h2>Products</h2>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:20}}>
      {items.map(({product:p,available})=>{
        const inStock=p.slug==='windows-11-pro' && p.active && p.price!==null && available>0;
        return <article key={p.id} style={{border:'1px solid #334155',borderRadius:14,padding:24}}>
          <h3>{p.name_en}</h3>
          <p>{p.price===null?'Price coming soon':new Intl.NumberFormat('en-US',{style:'currency',currency:p.currency.toUpperCase()}).format(p.price)}</p>
          <p style={{fontWeight:700,color:inStock?'#15803d':'#b91c1c'}}>{inStock?'In Stock — Available '+available:'Out of Stock'}</p>
          <p>{inStock?'Checkout is not yet available.':'Currently unavailable for purchase.'}</p>
        </article>;
      })}
    </div>
    <footer style={{marginTop:64}}>© 2026 KEY PRO | Powered by KNOXZYNX</footer>
  </main>;
}
