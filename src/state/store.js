// State laporan harian yang sedang dibuka.
// getState() mengembalikan objek yang sama, jadi boleh diubah langsung.
import { num } from '../utils/calc.js';

// harga = harga beli per satuan, jual = harga jual per satuan
export const blank = {
  bahan:   () => ({ nama: '', qty: '', sat: '', harga: '', jual: '' }),
  ops:     () => ({ nama: '', jumlah: '' }),
  piutang: () => ({ nama: '', jumlah: '' }),
  hutang:  () => ({ nama: '', jumlah: '' }),
};

const emptyState = () => ({ menu: '', bahan: [], ops: [], piutang: [], hutang: [] });

// data lama punya "omset" (total per baris) -> jadikan harga jual per satuan
const migrateBahan = (b) => {
  const x = { ...blank.bahan(), ...b };
  if ((b.jual === undefined || b.jual === '') && num(b.omset) > 0 && num(b.qty) > 0) {
    x.jual = String(Math.round((num(b.omset) / num(b.qty)) * 100) / 100);
  }
  delete x.omset;
  return x;
};

let state = emptyState();

export const getState = () => state;

export const setState = (next) => {
  const src = next && typeof next === 'object' ? next : {};
  state = { ...emptyState(), ...src };
  for (const k of ['bahan', 'ops', 'piutang', 'hutang']) {
    if (!Array.isArray(state[k])) state[k] = [];
  }
  state.bahan = state.bahan.map(migrateBahan);
  if (typeof state.menu !== 'string') state.menu = '';
  return state;
};
