/**
 * Machala Combat Feel & Weapon Feedback Pass v1
 * Weapon identity, handling and feedback profiles.
 */

export const WEAPON_PROFILES = {
  pistol: {
    id: 'pistol',
    damage: 26,
    headshotMultiplier: 2.1,
    fireRate: 320,
    magazineSize: 15,
    reloadTime: 1.15,
    spreadHip: 0.022,
    spreadAds: 0.005,
    recoil: { vertical: 0.028, horizontal: 0.011, recovery: 7.5 },
    cameraKick: 0.055,
    adsFov: 58,
    adsTime: 0.14,
    moveSpeedMultiplier: 1.0,
    effectiveRange: 38
  },
  smg: {
    id: 'smg',
    damage: 17,
    headshotMultiplier: 1.75,
    fireRate: 820,
    magazineSize: 32,
    reloadTime: 1.75,
    spreadHip: 0.042,
    spreadAds: 0.018,
    recoil: { vertical: 0.017, horizontal: 0.019, recovery: 6.2 },
    cameraKick: 0.036,
    adsFov: 62,
    adsTime: 0.17,
    moveSpeedMultiplier: 1.05,
    effectiveRange: 24
  },
  rifle: {
    id: 'rifle',
    damage: 31,
    headshotMultiplier: 2.3,
    fireRate: 620,
    magazineSize: 30,
    reloadTime: 2.05,
    spreadHip: 0.036,
    spreadAds: 0.007,
    recoil: { vertical: 0.024, horizontal: 0.014, recovery: 6.8 },
    cameraKick: 0.048,
    adsFov: 52,
    adsTime: 0.21,
    moveSpeedMultiplier: 0.94,
    effectiveRange: 52
  },
  melee: {
    id: 'melee',
    damage: 58,
    headshotMultiplier: 1.0,
    fireRate: 130,
    magazineSize: Infinity,
    reloadTime: 0,
    spreadHip: 0,
    spreadAds: 0,
    recoil: { vertical: 0, horizontal: 0, recovery: 0 },
    cameraKick: 0.09,
    adsFov: 75,
    adsTime: 0.1,
    moveSpeedMultiplier: 1.08,
    effectiveRange: 2.4
  }
};

export function createWeaponFeel(weaponId) {
  const profile = WEAPON_PROFILES[weaponId];
  if (!profile) throw new Error(`Unknown weapon: ${weaponId}`);

  let ammo = profile.magazineSize;
  let lastShotTime = 0;
  let reloading = false;
  let reloadEndTime = 0;

  function canFire(time) {
    if (reloading) return false;
    if (ammo <= 0) return false;
    return time - lastShotTime >= 1000 / profile.fireRate;
  }

  function fire(time) {
    if (!canFire(time)) return null;

    ammo -= 1;
    lastShotTime = time;

    return {
      weaponId: profile.id,
      damage: profile.damage,
      headshotMultiplier: profile.headshotMultiplier,
      effectiveRange: profile.effectiveRange
    };
  }

  function reload(time) {
    if (reloading || ammo === profile.magazineSize) return false;

    reloading = true;
    reloadEndTime = time + profile.reloadTime * 1000;
    return true;
  }

  function update(time) {
    if (reloading && time >= reloadEndTime) {
      ammo = profile.magazineSize;
      reloading = false;
    }
  }

  return {
    profile,
    get ammo() {
      return ammo;
    },
    get isReloading() {
      return reloading;
    },
    canFire,
    fire,
    reload,
    update
  };
}

export const weaponProfileIds = Object.keys(WEAPON_PROFILES);
