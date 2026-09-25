// Modelo de mapa en tiempo de ejecución con la pasabilidad exacta de RMXP/Essentials
// (portado de 011_Game classes/005_Game_Map.rb). Módulo puro, sin DOM.
import { terrainTag, TERRAIN_NONE, canSurfFreely } from './terrain.js';

/** Bit de pasabilidad de una dirección RMXP (2 abajo=1, 4 izq=2, 6 der=4, 8 arriba=8; otras → 0). */
export function dirBit(d) {
  return d === 2 ? 1 : d === 4 ? 2 : d === 6 ? 4 : d === 8 ? 8 : 0;
}
/** Desplazamiento de una dirección (incluye diagonales 1,3,7,9). */
export const DX = [0, -1, 0, 1, -1, 0, 1, -1, 0, 1];
export const DY = [0, 1, 1, 1, 0, 0, 0, -1, -1, -1];
export const dx = (d) => DX[d] || 0;
export const dy = (d) => DY[d] || 0;
export const reverseDir = (d) => 10 - d;

export class GameMap {
  /**
   * @param {object} opts { id, def, built: { width, height, layers }, tileset: datos de tilesets.json }
   */
  constructor({ id, def = {}, built, tileset }) {
    if (!built || !tileset) throw new Error(`GameMap ${id}: faltan capas o tileset`);
    this.id = id;
    this.def = def;
    this.width = built.width;
    this.height = built.height;
    this.layers = built.layers;
    this.markers = built.markers || [];
    this.tileset = tileset;
    this.passages = tileset.passages;
    this.priorities = tileset.priorities;
    this.terrainTags = tileset.terrainTags;
    this.events = []; // eventos del mapa (los asigna World); se usan los que tienen tileId
    this.listeners = new Set();
    // Aditivo B18: con `def.voidBlocks` una casilla sin ningún tile (las tres capas vacías) es vacío y bloquea (el abismo
    // de la Sima se ve por el panorama). En RMXP una casilla vacía se pisa; sin la opción nada cambia.
    this.voidBlocks = Boolean(def?.voidBlocks);
  }

  valid(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  /** ¿Casilla sin ningún tile? (con `voidBlocks` bloquea el paso) */
  isVoid(x, y) { return this.valid(x, y) && !this.data(x, y, 0) && !this.data(x, y, 1) && !this.data(x, y, 2); }
  data(x, y, layer) { return this.valid(x, y) ? this.layers[layer][x + y * this.width] : 0; }
  terrainOf(tileId) { return terrainTag(this.terrainTags[tileId] || 0); }
  passage(tileId) { return this.passages[tileId] || 0; }
  priority(tileId) { return this.priorities[tileId] || 0; }

  /** Terrain tag efectivo de una celda (capas 2→1→0, ignora None y Neutral; puentes solo si bridge>0). */
  terrainTagAt(x, y, bridge = 0, countBridge = false) {
    if (!this.valid(x, y)) return TERRAIN_NONE;
    for (let i = 2; i >= 0; i--) {
      const id = this.data(x, y, i);
      if (!id) continue;
      const t = this.terrainOf(id);
      if (t.id === 'None' || t.ignorePassability) continue;
      if (!countBridge && t.bridge && bridge === 0) continue;
      return t;
    }
    return TERRAIN_NONE;
  }

  bush(x, y, bridge = 0) {
    for (let i = 2; i >= 0; i--) {
      const id = this.data(x, y, i);
      if (!id) continue;
      if (this.terrainOf(id).bridge && bridge > 0) return false;
      if ((this.passage(id) & 0x40) === 0x40) return true;
    }
    return false;
  }

  deepBush(x, y, bridge = 0) {
    for (let i = 2; i >= 0; i--) {
      const id = this.data(x, y, i);
      if (!id) continue;
      const t = this.terrainOf(id);
      if (t.bridge && bridge > 0) return false;
      if (t.deepBush && (this.passage(id) & 0x40) === 0x40) return true;
    }
    return false;
  }

  counter(x, y) {
    for (let i = 2; i >= 0; i--) {
      const id = this.data(x, y, i);
      if (!id) continue;
      if ((this.passage(id) & 0x80) === 0x80) return true;
    }
    return false;
  }

  /**
   * Game_Map#passable? — ¿se puede salir de/entrar en (x,y) por la dirección d?
   * `self` = personaje que se mueve (o null). `env` = { bridge, surfing, bicycle } del jugador.
   */
  passable(x, y, d, self = null, env = {}) {
    if (!this.valid(x, y)) return false;
    const bit = dirBit(d);
    // Eventos con gráfico de tile
    for (const ev of this.events) {
      if (!(ev.tileId > 0) || ev === self || ev.through || !ev.at(x, y)) continue;
      if (this.terrainOf(ev.tileId).ignorePassability) continue;
      const p = this.passage(ev.tileId);
      if (p & bit) return false;
      if ((p & 0x0f) === 0x0f) return false;
      if (this.priority(ev.tileId) === 0) return true;
    }
    if (self && self.isPlayer) return this.playerPassable(x, y, d, env);
    if (this.voidBlocks && this.isVoid(x, y)) return false;
    const nx = x + dx(d);
    const ny = y + dy(d);
    if (!this.valid(nx, ny)) return false;
    for (let i = 2; i >= 0; i--) {
      const id = this.data(x, y, i);
      const t = this.terrainOf(id);
      if (self && canSurfFreely(t)) {
        // Si ya está en el agua, solo puede ir a otra casilla de agua
        for (let j = 2; j >= 0; j--) {
          const f = this.data(nx, ny, j);
          if (!f) continue;
          const ft = this.terrainOf(f);
          if (ft.id !== 'None' && !ft.ignorePassability) return canSurfFreely(ft);
        }
        return false;
      } else if (t.ice) {
        return false; // los NPC no pisan hielo
      } else if (self && self.x === x && self.y === y) {
        // Los NPC no pisan salientes
        for (let j = 2; j >= 0; j--) {
          const f = this.data(nx, ny, j);
          if (!f) continue;
          const ft = this.terrainOf(f);
          if (ft.ledge) return false;
          if (ft.id !== 'None' && !ft.ignorePassability) break;
        }
      }
      if (t.ignorePassability) continue;
      if (!id) continue;
      const p = this.passage(id);
      if ((p & bit) || (p & 0x0f) === 0x0f) return false;
      if (this.priority(id) === 0) return true;
    }
    return true;
  }

  /** Game_Map#playerPassable? */
  playerPassable(x, y, d, env = {}) {
    if (this.voidBlocks && this.isVoid(x, y)) return false;
    const bit = dirBit(d);
    const bridge = env.bridge || 0;
    for (let i = 2; i >= 0; i--) {
      const id = this.data(x, y, i);
      if (!id) continue;
      const t = this.terrainOf(id);
      const p = this.passage(id);
      if (t.bridge && bridge === 0) continue;
      if (env.surfing && t.canSurf && !t.waterfall) return true;
      if (env.bicycle && (t.mustWalk || t.mustWalkOrRun)) return false;
      if (t.bridge && bridge > 0) return (p & bit) === 0 && (p & 0x0f) !== 0x0f;
      if (t.ignorePassability) continue;
      if ((p & bit) || (p & 0x0f) === 0x0f) return false;
      if (this.priority(id) === 0) return true;
    }
    return true;
  }

  /** Game_Map#passableStrict? — casilla totalmente pasable en todas las direcciones. */
  passableStrict(x, y, self = null) {
    if (!this.valid(x, y)) return false;
    if (this.voidBlocks && this.isVoid(x, y)) return false;
    for (const ev of this.events) {
      if (ev === self || !(ev.tileId > 0) || ev.through || !ev.at(x, y)) continue;
      if (this.terrainOf(ev.tileId).ignorePassability) continue;
      if (this.passage(ev.tileId) & 0x0f) return false;
      if (this.priority(ev.tileId) === 0) return true;
    }
    for (let i = 2; i >= 0; i--) {
      const id = this.data(x, y, i);
      if (!id) continue;
      if (this.terrainOf(id).ignorePassability) continue;
      if (this.passage(id) & 0x0f) return false;
      if (this.priority(id) === 0) return true;
    }
    return true;
  }

  /** Cambia un tile en tiempo de ejecución (reconstrucción de puentes, rocas rotas…). */
  setTile(x, y, layer, id) {
    if (!this.valid(x, y)) return;
    this.layers[layer][x + y * this.width] = id;
    for (const fn of this.listeners) fn(x, y, layer, id);
  }

  onTileChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
