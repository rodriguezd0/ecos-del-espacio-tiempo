// Tamaño en el mapa de los Pokémon con gráfico "Followers" de Añil (acompañante y encuentros visibles). Módulo PURO.
//
// 25-09-2026, el creador: «En las ruinas vi un Onix con el sprite enorme» y «un Yanma bastante grande comparado con
// lo que mide». Las hojas de Añil (arte ×2) se dibujan 1:1 y varían de 64 a 175 px por fotograma sin relación con la
// altura real (Onix ocupa 164 px, casi el triple que el protagonista; Yanma, 58 px de alas con 1,2 m). Se limita la
// mayor dimensión opaca del sprite a un presupuesto proporcional a la altura de la especie, con un mínimo para los
// pequeños (el estilo chibi los hace grandes a propósito) y un máximo absoluto. Las escalas se redondean a 3/4 o 1/2
// para que el píxel siga nítido (el arte es ×2: 1/2 vuelve a su resolución real sin repartir píxeles irregulares).

/** Alto del protagonista en el mapa (px opacos del charset) y su altura de referencia en metros. */
export const PLAYER_SPRITE_PX = 58;
export const PLAYER_HEIGHT_M = 1.5;
/** Presupuesto mínimo y máximo (px) de la mayor dimensión opaca del sprite. */
export const FOLLOWER_MIN_PX = 48;
export const FOLLOWER_MAX_PX = 96;
/** Tolerancia: si basta con encoger menos de un 10 %, se deja a tamaño real. */
export const FOLLOWER_TOLERANCE = 0.9;
/** Especies excluidas (Zygarde: compañero narrativo con decisiones propias del autor). */
export const FOLLOWER_EXEMPT = Object.freeze(['ZYGARDE']);

/** Presupuesto (px) de la mayor dimensión del sprite según la altura real (m). */
export function followerBudget(heightM) {
  const h = Number(heightM) > 0 ? Number(heightM) : 0;
  const px = Math.round((PLAYER_SPRITE_PX * h) / PLAYER_HEIGHT_M);
  return Math.min(FOLLOWER_MAX_PX, Math.max(FOLLOWER_MIN_PX, px));
}

/** Escala del sprite (1, 0,75 o 0,5) para una mayor dimensión opaca `extentPx` y una altura real `heightM`. */
export function followerScale(extentPx, heightM, species = '') {
  if (FOLLOWER_EXEMPT.includes(species)) return 1;
  if (!(extentPx > 0)) return 1;
  const raw = followerBudget(heightM) / extentPx;
  if (raw >= FOLLOWER_TOLERANCE) return 1;
  return raw >= 0.625 ? 0.75 : 0.5;
}

/**
 * Mayor dimensión opaca (px) entre los 16 fotogramas de una hoja 4×4. `data` = RGBA (Uint8ClampedArray/Uint8Array)
 * de una imagen `width`×`height`.
 */
export function sheetContentExtent(data, width, height, cols = 4, rows = 4) {
  const fw = Math.floor(width / cols);
  const fh = Math.floor(height / rows);
  let extent = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let top = fh; let bottom = -1; let left = fw; let right = -1;
      for (let y = 0; y < fh; y++) {
        const row = (r * fh + y) * width + c * fw;
        for (let x = 0; x < fw; x++) {
          if (data[(row + x) * 4 + 3] === 0) continue;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
      if (bottom >= 0) extent = Math.max(extent, bottom - top + 1, right - left + 1);
    }
  }
  return extent;
}

/** 'follower:ESPECIE:forma:shiny' → { species, form } o null. */
export function parseFollowerKey(key) {
  if (typeof key !== 'string' || !key.startsWith('follower:')) return null;
  const [, species = '', form = '0'] = key.split(':');
  return species ? { species, form: Number(form) || 0 } : null;
}
