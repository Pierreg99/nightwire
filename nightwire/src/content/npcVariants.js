/**
 * Machala Content Expansion Pass v1
 * NPC variants for street life and combat.
 */

export const NPC_VARIANTS = {
  civilian: {
    id: 'civilian',
    role: 'pedestrian',
    color: 0x2b3a48,
    behavior: 'idle-walk'
  },
  crew: {
    id: 'crew',
    role: 'combatant',
    color: 0x4a2a2a,
    behavior: 'patrol-combat'
  },
  security: {
    id: 'security',
    role: 'combatant',
    color: 0x1d2a33,
    behavior: 'patrol-combat'
  },
  street: {
    id: 'street',
    role: 'pedestrian',
    color: 0x3a2f2a,
    behavior: 'idle-walk'
  }
};

export function getNpcVariant(id) {
  return NPC_VARIANTS[id] || null;
}
