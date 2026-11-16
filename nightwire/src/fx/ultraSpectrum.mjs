/**
 * NIGHTWIRE — Ultra Spectrum quality hooks
 * Central place for tier-aware FX scaling. Call from the graphics preset path.
 * MOBILE / reducedFx: no regression on battery-critical paths.
 */
import { applyWetProfile } from './wetAsphalt.mjs';
import { WET } from './atmosphere.mjs';

export function applyUltraSpectrumProfile(profile, reducedFx) {
  // Wet response
  applyWetProfile(profile, reducedFx);

  // Rain amount drives shader wetness intensity
  WET.uRainAmount.value = reducedFx ? 0.45 : (profile?.rainAmount ?? 1.0);

  // Neon flicker amplitude already handled in NeonFX.update
  // Light shafts / fog density expected to be scaled by the existing RenderPipeline / PostFX
}

/** Zone light color hints for shafts / fog tint (used by LightShafts if extended). */
export const ZONE_LIGHT_TINT = {
  docks: 0x38e8ff,      // crane cyan
  strip: 0xff4d6d,      // neon magenta
  hof: 0xffb347,        // sodium / fluorescent amber
};
