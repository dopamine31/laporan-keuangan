import '../styles/invoice.css';
import { num, rowJual } from '../utils/calc.js';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Jumlah baris minimal (sama seperti gambar contoh)
const MIN_BARIS = 18;
// true = baris kosong tetap menampilkan "Rp0" seperti gambar. false = dikosongkan.
const RP0_KOSONG = true;

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const rp = (n) =>
  'Rp' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const tglPanjang = (iso) => {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return '-';
  const dt = new Date(y, m - 1, d);
  return `${HARI[dt.getDay()]}, ${d} ${BULAN[m - 1]} ${y}`;
};

export function invoiceHTML(state, tanggalISO) {
  const rows = (state.bahan || []).filter(
    (b) => String(b.nama || '').trim() || num(b.qty) || num(b.jual)
  );

  let total = 0;
  let body = '';

  for (const b of rows) {
    const jumlah = rowJual(b);
    total += jumlah;
    body += `<tr>
      <td>${esc(b.nama)}</td>
      <td class="c">${esc(b.qty)}</td>
      <td class="c">${esc(b.sat)}</td>
      <td class="r">${num(b.jual) > 0 ? rp(num(b.jual)) : ''}</td>
      <td class="r">${rp(jumlah)}</td>
    </tr>`;
  }

  for (let i = rows.length; i < MIN_BARIS; i++) {
    body += `<tr>
      <td></td><td></td><td></td><td></td>
      <td class="r">${RP0_KOSONG ? 'Rp0' : ''}</td>
    </tr>`;
  }

  const menu = String(state.menu || '').trim() || '-';

  return `<table class="inv">
    <colgroup>
      <col style="width:229px"><col style="width:162px"><col style="width:79px">
      <col style="width:165px"><col style="width:165px">
    </colgroup>
    <tr><td class="lbl">Tanggal</td><td class="val" colspan="4">${esc(tglPanjang(tanggalISO))}</td></tr>
    <tr class="menu"><td class="lbl">Menu</td><td class="val" colspan="4">${esc(menu)}</td></tr>
    <tr class="head"><th>BAHAN</th><th>QTY</th><th>SAT</th><th>Harga</th><th>Jumlah</th></tr>
    ${body}
    <tr class="tot"><td></td><td class="mid" colspan="2">TOTAL</td><td></td><td class="r">${rp(total)}</td></tr>
  </table>`;
}
