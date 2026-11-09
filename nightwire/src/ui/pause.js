import { saveSettings } from '../core/Settings.js';
import { lockPointer, unlockPointer } from '../core/Input.js';

export class PauseMenu {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById('pause');
    this.bind();
  }

  bind() {
    const g = this.game;
    const s = g.settings;
    const map = [
      ['set-sens', 'sens'],
      ['set-ads', 'adsSens'],
      ['set-touchsens', 'lookSensTouch'],
      ['set-sprint', 'autoSprint'],
      ['set-fov', 'fov'],
      ['set-hud', 'hudScale'],
    ];
    map.forEach(([id, key]) => {
      const el = document.getElementById(id);
      el.value = s[key];
      el.addEventListener('input', () => { s[key] = Number(el.value); saveSettings(s); });
    });
    const chk = (id, key, extra) => {
      const el = document.getElementById(id);
      el.checked = !!s[key];
      el.addEventListener('change', () => {
        s[key] = el.checked;
        saveSettings(s);
        extra?.(el.checked);
      });
    };
    const q = document.getElementById('set-quality');
    q.value = s.quality || 'auto';
    q.addEventListener('change', () => {
      s.quality = q.value;
      if (q.value === 'ultra' || q.value === 'high' || q.value === 'auto') s.reducedFx = false;
      document.getElementById('set-fx').checked = !!s.reducedFx;
      saveSettings(s);
      g.applyQuality();
    });
    const pad = document.getElementById('set-padsens');
    pad.value = s.padSens;
    pad.addEventListener('input', () => { s.padSens = Number(pad.value); saveSettings(s); });
    chk('set-fx', 'reducedFx', () => g.applyQuality());
    chk('set-motion', 'motion');
    chk('set-cb', 'colorblind');
    chk('set-touch', 'showTouch', (v) => g.touch.show(v));
    chk('set-gyro', 'gyro');
    document.getElementById('btn-resume').onclick = () => this.close();
    document.getElementById('btn-skim').onclick = () => { this.close(); g.skim.open(); };
  }

  open() {
    this.game.mode = 'pause';
    this.game.input.blocked = true;
    unlockPointer();
    this.el.classList.remove('hidden');
  }

  close() {
    this.el.classList.add('hidden');
    if (this.game.mode === 'pause') {
      this.game.mode = 'play';
      this.game.input.blocked = false;
      this.game.audio?.resume?.();
      lockPointer(this.game.canvas);
    }
  }
}
