// Bloque 9a — Ruta 7, Ciudad Lúmina y Ruta 14/Reserva del Delta: contenido (mapas, enlaces, células, entrenadores,
// encuentros) y la lógica pura de los dos arcos de Tablilla: T06 (Sala de Réplicas: una sola losa cumple todas las
// pistas y los palés se recolocan tras cada error) y T07 (fases de la colmena y el Alfa que reaparece al descansar).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAPS } from '../game/src/content/maps/index.js';
import { TRAINERS, getTrainer } from '../game/src/content/trainers/index.js';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { checkTrainerMoney } from '../game/src/content/trainerMoney.js';
import { B09A_CELLS } from '../game/src/content/events/b09a_cells.js';
import { F, V, CLUE_BIT } from '../game/src/content/events/b09a_common.js';
import {
  SLABS, LAYOUTS, ORIGINAL_WEIGHT, isOriginal, slabAt, originalPosition, cluesFound, withClue,
} from '../game/src/content/events/b09a_t06_logic.js';
import { ZONES, t07Phase, swarmUp, alphaReturns, withWorker, workerFlown } from '../game/src/content/events/b09a_t07_logic.js';
import { RUTA_7, LUMINA, RUTA_14, RESERVA_HONEY, RUTA_7_RUSTLE, VESPIQUEN_ALPHA } from '../game/src/content/encounters/b09a.js';

const B09A_MAPS = [
  'ruta_7', 'ciudad_lumina', 'ruta_14_reserva', 'reserva_fondo', 'lumina_museo', 'lumina_museo_galeria',
  'lumina_museo_taller', 'lumina_hotel', 'lumina_centro', 'lumina_almacenes', 'lumina_almacenes_2', 'lumina_guarderia',
  'lumina_trastos', 'lumina_pasteleria', 'lumina_estacion',
];
const species = JSON.parse(fs.readFileSync(new URL('../game/data/species.json', import.meta.url), 'utf8'));
const fresh = () => GameState.create({ name: 'Prueba' });

test('mapas del bloque: registrados, construyen sin avisos y crean sus eventos', async () => {
  for (const id of B09A_MAPS) {
    assert.ok(MAPS[id], `${id} registrado`);
    const { def, entry, warnings } = await buildMapNode(id);
    assert.equal(def.id, id);
    assert.deepEqual(warnings, [], `${id}: avisos de construcción`);
    const world = new World({ state: fresh() });
    world.setCurrent({ ...entry, events: null });
    assert.ok(world.events.length > 0, `${id}: eventos`);
  }
});

/** Conexión de `from` hacia `to` (o null). */
async function link(from, to) {
  if (!MAPS[from]) return null;
  const def = (await MAPS[from]()).default;
  return (def.connections || []).find((c) => c.to === to) || null;
}

test('enlaces: internos simétricos y, si el vecino existe, con el offset acordado (Estrato ±6, Ruta 8 ±54, Nexo ±2)', async () => {
  const pairs = [
    ['ruta_7', 'ciudad_lumina', 'west', -10], ['ciudad_lumina', 'ruta_14_reserva', 'south', 6],
    ['ruta_7', 'ciudad_estrato', 'east', -6], ['ciudad_lumina', 'ruta_8_marisma', 'west', -54],
    ['ruta_14_reserva', 'ciudad_nexo', 'south', -2],
  ];
  for (const [a, b, dir, offset] of pairs) {
    const there = await link(a, b);
    if (!MAPS[b]) { assert.equal(there, null, `${a} no enlaza con ${b} mientras no existe`); continue; }
    assert.ok(there, `${a} → ${b}`);
    assert.deepEqual([there.dir, there.offset], [dir, offset], `${a} → ${b}`);
    const back = await link(b, a);
    if (back) assert.equal(back.offset + there.offset, 0, `offsets simétricos ${a} ↔ ${b}`);
  }
});

test('células C041, C042, C043, C071 y C088 como en el registro global (mapa, etapa)', () => {
  assert.equal(B09A_CELLS.length, 5);
  for (const c of B09A_CELLS) {
    const reg = cellByKey(c.id);
    assert.ok(reg, `${c.id} en content/zygarde/cells.js`);
    assert.equal(reg.id, c.code);
    assert.equal(reg.map, c.map);
    assert.equal(reg.stage, c.stage);
  }
});

test('entrenadores: especies existentes, niveles 31–36 y dinero base de BALANCE.md', () => {
  const ids = [...Object.keys(TRAINERS).filter((k) => k.startsWith('b09a_')), 'gael_3'];
  assert.equal(ids.length, 15);
  for (const id of ids) {
    const money = checkTrainerMoney(id, TRAINERS[id]);
    assert.ok(money.ok, money.problem || id);
    const t = getTrainer(id, fresh());
    for (const p of t.party) {
      assert.ok(species[p.species], `${id}: ${p.species}`);
      assert.ok(p.level >= 31 && p.level <= 36, `${id}: nivel ${p.level}`);
    }
  }
  assert.equal(TRAINERS.gael_3.canLose, true, 'Gael B3 continúa aunque se pierda (§2.6)');
});

test('encuentros (POKEDEX_DISTRIBUCION §7.3): pesos que suman 100 y especies existentes', () => {
  const tables = [RUTA_7.grassDay, RUTA_7.grassNight, LUMINA.grassDay, LUMINA.grassNight, RUTA_14.grass, RUTA_14.water,
    RUTA_14.fish_good, RESERVA_HONEY, RUTA_7_RUSTLE];
  for (const tab of tables) {
    assert.equal(tab.reduce((n, [w]) => n + w, 0), 100);
    for (const [, sp, min, max] of tab) {
      assert.ok(species[sp], sp);
      assert.ok(min >= 30 && max <= 40 && min <= max, `${sp} ${min}–${max}`);
    }
  }
  assert.deepEqual(VESPIQUEN_ALPHA, { species: 'VESPIQUEN', level: 36, alpha: true });
});

// ── T06: Sala de Réplicas ────────────────────────────────────────────────────────────────────
const fits = {
  weight: (s) => s.weight === ORIGINAL_WEIGHT,
  photo: (s) => s.crack === 'Y' && s.corner === 'izquierda',
  glyphs: (s) => s.glyphs === 'EJE',
  cold: (s) => s.cold,
};

test('T06: una sola losa cumple las cuatro pistas, es la original y ninguna etiqueta de papel la delata', () => {
  const all = SLABS.filter((s) => Object.values(fits).every((f) => f(s)));
  assert.equal(all.length, 1);
  assert.ok(isOriginal(all[0]));
  assert.notEqual(all[0].label, 'ORIGINAL', 'la etiqueta cambiada no puede señalar la original');
  for (const s of SLABS.filter((x) => !isOriginal(x))) {
    assert.ok(Object.values(fits).some((f) => !f(s)), `${s.id} falla al menos una pista`);
  }
  // El peso y la foto juntos no bastan: hacen falta los glifos o el frío.
  assert.ok(SLABS.filter((s) => fits.weight(s) && fits.photo(s)).length > 1);
});

test('T06: cada error recoloca los palés y la original cambia de sitio; las pistas se cuentan bien', () => {
  const s = fresh();
  for (const layout of LAYOUTS) assert.deepEqual([...layout].sort(), [0, 1, 2, 3, 4, 5]);
  const seen = [];
  for (let n = 0; n < LAYOUTS.length; n++) {
    s.setVar(V.t06Try, n);
    const pos = originalPosition(s);
    assert.ok(isOriginal(slabAt(s, pos)));
    if (seen.length) assert.notEqual(pos, seen[seen.length - 1], `intento ${n}: la original no se mueve`);
    seen.push(pos);
  }
  assert.equal(cluesFound(s), 0);
  let mask = withClue(0, CLUE_BIT.weight);
  s.setVar(V.t06Clues, mask);
  assert.equal(cluesFound(s), 0, 'el peso solo cuenta con la báscula');
  mask = [CLUE_BIT.scale, CLUE_BIT.photo, CLUE_BIT.glyphs, CLUE_BIT.cold].reduce(withClue, mask);
  s.setVar(V.t06Clues, mask);
  assert.equal(cluesFound(s), 4);
});

/** Índice de página activa de un evento de `mapId` con los flags dados (-1 = sin página). */
async function pageOf(mapId, eventId, flags) {
  const s = fresh();
  for (const f of flags) s.setFlag(f);
  const { entry } = await buildMapNode(mapId);
  const world = new World({ state: s });
  world.setCurrent({ ...entry, events: null });
  const ev = world.events.find((e) => e.id === eventId);
  assert.ok(ev, `${mapId}: falta ${eventId}`);
  return ev.pageIndex;
}

test('T06: tras la Tablilla, Rosalía espera en el archivo hasta la ficha de la Laguna Clara y luego lee las Crónicas', async () => {
  const done = [F.gala, F.t06Night, F.t06Solved, F.t06Chase, F.t06Won, F.t06Done];
  assert.equal(await pageOf('lumina_museo_taller', 'rosalia_archivo', done.slice(0, 5)), -1, 'antes de la Tablilla no está en el archivo');
  assert.ok(await pageOf('lumina_museo_taller', 'rosalia_archivo', done) >= 0, 'tras T06 no espera en el archivo');
  assert.equal(await pageOf('lumina_museo_galeria', 'rosalia_cronicas', done), -1, 'está a la vez en el archivo y en las Crónicas');
  assert.equal(await pageOf('lumina_museo_taller', 'rosalia_archivo', [...done, F.laguna]), -1, 'sigue en el archivo tras la ficha');
  assert.ok(await pageOf('lumina_museo_galeria', 'rosalia_cronicas', [...done, F.laguna]) >= 0, 'no vuelve a la Sala de las Crónicas');
});

// ── T07: la colmena de la Reserva ─────────────────────────────────────────────────────────────
test('T07: fases del arco, enjambre del seto y el Alfa que reaparece al descansar', () => {
  const s = fresh();
  assert.equal(t07Phase(s), 'closed');
  s.setFlag(F.ivan);
  assert.equal(t07Phase(s), 'open');
  s.setFlag(F.hiveSeen);
  assert.equal(t07Phase(s), 'gather');
  let bees = 0;
  for (const z of ZONES) {
    assert.ok(!workerFlown(s, z.key));
    bees = withWorker(bees, z.key);
    s.setVar(V.bees, bees);
    assert.ok(workerFlown(s, z.key));
    s.setFlag(z.flag);
  }
  assert.equal(t07Phase(s), 'ready');
  s.setFlag(F.flowersSet);
  assert.equal(t07Phase(s), 'queen');
  assert.ok(swarmUp(s));
  s.setFlag(F.alpha);
  s.setVar(V.vespiquenRest, 2);
  s.setVar(V.restCount, 2);
  assert.ok(!alphaReturns(s), 'no vuelve sin descansar');
  s.setVar(V.restCount, 3);
  assert.ok(alphaReturns(s), 'vuelve tras descansar');
  s.setFlag(F.alphaCaught);
  assert.ok(!alphaReturns(s), 'capturado no vuelve');
  s.setFlag(F.reserveOpen);
  s.setFlag(F.t07Done);
  assert.ok(!swarmUp(s));
  assert.equal(t07Phase(s), 'done');
});
