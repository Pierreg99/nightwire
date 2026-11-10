export const PROFILES = {
  ultra: {
    id: 'ultra',
    label: 'ULTRA',
    dpr: 2,
    shadow: 2048,
    shadowRadius: 34,
    aniso: 16,
    fxaa: false,
    bloom: 0.16,
    bloomRadius: 0.32,
    bloomThreshold: 0.92,
    grain: 0.016,
    vignette: 0.32,
    lights: 24,
    rain: 1400,
    steam: 160,
    exposure: 1.0,
    fog: 0.0042,
    bg: 0.4,
    hemi: 0.7,
    envScale: 1.2,
    clearcoatScale: 1.12,
    bloomScale: 1,
    chroma: 0.0016,
    lensRain: 0.55,
    splitTone: 0.12,
    adaptive: false,
    minScale: 1,
    rainStreak: 0.42,
    envProbe: 1.0,
    probeSize: 128,
    shafts: true,
    ripples: 1,
    wetNormals: 0.35,
    neonFlicker: 1,
    rim: 0.42,
    impactParticles: 28,
    ambience: 1,
    // second pass: humans, AO, DOF, motion blur, map dressing, skyline layers
    charDetail: 1,
    ao: 1,
    dof: true,
    motionBlur: 0.5,
    dressing: 1,
    skyline: 3,
  },
  high: {
    id: 'high',
    label: 'HIGH',
    dpr: 1.5,
    shadow: 2048,
    shadowRadius: 40,
    aniso: 8,
    fxaa: true,
    bloom: 0.18,
    bloomRadius: 0.4,
    bloomThreshold: 0.88,
    grain: 0.028,
    vignette: 0.4,
    lights: 12,
    rain: 900,
    steam: 120,
    exposure: 1.04,
    fog: 0.007,
    bg: 0.46,
    hemi: 0.64,
    envScale: 1.05,
    clearcoatScale: 1,
    bloomScale: 1,
    chroma: 0.0011,
    lensRain: 0.4,
    splitTone: 0.1,
    adaptive: false,
    minScale: 1,
    rainStreak: 0.36,
    envProbe: 2.0,
    probeSize: 96,
    shafts: true,
    ripples: 1,
    wetNormals: 0.3,
    neonFlicker: 1,
    rim: 0.38,
    impactParticles: 20,
    ambience: 1,
    // second pass: humans, AO, DOF, motion blur, map dressing, skyline layers
    charDetail: 1,
    ao: 1,
    dof: true,
    motionBlur: 0.35,
    dressing: 1,
    skyline: 3,
  },
  medium: {
    id: 'medium',
    label: 'MEDIUM',
    dpr: 1.25,
    shadow: 1024,
    shadowRadius: 50,
    aniso: 4,
    fxaa: true,
    bloom: 0.16,
    bloomRadius: 0.5,
    bloomThreshold: 0.78,
    grain: 0.03,
    vignette: 0.42,
    lights: 8,
    rain: 600,
    steam: 80,
    exposure: 1.06,
    fog: 0.009,
    bg: 0.5,
    hemi: 0.62,
    envScale: 1,
    clearcoatScale: 1,
    bloomScale: 0.75,
    chroma: 0,
    lensRain: 0,
    splitTone: 0.08,
    adaptive: true,
    minScale: 0.7,
    rainStreak: 0.3,
    envProbe: 0,
    probeSize: 64,
    shafts: true,
    ripples: 0.6,
    wetNormals: 0.22,
    neonFlicker: 0.8,
    rim: 0.32,
    impactParticles: 12,
    ambience: 1,
    // second pass: humans, AO, DOF, motion blur, map dressing, skyline layers
    charDetail: 1,
    ao: 0,
    dof: false,
    motionBlur: 0,
    dressing: 0.7,
    skyline: 2,
  },
  mobile: {
    id: 'mobile',
    label: 'MOBILE / APK',
    dpr: 1,
    shadow: 512,
    shadowRadius: 28,
    aniso: 2,
    fxaa: false,
    bloom: 0.07,
    bloomRadius: 0.3,
    bloomThreshold: 0.9,
    grain: 0.012,
    vignette: 0.28,
    lights: 6,
    rain: 280,
    steam: 40,
    exposure: 1.06,
    fog: 0.011,
    bg: 0.42,
    hemi: 0.7,
    envScale: 0.85,
    clearcoatScale: 0.8,
    bloomScale: 0.5,
    chroma: 0,
    lensRain: 0,
    splitTone: 0.06,
    adaptive: true,
    minScale: 0.6,
    rainStreak: 0.24,
    envProbe: 0,
    probeSize: 64,
    shafts: false,
    ripples: 0,
    wetNormals: 0,
    neonFlicker: 0.6,
    rim: 0.26,
    impactParticles: 6,
    ambience: 0.7,
    // second pass: humans, AO, DOF, motion blur, map dressing, skyline layers
    charDetail: 0,
    ao: 0,
    dof: false,
    motionBlur: 0,
    dressing: 0.45,
    skyline: 1,
  },
};

export function detectEnv(root = globalThis) {
  const nav = root.navigator;
  const ua = nav?.userAgent || '';
  let coarse = false;
  try {
    coarse = !!root.matchMedia?.('(pointer: coarse)')?.matches;
  } catch { /* node tests */ }
  const search = root.location?.search || '';
  let nativeApp = false;
  try { nativeApp = !!root.Capacitor?.isNativePlatform?.(); } catch { /* not in Capacitor */ }
  const apk = nativeApp || /; wv\)|NightwireAPK|Capacitor/i.test(ua) || /(?:\?|&)apk=1(?:&|$)/.test(search);
  // Electron desktop shell (Windows / Linux package) is always a desktop target, even on touch laptops.
  const desktopShell = !!root.nightwireNative || /Electron\//.test(ua);
  const cores = nav?.hardwareConcurrency || 4;
  const mem = nav?.deviceMemory || 4;
  const mobile = !desktopShell && (coarse || apk || /Android|iPhone|iPad/i.test(ua));
  const strong = cores >= 8 && mem >= 6;
  return { mobile, apk: apk && !desktopShell, desktopShell, strong, cores, mem };
}

/** reducedFx always caps to the mobile profile. Explicit picks beat auto. Desktop auto is ULTRA. */
export function resolveProfile(settings, env) {
  if (settings?.reducedFx) return PROFILES.mobile;
  const choice = settings?.quality || 'auto';
  if (choice !== 'auto' && PROFILES[choice]) return PROFILES[choice];
  if (env?.mobile) return env.strong ? PROFILES.high : PROFILES.mobile;
  return PROFILES.ultra;
}

/**
 * Adaptive render scale for presets with `adaptive: true` (MEDIUM, MOBILE / APK).
 * Feed it frame times; it returns the scale to multiply into the pixel ratio.
 * Drops 0.1 after ~1.5 s above the budget, climbs 0.05 after ~4 s well below it.
 */
export function createAdaptiveScale(profile, targetFps = 30) {
  const state = { scale: 1, avg: 1000 / 60, slow: 0, fast: 0 };
  const budget = 1000 / targetFps;
  return {
    get scale() { return state.scale; },
    reset() { state.scale = 1; state.slow = state.fast = 0; },
    update(dtSeconds) {
      if (!profile?.adaptive) return 1;
      const ms = Math.min(250, Math.max(1, dtSeconds * 1000));
      state.avg += (ms - state.avg) * 0.08;
      if (state.avg > budget * 1.08) { state.slow += dtSeconds; state.fast = 0; }
      else if (state.avg < budget * 0.7) { state.fast += dtSeconds; state.slow = 0; }
      else { state.slow = state.fast = 0; }
      if (state.slow > 1.5 && state.scale > profile.minScale) {
        state.scale = Math.max(profile.minScale, +(state.scale - 0.1).toFixed(2));
        state.slow = 0;
      } else if (state.fast > 4 && state.scale < 1) {
        state.scale = Math.min(1, +(state.scale + 0.05).toFixed(2));
        state.fast = 0;
      }
      return state.scale;
    },
  };
}

/** Landmark lights stay on. The rest fill by distance, up to `max`. Authored intensity is restored, never destroyed. */
export function applyLightBudget(game, max) {
  const lights = game.lights?.points || [];
  const p = game.player?.pos;
  const ranked = lights.map((l) => {
    if (l.userData.baseIntensity == null) l.userData.baseIntensity = l.intensity > 0 ? l.intensity : 1;
    const dx = p ? l.position.x - p.x : 0;
    const dz = p ? l.position.z - p.z : 0;
    const dist = dx * dx + dz * dz;
    return { l, d: l.visible ? dist * 0.62 : dist, keep: !!l.userData.keep };
  });
  ranked.sort((a, b) => (a.keep === b.keep ? a.d - b.d : (a.keep ? -1 : 1)));
  ranked.forEach((row, i) => {
    const on = i < max;
    row.l.visible = on;
    row.l.intensity = on && !row.l.userData.off ? row.l.userData.baseIntensity : 0;
  });
}
