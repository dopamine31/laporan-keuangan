import { getState, setState, blank } from '../state/store.js';
import { loadReport, saveReport, saveLocal } from '../services/reportService.js';
import { signOut } from '../services/authService.js';
import { totals, rowJumlah, rowJual, num } from '../utils/calc.js';
import { rupiah, todayISO } from '../utils/format.js';
import { parseList } from '../utils/parseList.js';
import { exportImage } from './exportImage.js';
import { bahanView } from './views/bahan.js';
import { jualView } from './views/jual.js';
import { opsView } from './views/ops.js';
import { noteView } from './views/note.js';
import { exportView } from './views/exportTab.js';

const TABS = [
  { id: 'bahan', icon: '🛒', label: 'Bahan' },
  { id: 'jual', icon: '💵', label: 'Jual' },
  { id: 'ops', icon: '💸', label: 'Ops' },
  { id: 'note', icon: '📝', label: 'Note' },
  { id: 'export', icon: '📸', label: 'Export' },
];
const VIEWS = { bahan: bahanView, jual: jualView, ops: opsView, note: noteView, export: exportView };

// warna kartu: beli (oranye -> hijau), jual (putih -> hijau)
const CARD = {
  beli: { on: 'border-green-300 bg-green-50', off: 'border-amber-300 bg-amber-50' },
  jual: { on: 'border-green-300 bg-green-50', off: 'border-gray-300 bg-white' },
};
const BADGE_ON = 'rounded-full bg-green-200 px-2 py-1 text-xs font-bold text-green-800';
const BADGE_OFF = 'rounded-full bg-amber-200 px-2 py-1 text-xs font-bold text-amber-800';

const $ = (id) => document.getElementById(id);

export function mountApp(onLogout) {
  let tab = 'bahan';
  let tanggal = todayISO();
  let timer;

  $('app').innerHTML = `
    <div class="mx-auto flex h-dvh max-w-md flex-col bg-white shadow-xl">
      <header class="bg-green-600 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <div class="flex items-center justify-between gap-2">
          <input id="tanggal" type="date" value="${tanggal}" class="rounded bg-green-700 px-2 py-1 text-base font-bold outline-none">
          <span id="status" class="rounded bg-green-800 px-2 py-1 text-[11px]"></span>
        </div>
        <input id="menu" type="text" placeholder="Nama menu / jualan hari ini…"
          class="mt-2 w-full border-b border-green-300 bg-transparent text-lg font-bold outline-none placeholder:text-green-200">
      </header>
      <div class="flex items-center justify-between bg-yellow-300 px-4 py-2 font-bold">
        <span>💰 NET PROFIT</span><span id="profit" data-total="profit" class="text-xl"></span>
      </div>
      <main id="content" class="flex-1 overflow-y-auto overflow-x-hidden p-3"></main>
      <nav class="grid grid-cols-5 border-t bg-white pb-[env(safe-area-inset-bottom)]">
        ${TABS.map((t) => `
          <button data-tab="${t.id}" class="flex flex-col items-center py-2 text-xs">
            <span class="text-xl">${t.icon}</span>${t.label}</button>`).join('')}
      </nav>
    </div>`;

  const content = $('content');

  const setStatus = (t) => { $('status').textContent = t; };

  function refresh() {
    const s = getState();
    const t = totals(s);
    document.querySelectorAll('[data-total]').forEach((el) => { el.textContent = rupiah(t[el.dataset.total]); });

    document.querySelectorAll('[data-calc]').forEach((el) => {
      const it = s[el.dataset.list][el.dataset.i];
      if (!it) return;
      const k = el.dataset.calc;
      if (k === 'jumlah') el.textContent = rupiah(rowJumlah(it));
      else if (k === 'jual') el.textContent = rupiah(rowJual(it));
      else if (k === 'untung') {
        el.textContent = num(it.harga) > 0 ? rupiah(rowJual(it) - rowJumlah(it)) : '-';
      }
    });

    document.querySelectorAll('[data-card]').forEach((el) => {
      const b = s.bahan[el.dataset.i];
      if (!b) return;
      const kind = el.dataset.card;
      const done = num(kind === 'beli' ? b.harga : b.jual) > 0;
      el.className = `rounded-xl border p-2 ${done ? CARD[kind].on : CARD[kind].off}`;
    });

    document.querySelectorAll('[data-badge]').forEach((el) => {
      const b = s.bahan[el.dataset.i];
      if (!b) return;
      const done = num(b.harga) > 0;
      el.className = done ? BADGE_ON : BADGE_OFF;
      el.textContent = done ? '✅ Sudah dibeli' : '🛍️ Belum dibeli';
    });

    $('profit').classList.toggle('text-red-700', t.profit < 0);
  }

  function renderTab() {
    content.innerHTML = VIEWS[tab](getState());
    document.querySelectorAll('[data-tab]').forEach((b) => {
      const on = b.dataset.tab === tab;
      b.className = `flex flex-col items-center py-2 text-xs ${on ? 'font-bold text-green-600' : 'text-gray-400'}`;
    });
    refresh();
  }

  async function persist() {
    try { await saveReport(tanggal, getState()); setStatus('☁️ Tersimpan'); }
    catch { setStatus('📴 Tersimpan di HP (offline)'); }
  }

  function scheduleSave() {
    saveLocal(tanggal, getState()); // langsung aman di HP
    setStatus('⏳ Menyimpan…');
    clearTimeout(timer);
    timer = setTimeout(persist, 800);
  }

  async function loadDay() {
    setStatus('⏳ Memuat…');
    setState(await loadReport(tanggal));
    $('menu').value = getState().menu;
    renderTab();
    setStatus('☁️ Siap');
  }

  // ---- event: ketik (tanpa render ulang, supaya keyboard tidak tertutup)
  content.addEventListener('input', (e) => {
    const { list, i, f } = e.target.dataset;
    if (!list || !f) return;
    getState()[list][i][f] = e.target.value;
    refresh();
    scheduleSave();
  });

  // ---- event: tombol
  content.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, list, i } = btn.dataset;
    const s = getState();

    if (action === 'export' || action === 'export-internal') {
      const mode = action === 'export' ? 'invoice' : 'internal';
      const t = totals(s);
      if (mode === 'invoice' && t.belumJual > 0
        && !confirm(`${t.belumJual} bahan belum ada harga jual dan akan tampil kosong di invoice. Tetap buat gambar?`)) return;
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = '⏳ Membuat gambar…';
      try { await exportImage(s, tanggal, mode); }
      catch (err) { alert('Gagal membuat gambar: ' + err.message); }
      btn.disabled = false; btn.textContent = label;
      return;
    }

    if (action === 'logout') {
      await persist(); await signOut(); onLogout(); return;
    }

    if (action === 'import') {
      const { items, bad } = parseList($('paste').value);
      items.forEach((it) => s.bahan.push({ ...blank.bahan(), ...it }));
      renderTab();
      $('paste').value = bad.join('\n'); // yang tidak terbaca tertinggal untuk diperbaiki
      $('paste-box').open = bad.length > 0;
      $('paste-msg').textContent = items.length || bad.length
        ? `✅ ${items.length} bahan ditambahkan.` +
          (bad.length ? ` ⚠️ ${bad.length} baris tidak terbaca, tertinggal di kotak. Perbaiki ke bentuk: nama qty satuan.` : '')
        : 'Tidak ada teks untuk dibaca. Tempel daftarnya dulu.';
      scheduleSave();
      return;
    }

    if (action === 'clear') {
      if (!confirm('Hapus SEMUA bahan di laporan ini?')) return;
      s[list].length = 0;
      renderTab();
      scheduleSave();
      return;
    }

    if (action === 'add') {
      s[list].push(blank[list]());
      renderTab();
      content.querySelector(`[data-list="${list}"][data-i="${s[list].length - 1}"]`)?.focus();
    }
    if (action === 'del') {
      if (!confirm('Hapus item ini?')) return;
      s[list].splice(i, 1);
      renderTab();
    }
    scheduleSave();
  });

  document.querySelectorAll('[data-tab]').forEach((b) => {
    b.onclick = () => { tab = b.dataset.tab; renderTab(); content.scrollTop = 0; };
  });

  $('menu').oninput = (e) => { getState().menu = e.target.value; scheduleSave(); };
  $('tanggal').onchange = async (e) => {
    await persist();
    tanggal = e.target.value || todayISO();
    await loadDay();
  };

  loadDay();
}
