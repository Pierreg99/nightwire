/**
 * Machala Settings, Accessibility & Mobile Polish Pass v1
 * Motion, color and readability accessibility helpers.
 */

export function createAccessibilitySystem({ settings }) {
  const root = document.documentElement;

  function apply() {
    const motion = settings.get('motionReduction');
    const colorMode = settings.get('colorblindMode');
    const hudScale = settings.get('hudScale');

    root.style.setProperty('--nightwire-hud-scale', hudScale);

    if (motion) {
      root.style.setProperty('--nightwire-motion-scale', '0.25');
    } else {
      root.style.setProperty('--nightwire-motion-scale', '1');
    }

    if (colorMode === 'deuteranopia') {
      root.style.setProperty('--nightwire-accent', '#ffcc00');
    } else if (colorMode === 'protanopia') {
      root.style.setProperty('--nightwire-accent', '#00d1ff');
    } else if (colorMode === 'tritanopia') {
      root.style.setProperty('--nightwire-accent', '#ff7a00');
    } else {
      root.style.setProperty('--nightwire-accent', '#38d7ff');
    }
  }

  function update() {
    apply();
  }

  apply();

  return {
    apply,
    update
  };
}
