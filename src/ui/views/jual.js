import { input, head } from '../components.js';
import { esc } from '../../utils/format.js';

export const jualView = (s) => `
  ${head('💵 Harga Jual', 'omset', 'bg-green-100 text-green-700')}
  <p class="mb-3 text-xs italic text-gray-500">Isi harga jual <b>per satuan</b> (mis. per kg). Jumlah = qty × harga.
    Hanya harga jual ini yang tampil di invoice.</p>
  ${s.bahan.length === 0
    ? '<p class="py-10 text-center text-gray-400">Belum ada bahan.<br>Isi dulu di tab 🛒 Bahan.</p>'
    : `<div class="space-y-2">${s.bahan.map((b, i) => `
      <div data-card="jual" data-i="${i}" class="rounded-xl border p-2">
        <div class="flex justify-between gap-2">
          <b class="truncate">${esc(b.nama) || '(tanpa nama)'}</b>
          <span class="shrink-0 text-xs text-gray-500">${esc(b.qty)} ${esc(b.sat)}</span>
        </div>
        <div class="mt-2 grid grid-cols-2 items-center gap-2">
          <div class="text-xs text-gray-500">Modal (rahasia)<br>
            <b class="text-sm text-gray-800" data-calc="jumlah" data-list="bahan" data-i="${i}"></b></div>
          ${input({ list: 'bahan', i, f: 'jual', value: b.jual, ph: 'Harga jual / sat', numeric: true, cls: 'text-right font-bold' })}
        </div>
        <div class="mt-1 flex justify-between text-xs text-gray-500">
          <span>Jumlah jual: <b class="text-sm text-gray-800" data-calc="jual" data-list="bahan" data-i="${i}"></b></span>
          <span>Untung: <b data-calc="untung" data-list="bahan" data-i="${i}"></b></span>
        </div>
      </div>`).join('')}</div>`}`;
