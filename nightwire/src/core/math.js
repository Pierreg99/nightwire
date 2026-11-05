export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
export const rand = (a, b) => a + Math.random() * (b - a);
export const irand = (a, b) => (a + Math.floor(Math.random() * (b - a + 1)));
export const nowClock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export class Bus {
  constructor() { this.m = new Map(); }
  on(e, fn) {
    const a = this.m.get(e) || [];
    a.push(fn);
    this.m.set(e, a);
    return () => { this.m.set(e, a.filter((x) => x !== fn)); };
  }
  emit(e, p) { (this.m.get(e) || []).forEach((f) => f(p)); }
}
