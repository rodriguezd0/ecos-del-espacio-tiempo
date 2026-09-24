// Eventos de mapa (NPC, carteles, objetos, entrenadores…). Port de Game_Event (Essentials):
// páginas con condición `when(state, ev)` (gana la última que se cumple), disparadores
// action/touch/eventTouch/auto/parallel, tipos de movimiento, self switches y línea de visión.
import { Character } from './character.js';

export const TRIGGERS = ['action', 'touch', 'eventTouch', 'auto', 'parallel'];
const PAGE_KEYS = ['when', 'sprite', 'tileId', 'dir', 'pattern', 'move', 'speed', 'freq', 'trigger', 'script', 'through',
  'alwaysOnTop', 'stepAnime', 'walkAnime', 'directionFix', 'opacity', 'sight', 'solid', 'light', 'shadow', 'lock', 'glow',
  'noOver', 'patch', 'restrictTo'];

/** Normaliza una definición de evento de contenido en { id, x, y, name, pages[] }. */
export function normalizeEventDef(def, index = 0) {
  if (!def || typeof def !== 'object') throw new Error(`Evento ${index}: definición inválida`);
  if (!Number.isInteger(def.x) || !Number.isInteger(def.y)) throw new Error(`Evento ${def.id ?? index}: x/y enteros obligatorios`);
  const base = {};
  for (const k of PAGE_KEYS) if (def[k] !== undefined) base[k] = def[k];
  const pages = (def.pages && def.pages.length ? def.pages : [{}]).map((p) => ({ ...base, ...p }));
  for (const p of pages) {
    if (p.trigger && !TRIGGERS.includes(p.trigger)) throw new Error(`Evento ${def.id}: disparador desconocido "${p.trigger}"`);
  }
  return { ...def, id: def.id ?? `ev${index}`, name: def.name || def.id || `ev${index}`, pages };
}

export class MapEvent extends Character {
  constructor(world, map, def) {
    super(world, { id: def.id, map, x: def.x, y: def.y, dir: def.pages[0].dir || 2 });
    this.def = def;
    this.name = def.name;
    this.page = undefined;
    this.pageIndex = -1;
    this.erased = false;
    this.starting = false;
    this.trigger = null;
    this.script = null;
    this.sight = 0;
    this.solid = false;
    this.through = true;
    this.tempSwitches = {};
    this.isEvent = true;
    this.runningParallel = false;
  }

  get state() { return this.world?.state || null; }

  selfSwitch(letter = 'A') {
    return this.tempSwitches[letter] || Boolean(this.state?.selfSwitch(this.map.id, this.id, letter));
  }
  setSelfSwitch(letter = 'A', value = true) {
    this.state?.setSelfSwitch(this.map.id, this.id, letter, value);
    this.world?.requestRefresh?.();
  }

  erase() {
    this.erased = true;
    this.refresh();
  }

  /** Elige la página activa. Devuelve true si cambió. */
  refresh() {
    let idx = -1;
    if (!this.erased) {
      for (let i = this.def.pages.length - 1; i >= 0; i--) {
        const p = this.def.pages[i];
        let ok = true;
        try {
          ok = !p.when || Boolean(p.when(this.state, this));
        } catch (err) {
          console.error(`Evento ${this.map.id}:${this.id}: error en when()`, err);
          ok = false;
        }
        if (ok) { idx = i; break; }
      }
    }
    if (idx === this.pageIndex) return false;
    this.pageIndex = idx;
    this.page = idx >= 0 ? this.def.pages[idx] : null;
    this.starting = false;
    this.applyPage(this.page);
    return true;
  }

  applyPage(p) {
    if (!p) {
      this.tileId = 0;
      this.characterName = '';
      this.moveType = 'still';
      this.through = true;
      this.trigger = null;
      this.script = null;
      this.sight = 0;
      this.solid = false;
      return;
    }
    this.tileId = p.tileId || 0;
    this.characterName = p.sprite || '';
    if (p.dir && this.originalDirection !== p.dir) {
      this.direction = p.dir;
      this.originalDirection = p.dir;
      this.prelockDirection = 0;
    }
    this.pattern = p.pattern || 0;
    this.originalPattern = this.pattern;
    this.opacity = p.opacity ?? 255;
    this.setMoveSpeed(p.speed ?? 3);
    this.setMoveFrequency(p.freq ?? 3);
    this.walkAnime = p.walkAnime ?? true;
    this.stepAnime = p.stepAnime ?? false;
    this.directionFix = p.directionFix ?? false;
    this.through = p.through ?? false;
    this.alwaysOnTop = p.alwaysOnTop ?? false;
    this.solid = Boolean(p.solid);
    this.trigger = p.trigger || (p.script ? 'action' : null);
    this.script = p.script || null;
    this.sight = p.sight || 0;
    this.restrictTo = p.restrictTo || null;
    this.applyMove(p.move);
    this.calculateBushDepth();
    if (p.patch) this.applyPatch(p.patch);
  }

  /** Cambios de tiles persistentes ligados a una página (p. ej. puente reconstruido). */
  applyPatch(tiles) {
    for (const [x, y, layer, id] of tiles) {
      if (this.map.data(x, y, layer) !== id) this.map.setTile(x, y, layer, id);
    }
  }

  applyMove(move) {
    // Como RMXP, cambiar de página cancela la ruta forzada; se liberan sus esperas (ctx.move) para que el
    // guion que la esperaba no se quede colgado.
    if (this.moveRouteForcing) {
      this.originalMoveRoute = null;
      for (const resolve of this.routeWaiters.splice(0)) resolve();
    }
    this.moveRoute = null;
    this.moveRouteIndex = 0;
    this.moveRouteForcing = false;
    this.wanderRange = 0;
    if (!move || move === 'still') { this.moveType = 'still'; return; }
    if (move === 'wander' || move === 'random') { this.moveType = move === 'random' ? 'random' : 'wander'; this.wanderRange = move === 'wander' ? 2 : 0; return; }
    if (move === 'look' || move === 'turn') { this.moveType = 'look'; return; }
    if (move === 'toward') { this.moveType = 'toward'; return; }
    if (move === 'face' || move === 'watch') { this.moveType = 'face'; return; }
    if (typeof move === 'object' && move.wander !== undefined) { this.moveType = 'wander'; this.wanderRange = move.wander; return; }
    if (Array.isArray(move) || move.route) {
      this.moveType = 'custom';
      const list = Array.isArray(move) ? move : move.route;
      this.moveRoute = { list, repeat: move.repeat ?? true, skippable: move.skippable ?? false };
      return;
    }
    console.warn(`Evento ${this.id}: tipo de movimiento desconocido`, move);
    this.moveType = 'still';
  }

  hasGraphic() { return Boolean(this.characterName) || this.tileId > 0; }

  /**
   * NPC "atento": personaje con diálogo (se le habla con A) que pasea o mira alrededor. Cuando el jugador se
   * acerca deja de moverse y lo mira (character.js). Excluye entrenadores con visión (girar hacia el jugador
   * los haría descubrirlo), Pokémon salvajes visibles (eventTouch), rutas fijas y páginas con attentive:false.
   */
  attendsPlayer() {
    if (!this.page || this.page.attentive === false || this.erased) return false;
    if (this.sight > 0 || this.trigger !== 'action' || !this.script || !this.characterName) return false;
    return this.moveType === 'wander' || this.moveType === 'random' || this.moveType === 'look';
  }

  /** El evento está "bajo los pies" (sin gráfico sólido y sobre casilla pasable): se activa al pisarlo. */
  overTrigger() {
    if ((this.characterName || this.solid || this.page?.noOver) && !this.through) return false;
    const player = this.world?.player;
    return this.map.passable(this.x, this.y, 0, player, this.world?.env?.() || {});
  }

  /** Línea de visión: ¿el evento mira al jugador a ≤ distance casillas? (pbEventFacesPlayer?) */
  facesPlayer(player, distance) {
    if (!player || distance <= 0) return false;
    let x0; let x1; let y0; let y1;
    switch (this.direction) {
      case 2: x0 = this.x; x1 = this.x + this.width - 1; y0 = this.y + 1; y1 = this.y + distance; break;
      case 4: x0 = this.x - distance; x1 = this.x - 1; y0 = this.y - this.height + 1; y1 = this.y; break;
      case 6: x0 = this.x + this.width; x1 = this.x + this.width - 1 + distance; y0 = this.y - this.height + 1; y1 = this.y; break;
      case 8: x0 = this.x; x1 = this.x + this.width - 1; y0 = this.y - this.height + 1 - distance; y1 = this.y - this.height; break;
      default: return false;
    }
    return player.x >= x0 && player.x <= x1 && player.y >= y0 && player.y <= y1;
  }

  /** pbEventCanReachPlayer?: mira al jugador y puede caminar hasta él. */
  canReachPlayer(player, distance) {
    if (!this.facesPlayer(player, distance)) return false;
    const ddx = this.direction === 6 ? 1 : this.direction === 4 ? -1 : 0;
    const ddy = this.direction === 2 ? 1 : this.direction === 8 ? -1 : 0;
    let real = 0;
    switch (this.direction) {
      case 2: real = player.y - this.y - 1; break;
      case 4: real = this.x - player.x - 1; break;
      case 6: real = player.x - this.x - this.width; break;
      case 8: real = this.y - this.height - player.y; break;
      default: break;
    }
    for (let i = 0; i < real; i++) {
      if (!this.canMoveFromCoordinate(this.x + i * ddx, this.y + i * ddy, this.direction)) return false;
    }
    return true;
  }

  start() {
    if (!this.script) return;
    this.starting = true;
  }

  /** Al girar (p. ej. entrenador que mira alrededor) comprueba si ve al jugador. */
  onTurned() {
    if (this.trigger !== 'eventTouch' || !this.sight || this.world?.scriptBusy?.()) return;
    const p = this.world?.player;
    if (p && !this.jumping() && !this.overTrigger() && this.canReachPlayer(p, this.sight)) this.start();
  }

  /** Un NPC con disparador eventTouch que intenta moverse hacia el jugador lo activa. */
  checkEventTriggerTouch(dir) {
    if (this.trigger !== 'eventTouch' || this.world?.scriptBusy?.()) return;
    const p = this.world?.player;
    if (!p) return;
    if (dir === 2 && p.y !== this.y + 1) return;
    if (dir === 4 && p.x !== this.x - 1) return;
    if (dir === 6 && p.x !== this.x + this.width) return;
    if (dir === 8 && p.y !== this.y - this.height) return;
    if (!(p.x >= this.x && p.x < this.x + this.width) && !(p.y > this.y - this.height && p.y <= this.y)) return;
    if (this.jumping() || this.overTrigger()) return;
    this.start();
  }

  update(dt) {
    const wasMoving = this.moving();
    super.update(dt);
    if (wasMoving && !this.moving()) this.world?.onEventStopped?.(this);
  }
}
