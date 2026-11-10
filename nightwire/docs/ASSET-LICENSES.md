# Third-party assets and licenses

All assets below are shipped under `public/assets/thirdparty/<source>/` and were downloaded on
2026-11-10 from public pages without any login, API key or scraping behind authentication.
Only CC0 (public domain dedication) material is used, so redistribution in this repository and in
all builds (web, Electron, Android) is allowed. Attribution is not legally required for CC0; it is given
anyway. No Mixamo or other non-redistributable files are included. Regenerate this file with
`python3 tools/asset-pipeline/write_licenses.py`.

Total size of `public/assets/thirdparty/`: **85.29 MB** (largest single file: 5.62 MB; no Git LFS needed).

## MakeHuman (humans: NPCs, player, first-person hands)

| Field | Value |
|---|---|
| Source | MakeHuman system assets, CC0 pack: https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip |
| Tool | MPFB 2.0.18 Blender extension (https://extensions.blender.org/add-ons/mpfb/), used only offline to build the meshes; MPFB code (GPL) is **not** shipped |
| Authors | MakeHuman team (Data Collection AB, Joel Palmius, Jonas Hauquier and contributors) |
| License | CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/) for the system assets and the base mesh / targets as released by the MakeHuman project |
| Downloaded | 2026-11-10 |
| Changes | combined into 8 characters (`tools/asset-pipeline/humans.json`), game-engine rig, retargeted Quaternius clips baked in, meshopt + WebP (2048 px), decimated LOD set (1024 px) |

| File | Size |
|---|---|
| `public/assets/thirdparty/makehuman/LICENSE.txt` | 0.00 MB |
| `public/assets/thirdparty/makehuman/civil_f_elegant.glb` | 2.14 MB |
| `public/assets/thirdparty/makehuman/civil_f_elegant_lod.glb` | 1.40 MB |
| `public/assets/thirdparty/makehuman/civil_f_sport.glb` | 1.77 MB |
| `public/assets/thirdparty/makehuman/civil_f_sport_lod.glb` | 1.31 MB |
| `public/assets/thirdparty/makehuman/civil_m_jacket.glb` | 1.86 MB |
| `public/assets/thirdparty/makehuman/civil_m_jacket_lod.glb` | 1.21 MB |
| `public/assets/thirdparty/makehuman/civil_m_tee.glb` | 1.91 MB |
| `public/assets/thirdparty/makehuman/civil_m_tee_lod.glb` | 1.32 MB |
| `public/assets/thirdparty/makehuman/crew_worker.glb` | 2.22 MB |
| `public/assets/thirdparty/makehuman/crew_worker_lod.glb` | 1.39 MB |
| `public/assets/thirdparty/makehuman/player.glb` | 1.84 MB |
| `public/assets/thirdparty/makehuman/player_lod.glb` | 1.20 MB |
| `public/assets/thirdparty/makehuman/security_suit.glb` | 2.10 MB |
| `public/assets/thirdparty/makehuman/security_suit_lod.glb` | 1.42 MB |
| `public/assets/thirdparty/makehuman/street_plaid.glb` | 1.97 MB |
| `public/assets/thirdparty/makehuman/street_plaid_lod.glb` | 1.34 MB |

## Quaternius Universal Animation Library 1 + 2 (animations, android mannequin)

| Field | Value |
|---|---|
| Source | https://quaternius.itch.io/universal-animation-library and https://quaternius.itch.io/universal-animation-library-2 (free "Standard" downloads) |
| Author | Quaternius (https://quaternius.com) |
| License | CC0 1.0 (License.txt in both packs: "CC0 1.0 Universal Public Domain Dedication") |
| Downloaded | 2026-11-10 |
| Use | 21 clips retargeted onto every MakeHuman character (baked into their GLBs); the mannequin itself ships as the security android `quaternius/android.glb` |

- `public/assets/thirdparty/quaternius/LICENSE.txt` (0.00 MB)
- `public/assets/thirdparty/quaternius/License-Quaternius-UAL.txt` (0.00 MB)
- `public/assets/thirdparty/quaternius/android.glb` (0.91 MB)

## Poly Haven (HDRI, PBR photo textures, street props)

All Poly Haven assets are CC0 1.0 (https://polyhaven.com/license). Metadata from the public API
`https://api.polyhaven.com/info/<id>`. Textures converted to WebP (2K / 1K), models simplified and
meshopt-compressed with gltf-transform.

| Asset | Type | Author(s) | License | Source | Published | Shipped files |
|---|---|---|---|---|---|---|
| Neuer Zollhof (`neuer_zollhof`) | hdris | Greg Zaal | CC0 1.0 | https://polyhaven.com/a/neuer_zollhof | 2018-04-04 | `neuer_zollhof_1k.hdr`, `neuer_zollhof_2k.hdr` |
| Barrel_01 (`Barrel_01`) | models | Jorge Camacho | CC0 1.0 | https://polyhaven.com/a/Barrel_01 | 2020-03-30 | `Barrel_01_1k.gltf`, `Barrel_01.bin`, `textures/Barrel_01_explosive_diff_1k.jpg`, `textures/Barrel_01_explosive_nor_gl_1k.jpg`, `textures/Barrel_01_explosive_arm_1k.jpg` |
| Barrel 03 (`barrel_03`) | models | Serhii Khromov | CC0 1.0 | https://polyhaven.com/a/barrel_03 | 2021-09-22 | `barrel_03_1k.gltf`, `textures/barrel_03_diff_1k.jpg`, `barrel_03.bin`, `textures/barrel_03_nor_gl_1k.jpg`, `textures/barrel_03_arm_1k.jpg` |
| Cardboard Box 01 (`cardboard_box_01`) | models | Rahul Chaudhary | CC0 1.0 | https://polyhaven.com/a/cardboard_box_01 | 2022-12-16 | `cardboard_box_01_1k.gltf`, `textures/cardboard_box_01_arm_1k.jpg`, `cardboard_box_01.bin`, `textures/cardboard_box_01_diff_1k.jpg`, `textures/cardboard_box_01_nor_gl_1k.jpg` |
| Concrete Road Barrier (`concrete_road_barrier`) | models | Amal Kumar | CC0 1.0 | https://polyhaven.com/a/concrete_road_barrier | 2023-08-18 | `concrete_road_barrier_1k.gltf`, `textures/concrete_road_barrier_nor_gl_1k.jpg`, `textures/concrete_road_barrier_arm_1k.jpg`, `textures/concrete_road_barrier_diff_1k.jpg`, `concrete_road_barrier.bin` |
| Concrete Road Barrier 02 (`concrete_road_barrier_02`) | models | Amal Kumar | CC0 1.0 | https://polyhaven.com/a/concrete_road_barrier_02 | 2023-11-17 | `concrete_road_barrier_02_1k.gltf`, `concrete_road_barrier_02.bin`, `textures/concrete_road_barrier_02_arm_1k.jpg`, `textures/concrete_road_barrier_02_nor_gl_1k.jpg`, `textures/concrete_road_barrier_02_diff_1k.jpg` |
| Covered Car (`covered_car`) | models | MP | CC0 1.0 | https://polyhaven.com/a/covered_car | 2023-11-22 | `covered_car_1k.gltf`, `covered_car.bin`, `textures/covered_car_nor_gl_1k.jpg`, `textures/covered_car_arm_1k.jpg`, `textures/covered_car_diff_1k.jpg` |
| Exterior Aircon Unit (`exterior_aircon_unit`) | models | Monsta3D | CC0 1.0 | https://polyhaven.com/a/exterior_aircon_unit | 2023-08-16 | `exterior_aircon_unit_1k.gltf`, `textures/exterior_aircon_unit_01_nor_gl_1k.jpg`, `textures/exterior_aircon_unit_01_opacity_1k.jpg`, `textures/exterior_aircon_unit_rusted_01_arm_1k.jpg`, `textures/exterior_aircon_unit_01_arm_1k.jpg`, `textures/exterior_aircon_unit_02_arm_1k.jpg`, `textures/exterior_aircon_unit_rusted_02_arm_1k.jpg`, `exterior_aircon_unit.bin`, `textures/exterior_aircon_unit_02_nor_gl_1k.jpg`, `textures/exterior_aircon_unit_rusted_01_nor_gl_1k.jpg`, `textures/exterior_aircon_unit_rusted_01_diff_1k.jpg`, `textures/exterior_aircon_unit_01_diff_1k.jpg`, `textures/exterior_aircon_unit_rusted_02_opacity_1k.jpg`, `textures/exterior_aircon_unit_rusted_02_nor_gl_1k.jpg` |
| Fire Hydrant (`fire_hydrant`) | models | Gonçalo Felício | CC0 1.0 | https://polyhaven.com/a/fire_hydrant | 2023-10-27 | `fire_hydrant_1k.gltf`, `fire_hydrant.bin`, `textures/fire_hydrant_nor_gl_1k.jpg`, `textures/fire_hydrant_aged_diff_1k.jpg`, `textures/fire_hydrant_aged_arm_1k.jpg`, `textures/fire_hydrant_aged_nor_gl_1k.jpg`, `textures/fire_hydrant_diff_1k.jpg`, `textures/fire_hydrant_arm_1k.jpg` |
| Hand Truck (`hand_truck`) | models | Mutanzom3D | CC0 1.0 | https://polyhaven.com/a/hand_truck | 2026-04-14 | `hand_truck_1k.gltf`, `textures/hand_truck_nor_gl_1k.jpg`, `textures/hand_truck_diff_1k.jpg`, `textures/hand_truck_arm_1k.jpg`, `hand_truck.bin` |
| Industrial Wall Lamp (`industrial_wall_lamp`) | models | Kuutti Siitonen | CC0 1.0 | https://polyhaven.com/a/industrial_wall_lamp | 2025-06-02 | `industrial_wall_lamp_1k.gltf`, `textures/industrial_wall_lamp_emissive_1k.jpg`, `textures/industrial_wall_lamp_nor_gl_1k.jpg`, `textures/industrial_wall_lamp_diff_1k.jpg`, `textures/industrial_wall_lamp_arm_1k.jpg`, `textures/industrial_wall_lamp_glass_nor_gl_1k.jpg`, `textures/industrial_wall_lamp_glass_diff_1k.jpg`, `textures/industrial_wall_lamp_glass_arm_1k.jpg`, `industrial_wall_lamp.bin` |
| Korean Public Payphone 01 (`korean_public_payphone_01`) | models | UM JOORIN | CC0 1.0 | https://polyhaven.com/a/korean_public_payphone_01 | 2021-06-15 | `korean_public_payphone_01_1k.gltf`, `textures/korean_public_payphone_01_nor_gl_1k.jpg`, `textures/korean_public_payphone_01_diff_1k.jpg`, `korean_public_payphone_01.bin`, `textures/korean_public_payphone_01_arm_1k.jpg` |
| Metal Jerrycan (`metal_jerrycan`) | models | Sean Buckley | CC0 1.0 | https://polyhaven.com/a/metal_jerrycan | 2026-03-20 | `metal_jerrycan_1k.gltf`, `textures/metal_jerrycan_nor_gl_1k.jpg`, `textures/metal_jerrycan_diff_1k.jpg`, `textures/metal_jerrycan_arm_1k.jpg`, `metal_jerrycan.bin` |
| Metal Trash Can (`metal_trash_can`) | models | GurJas Studios | CC0 1.0 | https://polyhaven.com/a/metal_trash_can | 2023-09-27 | `metal_trash_can_1k.gltf`, `textures/metal_trash_can_diff_1k.jpg`, `textures/metal_trash_can_rust_diff_1k.jpg`, `textures/metal_trash_can_arm_1k.jpg`, `textures/metal_trash_can_rust_nor_gl_1k.jpg`, `textures/metal_trash_can_nor_gl_1k.jpg`, `metal_trash_can.bin`, `textures/metal_trash_can_rust_arm_1k.jpg` |
| Modular Airduct Rectangular 01 (`modular_airduct_rectangular_01`) | models | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/modular_airduct_rectangular_01 | 2021-08-19 | `modular_airduct_rectangular_01_1k.gltf`, `textures/modular_airduct_rectangular_01_parts01_nor_gl_1k.jpg`, `textures/modular_airduct_rectangular_01_parts02_nor_gl_1k.jpg`, `textures/modular_airduct_rectangular_01_parts02_diff_1k.jpg`, `modular_airduct_rectangular_01.bin`, `textures/modular_airduct_rectangular_01_parts01_arm_1k.jpg`, `textures/modular_airduct_rectangular_01_parts02_arm_1k.jpg`, `textures/modular_airduct_rectangular_01_parts01_diff_1k.jpg` |
| Modular Chainlink Fence (`modular_chainlink_fence`) | models | James Ray Cock, Amal Kumar | CC0 1.0 | https://polyhaven.com/a/modular_chainlink_fence | 2023-11-11 | `modular_chainlink_fence_1k.gltf`, `modular_chainlink_fence.bin`, `textures/modular_chainlink_fence_posts_nor_gl_1k.jpg`, `textures/modular_chainlink_fence_wire_arm_1k.jpg`, `textures/modular_chainlink_fence_wire_nor_gl_1k.jpg`, `textures/modular_chainlink_fence_wire_diff_1k.jpg`, `textures/modular_chainlink_fence_posts_arm_1k.jpg`, `textures/modular_chainlink_fence_posts_diff_1k.jpg` |
| Modular Fire Escape (`modular_fire_escape`) | models | Juniix | CC0 1.0 | https://polyhaven.com/a/modular_fire_escape | 2023-09-13 | `modular_fire_escape_1k.gltf`, `textures/modular_fire_escape_01_arm_1k.jpg`, `textures/modular_fire_escape_02_nor_gl_1k.jpg`, `textures/modular_fire_escape_02_arm_1k.jpg`, `modular_fire_escape.bin`, `textures/modular_fire_escape_02_diff_1k.jpg`, `textures/modular_fire_escape_01_diff_1k.jpg`, `textures/modular_fire_escape_01_nor_gl_1k.jpg` |
| Modular Industrial Pipes 01 (`modular_industrial_pipes_01`) | models | Jorge Camacho | CC0 1.0 | https://polyhaven.com/a/modular_industrial_pipes_01 | 2021-06-15 | `modular_industrial_pipes_01_1k.gltf`, `textures/modular_industrial_pipes_01_group02_arm_1k.jpg`, `textures/modular_industrial_pipes_01_group01_diff_1k.jpg`, `textures/modular_industrial_pipes_01_group02_nor_gl_1k.jpg`, `modular_industrial_pipes_01.bin`, `textures/modular_industrial_pipes_01_group01_nor_gl_1k.jpg`, `textures/modular_industrial_pipes_01_group01_arm_1k.jpg`, `textures/modular_industrial_pipes_01_group02_diff_1k.jpg` |
| Modular Street Seating (`modular_street_seating`) | models | Stuart Attenborrow | CC0 1.0 | https://polyhaven.com/a/modular_street_seating | 2023-09-08 | `modular_street_seating_1k.gltf`, `textures/modular_street_seating_supports_diff_1k.jpg`, `textures/modular_street_seating_armrests_nor_gl_1k.jpg`, `textures/modular_street_seating_timber_arm_1k.jpg`, `textures/modular_street_seating_supports_nor_gl_1k.jpg`, `textures/modular_street_seating_timber_diff_1k.jpg`, `textures/modular_street_seating_connectors_nor_gl_1k.jpg`, `textures/modular_street_seating_armrests_diff_1k.jpg`, `textures/modular_street_seating_supports_arm_1k.jpg`, `textures/modular_street_seating_connectors_diff_1k.jpg`, `textures/modular_street_seating_armrests_arm_1k.jpg`, `textures/modular_street_seating_timber_nor_gl_1k.jpg`, `textures/modular_street_seating_connectors_arm_1k.jpg`, `modular_street_seating.bin` |
| Old Tyre (`old_tyre`) | models | MP | CC0 1.0 | https://polyhaven.com/a/old_tyre | 2023-10-30 | `old_tyre_1k.gltf`, `textures/old_tyre_diff_1k.jpg`, `textures/old_tyre_arm_1k.jpg`, `old_tyre.bin`, `textures/old_tyre_nor_gl_1k.jpg` |
| Plastic Crate 01 (`plastic_crate_01`) | models | PierreB3D | CC0 1.0 | https://polyhaven.com/a/plastic_crate_01 | 2026-06-09 | `plastic_crate_01_1k.gltf`, `textures/plastic_crate_01_nor_gl_1k.jpg`, `textures/plastic_crate_01_diff_1k.jpg`, `textures/plastic_crate_01_arm_1k.jpg`, `plastic_crate_01.bin` |
| Portable Generator (`portable_generator`) | models | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/portable_generator | 2026-07-03 | `portable_generator_1k.gltf`, `textures/portable_generator_spec_1k.jpg`, `textures/portable_generator_nor_gl_1k.jpg`, `textures/portable_generator_diff_1k.jpg`, `textures/portable_generator_arm_1k.jpg`, `portable_generator.bin` |
| Power Box 01 (`power_box_01`) | models | Rico Cilliers, Yann Kervran | CC0 1.0 | https://polyhaven.com/a/power_box_01 | 2021-10-29 | `power_box_01_1k.gltf`, `textures/power_box_01_arm_1k.jpg`, `textures/power_box_01_nor_gl_1k.jpg`, `power_box_01.bin`, `textures/power_box_01_diff_1k.jpg` |
| Propane Tank (`propane_tank`) | models | Slinc | CC0 1.0 | https://polyhaven.com/a/propane_tank | 2026-03-20 | `propane_tank_1k.gltf`, `textures/propane_tank_nor_gl_1k.jpg`, `textures/propane_tank_diff_1k.jpg`, `textures/propane_tank_arm_1k.jpg`, `propane_tank.bin` |
| Rollershutter Door (`rollershutter_door`) | models | MP | CC0 1.0 | https://polyhaven.com/a/rollershutter_door | 2023-10-11 | `rollershutter_door_1k.gltf`, `rollershutter_door.bin`, `textures/rollershutter_door_arm_1k.jpg`, `textures/rollershutter_door_diff_1k.jpg`, `textures/rollershutter_door_nor_gl_1k.jpg`, `textures/rollershutter_door_graffiti_diff_1k.jpg` |
| Security Camera 01 (`security_camera_01`) | models | Alexander Otterbeck, Yann Kervran | CC0 1.0 | https://polyhaven.com/a/security_camera_01 | 2023-09-29 | `security_camera_01_1k.gltf`, `security_camera_01.bin`, `textures/security_camera_01_diff_1k.jpg`, `textures/security_camera_01_arm_1k.jpg`, `textures/security_camera_01_nor_gl_1k.jpg` |
| Security Light (`security_light`) | models | Maximilian Schuster | CC0 1.0 | https://polyhaven.com/a/security_light | 2023-11-10 | `security_light_1k.gltf`, `textures/security_light_nor_gl_1k.jpg`, `security_light.bin`, `textures/security_light_diff_1k.jpg`, `textures/security_light_arm_1k.jpg` |
| Street Lamp 01 (`street_lamp_01`) | models | Josh Dean | CC0 1.0 | https://polyhaven.com/a/street_lamp_01 | 2023-10-20 | `street_lamp_01_1k.gltf`, `textures/street_lamp_01_arm_1k.jpg`, `textures/street_lamp_01_diff_1k.jpg`, `textures/street_lamp_01_nor_gl_1k.jpg`, `street_lamp_01.bin` |
| Street Lamp 02 (`street_lamp_02`) | models | Josh Dean | CC0 1.0 | https://polyhaven.com/a/street_lamp_02 | 2023-10-25 | `street_lamp_02_1k.gltf`, `textures/street_lamp_02_diff_1k.jpg`, `textures/street_lamp_02_arm_1k.jpg`, `street_lamp_02.bin`, `textures/street_lamp_02_nor_gl_1k.jpg` |
| Trashbag (`trashbag`) | models | Benny Weimer | CC0 1.0 | https://polyhaven.com/a/trashbag | 2026-06-09 | `trashbag_1k.gltf`, `textures/trashbag_nor_gl_1k.jpg`, `textures/trashbag_diff_1k.jpg`, `textures/trashbag_arm_1k.jpg`, `trashbag.bin` |
| Utility Box 01 (`utility_box_01`) | models | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/utility_box_01 | 2023-11-18 | `utility_box_01_1k.gltf`, `textures/utility_box_01_diff_1k.jpg`, `textures/utility_box_01_nor_gl_1k.jpg`, `textures/utility_box_01_arm_1k.jpg`, `utility_box_01.bin` |
| Utility Box 02 (`utility_box_02`) | models | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/utility_box_02 | 2023-11-24 | `utility_box_02_1k.gltf`, `textures/utility_box_02_diff_1k.jpg`, `textures/utility_box_02_arm_1k.jpg`, `textures/utility_box_02_nor_gl_1k.jpg`, `utility_box_02.bin` |
| Water Manhole Cover (`water_manhole_cover`) | models | Raunox | CC0 1.0 | https://polyhaven.com/a/water_manhole_cover | 2023-11-08 | `water_manhole_cover_1k.gltf`, `textures/water_manhole_cover_arm_1k.jpg`, `textures/water_manhole_cover_nor_gl_1k.jpg`, `textures/water_manhole_cover_diff_1k.jpg`, `water_manhole_cover.bin` |
| Wet Floor Sign 01 (`WetFloorSign_01`) | models | Fran Calvente | CC0 1.0 | https://polyhaven.com/a/WetFloorSign_01 | 2020-03-30 | `WetFloorSign_01_1k.gltf`, `textures/WetFloorSign_01_arm_1k.jpg`, `textures/WetFloorSign_01_nor_gl_1k.jpg`, `textures/WetFloorSign_01_diff_1k.jpg`, `WetFloorSign_01.bin` |
| Wooden Crate 01 (`wooden_crate_01`) | models | James Ray Cock | CC0 1.0 | https://polyhaven.com/a/wooden_crate_01 | 2022-02-25 | `wooden_crate_01_1k.gltf`, `textures/wooden_crate_01_diff_1k.jpg`, `textures/wooden_crate_01_nor_gl_1k.jpg`, `wooden_crate_01.bin`, `textures/wooden_crate_01_arm_1k.jpg` |
| Wooden Military Crate (`wooden_military_crate`) | models | Prabhjinder Singh | CC0 1.0 | https://polyhaven.com/a/wooden_military_crate | 2026-06-20 | `wooden_military_crate_1k.gltf`, `textures/wooden_military_crate_nor_gl_1k.jpg`, `textures/wooden_military_crate_diff_1k.jpg`, `textures/wooden_military_crate_arm_1k.jpg`, `wooden_military_crate.bin` |
| Asphalt 02 (`asphalt_02`) | textures | Rob Tuytel | CC0 1.0 | https://polyhaven.com/a/asphalt_02 | 2020-08-06 | `asphalt_02_diff_2k.jpg`, `asphalt_02_nor_gl_2k.jpg`, `asphalt_02_rough_2k.jpg`, `asphalt_02_ao_2k.jpg` |
| Brick Wall 10 (`brick_wall_10`) | textures | Dimitrios Savva | CC0 1.0 | https://polyhaven.com/a/brick_wall_10 | 2024-10-31 | `brick_wall_10_diff_2k.jpg`, `brick_wall_10_nor_gl_2k.jpg`, `brick_wall_10_rough_2k.jpg`, `brick_wall_10_ao_2k.jpg` |
| Concrete Floor Worn 001 (`concrete_floor_worn_001`) | textures | Dimitrios Savva, Rico Cilliers | CC0 1.0 | https://polyhaven.com/a/concrete_floor_worn_001 | 2021-08-03 | `concrete_floor_worn_001_diff_2k.jpg`, `concrete_floor_worn_001_nor_gl_2k.jpg`, `concrete_floor_worn_001_rough_2k.jpg`, `concrete_floor_worn_001_ao_2k.jpg` |
| Concrete Pavement (`concrete_pavement`) | textures | Charlotte Baglioni | CC0 1.0 | https://polyhaven.com/a/concrete_pavement | 2024-02-20 | `concrete_pavement_diff_2k.jpg`, `concrete_pavement_nor_gl_2k.jpg`, `concrete_pavement_rough_2k.jpg`, `concrete_pavement_ao_2k.jpg` |
| Concrete Tile Facade (`concrete_tile_facade`) | textures | Charlotte Baglioni | CC0 1.0 | https://polyhaven.com/a/concrete_tile_facade | 2025-07-08 | `concrete_tile_facade_diff_2k.jpg`, `concrete_tile_facade_nor_gl_2k.jpg`, `concrete_tile_facade_rough_2k.jpg`, `concrete_tile_facade_ao_2k.jpg` |
| Container Side (`container_side`) | textures | Dimitrios Savva | CC0 1.0 | https://polyhaven.com/a/container_side | 2023-08-01 | `container_side_diff_2k.jpg`, `container_side_nor_gl_2k.jpg`, `container_side_rough_2k.jpg`, `container_side_ao_2k.jpg` |
| Corrugated Iron 02 (`corrugated_iron_02`) | textures | Jenelle van Heerden, Sergej Majboroda | CC0 1.0 | https://polyhaven.com/a/corrugated_iron_02 | 2023-11-30 | `corrugated_iron_02_diff_2k.jpg`, `corrugated_iron_02_nor_gl_2k.jpg`, `corrugated_iron_02_rough_2k.jpg`, `corrugated_iron_02_ao_2k.jpg` |
| Metal Plate (`metal_plate`) | textures | Rob Tuytel | CC0 1.0 | https://polyhaven.com/a/metal_plate | 2018-06-20 | `metal_plate_diff_2k.jpg`, `metal_plate_nor_gl_2k.jpg`, `metal_plate_rough_2k.jpg`, `metal_plate_ao_2k.jpg` |
| Metal Plate 02 (`metal_plate_02`) | textures | Rob Tuytel | CC0 1.0 | https://polyhaven.com/a/metal_plate_02 | 2024-08-15 | `metal_plate_02_diff_2k.jpg`, `metal_plate_02_nor_gl_2k.jpg`, `metal_plate_02_rough_2k.jpg`, `metal_plate_02_ao_2k.jpg` |
| Rusty Metal Sheet (`rusty_metal_sheet`) | textures | Amal Kumar | CC0 1.0 | https://polyhaven.com/a/rusty_metal_sheet | 2023-08-22 | `rusty_metal_sheet_diff_2k.jpg`, `rusty_metal_sheet_nor_gl_2k.jpg`, `rusty_metal_sheet_rough_2k.jpg`, `rusty_metal_sheet_ao_2k.jpg` |

Fetched: 2026-11-10. Folder size: 57.99 MB.

## Own work (not third-party)

- `public/assets/models/drone.glb`: security quadcopter modelled procedurally in Blender by
  `tools/asset-pipeline/drone.py` for this project; same license as the game.
- Retargeting, character assembly and compression scripts in `tools/asset-pipeline/`.

## Not used / excluded

- Mixamo (Adobe licence forbids redistribution of the raw files), Sketchfab "free" downloads behind
  login, any asset with NC/ND or unclear terms.
