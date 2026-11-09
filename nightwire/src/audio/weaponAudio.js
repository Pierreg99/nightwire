/**
 * Machala Combat Feel & Weapon Feedback Pass v1
 * WebAudio weapon, impact and feedback layer.
 */

export function createWeaponAudio({ audioContext } = {}) {
  const context = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  const master = context.createGain();
  master.gain.value = 0.55;
  master.connect(context.destination);

  function createNoiseBuffer(duration = 0.25) {
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function playShot({ weaponId = 'pistol', distance = 0 } = {}) {
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(weaponId === 'smg' ? 0.12 : 0.22);

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = weaponId === 'smg' ? 2600 : 1900;

    const gain = context.createGain();
    const volume = Math.max(0.08, 0.65 - distance * 0.006);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + 0.25);
  }

  function playImpact(material = 'concrete', distance = 0) {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    const frequency = {
      concrete: 180,
      metal: 720,
      flesh: 120,
      wood: 260
    }[material] || 180;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 0.45,
      now + 0.14
    );

    gain.gain.setValueAtTime(Math.max(0.05, 0.35 - distance * 0.004), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
  }

  function playHitmarker(headshot = false) {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(headshot ? 1350 : 850, now);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.09);
  }

  function playReload() {
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(0.16);

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + 0.18);
  }

  function dispose() {
    master.disconnect();
  }

  return {
    context,
    master,
    playShot,
    playImpact,
    playHitmarker,
    playReload,
    dispose
  };
}
