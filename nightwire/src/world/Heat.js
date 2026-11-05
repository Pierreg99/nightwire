export class Heat {
  constructor(game) {
    this.game = game;
    this.level = 0;
    this.points = 0;
    this.decay = 0;
    this.spawned = 0;
  }
  add(n) {
    this.points += n;
    this.decay = 18;
    const next = this.points >= 8 ? 3 : this.points >= 4 ? 2 : this.points >= 1 ? 1 : 0;
    if (next !== this.level) {
      this.level = next;
      this.game.bus.emit('notify', `HEAT ${'★'.repeat(this.level) || 'CLEAR'}`);
      this.game.audio?.heat(this.level);
    }
    this._maybeSpawn();
  }
  onShot() {
    const z = this.game.world.zoneAt(this.game.player.pos.z);
    if (z === 'strip' || z === 'hof') this.add(0.15);
  }
  onPackage() {
    this.add(4);
  }
  _maybeSpawn() {
    if (this.level >= 2 && this.spawned < 1) {
      this.spawned = 1;
      this.game.vehicles.spawnHeatVan();
      this.game.npcs.spawnSecurity(4.2, 26);
      this.game.bus.emit('notify', 'SECURITY WAGON ON THE STRIP');
    }
  }
  inSafehouse() {
    const p = this.game.player.pos;
    return p.y > 2.8 && p.x < -12 && p.z > 90 && p.z < 104;
  }
  update(dt) {
    this.decay -= dt;
    const rate = this.inSafehouse() ? 1.85 : (this.decay < 0 ? 0.15 : 0);
    if (rate && this.points > 0) {
      this.points = Math.max(0, this.points - dt * rate);
      const next = this.points >= 8 ? 3 : this.points >= 4 ? 2 : this.points >= 1 ? 1 : 0;
      if (next !== this.level) {
        this.level = next;
        if (next < 2) this.game.bus.emit('notify', next ? `HEAT ${'★'.repeat(next)}` : 'HEAT CLEAR');
      }
    }
  }
}
