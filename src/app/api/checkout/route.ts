import {NextResponse} from 'next/server';
export const runtime='nodejs';
export async function POST(){
 return NextResponse.json({error:'Checkout is not available yet. No payment or key allocation has occurred.'},{status:503,headers:{'Cache-Control':'no-store'}});
}
