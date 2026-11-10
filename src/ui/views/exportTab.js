import { totals } from '../../utils/calc.js';

export const exportView = (s) => {
  const t = totals(s);
  return `
  <div class="mt-4 space-y-4 text-center">
    <h2 class="text-xl font-bold text-gray-800">📸 Export</h2>
    ${t.belumJual > 0 ? `<p class="rounded-xl bg-amber-100 p-2 text-sm font-semibold text-amber-800">⚠️ ${t.belumJual} bahan belum ada harga jual</p>` : ''}

    <div class="space-y-2 rounded-xl border border-blue-200 p-3">
      <p class="text-sm text-gray-500">Untuk pelanggan: hanya harga jual dan total.</p>
      <p class="text-2xl font-bold text-green-700" data-total="omset"></p>
      <button data-action="export" class="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg active:opacity-80">🧾 Invoice Pelanggan</button>
    </div>

    <div class="space-y-2 rounded-xl border border-gray-300 p-3">
      <p class="text-sm text-gray-500">🔒 Hanya untuk kamu: ada modal dan profit. <b>Jangan dikirim ke pelanggan.</b></p>
      <button data-action="export-internal" class="w-full rounded-xl bg-gray-700 py-3 font-bold text-white active:opacity-80">📊 Laporan Internal</button>
      <dl class="space-y-1 rounded-xl bg-gray-100 p-3 text-left text-sm">
        <div class="flex justify-between"><dt>Penjualan</dt><dd data-total="omset"></dd></div>
        <div class="flex justify-between"><dt>Modal bahan</dt><dd data-total="bahan"></dd></div>
        <div class="flex justify-between"><dt>Operasional</dt><dd data-total="ops"></dd></div>
        <div class="flex justify-between border-t pt-1 font-bold"><dt>Net Profit</dt><dd data-total="profit"></dd></div>
      </dl>
    </div>
  </div>`;
};
