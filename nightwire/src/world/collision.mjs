/**
 * NIGHTWIRE v2.0.1 — Collision (.mjs)
 * AABB collision, floor resolution, raycasting and triggers.
 */

import * as THREE from 'three';

export class Collision {
  constructor() {
    this.boxes = [];
    this.floors = [];
    this._v = new THREE.Vector3();
  }

  addBox(x, y, z, w, h, d, kind = 'solid') {
    const halfWidth = w / 2;
    const halfDepth = d / 2;

    const box = {
      minx: x - halfWidth,
      maxx: x + halfWidth,
      miny: y,
      maxy: y + h,
      minz: z - halfDepth,
      maxz: z + halfDepth,
      kind
    };

    this.boxes.push(box);
    return box;
  }

  addAABB(minx, miny, minz, maxx, maxy, maxz, kind = 'solid') {
    const box = { minx, miny, minz, maxx, maxy, maxz, kind };
    this.boxes.push(box);
    return box;
  }

  floorY(x, z, y, radius = 0.32) {
    let best = 0;

    for (const box of this.boxes) {
      if (box.kind === 'trigger') continue;

      if (
        x + radius < box.minx ||
        x - radius > box.maxx ||
        z + radius < box.minz ||
        z - radius > box.maxz
      ) {
        continue;
      }

      if (box.maxy <= y + 0.55 && box.maxy > best) {
        best = box.maxy;
      }
    }

    return best;
  }

  resolve(pos, radius, height, step = 0.42) {
    for (let iteration = 0; iteration < 3; iteration += 1) {
      for (const box of this.boxes) {
        if (box.kind === 'trigger') continue;

        const py0 = pos.y + 0.08;
        const py1 = pos.y + height;

        if (py1 < box.miny || py0 > box.maxy) continue;
        if (box.maxy <= pos.y + step && box.maxy >= pos.y - 0.05) continue;

        const minx = box.minx - radius;
        const maxx = box.maxx + radius;
        const minz = box.minz - radius;
        const maxz = box.maxz + radius;

        if (pos.x < minx || pos.x > maxx || pos.z < minz || pos.z > maxz) continue;

        const px = Math.min(pos.x - minx, maxx - pos.x);
        const pz = Math.min(pos.z - minz, maxz - pos.z);

        if (px < pz) {
          pos.x += pos.x - minx < maxx - pos.x ? -px : px;
        } else {
          pos.z += pos.z - minz < maxz - pos.z ? -pz : pz;
        }
      }
    }

    return pos;
  }

  overlaps(x, y, z, radius, height) {
    for (const box of this.boxes) {
      if (box.kind === 'trigger') continue;

      if (y + height < box.miny || y > box.maxy) continue;

      if (
        x + radius < box.minx ||
        x - radius > box.maxx ||
        z + radius < box.minz ||
        z - radius > box.maxz
      ) {
        continue;
      }

      return true;
    }

    return false;
  }

  raycast(origin, direction, max = 120, ignoreKind = null) {
    let hit = null;
    let best = max;

    for (const box of this.boxes) {
      if (box.kind === 'trigger') continue;
      if (ignoreKind && box.kind === ignoreKind) continue;

      const distance = this._aabbRay(origin, direction, box, max);

      if (distance !== null && distance < best && distance > 0.01) {
        best = distance;
        const point = origin.clone().addScaledVector(direction, distance);

        hit = {
          t: distance,
          point,
          box,
          normal: this._normal(point, box)
        };
      }
    }

    return hit;
  }

  _aabbRay(origin, direction, box, max) {
    let tmin = 0;
    let tmax = max;

    const axes = [
      [origin.x, direction.x, box.minx, box.maxx],
      [origin.y, direction.y, box.miny, box.maxy],
      [origin.z, direction.z, box.minz, box.maxz]
    ];

    for (const [originValue, directionValue, minValue, maxValue] of axes) {
      if (Math.abs(directionValue) < 1e-8) {
        if (originValue < minValue || originValue > maxValue) return null;
        continue;
      }

      let t1 = (minValue - originValue) / directionValue;
      let t2 = (maxValue - originValue) / directionValue;

      if (t1 > t2) {
        const temp = t1;
        t1 = t2;
        t2 = temp;
      }

      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);

      if (tmax < tmin) return null;
    }

    return tmin;
  }

  _normal(point, box) {
    const dx = Math.min(Math.abs(point.x - box.minx), Math.abs(point.x - box.maxx));
    const dy = Math.min(Math.abs(point.y - box.miny), Math.abs(point.y - box.maxy));
    const dz = Math.min(Math.abs(point.z - box.minz), Math.abs(point.z - box.maxz));

    const normal = new THREE.Vector3();

    if (dx < dy && dx < dz) {
      normal.set(point.x < (box.minx + box.maxx) * 0.5 ? -1 : 1, 0, 0);
    } else if (dy < dz) {
      normal.set(0, point.y < (box.miny + box.maxy) * 0.5 ? -1 : 1, 0);
    } else {
      normal.set(0, 0, point.z < (box.minz + box.maxz) * 0.5 ? -1 : 1);
    }

    return normal;
  }

  inBox(x, y, z, box) {
    return (
      x >= box.minx && x <= box.maxx &&
      y >= box.miny && y <= box.maxy &&
      z >= box.minz && z <= box.maxz
    );
  }
}
