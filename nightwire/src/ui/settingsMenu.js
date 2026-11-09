/**
 * Machala Settings, Accessibility & Mobile Polish Pass v1
 * Settings menu with quality, sensitivity, FOV and accessibility controls.
 */

export function createSettingsMenu({ container, settings, quality, accessibility }) {
  const root = document.createElement('div');
  root.className = 'nightwire-settings';
  root.style.cssText = 'position:absolute;inset:0;background:rgba(5,8,12,0.92);display:none;flex-direction:column;align-items:center;justify-content:center;color:#e8f4ff;font-family:system-ui,sans-serif;z-index:40';

  const panel = document.createElement('div');
  panel.style.cssText = 'width:min(420px,92vw);background:rgba(12,18,24,0.95);border:1px solid rgba(80,180,220,0.3);border-radius:16px;padding:18px';

  const title = document.createElement('div');
  title.textContent = 'SETTINGS';
  title.style.cssText = 'font-size:18px;font-weight:700;letter-spacing:2px;margin-bottom:14px';

  panel.append(title);

  function addSlider(label, key, min, max, step) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom:12px';

    const labelElement = document.createElement('div');
    labelElement.textContent = label;
    labelElement.style.cssText = 'font-size:12px;opacity:0.75;margin-bottom:4px';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = settings.get(key);
    input.style.cssText = 'width:100%';

    input.addEventListener('input', () => {
      settings.set(key, Number(input.value));
      accessibility.update();
    });

    wrapper.append(labelElement, input);
    panel.appendChild(wrapper);
  }

  function addSelect(label, key, options) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom:12px';

    const labelElement = document.createElement('div');
    labelElement.textContent = label;
    labelElement.style.cssText = 'font-size:12px;opacity:0.75;margin-bottom:4px';

    const select = document.createElement('select');
    select.style.cssText = 'width:100%;padding:8px;background:rgba(20,30,40,0.8);color:#e8f4ff;border:1px solid rgba(80,180,220,0.3);border-radius:8px';

    options.forEach((option) => {
      const element = document.createElement('option');
      element.value = option;
      element.textContent = option;
      select.appendChild(element);
    });

    select.value = settings.get(key);
    select.addEventListener('change', () => {
      settings.set(key, select.value);

      if (key === 'qualityTier' && select.value !== 'auto') {
        quality.setTier(select.value, { manual: true });
      }

      accessibility.update();
    });

    wrapper.append(labelElement, select);
    panel.appendChild(wrapper);
  }

  addSlider('Look Sensitivity', 'lookSensitivity', 0.2, 3, 0.05);
  addSlider('Touch Sensitivity', 'touchLookSensitivity', 0.2, 3, 0.05);
  addSlider('Field of View', 'fieldOfView', 60, 105, 1);
  addSlider('HUD Scale', 'hudScale', 0.7, 1.6, 0.05);
  addSlider('Touch Button Scale', 'touchButtonScale', 0.7, 1.6, 0.05);

  addSelect('Quality', 'qualityTier', ['auto', 'low', 'medium', 'high']);
  addSelect('Color Accessibility', 'colorblindMode', ['none', 'deuteranopia', 'protanopia', 'tritanopia']);

  const motionToggle = document.createElement('button');
  motionToggle.textContent = 'Motion Reduction: OFF';
  motionToggle.style.cssText = 'width:100%;padding:10px;background:rgba(20,30,40,0.8);border:1px solid rgba(80,180,220,0.3);color:#e8f4ff;border-radius:8px;cursor:pointer';

  motionToggle.addEventListener('click', () => {
    const next = !settings.get('motionReduction');
    settings.set('motionReduction', next);
    motionToggle.textContent = 'Motion Reduction: ' + (next ? 'ON' : 'OFF');
    accessibility.update();
  });

  panel.appendChild(motionToggle);
  root.appendChild(panel);
  container.appendChild(root);

  function open() {
    root.style.display = 'flex';
  }

  function close() {
    root.style.display = 'none';
  }

  function toggle() {
    if (root.style.display === 'flex') close();
    else open();
  }

  function dispose() {
    root.remove();
  }

  return {
    root,
    open,
    close,
    toggle,
    dispose
  };
}
