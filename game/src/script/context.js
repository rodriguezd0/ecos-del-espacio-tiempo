// Contexto `ctx` de los guiones (docs/ARCHITECTURE.md §6). Se crea por ejecución con el evento que
// lo disparó. Usa ui (ui/api.js), battle (battle/api.js vía MapScene) y engine.audio.
import { engine } from '../core/engine.js';
import { ui } from '../ui/api.js';
import { createPokemon, healed, displayName } from '../battle/core/pokemon.js';
import { dx, dy } from '../world/gameMap.js';

const DIRS = { down: 2, left: 4, right: 6, up: 8, abajo: 2, izquierda: 4, derecha: 6, arriba: 8 };

/** Dirección RMXP desde `a` hacia `b` (personajes o {x,y}). */
export function directionTo(a, b) {
  const sx = b.x - a.x;
  const sy = b.y - a.y;
  if (Math.abs(sx) > Math.abs(sy)) return sx > 0 ? 6 : 4;
  return sy > 0 ? 2 : 8;
}

export function createContext(scene, event = null) {
  const world = scene.world;
  const state = engine.state;
  const db = engine.data;
  const audio = engine.audio;

  const resolve = (target) => {
    if (target === undefined || target === null || target === 'this') return event;
    if (target === 'player') return world.player;
    if (target === 'follower') return world.follower;
    if (typeof target === 'object') return target;
    const ev = world.events.find((e) => e.id === target);
    if (!ev) throw new Error(`ctx: personaje "${target}" no existe en ${world.map?.id}`);
    return ev;
  };
  const toDir = (d) => (typeof d === 'string' ? DIRS[d] : d);
  const refresh = () => world.requestRefresh();

  const ctx = {
    scene, world, state, db, ui, audio, event,
    get player() { return world.player; },
    get map() { return world.map; },
    directionTo,

    // ---- diálogo
    say: (text, opts = {}) => ui.message(text, opts),
    choice: (items, opts = {}) => ui.choice(items, opts),
    confirm: (text, opts = {}) => ui.confirm(text, opts),
    number: (opts) => ui.number(opts),

    // ---- movimiento
    /** Ruta de movimiento; por defecto atraviesa (como pbMoveRoute) y espera. */
    async move(target, route, { wait = true, through = true, speed } = {}) {
      const ch = resolve(target);
      const list = [...(speed ? [{ speed }] : []), ...(through ? ['through_on'] : []), ...route, ...(through ? ['through_off'] : [])];
      const done = ch.forceMoveRoute(list, { skippable: true });
      if (wait) await done;
      return done;
    },
    face(target, dir) {
      const ch = resolve(target);
      if (typeof dir === 'object') ch.turnToward(dir);
      else ch.turnGeneric(toDir(dir));
    },
    turnToPlayer(target) { resolve(target)?.turnTowardPlayer(); },
    /** El evento camina hacia el jugador hasta quedar al lado (pbMoveTowardPlayer). */
    async approach(target) {
      const ch = resolve(target);
      const p = world.player;
      for (let guard = 0; guard < 64; guard++) {
        if (Math.abs(ch.x - p.x) + Math.abs(ch.y - p.y) <= 1) break;
        const ox = ch.x; const oy = ch.y;
        ch.moveTowardPlayer();
        if (ch.x === ox && ch.y === oy) break;
        await scene.runner.until(() => !ch.moving());
      }
      ch.turnTowardPlayer();
    },
    /** Lleva al jugador a (x, y) en línea (primero horizontal). opts: { through, speed } */
    async movePlayerTo(x, y, opts = {}) {
      const p = world.player;
      const route = [];
      for (let i = 0; i < Math.abs(x - p.x); i++) route.push(x > p.x ? 'right' : 'left');
      for (let i = 0; i < Math.abs(y - p.y); i++) route.push(y > p.y ? 'down' : 'up');
      await ctx.move('player', route, { through: opts.through ?? true, speed: opts.speed });
    },
    jump: (target, x, y) => ctx.move(target, [{ jump: [x, y] }], { through: false }),

    // ---- tiempo y pantalla
    wait: (frames) => scene.runner.wait(frames),
    fade: (dir = 'out', frames = 16, color = [0, 0, 0]) => (dir === 'out' ? scene.fx.fadeOut(frames, color) : scene.fx.fadeIn(frames)),
    flash: (color = [255, 255, 255], frames = 12, alpha = 255) => scene.fx.flashScreen(color, alpha, frames),
    shake: (power = 5, speed = 5, frames = 20) => scene.camera.shake(power, speed, frames),
    tone: (tone, frames = 20) => scene.fx.toneTo(tone, frames),
    transition: (name, frames = 50) => scene.fx.playTransition(name, frames),
    weather: (type, power = 5) => scene.weather.set(type, power),
    effect: (name, opts = {}) => scene.effects.add(name, opts),
    emote: (target, kind = '!') => scene.emote(resolve(target), kind),
    camera: {
      pan: (x, y, frames = 30) => scene.camera.panTo(x, y, frames),
      reset: (frames = 20) => scene.camera.reset(frames),
      follow: (target = 'player') => scene.camera.follow(resolve(target)),
      shake: (power, speed, frames) => scene.camera.shake(power, speed, frames),
    },

    // ---- mapas y combates
    warp: (mapId, x, y, dir, opts = {}) => scene.transfer(mapId, x, y, dir, opts),
    async battle(config) {
      const r = await scene.startBattle(config);
      return r.outcome;
    },
    async wildBattle(enc) {
      const r = await scene.startWildBattle(enc);
      return r.outcome;
    },

    // ---- estado
    flag: (k) => state.flag(k),
    setFlag(k, v = true) { state.setFlag(k, v); refresh(); },
    var: (k, fallback = 0) => state.var(k, fallback),
    setVar(k, v) { state.setVar(k, v); refresh(); },
    selfSwitch: (letter = 'A', target) => resolve(target)?.selfSwitch(letter),
    setSelfSwitch(letter = 'A', value = true, target) { resolve(target)?.setSelfSwitch(letter, value); refresh(); },
    erase(target) { resolve(target)?.erase(); },
    setTile(x, y, layer, id) { world.map.setTile(x, y, layer, id); },
    /** Puentes (pbBridgeOn/Off): con altura > 0 los tiles con terrain Bridge se pisan por encima. */
    bridge(height = 2) { world.bridge = height; },
    zygarde: (key) => state.zygardeAbility(key),
    requestRefresh: refresh,

    // ---- objetos y Pokémon
    async giveItem(id, n = 1, { found = false, silent = false } = {}) {
      const item = db.items?.[id];
      if (!item) console.warn(`ctx.giveItem: objeto desconocido "${id}"`);
      state.addItem(id, n);
      if (silent) return;
      const name = item?.name || id;
      audio?.playME?.('Item get');
      const qty = n > 1 ? `${n} × ` : '';
      await ui.message(found ? `¡Has encontrado ${qty}${name}!` : `¡Has obtenido ${qty}${name}!`);
    },
    async givePokemon(spec, { silent = false } = {}) {
      const pkmn = spec.uid ? spec : createPokemon(db, spec.species, spec.level ?? 5, {
        ...spec, ot: { name: state.player.name, id: state.player.id }, metMap: world.map?.id, obtainedMode: 'gift',
      });
      const where = state.addPokemon(pkmn);
      if (where.where === 'party' && where.slot === 0) scene.refreshFollower();
      if (!silent) {
        audio?.playME?.('Pkmn get');
        await ui.message(`¡\\PN ha obtenido a ${displayName(db, pkmn)}!`);
      }
      return pkmn;
    },
    heal() { state.setParty(state.party.map((p) => healed(db, p))); },
    bgm: (name, opts) => audio?.playBGM?.(name, opts),
    se: (name, opts) => audio?.playSE?.(name, opts),
    me: (name, opts) => audio?.playME?.(name, opts),
    cry: (species, form = 0) => audio?.playCry?.(species, form),

    /** Casilla de enfrente del jugador. */
    facingTile() {
      const p = world.player;
      return { x: p.x + dx(p.direction), y: p.y + dy(p.direction) };
    },
  };
  return ctx;
}
