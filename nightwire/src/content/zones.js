/**
 * Machala Content Expansion Pass v1
 * Additional zones for the NIGHTWIRE city slice.
 */

export const ZONES = {
  dockDistrict: {
    id: 'dock-district',
    title: 'Dock District',
    description: 'Containers, cranes and wet concrete.',
    landmarks: ['Crane', 'Warehouse 09'],
    interiors: []
  },
  neonStrip: {
    id: 'neon-strip',
    title: 'Neon Strip',
    description: 'Late-night shops, clubs and traffic.',
    landmarks: ['Club Sign', 'Food Stall'],
    interiors: []
  },
  plattenbau: {
    id: 'plattenbau',
    title: 'Plattenbau Courtyard',
    description: 'Concrete blocks, parking deck and apartment 4B.',
    landmarks: ['Apartment 4B'],
    interiors: ['Apartment 4B']
  },
  transitTunnel: {
    id: 'transit-tunnel',
    title: 'Transit Tunnel',
    description: 'Underground passage with flickering lights.',
    landmarks: ['Tunnel Sign'],
    interiors: []
  },
  industrialYard: {
    id: 'industrial-yard',
    title: 'Industrial Yard',
    description: 'Machinery, fences and storage areas.',
    landmarks: ['Cooling Tower'],
    interiors: []
  }
};

export function getZone(id) {
  return ZONES[id] || null;
}
