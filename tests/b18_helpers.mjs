// Utilidades de las pruebas del Bloque 18 — Pilar de la Convergencia (no es un archivo de test): datos del juego,
// estado de entrada del bloque (CAMPANA B18: b17_vigilia, Cadena Roja, Reconstrucción), mapa real con su World y un
// ctx de guion sin navegador que mueve de verdad al jugador y a los eventos sobre el mapa, casilla a casilla.
import fs from 'node:fs';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { storyApi } from '../game/src/content/story/api.js';
import { CELLS } from '../game/src/content/zygarde/cells.js';
import { CORE_IDS } from '../game/src/content/zygarde/thresholds.js';

export const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
export const NAME_DIR = Object.freeze({ down: 2, left: 4, right: 6, up: 8 });
export const key = (x, y) => `${x},${y}`;

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
export const db = {
  species: load('species.json'), moves: load('moves.json'), abilities: load('abilities.json'), types: load('types.json'),
  items: { ...load('items.json'), ...load('items_axis.json') }, trainerTypes: load('trainer_types.json'),
};

/** Estado de entrada del bloque: P1–P8 con sus Fragmentos y versos, 100 células, Forma Completa, Cadena Roja. */
export function entryState({ gender = 'M' } = {}) {
  const s = GameState.create({ name: 'Prueba', gender });
  for (let n = 1; n <= 8; n++) {
    s.setFlag(`p${n}_restored`);
    s.setFlag(`verse_${n}`);
    s.addFragment(`F0${n}`);
  }
  for (const k of ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive', 'fly', 'rebuild']) s.setZygardeAbility(k, true);
  for (const id of CORE_IDS) s.addCore(id);
  for (const c of CELLS) s.addCell(c.key);
  s.setZygardeForm('complete');
  s.setFlag('zyg_complete');
  s.setFlag('b17_vigilia');
  s.addKeyItem('REDCHAIN');
  return s;
}

/** Mapa real (buildMapNode) con su World; los eventos se crean con las páginas del estado dado. */
export async function fieldWorld(mapId, { state = entryState(), flags = [], vars = {} } = {}) {
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  const { entry, def } = await buildMapNode(mapId);
  const w = new World({ state });
  w.setCurrent({ ...entry, events: null });
  return { w, map: entry.map, p: w.player, state, def };
}

/** Dirección de a hacia b (2/4/6/8). */
export function directionTo(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 6 : 4;
  return dy > 0 ? 2 : 8;
}

/**
 * ctx de guion sin navegador sobre un World real. Respuestas guionizadas: `choices` (índices de ctx.choice),
 * `confirms` (booleanos de ctx.confirm) y `battles` (resultados de ctx.battle); sin guion: 0, true y 'win'.
 * Registra lo dicho (said: { text, speaker }) y en `log` curas, warps, combates ({ request, saidAt }) y avisos.
 */
export function fieldCtx(t, { choices = [], confirms = [], battles = [] } = {}) {
  const { w, p, state, map } = t;
  const said = [];
  const log = { heals: 0, warps: [], battles: [], toasts: [], choices: [] };
  const queue = { choices: [...choices], confirms: [...confirms], battles: [...battles] };
  const charOf = (who) => (who === 'player' ? p : who);
  const ctx = {
    state, map, player: p, world: w, said, log, event: null, scene: null,
    ui: { toast: (m) => log.toasts.push(m), showLocation: () => {} },
    say: async (text, opts = {}) => { said.push({ text, speaker: opts.speaker ?? (opts.telepathy ? 'Zygarde' : null) }); },
    choice: async (options, opts = {}) => {
      const i = queue.choices.length ? queue.choices.shift() : 0;
      log.choices.push({ message: opts.message ?? '', options: [...options], picked: i });
      return i;
    },
    confirm: async (text) => {
      log.choices.push({ message: text, options: ['Sí', 'No'] });
      return queue.confirms.length ? queue.confirms.shift() : true;
    },
    move: async (who, route = []) => {
      const ch = charOf(who);
      if (!ch) return;
      for (const m of route) {
        const d = NAME_DIR[m];
        if (d) ch.moveTo(ch.x + DV[d][0], ch.y + DV[d][1]);
      }
    },
    face: (who, dir) => {
      const ch = charOf(who);
      if (ch) ch.direction = typeof dir === 'number' ? dir : (NAME_DIR[dir] || ch.direction);
    },
    turnToPlayer: (ev) => { if (ev) ev.direction = directionTo(ev, p); },
    directionTo: (a, b) => directionTo(a, b),
    emote: async () => {}, approach: async () => {},
    wait: async () => {}, fade: async () => {}, flash: async () => {}, shake: () => {}, tone: async () => {},
    bgm: () => {}, se: () => {}, me: () => {}, cry: () => {},
    heal: () => { log.heals += 1; },
    warp: async (mapId, x, y, dir) => {
      log.warps.push({ mapId, x, y, dir });
      if (mapId === map.id) { p.moveTo(x, y); if (dir) p.direction = dir; }
    },
    battle: async (request) => {
      log.battles.push({ request, saidAt: said.length }); // saidAt: líneas dichas antes del combate
      return queue.battles.length ? queue.battles.shift() : 'win';
    },
    erase: (ev) => { if (typeof ev?.erase === 'function') ev.erase(); else if (ev) ev.erased = true; },
    effect: () => ({ remove: () => {} }),
    camera: { pan: async () => {}, reset: async () => {} },
    requestRefresh: () => w.refreshEvents(),
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    zygarde: (k) => state.zygardeAbility(k),
    setSelfSwitch: (letter, v = true) => state.setSelfSwitch(map.id, ctx.event?.id, letter, v),
    setHealPoint: (x, y, dir) => state.setHealPoint(map.id, x, y, dir),
    giveItem: async (id, n = 1) => { if (db.items[id]?.pocket === 8) state.addKeyItem(id); else state.addItem(id, n); },
    setTile: (x, y, layer, id) => map.setTile(x, y, layer, id),
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

/** Evento vivo (con página activa) por id. */
export const liveEvent = (w, id) => w.events.find((e) => e.id === id && !e.erased && e.page) || null;

/** Ejecuta el guion de la página activa del evento `id` (refresca antes las páginas). */
export async function runEvent(ctx, id) {
  ctx.world.refreshEvents();
  const ev = liveEvent(ctx.world, id);
  if (!ev) throw new Error(`runEvent: el evento "${id}" no tiene página activa`);
  const script = ev.page.script || ev.script;
  if (typeof script !== 'function') throw new Error(`runEvent: el evento "${id}" no tiene guion`);
  ctx.event = ev;
  try {
    await script(ctx);
  } finally {
    ctx.event = null;
    ctx.world.refreshEvents();
  }
}

/** ¿Se dijo esa línea exacta (y con ese hablante, si se pide)? */
export const saidLine = (ctx, text, speaker) => ctx.said.some((l) => l.text === text && (speaker === undefined || l.speaker === speaker));
