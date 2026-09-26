// Bloque 1, zona norte/sur (agente north): cadena de seguidores (D06), setos del Laberinto, sigilo,
// escena del Core, Ruta 1 (encuentros §5, entrenadores §6, células [PROVISIONAL D10]).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapFromRows, miniWorld } from './world_helpers.mjs';
import { Character } from '../game/src/world/character.js';
import { Follower, followChain, placeChainBehind } from '../game/src/world/follower.js';
import { MapEvent, normalizeEventDef } from '../game/src/world/mapEvent.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { dx, dy } from '../game/src/world/gameMap.js';
import { GameState } from '../game/src/core/state.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { layoutHedges, HEDGE } from '../game/src/content/maps/b01/laberinto_setos.js';
import {
  FULL_PATROL, SHORT_PATROL, SAFE_SPOT, SIGHT, SHORT_AFTER, CAUGHT_VAR, patrolPath, sightReach, stealthEvents,
} from '../game/src/content/events/b01_north_stealth.js';
import { CORE_LINES, POLICE_LINES, coreChoice } from '../game/src/content/events/b01_north_core.js';
import { RUTA1_CELLS, RUTA1_TRAINERS, cellFoundText } from '../game/src/content/events/b01_north_ruta1.js';
import { RUTA_1 } from '../game/src/content/encounters/b01.js';
import { TRAINERS } from '../game/src/content/trainers/index.js';
import { coreSilenceLine, coreTalk, coreSpriteKey, coreFollows } from '../game/src/content/companion.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GUION = fs.readFileSync(path.join(ROOT, 'docs', 'bloques', 'B01_apertura.md'), 'utf8');

/** BFS a pie con la pasabilidad del jugador (salta salientes hacia abajo). */
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

function chain(map) {
  const w = miniWorld(map);
  const leader = new Character(w, { map, x: 3, y: 0, speed: 4, dir: 6 });
  const core = new Follower(w, { id: 'core', kind: 'core', map });
  core.setGraphic('zygarde_core');
  const pk = new Follower(w, { map });
  pk.setPokemon({ species: 'PIKACHU', form: 0 });
  placeChainBehind(leader, [core, pk]);
  return { leader, core, pk };
}

// ----------------------------------------------------------------------------- seguidores en cadena (D06)

test('cadena: se coloca en fila detrás del jugador (jugador → Core → Pokémon)', () => {
  const { core, pk } = chain(mapFromRows(['.........']));
  assert.deepEqual([core.x, pk.x], [2, 1]);
});

test('cadena: el Core ocupa la casilla que deja el jugador y el Pokémon la que deja el Core', () => {
  const { leader, core, pk } = chain(mapFromRows(['.........']));
  leader.moveGeneric(6);
  followChain(leader, [core, pk]);
  assert.deepEqual([leader.x, core.x, pk.x], [4, 3, 2]);
});

test('cadena: al darse la vuelta nadie pisa la casilla nueva del jugador', () => {
  const { leader, core, pk } = chain(mapFromRows(['.........']));
  leader.moveGeneric(4); // vuelve sobre el Core
  followChain(leader, [core, pk]);
  assert.equal(leader.x, 2);
  assert.equal(core.x, 3, 'el Core pasa a la casilla que dejó el jugador');
  assert.notEqual(pk.x, leader.x, 'el Pokémon no se mete debajo del jugador');
});

test('cadena: un seguidor oculto no rompe la fila (el Pokémon sigue al jugador)', () => {
  const { leader, core, pk } = chain(mapFromRows(['.........']));
  core.setGraphic('');
  leader.moveGeneric(6);
  followChain(leader, [core, pk]);
  assert.equal(pk.x, 3);
});

test('cadena: tras un saliente, el segundo seguidor salta por encima como el primero', () => {
  const map = mapFromRows(['.', '.', '.', 'L', '.', '.', '.']);
  const w = miniWorld(map);
  const leader = new Character(w, { map, x: 0, y: 2, speed: 4, dir: 2 });
  const core = new Follower(w, { id: 'core', map }); core.setGraphic('zygarde_core');
  const pk = new Follower(w, { map }); pk.setPokemon({ species: 'PIKACHU' });
  core.moveTo(0, 1); pk.moveTo(0, 0);
  leader.jump(0, 2); // salta el saliente (2 → 4)
  followChain(leader, [core, pk]);
  assert.deepEqual([core.y, pk.y], [2, 1]);
  leader.endMovement?.(); leader.moveTo(0, 4);
  leader.startStep(2); // 4 → 5
  core.moveTo(core.x, core.y); pk.moveTo(pk.x, pk.y);
  followChain(leader, [core, pk]);
  assert.equal(core.y, 4, 'el Core salta el saliente');
  assert.equal(pk.y, 2, 'el Pokémon ocupa la casilla que dejó el Core');
});

test('Core como compañero: gráfico por forma y solo si hay forma', () => {
  assert.equal(coreSpriteKey('core'), 'zygarde_core');
  assert.equal(coreSpriteKey(null), '');
  const st = GameState.create();
  assert.equal(coreFollows(st), false);
  st.data.zygarde.form = 'core';
  assert.equal(coreFollows(st), true);
});

// Autor, 25-09-2026: Zygarde es un legendario serio; al hablarle no charla (antes: frases contextuales).
test('Core: al hablarle se gira en silencio (narración, sin telepatía ni frases de ambiente)', async () => {
  assert.equal(coreSilenceLine('core'), 'El Core te mira un instante. No dice nada.');
  assert.equal(coreSilenceLine('10'), 'Zygarde te mira un instante. No dice nada.');
  const said = [];
  const st = GameState.create();
  st.data.zygarde.form = 'core';
  let turned = false;
  await coreTalk({ state: st, player: {}, say: async (t, o = {}) => said.push([t, Boolean(o.telepathy)]) }, { turnToward: () => { turned = true; } });
  assert.ok(turned);
  assert.deepEqual(said, [['El Core te mira un instante. No dice nada.', false]]);
});

// ----------------------------------------------------------------------------- setos del Laberinto

test('setos: un tramo horizontal tiene copa, cuerpo, cara y sombra; el vertical remata y se une en T', () => {
  const h = layoutHedges([[0, 3, 0]], [[1, 2, 4]]);
  assert.equal(h.cells.get('0,0'), HEDGE.top.l);
  assert.equal(h.cells.get('3,0'), HEDGE.top.r);
  assert.ok(HEDGE.body.m.includes(h.cells.get('2,1')));
  assert.ok(HEDGE.under.m.includes(h.under.get('2,1')));
  assert.equal(h.cells.get('1,4'), HEDGE.foot, 'pie del seto vertical');
  assert.ok(HEDGE.vert.includes(h.cells.get('1,2')), 'cuerpo unido al tramo de arriba');
  assert.ok(!h.lips.some(([x, y]) => x === 1 && y === 2), 'sin sombra donde sigue el seto');
  assert.ok(h.lips.some(([x, y]) => x === 0 && y === 2));
});

// ----------------------------------------------------------------------------- Laberinto: sigilo

test('laberinto: del punto seguro se llega a la entrada de la cámara y al pasillo de patrulla', async () => {
  const { entry } = await buildMapNode('laberinto_profundidad');
  const r = reachable(entry.map, SAFE_SPOT.x, SAFE_SPOT.y);
  for (const k of ['19,14', '20,14', '19,13', '9,16', '31,16', '32,10']) assert.ok(r.has(k), `alcanzable ${k}`);
  assert.ok(r.has(`19,${entry.map.height - 1}`), 'salida al pueblo (borde sur)');
});

test('laberinto: las rutas del policía pisan casillas libres y la corta no ve el hueco de la cámara', async () => {
  const { entry } = await buildMapNode('laberinto_profundidad');
  const map = entry.map;
  for (const patrol of [FULL_PATROL, SHORT_PATROL]) {
    for (const [x, y] of patrolPath(patrol)) assert.ok(map.passableStrict(x, y), `ruta sobre (${x},${y})`);
    const p = patrolPath(patrol);
    assert.deepEqual(p[p.length - 1], p[0], 'la ruta vuelve al inicio (bucle)');
  }
  const minX = Math.min(...patrolPath(SHORT_PATROL).filter(([, y]) => y === 16).map(([x]) => x));
  assert.ok(minX - SIGHT > 20, 'la patrulla corta no alcanza a ver x 19–20');
});

test('laberinto: la visión del policía son 4 casillas en línea recta y los setos la cortan', async () => {
  const { entry } = await buildMapNode('laberinto_profundidad');
  const world = { map: entry.map, player: null, env: () => ({}), rng: () => 0.5 };
  const ev = new MapEvent(world, entry.map, normalizeEventDef({ id: 'p', x: 5, y: 16, sprite: 'policia', dir: 6 }));
  ev.refresh();
  assert.equal(sightReach(ev), SIGHT);
  ev.direction = 8;
  assert.equal(sightReach(ev), 0, 'seto al norte');
  const player = { x: 8, y: 16, width: 1, height: 1 };
  ev.direction = 6;
  ev.trigger = 'eventTouch';
  assert.equal(ev.canReachPlayer(player, SIGHT), true);
  assert.equal(ev.canReachPlayer({ x: 8, y: 19, width: 1, height: 1 }, SIGHT), false);
});

test('laberinto: nunca hay dos policías y el que patrulla se va con la escolta', () => {
  const [full, short] = stealthEvents().map((e) => normalizeEventDef(expandEventDef(e), 0));
  const active = (def, s) => def.pages.some((p) => p.when(s));
  const st = GameState.create();
  assert.equal(active(full, st) || active(short, st), false, 'antes de que entre el policía');
  st.setFlag('b01_police_entered');
  for (let n = 0; n <= SHORT_AFTER + 1; n++) {
    st.setVar(CAUGHT_VAR, n);
    assert.equal(Number(active(full, st)) + Number(active(short, st)), 1, `detecciones ${n}`);
    assert.equal(active(short, st), n >= SHORT_AFTER);
  }
  st.setFlag('b01_core_found');
  assert.equal(Number(active(full, st)) + Number(active(short, st)), 1, 'sigue en la escena del Core');
  st.setFlag('b01_escorted');
  assert.equal(active(full, st) || active(short, st), false);
});

// ----------------------------------------------------------------------------- escena del Core (§4.6)

test('Core: las líneas son las del guion, literales', () => {
  for (const line of [...CORE_LINES.intro.slice(1), CORE_LINES.whatAreYou, CORE_LINES.accept, ...CORE_LINES.choices, ...POLICE_LINES]) {
    assert.ok(GUION.includes(line), `línea fuera del guion: ${line}`);
  }
});

test('Core: "¿Qué eres?" responde y vuelve a preguntar hasta "Te ayudaré."', async () => {
  const answers = [1, 1, 0];
  const said = [];
  await coreChoice(async () => answers.shift(), async (t) => { said.push(t); });
  assert.deepEqual(said, [CORE_LINES.whatAreYou, CORE_LINES.whatAreYou]);
});

test('laberinto: el Core está hasta b01_core_found (nunca en dos sitios)', async () => {
  const { def } = await buildMapNode('laberinto_profundidad');
  const core = normalizeEventDef(expandEventDef(def.events.find((e) => e.id === 'core_camara')), 0);
  const st = GameState.create();
  assert.ok(core.pages[0].when(st));
  st.setFlag('b01_core_found');
  assert.ok(!core.pages[0].when(st));
});

// ----------------------------------------------------------------------------- Ruta 1

test('Ruta 1: encuentros de §5 (hierba, niveles 2–4, pesos)', () => {
  const want = { STARLY: 20, BIDOOF: 20, LILLIPUP: 15, KRICKETOT: 15, SHINX: 10, BUDEW: 10, WURMPLE: 10 };
  const got = Object.fromEntries(RUTA_1.grass.map(([w, sp]) => [sp, w]));
  assert.deepEqual(got, want);
  for (const [, , min, max] of RUTA_1.grass) assert.deepEqual([min, max], [2, 4]);
});

test('Ruta 1: entrenadores de §6 con sus equipos', () => {
  const party = (id) => TRAINERS[id].party.map((p) => `${p.species}${p.level}`).join(',');
  assert.equal(party('r1_joven_pablo'), 'BIDOOF4');
  assert.equal(party('r1_chica_nerea'), 'STARLY3,BUDEW3');
  assert.equal(party('r1_bichero_luis'), 'WURMPLE3,KRICKETOT4');
  for (const t of RUTA1_TRAINERS) assert.ok(TRAINERS[t.trainer], `definición de ${t.trainer}`);
});

test('Ruta 1: desde Villa Alba se llega a células, objetos, entrenadores y al límite sur', async () => {
  const { def, entry } = await buildMapNode('ruta_1');
  const r = reachable(entry.map, 14, 0);
  for (const c of RUTA1_CELLS) assert.ok(r.has(`${c.x},${c.y}`), `célula ${c.id}`);
  for (const t of RUTA1_TRAINERS) {
    const front = [t.x + dx(t.dir), t.y + dy(t.dir)];
    assert.ok(r.has(front.join(',')), `delante de ${t.id}`);
  }
  for (const ev of def.events.filter((e) => e.type === 'item')) {
    const near = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([ox, oy]) => r.has(`${ev.x + ox},${ev.y + oy}`));
    assert.ok(near, `objeto ${ev.id} accesible`);
  }
  assert.ok(r.has(`14,${def.height - 1}`), 'límite sur');
});

test('Ruta 1: los entrenadores vigilan el camino (ven al menos una casilla pisable en 4)', async () => {
  const { entry } = await buildMapNode('ruta_1');
  const r = reachable(entry.map, 14, 0);
  for (const t of RUTA1_TRAINERS) {
    let seen = 0;
    for (let i = 1; i <= 4; i++) if (r.has(`${t.x + dx(t.dir) * i},${t.y + dy(t.dir) * i}`)) seen += 1;
    assert.ok(seen >= 3, `${t.id} ve el camino`);
  }
});

test('Ruta 1: células con IDs únicos del catálogo y texto con el recuento', () => {
  const ids = RUTA1_CELLS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^cell_ruta_1_\d+$/);
  assert.equal(cellFoundText({ data: { zygarde: { cells: ['a', 'b'] } } }), 'Has encontrado una Célula de Zygarde. (2/100)');
});
