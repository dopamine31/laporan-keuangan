import html2canvas from 'html2canvas-pro';
import { totals, num, rowJumlah, rowJual } from '../utils/calc.js';
import { rupiah, tanggalPanjang, esc } from '../utils/format.js';

const head2 = (s, tanggal) => `
  <table>
    <tr><th class="h-blue" style="width:130px">Tanggal</th><td class="c"><b>${tanggalPanjang(tanggal)}</b></td></tr>
    <tr><th class="h-cream">Menu</th><td class="c">${esc(s.menu) || '-'}</td></tr>
  </table>`;

// ===== INVOICE PELANGGAN: hanya harga jual + total =====
const invoiceTemplate = (s, t, tanggal) => {
  const rows = s.bahan.length
    ? s.bahan.map((b, i) => {
        const ada = num(b.jual) > 0;
        return `<tr>
          <td class="c">${i + 1}</td>
          <td style="white-space:normal">${esc(b.nama)}</td>
          <td class="c">${esc(b.qty)}</td><td class="c">${esc(b.sat)}</td>
          <td class="r">${ada ? rupiah(num(b.jual)) : ''}</td>
          <td class="r ${ada ? 'filled' : ''}">${ada ? rupiah(rowJual(b)) : ''}</td></tr>`;
      }).join('')
    : '<tr><td colspan="6" class="c">-</td></tr>';
  return `
  <div class="rpt" style="width:800px">
    ${head2(s, tanggal)}
    <table>
      <colgroup><col style="width:50px"><col><col style="width:90px"><col style="width:90px"><col style="width:130px"><col style="width:150px"></colgroup>
      <thead><tr>${['NO', 'BAHAN', 'QTY', 'SAT', 'HARGA', 'JUMLAH'].map((h) => `<th class="h-blue">${h}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="tot"><td colspan="5" class="c">TOTAL</td><td class="r">${rupiah(t.omset)}</td></tr></tfoot>
    </table>
  </div>`;
};

// ===== LAPORAN INTERNAL: lengkap (modal, profit, dll) =====
const MIN_ROWS = 15;
const EMPTY7 = '<tr>' + '<td></td>'.repeat(7) + '</tr>';
const EMPTY2 = '<tr><td></td><td></td></tr>';

const bahanRows = (s, n) =>
  Array.from({ length: n }, (_, i) => {
    const b = s.bahan[i];
    if (!b) return EMPTY7;
    const beli = num(b.harga) > 0;
    const jual = num(b.jual) > 0;
    return `<tr>
      <td>${esc(b.nama)}</td><td class="c">${esc(b.qty)}</td><td class="c">${esc(b.sat)}</td>
      <td class="r">${beli ? rupiah(num(b.harga)) : ''}</td><td class="r">${beli ? rupiah(rowJumlah(b)) : ''}</td>
      <td class="r">${jual ? rupiah(num(b.jual)) : ''}</td>
      <td class="r ${jual ? 'filled' : ''}">${jual ? rupiah(rowJual(b)) : ''}</td></tr>`;
  }).join('');

const opsRows = (s, n) =>
  Array.from({ length: n }, (_, i) => {
    const o = s.ops[i];
    return o ? `<tr><td>${esc(o.nama)}</td><td class="r">${rupiah(num(o.jumlah))}</td></tr>` : EMPTY2;
  }).join('');

const listRows = (items) =>
  items.length
    ? items.map((x) => `<tr><td>${esc(x.nama)}</td><td class="r">${rupiah(num(x.jumlah))}</td></tr>`).join('')
    : '<tr><td colspan="2" class="c">-</td></tr>';

const internalTemplate = (s, t, tanggal) => {
  const n = Math.max(MIN_ROWS, s.bahan.length, s.ops.length);
  return `
  <div class="rpt" style="width:1200px">
    <div class="rpt-grid">
      <div class="rpt-main">
        ${head2(s, tanggal)}
        <table>
          <colgroup><col><col style="width:60px"><col style="width:60px"><col style="width:100px"><col style="width:110px"><col style="width:100px"><col style="width:120px"></colgroup>
          <thead><tr>${['BAHAN', 'QTY', 'SAT', 'HARGA BELI', 'MODAL', 'HARGA JUAL', 'OMSET'].map((h) => `<th class="h-blue">${h}</th>`).join('')}</tr></thead>
          <tbody>${bahanRows(s, n)}</tbody>
          <tfoot><tr class="tot"><td colspan="4" class="c">TOTAL</td><td class="r">${rupiah(t.bahan)}</td><td></td><td class="r">${rupiah(t.omset)}</td></tr></tfoot>
        </table>
      </div>
      <div class="rpt-side">
        <table>
          <thead><tr><th class="h-red" colspan="2">Operasional</th></tr></thead>
          <tbody>${opsRows(s, n + 2)}</tbody>
          <tfoot><tr class="tot tot-red"><td>TOTAL</td><td class="r">${rupiah(t.ops)}</td></tr></tfoot>
        </table>
      </div>
    </div>
    <div class="rpt-grid" style="margin-top:8px">
      <table class="sum">
        <tr><td>OPERASIONAL</td><td>:</td><td class="r">${rupiah(t.ops)}</td></tr>
        <tr class="omz"><td>OMZET</td><td>:</td><td class="r">${rupiah(t.omset)}</td></tr>
        <tr><td>MODAL BAHAN</td><td>:</td><td class="r">${rupiah(t.bahan)}</td></tr>
        <tr class="net"><td>NET PROFIT</td><td>:</td><td class="r">${rupiah(t.profit)}</td></tr>
      </table>
      <div style="flex:1">
        <table><thead><tr><th class="h-green" colspan="2">PIUTANG</th></tr></thead><tbody>${listRows(s.piutang)}</tbody></table>
        <table><thead><tr><th class="h-green" colspan="2">LIST HUTANG</th></tr></thead><tbody>${listRows(s.hutang)}</tbody></table>
      </div>
    </div>
  </div>`;
};

async function shareOrDownload(blob, name, title) {
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// mode: 'invoice' (untuk pelanggan) atau 'internal' (rahasia)
export async function exportImage(state, tanggal, mode = 'invoice') {
  const isInvoice = mode === 'invoice';
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;background:#fff';
  host.innerHTML = (isInvoice ? invoiceTemplate : internalTemplate)(state, totals(state), tanggal);
  document.body.appendChild(host);
  try {
    const { offsetWidth: w, offsetHeight: h } = host;
    // batas canvas Safari iOS ≈ 16 juta piksel
    const scale = Math.min(4, Math.sqrt(16_000_000 / (w * h)));
    const canvas = await html2canvas(host, { scale, backgroundColor: '#ffffff', logging: false });
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    await shareOrDownload(
      blob,
      `${isInvoice ? 'invoice' : 'laporan-internal'}-${tanggal}.png`,
      isInvoice ? 'Invoice' : 'Laporan Internal',
    );
  } finally {
    host.remove();
  }
}
