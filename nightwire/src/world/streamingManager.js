/**
 * Machala World Streaming & Zone Loader Pass v1
 * Distance-based zone streaming.
 */

import * as THREE from 'three';
import { createZoneLoader } from './zoneLoader.js';

export function createStreamingManager({ scene, zones = [] }) {
  const loader = createZoneLoader({ scene });
  const loadDistance = 70;
  const unloadDistance = 95;

  function update(playerPosition) {
    zones.forEach((zone) => {
      const zonePosition = new THREE.Vector3(zone.position.x, 0, zone.position.z);
      const distance = playerPosition.distanceTo(zonePosition);

      if (distance <= loadDistance && !loader.isLoaded(zone.id)) {
        loader.loadZone(zone);
      } else if (distance > unloadDistance && loader.isLoaded(zone.id)) {
        loader.unloadZone(zone.id);
      }
    });
  }

  function dispose() {
    loader.dispose();
  }

  return {
    loader,
    update,
    dispose
  };
}
