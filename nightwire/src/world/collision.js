import * as THREE from 'three';

export class Collision {
  constructor() {
    this.boxes = [];
    this.floors = [];
    this._v = new THREE.Vector3();
  }

  addBox(x, y, z, w, h, d, kind = 'solid') {
    const hw = w / 2, hd = d / 2;
    const b = {
      minx: x - hw, maxx: x + hw,
      miny: y, maxy: y + h,
      minz: z - hd, maxz: z + hd,
      kind,
    };
    this.boxes.push(b);
    return b;
  }

  addAABB(minx, miny, minz, maxx, maxy, maxz, kind = 'solid') {
    const b = { minx, miny, minz, maxx, maxy, maxz, kind };
    this.boxes.push(b);
    return b;
  }

  floorY(x, z, y, radius = 0.32) {
    let best = 0;
    for (const b of this.boxes) {
      if (b.kind === 'trigger') continue;
      if (x + radius < b.minx || x - radius > b.maxx || z + radius < b.minz || z - radius > b.maxz) continue;
      if (b.maxy <= y + 0.55 && b.maxy > best) best = b.maxy;
    }
    return best;
  }

  resolve(pos, radius, height, step = 0.42) {
    const p = pos;
    for (let i = 0; i < 3; i++) {
      for (const b of this.boxes) {
        if (b.kind === 'trigger') continue;
        const py0 = p.y + 0.08;
        const py1 = p.y + height;
        if (py1 < b.miny || py0 > b.maxy) continue;
        if (b.maxy <= p.y + step && b.maxy >= p.y - 0.05) continue;
        const minx = b.minx - radius, maxx = b.maxx + radius;
        const minz = b.minz - radius, maxz = b.maxz + radius;
        if (p.x < minx || p.x > maxx || p.z < minz || p.z > maxz) continue;
        const px = Math.min(p.x - minx, maxx - p.x);
        const pz = Math.min(p.z - minz, maxz - p.z);
        if (px < pz) p.x += p.x - minx < maxx - p.x ? -px : px;
        else p.z += p.z - minz < maxz - p.z ? -pz : pz;
      }
    }
    return p;
  }

  overlaps(x, y, z, r, h) {
    for (const b of this.boxes) {
      if (b.kind === 'trigger') continue;
      if (y + h < b.miny || y > b.maxy) continue;
      if (x + r < b.minx || x - r > b.maxx || z + r < b.minz || z - r > b.maxz) continue;
      return true;
    }
    return false;
  }

  raycast(origin, dir, max = 120, ignoreKind = null) {
    let hit = null;
    let best = max;
    const o = origin;
    const d = dir;
    for (const b of this.boxes) {
      if (b.kind === 'trigger') continue;
      if (ignoreKind && b.kind === ignoreKind) continue;
      const t = this._aabbRay(o, d, b, max);
      if (t !== null && t < best && t > 0.01) {
        best = t;
        const p = o.clone().addScaledVector(d, t);
        hit = { t, point: p, box: b, normal: this._normal(p, b) };
      }
    }
    return hit;
  }

  _aabbRay(o, d, b, max) {
    let tmin = 0, tmax = max;
    const axes = [
      [o.x, d.x, b.minx, b.maxx],
      [o.y, d.y, b.miny, b.maxy],
      [o.z, d.z, b.minz, b.maxz],
    ];
    for (const [oo, dd, mn, mx] of axes) {
      if (Math.abs(dd) < 1e-8) {
        if (oo < mn || oo > mx) return null;
        continue;
      }
      let t1 = (mn - oo) / dd;
      let t2 = (mx - oo) / dd;
      if (t1 > t2) { const k = t1; t1 = t2; t2 = k; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmax < tmin) return null;
    }
    return tmin;
  }

  _normal(p, b) {
    const dx = Math.min(Math.abs(p.x - b.minx), Math.abs(p.x - b.maxx));
    const dy = Math.min(Math.abs(p.y - b.miny), Math.abs(p.y - b.maxy));
    const dz = Math.min(Math.abs(p.z - b.minz), Math.abs(p.z - b.maxz));
    const n = new THREE.Vector3();
    if (dx < dy && dx < dz) n.set(p.x < (b.minx + b.maxx) * 0.5 ? -1 : 1, 0, 0);
    else if (dy < dz) n.set(0, p.y < (b.miny + b.maxy) * 0.5 ? -1 : 1, 0);
    else n.set(0, 0, p.z < (b.minz + b.maxz) * 0.5 ? -1 : 1);
    return n;
  }

  inBox(x, y, z, b) {
    return x >= b.minx && x <= b.maxx && y >= b.miny && y <= b.maxy && z >= b.minz && z <= b.maxz;
  }
}
