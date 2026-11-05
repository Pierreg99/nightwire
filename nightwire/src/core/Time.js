export class Time {
  constructor() {
    this.now = performance.now() / 1000;
    this.dt = 0;
    this.elapsed = 0;
    this.scale = 1;
  }
  tick() {
    const n = performance.now() / 1000;
    this.dt = Math.min(0.05, n - this.now) * this.scale;
    this.now = n;
    this.elapsed += this.dt;
    return this.dt;
  }
}
