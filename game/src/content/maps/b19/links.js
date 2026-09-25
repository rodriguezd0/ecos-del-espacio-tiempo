// Enlaces del Bloque 19 con mapas de otros bloques (docs/CAMPANA.md §1.4: Sima del Eje «N Senda del Mirador · S Mirador
// Sur · E Calzada del Rey»; B19: la Calzada termina en la entrada de la Puerta de las Quince). Módulo puro.
//   · Senda del Mirador y Mirador Sur (B17): sus bordes con la Sima los ocupa el Puente de la Convergencia (B18), así
//     que la Sima se enlaza por WARPS al final de cada bajada (content/maps/b17/links.js lo pide así): en la Senda, la
//     cornisa x 11–12 termina en y 49 (pulsando abajo) y llega aquí a y 1; en el Mirador Sur, la cornisa x 3–4 empieza
//     en y 0 (pulsando arriba) y llega aquí a y 54. Las vueltas: Senda (x, 48) ↑ y Mirador Sur (x, 1) ↓.
//     `descentWarps(id)` da los warps que B19 añade (edición mínima y aditiva) en esos dos mapas.
//   · Puerta de las Quince (B20): warp del Umbral a su llegada (PUERTA.arrive = (16, 31) ↑); la vuelta la lee B20 de
//     `puertaQuinceArrival` en la definición de sima_eje.
// Si un destino aún no está registrado, el paso queda cerrado con un aviso neutro (eventos de b19_sima.js).
import { MAPS } from '../index.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

/**
 * Bajadas entre la Sima y los bordes de B17. `sima`: casillas del borde de la Sima donde se pulsa `simaDir`; `rim`:
 * casillas del final de la bajada en el mapa de B17 donde se pulsa `rimDir`. Las columnas coinciden (offset 0).
 */
export const DESCENTS = Object.freeze({
  senda_mirador: Object.freeze({
    xs: Object.freeze([11, 12]),
    sima: Object.freeze({ y: 0, dir: 8, arriveY: 1, arriveDir: 2 }),
    rim: Object.freeze({ y: 49, dir: 2, arriveY: 48, arriveDir: 8 }),
    blocked: 'La cornisa sube hacia la Senda del Mirador, pero un desprendimiento la corta.',
  }),
  mirador_sur: Object.freeze({
    xs: Object.freeze([3, 4]),
    sima: Object.freeze({ y: 55, dir: 2, arriveY: 54, arriveDir: 8 }),
    rim: Object.freeze({ y: 0, dir: 8, arriveY: 1, arriveDir: 2 }),
    blocked: 'La cornisa sube hacia el Mirador Sur, pero un desprendimiento la corta.',
  }),
});

/** Warps del borde de la Sima hacia los mapas de B17 que ya existen. */
export function simaEdgeWarps() {
  const out = [];
  for (const [to, d] of Object.entries(DESCENTS)) {
    if (!mapRegistered(to)) continue;
    for (const x of d.xs) out.push({ x, y: d.sima.y, to, tx: x, ty: d.rim.arriveY, dir: d.rim.arriveDir, dirTrigger: d.sima.dir });
  }
  return out;
}

/** Warps que B19 añade al final de la bajada de un mapa de B17 (`senda_mirador` | `mirador_sur`) hacia la Sima. */
export function descentWarps(from) {
  const d = DESCENTS[from];
  if (!d || !mapRegistered('sima_eje')) return [];
  return d.xs.map((x) => ({ x, y: d.rim.y, to: 'sima_eje', tx: x, ty: d.sima.arriveY, dir: d.sima.arriveDir, dirTrigger: d.rim.dir }));
}

/** Texto del aviso de una bajada cerrada (vecino aún sin registrar). */
export function blockedText(to) {
  return DESCENTS[to]?.blocked || 'Por ahora no puedes continuar.';
}

/** La Puerta de las Quince (B20): llegada de su mapa (content/maps/b20/layout.js PUERTA.arrive). */
export const PUERTA_QUINCE = Object.freeze({ map: 'puerta_quince', x: 16, y: 31, dir: 8 });
