import { addBtn, head, simpleRow } from '../components.js';

export const opsView = (s) => `
  ${head('💸 Operasional', 'ops', 'bg-red-100 text-red-700')}
  <div class="space-y-2">
    ${s.ops.map((o, i) => simpleRow('ops', i, o, 'Bensin, gas, parkir…')).join('')}
    ${addBtn('ops', 'Tambah Operasional', 'bg-red-600')}
  </div>`;