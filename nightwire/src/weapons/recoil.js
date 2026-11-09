/**
 * Machala Combat Feel & Weapon Feedback Pass v1
 * Recoil pattern, camera kick, ADS transition and weapon sway.
 */

import * as THREE from 'three';

export function createRecoilSystem({ camera, weaponFeel }) {
  const recoilOffset = new THREE.Vector2();
  const targetRecoil = new THREE.Vector2();
  const swayOffset = new THREE.Vector2();

  let adsAmount = 0;
  let adsTarget = 0;
  let lastKickTime = 0;

  function setAds(active) {
    adsTarget = active ? 1 : 0;
  }

  function applyShot(time) {
    const profile = weaponFeel.profile;
    const heat = Math.min(1, (time - lastKickTime) / 220);

    targetRecoil.y += profile.recoil.vertical * (0.75 + heat * 0.55);
    targetRecoil.x += (Math.random() - 0.5) * profile.recoil.horizontal * 2;

    lastKickTime = time;
  }

  function update(deltaTime, movement = { x: 0, y: 0 }, sprinting = false) {
    const profile = weaponFeel.profile;

    adsAmount += (adsTarget - adsAmount) * Math.min(1, deltaTime / profile.adsTime);

    targetRecoil.multiplyScalar(Math.max(0, 1 - profile.recoil.recovery * deltaTime));
    recoilOffset.lerp(targetRecoil, Math.min(1, deltaTime * 14));

    const swayScale = (sprinting ? 1.8 : 1) * (1 - adsAmount * 0.65);
    swayOffset.x += (movement.x * 0.016 - swayOffset.x) * Math.min(1, deltaTime * 6);
    swayOffset.y += (movement.y * 0.012 - swayOffset.y) * Math.min(1, deltaTime * 6);

    camera.rotation.x += recoilOffset.y * 0.35;
    camera.rotation.y += recoilOffset.x * 0.35;

    camera.position.x += swayOffset.x * swayScale * 0.035;
    camera.position.y += swayOffset.y * swayScale * 0.025;

    return {
      adsAmount,
      recoil: recoilOffset.clone(),
      cameraKick: profile.cameraKick * (1 - adsAmount * 0.35)
    };
  }

  function reset() {
    recoilOffset.set(0, 0);
    targetRecoil.set(0, 0);
    swayOffset.set(0, 0);
    adsAmount = 0;
    adsTarget = 0;
  }

  return {
    setAds,
    applyShot,
    update,
    reset,
    get adsAmount() {
      return adsAmount;
    }
  };
}
