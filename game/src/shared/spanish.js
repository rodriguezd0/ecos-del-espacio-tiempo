// Utilidades de texto en castellano para mensajes compuestos con plantillas (módulo puro, sin DOM).
// Lo usan el motor de combate (battle/core/battle.js#fixSpanish, todos los pbDisplay) y la escena de combate.

// Las fronteras de palabra de JS (\b) no reconocen tildes ni eñes («cuña el» no es «a el»): se usan clases Unicode.
const CONTRACTION = /(?<![\p{L}\p{N}_])(de|a)( +)(el)(?![\p{L}\p{N}_])/giu;

/**
 * Aplica las contracciones obligatorias «de + el» → «del» y «a + el» → «al», también cuando el artículo va en
 * mayúscula por venir de un nombre compuesto («Los PS de El Nacli rival» → «Los PS del Nacli rival»,
 * «No afecta a El Pidove salvaje» → «No afecta al Pidove salvaje»). Conserva la mayúscula inicial de la
 * preposición («A el…» → «Al…»; «DE EL» → «DEL») y no toca el pronombre tónico «él» ni palabras que solo
 * contienen esas letras («Elekid», «delante»). Idempotente.
 * @param {unknown} text
 * @returns {string}
 */
export function contractArticles(text) {
  if (text == null) return '';
  return String(text).replace(CONTRACTION, (_match, prep, _space, article) => {
    const contracted = prep.toLowerCase() === 'de' ? 'del' : 'al';
    if (article === 'EL' && prep === prep.toUpperCase()) return contracted.toUpperCase();
    if (prep[0] === prep[0].toUpperCase()) return contracted[0].toUpperCase() + contracted.slice(1);
    return contracted;
  });
}
