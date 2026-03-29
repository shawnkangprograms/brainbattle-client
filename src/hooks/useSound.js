import { useRef, useCallback } from 'react';

// Generates sounds using the Web Audio API — no external files needed
function createAudioContext() {
  if (typeof window === 'undefined') return null;
  return new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(ctx, frequency, duration, type = 'sine', gain = 0.3, startTime = 0) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
}

export function useSound() {
  const ctxRef = useRef(null);
  const mutedRef = useRef(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = createAudioContext();
    return ctxRef.current;
  }, []);

  const playCorrect = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    playTone(ctx, 523, 0.1, 'sine', 0.25);
    playTone(ctx, 659, 0.1, 'sine', 0.25, 0.1);
    playTone(ctx, 784, 0.2, 'sine', 0.3, 0.2);
  }, [getCtx]);

  const playWrong = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    playTone(ctx, 200, 0.15, 'sawtooth', 0.2);
    playTone(ctx, 150, 0.25, 'sawtooth', 0.15, 0.1);
  }, [getCtx]);

  const playTick = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    playTone(ctx, 880, 0.05, 'square', 0.08);
  }, [getCtx]);

  const playUrgentTick = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    playTone(ctx, 1100, 0.06, 'square', 0.12);
  }, [getCtx]);

  const playWin = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
      playTone(ctx, freq, 0.2, 'sine', 0.3, i * 0.15);
    });
    playTone(ctx, 1047, 0.6, 'sine', 0.35, melody.length * 0.15);
  }, [getCtx]);

  const playCountdown = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    playTone(ctx, 440, 0.08, 'square', 0.1);
  }, [getCtx]);

  const playJoin = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    playTone(ctx, 660, 0.1, 'sine', 0.2);
    playTone(ctx, 880, 0.15, 'sine', 0.2, 0.1);
  }, [getCtx]);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    return mutedRef.current;
  }, []);

  return { playCorrect, playWrong, playTick, playUrgentTick, playWin, playCountdown, playJoin, toggleMute };
}
