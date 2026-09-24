// Bloque 7 — puesta en escena de la Cantería (Ruta 6): los personajes fijos están sobre suelo pisable (no encima del
// camión, de una cara de roca o de una barrera) y los recorridos de las escenas (Bea, Garrido, los canteros, Alerce,
// la cuadrilla) existen por el suelo, sin atravesar el bancal (content/events/b07_path.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { terrainPath } from '../game/src/content/events/b07_path.js';
import { RUTA6, CANTERIA as C } from '../game/src/content/maps/b07/layout.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const MAX_LEG = 70;

async function ruta6() {
  const { def, entry } = await buildMapNode('ruta_6');
  const world = new World({ state: GameState.create({ name: 'Prueba' }) });
  world.setCurrent({ ...entry, events: [] });
  const events = typeof def.events === 'function' ? def.events() : def.events;
  return { map: world.map, events };
}

/** ¿Se puede entrar en (x, y) desde alguna casilla vecina (terreno, como un PNJ)? */
function enterable(map, x, y) {
  return Object.entries(DV).some(([d, [ox, oy]]) => {
    const sx = x - ox; const sy = y - oy;
    return map.valid(sx, sy) && map.passable(sx, sy, Number(d), null, {}) && map.passable(x, y, 10 - Number(d), null, {});
  });
}

const isCharacter = (ev) => (ev.pages || [ev]).some((pg) => {
  const s = pg.sprite ?? ev.sprite;
  return typeof s === 'string' && s && !s.startsWith('asset:');
});

test('Ruta 6: ningún personaje fijo está plantado sobre roca, camión o barrera', async () => {
  const { map, events } = await ruta6();
  const bad = events.filter(isCharacter).filter((ev) => !enterable(map, ev.x, ev.y)).map((ev) => `${ev.id} (${ev.x},${ev.y})`);
  assert.deepEqual(bad, []);
});

test('Ruta 6: los recorridos de las escenas de la Cantería van por el suelo', async () => {
  const { map } = await ruta6();
  const tech = C.techSpot;
  const corte = C.corteFront;
  const mine = C.mineFront;
  const legs = [
    // Llegada: Bea sale de la herrería hasta el jugador (franja de llegada) y vuelve.
    ...[4, 10, 15, 20, 25].map((x) => ['Bea → llegada', C.forgeFront, { x, y: RUTA6.arrivalY + 1 }]),
    ['Bea → herrería', { x: 15, y: RUTA6.arrivalY + 1 }, C.bea],
    // Garrido, Bea y los canteros ante el perímetro; la retirada del Consorcio.
    ['Garrido → perímetro', C.garrido, { x: tech.x - 3, y: tech.y }],
    ['Bea → perímetro', C.bea, { x: tech.x - 2, y: tech.y + 1 }],
    ...C.crowd.map(([x, y], k) => [`cantero ${k} → Garrido`, { x: C.crowdFrom, y }, { x, y }]),
    ...C.crowd.map(([x, y], k) => [`cantero ${k} → su puesto`, { x, y }, C.canteros[k]]),
    ['Garrido se va', { x: tech.x - 3, y: tech.y }, C.leave],
    ...C.techs.map((t, k) => [`técnico ${k} se va`, t, { x: C.leave.x, y: C.leave.y + k + 1 }]),
    ['Bea vuelve', { x: tech.x - 2, y: tech.y + 1 }, C.bea],
    // Alerce llega por el patio y lleva al jugador al corte; Bea se acerca.
    ['Alerce llega', C.alerceFrom, { x: C.alerceSpot.x, y: tech.y }],
    ['Bea → corte', C.bea, { x: corte.x - 1, y: corte.y + 1 }],
    // La fiesta: Bea y los canteros acuden a la boca de la galería; Alerce se acerca; Bea se va a la herrería.
    ['Bea → Quino', C.bea, { x: mine.x - 2, y: mine.y + 1 }],
    ...C.party.canteros.map(([x, y], k) => [`cantero ${k} → fiesta`, C.canteros[k], { x, y }]),
    ['Alerce → fiesta', C.alerceSpot, { x: mine.x + 1, y: mine.y + 1 }],
    ['Bea → herrería (fiesta)', { x: mine.x - 2, y: mine.y + 1 }, C.forgeFront],
  ];
  for (const [name, a, b] of legs) {
    const path = terrainPath(map, { x0: a.x, y0: a.y, x1: b.x, y1: b.y });
    assert.ok(path, `${name}: hay camino por el suelo de (${a.x},${a.y}) a (${b.x},${b.y})`);
    assert.ok(path.length <= MAX_LEG, `${name}: recorrido razonable (${path.length} pasos)`);
  }
});

test('Ruta 6: los puestos de escena (canteros, cuadrilla) están en suelo libre del patio', async () => {
  const { map } = await ruta6();
  const spots = [...C.crowd, ...C.party.canteros, ...C.party.timburr, ...C.timburrAfter,
    [C.leave.x, C.leave.y], [C.alerceFrom.x, C.alerceFrom.y]];
  const bad = spots.filter(([x, y]) => !enterable(map, x, y)).map(([x, y]) => `(${x},${y})`);
  assert.deepEqual(bad, []);
});
