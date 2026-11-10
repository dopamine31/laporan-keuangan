import { addBtn, delBtn, head, input, saranBtn } from '../components.js';

// Kartu dan badge diwarnai oleh app.js (refresh):
// harga beli kosong = oranye "Belum dibeli", terisi = hijau "Sudah dibeli".
export const bahanView = (s) => `
  ${head('🛒 Pembelian Bahan', 'bahan', 'bg-gray-200')}
  <details id="paste-box" ${s.bahan.length ? '' : 'open'} class="mb-2 rounded-xl border border-blue-200 bg-blue-50 p-2">
    <summary class="cursor-pointer font-bold text-blue-700">📋 Tempel daftar belanja</summary>
    <p class="mt-2 text-xs text-gray-600">Salin daftar dari chat, Excel, atau hasil OCR HP, lalu tempel di sini.
      Satu bahan per baris: <b>nama qty satuan</b>.</p>
    <textarea id="paste" rows="6" placeholder="Contoh: 1 Beras 100 kg"
      class="mt-2 w-full rounded-lg border border-gray-300 bg-white p-2 text-base outline-none focus:border-green-500"></textarea>
    <button data-action="import" class="mt-2 w-full rounded-xl bg-blue-600 py-3 font-bold text-white active:opacity-80">➕ Tambahkan ke daftar</button>
  </details>
  <p id="paste-msg" class="mb-2 text-xs text-gray-700"></p>
  <p class="mb-3 text-xs italic text-gray-500">Harga beli diisi belakangan, <b>per satuan</b> (mis. per kg). Hanya kamu yang melihat harga ini.
    Angka abu-abu = harga terakhir untuk bahan itu, ketuk <b>✓ pakai</b> atau ketik harga baru.</p>
  <div class="space-y-2">
    ${s.bahan.map((b, i) => `
      <div data-card="beli" data-i="${i}" class="rounded-xl border p-2">
        <div class="flex items-center gap-1">
          ${input({ list: 'bahan', i, f: 'nama', value: b.nama, ph: 'Nama bahan', cls: 'flex-1 font-semibold' })}
          ${delBtn('bahan', i)}
        </div>
        <div class="mt-1 grid grid-cols-[1fr_1fr_1.6fr] gap-1">
          ${input({ list: 'bahan', i, f: 'qty', value: b.qty, ph: 'Qty', numeric: true })}
          ${input({ list: 'bahan', i, f: 'sat', value: b.sat, ph: 'Sat' })}
          ${input({ list: 'bahan', i, f: 'harga', value: b.harga, ph: 'Harga beli', numeric: true })}
        </div>
        ${saranBtn(i, 'harga')}
        <div class="mt-1 flex items-center justify-between">
          <span data-badge data-i="${i}"></span>
          <p class="text-sm text-gray-600">Modal: <b data-calc="jumlah" data-list="bahan" data-i="${i}"></b></p>
        </div>
      </div>`).join('')}
    ${addBtn('bahan', 'Tambah Bahan', 'bg-green-600')}
    ${s.bahan.length > 1
      ? '<button data-action="clear" data-list="bahan" class="w-full py-2 text-sm text-gray-400">Kosongkan semua bahan</button>'
      : ''}
  </div>`;
