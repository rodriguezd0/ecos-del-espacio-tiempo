// Villa Alba y sus interiores (bloque 1, agente town): accesibilidad de puertas y salidas, coherencia de
// warps de ida y vuelta, conexiones con los mapas del norte, estados de los eventos por flags y guiones de
// la elección de inicial y del regreso con un ctx falso (sin navegador).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { dx, dy } from '../game/src/world/gameMap.js';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';
import { createPokemon, healed } from '../game/src/battle/core/pokemon.js';
import { TOWN_DOORS, INTERIOR_ENTRIES, TOWN_EXITS, POLICE_POST } from '../game/src/content/maps/b01/villa_alba_layout.js';
import { F, V, STARTERS, ADVANTAGE, gaelStarterFor, playerPronoun, HOME_HEAL_POINT } from '../game/src/content/events/b01_town_common.js';
import { LAB } from '../game/src/content/events/b01_town_lab.js';
import { gaelBattleConfig } from '../game/src/content/events/b01_town_return.js';
import { findRoute } from '../game/src/content/events/b01_town_path.js';
import { getTrainer } from '../game/src/content/trainers/index.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url)));
const db = { species: load('species.json'), moves: load('moves.json'), items: { ...load('items.json'), ...load('items_axis.json') } };

const TOWN_MAPS = ['villa_alba', 'casa_prota_1f', 'casa_prota_2f', 'casa_gael', 'laboratorio_alerce', 'casa_vecinos_n', 'casa_vecinos_se'];
const built = new Map();
const build = (id) => { if (!built.has(id)) built.set(id, buildMapNode(id)); return built.get(id); };

/** BFS a pie con la pasabilidad del jugador (saltando salientes hacia abajo). */
function reachable(map, sx, sy) {
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  const player = { isPlayer: true };
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of [2, 4, 6, 8]) {
      let nx = x + dx(d);
      let ny = y + dy(d);
      if (!map.valid(nx, ny)) continue;
      if (!map.passable(x, y, d, player) || !map.passable(nx, ny, 10 - d, player)) continue;
      if (map.terrainTagAt(nx, ny).ledge) { nx += dx(d); ny += dy(d); if (!map.valid(nx, ny)) continue; }
      const k = `${nx},${ny}`;
      if (!seen.has(k)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  return seen;
}

/** ¿Se puede entrar en la casilla (x, y) desde alguna vecina alcanzable? (puertas: se entra andando). */
function enterable(map, reach, x, y) {
  return [2, 4, 6, 8].some((d) => {
    const fx = x - dx(d);
    const fy = y - dy(d);
    return reach.has(`${fx},${fy}`) && map.passable(fx, fy, d, { isPlayer: true });
  });
}

test('villa_alba: desde la casa del protagonista se llega a las 5 puertas y a las salidas norte y sur', async () => {
  const { def, entry } = await build('villa_alba');
  const map = entry.map;
  assert.equal(def.width, 46);
  assert.equal(def.height, 36);
  const r = reachable(map, def.start.x, def.start.y);
  for (const [name, door] of Object.entries(TOWN_DOORS)) {
    assert.ok(enterable(map, r, door.x, door.y), `puerta de ${name} (${door.x},${door.y}) accesible`);
    assert.ok(def.warps.some((w) => w.x === door.x && w.y === door.y), `warp en la puerta de ${name}`);
  }
  for (let x = TOWN_EXITS.north.x0; x <= TOWN_EXITS.north.x1; x++) assert.ok(r.has(`${x},0`), `salida norte x=${x}`);
  for (let x = TOWN_EXITS.south.pathX0; x <= TOWN_EXITS.south.pathX1; x++) assert.ok(r.has(`${x},${def.height - 1}`), `salida sur x=${x}`);
  // El camino norte es un pasillo de 2 casillas: el policía y su casilla libre lo cierran.
  for (let y = 6; y <= 9; y++) {
    for (let x = 18; x <= 25; x++) {
      const inPath = x >= TOWN_EXITS.north.x0 && x <= TOWN_EXITS.north.x1;
      if (!inPath) assert.ok(!r.has(`${x},${y}`), `(${x},${y}) fuera del pasillo norte debe ser bosque`);
    }
  }
  assert.ok([POLICE_POST.x, POLICE_POST.free.x].every((x) => x >= TOWN_EXITS.north.x0 && x <= TOWN_EXITS.north.x1));
});

test('warps de ida y vuelta: puerta ↔ felpudo coherentes y pasables en todos los interiores', async () => {
  const town = (await build('villa_alba'));
  const townMap = town.entry.map;
  for (const w of town.def.warps) {
    const inner = await build(w.to);
    const entryPt = INTERIOR_ENTRIES[w.to];
    assert.deepEqual({ x: w.tx, y: w.ty }, entryPt, `llegada a ${w.to}`);
    assert.ok(inner.entry.map.passableStrict(w.tx, w.ty), `llegada a ${w.to} pasable`);
    const exits = inner.def.warps.filter((x) => x.to === 'villa_alba');
    assert.ok(exits.length >= 2, `${w.to} tiene salida al pueblo`);
    const reach = reachable(inner.entry.map, w.tx, w.ty);
    for (const e of exits) {
      assert.equal(e.dirTrigger, 2, 'salida pulsando abajo sobre el felpudo');
      assert.ok(reach.has(`${e.x},${e.y}`), `felpudo (${e.x},${e.y}) de ${w.to} alcanzable`);
      assert.deepEqual({ x: e.tx, y: e.ty }, { x: w.x, y: w.y + 1 }, `${w.to} devuelve bajo su puerta`);
      assert.ok(townMap.passableStrict(e.tx, e.ty), `vuelta a villa_alba (${e.tx},${e.ty}) pasable`);
    }
  }
});

test('casa del protagonista: la escalera une las dos plantas y el punto de cura es pasable', async () => {
  const up = await build('casa_prota_2f');
  const down = await build('casa_prota_1f');
  const start = up.def.start;
  const r2 = reachable(up.entry.map, start.x, start.y);
  const stairs2 = up.def.warps.find((w) => w.to === 'casa_prota_1f');
  assert.ok(enterable(up.entry.map, r2, stairs2.x, stairs2.y), 'escalera de la planta alta accesible');
  const r1 = reachable(down.entry.map, stairs2.tx, stairs2.ty);
  const stairs1 = down.def.warps.find((w) => w.to === 'casa_prota_2f');
  assert.ok(enterable(down.entry.map, r1, stairs1.x, stairs1.y), 'escalera de la planta baja accesible');
  assert.ok(up.entry.map.passableStrict(stairs1.tx, stairs1.ty), 'llegada arriba pasable');
  assert.equal(HOME_HEAL_POINT.mapId, 'casa_prota_1f');
  assert.ok(r1.has(`${HOME_HEAL_POINT.x},${HOME_HEAL_POINT.y}`), 'punto de cura alcanzable');
  // PC de almacenamiento junto al escritorio
  const pcs = up.def.events.filter((e) => String(e.id).startsWith('pc_'));
  assert.ok(pcs.some((e) => [2, 4, 6, 8].some((d) => r2.has(`${e.x - dx(d)},${e.y - dy(d)}`))), 'PC alcanzable');
});

test('laboratorio: la máquina de las Poké Balls, la escolta y la mesa del profesor están en casillas válidas', async () => {
  const { entry } = await build('laboratorio_alerce');
  const map = entry.map;
  const r = reachable(map, LAB.entry.x, LAB.entry.y);
  for (let i = 0; i < 3; i++) {
    const x = LAB.table.x + i;
    assert.ok(!map.passableStrict(x, LAB.table.y + 1), 'el frente de la máquina bloquea');
    assert.ok(r.has(`${x},${LAB.table.y + 2}`), `se puede plantar delante de la Poké Ball ${i}`);
  }
  assert.ok(r.has(`${LAB.escort.x},${LAB.escort.y}`), 'llegada de la escolta alcanzable');
  assert.ok(r.has(`${LAB.police.x},${LAB.police.y}`), 'posición del policía libre');
});

test('conexiones: el camino norte encaja con la entrada del Laberinto (y la Ruta 1 si ya existe)', async () => {
  const lab = await import('../game/src/content/maps/b01/laberinto_profundidad.js').catch(() => null);
  if (lab?.VILLA_OFFSET !== undefined) {
    assert.equal(TOWN_EXITS.north.offset, lab.VILLA_OFFSET, 'mismo desplazamiento en ambos lados');
    assert.equal(TOWN_EXITS.north.x0 - lab.VILLA_OFFSET, lab.LAB_ENTRY.x0);
    assert.deepEqual(lab.default.connections.find((c) => c.to === 'villa_alba'), { dir: 'south', to: 'villa_alba', offset: -TOWN_EXITS.north.offset });
  }
  const { def } = await build('villa_alba');
  assert.deepEqual(def.connections.map((c) => c.to).sort(), ['laberinto_profundidad', 'ruta_1']);
  const ruta = await import('../game/src/content/maps/b01/ruta_1.js').catch(() => null);
  if (ruta?.default?.connections) {
    const back = ruta.default.connections.find((c) => c.to === 'villa_alba');
    assert.ok(back, 'ruta_1 conecta de vuelta con villa_alba');
    assert.equal(back.offset, -TOWN_EXITS.south.offset, 'desplazamiento simétrico con la Ruta 1');
  }
});

// ----------------------------------------------------------------------------- estados por flags

async function townWorld(flags = []) {
  const { entry } = await build('villa_alba');
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  return { world, state, get: (id) => world.events.find((e) => e.id === id) };
}

test('policía del camino norte: guarda, escucha la señal, desaparece al entrar y vuelve tras la escolta', async () => {
  const cases = [
    [[], true, 2, true],
    [[F.starter, F.signal], true, 8, true],
    [[F.starter, F.signal, F.policeIn], false, 0, false],
    [[F.starter, F.signal, F.policeIn, F.coreFound, F.escorted], true, 2, true],
  ];
  for (const [flags, visible, dir, blocks] of cases) {
    const { get } = await townWorld(flags);
    const cop = get('policia');
    assert.equal(Boolean(cop.page), visible, `policía visible con ${flags}`);
    if (visible) assert.equal(cop.direction, dir, `dirección con ${flags}`);
    assert.equal(Boolean(get('paso_policia').page), blocks, `bloqueo con ${flags}`);
  }
  const listening = await townWorld([F.starter, F.signal]);
  assert.ok(listening.get(`escena_policia_${POLICE_POST.x}`).page, 'disparador de la escena 4.4 activo');
});

test('señal al salir del laboratorio y límites de la salida sur según el progreso', async () => {
  const before = await townWorld([]);
  assert.ok(!before.get('senal').page, 'sin inicial no hay señal');
  assert.ok(before.get('salida_sur_22').page, 'sin Pokédex la salida sur está limitada');
  const after = await townWorld([F.starter]);
  assert.equal(after.get('senal').page?.trigger, 'auto');
  const done = await townWorld([F.starter, F.signal, F.dex]);
  assert.ok(!done.get('senal').page);
  assert.ok(!done.get('salida_sur_22').page, 'con la Pokédex se puede salir');
  assert.ok(done.get('sale_pueblo_22').page, 'marca b01_left_town al cruzar');
});

// ----------------------------------------------------------------------------- guiones con ctx falso

function fakeCtx(state, { confirms = [], nickname = '', outcome = 'win' } = {}) {
  const log = [];
  const events = [{ id: 'gael', x: LAB.gael.x, y: LAB.gael.y }, { id: 'alerce', ...LAB.alerce }];
  const ctx = {
    state, db, log,
    ui: { textEntry: async () => nickname, openStorage: async () => {} },
    world: { events, follower: { visible: false } },
    player: { x: LAB.table.x, y: LAB.table.y + 2, direction: 8 },
    scene: { refreshFollower() {} },
    say: async (t, o = {}) => { log.push(['say', o.telepathy ? 'Core' : o.speaker || '', t]); },
    confirm: async (t) => { log.push(['confirm', t]); return confirms.length ? confirms.shift() : true; },
    choice: async () => 0,
    flag: (k) => state.flag(k),
    setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, fb = 0) => state.var(k, fb),
    setVar: (k, v) => state.setVar(k, v),
    givePokemon: async (spec) => { const p = createPokemon(db, spec.species, spec.level, { rng: () => 0.5 }); state.addPokemon(p); return p; },
    giveItem: async (id, n = 1) => { state.addItem(id, n); log.push(['item', id, n]); },
    heal: () => state.setParty(state.party.map((p) => healed(db, p))),
    battle: async (config) => { log.push(['battle', config.trainer]); return outcome; },
    move: async (id, route) => { log.push(['move', id, route.length]); },
    erase: (id) => log.push(['erase', id]),
    face() {}, emote: async () => {}, wait: async () => {}, cry() {}, se() {}, me() {}, bgm() {},
    movePlayerTo: async () => {}, approach: async () => {}, fade: async () => {}, shake: async () => {},
    directionTo: () => 2,
  };
  return ctx;
}

async function labEvent(id) {
  const { def } = await build('laboratorio_alerce');
  const ev = def.events.find((e) => e.id === id);
  assert.ok(ev, `evento ${id}`);
  return ev;
}

test('elección de inicial: Sobble → Gael elige Turtwig, mote aplicado y flag b01_starter_chosen', async () => {
  const state = GameState.create({ name: 'Prueba' });
  state.setFlag(F.labIntro);
  const ctx = fakeCtx(state, { confirms: [true, true], nickname: 'Burbuja' });
  const ev = await labEvent('bola_SOBBLE_frente');
  await ev.script(ctx);
  assert.equal(state.var(V.starter), 'SOBBLE');
  assert.equal(state.var(V.gaelStarter), 'TURTWIG');
  assert.ok(state.flag(F.starter));
  assert.equal(state.party.length, 1);
  assert.equal(state.party[0].level, 5);
  assert.equal(state.party[0].nickname, 'Burbuja');
  const texts = ctx.log.filter((l) => l[0] !== 'move').map((l) => l[2] || l[1]);
  assert.ok(texts.includes('¿Eliges a Sobble, el Pokémon Acuartija?'), 'pregunta con la categoría de species.json');
  assert.ok(texts.includes('Entonces yo me quedo con este.'));
  assert.ok(texts.includes('No es personal. Es lo lógico.'));
  assert.ok(ctx.log.some((l) => l[0] === 'erase' && l[1] === 'gael'), 'Gael sale antes que el jugador');
});

test('elección de inicial: decir que no no entrega nada; sin presentación solo describe la máquina', async () => {
  const state = GameState.create({ name: 'Prueba' });
  const ev = await labEvent('bola_TURTWIG_frente');
  await ev.script(fakeCtx(state));
  assert.equal(state.party.length, 0, 'antes de la presentación no se elige');
  state.setFlag(F.labIntro);
  await ev.script(fakeCtx(state, { confirms: [false] }));
  assert.equal(state.party.length, 0);
  assert.equal(state.flag(F.starter), false);
});

test('Gael elige siempre el inicial con ventaja de tipo (D05) y gael_1 lo usa a nivel 5', () => {
  assert.deepEqual(STARTERS.map(gaelStarterFor), ['LITTEN', 'SOBBLE', 'TURTWIG']);
  assert.throws(() => gaelStarterFor('PIKACHU'), /Inicial desconocido/);
  for (const sp of STARTERS) {
    const state = GameState.create({ name: 'Prueba' });
    state.setVar(V.starter, sp);
    const t = getTrainer('gael_1', state);
    assert.deepEqual(t.party, [{ species: ADVANTAGE[sp], level: 5 }]);
    assert.ok(t.canLose);
    const cfg = gaelBattleConfig(state);
    assert.equal(cfg.trainer, 'gael_1');
    assert.ok(cfg.canLose && cfg.rules.canLose, 'sin game over');
  }
  const s = GameState.create({ gender: 'F' });
  assert.equal(playerPronoun(s), 'ella');
  assert.equal(playerPronoun(GameState.create({ gender: 'M' })), 'él');
});

test('regreso al laboratorio: duelo (perdido: se cura y sigue), Pokédex + 5 Poké Balls y flags finales', async () => {
  const state = GameState.create({ name: 'Prueba', gender: 'F' });
  for (const f of [F.woke, F.metMom, F.labIntro, F.starter, F.signal, F.policeIn, F.coreFound, F.escorted]) state.setFlag(f);
  state.setVar(V.starter, 'LITTEN');
  state.setVar(V.gaelStarter, 'SOBBLE');
  state.addPokemon({ ...createPokemon(db, 'LITTEN', 5, { rng: () => 0.5 }), hp: 0 });
  const ctx = fakeCtx(state, { outcome: 'lose' });
  const director = await labEvent('escena_regreso');
  await director.pages[0].script(ctx);
  assert.ok(state.flag(F.duel) && state.flag(F.dex));
  assert.ok(state.hasPokedex());
  assert.equal(state.itemCount('POKEBALL'), 5);
  assert.ok(state.party[0].hp > 0, 'curado tras perder');
  const lines = ctx.log.filter((l) => l[0] === 'say');
  assert.ok(lines.some((l) => l[2] === '¿Decidido? ¿Por qué ella?'), 'pronombre según el género');
  // Autor, 25-09-2026: Zygarde habla muy poco; en el regreso al laboratorio el Core calla.
  assert.ok(!lines.some((l) => l[1] === 'Core'), 'el Core no habla en el regreso');
  assert.ok(lines.some((l) => l[2] === 'Ya está. Sigo sin entenderlo.'), 'texto de derrota del guion');
  assert.ok(ctx.log.some((l) => l[0] === 'battle' && l[1] === 'gael_1'));
});

test('rutas de las escenas: el NPC rodea obstáculos y se detiene junto al jugador', async () => {
  const { entry } = await build('casa_prota_1f');
  const map = entry.map;
  const npc = { x: 4, y: 5, passable: (x, y, d) => map.valid(x + dx(d), y + dy(d)) && map.passable(x, y, d, {}) && map.passable(x + dx(d), y + dy(d), 10 - d, {}) };
  const route = findRoute(npc, 11, 4);
  assert.ok(Array.isArray(route) && route.length > 0);
  let x = npc.x; let y = npc.y;
  for (const step of route) { const d = { down: 2, left: 4, right: 6, up: 8 }[step]; x += dx(d); y += dy(d); }
  assert.equal(Math.abs(x - 11) + Math.abs(y - 4), 1, 'acaba al lado del jugador');
});
