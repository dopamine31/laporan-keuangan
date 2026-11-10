const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

export const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Minggu buku mulai hari apa: 0 = Minggu (tanggal laporan = tanggal belanja), 1 = Senin
export const MINGGU_MULAI = 0;

// minggu = MINGGU_MULAI + 6 hari, bulan = tanggal 1 sampai akhir bulan
export function range(mode, anchorISO) {
  const d = parseISO(anchorISO);
  if (mode === 'minggu') {
    const dow = (d.getDay() - MINGGU_MULAI + 7) % 7;
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
    const b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 6);
    return { from: iso(a), to: iso(b) };
  }
  const a = new Date(d.getFullYear(), d.getMonth(), 1);
  const b = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: iso(a), to: iso(b) };
}

// tanggal Jumat (hari tutup buku) di minggu yang mulai pada fromISO
export function jumat(fromISO) {
  const d = parseISO(fromISO);
  d.setDate(d.getDate() + ((5 - MINGGU_MULAI + 7) % 7));
  return iso(d);
}

export function shift(mode, anchorISO, dir) {
  const d = parseISO(anchorISO);
  if (mode === 'minggu') d.setDate(d.getDate() + 7 * dir);
  else { d.setDate(1); d.setMonth(d.getMonth() + dir); }
  return iso(d);
}

export function label(mode, from, to) {
  const a = parseISO(from), b = parseISO(to);
  if (mode === 'bulan') return `${BULAN[a.getMonth()]} ${a.getFullYear()}`;
  const m = (x) => BULAN[x.getMonth()].slice(0, 3);
  return `${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)} ${b.getFullYear()}`;
}
