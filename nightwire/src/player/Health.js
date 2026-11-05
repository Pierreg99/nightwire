export class Health {
  constructor(game) {
    this.game = game;
    this.max = 100;
    this.hp = 100;
    this.regenDelay = 0;
    this.hurt = 0;
  }
  damage(n, src) {
    this.hp = Math.max(0, this.hp - n);
    this.regenDelay = 3.2;
    this.hurt = 1;
    this.game.audio?.hurt();
    this.game.bus.emit('hurt', { n, src, hp: this.hp });
    if (this.hp <= 0) this.game.bus.emit('death');
  }
  heal(n) { this.hp = Math.min(this.max, this.hp + n); }
  update(dt) {
    this.hurt = Math.max(0, this.hurt - dt * 1.4);
    if (this.hp <= 0) {
      this.regenDelay -= dt;
      if (this.regenDelay < -2.5) {
        this.hp = 70;
        this.game.bus.emit('notify', 'STABILIZED — stay in cover');
      }
      return;
    }
    this.regenDelay -= dt;
    if (this.regenDelay <= 0 && this.hp < this.max) this.hp = Math.min(this.max, this.hp + 12 * dt);
  }
}
