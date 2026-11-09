/**
 * NIGHTWIRE v2.0.1 — Heat (.mjs)
 * Heat, wanted-lite escalation and security response.
 */

export class Heat {
  constructor(game) {
    this.game = game;
    this.level = 0;
    this.points = 0;
    this.decay = 0;
    this.spawned = 0;
  }

  add(amount) {
    this.points += amount;
    this.decay = 18;

    const next =
      this.points >= 8 ? 3 :
      this.points >= 4 ? 2 :
      this.points >= 1 ? 1 : 0;

    if (next !== this.level) {
      this.level = next;
      this.game.bus.emit('notify', `HEAT ${'*'.repeat(this.level) || 'CLEAR'}`);
      this.game.audio?.heat(this.level);
    }

    this._maybeSpawn();
  }

  onShot() {
    const zone = this.game.world.zoneAt(this.game.player.pos.z);

    if (zone === 'strip' || zone === 'hof') {
      this.add(0.15);
    }
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
    const position = this.game.player.pos;
    return position.y > 2.8 && position.x < -12 && position.z > 90 && position.z < 104;
  }

  update(deltaTime) {
    this.decay -= deltaTime;

    const rate = this.inSafehouse() ? 1.85 : (this.decay < 0 ? 0.15 : 0);

    if (rate && this.points > 0) {
      this.points = Math.max(0, this.points - deltaTime * rate);

      const next =
        this.points >= 8 ? 3 :
        this.points >= 4 ? 2 :
        this.points >= 1 ? 1 : 0;

      if (next !== this.level) {
        this.level = next;

        if (next < 2) {
          this.game.bus.emit('notify', next ? `HEAT ${'*'.repeat(next)}` : 'HEAT CLEAR');
        }
      }
    }
  }
}
