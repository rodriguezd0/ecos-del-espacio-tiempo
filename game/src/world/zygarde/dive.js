// Buceo: la burbuja de Zygarde (docs/CAMPANA.md §2.8). Lógica PURA del medidor de resonancia:
//  - 8 segmentos; en zonas profundas se pierde uno cada 5 s (las someras no gastan).
//  - Los respiraderos verdes y las bolsas de aire lo recargan (a < 40 s de recorrido entre sí).
//  - Si se agota: fundido y regreso al último respiradero, sin daño ni pérdida (world/zygarde/actions.js).
//  - Luz: radio 3 alrededor de Zygarde (5 si un Pokémon del equipo conoce Destello).
// Mapa submarino: `underwater: { shallow: [[x, y, w, h], …] }` en la definición (o `underwater: true`) y
// `dark` para la oscuridad; eventos `diveVent` (respiradero/bolsa), `diveCurrent` y `diveSpot` con `surface`.

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
  return { shallow: Array.isArray(cfg.shallow) ? cfg.shallow : [] };
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
