// Audio del prólogo (nombres del catálogo o archivos de Añil). Todas las pistas son PROVISIONALES
// (biblia §14: "impactos, silencio, cambios de tiempo"; no hay partitura aprobada). Nunca lanza errores.
import { engine } from '../../core/engine.js';

const safe = (fn) => {
  try {
    const r = fn();
    if (r && typeof r.catch === 'function') r.catch((err) => console.warn('[prólogo] audio', err?.message || err));
  } catch (err) {
    console.warn('[prólogo] audio', err?.message || err);
  }
};

export const sfx = (name, opts = {}) => safe(() => engine.audio?.playSE?.(name, opts));
export const cry = (species, form = 0, opts = {}) => safe(() => engine.audio?.playCry?.(species, form, opts));
export const bgm = (name, opts = {}) => safe(() => engine.audio?.playBGM?.(name, opts));
export const stopBgm = (frames = 30) => safe(() => engine.audio?.stopBGM?.(frames));

/** Efectos usados (archivos de Audio/SE de Añil). */
export const SFX = Object.freeze({
  wind: 'PRSFX- Ominous Wind',
  steel: 'PRSFX- Flash Cannon',
  timeRoar: 'PRSFX- Roar of Time',
  pearl: 'PRSFX- Psycho Cut',
  slash: 'Anim/Slash10',
  shadow: 'PRSFX- Shadow Ball1',
  shadowClaw: 'PRSFX- Shadow Claw1',
  shadowForce: 'PRSFX- Shadow Force1',
  shadowForce2: 'PRSFX- Shadow Force2',
  rumble: 'Anim/Earth4',
  quake: 'PRSFX- Earthquake',
  rock: 'PRSFX- Rock Slide',
  rockHit: 'Rock Smash',
  waterfall: 'PRSFX- Waterfall1',
  waterfall2: 'PRSFX- Waterfall2',
  gather: 'PRSFX- Magical Leaf1',
  form: 'PRSFX- Psych Up',
  clash: 'PRSFX- Heavy Slam1',
  clash2: 'Anim/Blow6',
  seal: 'Anim/Saint7',
  scatter: 'PRSFX- Absorb2',
  fall: 'Anim/Saint4',
  impact: 'Anim/Explosion3',
});
