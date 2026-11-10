import { supabase } from '../config/supabase.js';
import { num } from '../utils/calc.js';

const LS = 'harga_bahan';
// cache: { "nama bahan": { harga, jual, t, d } }  d = belum terkirim ke server
const read = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } };
let cache = read();
const write = () => localStorage.setItem(LS, JSON.stringify(cache));

export const kunci = (n) => String(n ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
export const getHarga = (nama) => cache[kunci(nama)] || null;

// catat harga terakhir dari daftar bahan (hanya yang terisi)
export function remember(items) {
  let changed = false;
  for (const b of items) {
    const k = kunci(b.nama);
    if (!k) continue;
    const h = num(b.harga), j = num(b.jual);
    if (h <= 0 && j <= 0) continue;
    const cur = cache[k] || { harga: 0, jual: 0 };
    const next = { harga: h > 0 ? h : cur.harga, jual: j > 0 ? j : cur.jual };
    if (next.harga === cur.harga && next.jual === cur.jual) continue;
    cache[k] = { ...next, t: new Date().toISOString(), d: 1 };
    changed = true;
  }
  if (changed) write();
  return changed;
}

export async function pushHarga() {
  const dirty = Object.entries(cache).filter(([, v]) => v.d);
  if (!dirty.length) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const rows = dirty.map(([nama, v]) => ({
    user_id: session.user.id, nama, harga: v.harga, jual: v.jual, updated_at: v.t,
  }));
  const { error } = await supabase.from('harga_bahan').upsert(rows, { onConflict: 'user_id,nama' });
  if (error) throw error;
  for (const [nama, v] of dirty) if (cache[nama] && cache[nama].t === v.t) delete cache[nama].d;
  write();
}

// kirim yang belum terkirim, lalu ambil harga dari server
export async function syncHarga() {
  try { await pushHarga(); } catch { /* offline */ }
  const { data, error } = await supabase.from('harga_bahan').select('nama,harga,jual,updated_at');
  if (error) throw error;
  for (const r of data) {
    if (cache[r.nama]?.d) continue;
    cache[r.nama] = { harga: Number(r.harga) || 0, jual: Number(r.jual) || 0, t: r.updated_at };
  }
  write();
}
