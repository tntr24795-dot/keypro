// Legacy email-link login is disabled. Admin authentication uses the password login form.
export async function GET(){
 return Response.json({error:'This login method is disabled'},{status:410,headers:{'Cache-Control':'no-store'}});
}
