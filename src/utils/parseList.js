// Membaca daftar belanja hasil tempel: satu bahan per baris -> {nama, qty, sat}
const NUM = /^\d+(?:[.,]\d+)?$/;
const GLUED = /^(\d+(?:[.,]\d+)?)([A-Za-z.]+)$/; // contoh: 100kg
const THOUSANDS = /^\d{1,3}(?:\.\d{3})+$/;       // contoh: 1.600

const qtyClean = (q) => (THOUSANDS.test(q) ? q.replace(/\./g, '') : q);
const isHeader = (l) => /\bqty\b/i.test(l) && /\b(sat|satuan)\b/i.test(l);

const clean = (raw) =>
  raw.replace(/[\u00a0\t|;]+/g, ' ').replace(/^[\s\-•*·]+/, '').replace(/\s+/g, ' ').trim();

function parseTokens(line) {
  const t = line.split(' ').filter(Boolean);
  if (t.length < 2) return null;
  let qty = '';
  let sat = '';
  const last = t[t.length - 1];
  const glued = last.match(GLUED);
  if (glued) { qty = glued[1]; sat = glued[2]; t.pop(); }
  else if (NUM.test(last)) { qty = last; t.pop(); }
  else if (t.length >= 3 && NUM.test(t[t.length - 2])) {
    sat = last; qty = t[t.length - 2]; t.pop(); t.pop();
  } else return null;
  const nama = t.join(' ').replace(/[:\-–]+$/, '').trim();
  if (!/[A-Za-z]/.test(nama)) return null;
  return { nama, qty: qtyClean(qty), sat };
}

export function parseList(text) {
  const items = [];
  const bad = [];
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = clean(raw);
    if (!line || isHeader(line)) continue;
    const stripped = line.replace(/^\d+[.)]?\s+/, ''); // buang nomor urut
    const it = (stripped !== line && parseTokens(stripped)) || parseTokens(line);
    if (it) items.push(it); else bad.push(line);
  }
  return { items, bad };
}
