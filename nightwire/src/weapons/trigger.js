/** Semi fires on the rising edge. Auto fires for the whole hold. */
export function pullTrigger(mode, held, wasHeld) {
  if (mode === 'semi') return held && !wasHeld;
  return !!held;
}
