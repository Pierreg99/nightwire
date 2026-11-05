const KEY = 'nightwire.skins.v1';

export const SLOTS = [
  { id: 'mask', label: 'MASK' },
  { id: 'jacket', label: 'JACKET' },
  { id: 'jacketAccent', label: 'ACCENT' },
  { id: 'undershirt', label: 'LAYER' },
  { id: 'pants', label: 'PANTS' },
  { id: 'shoes', label: 'SHOES' },
  { id: 'weapon', label: 'WEAPON SKIN' },
  { id: 'charm', label: 'CHARM' },
  { id: 'tattoo', label: 'TATTOO' },
];

export function defaultIdentity() {
  return {
    name: 'Riven Hale',
    callsign: 'WIRE',
    mask: '#121418',
    jacket: '#1c242c',
    jacketAccent: '#3ee0ff',
    undershirt: '#14181c',
    pants: '#1a1e24',
    shoes: '#0c0e10',
    weapon: '#2a3238',
    charm: '#3ee0ff',
    tattoo: '#3ee0ff',
    wear: 0.38,
    glow: 0.15,
  };
}

export const PRESETS = {
  dockwire: { ...defaultIdentity(), id: 'dockwire', label: 'DOCK-WIRE' },
  striprun: {
    ...defaultIdentity(),
    id: 'striprun',
    label: 'STRIP-RUN',
    jacket: '#14080e',
    jacketAccent: '#ff2d6a',
    charm: '#ff2d6a',
    tattoo: '#ff2d6a',
    pants: '#121014',
  },
  hofghost: {
    ...defaultIdentity(),
    id: 'hofghost',
    label: 'HOF-GHOST',
    jacket: '#1a221c',
    jacketAccent: '#b6e0c0',
    charm: '#b6e0c0',
    tattoo: '#b6e0c0',
    pants: '#161c18',
  },
  dockwear: {
    ...defaultIdentity(),
    id: 'dockwear',
    label: 'DOCK-WEAR',
    jacket: '#2a2418',
    jacketAccent: '#ffb35a',
    charm: '#ffb35a',
    tattoo: '#ffb35a',
    wear: 0.7,
    unlocked: false,
  },
};

export function loadSkins() {
  const base = {
    identity: defaultIdentity(),
    loadouts: [structuredClone(PRESETS.dockwire), structuredClone(PRESETS.striprun), structuredClone(PRESETS.hofghost)],
    active: 0,
    unlocked: { dockwear: false },
  };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw) return base;
    return { ...base, ...raw, identity: { ...base.identity, ...raw.identity } };
  } catch {
    return base;
  }
}

export function saveSkins(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function exportPreset(identity) {
  return JSON.stringify({ v: 1, kind: 'nightwire-skin', identity }, null, 2);
}
