import 'server-only';
import { createClient } from '@supabase/supabase-js';

const PRODUCTION_PROJECT_REF = 'qonprqiftlmxofygrcbv';

export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Database is not configured');

  // Preview must never access the production KEY PRO database.
  if (process.env.VERCEL_ENV === 'preview') {
    const projectRef = new URL(url).hostname.split('.')[0];
    if (projectRef === PRODUCTION_PROJECT_REF || !process.env.KEYPRO_PREVIEW_DB_APPROVED) {
      throw new Error('Preview database isolation is not configured');
    }
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
