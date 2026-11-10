import { supabase } from '../config/supabase.js';

// ambil semua laporan dalam rentang tanggal (from/to format YYYY-MM-DD)
export async function loadRange(from, to) {
  const { data, error } = await supabase
    .from('laporan').select('tanggal,data')
    .gte('tanggal', from).lte('tanggal', to)
    .order('tanggal', { ascending: true });
  if (error) throw error;
  return data || [];
}
