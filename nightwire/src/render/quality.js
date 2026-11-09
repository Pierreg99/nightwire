/**
 * Machala Render Foundation v1 — Quality system.
 * Provides deterministic quality tiers and adaptive runtime overrides.
 */

export const QUALITY_TIERS = {
  low: {
    id: 'low',
    renderScale: 0.65,
    maxPixelRatio: 1.0,
    shadowMapSize: 0,
    shadowDistance: 24,
    maxDynamicLights: 1,
    bloom: false,
    bloomStrength: 0,
    ssao: false,
    volumetricFog: false,
    fogDensity: 0.028,
    maxParticles: 120,
    maxDrawDistance: 90,
    targetFrameMs: 33.3,
    targetFps: 30
  },
  medium: {
    id: 'medium',
    renderScale: 0.8,
    maxPixelRatio: 1.35,
    shadowMapSize: 1024,
    shadowDistance: 38,
    maxDynamicLights: 2,
    bloom: true,
    bloomStrength: 0.45,
    ssao: false,
    volumetricFog: false,
    fogDensity: 0.022,
    maxParticles: 260,
    maxDrawDistance: 130,
    targetFrameMs: 33.3,
    targetFps: 30
  },
  high: {
    id: 'high',
    renderScale: 1.0,
    maxPixelRatio: 2.0,
    shadowMapSize: 2048,
    shadowDistance: 65,
    maxDynamicLights: 4,
    bloom: true,
    bloomStrength: 0.65,
    ssao: true,
    volumetricFog: true,
    fogDensity: 0.018,
    maxParticles: 650,
    maxDrawDistance: 190,
    targetFrameMs: 16.7,
    targetFps: 60
  }
};

function detectInitialTier() {
  if (typeof navigator === 'undefined') return 'medium';

  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  if (mobile && (memory <= 4 || cores <= 6)) return 'low';
  if (mobile) return 'medium';
  return 'high';
}

export function createQualitySystem({ initialTier } = {}) {
  const selected = initialTier || detectInitialTier();
  let currentTier = selected;
  let manualOverride = false;
  let dynamicScale = QUALITY_TIERS[selected].renderScale;

  const listeners = new Set();

  function get() {
    return {
      ...QUALITY_TIERS[currentTier],
      effectiveRenderScale: dynamicScale
    };
  }

  function setTier(tier, { manual = false } = {}) {
    if (!QUALITY_TIERS[tier]) return;
    currentTier = tier;
    if (manual) manualOverride = true;
    dynamicScale = QUALITY_TIERS[tier].renderScale;
    emit();
  }

  function setDynamicScale(scale) {
    const tier = QUALITY_TIERS[currentTier];
    dynamicScale = Math.min(
      tier.renderScale,
      Math.max(0.5, Math.min(1, scale))
    );
    emit();
  }

  function applyPerformanceSample({ averageFrameMs }) {
    if (manualOverride) return;

    const tier = QUALITY_TIERS[currentTier];

    if (averageFrameMs > tier.targetFrameMs * 1.25) {
      setDynamicScale(Math.max(0.55, dynamicScale - 0.08));
    } else if (averageFrameMs < tier.targetFrameMs * 0.82) {
      setDynamicScale(Math.min(tier.renderScale, dynamicScale + 0.03));
    }
  }

  function emit() {
    const state = get();
    listeners.forEach((listener) => listener(state));
  }

  function onChange(listener) {
    listeners.add(listener);
    listener(get());
    return () => listeners.delete(listener);
  }

  return {
    get,
    setTier,
    setDynamicScale,
    applyPerformanceSample,
    onChange,
    isManualOverride: () => manualOverride
  };
}
