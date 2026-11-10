import * as THREE from 'three';
import { boxMesh } from '../world/props.mjs';
import { LOOK } from '../fx/look.mjs';

function presentHeld(root) {
  root.frustumCulled = false;
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.receiveShadow = false;
    o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) if (m) m.fog = false;
  });
  return root;
}

export function makeViewmodel(skin, weaponDef) {
  const root = new THREE.Group();
  const arms = new THREE.Group();
  arms.name = 'arms';
  const jacket = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.jacket), roughness: 0.62, metalness: 0.08,
  });
  const glove = new THREE.MeshStandardMaterial({ color: 0x121416, roughness: 0.5, metalness: 0.12 });

  const lArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.38, 3, 6), jacket);
  lArm.rotation.x = 1.2;
  lArm.position.set(-0.22, -0.18, -0.28);
  lArm.castShadow = true;
  const lHand = boxMesh(0.075, 0.07, 0.1, glove);
  lHand.position.set(-0.22, -0.28, -0.52);
  const tattoo = boxMesh(0.09, 0.015, 0.12, new THREE.MeshStandardMaterial({
    color: skin.tattoo, emissive: skin.tattoo, emissiveIntensity: 0.4 + skin.glow,
  }));
  tattoo.position.set(-0.22, -0.2, -0.36);
  tattoo.name = 'tattoo';
  const watch = boxMesh(0.1, 0.04, 0.06, new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.8, roughness: 0.3 }));
  watch.position.set(-0.22, -0.24, -0.44);

  const rArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.42, 3, 6), jacket);
  rArm.rotation.x = 1.05;
  rArm.position.set(0.18, -0.2, -0.32);
  rArm.castShadow = true;
  const rHand = boxMesh(0.075, 0.07, 0.1, glove);
  rHand.position.set(0.16, -0.26, -0.55);

  arms.add(lArm, lHand, tattoo, watch, rArm, rHand);
  const accent = boxMesh(0.13, 0.04, 0.18, new THREE.MeshStandardMaterial({
    color: skin.jacketAccent, emissive: skin.jacketAccent, emissiveIntensity: 0.25,
  }));
  accent.position.set(-0.22, -0.14, -0.22);
  accent.name = 'accent';
  arms.add(accent);
  root.add(arms);

  const gun = makeGun(weaponDef, skin);
  gun.name = 'gun';
  gun.position.set(0.12, -0.22, -0.48);
  root.add(gun);

  const knife = new THREE.Group();
  knife.name = 'knife';
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.012, 0.26),
    new THREE.MeshStandardMaterial({ color: 0xc8d0d8, metalness: 0.9, roughness: 0.12 }),
  );
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.03, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.6 }),
  );
  handle.position.z = 0.14;
  knife.add(blade, handle);
  knife.position.set(0.16, -0.18, -0.4);
  knife.visible = false;
  root.add(knife);

  return presentHeld(root);
}

export function makeGun(def, skin) {
  const g = new THREE.Group();
  const col = new THREE.Color(skin.weapon || '#2a3238');
  const body = new THREE.MeshStandardMaterial({ color: col, metalness: 0.72, roughness: 0.28 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0c0e10, metalness: 0.55, roughness: 0.36 });
  const poly = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.7, metalness: 0.06 });
  const pistol = def.type === 'pistol';
  const shotgun = def.type === 'shotgun';
  const dmr = def.type === 'dmr';
  const smg = def.type === 'smg';
  const rifle = def.type === 'rifle';
  const trace = LOOK.tracer[def.type] || LOOK.tracer.rifle;
  const edge = new THREE.MeshStandardMaterial({ color: trace, emissive: trace, emissiveIntensity: 1.15, roughness: 0.32 });
  const recLen = pistol ? 0.18 : shotgun ? 0.32 : dmr ? 0.5 : smg ? 0.26 : 0.42;
  const recW = shotgun ? 0.1 : pistol ? 0.05 : smg ? 0.055 : 0.072;
  const barrelLen = pistol ? 0.12 : shotgun ? 0.22 : dmr ? 0.48 : smg ? 0.16 : 0.32;
  const barrelR = shotgun ? 0.022 : pistol ? 0.011 : dmr ? 0.012 : 0.014;

  const rec = boxMesh(recW, pistol ? 0.085 : shotgun ? 0.1 : 0.09, recLen, body);
  rec.position.y = 0;
  g.add(rec);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(barrelR, barrelR, barrelLen, 8),
    dark,
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, pistol ? -0.14 : shotgun ? -0.26 : dmr ? -0.48 : smg ? -0.2 : -0.36);
  g.add(barrel);

  const mag = boxMesh(shotgun ? 0.07 : 0.045, pistol ? 0.11 : shotgun ? 0.06 : 0.15, shotgun ? 0.16 : 0.075, dark);
  mag.position.set(0, pistol ? -0.09 : shotgun ? -0.02 : -0.11, pistol ? 0.04 : shotgun ? 0.02 : 0.02);
  mag.name = 'mag';
  g.add(mag);

  const grip = boxMesh(0.038, 0.12, 0.05, poly);
  grip.position.set(0, -0.08, pistol ? 0.06 : 0.1);
  grip.rotation.x = 0.18;
  g.add(grip);

  if (rifle || shotgun || dmr) {
    const stock = boxMesh(0.045, 0.065, shotgun ? 0.12 : dmr ? 0.22 : 0.18, body);
    stock.position.set(0, 0.0, shotgun ? 0.2 : dmr ? 0.34 : 0.28);
    g.add(stock);
    const guard = boxMesh(0.068, 0.05, shotgun ? 0.12 : 0.16, dark);
    guard.position.set(0, -0.02, shotgun ? -0.1 : -0.16);
    g.add(guard);
    if (rifle || dmr) {
      const rail = boxMesh(0.02, 0.012, dmr ? 0.32 : 0.24, dark);
      rail.position.set(0, 0.055, dmr ? -0.14 : -0.08);
      g.add(rail);
    }
    if (dmr) {
      const scope = boxMesh(0.028, 0.034, 0.18, dark);
      scope.position.set(0, 0.09, -0.08);
      g.add(scope);
      const brake = boxMesh(0.034, 0.034, 0.06, dark);
      brake.position.set(0, 0.02, -0.74);
      g.add(brake);
    }
    if (shotgun) {
      const pump = boxMesh(0.06, 0.045, 0.14, poly);
      pump.position.set(0, -0.015, -0.16);
      pump.name = 'pump';
      g.add(pump);
    }
    if (rifle) {
      const fore = boxMesh(0.02, 0.055, 0.028, poly);
      fore.position.set(0, -0.055, -0.2);
      fore.rotation.x = -0.45;
      g.add(fore);
    }
  } else if (smg) {
    const stub = boxMesh(0.04, 0.045, 0.07, body);
    stub.position.set(0, 0.0, 0.14);
    g.add(stub);
    const fore = boxMesh(0.018, 0.07, 0.02, poly);
    fore.position.set(0, -0.07, -0.1);
    g.add(fore);
  } else {
    const slide = boxMesh(0.052, 0.035, 0.18, dark);
    slide.position.set(0, 0.04, -0.02);
    g.add(slide);
  }

  const sight = boxMesh(0.01, 0.036, 0.01, edge);
  sight.position.set(0, 0.072, pistol ? -0.04 : smg ? -0.06 : -0.08);
  sight.name = 'sight';
  g.add(sight);
  const stripe = boxMesh(0.008, 0.008, recLen * 0.72, edge);
  stripe.position.set(recW * 0.55, 0.02, 0);
  g.add(stripe);

  const muzzle = boxMesh(shotgun ? 0.028 : 0.02, shotgun ? 0.028 : 0.02, 0.03, dark);
  muzzle.position.set(0, 0.02, pistol ? -0.2 : shotgun ? -0.38 : dmr ? -0.74 : smg ? -0.28 : -0.52);
  muzzle.name = 'muzzle';
  g.add(muzzle);

  const charm = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.018, 0),
    new THREE.MeshStandardMaterial({ color: skin.charm, emissive: skin.charm, emissiveIntensity: 0.55 }),
  );
  charm.position.set(0.05, -0.04, 0.08);
  charm.name = 'charm';
  g.add(charm);
  return presentHeld(g);
}

export function applyViewSkin(root, skin) {
  root.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    if (o.name === 'tattoo') {
      o.material.color.set(skin.tattoo);
      o.material.emissive.set(skin.tattoo);
      o.material.emissiveIntensity = 0.4 + skin.glow;
    }
    if (o.name === 'accent') {
      o.material.color.set(skin.jacketAccent);
      o.material.emissive.set(skin.jacketAccent);
    }
    if (o.name === 'charm') {
      o.material.color.set(skin.charm);
      o.material.emissive.set(skin.charm);
    }
  });
  const arms = root.getObjectByName('arms');
  if (arms) {
    arms.children.forEach((c) => {
      if (c.material && c.name !== 'tattoo' && c.name !== 'accent' && c.geometry?.parameters?.depth > 0.3) {
        c.material.color.set(skin.jacket);
      }
    });
  }
}
