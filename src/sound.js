// ============================================
// BATTLE CITY - Procedural 8-bit Sound System
// ============================================

let audioCtx = null;
let masterGain = null;
let muted = false;
let bgMusicNode = null;
let menuMusicNode = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getMasterGain() {
  getAudioContext();
  return masterGain;
}

/**
 * Toggle mute/unmute. Returns new muted state.
 */
export function toggleMute() {
  muted = !muted;
  const gain = getMasterGain();
  gain.gain.value = muted ? 0 : 0.3;
  return muted;
}

export function isMuted() {
  return muted;
}

/**
 * Short blip for shooting
 */
export function playShoot() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
  osc.connect(gain);
  gain.connect(getMasterGain());
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

/**
 * Noise burst for explosions
 */
export function playExplosion() {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterGain());
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.2);
}

/**
 * Ascending tones for power-up pickup
 */
export function playPowerUp() {
  const ctx = getAudioContext();
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.07 + 0.1);
    osc.connect(gain);
    gain.connect(getMasterGain());
    osc.start(ctx.currentTime + i * 0.07);
    osc.stop(ctx.currentTime + i * 0.07 + 0.1);
  });
}

/**
 * Descending tones for player death
 */
export function playPlayerDeath() {
  const ctx = getAudioContext();
  const notes = [784, 659, 523, 392, 262]; // G5 E5 C5 G4 C4
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.15);
    osc.connect(gain);
    gain.connect(getMasterGain());
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.15);
  });
}

/**
 * Level complete jingle
 */
export function playLevelComplete() {
  const ctx = getAudioContext();
  const melody = [
    { f: 523, t: 0.0 },  // C5
    { f: 587, t: 0.1 },  // D5
    { f: 659, t: 0.2 },  // E5
    { f: 784, t: 0.3 },  // G5
    { f: 1047, t: 0.5 }, // C6
    { f: 784, t: 0.65 }, // G5
    { f: 1047, t: 0.8 }, // C6
  ];
  melody.forEach(({ f, t }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + t + 0.14);
    osc.connect(gain);
    gain.connect(getMasterGain());
    osc.start(ctx.currentTime + t);
    osc.stop(ctx.currentTime + t + 0.14);
  });
}

/**
 * Game over sound - ominous descending
 */
export function playGameOver() {
  const ctx = getAudioContext();
  const notes = [
    { f: 392, t: 0.0, d: 0.3 },  // G4
    { f: 349, t: 0.3, d: 0.3 },  // F4
    { f: 330, t: 0.6, d: 0.3 },  // E4
    { f: 262, t: 0.9, d: 0.6 },  // C4 (long)
  ];
  notes.forEach(({ f, t, d }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + t + d * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + t + d);
    osc.connect(gain);
    gain.connect(getMasterGain());
    osc.start(ctx.currentTime + t);
    osc.stop(ctx.currentTime + t + d);
  });
}

/**
 * Background music - simple looping chiptune
 */
export function startBgMusic() {
  stopBgMusic();
  const ctx = getAudioContext();

  // Simple bass + melody loop using oscillators scheduled in a pattern
  const loopDuration = 4; // seconds per loop
  const melody = [
    262, 294, 330, 349, 392, 349, 330, 294, // C D E F G F E D
    330, 392, 440, 392, 349, 330, 294, 262,  // E G A G F E D C
  ];
  const bass = [131, 131, 165, 165, 196, 196, 165, 165]; // C3 C3 E3 E3 G3 G3 E3 E3

  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.08;
  gainNode.connect(getMasterGain());

  const bassGain = ctx.createGain();
  bassGain.gain.value = 0.1;
  bassGain.connect(getMasterGain());

  let cancelled = false;

  function scheduleLoop(startTime) {
    if (cancelled) return;
    const noteLen = loopDuration / melody.length;

    melody.forEach((freq, i) => {
      if (cancelled) return;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.08, startTime + i * noteLen);
      ng.gain.setValueAtTime(0.01, startTime + (i + 0.9) * noteLen);
      osc.connect(ng);
      ng.connect(gainNode);
      osc.start(startTime + i * noteLen);
      osc.stop(startTime + (i + 0.95) * noteLen);
    });

    const bassNoteLen = loopDuration / bass.length;
    bass.forEach((freq, i) => {
      if (cancelled) return;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.1, startTime + i * bassNoteLen);
      ng.gain.setValueAtTime(0.01, startTime + (i + 0.8) * bassNoteLen);
      osc.connect(ng);
      ng.connect(bassGain);
      osc.start(startTime + i * bassNoteLen);
      osc.stop(startTime + (i + 0.9) * bassNoteLen);
    });

    // Schedule next loop
    setTimeout(() => {
      if (!cancelled) scheduleLoop(startTime + loopDuration);
    }, (loopDuration - 0.5) * 1000);
  }

  scheduleLoop(ctx.currentTime + 0.1);
  bgMusicNode = { cancel: () => { cancelled = true; } };
}

export function stopBgMusic() {
  if (bgMusicNode) {
    bgMusicNode.cancel();
    bgMusicNode = null;
  }
}

/**
 * Menu music - different simple melody
 */
export function startMenuMusic() {
  stopMenuMusic();
  const ctx = getAudioContext();

  const loopDuration = 4;
  const melody = [
    392, 0, 330, 0, 392, 440, 392, 330, // G _ E _ G A G E
    349, 0, 294, 0, 349, 392, 349, 294, // F _ D _ F G F D
  ];

  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.06;
  gainNode.connect(getMasterGain());

  let cancelled = false;

  function scheduleLoop(startTime) {
    if (cancelled) return;
    const noteLen = loopDuration / melody.length;

    melody.forEach((freq, i) => {
      if (cancelled || freq === 0) return;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.06, startTime + i * noteLen);
      ng.gain.setValueAtTime(0.01, startTime + (i + 0.8) * noteLen);
      osc.connect(ng);
      ng.connect(gainNode);
      osc.start(startTime + i * noteLen);
      osc.stop(startTime + (i + 0.85) * noteLen);
    });

    setTimeout(() => {
      if (!cancelled) scheduleLoop(startTime + loopDuration);
    }, (loopDuration - 0.5) * 1000);
  }

  scheduleLoop(ctx.currentTime + 0.1);
  menuMusicNode = { cancel: () => { cancelled = true; } };
}

export function stopMenuMusic() {
  if (menuMusicNode) {
    menuMusicNode.cancel();
    menuMusicNode = null;
  }
}
