// La profecía del elegido: diez versos en escritura Unown, uno por Pilar, y la confirmación de Arceus
// (docs/CAMPANA.md §3.0; D02, D02b, X10). Módulo PURO: datos + utilidades de texto (Unown y traducción).
// La Pokédex traduce los versos a medias hasta el P5; desde el P5 la Clave Glífica (GLYPHKEY) permite
// leer el Unown directamente: con ella la Libreta muestra todos los versos completos.

export const GLYPH_KEY = 'GLYPHKEY';
export const VERSE_COUNT = 10;
/** Flag de verso revelado (revealVerse). La confirmación usa 'verse_confirmation'. */
export const verseFlag = (n) => `verse_${n}`;
export const CONFIRMATION_FLAG = 'verse_confirmation';

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
export const numeral = (n) => NUMERALS[n - 1] || String(n);

const v = (n, pillarName, text, readBy, effect, keep = []) => Object.freeze({
  n, numeral: numeral(n), pillar: n, pillarName, text, readBy, effect, keep: Object.freeze(keep),
});

/** readBy = quién lo lee en escena; effect = efecto o línea asociada (§3.0). keep = palabras que la
 * traducción parcial conserva siempre (las que los personajes citan al leerlo a medias). */
export const VERSES = Object.freeze([
  v(1, 'Umbral', 'Cuando el que guarda el orden caiga en cien y cinco pedazos,', 'El Core, a medias',
    '«Cien. Y cinco. …Soy yo.» Casilda: «Serán números.»', ['cien', 'cinco']),
  v(2, 'Corriente', 'el agua olvidará su cauce,', 'El Core y Leandro', 'Describe lo que ya pasa en Caudal.', ['agua']),
  v(3, 'Impulso', 'el viento, su camino,', 'El Core y Abril', '', ['viento']),
  v(4, 'Masa', 'y la tierra, su peso.', 'El Core y Fermín', 'Los personajes notan que el texto va por delante de ellos.', ['tierra']),
  v(5, 'Memoria', 'Entonces uno caminará entre el tiempo y el espacio llevando consigo al guardián roto.',
    'Olvido completa I–V', '«Eres tú.» Gael lo leyó antes. Clave Glífica.', ['tiempo', 'espacio']),
  v(6, 'Invertido', 'Bajará donde el mundo se da la vuelta, y volverá.', 'El jugador', ''),
  v(7, 'Ecos', 'Oirá lo que fue sin quedarse en ello.', 'El jugador', ''),
  v(8, 'Alma', 'Sabrá, sentirá y querrá, y el guardián volverá a ser entero.', 'Lo recita el trío', 'Anticipa la Forma Completa.'),
  v(9, 'Convergencia', 'Donde el tiempo y el espacio se cruzan, atará a uno y dejará marchar al otro.', 'El jugador',
    'Anticipa la elección.'),
  v(10, 'Origen', 'Dos partirán del mismo alba: uno responderá a la llamada; el otro querrá ser quien llama. Y el que duerme despertará para medirlos.',
    'El jugador y Gael', '«Alba» es amanecer y es el pueblo.'),
]);

/** Confirmación final en Columna Lanza (no es un verso Unown: la dice Arceus). */
export const CONFIRMATION = Object.freeze({
  id: 'confirmation', place: 'Columna Lanza', speaker: 'Arceus',
  text: 'Respondiste a la llamada. Eres aquel del que hablaban las piedras.',
});

// La insinuación inicial ya existe en B01 §4.6 (no se repite aquí como verso).

export function verseFor(n) {
  return VERSES[Number(n) - 1] || null;
}

/** Quita acentos y diéresis (la ñ pasa a n): la escritura Unown solo tiene A–Z, ? y !. */
export function stripAccents(text) {
  return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Texto en «Unown»: mayúsculas A–Z, espacios, ? y ! (la fuente Annon de Añil dibuja cada letra como un Unown). */
export function unownText(text) {
  return stripAccents(text).toUpperCase().replace(/[¿¡]/g, '').replace(/[^A-Z?! ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MASK = '···';
const norm = (w) => stripAccents(w).toLowerCase();

const WORD_RE = /^([«"(]*)([\p{L}]+)([^\p{L}]*)$/u;

/**
 * Traducción parcial (la de la Pokédex antes de la Clave Glífica): se ocultan de forma determinista
 * palabras largas alternas (al menos una); se conservan siempre las de `keep` y las cortas (artículos, nexos).
 */
export function partialTranslation(text, { keep = [], seed = 0 } = {}) {
  const keepSet = new Set(keep.map(norm));
  const tokens = String(text ?? '').split(/(\s+)/);
  const eligible = [];
  tokens.forEach((tok, i) => {
    const m = tok.match(WORD_RE);
    if (m && m[2].length >= 4 && !keepSet.has(norm(m[2]))) eligible.push(i);
  });
  let masked = eligible.filter((_, k) => (k + 1 + seed) % 2 === 0);
  if (!masked.length && eligible.length) masked = [eligible[eligible.length - 1]];
  const hide = new Set(masked);
  return tokens.map((tok, i) => {
    if (!hide.has(i)) return tok;
    const [, pre, , post] = tok.match(WORD_RE);
    return `${pre}${MASK}${post}`;
  }).join('');
}

/** ¿Lee el jugador el Unown completo? (Clave Glífica en la mochila). */
export function hasGlyphKey(state) {
  return Boolean(state?.hasKeyItem?.(GLYPH_KEY));
}

/** Texto de la traducción de un verso según tenga o no la Clave Glífica. */
export function verseTranslation(verse, full) {
  if (!verse) return '';
  return full ? verse.text : partialTranslation(verse.text, { keep: verse.keep, seed: verse.n });
}

export function isVerseRevealed(state, n) {
  return state.flag(verseFlag(n));
}

/** Versos revelados en orden: [{ verse, full, translation, unown }]. */
export function revealedVerses(state) {
  const full = hasGlyphKey(state);
  return VERSES.filter((ve) => isVerseRevealed(state, ve.n)).map((ve) => ({
    verse: ve, full, translation: verseTranslation(ve, full), unown: unownText(ve.text),
  }));
}
