import { signInPin } from '../services/authService.js';

const PIN_LEN = 6;

export function mountLogin(onDone) {
  document.getElementById('app').innerHTML = `
    <div class="mx-auto flex h-dvh max-w-md flex-col items-center justify-center bg-white p-6 text-center shadow-xl">
      <div class="text-5xl">📊</div>
      <h1 class="mt-2 text-2xl font-bold text-gray-800">Laporan Harian</h1>
      <p class="mt-1 text-sm text-gray-500">Masukkan PIN ${PIN_LEN} angka</p>
      <input id="pin" type="password" inputmode="numeric" autocomplete="off"
        maxlength="${PIN_LEN}" placeholder="••••••"
        class="mt-6 w-48 rounded-xl border border-gray-300 py-3 text-center text-2xl font-bold tracking-widest outline-none focus:border-green-500">
      <p id="msg" class="mt-3 min-h-6 text-sm font-semibold text-red-600"></p>
    </div>`;

  const inp = document.getElementById('pin');
  const msg = document.getElementById('msg');
  let busy = false;
  let fails = 0;
  let lockUntil = 0;

  async function submit() {
    if (busy) return;
    const wait = Math.ceil((lockUntil - Date.now()) / 1000);
    if (wait > 0) { msg.textContent = `Terlalu banyak salah. Tunggu ${wait} detik.`; inp.value = ''; return; }
    busy = true;
    msg.textContent = '⏳ Memeriksa…';
    msg.className = 'mt-3 min-h-6 text-sm font-semibold text-gray-500';
    try {
      await signInPin(inp.value);
      onDone();
    } catch (e) {
      const salah = /invalid|credentials/i.test(e.message || '');
      fails = salah ? fails + 1 : fails;
      if (fails >= 5) { lockUntil = Date.now() + 30000; fails = 0; }
      msg.className = 'mt-3 min-h-6 text-sm font-semibold text-red-600';
      msg.textContent = salah ? 'PIN salah.' : 'Gagal terhubung. Cek internet.';
      inp.value = '';
      busy = false;
      inp.focus();
    }
  }

  inp.addEventListener('input', () => {
    inp.value = inp.value.replace(/\D/g, '').slice(0, PIN_LEN);
    if (inp.value.length === PIN_LEN) submit();
  });
  inp.focus();
}
