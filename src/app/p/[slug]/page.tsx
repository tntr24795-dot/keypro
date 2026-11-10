import {notFound} from 'next/navigation';
import Link from 'next/link';
import {db} from '@/lib/supabase';
export const dynamic='force-dynamic';
export default async function ProductPage({params}:{params:{slug:string}}){
 const {data:product,error}=await db().from('products').select('id,slug,name_en,name_th,price,currency,active').eq('slug',params.slug).maybeSingle();
 if(error)throw new Error('Unable to load product');
 if(!product)notFound();
 const {count,error:stockError}=await db().from('license_keys').select('id',{count:'exact',head:true}).eq('product_id',product.id).eq('status','available');
 if(stockError)throw new Error('Unable to load stock');
 const available=count??0;
 const purchasable=product.active&&product.slug==='windows-11-pro'&&available>0;
 return <main style={{maxWidth:760,margin:'48px auto',padding:24,fontFamily:'system-ui'}}>
 <Link href='/'>← All products</Link><h1>{product.name_en}</h1>
 <p>{product.price==null?'Price coming soon':new Intl.NumberFormat('en-US',{style:'currency',currency:product.currency.toUpperCase()}).format(product.price)}</p>
 <p>{purchasable?'Available: '+available:'Out of Stock'}</p>
 <p>Checkout is not yet available.</p><Link href='/account'>Customer account</Link>
 </main>;
}
