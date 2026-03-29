// Web Audio API sound engine - no external files needed
let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type, duration, volume = 0.3, delay = 0) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (e) {}
}

export const sounds = {
  tick() {
    playTone(880, 'square', 0.05, 0.15);
  },

  urgentTick() {
    playTone(1200, 'square', 0.07, 0.25);
  },

  correct() {
    playTone(523, 'sine', 0.1, 0.3);
    playTone(659, 'sine', 0.1, 0.3, 0.1);
    playTone(784, 'sine', 0.15, 0.3, 0.2);
  },

  wrong() {
    playTone(200, 'sawtooth', 0.2, 0.3);
    playTone(150, 'sawtooth', 0.15, 0.3, 0.15);
  },

  eliminated() {
    playTone(300, 'sawtooth', 0.1, 0.4);
    playTone(200, 'sawtooth', 0.1, 0.4, 0.1);
    playTone(100, 'sawtooth', 0.3, 0.4, 0.2);
  },

  countdown() {
    playTone(440, 'sine', 0.1, 0.2);
  },

  gameStart() {
    playTone(261, 'sine', 0.1, 0.3);
    playTone(329, 'sine', 0.1, 0.3, 0.12);
    playTone(392, 'sine', 0.1, 0.3, 0.24);
    playTone(523, 'sine', 0.25, 0.3, 0.36);
  },

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => playTone(f, 'sine', 0.2, 0.35, i * 0.12));
    setTimeout(() => {
      const fanfare = [784, 784, 784, 659, 784];
      fanfare.forEach((f, i) => playTone(f, 'sine', 0.15, 0.4, i * 0.1));
    }, 600);
  },

  playerJoined() {
    playTone(600, 'sine', 0.08, 0.2);
    playTone(800, 'sine', 0.08, 0.2, 0.08);
  },

  questionReveal() {
    playTone(440, 'triangle', 0.05, 0.2);
    playTone(550, 'triangle', 0.08, 0.2, 0.08);
  },
};

export function isSoundEnabled() {
  return localStorage.getItem('bb_sound') !== 'false';
}

export function toggleSound() {
  const current = isSoundEnabled();
  localStorage.setItem('bb_sound', String(!current));
  return !current;
}

export function playSound(name) {
  if (!isSoundEnabled()) return;
  sounds[name]?.();
}
