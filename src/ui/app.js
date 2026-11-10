import { getState, setState, blank } from '../state/store.js';
import { loadReport, saveReport, saveLocal } from '../services/reportService.js';
import { loadRange } from '../services/rekapService.js';
import { getHarga, remember, pushHarga, syncHarga } from '../services/hargaService.js';
import { signOut } from '../services/authService.js';
import { totals, rowJumlah, rowJual, num } from '../utils/calc.js';
import { rupiah, todayISO } from '../utils/format.js';
import { range, shift } from '../utils/periode.js';
import { parseList } from '../utils/parseList.js';
import { exportImage } from './exportImage.js';
import { alertBox, confirmBox } from './dialog.js';
import { bahanView } from './views/bahan.js';
import { jualView } from './views/jual.js';
import { opsView } from './views/ops.js';
import { noteView } from './views/note.js';
import { exportView } from './views/exportTab.js';
import { rekapView, rekapBody } from './views/rekap.js';

const TABS = [
  { id: 'bahan', icon: '🛒', label: 'Bahan' },
  { id: 'jual', icon: '💵', label: 'Jual' },
  { id: 'ops', icon: '💸', label: 'Ops' },
  { id: 'note', icon: '📝', label: 'Note' },
  { id: 'rekap', icon: '📊', label: 'Rekap' },
  { id: 'export', icon: '📸', label: 'Export' },
];

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
  const rekap = { mode: 'minggu', anchor: todayISO() };
  let rekapSeq = 0;
  let undoFn = null;
  let undoTimer;

  const VIEWS = {
    bahan: bahanView, jual: jualView, ops: opsView, note: noteView, export: exportView,
    rekap: () => rekapView(rekap.mode, rekap.anchor),
  };

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
      <div id="profitbar">
        <div class="flex items-center justify-between bg-yellow-300 px-4 py-2 font-bold">
          <span>💰 NET PROFIT</span><span id="profit" data-total="profit" class="text-xl"></span>
        </div>
      </div>
      <main id="content" class="flex-1 overflow-y-auto overflow-x-hidden p-3"></main>
      <nav class="grid grid-cols-6 border-t bg-white pb-[env(safe-area-inset-bottom)]">
        ${TABS.map((t) => `
          <button data-tab="${t.id}" class="flex flex-col items-center py-2 text-xs">
            <span class="text-xl">${t.icon}</span>${t.label}</button>`).join('')}
      </nav>
    </div>
    <div id="undo" class="hidden fixed inset-x-0 z-50 px-3" style="bottom:calc(4.75rem + env(safe-area-inset-bottom))">
      <div class="mx-auto flex max-w-md items-center justify-between rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
        <span id="undo-msg"></span>
        <button id="undo-btn" class="font-bold text-yellow-300">Urungkan</button>
      </div>
    </div>`;

  const content = $('content');
  const setStatus = (t) => { $('status').textContent = t; };

  // ---- undo
  function hideUndo() {
    clearTimeout(undoTimer);
    undoFn = null;
    $('undo').classList.add('hidden');
  }
  function showUndo(msg, fn) {
    undoFn = fn;
    $('undo-msg').textContent = msg;
    $('undo').classList.remove('hidden');
    clearTimeout(undoTimer);
    undoTimer = setTimeout(hideUndo, 6000);
  }
  $('undo-btn').onclick = () => {
    const fn = undoFn;
    hideUndo();
    if (fn) fn();
  };

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

    // harga terakhir per nama bahan: abu-abu, baru dipakai kalau kamu ketuk "pakai"
    document.querySelectorAll('[data-saran]').forEach((el) => {
      const b = s.bahan[el.dataset.i];
      if (!b) return;
      const f = el.dataset.saran;
      const h = getHarga(b.nama);
      const v = h ? h[f] : 0;
      const show = v > 0 && num(b[f]) <= 0;
      el.classList.toggle('hidden', !show);
      el.dataset.v = String(v);
      if (show) el.textContent = `✓ pakai ${rupiah(v)} (terakhir)`;
      const inp = document.querySelector(`input[data-list="bahan"][data-i="${el.dataset.i}"][data-f="${f}"]`);
      if (inp) inp.placeholder = show ? String(v) : (inp.dataset.ph || '');
    });

    $('profit').classList.toggle('text-red-700', t.profit < 0);
  }

  async function loadRekap() {
    const my = ++rekapSeq;
    const { from, to } = range(rekap.mode, rekap.anchor);
    const body = () => (my === rekapSeq && tab === 'rekap' ? $('rekap-body') : null);
    try {
      const rows = await loadRange(from, to);
      if (body()) body().innerHTML = rekapBody(rows);
    } catch {
      if (body()) body().innerHTML = '<p class="py-10 text-center text-red-600">Gagal memuat rekap. Cek internet.</p>';
    }
  }

  function renderTab() {
    content.innerHTML = VIEWS[tab](getState());
    document.querySelectorAll('[data-tab]').forEach((b) => {
      const on = b.dataset.tab === tab;
      b.className = `flex flex-col items-center py-2 text-xs ${on ? 'font-bold text-green-600' : 'text-gray-400'}`;
    });
    $('profitbar').classList.toggle('hidden', tab === 'rekap');
    refresh();
    if (tab === 'rekap') loadRekap();
  }

  async function persist() {
    remember(getState().bahan);
    try { await saveReport(tanggal, getState()); setStatus('☁️ Tersimpan'); }
    catch { setStatus('📴 Tersimpan di HP (offline)'); }
    pushHarga().catch(() => {});
  }

  function scheduleSave() {
    saveLocal(tanggal, getState()); // langsung aman di HP
    setStatus('⏳ Menyimpan…');
    clearTimeout(timer);
    timer = setTimeout(persist, 800);
  }

  async function loadDay() {
    hideUndo();
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
      if (mode === 'invoice' && t.belumJual > 0) {
        const lanjut = await confirmBox(
          `${t.belumJual} bahan belum ada harga jual dan akan tampil kosong di invoice.`,
          { title: 'Harga jual belum lengkap', icon: '⚠️', ok: 'Tetap buat', cancel: 'Batal' },
        );
        if (!lanjut) return;
      }
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = '⏳ Membuat gambar…';
      try { await exportImage(s, tanggal, mode); }
      catch (err) {
        await alertBox(`Gagal membuat gambar: ${err.message}`, { title: 'Gagal', icon: '❌' });
      }
      btn.disabled = false; btn.textContent = label;
      return;
    }

    if (action === 'logout') {
      clearTimeout(timer);
      await persist(); await signOut(); onLogout(); return;
    }

    // ---- rekap
    if (action === 'rekap-mode') { rekap.mode = btn.dataset.mode; renderTab(); return; }
    if (action === 'rekap-prev' || action === 'rekap-next') {
      rekap.anchor = shift(rekap.mode, rekap.anchor, action === 'rekap-next' ? 1 : -1);
      renderTab();
      return;
    }
    if (action === 'open-day') {
      tanggal = btn.dataset.tanggal;
      $('tanggal').value = tanggal;
      tab = 'bahan';
      await loadDay();
      content.scrollTop = 0;
      return;
    }

    // ---- pakai harga terakhir
    if (action === 'pakai') {
      const f = btn.dataset.saran;
      const b = s.bahan[i];
      if (b) b[f] = btn.dataset.v;
      renderTab();
      scheduleSave();
      return;
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
      const removed = s[list].splice(0);
      renderTab();
      scheduleSave();
      showUndo(`${removed.length} bahan dihapus`, () => {
        getState()[list].unshift(...removed);
        renderTab();
        scheduleSave();
      });
      return;
    }

    if (action === 'add') {
      s[list].push(blank[list]());
      renderTab();
      content.querySelector(`[data-list="${list}"][data-i="${s[list].length - 1}"]`)?.focus();
    }
    if (action === 'del') {
      const idx = Number(i);
      const [item] = s[list].splice(idx, 1);
      renderTab();
      showUndo('Item dihapus', () => {
        getState()[list].splice(idx, 0, item);
        renderTab();
        scheduleSave();
      });
    }
    scheduleSave();
  });

  document.querySelectorAll('[data-tab]').forEach((b) => {
    b.onclick = async () => {
      const next = b.dataset.tab;
      if (next === 'rekap' && tab !== 'rekap') {
        clearTimeout(timer);
        await persist(); // pastikan hari ini sudah tersimpan sebelum rekap dihitung
      }
      tab = next;
      renderTab();
      content.scrollTop = 0;
    };
  });

  $('menu').oninput = (e) => { getState().menu = e.target.value; scheduleSave(); };
  $('tanggal').onchange = async (e) => {
    clearTimeout(timer); // cegah data tanggal lama tersimpan ke tanggal baru
    await persist();
    tanggal = e.target.value || todayISO();
    $('tanggal').value = tanggal;
    await loadDay();
  };

  loadDay();
  syncHarga().then(refresh).catch(() => {});
}
