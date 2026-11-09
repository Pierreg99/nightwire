/**
 * NIGHTWIRE v2.0.1 — World (.mjs)
 * Zone groups, collision, interactives, triggers and landmarks.
 */

import * as THREE from 'three';
import { Collision } from './collision.mjs';
import { zoneOf } from './layout.mjs';

export class World {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group();
    this.group.name = 'world';
    game.scene.add(this.group);

    this.zones = {
      docks: namedGroup('docks'),
      strip: namedGroup('strip'),
      hof: namedGroup('hof')
    };

    Object.values(this.zones).forEach((zone) => this.group.add(zone));

    this.collision = new Collision();
    this.interactives = [];
    this.triggers = [];
    this.landmarks = [];
    this.spawns = {
      npc: [],
      vehicle: [],
      player: null,
      extract: {}
    };
    this.props = [];
    this.path = [];
    this.cover = [];
  }

  add(mesh, zone = 'docks') {
    (this.zones[zone] || this.group).add(mesh);
    return mesh;
  }

  solid(mesh, x, y, z, w, h, d, zone = 'docks', kind = 'solid') {
    mesh.position.set(x, y + (mesh.position.y || 0), z);
    this.add(mesh, zone);
    this.collision.addBox(x, y, z, w, h, d, kind);
    return mesh;
  }

  interact(def) {
    this.interactives.push(def);
    return def;
  }

  trigger(def) {
    this.triggers.push(def);
    return def;
  }

  landmark(name, position, zone) {
    this.landmarks.push({ name, position, zone });
  }

  nearestInteract(pos, max = 2.2) {
    let best = null;
    let bestDistance = max;

    for (const interactive of this.interactives) {
      if (interactive.disabled) continue;

      const distance = pos.distanceTo(interactive.position);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = interactive;
      }
    }

    return best;
  }

  zoneAt(z) {
    return zoneOf(z);
  }

  recordPath(pos) {
    const last = this.path[this.path.length - 1];

    if (!last || last.distanceToSquared(pos) > 0.35) {
      this.path.push(pos.clone());

      if (this.path.length > 800) {
        this.path.shift();
      }
    }
  }
}

function namedGroup(name) {
  const group = new THREE.Group();
  group.name = name;
  return group;
}
