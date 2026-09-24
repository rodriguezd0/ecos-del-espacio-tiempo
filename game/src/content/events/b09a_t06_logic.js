// T06 «El Museo de las Eras» (docs/TABLILLAS.md §4.6): reglas PURAS de la Sala de Réplicas (sin ctx), para los eventos
// (b09a_t06.js) y las pruebas. Seis losas y cuatro pistas repartidas por el museo:
//   1. el peso anotado en la ficha de inventario de 1962 (y la báscula del taller, que da el peso de cada palé);
//   2. una foto de hace 40 años: grieta en forma de «Y» en la esquina inferior izquierda;
//   3. en el borde, los glifos Unown dicen «EJE» solo en la original (las réplicas se copiaron de una foto en la que una
//      etiqueta tapaba un glifo);
//   4. la original conserva el frío.
// El Core confirma solo al final. Un error hace que Rosalía diga «No» y la sala se reinicia (los palés se recolocan).
import { V, CLUE_BIT } from './b09a_common.js';

/** Peso de la ficha de inventario de 1962. */
export const ORIGINAL_WEIGHT = '41,6';

/**
 * Las seis losas. `pallet` = número estarcido en su palé (no cambia: las etiquetas de papel sí se cambiaron).
 * Cada réplica falla al menos una de las pistas; varias coinciden en peso y grieta con la original.
 */
export const SLABS = Object.freeze([
  Object.freeze({ id: 'R2', pallet: 1, weight: '38,9', crack: 'Y', corner: 'izquierda', glyphs: 'EFE', cold: false, label: 'RÉPLICA 4' }),
  Object.freeze({ id: 'R1', pallet: 2, weight: '41,6', crack: 'Y', corner: 'derecha', glyphs: 'ELE', cold: false, label: 'ORIGINAL' }),
  Object.freeze({ id: 'O', pallet: 3, weight: '41,6', crack: 'Y', corner: 'izquierda', glyphs: 'EJE', cold: true, label: 'RÉPLICA 2' }),
  Object.freeze({ id: 'R4', pallet: 4, weight: '43,2', crack: 'Y', corner: 'izquierda', glyphs: 'EIE', cold: false, label: 'RÉPLICA 1' }),
  Object.freeze({ id: 'R3', pallet: 5, weight: '41,6', crack: 'recta', corner: 'izquierda', glyphs: 'ETE', cold: false, label: 'RÉPLICA 5' }),
  Object.freeze({ id: 'R5', pallet: 6, weight: '41,6', crack: 'Y', corner: 'izquierda', glyphs: 'EKE', cold: false, label: 'RÉPLICA 3' }),
]);

/** Recolocaciones de los palés (posición → índice en SLABS) tras cada error. */
export const LAYOUTS = Object.freeze([
  Object.freeze([0, 1, 2, 3, 4, 5]),
  Object.freeze([3, 5, 0, 2, 1, 4]),
  Object.freeze([2, 4, 5, 1, 3, 0]),
  Object.freeze([5, 0, 3, 4, 2, 1]),
]);

export const isOriginal = (slab) => Boolean(slab) && slab.id === 'O';

/** Losa en la posición `pos` (0–5) según los intentos fallidos (var b09_t06_intento). */
export function slabAt(state, pos) {
  const n = Math.max(0, Number(state.var(V.t06Try, 0)) || 0);
  const layout = LAYOUTS[n % LAYOUTS.length];
  return SLABS[layout[pos]] || null;
}

/** Posición actual de la original. */
export function originalPosition(state) {
  for (let i = 0; i < SLABS.length; i++) if (isOriginal(slabAt(state, i))) return i;
  return -1;
}

export function hasClue(state, bit) {
  return (Number(state.var(V.t06Clues, 0)) & bit) !== 0;
}

/** Nueva máscara de pistas (no modifica el estado). */
export const withClue = (mask, bit) => (Number(mask) || 0) | bit;

/** Número de pistas encontradas (0–4; el peso cuenta cuando se tienen la ficha y la báscula). */
export function cluesFound(state) {
  let n = 0;
  if (hasClue(state, CLUE_BIT.weight) && hasClue(state, CLUE_BIT.scale)) n += 1;
  for (const b of [CLUE_BIT.photo, CLUE_BIT.glyphs, CLUE_BIT.cold]) if (hasClue(state, b)) n += 1;
  return n;
}

/** Líneas que se leen al examinar una losa (lo que se ve siempre y lo que depende de las pistas). */
export function describeSlab(state, slab) {
  const out = [`Palé número ${slab.pallet}. La etiqueta de papel dice «${slab.label}».`];
  out.push(slab.crack === 'Y'
    ? `Una losa de metal oscuro con relieves gastados. Tiene una grieta en forma de «Y» en la esquina inferior ${slab.corner}.`
    : `Una losa de metal oscuro con relieves gastados. Una grieta recta cruza la esquina inferior ${slab.corner}.`);
  if (hasClue(state, CLUE_BIT.scale)) out.push(`Según la báscula del taller, el palé ${slab.pallet} pesa ${slab.weight} kg.`);
  out.push(slab.cold ? 'Al tocarla, el metal está helado. Mucho más frío que el aire del sótano.' : 'Al tocarla, el metal está a la misma temperatura que la sala.');
  return out;
}

/** Texto de la báscula del taller (pesos por palé, en el orden en que entraron). */
export function scaleTicket() {
  return SLABS.map((s) => `Palé ${s.pallet}: ${s.weight} kg`).join(' · ');
}

/** Notas que se apuntan en la Libreta al encontrar cada pista (notas sueltas: no ocupan hueco). */
export const CLUE_NOTES = Object.freeze({
  weight: { id: 'b09_nota_peso', text: `Inventario de 1962: la losa votiva de Antea pesa ${ORIGINAL_WEIGHT} kg.` },
  scale: { id: 'b09_nota_bascula', text: 'La báscula del taller guarda el peso de los seis palés de los «restauradores».' },
  photo: { id: 'b09_nota_foto', text: 'Foto de hace 40 años: la losa tiene una grieta en forma de «Y» en la esquina inferior izquierda.' },
  glyphs: { id: 'b09_nota_glifos', text: 'Calco del borde: los glifos Unown dicen «EJE». Las réplicas se copiaron de una foto con una etiqueta encima.' },
  cold: { id: 'b09_nota_frio', text: 'La vitrina de la losa se agrietaba cada noche: la original conserva el frío.' },
});
