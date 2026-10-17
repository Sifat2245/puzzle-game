import { useCallback, useRef } from 'react';

export function useSound(soundEnabled) {
  const audioCtxRef = useRef(null);
  const playSound = useCallback(
    (type) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) audioCtxRef.current = new AC();
        }
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const now = ctx.currentTime;
        if (type === 'snap' || type === 'streak') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type === 'streak' ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(type === 'streak' ? 440 : 320, now);
          osc.frequency.exponentialRampToValueAtTime(type === 'streak' ? 880 : 640, now + 0.075);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'ping') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(740, now);
          osc.frequency.exponentialRampToValueAtTime(520, now + 0.28);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.32);
        } else if (type === 'victory') {
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const t = now + idx * 0.11;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.16, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.36);
          });
        }
      } catch (e) {}
    },
    [soundEnabled],
  );

  return playSound;
}
