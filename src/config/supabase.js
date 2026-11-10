import { createClient } from '@supabase/supabase-js';

// Kunci "publishable" memang aman ada di kode front-end.
// Keamanan data dijaga oleh login + aturan RLS di Supabase.
// JANGAN pernah menaruh kunci sb_secret_ atau service_role di sini.
const SUPABASE_URL = 'https://ftmdzegqxgnnsitrxytq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_z62EJiuBRdtD0vo3nEzjOQ_efvKXGZw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
