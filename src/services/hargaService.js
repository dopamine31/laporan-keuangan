import { supabase } from '../config/supabase.js';
import { num } from '../utils/calc.js';
const LS = 'harga_bahan';
// cache: { "nama bahan": { harga, jual, t, d } }  d = belum terkirim ke server
// kunci: huruf kecil, tanda kurung diabaikan, spasi dirapikan
export const kunci = (n) => String(n ?? '')
  .toLowerCase()
  .replace(/[()[\]{}"]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const waktu = (t) => (t ? new Date(t).getTime() || 0 : 0);
// baca cache lama, gabungkan kunci yang sekarang dianggap sama (yang terbaru menang)
const read = () => {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(LS)) || {}; } catch { raw = {}; }
  const out = {};
  for (const [nama, v] of Object.entries(raw)) {
    const k = kunci(nama);
    if (!k) continue;
    if (!out[k] || waktu(v.t) >= waktu(out[k].t)) out[k] = v;
  }
  return out;
};
let cache = read();
const write = () => localStorage.setItem(LS, JSON.stringify(cache));
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
  // urut dari yang terlama, supaya baris terbaru menimpa baris lama yang namanya sama
  const urut = [...data].sort((a, b) => waktu(a.updated_at) - waktu(b.updated_at));
  for (const r of urut) {
    const k = kunci(r.nama);
    if (!k || cache[k]?.d) continue;
    cache[k] = { harga: Number(r.harga) || 0, jual: Number(r.jual) || 0, t: r.updated_at };
  }
  write();
}
