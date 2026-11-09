/**
 * Machala Content Expansion Pass v1
 * Additional missions for NIGHTWIRE.
 */

export const MISSIONS = {
  coldCargo: {
    id: 'cold-cargo',
    title: 'Cold Cargo',
    description: 'Intercept a shipment at Warehouse 09.',
    beats: ['cold-open', 'intercept', 'heat', 'extract']
  },
  docksideDebt: {
    id: 'dockside-debt',
    title: 'Dockside Debt',
    description: 'Collect a debt from a dockside crew.',
    beats: ['contact', 'confront', 'escape']
  },
  neonRun: {
    id: 'neon-run',
    title: 'Neon Run',
    description: 'Deliver a package through the neon strip.',
    beats: ['pickup', 'delivery', 'escape']
  },
  towerWatch: {
    id: 'tower-watch',
    title: 'Tower Watch',
    description: 'Infiltrate a high-rise and retrieve data.',
    beats: ['infiltrate', 'retrieve', 'extract']
  }
};

export function getMission(id) {
  return MISSIONS[id] || null;
}
