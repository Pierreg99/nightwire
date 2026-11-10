/**
 * NIGHTWIRE — hyperreal asset pass (.mjs)
 * Runs after the procedural world is up (the game is playable immediately): loads the HDRI, PBR
 * surfaces, props, MakeHuman/UAL characters, the android and the drones in parallel, then swaps
 * them in. Anything that fails keeps its procedural fallback. ULTRA / HIGH load the full
 * characters (2K textures, physical skin), MEDIUM / MOBILE the decimated 1K LOD set.
 * The chosen character set is fixed for the session (a preset change applies after a restart).
 */

import { assetsDisabled } from './AssetLibrary.mjs';
import { ALL_HUMANS, loadHumanTemplates, bakeHandGeometry } from '../characters/AssetHuman.mjs';
import { upgradeMap } from '../world/realMap.mjs';

export async function loadHyperreal(game) {
  const t0 = performance.now();
  if (assetsDisabled()) {
    game.hyperreal = { disabled: true };
    return game.hyperreal;
  }
  const lib = game.assets;
  const profile = game.qualityProfile;
  const lod = profile.assets === 'lod';
  const mapP = upgradeMap(game, lib, profile).catch((err) => {
    console.warn('[assets] map upgrade failed', err);
    return { surfaces: 0, props: 0, hdri: false };
  });
  const env = await lib.hdri('neuer_zollhof', profile.hdri === '2k' ? '2k' : '1k');
  const [templates, droneGltf] = await Promise.all([
    loadHumanTemplates(lib, ALL_HUMANS, { lod, env }),
    lib.gltf('/assets/models/drone.glb'),
  ]);
  const res = { characters: templates.size, npcs: 0, hands: false, drones: 0 };
  try {
    res.npcs = game.npcs.upgrade(templates);
  } catch (err) {
    console.warn('[assets] NPC upgrade failed, procedural NPCs stay', err);
  }
  const player = templates.get('player');
  const arms = game.weapons?.vm?.userData?.arms;
  if (player && arms) {
    try {
      const r = bakeHandGeometry(player, 'r');
      const l = bakeHandGeometry(player, 'l');
      res.hands = arms.useRealHands({ r, l });
    } catch (err) {
      console.warn('[assets] FP hands failed, procedural hands stay', err);
    }
  }
  try {
    res.drones = game.drones.build(droneGltf, profile, lib);
  } catch (err) {
    console.warn('[assets] drones failed', err);
  }
  Object.assign(res, await mapP);
  res.lod = lod;
  res.ms = Math.round(performance.now() - t0);
  res.lib = lib.stats();
  game.hyperreal = res;
  return res;
}
