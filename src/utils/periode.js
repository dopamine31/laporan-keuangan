const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

export const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// minggu = Senin-Minggu, bulan = tanggal 1 sampai akhir bulan
export function range(mode, anchorISO) {
  const d = parseISO(anchorISO);
  if (mode === 'minggu') {
    const dow = (d.getDay() + 6) % 7;
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
    const b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 6);
    return { from: iso(a), to: iso(b) };
  }
  const a = new Date(d.getFullYear(), d.getMonth(), 1);
  const b = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: iso(a), to: iso(b) };
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
