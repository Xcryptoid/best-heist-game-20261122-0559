// Synthesised sound: no audio files, every cue is an oscillator.
// The context only starts after the player's first key or click.

export function createAudio() {
  return { ctx: null, alarmOsc: null, alarmGain: null };
}

function ensure(audio) {
  if (!audio.ctx) {
    try {
      audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      audio.ctx = null;
    }
  }
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}

function blip(audio, freq, seconds, type, volume, when = 0) {
  const ctx = ensure(audio);
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

export function playCue(audio, name) {
  const ctx = ensure(audio);
  if (!ctx) return;
  if (name === 'gem') blip(audio, 880, 0.12, 'sine', 0.12);
  else if (name === 'diamond') {
    blip(audio, 660, 0.12, 'sine', 0.14);
    blip(audio, 990, 0.18, 'sine', 0.14, 0.1);
  } else if (name === 'smoke') blip(audio, 220, 0.25, 'triangle', 0.1);
  else if (name === 'emp') blip(audio, 1400, 0.2, 'square', 0.06);
  else if (name === 'coin') blip(audio, 1200, 0.08, 'sine', 0.1);
  else if (name === 'caught') {
    blip(audio, 220, 0.3, 'sawtooth', 0.14);
    blip(audio, 165, 0.45, 'sawtooth', 0.14, 0.25);
  } else if (name === 'win') {
    [523, 659, 784, 1047].forEach((f, i) => blip(audio, f, 0.22, 'sine', 0.13, i * 0.12));
  }
}

// A pulsing alarm tone while the thief is in a cone. Called every frame;
// it starts and stops the loop itself.
export function setAlarmTone(audio, on) {
  const ctx = ensure(audio);
  if (!ctx) return;
  if (on && !audio.alarmOsc) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 620;
    gain.gain.value = 0.03;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    lfo.start();
    audio.alarmOsc = osc;
    audio.alarmGain = gain;
    audio.alarmLfo = lfo;
  } else if (!on && audio.alarmOsc) {
    try {
      audio.alarmOsc.stop();
      audio.alarmLfo.stop();
    } catch (err) { /* already stopped */ }
    audio.alarmOsc = null;
    audio.alarmGain = null;
    audio.alarmLfo = null;
  }
}
