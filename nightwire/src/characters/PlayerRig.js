import { makeHuman } from './HumanBody.mjs';

/** Legacy entry point (wardrobe preview etc.): a procedural skinned human. */
export function makeHumanoid(pal) {
  const human = makeHuman({
    top: pal.jacket, pants: pal.pants, shoes: pal.shoes ?? 0x0c0e10,
    skin: pal.head ?? 0x8a6450, accent: pal.accent ?? 0x3ee0ff, vest: false, hair: 'short',
  });
  return { root: human.root, head: human.bones.head, lArm: human.bones.upperArmL, rArm: human.bones.upperArmR, human };
}

/** Wardrobe mannequin: own (unshared) materials so tinting never leaks onto NPCs. */
export function makeMannequin(skin, scale = 1) {
  const human = makeHuman({
    top: skin.jacket, pants: skin.pants, shoes: skin.shoes, skin: 0x8a6450,
    accent: skin.jacketAccent, vest: true, hair: 'short',
  });
  const root = human.root;
  const m = {};
  for (const [k, mesh] of Object.entries(human.meshes)) { mesh.material = mesh.material.clone(); m[k] = mesh.material; }
  // relaxed stance
  human.bones.upperArmL.rotation.z = 0.12;
  human.bones.upperArmR.rotation.z = -0.12;
  human.bones.foreArmL.rotation.x = -0.25;
  human.bones.foreArmR.rotation.x = -0.25;
  root.name = 'mannequin';
  root.scale.setScalar(scale);
  root.userData.skinMats = { jacket: m.top, pants: m.pants, shoes: m.shoes, mask: m.hair, accent: m.extra };
  return root;
}

export function tintMannequin(g, skin) {
  const m = g.userData.skinMats;
  if (!m) return;
  m.jacket.color.set(skin.jacket);
  m.pants.color.set(skin.pants);
  m.shoes.color.set(skin.shoes);
  if (m.mask) m.mask.color.set(skin.mask);
  if (m.accent) {
    m.accent.color.set(skin.jacketAccent);
    m.accent.emissive?.set(skin.jacketAccent);
    if (m.accent.emissive) m.accent.emissiveIntensity = 0.12 + skin.glow;
  }
}
