import assert from 'node:assert/strict';
import { PROFILES, resolveProfile, applyLightBudget } from './Quality.js';
import { moveFromStick, lookFromStick, stickAxis } from './padmap.js';
import { WEAPONS } from '../weapons/defs.js';
import { pullTrigger } from '../weapons/trigger.js';

const desktop = { mobile: false, strong: true };
const phone = { mobile: true, apk: true, strong: false };
const strongPhone = { mobile: true, apk: true, strong: true };

assert.equal(resolveProfile({ quality: 'auto', reducedFx: false }, desktop).id, 'ultra');
assert.equal(resolveProfile({ quality: 'auto', reducedFx: false }, phone).id, 'mobile');
assert.equal(resolveProfile({ quality: 'auto', reducedFx: false }, strongPhone).id, 'high');
assert.equal(resolveProfile({ quality: 'ultra', reducedFx: false }, phone).id, 'ultra');
assert.equal(resolveProfile({ quality: 'ultra', reducedFx: true }, desktop).id, 'mobile');
assert.equal(PROFILES.ultra.shadow, 2048);
assert.equal(PROFILES.ultra.dpr, 2);
assert.equal(PROFILES.ultra.fog, 0.0042);
assert.equal(PROFILES.high.fog, 0.007);
assert.equal(PROFILES.ultra.bloomThreshold, 0.92);
assert.equal(PROFILES.mobile.fog, 0.011);
assert.ok(PROFILES.ultra.lights > PROFILES.mobile.lights);

const up = moveFromStick(0, -1);
assert.ok(up.z < -0.9, `stick up must be forward (negative z), got ${up.z}`);
const back = moveFromStick(0, 1);
assert.ok(back.z > 0.9, 'stick down must be backward (positive z)');
const right = moveFromStick(1, 0);
assert.ok(right.x > 0.9, 'stick right must strafe right');
const left = moveFromStick(-1, 0);
assert.ok(left.x < -0.9, 'stick left must strafe left');
assert.equal(stickAxis(0.1), 0, 'deadzone');

const lookRight = lookFromStick(1, 0, 1, 1);
assert.ok(lookRight.x > 0, 'stick right must be positive look.x (same sign as mouse-right)');
const lookDown = lookFromStick(0, 1, 1, 1);
assert.ok(lookDown.y > 0, 'stick down must be positive look.y (same sign as mouse-down)');

assert.equal(pullTrigger('auto', true, true), true);
assert.equal(pullTrigger('semi', true, true), false);
assert.equal(pullTrigger('semi', true, false), true);
assert.equal(pullTrigger('semi', false, true), false);

const ids = WEAPONS.map((w) => w.id);
assert.deepEqual(ids, ['vpr9', 'rh47', 'kestrel', 'haul12', 'nord6']);
const shot = WEAPONS.find((w) => w.id === 'haul12');
const dmr = WEAPONS.find((w) => w.id === 'nord6');
const smg = WEAPONS.find((w) => w.id === 'vpr9');
assert.equal(shot.mode, 'semi');
assert.ok(shot.pellets >= 8);
assert.equal(dmr.mode, 'semi');
assert.ok(dmr.range > smg.range);
assert.ok(dmr.spreadAds < smg.spreadAds);
assert.equal(smg.mode, 'auto');
assert.equal(WEAPONS.find((w) => w.id === 'kestrel').mode, 'semi');

const lights = [3.2, 1, 6, 0.4].map((intensity, i) => ({
  intensity,
  visible: true,
  position: { x: i * 10, y: 4, z: 0 },
  userData: { keep: i === 2 },
}));
const game = { player: { pos: { x: 0, y: 0, z: 0 } }, lights: { points: lights } };
applyLightBudget(game, 2);
assert.equal(lights[2].intensity, 6, 'landmark intensity restored');
assert.equal(lights[2].visible, true);
const on = lights.filter((l) => l.visible);
assert.equal(on.length, 2);
applyLightBudget(game, 24);
assert.equal(lights.filter((l) => l.visible).length, 4);
assert.equal(lights[1].intensity, 1, 'a zeroed fill light comes back at its authored intensity');

console.log('quality + pad + trigger self-test ok');
