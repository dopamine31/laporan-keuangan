import { signIn } from '../services/authService.js';

export function mountLogin(onSuccess) {
  document.getElementById('app').innerHTML = `
    <form id="login" class="mx-auto flex h-dvh max-w-md flex-col justify-center gap-3 bg-white p-6">
      <h1 class="text-2xl font-bold text-green-700">📊 Laporan Harian</h1>
      <input name="email" type="email" required placeholder="Email" autocomplete="email"
        class="rounded-lg border px-3 py-3 text-base">
      <input name="password" type="password" required placeholder="Password" autocomplete="current-password"
        class="rounded-lg border px-3 py-3 text-base">
      <p id="err" class="text-sm text-red-600"></p>
      <button class="rounded-xl bg-green-600 py-3 font-bold text-white">Masuk</button>
    </form>`;

  document.getElementById('login').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await signIn(f.get('email'), f.get('password'));
      onSuccess();
    } catch {
      document.getElementById('err').textContent = 'Email atau password salah.';
    }
  };
}