/**
 * Machala Mission Streaming & Spawn Pass v1
 * Mission zones with enemy spawns.
 */

export const MISSION_ZONES = [
  {
    id: 'warehouse-09',
    title: 'Warehouse 09',
    position: { x: 0, z: -30 },
    enemySpawns: [
      { x: 4, y: 0, z: -28 },
      { x: -4, y: 0, z: -32 }
    ]
  },
  {
    id: 'dock-road',
    title: 'Dock Road',
    position: { x: 0, z: 0 },
    enemySpawns: []
  },
  {
    id: 'apartment-4b',
    title: 'Apartment 4B',
    position: { x: 0, z: 22 },
    enemySpawns: []
  },
  {
    id: 'dock-boat',
    title: 'Dock Boat',
    position: { x: 20, z: -40 },
    enemySpawns: []
  }
];
