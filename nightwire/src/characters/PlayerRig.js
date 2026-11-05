import * as THREE from 'three';

function cap(r, len, material) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 8), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function makeHumanoid(pal) {
  const root = new THREE.Group();
  const jacket = new THREE.MeshStandardMaterial({ color: pal.jacket, roughness: 0.62, metalness: 0.08 });
  const pants = new THREE.MeshStandardMaterial({ color: pal.pants, roughness: 0.72, metalness: 0.04 });
  const shoes = new THREE.MeshStandardMaterial({ color: pal.shoes || 0x0c0e10, roughness: 0.48, metalness: 0.18 });
  const skinM = new THREE.MeshStandardMaterial({ color: pal.head, roughness: 0.58 });
  const maskM = new THREE.MeshStandardMaterial({ color: pal.mask || 0x121416, roughness: 0.42 });
  const accent = new THREE.MeshStandardMaterial({
    color: pal.accent || pal.jacketAccent || 0x3ee0ff,
    emissive: pal.accent || pal.jacketAccent || 0x3ee0ff,
    emissiveIntensity: 0.22 + (pal.glow || 0),
    roughness: 0.5,
  });

  const hips = cap(0.13, 0.1, pants);
  hips.position.y = 0.84;
  const torso = cap(0.16, 0.4, jacket);
  torso.position.y = 1.18;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 10, Math.PI), jacket);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.42, 0.02);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.06), accent);
  strip.position.set(0, 1.22, 0.14);
  strip.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), skinM);
  head.position.y = 1.62;
  head.castShadow = true;
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.12), maskM);
  mask.position.set(0, 1.58, 0.08);

  const lLeg = cap(0.065, 0.44, pants); lLeg.position.set(-0.09, 0.44, 0);
  const rLeg = cap(0.065, 0.44, pants); rLeg.position.set(0.09, 0.44, 0);
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), shoes);
  lShoe.position.set(-0.09, 0.05, 0.04);
  const rShoe = lShoe.clone();
  rShoe.position.x = 0.09;
  lShoe.castShadow = rShoe.castShadow = true;

  const lArm = cap(0.048, 0.36, jacket);
  lArm.position.set(-0.24, 1.16, 0);
  lArm.name = 'lArm';
  const rArm = cap(0.048, 0.36, jacket);
  rArm.position.set(0.24, 1.16, 0);
  rArm.name = 'rArm';

  root.add(hips, torso, collar, strip, head, mask, lLeg, rLeg, lShoe, rShoe, lArm, rArm);
  root.userData.skinMats = { jacket, pants, shoes, mask: maskM, accent };
  return { root, head, lArm, rArm };
}

export function makeMannequin(skin, scale = 1) {
  const { root } = makeHumanoid({
    jacket: skin.jacket,
    pants: skin.pants,
    shoes: skin.shoes,
    head: 0x6a5346,
    mask: skin.mask,
    accent: skin.jacketAccent,
    glow: skin.glow,
  });
  root.name = 'mannequin';
  root.scale.setScalar(scale);
  return root;
}

export function tintMannequin(g, skin) {
  const m = g.userData.skinMats;
  if (!m) return;
  m.jacket.color.set(skin.jacket);
  m.pants.color.set(skin.pants);
  m.shoes.color.set(skin.shoes);
  m.mask.color.set(skin.mask);
  m.accent.color.set(skin.jacketAccent);
  m.accent.emissive.set(skin.jacketAccent);
  m.accent.emissiveIntensity = 0.22 + skin.glow;
}
