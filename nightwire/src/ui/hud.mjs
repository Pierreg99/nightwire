/**
 * NIGHTWIRE v2.0.1 — HUD (.mjs)
 * Objective, health, ammo and heat HUD.
 */

export function createHUD({ container }) {
  const root = document.createElement('div');
  root.className = 'nightwire-hud';
  root.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:system-ui,sans-serif;color:#e8f4ff;z-index:20';

  const objective = document.createElement('div');
  objective.style.cssText = 'position:absolute;top:18px;left:18px;max-width:340px';

  const vitals = document.createElement('div');
  vitals.style.cssText = 'position:absolute;bottom:18px;left:18px;display:flex;gap:14px;align-items:center';

  const heat = document.createElement('div');
  heat.style.cssText = 'position:absolute;top:18px;right:18px;font-size:18px;letter-spacing:2px';

  root.append(objective, vitals, heat);
  container.appendChild(root);

  function setObjective(data) {
    objective.innerHTML = '';

    const title = document.createElement('div');
    title.textContent = data.title || '';
    title.style.cssText = 'font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:1px';

    const description = document.createElement('div');
    description.textContent = data.description || '';
    description.style.cssText = 'font-size:12px;opacity:0.72;margin-top:3px';

    const progress = document.createElement('div');
    progress.textContent = data.target > 1 ? data.progress + ' / ' + data.target : '';
    progress.style.cssText = 'font-size:11px;opacity:0.55;margin-top:2px';

    objective.append(title, description, progress);
  }

  function setVitals(data) {
    vitals.innerHTML = '';

    const health = document.createElement('div');
    health.textContent = 'HP ' + Math.round(data.health || 100);
    health.style.cssText = 'font-size:13px;font-weight:700';

    const ammo = document.createElement('div');
    ammo.textContent = (data.weapon || '') + ' ' + (data.ammo || 0);
    ammo.style.cssText = 'font-size:13px;font-weight:700';

    vitals.append(health, ammo);
  }

  function setHeat(level = 0) {
    heat.textContent = 'HEAT ' + '*'.repeat(level);
    heat.style.color = level >= 2 ? '#ff5a5a' : '#e8f4ff';
  }

  function dispose() {
    root.remove();
  }

  return {
    root,
    setObjective,
    setVitals,
    setHeat,
    dispose
  };
}
