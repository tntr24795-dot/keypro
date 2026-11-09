'use client';
import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
type Order={id:string;status:string;quantity:number;amount:number;currency:string;created_at:string};
type License={orderId:string;key:string};
export default function AccountPage(){
 const [client,setClient]=useState<SupabaseClient|null>(null);
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [message,setMessage]=useState('');const [session,setSession]=useState(false);
 const [orders,setOrders]=useState<Order[]>([]);const [licenses,setLicenses]=useState<License[]>([]);
 useEffect(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){setMessage('Customer login is not configured yet');return;}
  const c=createClient(url,key);setClient(c);void c.auth.getSession().then(({data})=>setSession(!!data.session));
  const {data:{subscription}}=c.auth.onAuthStateChange((_event,s)=>setSession(!!s));
  return ()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{if(!client||!session){setOrders([]);setLicenses([]);return;}
  let cancelled=false;
  const load=async()=>{const {data:{session:s}}=await client.auth.getSession();if(!s)return;
   const r=await fetch('/api/customer/licenses',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});
   const data=await r.json();if(cancelled)return;
   if(!r.ok){setMessage(data.error||'Unable to load account');return;}
   setOrders(data.orders||[]);setLicenses(data.licenses||[]);
  };void load();return()=>{cancelled=true};
 },[client,session]);
 async function submit(mode:'signIn'|'signUp'){if(!client)return;
  setMessage('');const result=mode==='signIn'?await client.auth.signInWithPassword({email,password}):await client.auth.signUp({email,password});
  if(result.error)setMessage(result.error.message);else if(mode==='signUp')setMessage('Check your email to confirm your account.');
 }
 return <main style={{maxWidth:800,margin:'40px auto',padding:24,fontFamily:'system-ui'}}>
  <h1>KEY PRO — Customer Dashboard</h1>
  {!session?<section><h2>Sign in or create an account</h2>
   <label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block',marginBottom:12}}/></label>
   <label>Password<input type="password" autoComplete={session?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',marginBottom:12}}/></label>
   <button disabled={!client||!email||!password} onClick={()=>void submit('signIn')}>Sign in</button>{' '}
   <button disabled={!client||!email||!password} onClick={()=>void submit('signUp')}>Create account</button>
  </section>:<section><button onClick={()=>void client?.auth.signOut()}>Sign out</button>
   <h2>My orders</h2>{orders.length===0?<p>No orders yet.</p>:orders.map(o=><article key={o.id} style={{borderBottom:'1px solid #ccc',padding:12}}>
    <p>Order {o.id.slice(0,8)} · {o.status} · {o.quantity} item(s)</p>
    {o.status==='fulfilled'?licenses.filter(l=>l.orderId===o.id).map((l,i)=><p key={i}>License key: <code>{l.key}</code></p>):<p>License delivery pending. Keys will appear here after confirmed fulfillment.</p>}
   </article>)}
  </section>}
  {message&&<p role="status">{message}</p>}
 </main>;
}
