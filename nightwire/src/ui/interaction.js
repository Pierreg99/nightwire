/**
 * Machala HUD, Phone & Interaction Pass v1
 * Context-sensitive interaction prompts.
 */

export function createInteractionSystem({ container }) {
  const root = document.createElement('div');
  root.className = 'nightwire-interaction';
  root.style.cssText = 'position:absolute;left:50%;bottom:96px;transform:translateX(-50%);padding:8px 14px;background:rgba(8,11,16,0.82);border:1px solid rgba(80,180,220,0.35);border-radius:10px;color:#e8f4ff;font-family:system-ui,sans-serif;font-size:13px;display:none;z-index:25';

  container.appendChild(root);

  let currentAction = null;

  function show(data) {
    currentAction = data.action;
    root.textContent = '[' + (data.key || 'F') + '] ' + data.label;
    root.style.display = 'block';
  }

  function hide() {
    currentAction = null;
    root.style.display = 'none';
  }

  function trigger() {
    if (currentAction) currentAction();
  }

  function dispose() {
    root.remove();
  }

  return {
    root,
    show,
    hide,
    trigger,
    dispose
  };
}
