import {login} from './actions';
export const metadata={title:'KEY PRO | Admin Login',robots:{index:false,follow:false}};
export default function AdminLogin({searchParams}:{searchParams:{error?:string}}){
 return <main style={{maxWidth:400,margin:'10vh auto',padding:28,fontFamily:'system-ui'}}>
 <h1>KEY PRO Admin</h1><p>Authorized administrators only.</p>
 <form action={login}>
 <label>Email<input type="email" name="email" required autoComplete="username" style={{display:'block',width:'100%',padding:12,margin:'8px 0 18px'}}/></label>
 <label>Password<input type="password" name="password" required autoComplete="current-password" style={{display:'block',width:'100%',padding:12,margin:'8px 0 18px'}}/></label>
 <button type="submit">Sign in</button>
 </form>{searchParams.error&&<p role="alert">Invalid credentials.</p>}
 </main>;
}
