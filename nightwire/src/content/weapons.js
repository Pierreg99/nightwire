/**
 * Machala Content Expansion Pass v1
 * Additional weapon profiles.
 */

export const WEAPONS = {
  shotgun: {
    id: 'shotgun',
    damage: 72,
    headshotMultiplier: 1.4,
    fireRate: 90,
    magazineSize: 6,
    reloadTime: 2.6,
    spreadHip: 0.12,
    spreadAds: 0.07,
    recoil: { vertical: 0.06, horizontal: 0.03, recovery: 4.5 },
    cameraKick: 0.11,
    adsFov: 68,
    adsTime: 0.24,
    moveSpeedMultiplier: 0.92,
    effectiveRange: 9
  },
  dmr: {
    id: 'dmr',
    damage: 48,
    headshotMultiplier: 2.6,
    fireRate: 180,
    magazineSize: 12,
    reloadTime: 2.4,
    spreadHip: 0.03,
    spreadAds: 0.002,
    recoil: { vertical: 0.035, horizontal: 0.008, recovery: 5.5 },
    cameraKick: 0.06,
    adsFov: 42,
    adsTime: 0.26,
    moveSpeedMultiplier: 0.9,
    effectiveRange: 80
  }
};

export function getWeapon(id) {
  return WEAPONS[id] || null;
}
