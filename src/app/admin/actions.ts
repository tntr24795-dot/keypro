'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
import { encryptKey, hashKey, isValidKeyFormat, normalizeKey } from '@/lib/crypto';
import { requireAdmin } from '@/lib/requireAdmin';

export async function addKeys(form: FormData) {
  await requireAdmin();
  const productId = String(form.get('product_id') || '');
  const { data: product, error: productError } = await db().from('products').select('id,slug,active').eq('id',productId).maybeSingle();
  if (productError || !product || product.slug !== 'windows-11-pro' || !product.active) {
    throw new Error('Key import is allowed only for active Windows 11 Pro');
  }
  const raw = String(form.get('keys') || '');
  if (raw.length > 100000) throw new Error('Import is too large');
  const lines = raw.split(/[\r\n,;]+/).map(normalizeKey).filter(Boolean);
  if (lines.length > 1000) throw new Error('Maximum 1000 keys per import');
  const valid = Array.from(new Set(lines.filter(isValidKeyFormat)));
  const invalid = lines.filter(k => !isValidKeyFormat(k)).length;
  let added = 0;
  if (valid.length) {
    const rows = valid.map(k => ({product_id:product.id,key_encrypted:encryptKey(k),key_hash:hashKey(k)}));
    const { data, error } = await db().from('license_keys').upsert(rows,{onConflict:'key_hash',ignoreDuplicates:true}).select('id');
    if (error) throw new Error('Unable to save inventory');
    added = data?.length ?? 0;
  }
  revalidatePath('/admin');
  redirect('/admin?added='+added+'&dup='+(valid.length-added)+'&bad='+invalid);
}
