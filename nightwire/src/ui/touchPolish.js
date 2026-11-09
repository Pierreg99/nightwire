/**
 * Machala Settings, Accessibility & Mobile Polish Pass v1
 * Mobile-first touch layout polish.
 */

export function createTouchPolish({ container, settings }) {
  const root = document.createElement('div');
  root.className = 'nightwire-touch-polish';
  root.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:22';

  const moveStick = document.createElement('div');
  moveStick.style.cssText = 'position:absolute;left:24px;bottom:24px;width:120px;height:120px;border-radius:50%;background:rgba(20,30,40,0.45);border:1px solid rgba(80,180,220,0.3)';

  const lookPad = document.createElement('div');
  lookPad.style.cssText = 'position:absolute;right:24px;bottom:24px;width:150px;height:150px;border-radius:50%;background:rgba(20,30,40,0.28);border:1px solid rgba(80,180,220,0.2)';

  const fireButton = document.createElement('div');
  fireButton.textContent = 'FIRE';
  fireButton.style.cssText = 'position:absolute;right:44px;bottom:190px;width:72px;height:72px;border-radius:50%;background:rgba(180,40,50,0.65);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700';

  const adsButton = document.createElement('div');
  adsButton.textContent = 'ADS';
  adsButton.style.cssText = 'position:absolute;right:130px;bottom:210px;width:58px;height:58px;border-radius:50%;background:rgba(20,30,40,0.7);color:#e8f4ff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700';

  root.append(moveStick, lookPad, fireButton, adsButton);
  container.appendChild(root);

  function applyScale() {
    const scale = settings.get('touchButtonScale');
    fireButton.style.transform = 'scale(' + scale + ')';
    adsButton.style.transform = 'scale(' + scale + ')';
  }

  function update() {
    applyScale();
  }

  function dispose() {
    root.remove();
  }

  applyScale();

  return {
    root,
    moveStick,
    lookPad,
    fireButton,
    adsButton,
    update,
    dispose
  };
}
