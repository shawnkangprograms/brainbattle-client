// Sound engine using Web Audio API — no external files needed
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('bb_sound') !== 'false';
  }

  _ctx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }

  _beep(freq, duration, type = 'sine', gain = 0.3, startTime = 0) {
    if (!this.enabled) return;
    try {
      const ctx = this._ctx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gainNode.gain.setValueAtTime(gain, ctx.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration + 0.05);
    } catch (e) {}
  }

  correct() {
    this._beep(523, 0.1, 'sine', 0.4);
    this._beep(659, 0.1, 'sine', 0.4, 0.1);
    this._beep(784, 0.2, 'sine', 0.4, 0.2);
  }

  wrong() {
    this._beep(200, 0.15, 'sawtooth', 0.3);
    this._beep(150, 0.25, 'sawtooth', 0.3, 0.15);
  }

  countdown() {
    this._beep(440, 0.08, 'square', 0.2);
  }

  countdownFinal() {
    this._beep(880, 0.15, 'square', 0.35);
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => this._beep(n, 0.15, 'sine', 0.4, i * 0.12));
    setTimeout(() => {
      const chord = [523, 659, 784];
      chord.forEach(n => this._beep(n, 0.5, 'sine', 0.3));
    }, 600);
  }

  eliminated() {
    this._beep(300, 0.1, 'sawtooth', 0.4);
    this._beep(200, 0.1, 'sawtooth', 0.4, 0.12);
    this._beep(100, 0.3, 'sawtooth', 0.4, 0.24);
  }

  click() {
    this._beep(800, 0.05, 'square', 0.15);
  }

  tick() {
    this._beep(600, 0.04, 'square', 0.1);
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('bb_sound', this.enabled);
    return this.enabled;
  }
}

export const sound = new SoundEngine();
