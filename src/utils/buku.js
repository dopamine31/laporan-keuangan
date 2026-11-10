import { totals } from './calc.js';
import { normalizeState } from '../state/store.js';

// Hitung buku satu periode dari baris tabel laporan.
// Belanja (bahan + ops) dicatat di TANGGAL LAPORAN, uang cair dicatat di TANGGAL CAIR.
// Laporan yang belum cair (atau cair setelah periode berakhir) masuk "belum cair".
export function hitungBuku(rows, from, to, modalAwal) {
  const days = rows
    .map((r) => {
      const n = normalizeState(r.data);
      return { tanggal: r.tanggal, menu: n.menu, cair: n.cair, t: totals(n), kosong: !n.bahan.length && !n.ops.length };
    })
    .filter((d) => !d.kosong);

  const ev = new Map();
  const at = (d) => {
    if (!ev.has(d)) ev.set(d, { tanggal: d, keluar: 0, masuk: 0 });
    return ev.get(d);
  };

  let omset = 0, bahan = 0, ops = 0, hutang = 0;
  let cairOmset = 0, cairHari = 0, belumOmset = 0, belumHari = 0;

  for (const d of days) {
    omset += d.t.omset; bahan += d.t.bahan; ops += d.t.ops; hutang += d.t.hutang;
    at(d.tanggal).keluar += d.t.bahan + d.t.ops;
    if (d.t.omset <= 0) continue;
    if (d.cair && d.cair <= to) {
      at(d.cair < from ? from : d.cair).masuk += d.t.omset;
      cairOmset += d.t.omset; cairHari++;
    } else {
      belumOmset += d.t.omset; belumHari++;
    }
  }

  const awal = modalAwal ?? 0;
  let saldo = awal, terendah = awal;
  const ledger = [...ev.values()]
    .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))
    .map((e) => {
      saldo += e.masuk - e.keluar;
      terendah = Math.min(terendah, saldo);
      return { ...e, saldo };
    });

  return {
    days, omset, bahan, ops, hutang,
    cairOmset, cairHari, belumOmset, belumHari,
    ledger, terendah,
    awal,
    keluar: bahan + ops,
    akhir: awal + cairOmset - (bahan + ops),
    perkiraan: awal + cairOmset + belumOmset - (bahan + ops),
  };
}
