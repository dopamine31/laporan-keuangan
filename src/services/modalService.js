import { supabase } from '../config/supabase.js';
import { loadRange } from './rekapService.js';
import { hitungBuku } from '../utils/buku.js';
import { range, shift } from '../utils/periode.js';
import { num } from '../utils/calc.js';

const k = (mulai) => `modal:${mulai}`;
const pk = (mulai) => `modalp:${mulai}`; // ada = belum terkirim ke server

// "1.000.000" -> 1000000, "12,5" -> 12.5
export const parseRp = (s) => {
  const t = String(s ?? '').trim().replace(/\s/g, '');
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) return num(t.replace(/\./g, ''));
  return num(t);
};

async function push(mulai, nilai) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('belum login');
  const { error } = await supabase.from('modal_minggu').upsert(
    { user_id: session.user.id, mulai, modal: nilai, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,mulai' },
  );
  if (error) throw error;
  localStorage.removeItem(pk(mulai));
}

export async function setModal(mulai, nilai) {
  localStorage.setItem(k(mulai), String(nilai));
  localStorage.setItem(pk(mulai), '1');
  await push(mulai, nilai);
}

// null = belum diisi
export async function getModal(mulai) {
  const local = localStorage.getItem(k(mulai));
  if (local !== null && localStorage.getItem(pk(mulai))) {
    try { await push(mulai, Number(local)); } catch { /* offline */ }
    return Number(local);
  }
  try {
    const { data, error } = await supabase
      .from('modal_minggu').select('modal').eq('mulai', mulai).maybeSingle();
    if (error) throw error;
    if (data) { localStorage.setItem(k(mulai), String(data.modal)); return Number(data.modal); }
    return null;
  } catch {
    return local === null ? null : Number(local);
  }
}

// modal akhir minggu lalu (kalau modal awal minggu lalu sudah diisi)
export async function saranModal(from) {
  try {
    const prev = range('minggu', shift('minggu', from, -1));
    const modal = await getModal(prev.from);
    if (modal === null) return null;
    const rows = await loadRange(prev.from, prev.to);
    return Math.round(hitungBuku(rows, prev.from, prev.to, modal).akhir);
  } catch {
    return null;
  }
}
