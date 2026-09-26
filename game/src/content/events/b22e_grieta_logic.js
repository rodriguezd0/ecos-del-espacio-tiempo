// Reglas PURAS de las Paradojas de hierro de la Grieta del Porvenir (docs/CAMPANA.md B22, tabla «Paradoja · ID ·
// Condición»). Sin DOM ni motor: las usan los eventos, las pruebas y el E2E.
//   Ferrodada    IRONTREADS   rueda por el cauce seco; solo aparece si el jugador recorre el tramo a pie, sin montura
//   Ferrosaco    IRONBUNDLE   de noche, junto a la escarcha del borde; se acerca si el jugador se queda quieto 5 s
//   Ferropalmas  IRONHANDS    hay que embestir tres bloques de hierro hasta su plataforma
//   Ferrocuello  IRONJUGULIS  vuela en círculos solo al amanecer
//   Ferropolilla IRONMOTH     de noche; se acerca a la luz de Zygarde (radio mayor con Destello)
//   Ferropúas    IRONTHORNS   solo con tormenta («descansar hasta tormenta» en el Hotel Mirador de Lúmina)
//   Ferropaladín IRONVALIANT  al final de la grieta, a mediodía, tras haber visto a los otros seis
// Estáticos y visibles, nivel 70–72, captura normal. Si se debilitan sin capturarse, vuelven al descansar (CAMPANA §2.6).
import { paradoxFlag, restCount, F } from './b22e_common.js';

/** Franjas horarias del reloj de juego (horas [desde, hasta), TEC-06). La noche es la de render/dayNight.js. */
export const WINDOWS = Object.freeze({
  dawn: Object.freeze({ from: 5, to: 8, label: 'al amanecer' }),
  noon: Object.freeze({ from: 12, to: 14, label: 'a mediodía' }),
  night: Object.freeze({ from: 20, to: 6, label: 'de noche' }),
});

/** ¿Está la hora dentro de la franja? (la noche cruza la medianoche) */
export function inWindow(hour, id) {
  const w = WINDOWS[id];
  if (!w) throw new Error(`Franja desconocida: ${id}`);
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  return w.from < w.to ? h >= w.from && h < w.to : h >= w.from || h < w.to;
}

/** Esperas del campamento de Rosalía: hasta el comienzo de cada franja (minutos del día). */
export const WAITS = Object.freeze([
  Object.freeze({ id: 'dawn', label: 'Hasta el amanecer', minutes: 5 * 60 }),
  Object.freeze({ id: 'noon', label: 'Hasta mediodía', minutes: 12 * 60 }),
  Object.freeze({ id: 'night', label: 'Hasta la noche', minutes: 21 * 60 }),
]);

/** Minutos que hay que avanzar desde `current` hasta `target` (siempre hacia delante, 0..1439). */
export function minutesUntil(current, target) {
  const c = ((Math.floor(current) % 1440) + 1440) % 1440;
  const t = ((Math.floor(target) % 1440) + 1440) % 1440;
  return (t - c + 1440) % 1440;
}

/** Las siete Paradojas (orden de la tabla de CAMPANA). */
export const PARADOXES = Object.freeze([
  Object.freeze({ key: 'ferrodada', species: 'IRONTREADS', name: 'Ferrodada', level: 70, zone: 'cauce' }),
  Object.freeze({ key: 'ferrosaco', species: 'IRONBUNDLE', name: 'Ferrosaco', level: 70, zone: 'escarcha', window: 'night' }),
  Object.freeze({ key: 'ferropalmas', species: 'IRONHANDS', name: 'Ferropalmas', level: 71, zone: 'taller' }),
  Object.freeze({ key: 'ferrocuello', species: 'IRONJUGULIS', name: 'Ferrocuello', level: 71, zone: 'cuenca', window: 'dawn' }),
  Object.freeze({ key: 'ferropolilla', species: 'IRONMOTH', name: 'Ferropolilla', level: 71, zone: 'hondonada', window: 'night' }),
  Object.freeze({ key: 'ferropuas', species: 'IRONTHORNS', name: 'Ferropúas', level: 71, zone: 'tormenta', storm: true }),
  Object.freeze({ key: 'ferropaladin', species: 'IRONVALIANT', name: 'Ferropaladín', level: 72, zone: 'espolon', window: 'noon', afterSix: true }),
]);

export const paradoxByKey = (key) => PARADOXES.find((p) => p.key === key) || null;
/** Las seis que hay que haber visto antes de Ferropaladín. */
export const SIX = Object.freeze(PARADOXES.filter((p) => !p.afterSix).map((p) => p.key));

/** IVs de los encuentros estáticos: tres al máximo (como los encuentros fijos de los juegos modernos). */
export function staticIvs(key) {
  const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const seed = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  const picks = new Set();
  for (let i = 0; picks.size < 3; i++) picks.add(stats[(seed + i * 5) % 6]);
  return Object.fromEntries([...picks].map((s) => [s, 31]));
}

const dexSeen = (s, species) => Boolean(s?.data?.dex?.seen?.[species]);

/** ¿Se ha visto la Paradoja? (su combate empezó al menos una vez o está en la Pokédex como vista) */
export function paradoxSeen(s, key) {
  const p = paradoxByKey(key);
  return Boolean(s?.flag?.(paradoxFlag.seen(key))) || (p ? dexSeen(s, p.species) : false);
}

/** ¿Capturada? */
export const paradoxCaught = (s, key) => Boolean(s?.flag?.(paradoxFlag.caught(key)));

/** ¿Debilitada sin capturar y sin descansar desde entonces? */
export function paradoxResting(s, key) {
  const at = Number(s?.var?.(paradoxFlag.rest(key), -1));
  return Number.isFinite(at) && at >= 0 && restCount(s) <= at;
}

/** ¿Vio el jugador a las otras seis? */
export const seenSix = (s) => SIX.every((k) => paradoxSeen(s, k));

/** Hora actual del estado (0..23). */
export const hourOf = (s) => Math.floor(((s?.data?.clock?.minutes ?? 0) % 1440) / 60);

/**
 * Condición del momento (hora, tormenta, orden) para que la Paradoja esté en el mapa. Las condiciones «de acción»
 * (recorrer el cauce, quedarse quieto, los bloques, la luz) las comprueban los eventos; aquí solo lo que depende del
 * estado. `stormOn` = world/rest.js#stormActive(state).
 */
export function momentOk(s, key, { stormOn = false } = {}) {
  const p = paradoxByKey(key);
  if (!p) return false;
  if (p.window && !inWindow(hourOf(s), p.window)) return false;
  if (p.storm && !stormOn) return false;
  if (p.afterSix && !seenSix(s)) return false;
  if (key === 'ferropalmas' && !s?.flag?.(F.tallerResuelto)) return false;
  if (key === 'ferrodada' && !s?.flag?.(F.ferrodadaAparecida)) return false;
  return true;
}

/** ¿Está la Paradoja visible ahora? (no capturada, no descansando tras debilitarse y en su momento) */
export function paradoxPresent(s, key, opts = {}) {
  if (!s?.flag?.(F.cleared)) return false;
  if (paradoxCaught(s, key) || paradoxResting(s, key)) return false;
  return momentOk(s, key, opts);
}

/** Recuento de capturadas (0–7). */
export const caughtCount = (s) => PARADOXES.filter((p) => paradoxCaught(s, p.key)).length;

// ───────────────────────────── seguimiento del cauce (a pie) ─────────────────────────────

/**
 * Máquina del tramo del cauce. Estado: '' (sin empezar) | 'sur' | 'norte' (extremo por el que se entró a pie).
 *   · pisar una franja a pie → si se venía del otro extremo, 'done'; si no, empieza desde esa franja;
 *   · montar dentro del tramo → '' (hay que volver a empezar);
 *   · salir del tramo por un lado que no es franja no cuenta (solo las franjas cierran el recorrido).
 * → { next, done }
 */
export function cauceStep(current, { strip = null, riding = false } = {}) {
  if (riding) return { next: '', done: false };
  if (!strip) return { next: current, done: false };
  if (current && current !== strip) return { next: '', done: true };
  return { next: strip, done: false };
}

// ───────────────────────────── luz de la hondonada ─────────────────────────────

/** ¿Algún Pokémon del equipo conoce Destello? */
export const knowsFlash = (s) => (s?.party || []).some((p) => !p?.egg && (p?.moves || []).some((m) => m?.id === 'FLASH'));

/** Radio (casillas) de la luz de Zygarde en la hondonada: 3, o 5 con Destello en el equipo. */
export const mothRadius = (s, base = 3, flash = 5) => (knowsFlash(s) ? flash : base);

/** Distancia de Chebyshev (casillas) entre dos puntos. */
export const tileDistance = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

// ───────────────────────────── vuelo de Ferrocuello ─────────────────────────────

/** Ruta en anillo (sentido horario) por el borde del rectángulo `ring`, empezando en su esquina superior izquierda. */
export function ringRoute(ring) {
  const out = [];
  for (let i = 0; i < ring.x1 - ring.x0; i++) out.push('right');
  for (let i = 0; i < ring.y1 - ring.y0; i++) out.push('down');
  for (let i = 0; i < ring.x1 - ring.x0; i++) out.push('left');
  for (let i = 0; i < ring.y1 - ring.y0; i++) out.push('up');
  return out;
}
