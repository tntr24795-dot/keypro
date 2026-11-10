// Payment fulfillment is disabled until signed provider verification and order reconciliation are implemented.
export const runtime = 'nodejs';
export async function POST() {
 return Response.json({error:'Payment webhook not enabled'},{status:503,headers:{'Cache-Control':'no-store'}});
}
