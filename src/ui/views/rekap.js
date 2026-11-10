import { hitungBuku } from '../../utils/buku.js';
import { rupiah, esc } from '../../utils/format.js';
import { range, label, parseISO, jumat, HARI } from '../../utils/periode.js';

const pendek = (iso) => { const d = parseISO(iso); return `${HARI[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`; };

// kerangka: pilihan minggu/bulan + panah. Isinya diisi app.js setelah data datang.
export const rekapView = (mode, anchor) => {
  const { from, to } = range(mode, anchor);
  const m = (id, text) => `
    <button data-action="rekap-mode" data-mode="${id}"
      class="rounded-lg py-2 text-sm ${mode === id ? 'bg-white font-bold text-green-700 shadow' : 'text-gray-500'}">${text}</button>`;
  return `
    <div class="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">${m('minggu', 'Mingguan')}${m('bulan', 'Bulanan')}</div>
    <div class="mb-3 flex items-center justify-between">
      <button data-action="rekap-prev" aria-label="Sebelumnya" class="px-4 py-2 text-xl">◀</button>
      <b class="text-center">${label(mode, from, to)}</b>
      <button data-action="rekap-next" aria-label="Berikutnya" class="px-4 py-2 text-xl">▶</button>
    </div>
    <div id="rekap-body"><p class="py-10 text-center text-gray-400">⏳ Memuat…</p></div>`;
};

const row = (left, right, cls = '') =>
  `<div class="flex justify-between py-0.5"><span>${left}</span><b class="${cls}">${right}</b></div>`;

// kotak buku: modal awal -> cair -> belanja -> modal akhir
function bukuBox(b, { from, modalAwal, saran }) {
  const ada = modalAwal !== null;
  const merah = (v) => (v < 0 ? 'text-red-600' : 'text-gray-900');
  return `
  <div class="mt-2 rounded-2xl border border-blue-200 bg-blue-50 p-3">
    <div class="flex items-center justify-between text-xs font-bold text-blue-800">
      <span>📒 BUKU MINGGU INI</span><span>Tutup buku ${pendek(jumat(from))}</span>
    </div>
    <label class="mt-2 block text-xs text-gray-600" for="modal-awal">Modal awal (Rp)</label>
    <div class="mt-1 flex gap-2">
      <input id="modal-awal" type="text" inputmode="decimal" value="${ada ? modalAwal : ''}" placeholder="0"
        class="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none focus:border-green-500">
      <button data-action="simpan-modal" class="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white active:opacity-80">Simpan</button>
    </div>
    ${!ada && saran !== null
      ? `<button data-action="pakai-modal" data-v="${saran}" class="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-white py-1 text-xs text-gray-500">✓ pakai ${rupiah(saran)} (modal akhir minggu lalu)</button>`
      : ''}
    ${ada ? '' : '<p class="mt-1 text-[11px] text-amber-700">Modal awal belum diisi, dihitung Rp 0.</p>'}
    <div class="mt-3 border-t border-blue-200 pt-2 text-sm">
      ${row('Modal awal', rupiah(b.awal))}
      ${row('+ Uang cair', rupiah(b.cairOmset), 'text-green-700')}
      ${row('− Belanja bahan + operasional', rupiah(b.keluar), 'text-red-700')}
      <div class="mt-1 flex items-center justify-between rounded-lg bg-white px-2 py-2">
        <span class="font-bold">MODAL AKHIR</span>
        <b class="text-lg ${merah(b.akhir)}">${rupiah(b.akhir)}</b>
      </div>
      ${b.akhir < 0 ? '<p class="mt-1 text-[11px] text-red-600">Minus: belanja lebih besar dari uang yang sudah cair (termasuk yang dihutang).</p>' : ''}
      <div class="mt-2 text-xs text-gray-600">
        ${row('Jika semua sudah cair', rupiah(b.perkiraan), merah(b.perkiraan))}
        ${row('Saldo terendah minggu ini', rupiah(b.terendah), merah(b.terendah))}
        ${b.hutang > 0 ? row('Hutang tercatat di laporan', rupiah(b.hutang), 'text-amber-800') : ''}
      </div>
    </div>
  </div>`;
}

function ledgerBox(b) {
  if (!b.ledger.length) return '';
  const cols = 'grid grid-cols-[1.1fr_1fr_1fr_1.1fr] gap-1 px-2 py-1';
  return `
    <h3 class="mb-2 mt-4 text-sm font-bold text-gray-700">Arus kas harian</h3>
    <div class="overflow-hidden rounded-xl border border-gray-200 text-[11px]">
      <div class="${cols} bg-gray-100 font-bold text-gray-600">
        <span>Tgl</span><span class="text-right">Belanja</span><span class="text-right">Cair</span><span class="text-right">Saldo</span>
      </div>
      ${b.ledger.map((e) => `
        <div class="${cols} border-t border-gray-100">
          <span>${pendek(e.tanggal)}</span>
          <span class="text-right text-red-700">${e.keluar ? rupiah(e.keluar) : '-'}</span>
          <span class="text-right text-green-700">${e.masuk ? rupiah(e.masuk) : '-'}</span>
          <b class="text-right ${e.saldo < 0 ? 'text-red-600' : ''}">${rupiah(e.saldo)}</b>
        </div>`).join('')}
    </div>`;
}

// ctx: { mode, from, to, modalAwal (angka atau null), saran (angka atau null) }
export function rekapBody(rows, ctx) {
  const { mode, from, to, modalAwal = null } = ctx;
  const b = hitungBuku(rows, from, to, modalAwal);
  const { days } = b;
  const buku = mode === 'minggu' ? bukuBox(b, ctx) : '';

  if (!days.length) return `${buku}<p class="py-10 text-center text-gray-400">Belum ada laporan di periode ini.</p>`;

  const profit = b.omset - b.bahan - b.ops;
  const belum = days.filter((d) => d.t.belumBeli > 0).length;

  const list = [...days].reverse().map((d) => {
    const dt = parseISO(d.tanggal);
    const hari = `${HARI[dt.getDay()]}, ${dt.getDate()}/${dt.getMonth() + 1}`;
    const st = d.t.omset <= 0 ? '' : d.cair ? '✅ ' : '⏳ ';
    return `
      <button data-action="open-day" data-tanggal="${d.tanggal}"
        class="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-2 text-left active:bg-gray-50">
        <span class="min-w-0">
          <b class="block text-sm">${st}${hari}${d.t.belumBeli > 0 ? ' ⚠️' : ''}</b>
          <span class="block truncate text-xs text-gray-500">${esc(d.menu) || '-'}</span>
        </span>
        <span class="shrink-0 text-right">
          <b class="block text-sm ${d.t.profit < 0 ? 'text-red-600' : 'text-green-700'}">${rupiah(d.t.profit)}</b>
          <span class="block text-xs text-gray-500">Omset ${rupiah(d.t.omset)}</span>
        </span>
      </button>`;
  }).join('');

  return `
    <div class="rounded-2xl ${profit < 0 ? 'bg-red-200' : 'bg-yellow-300'} p-4 text-center">
      <div class="text-xs font-bold">💰 PROFIT</div>
      <div class="text-3xl font-extrabold ${profit < 0 ? 'text-red-700' : ''}">${rupiah(profit)}</div>
      <div class="text-xs">${days.length} hari ada laporan</div>
    </div>
    ${buku}
    <div class="mt-2 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-xl bg-green-100 p-2"><div class="text-[11px] text-gray-500">Omset</div><b class="text-sm text-green-700">${rupiah(b.omset)}</b></div>
      <div class="rounded-xl bg-gray-100 p-2"><div class="text-[11px] text-gray-500">Modal bahan</div><b class="text-sm">${rupiah(b.bahan)}</b></div>
      <div class="rounded-xl bg-red-50 p-2"><div class="text-[11px] text-gray-500">Operasional</div><b class="text-sm text-red-700">${rupiah(b.ops)}</b></div>
    </div>
    <p class="mt-2 text-center text-[11px] text-gray-500">Profit = Omset − Modal bahan − Operasional</p>
    <div class="mt-2 grid grid-cols-2 gap-2 text-center">
      <div class="rounded-xl bg-green-100 p-2">
        <div class="text-[11px] text-gray-600">✅ Sudah cair</div>
        <b class="text-sm text-green-800">${rupiah(b.cairOmset)}</b>
        <div class="text-[11px] text-gray-500">${b.cairHari} hari</div>
      </div>
      <div class="rounded-xl ${b.belumHari ? 'bg-amber-100' : 'bg-gray-100'} p-2">
        <div class="text-[11px] text-gray-600">⏳ Belum cair</div>
        <b class="text-sm ${b.belumHari ? 'text-amber-800' : ''}">${rupiah(b.belumOmset)}</b>
        <div class="text-[11px] text-gray-500">${b.belumHari} hari</div>
      </div>
    </div>
    ${belum ? `<p class="mt-2 rounded-lg bg-amber-100 p-2 text-xs text-amber-800">⚠️ Modal belum lengkap di ${belum} hari (ada bahan yang harga belinya kosong). Profit bisa tampak lebih besar dari kenyataan.</p>` : ''}
    ${mode === 'minggu' ? ledgerBox(b) : ''}
    <h3 class="mb-2 mt-4 text-sm font-bold text-gray-700">Per hari (ketuk untuk membuka)</h3>
    <div class="space-y-2">${list}</div>`;
}
