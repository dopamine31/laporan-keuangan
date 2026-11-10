import { totals } from '../../utils/calc.js';
import { normalizeState } from '../../state/store.js';
import { rupiah, esc } from '../../utils/format.js';
import { range, label, parseISO, HARI } from '../../utils/periode.js';

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

export function rekapBody(rows) {
  const days = rows
    .map((r) => {
      const n = normalizeState(r.data);
      return { tanggal: r.tanggal, menu: n.menu, t: totals(n), kosong: !n.bahan.length && !n.ops.length };
    })
    .filter((d) => !d.kosong);

  if (!days.length) return '<p class="py-10 text-center text-gray-400">Belum ada laporan di periode ini.</p>';

  const sum = (k) => days.reduce((a, d) => a + d.t[k], 0);
  const omset = sum('omset'), bahan = sum('bahan'), ops = sum('ops');
  const profit = omset - bahan - ops;
  const belum = days.filter((d) => d.t.belumBeli > 0).length;

  const list = [...days].reverse().map((d) => {
    const dt = parseISO(d.tanggal);
    const hari = `${HARI[dt.getDay()]}, ${dt.getDate()}/${dt.getMonth() + 1}`;
    return `
      <button data-action="open-day" data-tanggal="${d.tanggal}"
        class="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-2 text-left active:bg-gray-50">
        <span class="min-w-0">
          <b class="block text-sm">${hari}${d.t.belumBeli > 0 ? ' ⚠️' : ''}</b>
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
    <div class="mt-2 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-xl bg-green-100 p-2"><div class="text-[11px] text-gray-500">Omset</div><b class="text-sm text-green-700">${rupiah(omset)}</b></div>
      <div class="rounded-xl bg-gray-100 p-2"><div class="text-[11px] text-gray-500">Modal bahan</div><b class="text-sm">${rupiah(bahan)}</b></div>
      <div class="rounded-xl bg-red-50 p-2"><div class="text-[11px] text-gray-500">Operasional</div><b class="text-sm text-red-700">${rupiah(ops)}</b></div>
    </div>
    <p class="mt-2 text-center text-[11px] text-gray-500">Profit = Omset − Modal bahan − Operasional</p>
    ${belum ? `<p class="mt-2 rounded-lg bg-amber-100 p-2 text-xs text-amber-800">⚠️ Modal belum lengkap di ${belum} hari (ada bahan yang harga belinya kosong). Profit bisa tampak lebih besar dari kenyataan.</p>` : ''}
    <h3 class="mb-2 mt-4 text-sm font-bold text-gray-700">Per hari (ketuk untuk membuka)</h3>
    <div class="space-y-2">${list}</div>`;
}
