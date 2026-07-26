/* ============================================================
   Procedural audio — no asset files, everything is synthesised.
   A calm pentatonic loop for music, short candy-shop SFX on top.
   ============================================================ */

import { S } from './state.js';
import { rand, pick } from './utils.js';

let ctx = null;
let masterGain = null, musicGain = null, sfxGain = null;
let musicTimer = null, started = false, beat = 0;

/** Lazily build the graph; browsers require a gesture before audio runs. */
function ensure(){
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();

  masterGain = ctx.createGain();
  masterGain.gain.value = S.settings.volume ?? .65;

  // gentle bus compression so nothing ever gets harsh
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 24;
  comp.ratio.value = 3; comp.attack.value = .006; comp.release.value = .25;

  musicGain = ctx.createGain(); musicGain.gain.value = .28;
  sfxGain   = ctx.createGain(); sfxGain.gain.value   = .5;

  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(comp);
  comp.connect(ctx.destination);

  // a small reverb tail makes everything feel roomy and soft
  const verb = ctx.createConvolver();
  verb.buffer = makeImpulse(1.8, 2.4);
  const verbSend = ctx.createGain(); verbSend.gain.value = .22;
  musicGain.connect(verbSend); sfxGain.connect(verbSend);
  verbSend.connect(verb); verb.connect(comp);

  return ctx;
}

function makeImpulse(seconds, decay){
  const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++){
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++){
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

export function unlock(){
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (S.settings.music && !started) startMusic();
}

export function setVolume(v){
  if (masterGain) masterGain.gain.setTargetAtTime(v, ctx.currentTime, .05);
}

export function setMusicEnabled(on){
  if (on) startMusic(); else stopMusic();
}

/* ── voices ──────────────────────────────────────────── */
function env(node, t0, a, d, peak = 1){
  const g = node.gain;
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(Math.max(peak, .0002), t0 + a);
  g.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

function tone({ freq, t0 = 0, dur = .3, type = 'sine', gain = .3, dest, detune = 0, glide = 0 }){
  const c = ensure(); if (!c) return;
  const when = c.currentTime + t0;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * glide), when + dur);
  if (detune) osc.detune.value = detune;
  env(g, when, Math.min(.02, dur * .2), dur, gain);
  osc.connect(g); g.connect(dest || sfxGain);
  osc.start(when); osc.stop(when + dur + .06);
}

function noise({ t0 = 0, dur = .18, gain = .18, hp = 900, lp = 7000, dest }){
  const c = ensure(); if (!c) return;
  const when = c.currentTime + t0;
  const len = Math.ceil(c.sampleRate * (dur + .05));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const bp1 = c.createBiquadFilter(); bp1.type = 'highpass'; bp1.frequency.value = hp;
  const bp2 = c.createBiquadFilter(); bp2.type = 'lowpass';  bp2.frequency.value = lp;
  const g = c.createGain(); env(g, when, .008, dur, gain);
  src.connect(bp1); bp1.connect(bp2); bp2.connect(g); g.connect(dest || sfxGain);
  src.start(when); src.stop(when + dur + .05);
}

/* ── SFX library ─────────────────────────────────────── */
const SFX = {
  tap:      () => tone({ freq:660, dur:.07, type:'triangle', gain:.14 }),
  pickup:   () => { tone({ freq:520, dur:.09, type:'sine', gain:.16, glide:1.5 }); },
  /** the satisfying "plip" when a decoration lands */
  place:    () => { tone({ freq:430, dur:.12, type:'sine', gain:.26, glide:1.9 });
                    noise({ dur:.06, gain:.07, hp:2200 }); },
  remove:   () => tone({ freq:340, dur:.12, type:'sine', gain:.18, glide:.5 }),
  sparkle:  () => { for (let i = 0; i < 5; i++)
                      tone({ freq:1200 + i * 420 + rand(-40,40), t0:i * .035, dur:.16, type:'sine', gain:.09 }); },
  coin:     () => { tone({ freq:1046, dur:.09, type:'square', gain:.10 });
                    tone({ freq:1568, t0:.06, dur:.16, type:'square', gain:.09 }); },
  gem:      () => { [1318,1760,2093].forEach((f,i) => tone({ freq:f, t0:i*.05, dur:.3, type:'triangle', gain:.11 })); },
  swipe:    () => noise({ dur:.14, gain:.06, hp:600, lp:3200 }),
  pour:     () => noise({ dur:.5, gain:.06, hp:400, lp:2400 }),
  error:    () => { tone({ freq:220, dur:.15, type:'sawtooth', gain:.10 });
                    tone({ freq:180, t0:.09, dur:.18, type:'sawtooth', gain:.09 }); },
  star:     () => { [784,988,1175,1568].forEach((f,i) =>
                      tone({ freq:f, t0:i*.075, dur:.42, type:'triangle', gain:.14 })); },
  perfect:  () => { [523,659,784,1046,1319].forEach((f,i) =>
                      tone({ freq:f, t0:i*.06, dur:.55, type:'sine', gain:.16 }));
                    noise({ t0:.05, dur:.5, gain:.05, hp:3000 }); },
  levelup:  () => { [392,523,659,784,1046].forEach((f,i) =>
                      tone({ freq:f, t0:i*.09, dur:.7, type:'triangle', gain:.17 })); },
  unlock:   () => { [659,880,1319].forEach((f,i) =>
                      tone({ freq:f, t0:i*.08, dur:.6, type:'sine', gain:.15 }));
                    noise({ t0:.1, dur:.4, gain:.05, hp:2500 }); },
  door:     () => { tone({ freq:880, dur:.13, type:'sine', gain:.13 });
                    tone({ freq:1174, t0:.1, dur:.2, type:'sine', gain:.11 }); },
  whoosh:   () => noise({ dur:.26, gain:.08, hp:300, lp:2000 }),
  fail:     () => { tone({ freq:330, dur:.2, type:'triangle', gain:.13, glide:.6 }); },
};

export function sfx(name){
  if (!S.settings.sfx) return;
  const c = ensure(); if (!c) return;
  if (c.state === 'suspended') c.resume();
  (SFX[name] || SFX.tap)();
}

export function haptic(pattern = 12){
  if (!S.settings.haptics) return;
  if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch {} }
}

/* ── Music: slow pentatonic pads + twinkles ──────────── */
// C major pentatonic across two octaves — impossible to sound wrong.
const SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 784.00, 880.00];
const CHORDS = [
  [130.81, 164.81, 196.00],  // C
  [146.83, 174.61, 220.00],  // Dm
  [174.61, 220.00, 261.63],  // F
  [196.00, 246.94, 293.66],  // G
  [164.81, 196.00, 246.94],  // Em
];

function musicStep(){
  const c = ensure(); if (!c || !S.settings.music) return;

  const bar = Math.floor(beat / 8);
  const chord = CHORDS[bar % CHORDS.length];

  // pad on the downbeat
  if (beat % 8 === 0){
    chord.forEach((f, i) => {
      tone({ freq:f, dur:3.6, type:'sine', gain:.075, dest:musicGain, detune:i * 3 });
      tone({ freq:f * 2, dur:3.2, type:'triangle', gain:.03, dest:musicGain, detune:-4 });
    });
  }

  // sparse melody — leaves plenty of silence so it stays calm
  if (Math.random() < .42){
    const note = pick(SCALE.slice(3));
    tone({ freq:note, dur:1.1 + rand(0,.6), type:'sine', gain:.055, dest:musicGain });
    if (Math.random() < .3)
      tone({ freq:note * 1.5, t0:.22, dur:.8, type:'sine', gain:.03, dest:musicGain });
  }

  // soft heartbeat bass
  if (beat % 4 === 0) tone({ freq:chord[0] / 2, dur:.9, type:'sine', gain:.06, dest:musicGain });

  beat = (beat + 1) % 40;
}

export function startMusic(){
  const c = ensure(); if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (musicTimer) return;
  started = true;
  musicStep();
  musicTimer = setInterval(musicStep, 640);   // ~94 BPM eighth notes
}

export function stopMusic(){
  if (musicTimer){ clearInterval(musicTimer); musicTimer = null; }
  started = false;
}

/** Duck the music briefly so a fanfare cuts through. */
export function duck(ms = 900){
  if (!musicGain || !ctx) return;
  const now = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setTargetAtTime(.08, now, .05);
  musicGain.gain.setTargetAtTime(.28, now + ms / 1000, .3);
}

// Pause music when the tab is hidden — nobody wants ghost audio.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopMusic();
  else if (S.settings.music) startMusic();
});
