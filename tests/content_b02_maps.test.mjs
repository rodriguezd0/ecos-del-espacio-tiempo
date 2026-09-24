// Bloque 2 — Pilar del Umbral (docs/CAMPANA.md B02): mapas, enlaces, recorridos a pie, células, encuentros y
// entrenadores. Las escenas y el puzzle se prueban en content_b02_scenes.test.mjs.
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
import { MAPS } from '../game/src/content/maps/index.js';
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { B02_CELLS, C009 } from '../game/src/content/events/b02_cells.js';
import { F } from '../game/src/content/events/b02_common.js';
import { TOWN_DOORS, TOWN_EXITS, CELL_C008, ARBOLEDA, CAMPANARIO } from '../game/src/content/maps/b02/villa_zaguan_layout.js';
import { EXPLANADA_DOOR, SCENE, EAST_PATH } from '../game/src/content/maps/b02/explanada_umbral_layout.js';
import { ENTRANCE, STONES, CAMARA, NUCLEO, PASSAGES, TUNNEL, ANTESALA } from '../game/src/content/maps/b02/ruinas_dintel_layout.js';
import { PENDING_LINKS as B01_LINKS } from '../game/src/content/maps/b01/pending_links.js';
import { PENDING_LINKS as B02_LINKS } from '../game/src/content/maps/b02/pending_links.js';
import { ZAGUAN_ENCOUNTERS, RUINAS_ENCOUNTERS, GEODUDE_GIFT } from '../game/src/content/encounters/b02.js';
import { TRAINERS } from '../game/src/content/trainers/index.js';
import { mapDisplayName } from '../game/src/content/services/zones.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B02_MAPS = ['villa_zaguan', 'zaguan_centro', 'casa_dintel', 'zaguan_casa_vecina', 'zaguan_casa_huerto', 'explanada_umbral', 'ruinas_dintel'];
const built = new Map();
const build = (id) => { if (!built.has(id)) built.set(id, buildMapNode(id)); return built.get(id); };
const norm = (raw, i = 0) => normalizeEventDef(expandEventDef(raw), i);

/** Página activa de un evento con un estado dado (la última cuya when() se cumple). */
function activePage(ev, state) {
  for (let i = ev.pages.length - 1; i >= 0; i--) {
    const p = ev.pages[i];
    if (!p.when || p.when(state, { id: ev.id, x: ev.x, y: ev.y, selfSwitch: () => false, world: null })) return p;
  }
  return null;
}

/** Casillas bloqueadas por eventos (con gráfico o sólidos, sin atravesar) en ese estado. */
function eventBlocks(def, state) {
  const out = new Set();
  (def.events || []).forEach((raw, i) => {
    const ev = norm(raw, i);
    const p = activePage(ev, state);
    if (!p || p.through) return;
    if (p.solid || p.sprite || p.tileId) out.add(`${ev.x},${ev.y}`);
  });
  return out;
}

/** BFS a pie desde (sx, sy) con bloqueos extra. */
function reachable(map, sx, sy, blocked = new Set()) {
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  const player = { isPlayer: true };
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of [2, 4, 6, 8]) {
      let nx = x + dx(d);
      let ny = y + dy(d);
      if (!map.valid(nx, ny) || blocked.has(`${nx},${ny}`)) continue;
      if (!map.passable(x, y, d, player) || !map.passable(nx, ny, 10 - d, player)) continue;
      if (map.terrainTagAt(nx, ny).ledge) { nx += dx(d); ny += dy(d); if (!map.valid(nx, ny)) continue; }
      const k = `${nx},${ny}`;
      if (!seen.has(k)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  return seen;
}

const stateWith = (...flags) => {
  const s = GameState.create({ name: 'Prueba' });
  for (const f of flags) s.setFlag(f);
  s.setVar('b02_casilda_sala', 1);
  return s;
};

// ─────────────────────────────────────────────────────────────── registro y enlaces

test('B02: los siete mapas están registrados, construyen y tienen nombre del catálogo', async () => {
  for (const id of B02_MAPS) {
    assert.ok(MAPS[id], `${id} registrado`);
    const { def, warnings } = await build(id);
    assert.equal(def.id, id);
    assert.deepEqual(warnings, [], `${id}: sin avisos de construcción`);
    assert.ok(mapDisplayName(id), `${id}: nombre visible`);
  }
  assert.equal((await build('ruinas_dintel')).def.tileset, 2);
  assert.equal((await build('explanada_umbral')).def.tileset, 7);
  assert.equal((await build('villa_zaguan')).def.tileset, 1);
});

test('enlaces: Ruta 1 ↔ Villa Zaguán ↔ Explanada simétricos; Ruta 2 con el offset pactado', async () => {
  const z = (await build('villa_zaguan')).def;
  const r1 = (await build('ruta_1')).def;
  const ex = (await build('explanada_umbral')).def;
  const north = z.connections.find((c) => c.to === 'ruta_1');
  assert.deepEqual([north.dir, north.offset], ['north', TOWN_EXITS.north.offset]);
  const back = r1.connections.find((c) => c.to === 'villa_zaguan');
  assert.ok(back, 'la Ruta 1 abre su enlace sur al existir Villa Zaguán');
  assert.equal(back.offset, B01_LINKS.villa_zaguan.offset);
  assert.equal(back.offset, -north.offset);
  const west = z.connections.find((c) => c.to === 'explanada_umbral');
  const east = ex.connections.find((c) => c.to === 'villa_zaguan');
  assert.deepEqual([west.dir, east.dir, west.offset], ['west', 'east', -east.offset]);
  if (MAPS.ruta_2) {
    const south = z.connections.find((c) => c.to === 'ruta_2');
    const r2 = (await build('ruta_2')).def.connections.find((c) => c.to === 'villa_zaguan');
    assert.ok(south && r2, 'Zaguán ↔ Ruta 2');
    assert.equal(south.offset, B02_LINKS.ruta_2.offset);
    assert.equal(r2.offset, -south.offset);
  } else {
    assert.equal(z.events.filter((e) => e.id.startsWith('limite_sur_')).length, 4);
  }
});

// ─────────────────────────────────────────────────────────────── recorridos a pie

test('Villa Zaguán: desde la Ruta 1 se llega a las puertas, a C008 y a las salidas oeste y sur', async () => {
  const { def, entry } = await build('villa_zaguan');
  const r = reachable(entry.map, TOWN_EXITS.north.x0, 0, eventBlocks(def, stateWith(F.leftTown)));
  for (const [name, d] of Object.entries(TOWN_DOORS)) assert.ok(r.has(`${d.x},${d.y + 1}`), `delante de la puerta ${name}`);
  assert.ok(r.has(`${CELL_C008.x},${CELL_C008.y}`), 'C008 en la calle principal');
  assert.ok(r.has(`0,${TOWN_EXITS.west.y0 + 1}`), 'salida oeste (explanada)');
  assert.ok(r.has(`${TOWN_EXITS.south.x0},${TOWN_EXITS.south.y - 1}`), 'hacia la salida sur');
  assert.ok(r.has(`${CAMPANARIO.stairs.x + 1},${CAMPANARIO.terrace.y + 2}`), 'lo alto del campanario por la escalera');
  assert.ok(r.has(`${ARBOLEDA.bench.x},${ARBOLEDA.bench.y + 1}`), 'delante del banco de piedra');
  // Las puertas de Exterior1 no se pisan: el warp salta al empujar contra ellas (world.js#checkPlayerTouch).
  for (const w of def.warps) assert.ok(!entry.map.passableStrict(w.x, w.y), `puerta (${w.x},${w.y}) sobre tile no pasable`);
});

test('Explanada: del camino del este al dintel y a la boca de la ruina', async () => {
  const { def, entry } = await build('explanada_umbral');
  const r = reachable(entry.map, EAST_PATH.x1, EAST_PATH.y0 + 1, eventBlocks(def, stateWith(F.leftTown, F.casildaJoined)));
  for (const p of SCENE.gateStrip) assert.ok(r.has(`${p.x},${p.y}`), `franja del dintel (${p.x},${p.y})`);
  for (const w of EXPLANADA_DOOR.warps) assert.ok(r.has(`${w.x},${w.y}`), `boca (${w.x},${w.y})`);
  assert.ok(r.has(`${EXPLANADA_DOOR.out.x},${EXPLANADA_DOOR.out.y}`), 'llegada al salir de las ruinas');
  // Antes de que Casilda te acompañe, ella tapa el hueco del dintel.
  const closed = reachable(entry.map, EAST_PATH.x1, EAST_PATH.y0 + 1, eventBlocks(def, stateWith(F.leftTown)));
  assert.ok(closed.has(`${SCENE.gateStrip[1].x},${SCENE.gateStrip[1].y}`));
});

test('Ruinas: la losa, la roca y el paso de la Guardiana cierran el recorrido en el orden del guion', async () => {
  const { def, entry } = await build('ruinas_dintel');
  const start = [ENTRANCE.arrive.x, ENTRANCE.arrive.y];
  const at = (flags) => reachable(entry.map, ...start, eventBlocks(def, stateWith(F.casildaJoined, ...flags)));
  const r0 = at([]);
  for (const st of STONES) assert.ok(r0.has(`${st.from.x},${st.from.y}`), `junto a ${st.id} (hueco de su alcoba)`);
  assert.ok(r0.has(`${ANTESALA.cell.x},${ANTESALA.cell.y}`), 'C010');
  assert.ok(r0.has('5,21'), 'C011');
  assert.ok(!r0.has(`${CAMARA.cell.x},${CAMARA.cell.y}`), 'la Cámara de Geodude está tras la losa');
  const r1 = at([F.dinteles]);
  assert.ok(r1.has(`${CAMARA.pull.x},${CAMARA.pull.y}`), 'delante del Geodude');
  assert.ok(r1.has(`${CAMARA.cell.x},${CAMARA.cell.y}`), 'C012');
  assert.ok(!r1.has(`${CAMARA.tunnelOut.x},${CAMARA.tunnelOut.y}`), 'la roca corta el túnel');
  const r2 = at([F.dinteles, F.geodudeFree, F.rockBroken]);
  assert.ok(r2.has(`${CAMARA.tunnelOut.x},${CAMARA.tunnelOut.y}`), 'salida del túnel (reto de la Guardiana)');
  assert.ok(r2.has(`${NUCLEO.front.x},${NUCLEO.front.y}`), 'delante de la columna hueca');
  assert.ok(!r2.has(`${PASSAGES.atajo.x + 1},${PASSAGES.atajo.rows[1]}`), 'el atajo sigue cerrado');
  const r3 = at([F.dinteles, F.geodudeFree, F.rockBroken, F.nucleo, F.shortcut]);
  assert.ok(r3.has(`${PASSAGES.atajo.x + 1},${PASSAGES.atajo.rows[0]}`) && r3.has(`${PASSAGES.atajo.x + 1},${PASSAGES.atajo.rows[1]}`), 'atajo abierto');
  assert.equal(TUNNEL.y, 5);
});

// ─────────────────────────────────────────────────────────────── células, encuentros y entrenadores

test('células C008, C010–C012 en sus mapas del registro; C009 es de guion', async () => {
  for (const c of B02_CELLS) {
    const reg = cellByKey(c.id);
    assert.equal(reg.id, c.code);
    assert.equal(reg.map, c.map);
    const { def } = await build(c.map);
    const ev = def.events.find((e) => e.cell === c.id);
    assert.ok(ev && ev.x === c.x && ev.y === c.y && ev.type === 'zygardeCell', `${c.code} colocada`);
  }
  assert.deepEqual(B02_CELLS.map((c) => c.code), ['C008', 'C010', 'C011', 'C012']);
  assert.ok(cellByKey(C009.id).scripted, 'C009 la entrega Casilda');
  for (const id of B02_MAPS) assert.ok(!(await build(id)).def.events.some((e) => e.cell === C009.id));
});

test('encuentros de POKEDEX_DISTRIBUCION §7.3: Zaguán (día, noche, Caña Vieja) y ruina 5–9', () => {
  const sum = (t) => t.reduce((a, [w]) => a + w, 0);
  for (const k of ['grass', 'grassNight', 'fish_old']) assert.equal(sum(ZAGUAN_ENCOUNTERS[k]), 100, k);
  assert.equal(sum(RUINAS_ENCOUNTERS.cave), 100);
  assert.deepEqual(RUINAS_ENCOUNTERS.cave.map(([w, s]) => `${s}:${w}`), ['GEODUDE:30', 'ZUBAT:30', 'MACHOP:15', 'NACLI:15', 'BONSLY:6', 'ONIX:4']);
  assert.ok(RUINAS_ENCOUNTERS.cave.every(([, , a, b]) => a === 5 && b === 9));
  assert.ok(ZAGUAN_ENCOUNTERS.grass.every(([, , a, b]) => a === 7 && b === 12));
  assert.deepEqual(GEODUDE_GIFT, { species: 'GEODUDE', level: 8 });
});

test('entrenadores: Remo, Paco e Inés nv 6–9; Casilda Bonsly 11, Nacli 11, Hippopotas 12 con Chorro Arena', () => {
  for (const id of ['b02_excursionista_remo', 'b02_montanero_paco', 'b02_arqueologa_ines']) {
    const t = TRAINERS[id];
    assert.ok(t, id);
    assert.ok(t.party.every((p) => p.level >= 6 && p.level <= 9), `${id}: niveles del tramo`);
  }
  const c = TRAINERS.b02_casilda;
  assert.deepEqual(c.party.map((p) => `${p.species}:${p.level}`), ['BONSLY:11', 'NACLI:11', 'HIPPOPOTAS:12']);
  assert.equal(c.party[2].ability, 'SANDSTREAM');
  assert.equal(c.sprite, 'casilda_front');
  assert.equal(c.overworld, 'casilda');
  assert.equal(c.bgm, 'CombateLider');
});

test('arte del bloque: los gráficos de objetos existen (tools/b02_assets.mjs)', () => {
  for (const f of ['piedra_dintel', 'piedra_dintel_viva', 'losa_dintel', 'tragaluz', 'arca_zygarde', 'banco_piedra', 'grieta_roca']) {
    assert.ok(fs.existsSync(path.join(ROOT, 'game', 'assets', 'objects', `${f}.png`)), f);
  }
});
