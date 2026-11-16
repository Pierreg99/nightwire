const KEY = 'nightwire.settings.v1';

export const defaults = () => ({
  sens: 1.35,
  adsSens: 0.85,
  lookSensTouch: 1.55,
  fov: 75,
  hudScale: 1,
  reducedFx: false,
  motion: true,
  colorblind: false,
  colorMode: 'none',
  touchButtonScale: 1,
  dof: true,
  motionBlur: true,
  showTouch: false,
  gyro: false,
  autoSprint: 0.78,
  volume: 0.85,
  radioVol: 0.45,
  quality: 'auto',
  padSens: 2.2,
  haptics: true,
});

export function loadSettings() {
  const d = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...d, ...raw };
  } catch {
    return d;
  }
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ }
}
