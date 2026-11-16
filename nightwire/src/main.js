import { Game } from './core/Game.js';

function showBootError(err) {
  const el = document.getElementById('boot-error');
  if (el) {
    el.classList.remove('hidden');
    el.textContent = `BOOT FAILED — ${err?.message || err}`;
  }
  console.error(err);
}

window.addEventListener('error', (e) => {
  if (e.error) showBootError(e.error);
});
window.addEventListener('unhandledrejection', (e) => showBootError(e.reason));

try {
  window.__nightwire = new Game(); // handle for the smoke test / devtools
  document.getElementById('boot-splash')?.classList.add('hidden');
} catch (err) {
  document.getElementById('boot-splash')?.classList.add('hidden');
  showBootError(err);
}
