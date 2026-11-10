import { supabase } from '../config/supabase.js';

const key = (tanggal) => `laporan:${tanggal}`;
const pkey = (tanggal) => `pending:${tanggal}`; // ada = belum terkirim ke server

const writeLocal = (tanggal, data) => localStorage.setItem(key(tanggal), JSON.stringify(data));

// simpan di HP + tandai belum terkirim
export const saveLocal = (tanggal, data) => {
  writeLocal(tanggal, data);
  localStorage.setItem(pkey(tanggal), '1');
};

const readLocal = (tanggal) => {
  try { return JSON.parse(localStorage.getItem(key(tanggal))); } catch { return null; }
};

async function push(tanggal, data) {
  const snap = JSON.stringify(data);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('belum login');
  const { error } = await supabase.from('laporan').upsert(
    { user_id: session.user.id, tanggal, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,tanggal' },
  );
  if (error) throw error;
  // hapus tanda hanya kalau belum ada ketikan yang lebih baru
  if (localStorage.getItem(key(tanggal)) === snap) localStorage.removeItem(pkey(tanggal));
}

export async function saveReport(tanggal, data) {
  saveLocal(tanggal, data);
  await push(tanggal, data);
}

export async function loadReport(tanggal) {
  const local = readLocal(tanggal);
  // ada edit di HP yang belum terkirim: kirim dulu, jangan ditimpa data server
  if (local && localStorage.getItem(pkey(tanggal))) {
    try { await push(tanggal, local); } catch { /* offline, tetap pakai data HP */ }
    return local;
  }
  try {
    const { data, error } = await supabase
      .from('laporan').select('data').eq('tanggal', tanggal).maybeSingle();
    if (error) throw error;
    if (data) { writeLocal(tanggal, data.data); return data.data; }
  } catch { /* offline: pakai cadangan di HP */ }
  return local;
}
