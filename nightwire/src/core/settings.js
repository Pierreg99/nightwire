/**
 * Machala Settings, Accessibility & Mobile Polish Pass v1
 * Persistent settings and quality override.
 */

const STORAGE_KEY = 'nightwire.settings.v1';

const DEFAULT_SETTINGS = {
  qualityTier: 'auto',
  lookSensitivity: 1.0,
  touchLookSensitivity: 1.0,
  fieldOfView: 75,
  motionReduction: false,
  colorblindMode: 'none',
  hudScale: 1.0,
  touchButtonScale: 1.0,
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.9
};

export function createSettings() {
  let settings = { ...DEFAULT_SETTINGS };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (error) {
      settings = { ...DEFAULT_SETTINGS };
    }

    return settings;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      // Storage may be unavailable in private mode.
    }

    return settings;
  }

  function set(key, value) {
    settings[key] = value;
    save();
    return settings;
  }

  function get(key) {
    return settings[key];
  }

  function reset() {
    settings = { ...DEFAULT_SETTINGS };
    save();
    return settings;
  }

  load();

  return {
    settings,
    load,
    save,
    set,
    get,
    reset
  };
}
