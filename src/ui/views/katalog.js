import { loadRange } from '../../services/rekapService.js';
import { rupiah, esc } from '../../utils/format.js';

const num = (n) => Number(n) || 0;
const norm = (s) => String(s || '').toLowerCase().replace(/[()[\]{}"]/g, ' ').replace(/\s+/g, ' ').trim();
const rapi = (s) => String(s || '').replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ribu = (n) => String(Math.round(num(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Kata pertama yang mengandung huruf = nama grup
const groupKey = (nama) => {
  const words = norm(nama).split(' ').map((w) => w.replace(/[^a-z0-9\u00c0-\uffff]/g, '')).filter(Boolean);
  return words.find((w) => /[a-z\u00c0-\uffff]/.test(w)) || '';
};

const tgl = (iso) => {
  const [y, m, d] = String(iso).split('-');
  return `${+d}/${+m}/${String(y).slice(2)}`;
};
const ms = (iso) => new Date(iso + 'T00:00:00').getTime();
const pts = (v, f) => [...v[f].entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

const COL = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4b5563'];

const S = { err: '', groups: [], field: 'beli', open: null, sel: '', q: '', pick: null, groupVars: [] };
let PICKS = [];

function build(rows) {
  const sorted = [...rows].sort((a, b) => (String(a.tanggal) < String(b.tanggal) ? -1 : 1));
  const groups = new Map();
  for (const r of sorted) {
    const t = String(r.tanggal).slice(0, 10);
    for (const b of (r.data && r.data.bahan) || []) {
      const key = groupKey(b.nama);
      if (!key) continue;
      let g = groups.get(key);
      if (!g) { g = { key, map: new Map() }; groups.set(key, g); }
      const k = norm(b.nama);
      let v = g.map.get(k);
      if (!v) { v = { k, nama: String(b.nama).trim(), sat: '', beli: new Map(), jual: new Map() }; g.map.set(k, v); }
      v.nama = rapi(b.nama);
      if (b.sat) v.sat = b.sat;
      if (num(b.harga) > 0) v.beli.set(t, num(b.harga));
      if (num(b.jual) > 0) v.jual.set(t, num(b.jual));
    }
  }
  return [...groups.values()]
    .map((g) => ({ key: g.key, vars: [...g.map.values()] }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function ringkas(g, f) {
  let best = null;
  for (const v of g.vars) {
    const p = pts(v, f);
    if (!p.length) continue;
    const [t, h] = p[p.length - 1];
    if (!best || t > best.t) best = { t, h, prev: p.length > 1 ? p[p.length - 2][1] : null, sat: v.sat };
  }
  return best;
}

// naik = merah untuk harga beli (biaya naik), hijau untuk harga jual
function badge(delta, f) {
  if (delta === null) return '<span class="text-gray-400">baru</span>';
  if (delta === 0) return '<span class="text-gray-500">● tetap</span>';
  const naik = delta > 0;
  const bad = f === 'beli' ? naik : !naik;
  const cls = bad ? 'text-red-600' : 'text-green-600';
  return `<span class="${cls} font-semibold">${naik ? '▲ +' : '▼ −'}${rupiah(Math.abs(delta))}</span>`;
}

function listItems() {
  const q = norm(S.q);
  const items = S.groups
    .map((g) => ({ g, r: ringkas(g, S.field) }))
    .filter((x) => x.r && (!q || x.g.key.includes(q) || x.g.vars.some((v) => v.k.includes(q))));
  if (!items.length) {
    return '<p class="text-center text-gray-500 text-sm py-8">Belum ada data harga.</p>';
  }
  return items.map(({ g, r }) => `
    <button data-kat="open" data-key="${esc(g.key)}"
      class="w-full flex items-center justify-between gap-2 bg-white border rounded-lg px-3 py-2.5 mb-2 text-left active:bg-gray-50">
      <div class="min-w-0">
        <div class="font-bold truncate">${esc(cap(g.key))}</div>
        <div class="text-xs text-gray-500">${g.vars.length} jenis · terakhir ${tgl(r.t)}</div>
      </div>
      <div class="text-right shrink-0">
        <div class="font-bold">${rupiah(r.h)}${r.sat ? `<span class="text-xs font-normal text-gray-500">/${esc(r.sat)}</span>` : ''}</div>
        <div class="text-xs">${badge(r.prev === null ? null : r.h - r.prev, S.field)}</div>
      </div>
    </button>`).join('');
}

function fieldSwitch() {
  const b = (f, label) => `<button data-kat="field" data-f="${f}"
    class="flex-1 py-2 text-sm font-semibold rounded-md ${S.field === f ? 'bg-white shadow text-blue-700' : 'text-gray-600'}">${label}</button>`;
  return `<div class="flex gap-1 bg-gray-200 rounded-lg p-1 mb-3">${b('beli', 'Harga Beli')}${b('jual', 'Harga Jual')}</div>`;
}

function mainHTML() {
  if (S.err) return `<div class="p-4 text-center text-red-600 text-sm">${esc(S.err)}</div>`;
  return `
    <div class="p-3">
      <h2 class="font-bold text-lg mb-2">📚 Katalog Harga</h2>
      ${fieldSwitch()}
      <input id="kat-q" type="search" placeholder="Cari bahan… (beras, minyak)" value="${esc(S.q)}"
        class="w-full border rounded-lg px-3 py-2 mb-3 text-sm bg-white">
      <div id="kat-list">${listItems()}</div>
    </div>`;
}

// Grafik garis bertangga: datar = harga tetap, tegak = harga berubah.
function chart(vars, f) {
  PICKS = [];
  const series = vars.map((v) => ({ v, i: S.groupVars.indexOf(v), p: pts(v, f) })).filter((s) => s.p.length);
  const all = series.flatMap((s) => s.p);
  if (!all.length) return '';

  const W = 340, H = 196, L = 56, R = 16, T = 24, B = 30;
  const xs = all.map((a) => ms(a[0]));
  const ys = all.map((a) => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const rMin = Math.min(...ys), rMax = Math.max(...ys);
  let y0 = rMin, y1 = rMax;
  if (y0 === y1) { y0 = rMin * 0.9; y1 = rMax * 1.1; }
  else { const pad = (y1 - y0) * 0.15; y0 -= pad; y1 += pad; }
  const px = (x) => (x0 === x1 ? (L + W - R) / 2 : L + ((x - x0) / (x1 - x0)) * (W - L - R));
  const py = (y) => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);

  // titik perubahan harga per varian
  const cps = [];
  for (const s of series) {
    let prev = null;
    s.p.forEach(([t, h]) => {
      if (prev === null || h !== prev) {
        cps.push({ s, n: s.v.nama, t, h, d: prev === null ? null : h - prev, last: false });
      }
      prev = h;
    });
    const mine = cps.filter((c) => c.s === s);
    if (mine.length) mine[mine.length - 1].last = true;
  }
  const semua = cps.length <= 6;

  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block" font-family="Arial,sans-serif" font-size="10">`;

  // garis bantu
  const gl = rMin === rMax ? [rMax] : [rMax, (rMax + rMin) / 2, rMin];
  for (const y of gl) {
    svg += `<line x1="${L}" x2="${W - R}" y1="${py(y)}" y2="${py(y)}" stroke="#e5e7eb" stroke-dasharray="3 3"/>`;
    svg += `<text x="${L - 4}" y="${py(y) + 3}" text-anchor="end" fill="#6b7280">${ribu(y)}</text>`;
  }

  // sumbu tanggal
  const ts = [...new Set(all.map((a) => a[0]))].sort();
  const idx = ts.length <= 4 ? ts.map((_, i) => i)
    : [0, Math.round((ts.length - 1) / 3), Math.round(((ts.length - 1) * 2) / 3), ts.length - 1];
  const cand = [...new Set(idx)].map((i) => ts[i]);
  let kept = [];
  for (const t of cand) {
    const x = px(ms(t));
    if (!kept.length || x - kept[kept.length - 1].x >= 62) kept.push({ t, x });
  }
  const lastC = cand[cand.length - 1];
  if (kept[kept.length - 1].t !== lastC) {
    const item = { t: lastC, x: px(ms(lastC)) };
    if (kept.length > 1) kept[kept.length - 1] = item; else kept.push(item);
  }
  kept.forEach((k, i) => {
    const anchor = kept.length === 1 ? 'middle' : i === 0 ? 'start' : i === kept.length - 1 ? 'end' : 'middle';
    const x = anchor === 'start' ? Math.max(k.x, L) : anchor === 'end' ? Math.min(k.x, W - R) : k.x;
    svg += `<line x1="${k.x}" x2="${k.x}" y1="${H - B}" y2="${H - B + 3}" stroke="#9ca3af"/>`;
    svg += `<text x="${x}" y="${H - 8}" text-anchor="${anchor}" fill="#6b7280">${tgl(k.t)}</text>`;
  });

  // garis bertangga
  for (const s of series) {
    const c = COL[s.i % COL.length];
    let d = `M${px(ms(s.p[0][0]))} ${py(s.p[0][1])}`;
    for (let j = 1; j < s.p.length; j++) {
      d += ` H${px(ms(s.p[j][0]))} V${py(s.p[j][1])}`;
    }
    d += ` H${px(x1)}`;
    svg += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/>`;
  }

  // titik + angka
  const beda = rMin !== rMax;
  cps.forEach((c, k) => {
    c.k = k;
    PICKS.push(c);
    const col = COL[c.s.i % COL.length];
    const lo = beda && c.h === rMin;
    const hi = beda && c.h === rMax;
    const fill = lo ? '#16a34a' : hi ? '#dc2626' : col;
    const x = px(ms(c.t)), y = py(c.h);
    const sel = S.pick && S.pick.n === c.n && S.pick.t === c.t;
    if (sel) svg += `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="#111827" stroke-width="1.5"/>`;
    svg += `<circle cx="${x}" cy="${y}" r="4.5" fill="${fill}" stroke="#fff" stroke-width="1.5"/>`;
    const tampil = semua || lo || hi || (c.last && series.length === 1);
    if (tampil) {
      const anchor = x < L + 18 ? 'start' : x > W - R - 18 ? 'end' : 'middle';
      svg += `<text x="${x}" y="${y - 9}" text-anchor="${anchor}" font-weight="700" fill="${lo ? '#16a34a' : hi ? '#dc2626' : '#111827'}">${ribu(c.h)}</text>`;
    }
  });

  // area ketuk (dibuat terakhir supaya di atas)
  cps.forEach((c) => {
    svg += `<circle data-kat="pt" data-i="${c.k}" cx="${px(ms(c.t))}" cy="${py(c.h)}" r="14" fill="transparent" style="cursor:pointer"/>`;
  });
  svg += '</svg>';

  const legend = vars.length > 1
    ? `<div class="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">${series.map((s) =>
        `<span><span style="color:${COL[s.i % COL.length]}">●</span> ${esc(s.v.nama)}</span>`).join('')}</div>`
    : '';
  const cara = `<div class="mt-2 text-[11px] text-gray-500 leading-snug">
    Garis datar = harga tidak berubah · titik = hari harga berubah ·
    <span class="text-green-600 font-semibold">hijau</span> = terendah ·
    <span class="text-red-600 font-semibold">merah</span> = tertinggi</div>`;
  return svg + legend + cara;
}

function pickBox() {
  const p = S.pick;
  if (!p) return '<div class="text-xs text-gray-500 text-center pb-2">👆 Ketuk titik di grafik untuk lihat detailnya</div>';
  const isi = p.d === null
    ? '<span class="text-gray-500">harga pertama yang tercatat</span>'
    : `${badge(p.d, S.field)} <span class="text-gray-500">dari ${rupiah(p.h - p.d)}</span>`;
  return `<div class="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm mb-2">
    <div class="font-semibold">${esc(p.n)} · ${tgl(p.t)}</div>
    <div><b>${rupiah(p.h)}</b> · ${isi}</div></div>`;
}

function detailHTML() {
  const g = S.groups.find((x) => x.key === S.open);
  if (!g) { S.open = null; return mainHTML(); }
  S.groupVars = g.vars;
  const vars = S.sel ? g.vars.filter((v) => v.k === S.sel) : g.vars;
  const f = S.field;

  const chips = g.vars.length > 1
    ? `<div class="flex flex-wrap gap-2 mb-3">
        <button data-kat="var" data-v="" class="px-3 py-1 rounded-full text-sm border ${!S.sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}">Semua</button>
        ${g.vars.map((v) => `<button data-kat="var" data-v="${esc(v.k)}"
          class="px-3 py-1 rounded-full text-sm border ${S.sel === v.k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}">${esc(v.nama)}</button>`).join('')}
      </div>` : '';

  const rows = [];
  const allPts = [];
  let naik = 0, turun = 0;
  for (const v of vars) {
    let prev = null;
    for (const [t, h] of pts(v, f)) {
      allPts.push({ t, h, n: v.nama });
      if (prev === null) rows.push({ t, h, d: null, n: v.nama });
      else if (h !== prev) {
        rows.push({ t, h, d: h - prev, n: v.nama });
        if (h > prev) naik++; else turun++;
      }
      prev = h;
    }
  }
  rows.sort((a, b) => (a.t < b.t ? 1 : a.t > b.t ? -1 : 0));

  let stat = '';
  if (allPts.length) {
    const last = allPts.reduce((a, b) => (b.t >= a.t ? b : a));
    const lo = allPts.reduce((a, b) => (b.h < a.h ? b : a));
    const hi = allPts.reduce((a, b) => (b.h > a.h ? b : a));
    const tile = (label, p, cls) => `<div class="bg-white border rounded-lg p-2 text-center">
      <div class="text-[11px] text-gray-500">${label}</div>
      <div class="font-bold text-sm ${cls}">${rupiah(p.h)}</div>
      <div class="text-[11px] text-gray-400">${tgl(p.t)}</div></div>`;
    stat = `<div class="grid grid-cols-3 gap-2 mb-2">${tile('Terakhir', last, '')}${tile('Terendah', lo, 'text-green-600')}${tile('Tertinggi', hi, 'text-red-600')}</div>
      <div class="text-xs text-gray-600 text-center mb-3">Berubah ${naik + turun} kali · naik ${naik} · turun ${turun}</div>`;
  }

  const multi = vars.length > 1;
  const table = rows.length
    ? rows.map((r) => `<div class="flex items-center justify-between gap-2 border-b py-2 text-sm">
        <div class="min-w-0">
          <div class="font-semibold">${tgl(r.t)}</div>
          ${multi ? `<div class="text-xs text-gray-500 truncate">${esc(r.n)}</div>` : ''}
        </div>
        <div class="text-right shrink-0">
          <div class="font-bold">${rupiah(r.h)}</div>
          <div class="text-xs">${badge(r.d, f)}</div>
        </div>
      </div>`).join('')
    : '<p class="text-center text-gray-500 text-sm py-6">Belum ada data harga.</p>';

  return `
    <div class="p-3">
      <button data-kat="back" class="text-blue-600 text-sm font-semibold mb-2">← Kembali</button>
      <h2 class="font-bold text-lg mb-2">${esc(cap(g.key))}</h2>
      ${fieldSwitch()}
      ${chips}
      <div class="bg-white border rounded-lg p-2 mb-3">${pickBox()}${chart(vars, f)}</div>
      ${stat}
      <h3 class="font-bold text-sm mb-1">Riwayat perubahan harga</h3>
      <div class="bg-white border rounded-lg px-3">${table}</div>
    </div>`;
}

function render(el) {
  el.innerHTML = S.open ? detailHTML() : mainHTML();
}

export async function mountKatalog(el) {
  S.open = null; S.sel = ''; S.q = ''; S.pick = null;
  el.innerHTML = '<p class="text-center text-gray-500 text-sm py-10">Memuat riwayat harga…</p>';

  el.onclick = (e) => {
    const b = e.target.closest('[data-kat]');
    if (!b) return;
    const a = b.dataset.kat;
    if (a === 'open') { S.open = b.dataset.key; S.sel = ''; S.pick = null; }
    else if (a === 'back') { S.open = null; S.sel = ''; S.pick = null; }
    else if (a === 'field') { S.field = b.dataset.f; S.pick = null; }
    else if (a === 'var') { S.sel = b.dataset.v; S.pick = null; }
    else if (a === 'pt') { S.pick = PICKS[Number(b.dataset.i)] || null; }
    render(el);
  };
  el.oninput = (e) => {
    if (e.target.id !== 'kat-q') return;
    S.q = e.target.value;
    const list = el.querySelector('#kat-list');
    if (list) list.innerHTML = listItems();
  };

  try {
    const rows = await loadRange('2000-01-01', '2999-12-31');
    S.groups = build(Array.isArray(rows) ? rows : []);
    S.err = '';
  } catch (e) {
    S.err = 'Gagal memuat riwayat harga. Cek koneksi internet lalu coba lagi.';
  }
  render(el);
}
