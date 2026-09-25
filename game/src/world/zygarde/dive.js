// Buceo: la burbuja de Zygarde (docs/CAMPANA.md §2.8). Lógica PURA del medidor de resonancia:
//  - 8 segmentos; en zonas profundas se pierde uno cada 5 s (las someras no gastan).
//  - Los respiraderos verdes y las bolsas de aire lo recargan (a < 40 s de recorrido entre sí).
//  - Si se agota: fundido y regreso al último respiradero, sin daño ni pérdida (world/zygarde/actions.js).
//  - Luz: radio 3 alrededor de Zygarde (5 si un Pokémon del equipo conoce Destello).
// Mapa submarino: `underwater: { shallow: [[x, y, w, h], …] }` en la definición (o `underwater: true`) y
// `dark` para la oscuridad; eventos `diveVent` (respiradero/bolsa), `diveCurrent` y `diveSpot` con `surface`.
// Punto equivalente (B13): `dive` en la superficie y `underwater.surface` en el fondo (ver divePoint/surfacePoint);
// bajo el agua, A sin nada delante ofrece emerger en la casilla equivalente (world/zygarde/actions.js#surfaceHere).

export const DIVE_SEGMENTS = 8;
export const DIVE_SEGMENT_FRAMES = 300; // 5 s a 60 fps
export const DIVE_LIGHT_TILES = 3;
export const DIVE_LIGHT_TILES_FLASH = 5;

export class DiveMeter {
  constructor(segments = DIVE_SEGMENTS) {
    this.max = segments;
    this.segments = segments;
    this.frames = 0;
  }

  get empty() { return this.segments <= 0; }
  /** Fracción del segmento en curso ya gastada (0..1), para el parpadeo del HUD. */
  get progress() { return this.frames / DIVE_SEGMENT_FRAMES; }

  /**
   * Avanza un fotograma. `deep` = el jugador está en zona profunda. Devuelve true justo cuando se agota.
   */
  tick(deep) {
    if (!deep || this.empty) return false;
    this.frames += 1;
    if (this.frames < DIVE_SEGMENT_FRAMES) return false;
    this.frames = 0;
    this.segments = Math.max(0, this.segments - 1);
    return this.segments === 0;
  }

  /** Recarga completa (respiradero o bolsa de aire). Devuelve true si faltaba algo. */
  refill() {
    const was = this.segments < this.max || this.frames > 0;
    this.segments = this.max;
    this.frames = 0;
    return was;
  }
}

/** Configuración submarina de un mapa (null si no lo es). */
export function underwaterConfig(def) {
  if (!def?.underwater) return null;
  const cfg = def.underwater === true ? {} : def.underwater;
  const out = { shallow: Array.isArray(cfg.shallow) ? cfg.shallow : [] };
  if (cfg.surface) out.surface = cfg.surface;
  return out;
}

// ── Punto equivalente superficie ↔ fondo (aditivo B13; lo reutilizan B14 y los DLC) ─────────────────────────────
// Mapa de superficie:  `dive: { map: 'fondo_x', dx = 0, dy = 0 }`            (casilla del fondo = x + dx, y + dy)
// Mapa submarino:      `underwater: { shallow, surface: { map, dx = 0, dy = 0, areas? } }`
//   `areas` = [[x, y, w, h]…] casillas del FONDO desde las que se puede emerger (agua abierta encima); sin `areas`,
//   desde cualquiera. Un `diveSpot` sin `to`/`tx`/`ty` usa esta correspondencia; con ellos, el destino fijo.
const inRects = (rects, x, y) => rects.some(([rx, ry, rw, rh]) => x >= rx && y >= ry && x < rx + rw && y < ry + rh);

/** Casilla del fondo bajo (x, y) de un mapa de superficie → { map, x, y } o null (el mapa no tiene fondo). */
export function divePoint(def, x, y) {
  const d = def?.dive;
  if (!d?.map) return null;
  return { map: d.map, x: x + (d.dx ?? 0), y: y + (d.dy ?? 0) };
}

/** Casilla de la superficie sobre (x, y) de un mapa submarino → { map, x, y } o null (tapado o sin superficie). */
export function surfacePoint(def, x, y) {
  const s = underwaterConfig(def)?.surface;
  if (!s?.map) return null;
  if (Array.isArray(s.areas) && !inRects(s.areas, x, y)) return null;
  return { map: s.map, x: x - (s.dx ?? 0), y: y - (s.dy ?? 0) };
}

/**
 * Destino de un evento `diveSpot` en (ev.x, ev.y) del mapa `def`: el fijo del evento (`to`, `tx`, `ty`) o, si falta
 * algo, el punto equivalente (divePoint al bajar, surfacePoint con `surface: true`). → { to, tx, ty, dir } o null.
 */
export function diveSpotTarget(def, d, x, y) {
  const up = Boolean(d?.surface);
  const eq = up ? surfacePoint(def, x, y) : divePoint(def, x, y);
  const to = d?.to ?? eq?.map ?? null;
  if (!to) return null;
  const same = eq && eq.map === to;
  const tx = d.tx ?? (same ? eq.x : null);
  const ty = d.ty ?? (same ? eq.y : null);
  if (!Number.isInteger(tx) || !Number.isInteger(ty)) return null;
  return { to, tx, ty, dir: d.dir ?? 2 };
}

/** ¿Es somera la casilla (no gasta resonancia)? */
export function isShallow(def, x, y) {
  const cfg = underwaterConfig(def);
  if (!cfg) return true;
  return cfg.shallow.some(([rx, ry, rw, rh]) => x >= rx && y >= ry && x < rx + rw && y < ry + rh);
}

/** ¿Conoce algún Pokémon del equipo el movimiento? */
export function partyKnowsMove(state, moveId) {
  return (state?.party || []).some((p) => !p?.egg && (p?.moves || []).some((m) => m?.id === moveId));
}

/** Radio de luz (px) bajo el agua: 3 casillas, 5 con Destello en el equipo. */
export function diveLightRadius(state) {
  const tiles = partyKnowsMove(state, 'FLASH') ? DIVE_LIGHT_TILES_FLASH : DIVE_LIGHT_TILES;
  return tiles * 32 + 16;
}
