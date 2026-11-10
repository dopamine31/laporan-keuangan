import { addBtn, simpleRow } from '../components.js';

const block = (title, list, items, color) => `
  <details ${items.length ? 'open' : ''} class="mb-3 rounded-xl border p-2 ${color}">
    <summary class="flex cursor-pointer items-center justify-between font-bold">
      <span>${title}</span><span data-total="${list}"></span>
    </summary>
    <div class="mt-2 space-y-2">
      ${items.map((x, i) => simpleRow(list, i, x, 'Nama')).join('')}
      ${addBtn(list, 'Tambah', 'bg-gray-700')}
    </div>
  </details>`;

export const noteView = (s) => `
  <h2 class="mb-3 font-bold text-gray-800">📝 Note</h2>
  ${block('📥 Piutang (orang berutang ke kita)', 'piutang', s.piutang, 'border-blue-200 bg-blue-50')}
  ${block('📤 Hutang (kita berutang)', 'hutang', s.hutang, 'border-orange-200 bg-orange-50')}
  <button data-action="logout" class="mt-6 w-full rounded-xl border border-gray-300 py-3 font-semibold text-gray-600">Keluar</button>`;