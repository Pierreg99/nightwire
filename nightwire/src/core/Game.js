import * as THREE from 'three';
// Must run before any material compiles: patches the fog chunks into height fog.
import { updateWet } from '../fx/atmosphere.mjs';
import { Time } from './Time.js';
import { Input, lockPointer } from './Input.js';
import { loadSettings, saveSettings } from './Settings.js';
import { detectEnv, resolveProfile, applyLightBudget } from './Quality.js';
import { Bus } from './math.js';
import { createCamera } from './camera.js';
import { createTextures } from '../world/textures.mjs';
import { World } from '../world/World.mjs';
import { buildCity } from '../world/city.mjs';
import { dressCity } from '../world/dressing.mjs';
import { Heat } from '../world/Heat.mjs';
import { FPSController } from '../player/FPSController.js';
import { Health } from '../player/Health.js';
import { Stamina } from '../player/Stamina.js';
import { WeaponSystem } from '../weapons/WeaponSystem.js';
import { VehicleSystem } from '../vehicles/VehicleSystem.js';
import { NPCSystem } from '../characters/NPC.js';
import { loadSkins } from '../characters/SkinData.js';
import { HUD } from '../ui/hud.js';
import { Phone } from '../ui/phone.js';
import { TouchControls } from '../ui/touch.js';
import { PauseMenu } from '../ui/pause.js';
import { bindEditorShell } from '../ui/editor-shell.js';
import { Prompt } from '../ui/prompt.js';
import { SkinEditor } from '../editors/SkinEditor.js';
import { MapSkimEditor } from '../editors/MapSkimEditor.js';
import { Campaign } from '../story/Campaign.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { CombatFX } from '../fx/CombatFX.js';
import { Weather } from '../fx/Weather.js';
import { RenderPipeline, frameSize, requestStage } from '../fx/RenderPipeline.js';
import { LOOK } from '../fx/look.mjs';
import { addSkyDome } from '../fx/sky.js';
import { NeonFX } from '../fx/NeonFX.mjs';
import { EnvProbe } from '../fx/EnvProbe.mjs';
import { applyShaftProfile } from '../fx/LightShafts.mjs';
import { applyWetProfile } from '../fx/wetAsphalt.mjs';
import { StoryPresenter } from '../ui/StoryPresenter.mjs';
import { applyTouchScale } from '../ui/pause.js';
import { photo } from './photo.mjs';
import { AssetLibrary } from '../assets/AssetLibrary.mjs';
import { loadHyperreal } from '../assets/hyperreal.mjs';
import { Drones } from '../world/Drones.mjs';

export class Game {
  constructor() {
    this.canvas = document.getElementById('c');
    this.settings = loadSettings();
    this.env = detectEnv();
    this.qualityProfile = resolveProfile(this.settings, this.env);
    if (this.env.mobile) this.settings.showTouch = true;
    this.bus = new Bus();
    this.time = new Time();
    this.mode = 'title';
    this.input = new Input(this.canvas, this.settings);
    if (this.mode === 'title') this.input.blocked = true;
    this.skins = loadSkins();
    this.lights = { budget: 0, points: [] };

    this.gfx = new RenderPipeline(this.canvas, this.qualityProfile);
    this.renderer = this.gfx.renderer;

    this.scene = new THREE.Scene();
    this.textures = createTextures();
    this.textures.env.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = this.textures.env;
    this.scene.backgroundBlurriness = 0.38;
    this.scene.backgroundIntensity = this.qualityProfile.bg;
    this.scene.fog = new THREE.FogExp2(LOOK.fog, this.qualityProfile.fog);
    this.sky = addSkyDome(this.scene);
    this.camera = createCamera(this.settings.fov);
    this.scene.add(this.camera);

    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromEquirectangular(this.textures.env).texture;
      pmrem.dispose();
    } catch {
      this.scene.environment = null;
    }

    this.hemi = new THREE.HemisphereLight(0x2a3a58, 0x0c0806, this.qualityProfile.hemi);
    this.scene.add(this.hemi);
    this.moon = new THREE.DirectionalLight(0xc4d4ff, 0.55);
    this.moon.position.set(-40, 50, 18);
    this.gfx._shadow(this.moon, this.qualityProfile);
    this.scene.add(this.moon);
    this.scene.add(this.moon.target);
    // Rim: cold cyan from behind the player's usual view line, catches silhouettes and wet edges.
    // Bounce: faint magenta from below, the neon coming back off the wet street. No shadows.
    this.rim = new THREE.DirectionalLight(0x3ee0ff, this.qualityProfile.rim ?? 0.3);
    this.rim.position.set(30, 18, -60);
    this.scene.add(this.rim);
    this.scene.add(this.rim.target);
    this.bounce = new THREE.DirectionalLight(0xff2d6a, (this.qualityProfile.rim ?? 0.3) * 0.35);
    this.bounce.position.set(0, -20, 6);
    this.scene.add(this.bounce);
    this.scene.add(this.bounce.target);

    this.world = new World(this);
    buildCity(this.world);
    this.dressing = dressCity(this.world, this.qualityProfile);

    this.player = new FPSController(this);
    this.player.spawn(this.world.spawns.player);
    this.health = new Health(this);
    this.bus.on('hurt', (e) => this.player.addTrauma(Math.min(0.6, 0.18 + (e?.n || 10) * 0.012)));
    this.stamina = new Stamina();
    this.weapons = new WeaponSystem(this);
    this.vehicles = new VehicleSystem(this);
    this.npcs = new NPCSystem(this);
    this.heat = new Heat(this);
    this.audio = new AudioEngine(this);
    this.fx = new CombatFX(this);
    this.weather = new Weather(this);
    this.post = this.gfx.attachPost(this);
    this.hud = new HUD(this);
    this.phone = new Phone(this);
    this.touch = new TouchControls(this);
    this.pause = new PauseMenu(this);
    this.prompt = new Prompt(this);
    this.skinEditor = new SkinEditor(this);
    this.skim = new MapSkimEditor(this);
    this.story = new Campaign(this);
    this.editors = bindEditorShell(this);
    this.presenter = new StoryPresenter(this);

    this.npcs.spawnAll();
    this.vehicles.spawnAll();
    this.neon = new NeonFX(this);
    this.neon.collect();
    this.envProbe = new EnvProbe(this);
    this.drones = new Drones(this);
    this.touch.show(this.settings.showTouch);
    applyTouchScale(this.settings.touchButtonScale ?? 1);
    this.applyQuality();

    this.bodyShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 16),
      new THREE.MeshBasicMaterial({
        color: 0x000, transparent: true, opacity: 0.45, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      }),
    );
    this.bodyShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.bodyShadow);

    this.titleT = 0;
    this._bindUi();
    const onResize = () => this.resize();
    addEventListener('resize', onResize);
    visualViewport?.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onResize);
    this.resize();
    document.getElementById('boot-splash')?.classList.add('hidden');
    this.renderer.setAnimationLoop(() => this.frame());

    // Photographic assets stream in after the first frame; the procedural world is the fallback.
    this.assets = new AssetLibrary(this.renderer);
    const afterFirstFrames = new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    this.assetsReady = afterFirstFrames.then(() => loadHyperreal(this)).catch((err) => {
      console.warn('[assets] hyperreal pass failed, procedural look stays', err);
      this.hyperreal = { error: String(err?.message || err) };
      return this.hyperreal;
    });
  }

  photo(kind, type) {
    return photo(this, kind, type);
  }

  _bindUi() {
    document.getElementById('btn-jack').onclick = () => this.jackIn();
    this.canvas.addEventListener('click', () => {
      if (this.mode === 'play' && !this.input.blocked) lockPointer(this.canvas);
    });
    addEventListener('keydown', (e) => {
      if (this.mode === 'title') return;
      if (e.code === 'Escape') {
        if (this.phone.openState) this.phone.close();
        else if (this.skim.openState) this.skim.close();
        else if (this.mode === 'pause') this.pause.close();
        else this.pause.open();
      }
      if (e.code === 'Tab' || e.code === 'KeyB' || e.code === 'KeyP') {
        e.preventDefault();
        if (this.mode === 'play' || this.mode === 'phone') this.phone.toggle();
      }
      if (e.code === 'F3' || e.code === 'F10') {
        e.preventDefault();
        this.skim.openState ? this.skim.close() : this.skim.open();
      }
      if (e.code === 'KeyT' && this.mode === 'play') {
        this.touch.show(!this.settings.showTouch);
        saveSettings(this.settings);
        this.hud.notify(this.settings.showTouch ? 'TOUCH LAYOUT ON' : 'TOUCH LAYOUT OFF');
      }
      if (e.code === 'KeyF' && this.mode === 'play') this.tryInteract();
      if (e.code === 'Backquote' && this.mode === 'play') this.cycleQuality();
      if (e.code === 'KeyM' && this.mode === 'play') { this.phone.open(); this.phone.showApp('map'); }
    });
    // Android home button, alt-tab, minimise: release held inputs, pause, mute.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return;
      this.touch?.releaseAll();
      this.input.keys.clear();
      this.input.fire = false;
      this.input.ads = false;
      if (this.mode === 'play') this.pause.open();
      this.audio?.ctx?.suspend?.().catch?.(() => {});
    });
    if (window.DeviceOrientationEvent) {
      addEventListener('deviceorientation', (e) => {
        if (!this.settings.gyro || this.input.blocked) return;
        this.input.gyro.x += (e.gamma || 0) * 0.0004;
        this.input.gyro.y += (e.beta || 0) * 0.00015;
      });
    }
  }

  jackIn() {
    const title = document.getElementById('title');
    title.classList.add('fade-out');
    setTimeout(() => title.classList.add('hidden'), 280);
    document.getElementById('hud').classList.remove('hidden');
    this.audio.resume();
    requestStage();
    this.mode = 'play';
    this.input.blocked = false;
    lockPointer(this.canvas);
    this.presenter.intro();
    this.story.boot();
  }

  fadeTo(target, notify) {
    if (this._fading) return;
    this._fading = true;
    const el = document.getElementById('fade');
    el.classList.add('on');
    this.input.blocked = true;
    setTimeout(() => {
      const p = this.player.pos;
      if (target.isVector3) p.copy(target);
      else p.set(target.x, target.y ?? 0, target.z);
      p.y = this.world.collision.floorY(p.x, p.z, (target.y ?? p.y) + 3);
      this.player.vel.set(0, 0, 0);
      if (notify) this.hud.notify(notify);
      el.classList.remove('on');
      this._fading = false;
      if (this.mode === 'play') this.input.blocked = false;
    }, 200);
  }

  tryInteract() {
    if (this.player.inVehicle) { this.vehicles.exit(); return; }
    const it = this.prompt.current || this.world.nearestInteract(this.player.pos, 2.2);
    if (!it) return;
    this.story.onInteract(it);
  }

  cycleQuality() {
    const order = ['auto', 'ultra', 'high', 'medium', 'mobile'];
    const i = order.indexOf(this.settings.quality || 'auto');
    this.settings.quality = order[(i + 1) % order.length];
    if (this.settings.quality === 'ultra' || this.settings.quality === 'high' || this.settings.quality === 'auto') {
      this.settings.reducedFx = false;
    }
    saveSettings(this.settings);
    this.applyQuality();
    const el = document.getElementById('set-quality');
    if (el) el.value = this.settings.quality;
    const fx = document.getElementById('set-fx');
    if (fx) fx.checked = !!this.settings.reducedFx;
    this.hud.notify(`GRAPHICS ${this.settings.quality.toUpperCase()} → ${this.qualityProfile.label}`);
  }

  applyQuality() {
    const profile = resolveProfile(this.settings, this.env);
    this.qualityProfile = profile;
    const dpr = this.gfx.apply(profile, {
      moon: this.moon,
      scene: this.scene,
      hemi: this.hemi,
      camera: this.camera,
    });
    applyLightBudget(this, profile.lights);
    this.weather?.setDensity(profile.rain, profile.steam);
    const reduced = !!this.settings.reducedFx;
    applyShaftProfile(this, profile, reduced);
    applyWetProfile(profile, reduced);
    this.envProbe?.apply(profile, reduced);
    if (this.rim) {
      this.rim.intensity = profile.rim ?? 0.3;
      this.bounce.intensity = (profile.rim ?? 0.3) * 0.35;
    }
    this.audio?.setAmbienceLevel?.(profile.ambience ?? 1);
    const { w, h } = frameSize();
    const el = document.getElementById('quality-readout');
    if (el) {
      el.textContent = `${profile.label} · ${dpr.toFixed(2)}× · ${w}×${h} · shadow ${profile.shadow}`;
    }
  }

  resize() {
    this.gfx.resize(this.camera);
  }

  frame() {
    const dt = this.time.tick();
    updateWet(dt, this.qualityProfile, this.settings.reducedFx);
    this.neon?.update(dt, this.qualityProfile, this.settings.reducedFx);
    this.input.poll(dt);
    if (this.input.pressed('GamepadStart') && this.mode !== 'title' && this.mode !== 'end') {
      if (this.mode === 'pause') this.pause.close();
      else if (this.mode === 'play' || this.mode === 'phone') this.pause.open();
    }
    if (this.input.pressed('GamepadBack') && (this.mode === 'play' || this.mode === 'phone')) this.phone.toggle();
    if (this.mode === 'title' && (this.input.pressed('GamepadA') || this.input.pressed('Space'))) this.jackIn();
    if (this.heli) {
      const t = this.time.elapsed * 0.08;
      this.heli.position.set(Math.cos(t) * 90, 42, Math.sin(t) * 70 - 20);
      if (this.heliSpot) {
        this.heliSpot.position.copy(this.heli.position);
        this.heliSpot.target.position.set(this.heli.position.x, 0, this.heli.position.z);
      }
    }

    // Photo hook (smoke screenshots / devtools): a callback owns the camera, the world keeps living.
    if (this.photoMode) {
      this.npcs.update(dt);
      this.weather.update(dt);
      this.fx.update(dt);
      this.photoMode(this.camera, dt);
      this.presenter.update(dt);
      this.dressing?.update(dt * 4, this.world.zoneAt(this.player.pos.z));
      this.drones?.update(dt);
      this.envProbe?.update(dt);
      this.post.render(dt);
      return;
    }

    if (this.mode === 'title') {
      this.titleT += dt;
      const t = this.titleT;
      this.camera.position.set(8 + Math.sin(t * 0.12) * 2.2, 3.4, -18);
      this.camera.lookAt(22, 14, -72);
      this.drones?.update(dt);
      this.weather.update(dt);
      this.envProbe?.update(dt);
      this.post.render(dt);
      return;
    }

    if (this.mode === 'end') {
      this.camera.position.set(this.player.pos.x + 2, this.player.pos.y + 2.2, this.player.pos.z + 4);
      this.camera.lookAt(this.player.pos);
      this.post.render(dt);
      return;
    }

    if (this.mode === 'skim') {
      this.weapons.vm.visible = false;
      if (this.weather?.pts) this.weather.pts.visible = false;
      this.skim.update(dt);
      this.skim.render();
      if (this.input.pressed('Escape')) this.skim.close();
      this.input.flushPresses();
      return;
    }

    if (this.mode === 'play') {
      if (this.input.pressed('GamepadY')) this.tryInteract();
      if (this.qualityProfile.lights < 24) {
        this._lightT = (this._lightT || 0) + dt;
        if (this._lightT > 0.45) {
          this._lightT = 0;
          applyLightBudget(this, this.qualityProfile.lights);
        }
      }
      if (!this.player.inVehicle) this.player.update(dt);
      this.vehicles.update(dt);
      if (!this.player.inVehicle) this.player.applyCamera(this.camera, dt, this.weapons.ads);
      this.weapons.update(dt);
      this.npcs.update(dt);
      this.health.update(dt);
      this.heat.update(dt);
      this.story.update();
      this.fx.update(dt);
      this.weather.update(dt);
      this.prompt.update();
      this.rim.target.position.copy(this.player.pos);
      this.rim.position.set(this.player.pos.x + 30, 18, this.player.pos.z - 60);
      this.bounce.target.position.copy(this.player.pos);
      this.bounce.position.set(this.player.pos.x, this.player.pos.y - 20, this.player.pos.z + 6);
      this.audio.updateAmbience?.(dt, this.hud?.zone);
      this.dressing?.update(dt, this.hud?.zone);
      this.drones?.update(dt);
      this.bodyShadow.position.set(this.player.pos.x, this.player.pos.y + 0.04, this.player.pos.z);
      this.audio.setListener(this.player.pos);
    } else {
      this.input.consumeLook();
      this.weapons.update(dt);
      this.fx.update(dt);
      this.weather.update(dt);
    }

    this.presenter.update(dt);
    this.hud.update(dt);
    this.phone.update();
    this.skinEditor.renderPreview();
    // Shadow camera follows the player, snapped to whole shadow texels (no shimmering edges).
    const qp = this.qualityProfile;
    const ts = qp.shadow > 0 ? (2 * (qp.shadowRadius || 30)) / qp.shadow : 0.05;
    const sx = Math.round(this.player.pos.x / ts) * ts;
    const sz = Math.round(this.player.pos.z / ts) * ts;
    this.moon.position.set(sx - 40, 50, sz + 18);
    this.moon.target.position.set(sx, 0, sz);

    if (this.mode === 'play' && this.gfx.adapt(dt, this.camera)) {
      const el = document.getElementById('quality-readout');
      if (el) el.textContent = `${this.qualityProfile.label} · ${this.renderer.getPixelRatio().toFixed(2)}× adaptive`;
    }
    if (this.mode === 'play') this.envProbe.update(dt);
    if (this.mode === 'play' || this.mode === 'phone' || this.mode === 'pause') this.post.render(dt);
    this.input.flushPresses();
  }
}
