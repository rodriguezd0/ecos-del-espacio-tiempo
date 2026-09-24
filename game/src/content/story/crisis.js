// La crisis global (docs/CAMPANA.md §3.1, D19): fase 0–4 derivada de los Pilares restaurados, más el
// «cielo restablecido» tras Arceus. Módulo PURO: la fase y la descripción de la capa de cielo (tono,
// aurora, luna, grietas, destellos). La aplica en los mapas exteriores content/story/crisisSky.js, como
// capa INDEPENDIENTE del reloj de día/noche (TEC-06): nunca altera tablas de encuentros ni accesos.
import { highestRestoredPillar } from './fragments.js';

/** Variable que fuerza una fase (escenas: el cielo se rompe antes de fijar el flag). Sin ella, derivada. */
export const CRISIS_OVERRIDE_VAR = 'crisis_phase';
export const CRISIS_RESTORED = 5;
/** Flag de fin del juego base (CAMPANA B21): tras Arceus el cielo se restablece. */
export const GAME_CLEARED_FLAG = 'game_cleared';

export const CRISIS_PHASES = Object.freeze([
  { phase: 0, name: 'Temblores', span: 'Apertura–P2', signals: 'Temblores nocturnos, destello verde, Pokémon inquietos' },
  { phase: 1, name: 'Tormentas secas', span: 'P3–P5', signals: 'Tormentas secas, flores fuera de temporada, Absol en las rutas' },
  { phase: 2, name: 'Atardeceres largos', span: 'P6–P7', signals: 'Atardeceres de dos horas, estrellas que tiemblan' },
  { phase: 3, name: 'Eclipse de Convergencia', span: 'P8–P10', signals: 'Luna agrandada con anillo violeta, auroras en todo Axis, grietas luminosas' },
  { phase: 4, name: 'Falsa calma', span: 'Tras P10', signals: 'Las grietas se cierran; la luna sigue grande y el cielo zumba' },
  { phase: 5, name: 'Cielo restablecido', span: 'Tras Arceus', signals: '' },
].map(Object.freeze));

/**
 * Fase derivada de los flags: 0 hasta P2 · 1 desde P3 · 2 desde P6 · 3 desde P8 (el cielo se rompe al salir del
 * P8) · 4 desde P10 · 5 (restablecido) con game_cleared.
 */
export function derivedCrisisPhase(state) {
  if (state.flag(GAME_CLEARED_FLAG)) return CRISIS_RESTORED;
  const top = highestRestoredPillar(state);
  if (top >= 10) return 4;
  if (top >= 8) return 3;
  if (top >= 6) return 2;
  if (top >= 3) return 1;
  return 0;
}

/** Fase vigente: la forzada con setCrisisPhase (variable crisis_phase) o la derivada. */
export function crisisPhase(state) {
  const forced = state.var(CRISIS_OVERRIDE_VAR, null);
  if (forced !== null && forced !== undefined && forced !== '') {
    const n = Number(forced);
    if (Number.isInteger(n) && n >= 0 && n <= CRISIS_RESTORED) return n;
  }
  return derivedCrisisPhase(state);
}

/**
 * Intensidad 0..1 dentro de la fase. La fase 2 entra «gradual» con el P6 y se hace visible tras Talasa
 * (b13_talasa); el resto, plena.
 */
export function crisisIntensity(state, phase = crisisPhase(state)) {
  if (phase === 2 && state.var(CRISIS_OVERRIDE_VAR, null) === null && !state.flag('b13_talasa')) return 0.55;
  return 1;
}

const layer = (d) => Object.freeze({
  tone: [0, 0, 0, 0], eveningTone: null, aurora: null, moon: null, cracks: 0,
  ambient: null, ...d,
});

/**
 * Capa de cielo de una fase (datos para crisisSky): tone [r,g,b,gris] constante; eveningTone extra entre
 * 16:00 y 21:00 (atardeceres largos); aurora/moon opciones de efecto; cracks = nº de grietas;
 * ambient = destellos/temblores periódicos { kind, color, alpha, every:[min,max] s, night }.
 */
export function crisisLayer(phase) {
  switch (phase) {
    case 0:
      return layer({ ambient: { kind: 'tremor', color: [96, 255, 128], alpha: 70, every: [45, 90], night: true } });
    case 1:
      return layer({ tone: [-6, -6, -2, 26], ambient: { kind: 'dryLightning', color: [255, 255, 240], alpha: 110, every: [35, 80], night: false } });
    case 2:
      return layer({ tone: [14, 0, -12, 8], eveningTone: [34, 6, -30, 0] });
    case 3:
      return layer({
        tone: [-12, -22, 26, 36],
        aurora: { color: [110, 255, 170], alpha: 0.9 },
        moon: { x: 404, y: 76, radius: 64, color: [236, 214, 255], alpha: 0.85 },
        cracks: 2,
      });
    case 4:
      return layer({ tone: [-4, -10, 12, 22], moon: { x: 404, y: 76, radius: 58, color: [248, 240, 228], alpha: 0.75 } });
    default:
      return layer({});
  }
}

const EVENING_START = 16 * 60;
const EVENING_PEAK = 19 * 60;
const EVENING_END = 21 * 60;

/** Peso 0..1 del «atardecer largo» según la hora del reloj de juego. */
export function eveningWeight(minutes) {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  if (m <= EVENING_START || m >= EVENING_END) return 0;
  if (m <= EVENING_PEAK) return (m - EVENING_START) / (EVENING_PEAK - EVENING_START);
  return 1 - (m - EVENING_PEAK) / (EVENING_END - EVENING_PEAK);
}

/** Tono final de la capa de crisis (se suma al de día/noche y al del mapa). */
export function crisisTone(lay, minutes, intensity = 1) {
  const w = lay.eveningTone ? eveningWeight(minutes) : 0;
  return lay.tone.map((v, i) => Math.round((v + (lay.eveningTone ? lay.eveningTone[i] * w : 0)) * intensity));
}

/** ¿Se aplica la capa en este mapa? Solo exteriores; un mapa puede excluirse con `crisis: false`. */
export function crisisAppliesTo(def) {
  return Boolean(def && def.outdoor && def.crisis !== false);
}

/**
 * Calma local (efecto real de cada Pilar, CAMPANA §3.1): tras restaurarse, su comarca deja de sentir los destellos y
 * temblores ambientales aunque la fase global siga. B02: «cesan los temblores alrededor de Villa Alba». mapa → flag.
 */
export const LOCAL_CALM = Object.freeze({
  villa_alba: 'p1_restored', ruta_1: 'p1_restored', laberinto_profundidad: 'p1_restored',
  villa_zaguan: 'p1_restored', explanada_umbral: 'p1_restored',
});

/** ¿Está en calma (sin temblores ambientales) este mapa? */
export function ambientCalm(state, mapId) {
  const flag = LOCAL_CALM[mapId];
  return Boolean(flag && state?.flag?.(flag));
}
