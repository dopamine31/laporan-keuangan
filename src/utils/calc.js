// keyboard desimal Indonesia memakai koma, jadi ubah ke titik
export const num = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;

// modal = qty x harga beli (per satuan)
export const rowJumlah = (b) => num(b.qty) * num(b.harga);
// penjualan = qty x harga jual (per satuan)
export const rowJual = (b) => num(b.qty) * num(b.jual);

const sum = (arr, fn) => arr.reduce((t, x) => t + fn(x), 0);

export const totals = (s) => {
  const bahan = sum(s.bahan, rowJumlah);
  const omset = sum(s.bahan, rowJual);
  const ops = sum(s.ops, (o) => num(o.jumlah));
  return {
    bahan, omset, ops,
    profit: omset - bahan - ops,
    piutang: sum(s.piutang, (p) => num(p.jumlah)),
    hutang: sum(s.hutang, (h) => num(h.jumlah)),
    belumBeli: s.bahan.filter((b) => num(b.harga) <= 0).length,
    belumJual: s.bahan.filter((b) => num(b.jual) <= 0).length,
  };
};
