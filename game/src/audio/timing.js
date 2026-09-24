// Cálculos puros del mezclador (sin WebAudio): posición en bucle, volúmenes y tono.
// Separados para poder probarlos con node --test.

export const FRAME_SEC = 1 / 60;

/** Frames lógicos (60 Hz) → segundos. Acepta `true` como `fallbackFrames`. */
export function framesToSeconds(frames, fallbackFrames = 0) {
  if (frames === true) return fallbackFrames * FRAME_SEC;
  const n = Number(frames);
  return Number.isFinite(n) && n > 0 ? n * FRAME_SEC : 0;
}

/**
 * Volumen a ganancia 0..1. Acepta 0..1 o la escala de RPG Maker 0..100 (valores > 1).
 * `fallback` si no es un número válido.
 */
export function normalizeVolume(v, fallback = 1) {
  const n = Number(v);
  if (v === undefined || v === null || !Number.isFinite(n)) return fallback;
  const g = n > 1 ? n / 100 : n;
  return Math.min(Math.max(g, 0), 1);
}

/**
 * Tono a playbackRate. Acepta la escala de RPG Maker (100 = normal, 75 = grave)
 * o un factor directo (1 = normal) si el valor es ≤ 4.
 */
export function normalizePitch(p, fallback = 1) {
  const n = Number(p);
  if (p === undefined || p === null || !Number.isFinite(n) || n <= 0) return fallback;
  const rate = n > 4 ? n / 100 : n;
  return Math.min(Math.max(rate, 0.25), 4);
}

/**
 * Posición de reproducción (s) de una pista en bucle.
 * offset: posición inicial (s); elapsed: tiempo real transcurrido (s); rate: playbackRate;
 * loopStart/loopEnd (s): región de bucle (loopEnd > loopStart) o null para sin bucle.
 */
export function loopPosition(offset, elapsed, rate, loopStart, loopEnd, duration = Infinity) {
  const pos = offset + Math.max(0, elapsed) * rate;
  if (loopEnd === null || loopEnd === undefined || !(loopEnd > loopStart)) return Math.min(pos, duration);
  if (pos < loopEnd) return pos;
  const span = loopEnd - loopStart;
  return loopStart + ((pos - loopStart) % span);
}

/** Ajusta una posición de reanudación para que caiga dentro del archivo/bucle. */
export function clampResumeOffset(pos, loopStart, loopEnd, duration) {
  if (!Number.isFinite(pos) || pos < 0) return 0;
  if (loopEnd > loopStart && pos >= loopEnd) return loopPosition(pos, 0, 1, loopStart, loopEnd);
  if (pos >= duration) return loopEnd > loopStart ? loopStart : 0;
  return pos;
}

/** Región de bucle para un AudioBufferSourceNode: la del archivo o el archivo completo. */
export function loopRegion(loop, duration) {
  if (loop && loop.endSec > loop.startSec && loop.startSec < duration) {
    return { loopStart: loop.startSec, loopEnd: Math.min(loop.endSec, duration), fromTags: true };
  }
  return { loopStart: 0, loopEnd: duration, fromTags: false };
}

/**
 * Lee los volúmenes por categoría de engine.state.options (si existen).
 * bgm ← bgmVolume · se ← seVolume · me ← meVolume ?? bgmVolume · cry ← cryVolume ?? seVolume.
 * Devuelve solo las categorías con valor numérico.
 */
export function volumesFromOptions(options) {
  if (!options || typeof options !== 'object') return {};
  const pick = (...keys) => {
    for (const k of keys) {
      if (typeof options[k] === 'number' && Number.isFinite(options[k])) return normalizeVolume(options[k]);
    }
    return undefined;
  };
  const out = { bgm: pick('bgmVolume'), se: pick('seVolume'), me: pick('meVolume', 'bgmVolume'), cry: pick('cryVolume', 'seVolume') };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}
