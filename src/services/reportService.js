import { supabase } from '../config/supabase.js';

const key = (tanggal) => `laporan:${tanggal}`;

export const saveLocal = (tanggal, data) =>
  localStorage.setItem(key(tanggal), JSON.stringify(data));

const readLocal = (tanggal) => {
  try { return JSON.parse(localStorage.getItem(key(tanggal))); } catch { return null; }
};

export async function loadReport(tanggal) {
  try {
    const { data, error } = await supabase
      .from('laporan').select('data').eq('tanggal', tanggal).maybeSingle();
    if (error) throw error;
    if (data) { saveLocal(tanggal, data.data); return data.data; }
  } catch { /* offline: pakai cadangan di HP */ }
  return readLocal(tanggal);
}

export async function saveReport(tanggal, data) {
  saveLocal(tanggal, data); // selalu aman di HP dulu
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.from('laporan').upsert(
    { user_id: session.user.id, tanggal, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,tanggal' },
  );
  if (error) throw error;
}