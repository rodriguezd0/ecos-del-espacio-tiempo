// Ala del Saber (Uxie) — reglas puras (docs/CAMPANA.md B16; D17: «glifos de lo visto y lógica de caballeros y
// bribones», sin trivia arbitraria). Sin ctx ni DOM: lo usan los eventos (b16_saber.js), el mapa y las pruebas.
//   Ronda 1 «Lo que viste»: siete piedras con el glifo de la cámara de cada Pilar P1–P7 y siete relieves con lo que
//     reparó cada Pilar. Se lleva un glifo a su relieve; si no es el suyo, vuelve a su pedestal. Solo exige recordar el
//     propio viaje (la Libreta lo guarda en la pestaña «Diario»: content/story/journal.js + fragments.js).
//   Rondas 2 y 3 «Lo que se deduce»: 3 y luego 4 puertas; en cada inscripción, si todo lo que dice es cierto, dice la
//     verdad. Solo UNA inscripción dice la verdad y solo una puerta sigue adelante. Las inscripciones hablan de lo vivido.
//     Un error = el «olvido» de Uxie: la ronda vuelve a empezar con otras inscripciones (variante siguiente).
import { fragmentFor } from '../story/fragments.js';

// ─────────────────────────────── Ronda 1: glifos y relieves ───────────────────────────────

/** Relieve de cada Pilar: lo que reparó (CAMPANA B16: puertas que cierran, cauce, viento, peso, memoria, sombras, mareas). */
const RELIEF_TEXT = Object.freeze({
  1: 'Una puerta abierta de par en par que, por fin, vuelve a cerrarse.',
  2: 'Un río desbordado que vuelve a su cauce.',
  3: 'Un remolino de viento que encuentra de nuevo su camino.',
  4: 'Casas que se hundían y piedras que flotaban: la tierra recupera su peso.',
  5: 'Una niebla que se levanta y deja leer los nombres de una aldea.',
  6: 'Sombras que se colaban por una grieta y dejan de filtrarse.',
  7: 'Mareas que se llevaban a la gente y vuelven a su hora.',
});

/** Palabra clave de cada relieve (la prueba del Diario la busca en el efecto local de fragments.js). */
export const RELIEF_KEYWORD = Object.freeze({ 1: 'puertas', 2: 'cauce', 3: 'viento', 4: 'hundimiento', 5: 'niebla', 6: 'sombras', 7: 'mareas' });

const shortName = (n) => fragmentFor(n).name.replace(/^Pilar (del |de la |de los |de las )?/, '');

/** Los siete glifos (P1–P7): { n, pillar: 'Umbral', name: 'Pilar del Umbral', relief }. */
export const GLYPHS = Object.freeze([1, 2, 3, 4, 5, 6, 7].map((n) => Object.freeze({
  n, pillar: shortName(n), name: fragmentFor(n).name, relief: RELIEF_TEXT[n],
})));

/** Orden de los relieves en la pared (de izquierda a derecha): Pilar de cada relieve. Los pedestales van en orden P1–P7. */
export const RELIEF_ORDER = Object.freeze([4, 7, 1, 5, 2, 6, 3]);

export const ALL_PLACED = 0b1111111;
export const isPlaced = (mask, n) => Boolean((mask >> (n - 1)) & 1);
export const placeGlyph = (mask, n) => mask | (1 << (n - 1));
export const placedCount = (mask) => [1, 2, 3, 4, 5, 6, 7].filter((n) => isPlaced(mask, n)).length;

/**
 * Resultado de ofrecer el glifo `carried` al relieve del Pilar `relief` con la máscara `mask`:
 * { ok, mask, carried } — si acierta queda colocado (carried 0); si no, el glifo vuelve a su pedestal (carried 0).
 */
export function offerGlyph(mask, carried, relief) {
  if (!carried) return { ok: false, mask, carried: 0, empty: true };
  if (carried === relief && !isPlaced(mask, relief)) return { ok: true, mask: placeGlyph(mask, relief), carried: 0 };
  return { ok: false, mask, carried: 0 };
}

// ─────────────────────────────── Rondas 2 y 3: caballeros y bribones ───────────────────────────────

/**
 * Hechos del viaje con su verdad (canon de CAMPANA B02–B15). Los falsos son desmentibles por lo vivido.
 * Nota: el Albo no corría hacia atrás (en la crisis se desbordaba de día y se secaba de noche).
 */
export const FACTS = Object.freeze({
  casilda: { text: 'Casilda guarda el Pilar del Umbral.', truth: true },
  leandro: { text: 'Leandro guarda el Pilar de la Corriente.', truth: true },
  abril: { text: 'Abril guarda el Anillo de los Vientos.', truth: true },
  fermin: { text: 'Fermín guarda el Pilar de la Masa.', truth: true },
  olvido: { text: 'Olvido guarda el Archivo Hondo.', truth: true },
  invertido: { text: 'Nadie guarda el Pilar Invertido.', truth: true },
  mnemos: { text: 'La niebla del olvido cubría la Aldea Mnemos.', truth: true },
  bramaluna: { text: 'Bramaluna patrullaba las ruinas de Antea.', truth: true },
  nucleo5: { text: 'Gael te dio el quinto núcleo en Villa Boreal.', truth: true },
  albo: { text: 'El Albo corría hacia atrás.', truth: false },
  abrilGarganta: { text: 'Abril guardaba la Garganta del Albo.', truth: false },
  guardiana: { text: 'El Pilar Invertido tenía una guardiana.', truth: false },
  brontia: { text: 'La niebla del olvido cubría Villa Brontia.', truth: false },
  casildaGael: { text: 'Casilda dejó pasar a Gael.', truth: false },
});

const ROMAN = ['I', 'II', 'III', 'IV'];
export const roman = (i) => ROMAN[i - 1];

/**
 * Afirmación sobre la salida E (puerta 1..n) desde la puerta `self`:
 *   { is: k } la salida es la k · { not: k } no es la k · { here: true } · { notHere: true } · { oneOf: [..] }
 *   · { rightOf: true } está a la derecha de esta · { leftOf: true } está a la izquierda
 */
function claimTruth(claim, exit, self) {
  if (!claim) return true;
  if (claim.here) return exit === self;
  if (claim.notHere) return exit !== self;
  if (claim.is) return exit === claim.is;
  if (claim.not) return exit !== claim.not;
  if (claim.oneOf) return claim.oneOf.includes(exit);
  if (claim.rightOf) return exit > self;
  if (claim.leftOf) return exit < self;
  throw new Error(`Afirmación desconocida: ${JSON.stringify(claim)}`);
}

function claimText(claim, self) {
  if (claim.here) return 'La salida es esta puerta.';
  if (claim.notHere) return 'La salida no es esta puerta.';
  if (claim.is) return `La salida es la puerta ${roman(claim.is)}.`;
  if (claim.not) return `La salida no es la puerta ${roman(claim.not)}.`;
  if (claim.oneOf) return `La salida es la puerta ${claim.oneOf.map(roman).join(' o la ')}.`;
  if (claim.rightOf) return 'La salida está a la derecha de esta puerta.';
  if (claim.leftOf) return 'La salida está a la izquierda de esta puerta.';
  return '';
}

/** Verdad de una inscripción { fact?, claim? } en la puerta `self` si la salida es `exit` (conjunción). */
export function inscriptionTruth(ins, exit, self) {
  const fact = ins.fact ? FACTS[ins.fact] : null;
  if (ins.fact && !fact) throw new Error(`Hecho desconocido: ${ins.fact}`);
  return (fact ? fact.truth : true) && claimTruth(ins.claim, exit, self);
}

/** Texto de la inscripción de la puerta `self`. */
export function inscriptionText(ins, self) {
  const parts = [];
  if (ins.fact) parts.push(FACTS[ins.fact].text);
  if (ins.claim) parts.push(claimText(ins.claim, self));
  return `«${parts.join(' ')}»`;
}

const ins = (fact, claim) => Object.freeze({ fact, claim: claim ? Object.freeze(claim) : null });

/** Rondas: variantes (el «olvido» de Uxie pasa a la siguiente). Cada una tiene una única salida posible. */
export const ROUNDS = Object.freeze({
  3: Object.freeze([
    Object.freeze([ins('casilda', { notHere: true }), ins('albo', { here: true }), ins('leandro', { is: 2 })]),
    Object.freeze([ins('mnemos', { is: 3 }), ins(null, { not: 1 }), ins('abrilGarganta', { here: true })]),
    Object.freeze([ins(null, { not: 2 }), ins('nucleo5', { is: 3 }), ins('albo', { notHere: true })]),
  ]),
  4: Object.freeze([
    Object.freeze([ins('fermin', { rightOf: true }), ins('brontia', { here: true }), ins('invertido', { not: 4 }), ins('olvido', { oneOf: [1, 2] })]),
    Object.freeze([ins('guardiana', { here: true }), ins('bramaluna', { oneOf: [3, 4] }), ins(null, { not: 1 }), ins('casilda', { is: 3 })]),
    Object.freeze([ins('abril', { is: 2 }), ins(null, { leftOf: true }), ins('casildaGael', { here: true }), ins('olvido', { is: 2 })]),
  ]),
});

/** Salidas compatibles con «exactamente una inscripción dice la verdad». */
export function consistentExits(round) {
  const n = round.length;
  const out = [];
  for (let e = 1; e <= n; e++) {
    const trues = round.filter((x, i) => inscriptionTruth(x, e, i + 1)).length;
    if (trues === 1) out.push(e);
  }
  return out;
}

/** Salida de una ronda (lanza si el puzle no tiene solución única: se comprueba en las pruebas). */
export function roundExit(round) {
  const exits = consistentExits(round);
  if (exits.length !== 1) throw new Error(`Ronda sin solución única (${exits.join(', ') || 'ninguna'})`);
  return exits[0];
}

/** Variante vigente de una ronda de `doors` puertas según su contador de olvidos. */
export function roundVariant(doors, variantIndex) {
  const list = ROUNDS[doors];
  const i = ((Number(variantIndex) || 0) % list.length + list.length) % list.length;
  return list[i];
}

/** Reglas que se leen en la estela de cada sala de puertas. */
export const DOOR_RULES = Object.freeze([
  'Solo una de estas inscripciones dice la verdad. Solo una puerta sigue adelante.',
  'Una inscripción dice la verdad únicamente si todo lo que dice es cierto.',
]);
