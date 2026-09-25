// El baile del corro de Clefairy (docs/TABLILLAS.md T11: «imitar el baile del corro de Clefairy, una secuencia de
// ocho pasos sobre piedras que se encienden»). Reglas PURAS (se prueban con node --test):
//   · Ocho piedras en corro, numeradas en el sentido de las agujas del reloj desde la del norte (0–7).
//   · El corro enseña la secuencia DANCE (ocho pasos: una estrella que recorre todas las piedras una vez).
//   · El jugador la repite pisando las piedras: cada acierto enciende la piedra; un fallo apaga el corro y el baile
//     vuelve a empezar, sin más castigo (reintento libre). Al completar los ocho pasos se abre la gruta de la luna.

/** Casillas del corro (relativas al centro), en orden 0–7 desde el norte y en el sentido de las agujas del reloj. */
export const RING = Object.freeze([
  [0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2],
]);

/** Secuencia del baile: salta de tres en tres por el corro (estrella de ocho puntas). */
export const DANCE = Object.freeze([0, 3, 6, 1, 4, 7, 2, 5]);

export const STEPS = DANCE.length;

/** Estado inicial (o tras un fallo). */
export const danceStart = () => Object.freeze({ step: 0, lit: Object.freeze([]) });

/** Normaliza lo guardado en la variable (número de pasos acertados o un objeto antiguo). */
export function danceState(saved) {
  const n = Number(saved);
  if (!Number.isInteger(n) || n <= 0) return danceStart();
  const step = Math.min(STEPS, n);
  return Object.freeze({ step, lit: Object.freeze(DANCE.slice(0, step)) });
}

/**
 * Pisa la piedra `stone` con el baile en `state`. → { state, result } con result:
 *   'ok' (paso correcto) · 'done' (octavo paso: baile completo) · 'wrong' (fallo: vuelve a empezar) ·
 *   'again' (piedra ya encendida: no cuenta ni es fallo; cruzar el corro pisando una piedra encendida no castiga)
 */
export function danceStep(state, stone) {
  const st = state || danceStart();
  if (st.step >= STEPS) return { state: st, result: 'done' };
  if (DANCE[st.step] === stone) {
    const step = st.step + 1;
    const next = Object.freeze({ step, lit: Object.freeze(DANCE.slice(0, step)) });
    return { state: next, result: step >= STEPS ? 'done' : 'ok' };
  }
  if (st.lit.includes(stone)) return { state: st, result: 'again' };
  return { state: danceStart(), result: 'wrong' };
}

/** Casilla absoluta de la piedra `i` para un corro centrado en (cx, cy). */
export const stoneAt = (cx, cy, i) => [cx + RING[i][0], cy + RING[i][1]];

/** Tono (pitch 0–150) de la campanilla de cada piedra: una escala que sube con el número. */
export const stonePitch = (i) => 80 + i * 8;
