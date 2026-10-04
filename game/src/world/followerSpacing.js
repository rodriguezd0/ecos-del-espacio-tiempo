// Huellas del dibujo: caché de sesión, independiente del guardado y del renderer.
const footprints = new Map();
export const FOLLOWER_MARGIN_PX = 8;
export const FOLLOWER_MIN_TILES = 2;
const DIRECTIONS = [2, 4, 6, 8];

/** Unión de los píxeles opacos de cada dirección, relativa al ancla abajo-centro del dibujo. */
export function measureCharsetFootprint(rgba, width, height, { scale = 1, offset = false } = {}) {
  if (!rgba || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0
    || width % 4 || height % 4 || rgba.length < width * height * 4 || !Number.isFinite(scale) || scale <= 0) return null;
  const fw = width / 4, fh = height / 4, directions = {};
  for (let row = 0; row < 4; row++) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (let col = 0; col < 4; col++) for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      if (!rgba[((row * fh + y) * width + col * fw + x) * 4 + 3]) continue;
      left = Math.min(left, (x - fw / 2) * scale);
      right = Math.max(right, (x + 1 - fw / 2) * scale);
      top = Math.min(top, (y - fh) * scale + (offset ? 16 : 0));
      bottom = Math.max(bottom, (y + 1 - fh) * scale + (offset ? 16 : 0));
    }
    if (Number.isFinite(left)) directions[DIRECTIONS[row]] = { left, top, right, bottom };
  }
  if (!Object.keys(directions).length) return null;
  return Object.freeze({ scale, directions: Object.freeze(directions) });
}

/** Publicado una vez tras cargar la textura, a su escala de dibujo existente. */
export function registerCharsetFootprint(key, footprint) {
  if (!key || typeof key !== 'string' || !footprint?.directions) return false;
  const entries = Object.entries(footprint.directions);
  if (!entries.length || entries.some(([d]) => !DIRECTIONS.includes(Number(d)))) return false;
  for (const [, b] of entries) {
    if (!b || ![b.left, b.right, b.top, b.bottom].every(Number.isFinite) || b.left >= b.right || b.top >= b.bottom) return false;
  }
  footprints.set(key, Object.freeze({ ...footprint,
    directions: Object.freeze(Object.fromEntries(entries.map(([d,b]) => [d, Object.freeze({...b})]))) }));
  return true;
}

/** Antes de cargar: presupuesto conservador; la hoja real reemplaza esta reserva automáticamente. */
export function charsetFootprint(character, direction = character?.direction || 2) {
  const key = character?.characterName || '';
  const known = footprints.get(key)?.directions;
  if (known) return known[direction] || Object.values(known)[0];
  if (key === 'zygarde_core') return { left: -12, right: 12, top: -44, bottom: -16 };
  if (/^follower:ZYGARDE:1:/.test(key)) return { left: -28, right: 28, top: -48, bottom: 0 };
  if (/^follower:ZYGARDE:0:/.test(key)) return { left: -40, right: 40, top: -80, bottom: 0 };
  if (character?.isFollower) return { left: -48, right: 48, top: -96, bottom: 0 };
  return { left: -24, right: 24, top: -64, bottom: 0 };
}

/** Rectángulo realmente dibujado, o posición candidata ya asentada en una casilla de la trayectoria. */
export function followerBounds(character, position = null) {
  const b = charsetFootprint(character, position?.dir || character.direction);
  const x = position ? position.x * 32 + character.width * 16 + (character.xOffset || 0) : character.screenX();
  const y = (position ? position.y * 32 + 32 + (character.yOffset || 0) : character.screenY()) - (character.bobHeight || 0);
  return { left: x + b.left, right: x + b.right, top: y + b.top, bottom: y + b.bottom };
}

export function boundsSeparated(a, b, margin = FOLLOWER_MARGIN_PX) {
  return a.right + margin <= b.left || b.right + margin <= a.left
    || a.bottom + margin <= b.top || b.bottom + margin <= a.top;
}

/** Límite de interacción: distancia máxima que exige esta pareja en cualquiera de las direcciones. */
export function followerGapTiles(leader, follower) {
  let px = 0;
  for (const direction of DIRECTIONS) {
    const a = charsetFootprint(leader, direction), b = charsetFootprint(follower, direction);
    px = Math.max(px, a.right - b.left, b.right - a.left, a.bottom - b.top, b.bottom - a.top);
  }
  return Math.max(FOLLOWER_MIN_TILES, Math.ceil((px + FOLLOWER_MARGIN_PX) / 32));
}
