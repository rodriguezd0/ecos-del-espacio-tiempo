// Escena del mapa (overworld). Carga la definición (?map=<id>, por defecto dev_test), construye el mapa,
// gestiona jugador/eventos/seguidor/cámara/warps/conexiones, menú de pausa (START), cartel de zona,
// combates, clima, día/noche, oscuridad y efectos. Ver docs/ARCHITECTURE.md §3, §5, §6.
import { engine } from '../core/engine.js';
import { Scene } from '../core/scenes.js';
import { GameState } from '../core/state.js';
import { ui } from '../ui/api.js';
import { createPokemon } from '../battle/core/pokemon.js';
import { loadMapDefinition } from '../content/maps/index.js';
import { buildMap, createEntry, connectionOffset } from './mapLoader.js';
import { loadBuilderLibrary } from './stampLibrary.js';
import { World } from './world.js';
import { VisibleEncounters } from './visibleEncounters.js';
import { runBattle, runWildBattle } from './battleFlow.js';
import { followerTalk, swimHook } from './fieldScripts.js';
import { runFieldAction, repelWoreOff } from './fieldActions.js';
import { placeChainBehind } from './follower.js';
import { coreSpriteKey, coreTalk } from '../content/companion.js';
import { applyDevParams, installDevKeys, drawDebug, spawnDemoFx } from './devTools.js';
import { loadTilesetResources } from '../render/tileAtlas.js';
import { WorldView } from '../render/worldView.js';
import { Camera } from '../render/camera.js';
import { Compositor } from '../render/compositor.js';
import { ScreenFx } from '../render/screenFx.js';
import { WeatherLayer } from '../render/weather.js';
import { EffectsLayer } from '../render/effects.js';
import { dayNightTone } from '../render/dayNight.js';
import { playerCharsets } from '../render/charsets.js';
import { ScriptRunner } from '../script/runner.js';
import { createContext } from '../script/context.js';
import { CrisisSky } from '../content/story/crisisSky.js';
import { stormWeather } from './rest.js';
import { ZygardeField } from './zygarde/field.js';
import { surfaceHere } from './zygarde/actions.js';
import { openSides } from './seams.js';
import { nearestFreeSpot } from './waterAccess.js';
import { eggStep } from './eggs.js'; // B11: pasos de los huevos del equipo y eclosión
import { daycareStep } from './daycare.js'; // guardería: contador del huevo de la pareja depositada
import { PanoramaLayer } from '../render/panorama.js'; // B12: fondo de mapa (vacío del Mundo Distorsión)
import { ImpossibleField } from './impossible/field.js'; // B12: espacio imposible (vacío, anclas, puentes)
import { MapNetSync } from '../net/mapSync.js'; // multijugador: otros jugadores de la sala online
import { handleInvite } from '../net/linkFlow.js'; // multijugador: combates online (registra la acción 'online')
import { installDevMenuKey } from '../dev/devRuntime.js'; // modo desarrollador: F9 (docs/MODO_DESARROLLADOR.md)

export const DEFAULT_MAP = 'dev_test';
// [PROVISIONAL] Ritmo del reloj de juego: 1 minuto de juego por segundo real (TEC-06; ritmo por decidir).
export const CLOCK_FRAMES_PER_MINUTE = 60;
const PLAYER_LIGHT = 72;

export default class MapScene extends Scene {
  async enter(params = {}) {
    this.params = params;
    this.ready = false;
    this.time = 0;
    this.frame = 0;
    this.clockFrames = 0;
    if (!engine.state) engine.state = createDevState();
    this.state = engine.state;
    this.compositor = new Compositor();
    this.fx = new ScreenFx(this.compositor);
    this.worldView = new WorldView();
    this.effects = new EffectsLayer();
    this.weather = new WeatherLayer({ playSE: (n) => engine.audio?.playSE?.(n), flash: (c, a, f) => this.fx.flashScreen(c, a, f) });
    this.camera = new Camera();
    this.panorama = new PanoramaLayer(); // B12: panorama detrás de los tilemaps (def.panorama)
    this.crisisSky = new CrisisSky(this); // capa de cielo de la crisis (content/story, CAMPANA §3.1)
    this.runner = new ScriptRunner();
    this.world = new World({ state: this.state, input: engine.input, hooks: this.worldHooks() });
    this.world.scriptBusyFn = () => this.runner.busy || this.transferring || this.menuOpen || this.inBattle;
    this.visible = new VisibleEncounters(this.world, { onBattle: (ctx, enc) => ctx.wildBattle(enc) });
    applyDevParams(this, params);
    // Sistema de campo de Zygarde: montura, detección, Buceo, Salto (world/zygarde/field.js).
    this.zygarde = new ZygardeField(this);
    this.zygarde.applyDevParams(params);
    this.impossible = new ImpossibleField(this); // B12: espacio imposible (def.impossible)
    this.net = new MapNetSync(this, { charsetsFor: playerCharsets, onInvite: handleInvite });
    this.world.player.setCharsets(await playerCharsets(this.state.player.gender));
    const saved = this.state.player;
    const resume = !params.map && Boolean(saved.mapId);
    const id = params.map || saved.mapId || DEFAULT_MAP;
    let x;
    let y;
    if (params.x !== undefined && params.y !== undefined) { x = Number(params.x); y = Number(params.y); } else if (resume) { x = saved.x; y = saved.y; }
    try {
      await this.enterMap(id, x, y, Number(params.dir) || (resume ? saved.dir : undefined));
    } catch (err) {
      console.error(err);
      engine.reportError(new Error(`No se pudo cargar el mapa "${id}": ${err.message}`));
      if (id === DEFAULT_MAP) throw err;
      await this.enterMap(DEFAULT_MAP);
    }
    if (this.devFx.length) spawnDemoFx(this, this.devFx);
    this.uninstallDevMenu = installDevMenuKey(this);
    if (engine.debug) {
      this.uninstallDevKeys = installDevKeys(this);
      window.__map = this;
    }
    this.ready = true;
  }

  exit() {
    this.uninstallDevKeys?.();
    this.uninstallDevMenu?.();
    this.net?.dispose();
    this.runner.cancelAll();
    this.zygarde?.dispose();
    this.impossible?.dispose();
    this.panorama?.dispose();
    this.crisisSky?.dispose();
    this.worldView.dispose();
    this.effects.clear();
    this.weather.dispose();
    this.compositor.dispose();
    if (window.__map === this) delete window.__map;
  }

  // ------------------------------------------------------------ hooks del mundo
  worldHooks() {
    return {
      playSE: (name) => engine.audio?.playSE?.(name),
      warp: (w) => { this.pendingWarp = w; },
      encounter: (enc) => { this.pendingEncounter = enc; },
      // B12: ningún salvaje al pisar el vacío del espacio imposible (primero se cae).
      encountersEnabled: () => !this.noEncounters && this.state.options.encounterMode !== 'visible' && !this.impossible?.overVoid?.(),
      followerTalk: (f) => this.runScript((ctx) => (f.talk ? f.talk(ctx, f) : followerTalk(ctx, f)), null, 'seguidor'),
      fieldHook: (kind) => {
        if (kind === 'swim') this.runScript(swimHook, null, 'nadar');
        else if (kind === 'surface') this.runScript(surfaceHere, null, 'emerger'); // aditivo B13 (Buceo)
      },
      fieldAnim: (kind, ch, x, y) => this.playFieldAnim(kind, ch, x, y),
      mapChanged: (next, prev, off) => this.onConnectionCrossed(next, prev, off),
      stepTaken: (p) => { this.state.setPosition(this.world.map.id, p.x, p.y, p.direction); eggStep(this); daycareStep(this); },
      repelExpired: () => this.runScript(repelWoreOff, null, 'repelente'),
    };
  }

  // ------------------------------------------------------------ carga de mapas
  async loadEntry(id) {
    const def = await loadMapDefinition(id);
    const res = await loadTilesetResources(def.tileset);
    const lib = def.library === false ? { library: null, paintBrush: null } : await loadBuilderLibrary(def.tileset);
    const built = buildMap(def, {
      library: lib.library || undefined,
      paintBrush: lib.paintBrush,
      isEmpty: res.isEmpty,
      warn: (m) => console.warn(`[${id}] ${m}`),
    });
    const entry = createEntry(def, built, res.tileset);
    entry.res = res;
    entry.torches = findTorches(entry);
    return entry;
  }

  /** Entra en un mapa (warp o inicio): sustituye mapa, coloca jugador/seguidor y cámara. */
  async enterMap(id, x, y, dir) {
    const entry = await this.loadEntry(id);
    this.visible.clear();
    this.worldView.clearMaps();
    this.world.setCurrent(entry);
    this.worldView.addMap(entry);
    const def = entry.def;
    const p = this.world.player;
    // El agua solo vale como casilla de aparición con Nadar (world/waterAccess.js).
    const spot = nearestFreeSpot(entry.map,
      Number.isInteger(x) ? x : def.start?.x ?? Math.floor(def.width / 2),
      Number.isInteger(y) ? y : def.start?.y ?? Math.floor(def.height / 2),
      { canSwim: Boolean(this.state.zygardeAbility?.('swim')) });
    const sx = spot.x;
    const sy = spot.y;
    p.map = entry.map;
    p.surfing = false;
    p.stopIce();
    p.setMovementType('walking');
    p.moveTo(sx, sy);
    p.direction = dir || def.start?.dir || p.direction || 2;
    p.straighten();
    // Si se aparece sobre agua (p. ej. al cargar una partida guardada surfeando), se sigue nadando.
    if (p.terrainTag().canSurf && !entry.map.playerPassable(sx, sy, 0, {})) {
      p.surfing = true;
      p.setMovementType('surfing');
    }
    this.refreshFollower();
    placeChainBehind(p, this.world.followers);
    this.camera.setBounds(def.width, def.height, openSides(def));
    this.camera.follow(p);
    this.camera.snapToTarget();
    await this.loadNeighbors(entry);
    await this.applyEnvironment(def);
    this.state.setPosition(id, p.x, p.y, p.direction);
    this.announce(def);
    this.zygarde?.onEnterMap(entry);
    this.impossible?.onEnterMap(entry);
    this.pendingWarp = null;
    this.pendingEncounter = null;
    if (typeof def.onEnter === 'function') this.runScript(def.onEnter, null, `${id}.onEnter`);
  }

  async loadNeighbors(entry) {
    const conns = entry.def.connections || [];
    const keep = [];
    for (const conn of conns) {
      keep.push(conn.to);
      // Un vecino ya cargado se recoloca según la conexión del mapa actual (aditivo B13): con vecinos cuyos bordes
      // no casan entre sí (el Mar del Sur bajo Caleta, la Ruta 15 y Nexo) el desplazamiento heredado sería otro.
      const loaded = this.world.neighbors.find((n) => n.id === conn.to);
      if (loaded) { loaded.offset = connectionOffset(conn, entry.def, loaded.def); continue; }
      try {
        const other = await this.loadEntry(conn.to);
        if (this.world.current !== entry) return;
        other.offset = connectionOffset(conn, entry.def, other.def);
        this.world.addNeighbor(other);
        this.worldView.addMap(other);
      } catch (err) {
        console.error(`Conexión ${entry.id} → ${conn.to} no disponible`, err);
      }
    }
    for (const n of this.world.neighbors) if (!keep.includes(n.id)) this.worldView.removeMap(n.id);
    this.world.pruneNeighbors(keep);
  }

  /** El jugador cruzó a un mapa conectado (sin fundido). */
  onConnectionCrossed(next, prev, { ox, oy }) {
    this.camera.x += ox * 32;
    this.camera.y += oy * 32;
    this.camera.setBounds(next.def.width, next.def.height, openSides(next.def));
    this.visible.clear();
    this.state.setPosition(next.id, this.world.player.x, this.world.player.y, this.world.player.direction);
    this.applyEnvironment(next.def);
    this.announce(next.def);
    this.zygarde?.onEnterMap(next);
    this.loadNeighbors(next);
  }

  announce(def) {
    // scene.cinematic (aditivo B21): montajes y créditos que recorren mapas sin cartel de zona ni cambio de música.
    if (this.cinematic || def.showLocation === false || !def.name || def.name === this.lastLocation) return;
    this.lastLocation = def.name;
    ui.showLocation(def.name);
  }

  async applyEnvironment(def) {
    // Siempre se pide la música del mapa (audio no reinicia la misma pista): si una escena cambió la
    // música con ctx.bgm(), al entrar en otro mapa con la misma BGM que el anterior vuelve a sonar la del mapa.
    if (def.bgm && !this.cinematic) engine.audio?.playBGM?.(def.bgm, { fadeOutPrevious: 20 });
    // «Descansar hasta tormenta» (world/rest.js) sustituye el clima de los mapas exteriores durante unas horas.
    const w = this.devWeather || stormWeather(this.state, def) || (def.weather ? [def.weather.type || def.weather, def.weather.power ?? 5] : ['none', 0]);
    if (w[0] !== this.weather.type) await this.weather.set(w[0], Number(w[1] ?? 5)).catch((e) => console.warn(e.message));
    await this.weather.setMapFog(def.fog || null);
    await this.panorama?.set(def.panorama || null);
    this.darkness = def.dark ? { amount: def.dark.amount ?? 0.94, radius: def.dark.radius ?? PLAYER_LIGHT } : null;
  }

  /**
   * Actualiza la cadena de seguidores: el Pokémon acompañante (equipo y opciones) y el Core de Zygarde
   * (state.data.zygarde.form, D06; un mapa puede ocultarlo con `noCore: true`).
   */
  refreshFollower() {
    const w = this.world;
    const f = w.follower;
    const coreKey = w.current?.def?.noCore === true ? '' : coreSpriteKey(this.state.data.zygarde?.form);
    // Zygarde en el equipo (B21, D21) ya camina a tu lado como compañero de campo: no se duplica como acompañante.
    const lead = this.state.party.find((pk) => pk.hp > 0 && !pk.egg && !(coreKey && pk.species === 'ZYGARDE')) || null;
    const allowed = this.state.options.followerEnabled !== false && w.current?.def?.noFollower !== true;
    const hadPokemon = !f.hidden;
    f.setPokemon(allowed ? lead : null);
    const core = w.core;
    const hadCore = !core.hidden;
    core.setGraphic(coreKey);
    core.talk = coreTalk;
    const appeared = (!hadPokemon && !f.hidden) || (!hadCore && !core.hidden);
    if (appeared && w.map) placeChainBehind(w.player, w.followers);
    this.zygarde?.onFollowerRefresh();
  }

  // ------------------------------------------------------------ guiones y acciones
  runScript(fn, event = null, name = 'guion', { blocking = true } = {}) {
    const ctx = createContext(this, event);
    ctx.onFinish = () => {
      if (event && event.page?.lock !== false) event.unlock();
      this.world.requestRefresh();
      // Como en RMXP, al acabar los guiones bloqueantes se cierra una caja dejada abierta con keepOpen
      // (si no, quedaría encima del mapa sin nadie que la cierre).
      if (blocking && !this.runner.busy && !this.menuOpen) ui.closeMessage();
    };
    return this.runner.run(fn, ctx, { blocking, name });
  }

  startEvent(ev) {
    if (!ev.script) return;
    if (['action', 'touch', 'eventTouch'].includes(ev.trigger) && ev.page?.lock !== false) ev.lock();
    ev.starting = false;
    this.runScript(ev.script, ev, `${this.world.map.id}:${ev.id}`);
  }

  startParallelEvents() {
    for (const ev of this.world.events) {
      if (ev.erased || ev.trigger !== 'parallel' || ev.runningParallel || !ev.script) continue;
      ev.runningParallel = true;
      const page = ev.page;
      this.runScript(async (ctx) => {
        await ev.script(ctx);
        await this.runner.wait(1);
      }, ev, `${ev.id} (paralelo)`, { blocking: false }).finally(() => { if (ev.page === page) ev.runningParallel = false; });
    }
  }

  emote(ch, kind) {
    return this.worldView.emotes.show({ headPos: () => this.worldView.headPosOf(ch) }, kind);
  }

  playFieldAnim(kind, ch, x, y) {
    const entry = this.world.allEntries.find((e) => e.map === ch.map);
    const ox = (entry?.offset.x || 0) * 32;
    const oy = (entry?.offset.y || 0) * 32;
    const purple = kind === 'grass' && ch.map.data(x, y, 1) === 388;
    this.worldView.fieldAnims.play(purple ? 'grassPurple' : kind, x * 32 + ox, y * 32 + oy);
  }

  /** Warp con fundido. opts: { fade = true, door = false, frames = 16 } */
  async transfer(mapId, x, y, dir = 2, { fade = true, door = false, frames = 16 } = {}) {
    this.transferring = true;
    try {
      if (door) engine.audio?.playSE?.('Door enter');
      if (fade) await this.fx.fadeOut(frames);
      await this.enterMap(mapId, x, y, dir);
      if (door) engine.audio?.playSE?.('Door exit');
      if (fade) await this.fx.fadeIn(frames);
    } catch (err) {
      console.error(`Warp a ${mapId} fallido`, err);
      engine.reportError(new Error(`No se pudo entrar en el mapa "${mapId}": ${err.message}`));
      this.fx.fadeIn(1);
    } finally {
      this.transferring = false;
    }
  }

  startBattle(config) { return runBattle(this, config); }
  startWildBattle(enc) { return runWildBattle(this, enc); }

  forceEncounter() {
    const enc = this.world.encounters;
    const type = enc.encounterType({ terrain: { landWildEncounters: true }, hour: this.state.hour }) || Object.keys(enc.tables)[0];
    const pick = type ? enc.choose(type) : null;
    if (pick) this.pendingEncounter = pick;
  }

  async openPauseMenu() {
    this.menuOpen = true;
    const p = this.world.player;
    // La posición guardada debe ser la actual aunque el último movimiento fuera de un guion (ctx.move).
    this.state.setPosition(this.world.map.id, p.x, p.y, p.direction);
    let action = null;
    try {
      action = await ui.openPauseMenu({ state: this.state });
    } catch (err) {
      console.error('Menú de pausa', err);
      engine.reportError(err);
    } finally {
      this.menuOpen = false;
      this.refreshFollower();
    }
    // Objetos de uso en el mundo y movimientos de campo (world/fieldActions.js).
    if (action) this.runScript((ctx) => runFieldAction(ctx, action), null, `menú:${action.type}`);
  }

  // ------------------------------------------------------------ bucle
  update(dt) {
    this.time += dt;
    this.frame += 1;
    this.runner.tick();
    this.fx.update();
    this.effects.update(dt);
    this.worldView.update();
    if (!this.ready) return;
    const input = engine.input;
    const p = this.world.player;
    const idle = !this.world.scriptBusy() && !p.busy();
    if (idle && input.pressed('START')) { this.openPauseMenu(); return; }
    if (idle) {
      const dw = this.world.dirWarp();
      if (dw) { this.doWarp(dw); return; }
      if (input.pressed('A')) this.world.actionButton();
    }
    const camX = this.camera.x; const camY = this.camera.y;
    this.world.update(dt);
    this.zygarde?.update(dt);
    this.impossible?.update(dt);
    this.net?.update(dt);
    this.visible.update();
    this.startParallelEvents();
    if (!this.world.scriptBusy()) {
      if (this.pendingWarp) { const w = this.pendingWarp; this.pendingWarp = null; this.doWarp(w); } else if (this.pendingEncounter) {
        const enc = this.pendingEncounter;
        this.pendingEncounter = null;
        this.runScript((ctx) => ctx.wildBattle(enc), null, 'encuentro');
      } else {
        const ev = this.world.takeStartingEvent();
        if (ev) this.startEvent(ev);
      }
    }
    this.tickClock();
    this.crisisSky?.update();
    this.camera.update();
    this.weather.update(dt, this.camera.x - camX, this.camera.y - camY);
    this.panorama?.update(dt, this.camera);
  }

  /**
   * Con una UI transparente encima (mensajes, elecciones, menú de pausa) el mapa sigue vivo sin input:
   * esperas de guion (ctx.wait/until), rutas, fundidos, efectos y clima avanzan. Sin esto, un guion que
   * dejara un mensaje abierto (keepOpen) y luego esperara se quedaba colgado para siempre.
   */
  updateWhilePaused(dt) {
    if (!this.ready) return;
    this.time += dt;
    this.runner.tick();
    this.fx.update();
    this.effects.update(dt);
    this.worldView.update();
    const camX = this.camera.x; const camY = this.camera.y;
    this.world.inputLocked += 1;
    try {
      this.world.update(dt);
    } finally {
      this.world.inputLocked -= 1;
    }
    this.zygarde?.update(dt, { paused: true });
    this.impossible?.update(dt, { paused: true });
    this.net?.update(dt);
    this.camera.update();
    this.weather.update(dt, this.camera.x - camX, this.camera.y - camY);
    this.panorama?.update(dt, this.camera);
  }

  doWarp(w) {
    this.runScript(async (ctx) => { await ctx.warp(w.to, w.tx, w.ty, w.dir ?? this.world.player.direction, { door: Boolean(w.door) }); }, null, `warp→${w.to}`);
  }

  tickClock() {
    if (this.world.scriptBusy()) return;
    this.clockFrames += 1;
    if (this.clockFrames >= CLOCK_FRAMES_PER_MINUTE) {
      this.clockFrames = 0;
      this.state.advanceMinutes(1);
    }
  }

  lights() {
    const cx = this.camera.renderX; const cy = this.camera.renderY;
    const p = this.world.player;
    const radius = (this.darkness?.radius ?? PLAYER_LIGHT) * (this.devFlashlight ? 2.4 : 1);
    const out = [{ x: p.realX + 16 - cx, y: p.realY + 8 - cy, radius }];
    // El Core ilumina un radio de 2 casillas a su alrededor (docs/CAMPANA.md §2.7).
    const core = this.world.core;
    if (core?.visible) out.push({ x: core.realX + 16 - cx, y: core.realY + 16 - cy, radius: 80 + Math.sin(this.time * 3) * 4, intensity: 0.9 });
    for (const e of this.world.allEntries) {
      const ox = e.offset.x * 32 - cx; const oy = e.offset.y * 32 - cy;
      for (const t of e.torches || []) out.push({ x: t.x * 32 + 16 + ox, y: t.y * 32 + 16 + oy, radius: 56 + Math.sin(this.time * 9 + t.x) * 3 });
      for (const ev of e.events || []) {
        const l = ev.page?.light;
        if (!l || ev.erased) continue;
        out.push({ x: ev.realX + 16 + ox, y: ev.realY + 16 + oy, radius: l.radius ?? 64, intensity: l.intensity ?? 1 });
      }
    }
    return out.filter((l) => l.x > -l.radius && l.y > -l.radius && l.x < 512 + l.radius && l.y < 384 + l.radius);
  }

  render(renderer) {
    if (!this.world?.current) return;
    // Los autotiles se animan con el reloj global (siguen moviéndose con menús abiertos, como en Essentials).
    this.worldView.sync(this.world, this.camera, engine.frame / 60, this.effects);
    this.effects.setCamera(this.camera.renderX, this.camera.renderY);
    const def = this.world.current.def;
    const day = def.outdoor && def.dayNight !== false ? dayNightTone(this.state.data.clock.minutes) : [0, 0, 0, 0];
    // def.tone: tono propio del mapa [r, g, b, gris] (p. ej. la penumbra verde del Laberinto).
    // Capa de crisis: efectos de cielo y tono propios de la fase, independientes del reloj (TEC-06).
    this.crisisSky?.sync();
    this.fx.apply(day, this.weather.tone(), def.tone || [0, 0, 0, 0], this.crisisSky?.tone() || null);
    const dark = this.darkness || (this.devDark ? { amount: 0.94 } : null);
    this.compositor.setDarkness(dark ? dark.amount : 0, dark ? this.lights() : []);
    this.compositor.render(
      renderer,
      (r) => { this.panorama?.render(r); this.worldView.render(r); this.weather.render(r); },
      (r) => { this.effects.renderWorld(r, this.worldView.camera); this.effects.renderSky(r); },
    );
  }

  drawUI(g) {
    if (this.ready) this.zygarde?.drawUI(g);
    if (this.ready) this.net?.drawUI(g);
    if (engine.debug && this.ready) drawDebug(this, g);
  }
}


/** Casillas con autotile de antorcha (emiten luz en mapas oscuros). */
function findTorches(entry) {
  const names = entry.res.tileset.autotiles || [];
  const slots = names.map((n, i) => (n && /antorcha|torch/i.test(n) ? i : -1)).filter((i) => i >= 0);
  if (!slots.length) return [];
  const out = [];
  const m = entry.map;
  for (let l = 0; l < 3; l++) {
    for (let y = 0; y < m.height; y++) {
      for (let x = 0; x < m.width; x++) {
        const id = m.data(x, y, l);
        if (id >= 48 && id < 384 && slots.includes(Math.floor(id / 48) - 1)) out.push({ x, y });
      }
    }
  }
  return out;
}

/** Partida provisional para probar el mapa sin pasar por el título. */
function createDevState() {
  const st = GameState.create({ name: 'Axis', gender: 'M' });
  try {
    const db = engine.data;
    st.addPokemon(createPokemon(db, 'PIKACHU', 8, { ot: { name: 'Axis', id: st.player.id } }));
  } catch (err) {
    console.warn('No se pudo crear el equipo de prueba', err);
  }
  return st;
}
