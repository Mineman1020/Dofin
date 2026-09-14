// Web Audio API synthesizer for desk ambient sounds, hourly chimes, and customizable pomodoro alerts
import { SoundAlertChoice } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTickSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.028);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    console.debug('Tick audio error:', e);
  }
}

export function playHourlyChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // A two-tone soothing chime (E5 -> B5 harmonics)
    const tones = [659.25, 987.77, 1318.51];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);

      const startTime = ctx.currentTime + idx * 0.18;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 2.3);
    });
  } catch (e) {
    console.debug('Chime error:', e);
  }
}

// 1. Zen Bell (Singing Bowl)
export function playZenBell(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5];
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      const startTime = ctx.currentTime + idx * 0.08;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 3.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 3.1);
    });
  } catch (e) {
    console.debug('Zen bell error:', e);
  }
}

// 2. Digital Beep
export function playDigitalBeep(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const pulses = [880, 1174.66, 1760];
    pulses.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);

      const startTime = ctx.currentTime + idx * 0.14;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.14, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.26);
    });
  } catch (e) {
    console.debug('Digital beep error:', e);
  }
}

// 3. Gentle Marimba
export function playGentleMarimba(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Melodic sequence: C5 -> E5 -> G5 -> A5
    const notes = [523.25, 659.25, 783.99, 880.0];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, ctx.currentTime);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);

      const startTime = ctx.currentTime + idx * 0.16;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  } catch (e) {
    console.debug('Marimba error:', e);
  }
}

// 4. Crystal Harp
export function playCrystalHarp(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Ascending celestial arpeggio: F5, A5, C6, E6, G6
    const arpeggio = [698.46, 880.0, 1046.5, 1318.51, 1567.98];
    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);

      const startTime = ctx.currentTime + idx * 0.11;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.13, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.9);
    });
  } catch (e) {
    console.debug('Crystal harp error:', e);
  }
}

// 5. Classic Alarm
export function playClassicAlarm(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Rapid dual bell ring pulses
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + i * 0.12;
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 987.77 : 1174.66, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.11);
    }
  } catch (e) {
    console.debug('Classic alarm error:', e);
  }
}

// 6. Custom Uploaded Sound Player
export function playCustomSound(dataUrl: string): void {
  try {
    if (!dataUrl) return;
    const audio = new Audio(dataUrl);
    audio.volume = 0.85;
    audio.play().catch((err) => {
      console.warn('Audio playback prevented or invalid format:', err);
    });
  } catch (e) {
    console.debug('Custom sound error:', e);
  }
}

// Universal Alert Sound Trigger
export function triggerSoundAlert(choice: SoundAlertChoice, customDataUrl?: string): void {
  switch (choice) {
    case 'zen-bell':
      playZenBell();
      break;
    case 'digital-beep':
      playDigitalBeep();
      break;
    case 'gentle-marimba':
      playGentleMarimba();
      break;
    case 'crystal-harp':
      playCrystalHarp();
      break;
    case 'classic-alarm':
      playClassicAlarm();
      break;
    case 'custom':
      if (customDataUrl) {
        playCustomSound(customDataUrl);
      } else {
        playZenBell();
      }
      break;
    default:
      playZenBell();
  }
}

export function playPomodoroStart(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const tones = [392.0, 523.25];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);

      const startTime = ctx.currentTime + idx * 0.15;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.09, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  } catch (e) {
    console.debug('Start sound error:', e);
  }
}
