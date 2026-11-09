/**
 * NIGHTWIRE v2.0.1 — Cold Cargo Campaign (.mjs)
 * Cold open, intercept, heat and extraction.
 */

import { createObjectiveSystem } from './objectives.js';
import { createMissionManager } from './missionManager.js';

export function createColdCargoCampaign() {
  const objectives = createObjectiveSystem();

  objectives.addObjective({
    id: 'reach-warehouse',
    title: 'Reach Warehouse 09',
    description: 'Follow the dock road to Warehouse 09.',
    target: 1
  });

  objectives.addObjective({
    id: 'secure-cargo',
    title: 'Secure the Cargo',
    description: 'Clear Warehouse 09 and secure the VIP package.',
    target: 1
  });

  objectives.addObjective({
    id: 'escape-heat',
    title: 'Escape the Heat',
    description: 'Break contact and reach an extraction point.',
    target: 1
  });

  objectives.addObjective({
    id: 'extract-apartment',
    title: 'Extract: Apartment 4B',
    description: 'Reach Apartment 4B and end the job.',
    optional: true,
    target: 1
  });

  objectives.addObjective({
    id: 'extract-dock-boat',
    title: 'Extract: Dock Boat',
    description: 'Reach the dock boat and leave the district.',
    optional: true,
    target: 1
  });

  const beats = [
    {
      id: 'cold-open',
      title: 'Cold Open',
      isComplete: () => objectives.isComplete('reach-warehouse')
    },
    {
      id: 'intercept',
      title: 'Intercept',
      isComplete: () => objectives.isComplete('secure-cargo')
    },
    {
      id: 'heat',
      title: 'Heat',
      isComplete: () => objectives.isComplete('escape-heat')
    },
    {
      id: 'extract',
      title: 'Extract',
      isComplete: () =>
        objectives.isComplete('extract-apartment') ||
        objectives.isComplete('extract-dock-boat')
    }
  ];

  const mission = createMissionManager({ beats });

  function start() {
    mission.start();
    objectives.activate('reach-warehouse');
  }

  function reachWarehouse() {
    objectives.complete('reach-warehouse');
    objectives.activate('secure-cargo');
    mission.update();
  }

  function secureCargo() {
    objectives.complete('secure-cargo');
    objectives.activate('escape-heat');
    mission.update();
  }

  function escapeHeat() {
    objectives.complete('escape-heat');
    objectives.activate('extract-apartment');
    objectives.activate('extract-dock-boat');
    mission.update();
  }

  function extractApartment() {
    objectives.complete('extract-apartment');
    mission.update();
  }

  function extractDockBoat() {
    objectives.complete('extract-dock-boat');
    mission.update();
  }

  return {
    objectives,
    mission,
    start,
    reachWarehouse,
    secureCargo,
    escapeHeat,
    extractApartment,
    extractDockBoat
  };
}
