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

// dipakai juga oleh rekap untuk membaca data dari server
export const normalizeState = (next) => {
  const src = next && typeof next === 'object' ? next : {};
  const st = { ...emptyState(), ...src };
  for (const k of ['bahan', 'ops', 'piutang', 'hutang']) {
    if (!Array.isArray(st[k])) st[k] = [];
  }
  st.bahan = st.bahan.map(migrateBahan);
  if (typeof st.menu !== 'string') st.menu = '';
  return st;
};

let state = emptyState();

export const getState = () => state;

export const setState = (next) => {
  state = normalizeState(next);
  return state;
};
