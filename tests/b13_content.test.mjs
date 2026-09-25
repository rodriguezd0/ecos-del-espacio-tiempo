// Bloque 13 — Interludio 6 (Mar del Sur, Estación Talasa, Islote Lumbre, Volcán Tizón): contenido (mapas, enlaces,
// células, entrenadores, encuentros), el combate doble con Alerce y su fase de diálogo, la API genérica de Buceo
// (divePoint / surfacePoint / diveSpotTarget), las reglas puras del baile (T11) y de las coladas (T12) y los guiones
// de la Tabla Llama con un ctx simulado (docs/CAMPANA.md B13; TABLILLAS T11, T12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAPS } from '../game/src/content/maps/index.js';
import { TRAINERS, getTrainer } from '../game/src/content/trainers/index.js';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { cellByKey, cellsOnMap } from '../game/src/content/zygarde/cells.js';
import { storyApi } from '../game/src/content/story/api.js';
import { moneyKindOf, MONEY_BY_KIND } from '../game/src/content/trainerMoney.js';
import { divePoint, surfacePoint, diveSpotTarget, underwaterConfig } from '../game/src/world/zygarde/dive.js';
import { F } from '../game/src/content/events/b13_common.js';
import { labBattleRequest, ALERCE_PARTY, KEY_LINES } from '../game/src/content/events/b13_talasa_lab.js';
import { craterEvents } from '../game/src/content/events/b13_tizon_crater.js';
import { caveEvents } from '../game/src/content/events/b13_tizon_cueva.js';
import { DANCE, STEPS, RING, danceStart, danceStep, danceState } from '../game/src/content/events/b13_dance_logic.js';
import {
  ROOMS, ROOM_IDS, DV, roomStart, roomState, push, isSolved, solveRoom, headOf, walkable as lavaWalkable,
} from '../game/src/content/events/b13_lava_logic.js';
import { EXITS } from '../game/src/content/maps/b13/tizon_cueva_layout.js';
import ENC from '../game/src/content/encounters/b13.js';
import { mon, play, msgIndex } from './battle_helpers.mjs';

const B13_MAPS = [
  'mar_del_sur', 'estacion_talasa', 'talasa_invernadero', 'talasa_despacho', 'talasa_laboratorio', 'talasa_pilotes',
  'islote_lumbre', 'lumbre_gruta', 'volcan_tizon', 'tizon_casa', 'tizon_cueva', 'tizon_crater',
];
const species = JSON.parse(fs.readFileSync(new URL('../game/data/species.json', import.meta.url), 'utf8'));

/** ctx mínimo para guiones (sin DOM). */
function mockCtx(state, extra = {}) {
  const said = [];
  const ctx = {
    state, said, map: { id: 'tizon_crater' },
    say: async (t) => { said.push(String(t)); },
    choice: async () => 0,
    confirm: async () => true,
    flag: (k) => state.flag(k),
    setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d),
    setVar: (k, v) => state.setVar(k, v),
    wait: async () => {}, fade: async () => {}, flash: async () => {}, emote: async () => {}, shake: () => {},
    se: () => {}, me: () => {}, cry: () => {}, bgm: () => {},
    move: async () => {}, erase: () => {}, requestRefresh: () => {},
    player: { x: 0, y: 0, direction: 2 },
    world: { events: [], followers: [] },
    event: null,
    ui: { toast: () => {} },
    ...extra,
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

// ───────────────────────────── mapas, enlaces y células ─────────────────────────────

test('mapas del bloque: registrados, construyen sin avisos, eventos con id único', async () => {
  for (const id of B13_MAPS) {
    assert.ok(MAPS[id], `${id} registrado`);
    const { def, entry, warnings } = await buildMapNode(id);
    assert.equal(def.id, id);
    assert.deepEqual(warnings, [], `${id}: avisos de construcción`);
    const world = new World({ state: GameState.create({ name: 'P' }) });
    world.setCurrent({ ...entry, events: null });
    assert.ok(world.events.length > 0, `${id}: eventos`);
    const ids = world.events.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, `${id}: ids de evento repetidos`);
  }
});

test('enlaces: el Mar del Sur une la costa (Caleta, Ruta 15, Nexo) con Lumbre, Talasa y el Tizón, con offsets simétricos', async () => {
  const pairs = [
    ['mar_del_sur', 'caleta_sonda', 'north', 0], ['mar_del_sur', 'ruta_15', 'north', 36], ['mar_del_sur', 'ciudad_nexo', 'north', 126],
    ['mar_del_sur', 'islote_lumbre', 'south', 20], ['mar_del_sur', 'estacion_talasa', 'south', 76], ['mar_del_sur', 'volcan_tizon', 'east', 0],
  ];
  const OPP = { north: 'south', south: 'north', east: 'west', west: 'east' };
  const sea = (await MAPS.mar_del_sur()).default;
  for (const [from, to, dir, offset] of pairs) {
    const link = (sea.connections || []).find((c) => c.to === to);
    assert.ok(link, `${from} conecta con ${to}`);
    assert.deepEqual([link.dir, link.offset], [dir, offset], `${from} → ${to}`);
    const b = (await MAPS[to]()).default;
    const back = (b.connections || []).find((c) => c.to === from);
    assert.ok(back, `${to} enlaza de vuelta con el mar`);
    assert.equal(back.dir, OPP[dir], `${to} → ${from}: dirección`);
    assert.equal(back.offset + link.offset, 0, `${to} → ${from}: offsets simétricos`);
  }
});

test('células del bloque (C057–C063, C065–C067, C087): cada evento coincide con el registro global (§2.3)', async () => {
  const expected = {
    mar_del_sur: ['cell_mar_sur_1', 'cell_mar_sur_2', 'cell_mar_sur_3', 'cell_mar_sur_4', 'cell_mar_sur_5', 'cell_mar_sur_6'],
    estacion_talasa: ['cell_talasa_1', 'cell_talasa_2'],
    lumbre_gruta: ['cell_lumbre_1'],
    volcan_tizon: ['cell_tizon_1'],
    talasa_pilotes: ['cell_talasa_3'],
  };
  for (const [mapId, keys] of Object.entries(expected)) {
    assert.deepEqual(cellsOnMap(mapId).map((c) => c.key).sort(), [...keys].sort(), `${mapId}: células del catálogo`);
    const { entry } = await buildMapNode(mapId);
    const world = new World({ state: GameState.create({ name: 'P' }) });
    world.setCurrent({ ...entry, events: null });
    for (const key of keys) {
      const ev = world.events.find((e) => e.id === key);
      assert.ok(ev, `${mapId}: falta el evento ${key}`);
      assert.equal(ev.def.type, 'zygardeCell', `${key}: tipo`);
      assert.equal(cellByKey(key).map, mapId);
    }
  }
  const ids = (keys) => keys.map((k) => cellByKey(k).id);
  assert.deepEqual(ids(expected.mar_del_sur), ['C057', 'C058', 'C061', 'C062', 'C065', 'C066']);
  assert.deepEqual(ids(expected.estacion_talasa), ['C059', 'C060']);
  assert.deepEqual(ids(['cell_lumbre_1', 'cell_tizon_1', 'cell_talasa_3']), ['C063', 'C067', 'C087']);
  assert.equal(cellByKey('cell_talasa_1').required, true, 'C059 en el camino obligatorio');
});

// ───────────────────────────── entrenadores y encuentros ─────────────────────────────

test('entrenadores: niveles del Interludio 6 (44–51), especies existentes, dinero base por clase y todos colocados', async () => {
  const ids = Object.keys(TRAINERS).filter((k) => k.startsWith('b13_'));
  assert.equal(ids.length, 19);
  for (const id of ids) {
    const t = getTrainer(id, GameState.create({ name: 'P' }));
    for (const p of t.party) {
      assert.ok(p.level >= 44 && p.level <= 51, `${id}: nivel ${p.level}`);
      assert.ok(species[p.species], `${id}: especie ${p.species}`);
    }
    const kind = moneyKindOf(t);
    assert.ok(kind, `${id}: clase ${t.class} fuera de la tabla`);
    assert.equal(t.money, MONEY_BY_KIND[kind], `${id}: dinero ${t.money} (${t.class})`);
  }
  // Perforación del Tizón: jefa y técnicos 46–47 (TABLILLAS T12); combates de guion sin pérdida.
  for (const id of ['b13_jefa_perforacion', 'b13_tecnico_perforacion', 'b13_tecnica_perforacion']) {
    for (const p of TRAINERS[id].party) assert.ok(p.level >= 46 && p.level <= 47, `${id}: ${p.level}`);
  }
  for (const id of ['b13_casia', 'b13_garrido', 'b13_jefa_perforacion']) assert.equal(TRAINERS[id].canLose, true, `${id}: sin pérdida`);
  // Todos los entrenadores del bloque están en algún mapa o guion del bloque.
  const used = new Set(['b13_casia', 'b13_garrido', 'b13_jefa_perforacion']);
  for (const id of B13_MAPS) {
    const { def } = await buildMapNode(id);
    for (const ev of def.events || []) if (ev.type === 'trainer') used.add(ev.trainer);
  }
  for (const id of ids) assert.ok(used.has(id), `${id} no aparece en ningún mapa`);
});

test('encuentros: tablas al 100 %, especies existentes, niveles 42–54; Clefairy de noche en Lumbre', () => {
  const sum = (tab) => tab.reduce((n, [w]) => n + w, 0);
  for (const [mapId, tables] of Object.entries(ENC)) {
    for (const [kind, tab] of Object.entries(tables)) {
      if (!Array.isArray(tab)) continue;
      assert.equal(sum(tab), 100, `${mapId}.${kind}`);
      for (const [, sp, min, max] of tab) {
        assert.ok(species[sp], `${mapId}.${kind}: ${sp}`);
        assert.ok(min <= max, `${mapId}.${kind}: ${sp} ${min}–${max}`);
      }
    }
  }
  for (const k of ['grass', 'grassNight']) for (const [, , min, max] of ENC.islote_lumbre[k]) assert.ok(min >= 45 && max <= 50);
  assert.ok(ENC.islote_lumbre.grassNight.some((r) => r[1] === 'CLEFAIRY'), 'Clefairy de noche');
  assert.ok(!ENC.islote_lumbre.grass.some((r) => r[1] === 'CLEFAIRY'), 'Clefairy solo de noche');
});

// ───────────────────────────── combate doble del laboratorio ─────────────────────────────

test('Talasa: combate doble con Alerce de aliado (equipo canónico) y la escena clave como fase de diálogo', () => {
  const req = labBattleRequest();
  assert.equal(req.format, 'double');
  assert.deepEqual(req.trainers, ['b13_casia', 'b13_garrido']);
  assert.equal(req.ally.name, 'Alerce');
  assert.deepEqual(req.ally.party.map((p) => `${p.species} ${p.level}`), ['PROBOPASS 50', 'BRONZONG 50', 'GASTRODON 51', 'PORYGON2 52']);
  assert.deepEqual(ALERCE_PARTY.map((p) => p.species), req.ally.party.map((p) => p.species));
  assert.equal(req.phases.length, 1);
  assert.equal(req.phases[0].faint, true);
  assert.deepEqual(req.phases[0].messages, [...KEY_LINES]);
  assert.match(KEY_LINES[0], /Sigue calibrando a mano\? Vértice siempre decía que usted era el único que sabía escuchar a los Pilares/);
  assert.match(KEY_LINES[1], /Ya no\./);
  assert.deepEqual(TRAINERS.b13_casia.party.map((p) => p.species), ['REUNICLUS', 'MAGNETON', 'BEHEEYEM']);
  assert.deepEqual(TRAINERS.b13_garrido.party.map((p) => p.species), ['CONKELDURR', 'HOUNDOOM', 'RHYDON']);
});

test('motor: una fase de diálogo (faint) muestra sus mensajes y el combatiente cae con normalidad', async () => {
  const { result, ui, battle } = await play({
    type: 'wild', player: { party: [mon('GARCHOMP', 80, ['EARTHQUAKE'])] }, opponent: { party: [mon('RATTATA', 20, ['TAILWHIP'])] },
    phases: [{ faint: true, messages: ['Primera línea de la escena.', 'Segunda línea.'] }],
  }, { script: [{ action: 'fight', move: 'EARTHQUAKE' }] });
  const a = msgIndex(ui, 'Primera línea de la escena.');
  const b = msgIndex(ui, 'Segunda línea.');
  assert.ok(a >= 0 && b > a, ui.messages.join('\n'));
  assert.equal(battle.phaseState.index, 1);
  assert.equal(result.outcome, 'win');
  assert.ok(!ui.messages.some((m) => /cambia de forma/.test(m)), 'la fase de diálogo no transforma');
});

// ───────────────────────────── Buceo genérico ─────────────────────────────

test('Buceo: correspondencia superficie ↔ fondo (divePoint / surfacePoint / diveSpotTarget) en Talasa', async () => {
  const surface = (await MAPS.estacion_talasa()).default;
  const under = (await MAPS.talasa_pilotes()).default;
  assert.deepEqual(divePoint(surface, 20, 23), { map: 'talasa_pilotes', x: 20, y: 23 });
  assert.deepEqual(surfacePoint(under, 20, 23), { map: 'estacion_talasa', x: 20, y: 23 });
  assert.deepEqual(surfacePoint(under, 10, 6), { map: 'estacion_talasa', x: 10, y: 6 }, 'mar abierto del norte');
  assert.equal(surfacePoint(under, 30, 30), null, 'bajo la cubierta no se emerge');
  assert.deepEqual(diveSpotTarget(surface, { type: 'diveSpot' }, 20, 23), { to: 'talasa_pilotes', tx: 20, ty: 23, dir: 2 });
  assert.deepEqual(diveSpotTarget(under, { type: 'diveSpot', surface: true }, 20, 23), { to: 'estacion_talasa', tx: 20, ty: 23, dir: 2 });
  assert.deepEqual(diveSpotTarget(surface, { to: 'otro', tx: 1, ty: 2, dir: 8 }, 20, 23), { to: 'otro', tx: 1, ty: 2, dir: 8 }, 'destino fijo');
  assert.equal(diveSpotTarget({ id: 'x' }, { type: 'diveSpot' }, 1, 1), null, 'sin fondo ni destino');
  assert.equal(underwaterConfig(under).surface.map, 'estacion_talasa');
  const sea = (await MAPS.mar_del_sur()).default;
  if (MAPS.fondo_mar_sur) assert.deepEqual(divePoint(sea, 52, 20), { map: 'fondo_mar_sur', x: 52, y: 20 });
  else assert.equal(divePoint(sea, 52, 20), null);
});

// ───────────────────────────── T11: el baile del corro ─────────────────────────────

test('T11: el baile son ocho pasos distintos; acertarlos abre la gruta y un fallo vuelve a empezar sin castigo', () => {
  assert.equal(STEPS, 8);
  assert.equal(new Set(DANCE).size, 8, 'cada piedra una vez');
  assert.equal(RING.length, 8);
  let st = danceStart();
  for (let i = 0; i < STEPS; i++) {
    const r = danceStep(st, DANCE[i]);
    assert.equal(r.result, i === STEPS - 1 ? 'done' : 'ok');
    st = r.state;
  }
  let half = danceStart();
  for (let i = 0; i < 3; i++) half = danceStep(half, DANCE[i]).state;
  assert.equal(danceStep(half, DANCE[2]).result, 'again', 'volver a pisar la última encendida no cuenta');
  assert.equal(danceStep(half, DANCE[0]).result, 'again', 'pisar otra piedra ya encendida tampoco es un fallo');
  const wrong = danceStep(half, DANCE[5]);
  assert.equal(wrong.result, 'wrong');
  assert.equal(wrong.state.step, 0);
  assert.equal(danceState(3).step, 3);
  assert.equal(danceState('basura').step, 0);
});

// ───────────────────────────── T12: las coladas ─────────────────────────────

test('T12: las tres galerías tienen solución desde su entrada; la lava viva no admite bloques salvo en la boca', () => {
  const arrive = { 1: EXITS.hallWest.arrive, 2: EXITS.r1North.arrive, 3: EXITS.r2North.arrive };
  for (const n of ROOM_IDS) {
    const s = solveRoom(n, arrive[n].x, arrive[n].y);
    assert.ok(s.solved, `sala ${n} sin solución`);
    assert.ok(s.pushes >= Object.keys(ROOMS[n].flows).length, `sala ${n}: al menos un empujón por colada`);
  }
  // Sala 1: el bloque (8,45) empujado hacia el norte hasta la colada choca con lava corriente (no es la boca).
  const st = roomStart(1);
  const up = push(1, { ...st, blocks: { b0: [8, 43] } }, 8, 44, 8);
  assert.equal(up.ok, false);
  assert.equal(up.reason, 'lava');
  // Empujado a la boca (pared oeste de la colada) la tapona.
  const [hx, hy] = headOf(1, 'c');
  const dam = push(1, { ...st, blocks: { b0: [hx, hy + 1] } }, hx, hy + 2, 8);
  assert.equal(dam.ok, true);
  assert.equal(dam.dammed, 'c');
  assert.ok(isSolved(1, dam.state));
  assert.equal(dam.state.blocks.b0, null);
  // Estado guardado: se normaliza (bloques desconocidos fuera, coladas inexistentes fuera).
  const norm = roomState(2, { blocks: { b1: [9, 9], zz: [1, 1] }, dammed: ['a', 'x'] });
  assert.deepEqual(norm.blocks.b1, [9, 9]);
  assert.equal(norm.blocks.zz, undefined);
  assert.deepEqual(norm.dammed, ['a']);
});

test('T12: ningún empujón encierra al jugador en una galería (siempre puede volver a una boca y reiniciarla)', () => {
  // Casillas `keep` = llegadas de los túneles de cada sala (EXITS del mapa): ahí no se puede dejar un bloque.
  const arrivals = Object.values(EXITS).filter((e) => !e.map).map((e) => [e.arrive.x, e.arrive.y]);
  arrivals.push([EXITS.r3North.door.x, EXITS.r3North.door.y + 2]); // vuelta desde el cráter (tizon_crater.js)
  const inRoom = (n, [x, y]) => { const f = ROOMS[n].floor; return x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1; };
  const enc = (px, py, st) => `${px},${py}|${Object.entries(st.blocks).map(([k, p]) => `${k}:${p ? p.join('.') : 'x'}`).join(';')}|${[...st.dammed].sort()}`;
  for (const n of ROOM_IDS) {
    const exits = arrivals.filter((p) => inRoom(n, p));
    assert.deepEqual([...ROOMS[n].keep].map(String).sort(), exits.map(String).sort(), `sala ${n}: keep = llegadas de los túneles`);
    for (const [sx, sy] of exits) {
      const start = roomStart(n);
      if (!lavaWalkable(n, start, sx, sy)) continue; // esa boca solo se usa con la sala ya resuelta
      const nodes = new Map([[enc(sx, sy, start), [sx, sy, start]]]);
      const rev = new Map();
      const q = [enc(sx, sy, start)];
      for (let h = 0; h < q.length; h++) {
        const [px, py, st] = nodes.get(q[h]);
        for (const d of [2, 4, 6, 8]) {
          const [dx, dy] = DV[d];
          let next = null;
          if (lavaWalkable(n, st, px + dx, py + dy)) next = [px + dx, py + dy, st];
          else {
            const r = push(n, st, px, py, d);
            if (r.ok) next = [r.dammed ? px : px + dx, r.dammed ? py : py + dy, r.state];
          }
          if (!next) continue;
          const k = enc(...next);
          if (!rev.has(k)) rev.set(k, new Set());
          rev.get(k).add(q[h]);
          if (nodes.has(k)) continue;
          nodes.set(k, next);
          q.push(k);
        }
      }
      const good = new Set([...nodes].filter(([, [x, y]]) => exits.some(([ex, ey]) => ex === x && ey === y)).map(([k]) => k));
      const back = [...good];
      while (back.length) for (const f of rev.get(back.shift()) || []) if (!good.has(f)) { good.add(f); back.push(f); }
      const stuck = [...nodes.keys()].filter((k) => !good.has(k));
      assert.deepEqual(stuck.slice(0, 3), [], `sala ${n} (entrando por ${sx},${sy}): estados sin salida`);
    }
  }
});

test('T12: los tres respiraderos reabiertos marcan la montaña; la vieja fragua da la Tabla Llama solo sin la sonda', async () => {
  const state = GameState.create({ name: 'P' });
  const vents = caveEvents().filter((e) => String(e.id).startsWith('respiradero_'));
  assert.equal(vents.length, 3);
  for (const v of vents) {
    const ctx = mockCtx(state, { event: { def: v } });
    await v.pages[0].script(ctx);
  }
  assert.ok([1, 2, 3].every((n) => state.flag(F.tizVent(n))));
  assert.ok(state.flag(F.tizVents), 'los tres respiraderos abiertos');
  const hearth = craterEvents().find((e) => e.id === 'fragua_rey');
  const cold = GameState.create({ name: 'P' });
  const c1 = mockCtx(cold);
  await hearth.pages[0].script(c1);
  assert.ok(!cold.flag(F.tizPlate) && !cold.hasItem('FLAMEPLATE'), 'fría: nada');
  cold.setFlag(F.tizVents);
  await hearth.pages[0].script(mockCtx(cold));
  assert.ok(!cold.hasItem('FLAMEPLATE'), 'con la sonda de Genesis funcionando no hay Tabla');
  cold.setFlag(F.tizChief);
  const c3 = mockCtx(cold);
  await hearth.pages[0].script(c3);
  assert.ok(cold.flag(F.tizPlate));
  assert.ok(cold.hasItem('FLAMEPLATE'), 'Tabla Llama en la mochila');
  assert.ok((cold.data.tablets || []).includes('FLAMEPLATE'));
});
