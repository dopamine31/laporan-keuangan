// Popup di dalam aplikasi (pengganti alert/confirm bawaan browser).
// Dipakai dengan await: await alertBox('...'), if (await confirmBox('...')) { ... }

function open({ icon, title, message, buttons, cancelValue }) {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = `
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <div data-k="icon" class="text-center text-4xl"></div>
        <h3 data-k="title" class="mt-2 text-center text-lg font-bold text-gray-800"></h3>
        <p data-k="msg" class="mt-2 whitespace-pre-line text-center text-sm text-gray-600"></p>
        <div data-k="btns" class="mt-5 flex gap-2"></div>
      </div>`;
    // textContent: pesan tidak pernah dibaca sebagai HTML
    root.querySelector('[data-k="icon"]').textContent = icon;
    root.querySelector('[data-k="title"]').textContent = title;
    root.querySelector('[data-k="msg"]').textContent = message;

    const prevFocus = document.activeElement;
    const close = (value) => {
      document.removeEventListener('keydown', onKey, true);
      root.remove();
      prevFocus?.blur?.();
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(cancelValue); }
    };

    let first;
    for (const b of buttons) {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = b.label;
      el.className = `flex-1 rounded-xl py-3 font-bold active:opacity-80 ${b.cls}`;
      el.onclick = () => close(b.value);
      root.querySelector('[data-k="btns"]').appendChild(el);
      if (b.primary) first = el;
    }

    // ketuk di luar kotak = batal
    root.addEventListener('click', (e) => { if (e.target === root) close(cancelValue); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(root);
    first?.focus();
  });
}

export const alertBox = (message, { title = 'Pemberitahuan', icon = 'ℹ️', ok = 'OK' } = {}) =>
  open({
    icon, title, message, cancelValue: undefined,
    buttons: [{ label: ok, value: undefined, primary: true, cls: 'bg-green-600 text-white' }],
  });

export const confirmBox = (message, { title = 'Konfirmasi', icon = '❓', ok = 'Ya', cancel = 'Batal' } = {}) =>
  open({
    icon, title, message, cancelValue: false,
    buttons: [
      { label: cancel, value: false, cls: 'bg-gray-200 text-gray-700' },
      { label: ok, value: true, primary: true, cls: 'bg-green-600 text-white' },
    ],
  });
