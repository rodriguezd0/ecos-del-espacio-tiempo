// Mundo en tiempo de ejecución (lógica pura, sin Three.js): mapa actual + vecinos conectados,
// jugador, seguidor, eventos, disparadores (acción, contacto, visión, bajo los pies, auto/paralelo),
// warps, cruce de conexiones y encuentros. La escena (MapScene) aporta los "hooks" asíncronos.
import { MapEvent, normalizeEventDef } from './mapEvent.js';
import { Player } from './player.js';
import { Follower, followChain, turnChainTowardsLeaders } from './follower.js';
import { EncounterSystem, allowEncounter, buildZoneEncounters, zoneEncountersAt } from './encounters.js';
import { dx, dy } from './gameMap.js';
import { TERRAIN_NONE } from './terrain.js';
import { expandEventDef } from './eventTypes.js';
import { canOfferSwim } from './waterAccess.js';

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
    // Compañero de campo (Core de Zygarde, D06): va entre el jugador y el Pokémon acompañante.
    this.core = new Follower(this, { id: 'core', kind: 'core' });
    this.encounters = new EncounterSystem({}, rng);
    this.zoneEncounters = []; // tablas por zona del mapa (def.encounterZones), ver encountersAt
    this.time = 0;
  }

  /** Tablas de encuentros en la casilla (x, y) del mapa actual: la de su zona (def.encounterZones) o la del mapa. */
  encountersAt(x, y) {
    return zoneEncountersAt(this.zoneEncounters, x, y) || this.encounters;
  }

  /** Cadena de seguidores en orden (jugador → Core → Pokémon). */
  get followers() { return [this.core, this.follower]; }

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
    for (const f of this.followers) f.map = entry.map;
    this.encounters = new EncounterSystem(entry.def.encounters || {}, this.rng);
    this.zoneEncounters = buildZoneEncounters(entry.def, this.rng);
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
    for (const f of this.followers) f.shiftBy(ox, oy);
    this.neighbors = [prev, ...this.neighbors.filter((n) => n !== next)];
    this.current = next;
    player.map = next.map;
    for (const f of this.followers) f.map = next.map;
    this.encounters = new EncounterSystem(next.def.encounters || {}, this.rng);
    this.zoneEncounters = buildZoneEncounters(next.def, this.rng);
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
    for (const f of this.followers) f.update(dt);
    for (const ev of this.events) {
      if (ev.erased) continue;
      ev.update(dt);
    }
    this.checkAutoEvents();
  }

  followLeader() {
    followChain(this.player, this.followers);
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
    turnChainTowardsLeaders(p, this.followers);
    if (p.moveRouteForcing || this.scriptBusy()) return;
    let triggered = this.checkTrainersFromDistance();
    triggered = this.checkHere(['touch', 'eventTouch']) || triggered;
    const warp = this.warpAt(p.x, p.y);
    if (warp && !triggered) { this.hooks.warp?.(warp); return; }
    const tag = p.terrainTag();
    if (tag.ice && p.canMoveInDirection(p.direction)) { p.iceSliding = true; p.straighten(); p.walkAnime = false; } else p.stopIce();
    this.hooks.stepTaken?.(p);
    const repelActive = this.countRepelStep(tag);
    if (!triggered) this.tryEncounter({ repelActive });
  }

  /**
   * Repelente (Essentials :repel_counter): descuenta un paso salvo sobre hielo y avisa al agotarse
   * (hook repelExpired). Devuelve si estaba activo al dar el paso (cuenta para el encuentro de este paso).
   */
  countRepelStep(tag = this.player.terrainTag()) {
    const st = this.state;
    if (!st || typeof st.stepRepel !== 'function' || !(st.repelSteps > 0)) return false;
    if (!tag.ice && st.stepRepel()) this.hooks.repelExpired?.();
    return true;
  }

  /** Encuentro aleatorio en la posición del jugador. opts.repelActive: filtra salvajes débiles. */
  tryEncounter({ repelActive = (this.state?.repelSteps || 0) > 0 } = {}) {
    if (this.hooks.encountersEnabled && !this.hooks.encountersEnabled()) return false;
    if (!this.state?.party?.some((pk) => pk.hp > 0)) return false;
    const p = this.player;
    const sys = this.encountersAt(p.x, p.y);
    const type = sys.encounterType({ terrain: p.terrainTag(), surfing: p.surfing, hour: this.state.hour });
    if (!type || !sys.triggered(type, { repel: repelActive })) return false;
    const enc = sys.choose(type);
    const lead = this.state.leadPokemon?.() || this.state.party.find((pk) => !pk.egg);
    if (!allowEncounter(enc, { repelActive, leadLevel: lead?.level || 0 })) {
      sys.chanceAccumulator = 0;
      return false;
    }
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
    // Puertas sobre tiles no pasables (p. ej. los edificios de Exterior1, como las puertas-evento de RMXP):
    // empujar contra la casilla de un warp lo activa.
    if (!any && this.warpAt(tx, ty)) {
      this.hooks.warp?.(this.warpAt(tx, ty));
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
    const f = this.followers.find((c) => c.visible && c.x === fx && c.y === fy && !c.busy());
    if (f) {
      this.hooks.followerTalk?.(f);
      return true;
    }
    // Agua delante: nunca desde un puente ni hacia el agua bajo un tablero (world/waterAccess.js).
    if (canOfferSwim(this)) {
      this.hooks.fieldHook?.('swim', { x: fx, y: fy });
      return true;
    }
    // Bajo el agua con superficie declarada: emerger en el punto equivalente (aditivo B13, world/zygarde/dive.js).
    if (this.current?.def?.underwater?.surface && this.hooks.fieldHook) {
      this.hooks.fieldHook('surface', { x: p.x, y: p.y });
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
