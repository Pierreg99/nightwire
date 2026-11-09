/**
 * NIGHTWIRE v2.0.1 — Procedural Asset Factory
 * Generates viewable game assets without external binary files.
 */

function createCanvas(width, height) {
  if (typeof document === 'undefined') {
    throw new Error('Canvas is only available in a browser environment.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createZoneAsset({ width = 1280, height = 720, ground = '#12151c', sky = '#05070d', accent = '#38e8ff' }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, sky);
  skyGradient.addColorStop(1, '#101725');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = ground;
  ctx.fillRect(0, height * 0.62, width, height * 0.38);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.62);
  ctx.lineTo(width, height * 0.62);
  ctx.stroke();

  for (let index = 0; index < 18; index += 1) {
    const x = (index / 18) * width;
    const buildingHeight = 120 + ((index * 53) % 220);
    ctx.fillStyle = index % 2 === 0 ? '#161d29' : '#1d2634';
    ctx.fillRect(x, height * 0.62 - buildingHeight, width / 18 - 8, buildingHeight);

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(x + 12, height * 0.62 - buildingHeight + 24, 8, 18);
    ctx.globalAlpha = 1;
  }

  return canvas.toDataURL('image/png');
}

function createWeaponAsset({ width = 1024, height = 512, body = '#232a35', accent = '#ff4d6d', label = 'NIGHTWIRE' }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#080b12';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = body;
  ctx.fillRect(180, 220, 620, 70);
  ctx.fillRect(240, 280, 120, 130);
  ctx.fillRect(640, 235, 190, 32);

  ctx.fillStyle = accent;
  ctx.fillRect(200, 230, 80, 12);
  ctx.fillRect(660, 240, 140, 8);

  ctx.fillStyle = '#e8f4ff';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(label, 300, 180);

  return canvas.toDataURL('image/png');
}

function createCharacterAsset({ width = 768, height = 1024, suit = '#1a2230', visor = '#38e8ff', label = 'TACTICAL UNIT' }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#070a11';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = suit;
  ctx.fillRect(250, 330, 268, 470);
  ctx.fillRect(310, 180, 148, 170);

  ctx.fillStyle = visor;
  ctx.fillRect(330, 235, 108, 34);

  ctx.fillStyle = '#0d121a';
  ctx.fillRect(190, 380, 60, 260);
  ctx.fillRect(518, 380, 60, 260);

  ctx.fillStyle = '#e8f4ff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(label, 190, 880);

  return canvas.toDataURL('image/png');
}

function createPhoneAsset({ width = 720, height = 1280, accent = '#38e8ff' }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#0d131e';
  ctx.fillRect(30, 40, width - 60, height - 120);

  ctx.fillStyle = accent;
  ctx.fillRect(60, 90, 180, 8);

  ctx.fillStyle = '#e8f4ff';
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.fillText('NIGHTWIRE', 60, 170);

  const apps = ['JOBS', 'MAP', 'RADIO', 'MESSAGES'];

  apps.forEach((app, index) => {
    const y = 240 + index * 180;
    ctx.fillStyle = '#141c29';
    ctx.fillRect(60, y, width - 120, 130);
    ctx.fillStyle = accent;
    ctx.fillRect(60, y, 10, 130);
    ctx.fillStyle = '#e8f4ff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(app, 100, y + 80);
  });

  return canvas.toDataURL('image/png');
}

export const proceduralAssets = {
  createZoneAsset,
  createWeaponAsset,
  createCharacterAsset,
  createPhoneAsset
};

export function createGameAssetLibrary() {
  return {
    'dock-street': () => createZoneAsset({ accent: '#38e8ff' }),
    'warehouse-09': () => createZoneAsset({ ground: '#171c22', accent: '#ffb347' }),
    'apartment-4b': () => createZoneAsset({ ground: '#1d1a22', accent: '#b388ff' }),
    'dock-boat': () => createZoneAsset({ ground: '#0d1a24', accent: '#4dffd2' }),
    'weapon-pistol': () => createWeaponAsset({ label: 'HEAVY PISTOL' }),
    'weapon-smg': () => createWeaponAsset({ body: '#2a3240', accent: '#38e8ff', label: 'COMPACT SMG' }),
    'enemy-tactical': () => createCharacterAsset(),
    'phone-ui': () => createPhoneAsset()
  };
}
