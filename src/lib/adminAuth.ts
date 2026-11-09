import 'server-only';
import crypto from 'node:crypto';
export const SESSION_COOKIE='admin_session';
type Payload={e:string;exp:number;kind:string};
function secret(){const s=process.env.ADMIN_SESSION_SECRET||process.env.KEY_ENCRYPTION_SECRET;if(!s||s.length<32)throw new Error('Admin session secret not configured');return s;}
function mac(body:string){return crypto.createHmac('sha256',secret()).update(body).digest('base64url');}
export function issueToken(email:string){const body=Buffer.from(JSON.stringify({e:email,exp:Date.now()+8*60*60*1000,kind:'s'} satisfies Payload)).toString('base64url');return body+'.'+mac(body);}
export async function verifyToken(token:string|undefined,kind:string):Promise<{e:string}|null>{
 if(!token)return null;
 const parts=token.split('.');if(parts.length!==2)return null;
 const expected=mac(parts[0]);const a=Buffer.from(parts[1]);const b=Buffer.from(expected);
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
 try{const p=JSON.parse(Buffer.from(parts[0],'base64url').toString()) as Payload;
 if(p.kind!==kind||!Number.isFinite(p.exp)||p.exp<Date.now())return null;
 const allowed=(process.env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!allowed.includes(String(p.e).toLowerCase()))return null;
 return {e:p.e};}catch{return null;}
}
export function validAdminCredentials(email:string,password:string){
 const allowed=(process.env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 const stored=process.env.ADMIN_PASSWORD;
 if(!stored||!allowed.includes(email.trim().toLowerCase()))return false;
 const a=crypto.createHash('sha256').update(password).digest();
 const b=crypto.createHash('sha256').update(stored).digest();
 return crypto.timingSafeEqual(a,b);
}
