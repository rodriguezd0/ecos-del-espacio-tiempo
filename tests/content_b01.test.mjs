// Bloque 1 — ajustes DECIDIDO-DEV (docs/CAMPANA.md «B01 — ajustes») e integración: elenco (Olmedo, Arenzana,
// Lía), C001 con su escena forzada, células de la Ruta 1 (§2.3) en pasos obligados, topógrafos del Consorcio,
// mirador con cuesta de grava, cruce oeste y salida sur cerrados hasta que existan sus mapas, ventana con el
// Monte del Portal, punto de cura con ctx.setHealPoint, resultado de combate unificado y sprites de entrenador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { dx, dy } from '../game/src/world/gameMap.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { normalizeEventDef } from '../game/src/world/mapEvent.js';
import { GameState } from '../game/src/core/state.js';
import { getCharacter } from '../game/src/content/characters.js';
import { F, SPEAKER, SPRITE, CAST, HOME_HEAL_POINT, setHomeHealPoint } from '../game/src/content/events/b01_town_common.js';
import { B01_CELLS, cellsOf } from '../game/src/content/events/b01_cells.js';
import { PARTERRE_CELL, PARTERRE_LINE, parterreScene } from '../game/src/content/events/b01_town_cell.js';
import { SURVEYOR_LINE } from '../game/src/content/events/b01_north_ruta1.js';
import { PENDING_LINKS, linkIfReady, mapRegistered } from '../game/src/content/maps/b01/pending_links.js';
import { WEST_CROSSING, LOOKOUT, SURVEY } from '../game/src/content/maps/b01/ruta_1.js';
import { WINDOW_VIEW } from '../game/src/content/maps/b01/casa_prota_2f.js';
import { resultParty, finalizeBattleResult, caughtList, applyBattleResult } from '../game/src/battle/scene/results.js';
import { resolveTrainerSprite } from '../game/src/battle/scene/trainerSprites.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const norm = (raw, i = 0) => normalizeEventDef(expandEventDef(raw), i);
const built = new Map();
const build = (id) => { if (!built.has(id)) built.set(id, buildMapNode(id)); return built.get(id); };

/** BFS a pie; `blocked(x, y)` añade casillas cerradas (eventos sólidos). */
function reachable(map, sx, sy, blocked = () => false) {
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  const player = { isPlayer: true };
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of [2, 4, 6, 8]) {
      let nx = x + dx(d);
      let ny = y + dy(d);
      if (!map.valid(nx, ny) || blocked(nx, ny)) continue;
      if (!map.passable(x, y, d, player) || !map.passable(nx, ny, 10 - d, player)) continue;
      if (map.terrainTagAt(nx, ny).ledge) { nx += dx(d); ny += dy(d); if (!map.valid(nx, ny)) continue; }
      const k = `${nx},${ny}`;
      if (!seen.has(k)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  return seen;
}

// ----------------------------------------------------------------------------- elenco (X07)

test('elenco: Agente Olmedo, familia Arenzana y Lía con el sprite de ayudante', async () => {
  assert.equal(SPEAKER.police, 'Agente Olmedo');
  assert.equal(SPEAKER.assistant, 'Lía');
  assert.equal(CAST.owners, 'Arenzana');
  assert.equal(SPRITE.assistant, 'ayudante');
  assert.equal(getCharacter('ayudante')?.kind, 'charset');
  const { def } = await build('villa_alba');
  assert.match(def.events.find((e) => e.id === 'cartel_laberinto').text, /familia Arenzana/);
  const lab = await build('laberinto_profundidad');
  assert.match(lab.def.events.find((e) => e.id === 'cartel_laberinto').text, /Arenzana/);
});

// ----------------------------------------------------------------------------- C001 (parterre)

test('C001: célula del parterre central, visible solo con la Pokédex y escena forzada una vez', async () => {
  const { def, entry } = await build('villa_alba');
  const cell = norm(def.events.find((e) => e.id === PARTERRE_CELL.id));
  const scene = norm(def.events.find((e) => e.id === 'escena_celula_parterre'));
  assert.equal(PARTERRE_CELL.code, 'C001');
  assert.ok(entry.map.playerPassable(PARTERRE_CELL.x, PARTERRE_CELL.y, 0, {}), 'la casilla de la célula se pisa');
  const s = GameState.create({ name: 'Prueba' });
  assert.equal(cell.pages[0].when(s), false, 'sin Pokédex no aparece');
  assert.equal(scene.pages[0].when(s), false);
  s.setFlag(F.dex);
  assert.equal(cell.pages[0].when(s), true);
  assert.equal(scene.pages[0].when(s), true, 'escena al salir del laboratorio con la Pokédex');
  assert.equal(scene.pages[0].trigger, 'auto');
  s.addCell(PARTERRE_CELL.id);
  assert.equal(scene.pages[0].when(s), false, 'una sola vez');
  assert.equal(cell.pages[0].when(s), false);
});

test('C001: la escena dice «Aquí. Una parte de mí.» por telepatía y recoge la célula (1/100)', async () => {
  const state = GameState.create({ name: 'Prueba' });
  state.setFlag(F.dex);
  const said = [];
  const player = { x: 37, y: 19, direction: 2, passable: () => true };
  const ctx = {
    state, player, world: { core: { visible: false } }, audio: null,
    wait: async () => {}, face() {}, emote: async () => {}, flash: async () => {}, se() {}, requestRefresh() {},
    directionTo: () => 4, movePlayerTo: async () => {},
    move: async (_who, route) => { said.push(['move', route.length]); },
    say: async (t, o = {}) => { said.push([o.telepathy ? 'Core' : '', t]); },
  };
  await parterreScene(ctx);
  assert.equal(PARTERRE_LINE, 'Aquí. Una parte de mí.');
  assert.deepEqual(said.find((l) => l[0] === 'Core'), ['Core', PARTERRE_LINE]);
  assert.ok(said.some((l) => l[0] === 'move' && l[1] > 0), 'camina hasta el parterre');
  assert.ok(state.hasCell(PARTERRE_CELL.id));
  assert.ok(said.some((l) => l[1] === 'Has encontrado una Célula de Zygarde. (1/100)'));
});

// ----------------------------------------------------------------------------- Ruta 1: células (§2.3)

test('Ruta 1: C002–C006 y C024 con sus claves y sin la marca [PROVISIONAL D10]', async () => {
  const codes = cellsOf('ruta_1').map((c) => `${c.code}:${c.id}`);
  assert.deepEqual(codes, ['C002:cell_ruta_1_1', 'C003:cell_ruta_1_2', 'C004:cell_ruta_1_3', 'C005:cell_ruta_1_4', 'C006:cell_ruta_1_5', 'C024:cell_ruta_1_6']);
  const { def } = await build('ruta_1');
  for (const c of cellsOf('ruta_1')) {
    const ev = def.events.find((e) => e.id === c.id);
    assert.ok(ev && ev.type === 'zygardeCell' && ev.x === c.x && ev.y === c.y, `${c.id} en su casilla`);
  }
  const src = fs.readFileSync(path.join(ROOT, 'game/src/content/events/b01_north_ruta1.js'), 'utf8');
  assert.ok(!src.includes('PROVISIONAL D10'), 'ya está decidido (D10 DECIDIDO-DEV)');
  assert.equal(B01_CELLS.filter((c) => c.required).length, 5, 'C001–C005 obligatorias: 5 células al salir del bloque');
});

test('Ruta 1: C002 en el puente (único cruce), C003 entre las rocas, C002–C005 sobre el camino', async () => {
  const { def, entry } = await build('ruta_1');
  const map = entry.map;
  const south = (r) => [13, 14, 15, 16].some((x) => r.has(`${x},${def.height - 1}`));
  assert.ok(south(reachable(map, 14, 0)), 'la ruta se recorre de norte a sur');
  const c2 = B01_CELLS.find((x) => x.id === 'cell_ruta_1_1');
  assert.equal(south(reachable(map, 14, 0, (x, y) => y === c2.y && Math.abs(x - c2.x) <= 1)), false, 'el puente de C002 es el único cruce del arroyo');
  const c3 = B01_CELLS.find((x) => x.id === 'cell_ruta_1_2');
  const free = (x, y) => map.playerPassable(x, y, 0, {});
  assert.ok(!free(c3.x - 1, c3.y) && !free(c3.x + 1, c3.y), 'C003 en el hueco entre las rocas del estrechamiento');
  assert.ok(c2.x >= 13 && c2.x <= 15 && c2.y >= 17 && c2.y <= 20, 'C002 sobre el puente de troncos');
  for (const c of [c3, ...['cell_ruta_1_3', 'cell_ruta_1_4'].map((id) => B01_CELLS.find((x) => x.id === id))]) {
    assert.equal(map.terrainTagAt(c.x, c.y).id, 'Sand', `${c.id} sobre el camino`);
  }
  const luis = def.events.find((e) => e.id === 'bichero_luis');
  const c4 = B01_CELLS.find((x) => x.id === 'cell_ruta_1_3');
  assert.ok(Math.abs(c4.x - luis.x) + Math.abs(c4.y - luis.y) <= 4, 'C004 junto al Bichero Luis');
  const sign = def.events.find((e) => e.id === 'cartel_umbral');
  const c5 = B01_CELLS.find((x) => x.id === 'cell_ruta_1_4');
  assert.ok(Math.abs(c5.x - sign.x) + Math.abs(c5.y - sign.y) <= 3, 'C005 junto al cartel del Pilar del Umbral');
});

test('Ruta 1: la cuesta de grava (gravelSlope) es el único acceso al mirador y a C024', async () => {
  const { def, entry } = await build('ruta_1');
  const gravel = def.events.filter((e) => e.type === 'gravelSlope');
  assert.equal(gravel.length, LOOKOUT.ramp.length);
  const c24 = B01_CELLS.find((c) => c.code === 'C024');
  const onGravel = (x, y) => gravel.some((g) => g.x === x && g.y === y);
  assert.ok(reachable(entry.map, 14, 0).has(`${c24.x},${c24.y}`), 'con la cuesta abierta se llega');
  assert.equal(reachable(entry.map, 14, 0, onGravel).has(`${c24.x},${c24.y}`), false, 'a pie, la grava lo impide');
  assert.equal(c24.stage, 'B', 'etapa B (Correr)');
});

// ----------------------------------------------------------------------------- Ruta 1: Consorcio y enlaces

test('Ruta 1: dos topógrafos del Consorcio Meridiano con trípode hasta restaurar el Pilar del Umbral', async () => {
  const { def } = await build('ruta_1');
  const ids = ['topografo_a', 'topografa_b', 'tripode'];
  const evs = ids.map((id) => norm(def.events.find((e) => e.id === id)));
  assert.equal(SURVEYOR_LINE, 'Lecturas de campo. Siga, por favor.');
  const s = GameState.create({ name: 'Prueba' });
  for (const ev of evs) assert.ok(ev.pages[0].when(s), `${ev.id} presente`);
  s.setFlag('p1_restored');
  for (const ev of evs) assert.equal(ev.pages[0].when(s), false, `${ev.id} se va tras el P1`);
  assert.deepEqual([evs[2].x, evs[2].y], [SURVEY.tripod.x, SURVEY.tripod.y]);
  assert.ok(fs.existsSync(path.join(ROOT, 'game/assets/objects/tripode.png')));
  const said = [];
  await evs[0].pages[0].script({ say: async (t, o) => said.push([o.speaker, t]), face() {}, event: null });
  assert.deepEqual(said, [['Topógrafo', SURVEYOR_LINE]]);
});

test('Ruta 1: cruce oeste a la Ruta 10 y salida sur a Villa Zaguán cerrados hasta que existan', async () => {
  const { def, entry } = await build('ruta_1');
  assert.equal(PENDING_LINKS.ruta_10.blocked, 'El camino del oeste está cortado por un desprendimiento.');
  for (const id of ['ruta_10', 'villa_zaguan']) {
    if (mapRegistered(id)) {
      assert.ok(def.connections.some((c) => c.to === id), `${id} ya existe: conexión activa`);
      continue;
    }
    assert.equal(linkIfReady(id), null);
    assert.ok(!def.connections.some((c) => c.to === id), `sin conexión a ${id}`);
  }
  if (!mapRegistered('ruta_10')) {
    const block = def.events.filter((e) => e.id.startsWith('desprendimiento_'));
    assert.equal(block.length, 2);
    const r = reachable(entry.map, 14, 0);
    for (const b of block) assert.ok(r.has(`${b.x},${b.y}`), 'el aviso se alcanza por el cruce');
    const cut = reachable(entry.map, 14, 0, (x, y) => block.some((b) => b.x === x && b.y === y));
    assert.equal(cut.has('0,16') || cut.has('0,17'), false, 'el desprendimiento corta el borde oeste');
  }
  if (!mapRegistered('villa_zaguan')) {
    assert.equal(def.events.filter((e) => e.id.startsWith('limite_sur_')).length, 4);
  }
  assert.ok(def.events.some((e) => e.id === 'cartel_ruta10' && /RUTA 10/.test(e.text)));
  assert.equal(WEST_CROSSING.y0, 16);
  assert.equal(PENDING_LINKS.villa_zaguan.to, 'villa_zaguan');
  assert.equal(PENDING_LINKS.villa_zaguan.dir, 'south');
});

// ----------------------------------------------------------------------------- habitación y punto de cura

test('habitación: la ventana muestra el Monte del Portal con su cascada (sprite y texto)', async () => {
  const { def } = await build('casa_prota_2f');
  const view = def.events.find((e) => e.id === 'vista_monte');
  assert.ok(view && view.x === WINDOW_VIEW.x && view.y === WINDOW_VIEW.y);
  assert.ok(fs.existsSync(path.join(ROOT, 'game/assets', view.sprite.slice(6))), 'asset generado (tools/b01_assets.mjs)');
  const text = def.events.find((e) => e.id === 'ventana_0_0');
  assert.ok(text);
  const said = [];
  await text.script({ say: async (t) => said.push(t) });
  assert.match(said[0], /Monte del Portal/);
  assert.match(said[0], /cascada/);
});

test('punto de cura de casa con ctx.setHealPoint (API de guiones)', () => {
  const calls = [];
  setHomeHealPoint({ setHealPoint: (...a) => calls.push(a) });
  assert.deepEqual(calls, [[HOME_HEAL_POINT.x, HOME_HEAL_POINT.y, HOME_HEAL_POINT.dir, HOME_HEAL_POINT.mapId]]);
  setHomeHealPoint(null); // sin ctx no falla
});

// ----------------------------------------------------------------------------- integración de combate

test('resultado de combate unificado: party (motor: playerParty), caught, stored y canLose', () => {
  const p = { uid: 1, species: 'TURTWIG' };
  assert.deepEqual(resultParty({ playerParty: [p, null] }), [p]);
  assert.deepEqual(resultParty({ party: [p] }), [p]);
  assert.equal(resultParty({}), null);
  const r = finalizeBattleResult({ outcome: 'caught', playerParty: [p], caughtAll: [{ species: 'BIDOOF' }] }, { stored: false, canLose: true });
  assert.deepEqual(r.party, [p]);
  assert.equal(r.caught.species, 'BIDOOF');
  assert.equal(r.stored, false);
  assert.equal(r.canLose, true);
  assert.deepEqual(caughtList(r).map((c) => c.species), ['BIDOOF']);
  assert.equal(finalizeBattleResult(null).outcome, 'win');
  // un resultado sin equipo (combate fallido) nunca vacía el equipo de la partida
  const s = GameState.create({ name: 'Prueba' });
  s.addPokemon({ uid: 9, species: 'LITTEN', level: 5, hp: 10, moves: [] });
  applyBattleResult(s, finalizeBattleResult({ outcome: 'forfeit' }));
  assert.equal(s.party.length, 1);
});

test('sprites de combate: getBattleSprite (alias anil:<clase>, frontales propios y charsets con frontal)', () => {
  assert.match(resolveTrainerSprite('anil:bichero').file, /Trainers\/CAZABICHOS\.png$/);
  assert.match(resolveTrainerSprite('anil:CHICO').file, /Trainers\/CHICO\.png$/);
  assert.equal(resolveTrainerSprite('guardiana_front').file, getCharacter('guardiana_front').file);
  assert.equal(resolveTrainerSprite('gael').file, getCharacter('gael_front').file, 'charset → su frontal');
  assert.equal(resolveTrainerSprite('gael_front').source, 'axis');
  assert.equal(resolveTrainerSprite('RARO', { anilUrl: (p) => `X/${p}` }).file, 'X/Graphics/Trainers/RARO.png');
  assert.equal(resolveTrainerSprite(''), null);
});
