export class Stance {
  constructor() {
    this.crouch = false;
    this.height = 1.72;
    this.eye = 1.62;
  }
  toggle() { this.set(!this.crouch); }
  set(on) {
    this.crouch = on;
    this.height = on ? 1.18 : 1.72;
    this.eye = on ? 1.05 : 1.62;
  }
}
