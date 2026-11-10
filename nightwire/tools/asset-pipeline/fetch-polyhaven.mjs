// NIGHTWIRE asset pipeline: download CC0 assets from Poly Haven (public API, no key, no login).
//   node tools/asset-pipeline/fetch-polyhaven.mjs <cacheDir>
// Writes <cacheDir>/<id>/... and <cacheDir>/manifest.json (id, type, authors, url, date) which
// build-assets.mjs turns into the shipped files and docs/ASSET-LICENSES.md.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const UA = { 'User-Agent': 'nightwire-asset-pipeline (github.com/Pierreg99/nightwire)' };
const cache = path.resolve(process.argv[2] || '.asset-cache/polyhaven');

export const PH = {
  hdris: { neuer_zollhof: ['1k', '2k'] },
  textures: {
    asphalt_02: '2k', concrete_pavement: '2k', concrete_floor_worn_001: '2k', metal_plate: '2k', metal_plate_02: '2k',
    rusty_metal_sheet: '2k', container_side: '2k', brick_wall_10: '2k', concrete_tile_facade: '2k', corrugated_iron_02: '2k',
  },
  models: {
    street_lamp_01: '1k', street_lamp_02: '1k', fire_hydrant: '1k', metal_trash_can: '1k', trashbag: '1k', Barrel_01: '1k',
    barrel_03: '1k', cardboard_box_01: '1k', wooden_crate_01: '1k', plastic_crate_01: '1k', concrete_road_barrier: '1k',
    concrete_road_barrier_02: '1k', security_camera_01: '1k', exterior_aircon_unit: '1k', utility_box_01: '1k',
    utility_box_02: '1k', power_box_01: '1k', water_manhole_cover: '1k', rollershutter_door: '1k', korean_public_payphone_01: '1k',
    WetFloorSign_01: '1k', propane_tank: '1k', portable_generator: '1k', old_tyre: '1k', covered_car: '1k',
    industrial_wall_lamp: '1k', wooden_military_crate: '1k', modular_street_seating: '1k', metal_jerrycan: '1k',
    modular_fire_escape: '1k', modular_chainlink_fence: '1k', modular_industrial_pipes_01: '1k', modular_airduct_rectangular_01: '1k',
    hand_truck: '1k', security_light: '1k',
  },
};

async function getJson(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}
async function download(url, file) {
  if (existsSync(file)) return;
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}

async function main() {
  const manifest = [];
  const jobs = [];
  for (const [kind, list] of Object.entries(PH)) {
    for (const [id, res] of Object.entries(list)) {
      jobs.push((async () => {
        const info = await getJson(`https://api.polyhaven.com/info/${id}`);
        const files = await getJson(`https://api.polyhaven.com/files/${id}`);
        const dir = path.join(cache, id);
        const got = [];
        if (kind === 'hdris') {
          for (const r of res) {
            const f = files.hdri[r].hdr;
            await download(f.url, path.join(dir, path.basename(f.url)));
            got.push(path.basename(f.url));
          }
        } else if (kind === 'textures') {
          for (const map of ['Diffuse', 'nor_gl', 'Rough', 'AO']) {
            const f = files[map]?.[res]?.jpg || files[map]?.[res]?.png;
            if (!f) continue;
            await download(f.url, path.join(dir, path.basename(f.url)));
            got.push(path.basename(f.url));
          }
        } else {
          const g = files.gltf[res].gltf;
          await download(g.url, path.join(dir, path.basename(g.url)));
          got.push(path.basename(g.url));
          for (const [rel, f] of Object.entries(g.include)) {
            await download(f.url, path.join(dir, rel));
            got.push(rel);
          }
        }
        manifest.push({
          id, kind, name: info.name, authors: Object.keys(info.authors || {}), license: 'CC0 1.0',
          url: `https://polyhaven.com/a/${id}`, published: new Date(info.date_published * 1000).toISOString().slice(0, 10),
          res: [].concat(res).join('+'), files: got,
        });
        console.log(`ok ${kind} ${id}`);
      })());
    }
  }
  const res = await Promise.allSettled(jobs);
  const failed = res.filter((r) => r.status === 'rejected');
  manifest.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
  mkdirSync(cache, { recursive: true });
  writeFileSync(path.join(cache, 'manifest.json'), JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), assets: manifest }, null, 2));
  if (failed.length) {
    for (const f of failed) console.error(String(f.reason));
    process.exit(1);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
