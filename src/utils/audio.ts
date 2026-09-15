// Web Audio API synthesizer for desk ambient sounds, hourly chimes, and customizable pomodoro alerts
import { SoundAlertChoice, AmbientSoundType } from '../types';

let audioCtx: AudioContext | null = null;

// Ambient Soundscape state
let activeAmbientType: AmbientSoundType = 'none';
let ambientMasterGain: GainNode | null = null;
let ambientNodes: (AudioNode | number)[] = []; // holds oscillators, source nodes, and intervals

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

// ----------------------------------------------------
// PROCEDURAL AMBIENT SOUNDSCAPES SYNTHESIZER
// ----------------------------------------------------

/**
 * Creates 4 seconds of looping noise buffer (pink/brown noise approximation)
 */
function createNoiseBuffer(ctx: AudioContext, type: 'pink' | 'brown' | 'white' = 'pink'): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;

    if (type === 'pink') {
      // Paul Kellet's filtered pink noise algorithm
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    } else if (type === 'brown') {
      // Integrated Brownian noise
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 1.5;
    } else {
      data[i] = white * 0.1;
    }
  }

  return buffer;
}

export function stopAmbientSoundscape(): void {
  try {
    if (ambientMasterGain && audioCtx) {
      const now = audioCtx.currentTime;
      ambientMasterGain.gain.cancelScheduledValues(now);
      ambientMasterGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
    }

    // Clear intervals or stop oscillators after fade
    const oldNodes = [...ambientNodes];
    ambientNodes = [];
    activeAmbientType = 'none';

    setTimeout(() => {
      oldNodes.forEach((node) => {
        if (typeof node === 'number') {
          clearInterval(node);
        } else if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          try {
            (node as AudioScheduledSourceNode).stop();
            (node as AudioScheduledSourceNode).disconnect();
          } catch {
            // ignore
          }
        } else {
          try {
            node.disconnect();
          } catch {
            // ignore
          }
        }
      });
    }, 550);
  } catch (e) {
    console.debug('Error stopping ambient soundscape:', e);
  }
}

export function setAmbientSoundscapeVolume(volumePercent: number): void {
  try {
    if (!ambientMasterGain || !audioCtx) return;
    const clamped = Math.max(0, Math.min(100, volumePercent)) / 100;
    const targetGain = clamped * 0.22; // Master ambient volume headroom
    const now = audioCtx.currentTime;
    ambientMasterGain.gain.cancelScheduledValues(now);
    ambientMasterGain.gain.linearRampToValueAtTime(targetGain, now + 0.1);
  } catch (e) {
    console.debug('Error setting ambient volume:', e);
  }
}

export function startAmbientSoundscape(
  soundType: AmbientSoundType,
  volumePercent: number = 35
): void {
  if (soundType === 'none') {
    stopAmbientSoundscape();
    return;
  }

  // If already playing this exact sound, just adjust volume
  if (activeAmbientType === soundType && ambientMasterGain) {
    setAmbientSoundscapeVolume(volumePercent);
    return;
  }

  stopAmbientSoundscape();

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    activeAmbientType = soundType;

    const master = ctx.createGain();
    const clamped = Math.max(0, Math.min(100, volumePercent)) / 100;
    const targetGain = clamped * 0.22;

    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 1.2);
    master.connect(ctx.destination);
    ambientMasterGain = master;

    if (soundType === 'rain') {
      // 1. Pink noise with gentle low-pass filter
      const noiseBuffer = createNoiseBuffer(ctx, 'pink');
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, ctx.currentTime);

      const filterHigh = ctx.createBiquadFilter();
      filterHigh.type = 'highpass';
      filterHigh.frequency.setValueAtTime(180, ctx.currentTime);

      noiseSource.connect(filterHigh);
      filterHigh.connect(filter);
      filter.connect(master);
      noiseSource.start();

      ambientNodes.push(noiseSource, filter, filterHigh);

      // Random soft water drops
      const dropInterval = window.setInterval(() => {
        if (!audioCtx || activeAmbientType !== 'rain') return;
        try {
          const dropOsc = audioCtx.createOscillator();
          const dropGain = audioCtx.createGain();
          const freq = 1300 + Math.random() * 1200;
          dropOsc.type = 'sine';
          dropOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          dropOsc.frequency.exponentialRampToValueAtTime(freq * 0.4, audioCtx.currentTime + 0.04);

          const dropVol = 0.012 + Math.random() * 0.02;
          dropGain.gain.setValueAtTime(dropVol, audioCtx.currentTime);
          dropGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

          dropOsc.connect(dropGain);
          dropGain.connect(master);

          dropOsc.start();
          dropOsc.stop(audioCtx.currentTime + 0.06);
        } catch {
          // ignore
        }
      }, 550);

      ambientNodes.push(dropInterval);
    } else if (soundType === 'campfire') {
      // 1. Warm low rumble noise
      const noiseBuffer = createNoiseBuffer(ctx, 'brown');
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(320, ctx.currentTime);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.65, ctx.currentTime);

      noiseSource.connect(lowFilter);
      lowFilter.connect(rumbleGain);
      rumbleGain.connect(master);
      noiseSource.start();

      ambientNodes.push(noiseSource, lowFilter, rumbleGain);

      // Random sharp spark crackles
      const crackleInterval = window.setInterval(() => {
        if (!audioCtx || activeAmbientType !== 'campfire') return;
        try {
          const count = Math.random() > 0.6 ? 2 : 1;
          for (let i = 0; i < count; i++) {
            const timeOffset = i * 0.035;
            const snapOsc = audioCtx.createOscillator();
            const snapGain = audioCtx.createGain();
            const snapFilter = audioCtx.createBiquadFilter();

            snapFilter.type = 'highpass';
            snapFilter.frequency.setValueAtTime(1800 + Math.random() * 2000, audioCtx.currentTime + timeOffset);

            snapOsc.type = 'triangle';
            snapOsc.frequency.setValueAtTime(700 + Math.random() * 1200, audioCtx.currentTime + timeOffset);
            snapOsc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + timeOffset + 0.025);

            const snapVol = 0.04 + Math.random() * 0.05;
            snapGain.gain.setValueAtTime(snapVol, audioCtx.currentTime + timeOffset);
            snapGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + timeOffset + 0.03);

            snapOsc.connect(snapFilter);
            snapFilter.connect(snapGain);
            snapGain.connect(master);

            snapOsc.start(audioCtx.currentTime + timeOffset);
            snapOsc.stop(audioCtx.currentTime + timeOffset + 0.035);
          }
        } catch {
          // ignore
        }
      }, 420);

      ambientNodes.push(crackleInterval);
    } else if (soundType === 'cosmic-drone') {
      // Dual sine wave binaural theta wave generator (108Hz and 112.5Hz -> 4.5Hz theta beat)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const subOsc = ctx.createOscillator();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(108, ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(112.5, ctx.currentTime);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(54, ctx.currentTime);

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.35, ctx.currentTime);

      // Low ethereal air noise
      const noiseBuffer = createNoiseBuffer(ctx, 'pink');
      const airNoise = ctx.createBufferSource();
      airNoise.buffer = noiseBuffer;
      airNoise.loop = true;

      const airFilter = ctx.createBiquadFilter();
      airFilter.type = 'bandpass';
      airFilter.frequency.setValueAtTime(450, ctx.currentTime);
      airFilter.Q.setValueAtTime(1.5, ctx.currentTime);

      const airGain = ctx.createGain();
      airGain.gain.setValueAtTime(0.12, ctx.currentTime);

      airNoise.connect(airFilter);
      airFilter.connect(airGain);
      airGain.connect(master);

      osc1.connect(droneGain);
      osc2.connect(droneGain);
      subOsc.connect(droneGain);
      droneGain.connect(master);

      osc1.start();
      osc2.start();
      subOsc.start();
      airNoise.start();

      ambientNodes.push(osc1, osc2, subOsc, airNoise, droneGain, airFilter, airGain);
    } else if (soundType === 'zen-stream') {
      // Babbling mountain brook: modulated filtered pink noise
      const noiseBuffer = createNoiseBuffer(ctx, 'pink');
      const streamSource = ctx.createBufferSource();
      streamSource.buffer = noiseBuffer;
      streamSource.loop = true;

      const streamFilter = ctx.createBiquadFilter();
      streamFilter.type = 'bandpass';
      streamFilter.frequency.setValueAtTime(750, ctx.currentTime);
      streamFilter.Q.setValueAtTime(0.9, ctx.currentTime);

      // Slow LFO for bubbling flow modulation
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.3, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(streamFilter.frequency);

      const streamGain = ctx.createGain();
      streamGain.gain.setValueAtTime(0.45, ctx.currentTime);

      streamSource.connect(streamFilter);
      streamFilter.connect(streamGain);
      streamGain.connect(master);

      streamSource.start();
      lfo.start();

      ambientNodes.push(streamSource, lfo, lfoGain, streamFilter, streamGain);
    }
  } catch (e) {
    console.debug('Error starting ambient soundscape:', e);
  }
}

export function getActiveAmbientSoundType(): AmbientSoundType {
  return activeAmbientType;
}
