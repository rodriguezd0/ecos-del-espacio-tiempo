// Mundo en tiempo de ejecución (lógica pura, sin Three.js): mapa actual + vecinos conectados,
// jugador, seguidor, eventos, disparadores (acción, contacto, visión, bajo los pies, auto/paralelo),
// warps, cruce de conexiones y encuentros. La escena (MapScene) aporta los "hooks" asíncronos.
import { MapEvent, normalizeEventDef } from './mapEvent.js';
import { Player } from './player.js';
import { Follower } from './follower.js';
import { EncounterSystem } from './encounters.js';
import { dx, dy } from './gameMap.js';
import { canSurfFreely, TERRAIN_NONE } from './terrain.js';
import { expandEventDef } from './eventTypes.js';

export class World {
  /**
   * @param {object} opts
   *   state: GameState, input: { dir4, held, pressed }, rng?: () => number
   *   hooks: { startEvent(ev, reason), warp(warp), encounter(enc), fieldHook(kind, data), followerTalk(),
   *            playSE(name), fieldAnim(kind, x, y), mapChanged(entry, prev), stepTaken() }
   */
  constructor({ state, input = null, rng = Math.random, hooks = {} }) {
    this.state = state;
    this.input = input;
    this.rng = rng;
    this.hooks = hooks;
    this.current = null; // { id, def, map, offset:{x:0,y:0}, events: [] }
    this.neighbors = [];
    this.bridge = 0;
    this.debugThrough = false;
    this.inputLocked = 0;
    this.needRefresh = false;
    this.scriptBusyFn = () => false;
    this.player = new Player(this, {});
    this.follower = new Follower(this, {});
    this.encounters = new EncounterSystem({}, rng);
    this.time = 0;
  }

  get map() { return this.current?.map || null; }
  get events() { return this.current?.events || []; }
  get allEntries() { return this.current ? [this.current, ...this.neighbors] : []; }

  env() { return { bridge: this.bridge, surfing: this.player.surfing, bicycle: false }; }
  scriptBusy() { return this.scriptBusyFn(); }
  inputEnabled() { return this.inputLocked === 0 && !this.scriptBusy(); }
  playSE(name) { this.hooks.playSE?.(name); }
  requestRefresh() { this.needRefresh = true; }

  // ------------------------------------------------------------ mapas
  /** Crea los eventos de una entrada de mapa a partir de su definición. */
  createEvents(entry) {
    const defs = entry.def.events || [];
    entry.events = defs.map((raw, i) => {
      const def = normalizeEventDef(expandEventDef(raw, entry.def), i);
      const ev = new MapEvent(this, entry.map, def);
      ev.refresh();
      return ev;
    });
    entry.map.events = entry.events;
    return entry.events;
  }

  /** Establece el mapa actual (tras un warp): crea eventos y reinicia encuentros. */
  setCurrent(entry) {
    entry.offset = { x: 0, y: 0 };
    if (!entry.events) this.createEvents(entry);
    this.current = entry;
    this.neighbors = [];
    this.player.map = entry.map;
    this.follower.map = entry.map;
    this.encounters = new EncounterSystem(entry.def.encounters || {}, this.rng);
    this.bridge = 0;
  }

  /** Crea un evento en tiempo de ejecución en el mapa actual (p. ej. Pokémon salvaje visible). */
  spawnEvent(raw) {
    const def = normalizeEventDef(expandEventDef(raw, this.current.def), this.events.length);
    const ev = new MapEvent(this, this.current.map, def);
    ev.refresh();
    this.current.events.push(ev);
    return ev;
  }

  removeEvent(ev) {
    const list = this.current?.events;
    if (!list) return;
    const i = list.indexOf(ev);
    if (i >= 0) list.splice(i, 1);
  }

  addNeighbor(entry) {
    if (this.neighbors.some((n) => n.id === entry.id) || entry.id === this.current?.id) return;
    if (!entry.events) this.createEvents(entry);
    this.neighbors.push(entry);
  }

  pruneNeighbors(keepIds) {
    this.neighbors = this.neighbors.filter((n) => keepIds.includes(n.id));
  }

  /** Busca la entrada (actual o vecina) que contiene la casilla (x,y) en coordenadas del mapa actual. */
  entryAt(x, y) {
    for (const e of this.allEntries) {
      const lx = x - e.offset.x;
      const ly = y - e.offset.y;
      if (e.map.valid(lx, ly)) return { entry: e, x: lx, y: ly };
    }
    return null;
  }

  terrainAt(char, x, y) {
    if (char.map.valid(x, y)) return char.map.terrainTagAt(x, y, this.bridge);
    const hit = this.entryAt(x, y);
    return hit ? hit.entry.map.terrainTagAt(hit.x, hit.y, this.bridge) : TERRAIN_NONE;
  }

  /** ¿Puede el jugador salir por el borde hacia un mapa conectado? */
  passableFromEdge(player, x, y, d) {
    const hit = this.entryAt(x + dx(d), y + dy(d));
    if (!hit || hit.entry === this.current) return false;
    if (player.through) return true;
    if (!this.map.passable(x, y, d, player, this.env())) return false;
    if (!hit.entry.map.playerPassable(hit.x, hit.y, 10 - d, this.env())) return false;
    return !hit.entry.events.some((ev) => !ev.through && !ev.erased && ev.at(hit.x, hit.y) && (ev.characterName || ev.solid));
  }

  /** El jugador inicia un paso hacia un mapa conectado: ese mapa pasa a ser el actual. */
  crossEdge(player, d) {
    const hit = this.entryAt(player.x + dx(d), player.y + dy(d));
    if (!hit || hit.entry === this.current) return;
    const next = hit.entry;
    const ox = -next.offset.x;
    const oy = -next.offset.y;
    const prev = this.current;
    for (const e of this.allEntries) e.offset = { x: e.offset.x + ox, y: e.offset.y + oy };
    player.shiftBy(ox, oy);
    this.follower.shiftBy(ox, oy);
    this.neighbors = [prev, ...this.neighbors.filter((n) => n !== next)];
    this.current = next;
    player.map = next.map;
    this.follower.map = next.map;
    this.encounters = new EncounterSystem(next.def.encounters || {}, this.rng);
    this.hooks.mapChanged?.(next, prev, { ox, oy });
  }

  // ------------------------------------------------------------ actualización
  update(dt) {
    this.time += dt;
    if (this.needRefresh) this.refreshEvents();
    const player = this.player;
    const wasBusy = player.busy();
    player.update(dt);
    if (!wasBusy && player.busy() && !player.bumping) this.followLeader();
    this.follower.update(dt);
    for (const ev of this.events) {
      if (ev.erased) continue;
      ev.update(dt);
    }
    this.checkAutoEvents();
  }

  followLeader() {
    const f = this.follower;
    if (f.hidden) return;
    f.follow(this.player);
  }

  refreshEvents() {
    this.needRefresh = false;
    for (const e of this.allEntries) for (const ev of e.events || []) ev.refresh();
  }

  checkAutoEvents() {
    if (this.scriptBusy()) return;
    for (const ev of this.events) {
      if (ev.erased || !ev.page) continue;
      if (ev.trigger === 'auto') ev.start();
    }
  }

  /** Primer evento en espera de ejecutarse (auto/acción/contacto). */
  takeStartingEvent() {
    for (const ev of this.events) {
      if (ev.starting && !ev.erased) {
        ev.starting = false;
        return ev;
      }
    }
    return null;
  }

  // ------------------------------------------------------------ hooks de personajes
  onStepStart(char) {
    if (char === this.player) this.hooks.stepStart?.(char);
  }

  onStepTaken(char, landed) {
    const tag = char.map.terrainTagAt(char.x, char.y, this.bridge);
    if (tag.showsGrassRustle && !char.transparent) this.hooks.fieldAnim?.('grass', char, char.x, char.y);
    if (landed && !char.transparent) this.hooks.fieldAnim?.('dust', char, char.x, char.y);
    if (char === this.player) this.onPlayerStep();
  }

  onPlayerTurned() {
    if (this.player.moveRouteForcing || this.scriptBusy() || this.player.busy()) return;
    this.tryEncounter();
  }

  onEventStopped() {
    if (!this.scriptBusy()) this.checkTrainersFromDistance();
  }

  onPlayerStep() {
    const p = this.player;
    this.follower.turnTowardsLeader(p);
    if (p.moveRouteForcing || this.scriptBusy()) return;
    let triggered = this.checkTrainersFromDistance();
    triggered = this.checkHere(['touch', 'eventTouch']) || triggered;
    const warp = this.warpAt(p.x, p.y);
    if (warp && !triggered) { this.hooks.warp?.(warp); return; }
    const tag = p.terrainTag();
    if (tag.ice && p.canMoveInDirection(p.direction)) { p.iceSliding = true; p.straighten(); p.walkAnime = false; } else p.stopIce();
    this.hooks.stepTaken?.(p);
    if (!triggered) this.tryEncounter();
  }

  tryEncounter() {
    if (this.hooks.encountersEnabled && !this.hooks.encountersEnabled()) return false;
    if (!this.state?.party?.some((pk) => pk.hp > 0)) return false;
    const p = this.player;
    const type = this.encounters.encounterType({ terrain: p.terrainTag(), surfing: p.surfing, hour: this.state.hour });
    if (!type || !this.encounters.triggered(type)) return false;
    const enc = this.encounters.choose(type);
    if (!enc) return false;
    this.hooks.encounter?.(enc);
    return true;
  }

  warpAt(x, y) {
    return (this.current.def.warps || []).find((w) => w.x === x && w.y === y && !w.dirTrigger) || null;
  }

  // ------------------------------------------------------------ disparadores
  checkTrainersFromDistance() {
    const p = this.player;
    let any = false;
    for (const ev of this.events) {
      if (ev.erased || ev.trigger !== 'eventTouch' || !ev.sight) continue;
      if (ev.jumping() || ev.overTrigger()) continue;
      if (!ev.canReachPlayer(p, ev.sight)) continue;
      ev.start();
      any = true;
    }
    return any;
  }

  checkHere(triggers) {
    const p = this.player;
    let any = false;
    for (const ev of this.events) {
      if (ev.erased || !ev.at(p.x, p.y) || !triggers.includes(ev.trigger)) continue;
      if (ev.jumping() || !ev.overTrigger()) continue;
      ev.start();
      any = true;
    }
    return any;
  }

  eventsInFront(triggers) {
    const p = this.player;
    let fx = p.x + dx(p.direction);
    let fy = p.y + dy(p.direction);
    const pick = () => this.events.filter((ev) => !ev.erased && triggers.includes(ev.trigger) && ev.at(fx, fy) && !ev.jumping() && !ev.overTrigger());
    let found = pick();
    if (!found.length && this.map.counter(fx, fy)) {
      fx += dx(p.direction);
      fy += dy(p.direction);
      found = pick();
    }
    return found;
  }

  /** Jugador empuja contra una casilla: contacto con eventos touch/eventTouch (check_event_trigger_touch). */
  checkPlayerTouch(dir) {
    if (this.scriptBusy()) return false;
    const p = this.player;
    const tx = p.x + dx(dir);
    const ty = p.y + dy(dir);
    let any = false;
    for (const ev of this.events) {
      if (ev.erased || !['touch', 'eventTouch'].includes(ev.trigger) || !ev.at(tx, ty)) continue;
      if (ev.sight && !ev.canReachPlayer(p, ev.sight)) continue;
      if (ev.jumping() || ev.overTrigger()) continue;
      ev.start();
      any = true;
    }
    return any;
  }

  /** Botón A: eventos bajo los pies, delante (con mostrador), seguidor y habilidades de campo. */
  actionButton() {
    const p = this.player;
    if (this.scriptBusy() || p.busy()) return false;
    if (this.checkHere(['action'])) return true;
    const front = this.eventsInFront(['action', 'touch', 'eventTouch']);
    if (front.length) {
      for (const ev of front) ev.start();
      return true;
    }
    const fx = p.x + dx(p.direction);
    const fy = p.y + dy(p.direction);
    const f = this.follower;
    if (f.visible && f.x === fx && f.y === fy && !f.busy()) {
      this.hooks.followerTalk?.(f);
      return true;
    }
    const facing = this.terrainAt(p, fx, fy);
    if (!p.surfing && canSurfFreely(facing) && this.map.valid(fx, fy)) {
      this.hooks.fieldHook?.('swim', { x: fx, y: fy });
      return true;
    }
    return false;
  }

  /** Warps por dirección (alfombras de salida): pulsar hacia `dir` estando encima. */
  dirWarp() {
    const p = this.player;
    if (p.busy() || !this.inputEnabled() || !this.input) return null;
    const d = this.input.dir4();
    if (!d) return null;
    return (this.current.def.warps || []).find((w) => w.dirTrigger && w.x === p.x && w.y === p.y && w.dirTrigger === d) || null;
  }
}
