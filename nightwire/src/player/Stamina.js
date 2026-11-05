export class Stamina {
  constructor() {
    this.max = 100;
    this.v = 100;
  }
  update(dt, sprinting) {
    if (sprinting) this.v = Math.max(0, this.v - 22 * dt);
    else this.v = Math.min(this.max, this.v + 18 * dt);
    return this.v > 4;
  }
}
