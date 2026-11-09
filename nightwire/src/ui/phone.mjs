/**
 * NIGHTWIRE v2.0.1 — Phone UI (.mjs)
 * Phone shell with procedural asset background.
 */

export function createPhone({ container, assets = null }) {
  const root = document.createElement('div');
  root.className = 'nightwire-phone';

  const phoneBackground = assets?.['phone-ui']?.() || null;

  root.style.cssText = `position:absolute;right:18px;bottom:18px;width:280px;height:420px;background:${phoneBackground ? `url(${phoneBackground}) center/cover no-repeat` : 'rgba(8,11,16,0.92)'};border:1px solid rgba(80,180,220,0.35);border-radius:18px;padding:14px;color:#e8f4ff;font-family:system-ui,sans-serif;display:none;z-index:30`;

  const tabs = ['Jobs', 'Map', 'Radio', 'Messages'];
  const content = document.createElement('div');
  content.style.cssText = 'height:calc(100% - 42px);overflow:auto;font-size:12px;line-height:1.45';

  const tabBar = document.createElement('div');
  tabBar.style.cssText = 'display:flex;gap:8px;margin-bottom:10px';

  const messages = [];
  const jobs = [];
  const blips = [];

  function setTab(name) {
    content.innerHTML = '';

    if (name === 'Jobs') {
      jobs.forEach((job) => {
        const item = document.createElement('div');
        item.textContent = job.title + ' - ' + job.status;
        item.style.cssText = 'padding:8px;border-bottom:1px solid rgba(80,180,220,0.15)';
        content.appendChild(item);
      });
    }

    if (name === 'Map') {
      blips.forEach((blip) => {
        const item = document.createElement('div');
        item.textContent = blip.label;
        item.style.cssText = 'padding:8px;border-bottom:1px solid rgba(80,180,220,0.15)';
        content.appendChild(item);
      });
    }

    if (name === 'Radio') {
      ['Dark Synth', 'Late Night Talk'].forEach((station) => {
        const item = document.createElement('div');
        item.textContent = station;
        item.style.cssText = 'padding:8px;border-bottom:1px solid rgba(80,180,220,0.15)';
        content.appendChild(item);
      });
    }

    if (name === 'Messages') {
      messages.forEach((message) => {
        const item = document.createElement('div');
        item.textContent = message;
        item.style.cssText = 'padding:8px;border-bottom:1px solid rgba(80,180,220,0.15)';
        content.appendChild(item);
      });
    }
  }

  tabs.forEach((tab) => {
    const button = document.createElement('button');
    button.textContent = tab;
    button.style.cssText = 'flex:1;padding:6px 0;background:rgba(20,30,40,0.8);border:1px solid rgba(80,180,220,0.25);color:#e8f4ff;border-radius:8px;font-size:11px;cursor:pointer';
    button.addEventListener('click', () => setTab(tab));
    tabBar.appendChild(button);
  });

  root.append(tabBar, content);
  container.appendChild(root);

  function open() {
    root.style.display = 'block';
    setTab('Jobs');
  }

  function close() {
    root.style.display = 'none';
  }

  function toggle() {
    if (root.style.display === 'block') close();
    else open();
  }

  function addJob(job) {
    jobs.push(job);
    setTab('Jobs');
  }

  function addBlip(blip) {
    blips.push(blip);
    setTab('Map');
  }

  function addMessage(message) {
    messages.push(message);
    setTab('Messages');
  }

  function dispose() {
    root.remove();
  }

  return {
    root,
    open,
    close,
    toggle,
    addJob,
    addBlip,
    addMessage,
    dispose
  };
}
