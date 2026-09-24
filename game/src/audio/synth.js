// Sonidos sintetizados/procesados con OfflineAudioContext (se renderizan una vez y se cachean
// como AudioBuffer; luego se reproducen como cualquier SE).
//  - core_signal : señal del Core. Biblia §5/§14: "grito de Porygon agudizado", electrónico, extraño
//                  y breve. Se procesa el grito real de PORYGON de Añil (tono alto, modulación en
//                  anillo, reducción de bits, filtro paso alto y eco corto). Sin grito → chirrido sintético.
//  - grass_rustle: roce de hierba (ruido filtrado). Añil no incluye un sonido de hierba.
//  - low_hp_beep : doble pitido de PS bajos.
// Todas son PROVISIONALES: la biblia indica que el archivo final de la señal necesita revisión.

const CORE = {
  rate: 1.85, // tono (Porygon agudizado)
  maxCrySec: 0.62, // brevedad
  tailSec: 0.32, // cola de eco
  ringHz: 1180, // modulación en anillo (timbre metálico/electrónico)
  ringMix: 0.55,
  crushSteps: 14, // reducción de bits (cuantización)
  highpassHz: 520,
  presenceHz: 2900,
  echoSec: 0.083,
  echoFeedback: 0.34,
  peak: 0.9,
};

function makeCrushCurve(steps) {
  const n = 4096;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  return curve;
}

/** Escala el buffer para que su pico sea `peak` (in situ). */
function normalizePeak(buffer, peak) {
  let max = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i++) max = Math.max(max, Math.abs(d[i]));
  }
  if (max < 1e-6) return buffer;
  const k = peak / max;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] *= k;
  }
  return buffer;
}

function offline(seconds, sampleRate, channels = 1) {
  const Ctor = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!Ctor) throw new Error('OfflineAudioContext no disponible');
  return new Ctor(channels, Math.max(1, Math.ceil(seconds * sampleRate)), sampleRate);
}

/** Cadena común de la señal: anillo + bits + filtros + eco → destino. Devuelve el nodo de entrada. */
function coreChain(ctx, endSec) {
  const input = ctx.createGain();
  const dry = ctx.createGain();
  dry.gain.value = 1 - CORE.ringMix;
  const ring = ctx.createGain();
  ring.gain.value = 0; // la ganancia la marca el oscilador → multiplicación (anillo)
  const carrier = ctx.createOscillator();
  carrier.type = 'sine';
  carrier.frequency.value = CORE.ringHz;
  const ringDepth = ctx.createGain();
  ringDepth.gain.value = CORE.ringMix * 2;
  carrier.connect(ringDepth).connect(ring.gain);
  carrier.start(0);
  carrier.stop(endSec);

  const crush = ctx.createWaveShaper();
  crush.curve = makeCrushCurve(CORE.crushSteps);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = CORE.highpassHz;
  const presence = ctx.createBiquadFilter();
  presence.type = 'peaking';
  presence.frequency.value = CORE.presenceHz;
  presence.gain.value = 5;
  const out = ctx.createGain();

  input.connect(dry).connect(crush);
  input.connect(ring).connect(crush);
  crush.connect(hp).connect(presence).connect(out);

  const delay = ctx.createDelay(1);
  delay.delayTime.value = CORE.echoSec;
  const fb = ctx.createGain();
  fb.gain.value = CORE.echoFeedback;
  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 3600;
  out.connect(delay).connect(damp).connect(fb).connect(delay);
  out.connect(ctx.destination);
  fb.connect(ctx.destination);
  return input;
}

async function renderCoreFromCry(cry, sampleRate) {
  const cryDur = Math.min(cry.duration / CORE.rate, CORE.maxCrySec);
  const total = cryDur + CORE.tailSec;
  const ctx = offline(total, sampleRate);
  const input = coreChain(ctx, total);
  const env = ctx.createGain();
  env.gain.setValueAtTime(1, 0);
  env.gain.setValueAtTime(1, Math.max(cryDur - 0.08, 0));
  env.gain.linearRampToValueAtTime(0, cryDur);
  env.connect(input);
  const main = ctx.createBufferSource();
  main.buffer = cry;
  main.playbackRate.value = CORE.rate;
  main.connect(env);
  main.start(0);
  main.stop(cryDur);
  // Pequeño "glitch": un fragmento repetido algo más agudo, muy breve.
  const glitch = ctx.createBufferSource();
  glitch.buffer = cry;
  glitch.playbackRate.value = CORE.rate * 1.12;
  const glitchGain = ctx.createGain();
  glitchGain.gain.value = 0.45;
  glitch.connect(glitchGain).connect(env);
  glitch.start(cryDur * 0.42, 0.05, 0.06);
  return normalizePeak(await ctx.startRendering(), CORE.peak);
}

async function renderCoreFallback(sampleRate) {
  const total = 0.75;
  const ctx = offline(total, sampleRate);
  const input = coreChain(ctx, total);
  [[0, 1400, 2600], [0.13, 1900, 1200], [0.24, 2300, 3100]].forEach(([t, f0, f1]) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    osc.connect(g).connect(input);
    osc.start(t);
    osc.stop(t + 0.12);
  });
  return normalizePeak(await ctx.startRendering(), CORE.peak);
}

async function renderGrassRustle(sampleRate) {
  const total = 0.16;
  const ctx = offline(total, sampleRate);
  const noise = ctx.createBuffer(1, Math.ceil(total * sampleRate), sampleRate);
  const d = noise.getChannelData(0);
  let seed = 1234567;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0; // determinista
    d[i] = (seed / 0xffffffff) * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3200;
  bp.Q.value = 0.8;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1300;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, 0);
  env.gain.linearRampToValueAtTime(0.7, 0.01);
  env.gain.exponentialRampToValueAtTime(0.12, 0.05);
  env.gain.linearRampToValueAtTime(0.35, 0.065);
  env.gain.exponentialRampToValueAtTime(0.001, total);
  src.connect(bp).connect(hp).connect(env).connect(ctx.destination);
  src.start(0);
  return normalizePeak(await ctx.startRendering(), 0.45);
}

async function renderLowHpBeep(sampleRate) {
  const total = 0.3;
  const ctx = offline(total, sampleRate);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 5000;
  lp.connect(ctx.destination);
  [0, 0.14].forEach((t) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1480;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.004);
    g.gain.setValueAtTime(0.3, t + 0.075);
    g.gain.linearRampToValueAtTime(0, t + 0.085);
    osc.connect(g).connect(lp);
    osc.start(t);
    osc.stop(t + 0.09);
  });
  return normalizePeak(await ctx.startRendering(), 0.5);
}

export const SYNTH_NAMES = ['core_signal', 'grass_rustle', 'low_hp_beep'];

/**
 * Renderiza un sonido sintetizado. `source`: AudioBuffer de origen (grito de PORYGON para core_signal).
 * → Promise<AudioBuffer>
 */
export async function renderSynth(name, { sampleRate = 44100, source = null } = {}) {
  switch (name) {
    case 'core_signal':
      return source ? renderCoreFromCry(source, sampleRate) : renderCoreFallback(sampleRate);
    case 'grass_rustle':
      return renderGrassRustle(sampleRate);
    case 'low_hp_beep':
      return renderLowHpBeep(sampleRate);
    default:
      throw new Error(`Sonido sintetizado desconocido: ${name}`);
  }
}
