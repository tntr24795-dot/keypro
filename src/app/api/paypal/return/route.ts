import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 return NextResponse.json({error:'Checkout is disabled while KEY PRO payment verification is under development.'},{status:503,headers:{'Cache-Control':'no-store'}});
}
