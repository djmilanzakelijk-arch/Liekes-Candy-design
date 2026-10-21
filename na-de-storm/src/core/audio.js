// Alle geluid wordt live gemaakt met de Web Audio API: een zachte ruimtetoon,
// voetstappen en kleine interactiegeluiden. Er worden geen geluidsbestanden of
// bestaande muziek gebruikt, dus er zijn geen licentieproblemen.
// Audio start pas na een klik van de bezoeker (browserregel).

const MOODS = {
  entree: { notes: [110, 164.8, 220], cutoff: 700 },
  crisis: { notes: [98, 116.5, 146.8], cutoff: 420 },   // donker, mineur
  mens: { notes: [110, 130.8, 164.8], cutoff: 520 },
  droom: { notes: [103.8, 155.6, 207.7], cutoff: 650 },
  abstract: { notes: [130.8, 196, 246.9], cutoff: 900 },
  toekomst: { notes: [146.8, 220, 277.2], cutoff: 1100 }, // open, majeur
  finale: { notes: [130.8, 196, 329.6], cutoff: 1300 }
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.6;
    this.floor = 'stone';
  }

  async start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') await this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(ctx.destination);

    // galm met een zelfgemaakte impulsrespons
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(2.8, 2.2);
    this.wet = ctx.createGain(); this.wet.gain.value = 0.35;
    this.reverb.connect(this.wet).connect(this.master);
    this.dry = ctx.createGain(); this.dry.gain.value = 1;
    this.dry.connect(this.master);

    // ruimtetoon: gefilterde bruine ruis
    const noise = ctx.createBufferSource();
    noise.buffer = this.brownNoise(4);
    noise.loop = true;
    this.roomFilter = ctx.createBiquadFilter();
    this.roomFilter.type = 'lowpass'; this.roomFilter.frequency.value = 500;
    const roomGain = ctx.createGain(); roomGain.gain.value = 0.05;
    noise.connect(this.roomFilter).connect(roomGain).connect(this.dry);
    noise.start();

    // zachte akkoordklank
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass'; this.padFilter.frequency.value = 600; this.padFilter.Q.value = 0.4;
    this.padGain = ctx.createGain(); this.padGain.gain.value = 0.0;
    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.dry); this.padGain.connect(this.reverb);
    this.oscs = MOODS.entree.notes.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 4;
      const g = ctx.createGain(); g.gain.value = i === 0 ? 0.5 : 0.22;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.12;
      lfo.connect(lfoGain).connect(g.gain);
      o.connect(g).connect(this.padFilter);
      o.start(); lfo.start();
      return o;
    });
    this.padGain.gain.setTargetAtTime(0.05, ctx.currentTime, 3);
  }

  impulse(seconds, decay) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  brownNoise(seconds) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  setMood(mood, roomSize = 1) {
    if (!this.ctx) return;
    const m = MOODS[mood] || MOODS.entree;
    const t = this.ctx.currentTime;
    this.oscs.forEach((o, i) => o.frequency.setTargetAtTime(m.notes[i], t, 2.5));
    this.padFilter.frequency.setTargetAtTime(m.cutoff, t, 2);
    this.roomFilter.frequency.setTargetAtTime(380 + m.cutoff * 0.3, t, 2);
    this.wet.gain.setTargetAtTime(0.2 + Math.min(0.4, roomSize * 0.04), t, 1.5);
  }

  setFloor(type) { this.floor = type; }

  step(run = false) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const len = 0.09;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    const wood = this.floor.startsWith('oak');
    bp.frequency.value = (wood ? 700 : 1400) + Math.random() * 500; bp.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.value = (run ? 0.22 : 0.15) * (wood ? 1.2 : 1);
    src.connect(bp).connect(g);
    g.connect(this.dry); g.connect(this.reverb);
    src.start(t);
    // lage plof
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(wood ? 110 : 80, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.06);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.12, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(og).connect(this.dry); o.start(t); o.stop(t + 0.1);
  }

  chime(up = true) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(up ? 523 : 659, t);
    o.frequency.exponentialRampToValueAtTime(up ? 784 : 440, t + 0.25);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g); g.connect(this.dry); g.connect(this.reverb);
    o.start(t); o.stop(t + 0.65);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.1);
  }

  setVolume(v) {
    this.volume = v;
    if (this.master && !this.muted) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  suspend() { this.ctx?.suspend(); }
  resume() { this.ctx?.resume(); }
}
