import { esc } from '../utils/format.js';

// font 16px (text-base) supaya iPhone tidak zoom saat fokus
export const input = ({ list, i, f, value, ph = '', numeric = false, cls = '' }) => `
  <input data-list="${list}" data-i="${i}" data-f="${f}" type="text"
    ${numeric ? 'inputmode="decimal"' : ''} value="${esc(value)}" placeholder="${ph}"
    class="min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-2 text-base outline-none focus:border-green-500 ${cls}">`;

export const delBtn = (list, i) => `
  <button data-action="del" data-list="${list}" data-i="${i}" aria-label="Hapus" class="px-2 text-xl">🗑️</button>`;

export const addBtn = (list, label, color) => `
  <button data-action="add" data-list="${list}"
    class="w-full rounded-xl ${color} py-3 font-bold text-white active:opacity-80">+ ${label}</button>`;

export const head = (title, totalKey, badge) => `
  <div class="mb-3 flex items-center justify-between">
    <h2 class="font-bold text-gray-800">${title}</h2>
    <span data-total="${totalKey}" class="rounded-lg px-2 py-1 text-sm font-bold ${badge}"></span>
  </div>`;

// baris sederhana: nama + jumlah (ops / piutang / hutang)
export const simpleRow = (list, i, item, ph) => `
  <div class="flex items-center gap-1">
    ${input({ list, i, f: 'nama', value: item.nama, ph, cls: 'flex-1' })}
    ${input({ list, i, f: 'jumlah', value: item.jumlah, ph: 'Rp', numeric: true, cls: 'w-28 text-right' })}
    ${delBtn(list, i)}
  </div>`;