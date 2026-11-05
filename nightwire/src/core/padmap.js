/** Deadzone, then rescale so the edge of the stick is still 1. */
export function stickAxis(v, dead = 0.18) {
  if (Math.abs(v) < dead) return 0;
  return (v - Math.sign(v) * dead) / (1 - dead);
}

/**
 * Left stick → the same axis space as WASD.
 * Stick up (axes[1] < 0) must come out as negative z, because KeyW does `z -= 1`.
 * Stick right (axes[0] > 0) must come out as positive x, because KeyD does `x += 1`.
 */
export function moveFromStick(lx, ly) {
  return { x: stickAxis(lx), z: stickAxis(ly) };
}

/**
 * Right stick → the same look deltas as the mouse.
 * Stick right (axes[2] > 0) must be positive look.x, because mouse movementX > 0 is positive
 * and FPSController turns with `yaw -= look.x` (mouse-right looks right).
 * Stick down (axes[3] > 0) must be positive look.y, because mouse movementY > 0 looks down.
 */
export function lookFromStick(rx, ry, sens, dt) {
  return {
    x: stickAxis(rx) * sens * dt * 2.2,
    y: stickAxis(ry) * sens * dt * 2.2,
  };
}
