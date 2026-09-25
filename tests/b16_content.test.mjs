// Bloque 16 — Pilar del Alma: datos, reglas puras y guiones sin navegador (docs/CAMPANA.md B16; D17).
//   · Uxie: glifos y relieves (el Diario de la Libreta registra lo que reparó cada Pilar) y rondas de caballeros y
//     bribones con solución única; Mesprit: salas de espejos resolubles y no triviales; Azelf: petición del combate y
//     mochila sellada en el motor real; viento: repisas y caminos.
//   · Encuentros, Feebas por día, pesca por casilla (world/fishing.js), células C095 y C097–C100 en su sitio.
//   · Guiones de punta a punta con un ctx simulado: Telar (Cadena Roja, P8, Fragmento 8, verso VIII), hito de la Forma
//     Completa (con 100 células: Vuelo y Reconstrucción, hueco A alzado, tutorial en el zócalo B) y su variante (faltan
//     células), respuesta a Mesprit, página de T14 de Don Evaristo y el tipo rebuildGap ampliado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameState } from '../game/src/core/state.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import {
  GLYPHS, RELIEF_ORDER, RELIEF_KEYWORD, ROUNDS, consistentExits, offerGlyph, ALL_PLACED, inscriptionText, FACTS,
} from '../game/src/content/events/b16_saber_logic.js';
import { MIRROR_ROOMS, solveMirror, mirrorX, MIRROR_X, ROOM_H } from '../game/src/content/events/b16_mirror_logic.js';
import { CORRIDOR_ROWS, LEDGES, corridorPath, ledgeLegs, STILL_FRAMES } from '../game/src/content/events/b16_wind_logic.js';
import { feebasDay, feebasTiles, FEEBAS_TILE_COUNT } from '../game/src/content/events/b16_feebas.js';
import { LAGOS_ALMA, LAGO_SENTIR, SANTUARIO_ALMA, AZELF_TRIAL, FEEBAS_SPOT } from '../game/src/content/encounters/b16.js';
import { JOURNAL_ENTRIES } from '../game/src/content/story/journal.js';
import { cellsOnMap } from '../game/src/content/zygarde/cells.js';
import { SENTIR, QUERER, SABER, TELAR, mirrorCell, windCell, floorTop } from '../game/src/content/maps/b16/santuario_layout.js';
import { SENTIR_ZONE, waterCells, BRIDGE } from '../game/src/content/maps/b16/lagos_layout.js';
import { F, V, MESPRIT_ANSWERS } from '../game/src/content/events/b16_common.js';
import { azelfRequest } from '../game/src/content/events/b16_querer.js';
import { bossBattleRequest } from '../game/src/content/common/bossBattle.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { EncounterSystem } from '../game/src/world/encounters.js';
import { fishingSystem, fishingType } from '../game/src/world/fishing.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { storyApi } from '../game/src/content/story/api.js';
import { CELLS } from '../game/src/content/zygarde/cells.js';
import { CORE_IDS } from '../game/src/content/zygarde/thresholds.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const db = {
  species: load('species.json'), moves: load('moves.json'), abilities: load('abilities.json'), types: load('types.json'),
  items: { ...load('items.json'), ...load('items_axis.json') }, trainerTypes: load('trainer_types.json'),
};

// ───────────────────────────── Uxie ─────────────────────────────

test('Uxie ronda 1: siete glifos P1–P7, relieves en otro orden y el Diario de la Libreta registra cada efecto', () => {
  assert.equal(GLYPHS.length, 7);
  assert.deepEqual([...RELIEF_ORDER].sort(), [1, 2, 3, 4, 5, 6, 7]);
  assert.notDeepEqual(RELIEF_ORDER, [1, 2, 3, 4, 5, 6, 7], 'los relieves no pueden ir en el orden de los pedestales');
  for (const n of [1, 2, 3, 4, 5, 6, 7]) {
    const entry = JOURNAL_ENTRIES.find((e) => e.flag === `p${n}_restored`);
    assert.ok(entry, `el Diario no tiene entrada del Pilar ${n}`);
    const text = entry.lines.join(' ').toLowerCase();
    assert.ok(text.includes(RELIEF_KEYWORD[n]), `el Diario del P${n} no menciona «${RELIEF_KEYWORD[n]}» (relieve: ${GLYPHS[n - 1].relief})`);
  }
  let mask = 0;
  assert.deepEqual(offerGlyph(mask, 3, 5), { ok: false, mask: 0, carried: 0 }, 'un glifo equivocado vuelve a su pedestal');
  for (const n of [1, 2, 3, 4, 5, 6, 7]) mask = offerGlyph(mask, n, n).mask;
  assert.equal(mask, ALL_PLACED);
});

test('Uxie rondas 2 y 3: cada variante de 3 y 4 puertas tiene una única salida y habla de lo vivido', () => {
  for (const doors of [3, 4]) {
    assert.ok(ROUNDS[doors].length >= 2, `pocas variantes de ${doors} puertas (el olvido cambia las inscripciones)`);
    const exits = new Set();
    for (const round of ROUNDS[doors]) {
      assert.equal(round.length, doors);
      const ok = consistentExits(round);
      assert.equal(ok.length, 1, `variante sin solución única: ${JSON.stringify(ok)}`);
      exits.add(ok[0]);
      assert.ok(round.some((ins) => ins.fact), 'ninguna inscripción habla del viaje');
      round.forEach((ins, i) => assert.match(inscriptionText(ins, i + 1), /^«.+»$/));
    }
    assert.ok(exits.size >= 2, `todas las variantes de ${doors} puertas tienen la misma salida`);
  }
  assert.equal(FACTS.albo.truth, false, 'CAMPANA: «La que miente dice que el Albo corría hacia atrás»');
});

// ───────────────────────────── Mesprit ─────────────────────────────

test('Mesprit: tres salas de espejos resolubles, cada vez más largas, sin atajo simétrico', () => {
  let prev = 0;
  for (const room of MIRROR_ROOMS) {
    const path = solveMirror(room);
    assert.ok(path, `la sala ${room.n} no tiene solución`);
    assert.ok(path.length > prev, `la sala ${room.n} no es más larga que la anterior (${path.length})`);
    prev = path.length;
    assert.ok(room.blocked(mirrorX(room.target[0]), room.target[1]), `sala ${room.n}: basta con ir a la casilla simétrica de Mesprit`);
    assert.ok(room.target[0] > MIRROR_X && room.reflection[0] > MIRROR_X && room.start[0] < MIRROR_X);
    for (const [x, y] of room.decoys) assert.ok(!room.blocked(x, y) && x > MIRROR_X, 'señuelo en un obstáculo');
  }
  assert.ok(prev >= 25, 'la tercera sala es demasiado corta');
});

test('Mesprit: el mapa pinta los obstáculos de cada sala donde dice la rejilla', async () => {
  const { entry } = await buildMapNode('santuario_alma');
  const map = entry.map;
  for (const m of SENTIR.mirrors) {
    const room = MIRROR_ROOMS[m.n - 1];
    for (let gy = 0; gy < ROOM_H; gy++) {
      for (let gx = 0; gx < 17; gx++) {
        if (gx === MIRROR_X) continue;
        const c = mirrorCell(m.room, gx, gy);
        const obstacle = room.rows[gy][gx] === '#';
        assert.equal(!map.passableStrict(c.x, c.y), obstacle, `sala ${m.n} (${gx},${gy}) → (${c.x},${c.y}) ${obstacle ? 'debería bloquear' : 'debería ser suelo'}`);
      }
    }
  }
});

// ───────────────────────────── Azelf y el viento ─────────────────────────────

test('Azelf: nivel 58, sus cuatro movimientos, sin captura, sin huida y con la Mochila sellada', () => {
  const req = bossBattleRequest(azelfRequest());
  assert.equal(req.wild.species, 'AZELF');
  assert.equal(req.wild.level, 58);
  assert.deepEqual(req.wild.moves, ['ANCIENTPOWER', 'PSYCHIC', 'NASTYPLOT', 'FLAMETHROWER']);
  assert.equal(req.wild.shiny, false);
  assert.equal(req.rules.canCatch, false);
  assert.equal(req.rules.canRun, false);
  assert.ok(req.rules.sealedBag);
  assert.equal(req.canLose, true);
  assert.equal(req.rules.noMoneyLoss, true);
  assert.equal(AZELF_TRIAL.level, 58);
});

test('Azelf en el motor real: la Mochila sellada no deja usar objetos y no se pierde ninguno', async () => {
  const party = [createPokemon(db, 'LUCARIO', 70)];
  const req = bossBattleRequest(azelfRequest());
  const bag = { POTION: 3 };
  const { config } = buildBattleConfig({ ...req, opponent: { party: [req.wild] }, seed: 3, player: { name: 'P', party, bag } }, { db });
  // Como en la escena: se elige «Mochila», el sello lo impide y se vuelve al menú (la entrada del guion se consume ahí).
  class UI extends HeadlessBattleUI {
    async chooseAction(b) {
      const a = await super.chooseAction(b);
      if (a === 'bag') { this.script.shift(); this.bagTries = (this.bagTries || 0) + 1; }
      return a;
    }
    async chooseItem() { this.opened = true; return null; }
  }
  const ui = new UI({ script: [{ action: 'item', item: 'POTION' }, { action: 'item', item: 'POTION' }] });
  const r = await new Battle(config, ui).run();
  assert.equal(ui.bagTries, 2);
  assert.ok(!ui.opened, 'la Mochila se abrió con el sello');
  assert.equal(ui.messages.filter((m) => m === 'El sello de Azelf no deja abrir la Mochila.').length, 2, 'no se explica el sello en combate');
  assert.equal(bag.POTION, 3, 'se gastó una Poción con la Mochila sellada');
  assert.ok(['win', 'lose'].includes(r.outcome));
});

test('Viento: repisas a la entrada, en medio y arriba; tramos con camino y sin atajos', () => {
  assert.equal(CORRIDOR_ROWS.length, 17);
  assert.ok(LEDGES.length >= 4);
  for (const leg of ledgeLegs()) assert.ok(leg >= 15 && leg <= 30, `tramo sin repisa de ${leg} pasos`);
  assert.ok(STILL_FRAMES >= 30);
  const start = LEDGES[0];
  const top = LEDGES.reduce((a, b) => (b[1] < a[1] ? b : a));
  assert.ok(corridorPath(...start, ...top).length > 50, 'el pasillo es demasiado corto');
  assert.equal(windCell(...top).y, floorTop(QUERER.wind.room));
});

// ───────────────────────────── Encuentros y pesca ─────────────────────────────

const sum = (list) => list.reduce((a, [w]) => a + w, 0);

test('Encuentros: tablas de POKEDEX_DISTRIBUCION (suman 100, especies y niveles 55–60); Feebas por casilla y día', () => {
  for (const t of [LAGOS_ALMA.grass, LAGOS_ALMA.water, LAGO_SENTIR.fish_super, SANTUARIO_ALMA.cave, FEEBAS_SPOT.fish_good]) {
    assert.equal(sum(t), 100);
    for (const [, sp, a, b] of t) assert.ok(db.species[sp] && a <= b, `${sp} ${a}-${b}`);
  }
  assert.ok(LAGOS_ALMA.grass.every(([, , a, b]) => a === 55 && b === 60));
  assert.deepEqual(FEEBAS_SPOT.fish_good.map(([, sp, a, b]) => [sp, a, b]), [['FEEBAS', 20, 25]]);
  const water = new Set(waterCells().map(([x, y]) => `${x},${y}`));
  const cands = [];
  for (let y = SENTIR_ZONE.y0; y <= SENTIR_ZONE.y1; y++) for (let x = SENTIR_ZONE.x0; x <= SENTIR_ZONE.x1; x++) if (water.has(`${x},${y}`)) cands.push([x, y]);
  const d0 = feebasTiles(cands, 0);
  assert.equal(d0.length, FEEBAS_TILE_COUNT);
  assert.deepEqual(feebasTiles(cands, 0), d0, 'las casillas de un día no son deterministas');
  assert.notDeepEqual(feebasTiles(cands, 1), d0, 'las casillas no cambian de un día a otro');
  const s = GameState.create({ name: 'P' });
  const day = feebasDay(s);
  s.setVar('rest_count', 1);
  assert.equal(feebasDay(s), day + 1, 'descansar no cambia el día de Feebas');
});

test('Pesca por casilla: Feebas con la Caña Buena solo en sus casillas; Supercaña en el Lago del Sentir', async () => {
  const def = (await import('../game/src/content/maps/b16/lagos_alma.js')).default;
  const state = GameState.create({ name: 'P' });
  const water = waterCells().filter(([x, y]) => x >= SENTIR_ZONE.x0 && x <= SENTIR_ZONE.x1 && y >= SENTIR_ZONE.y0 && y <= SENTIR_ZONE.y1);
  const feebas = water.filter(([x, y]) => def.fishingAt(state, x, y));
  assert.equal(feebas.length, FEEBAS_TILE_COUNT);
  const sentir = new EncounterSystem(LAGO_SENTIR);
  const world = {
    current: { def }, encounters: new EncounterSystem(LAGOS_ALMA), rng: () => 0.5,
    encountersAt: (x, y) => (x >= SENTIR_ZONE.x0 && x <= SENTIR_ZONE.x1 && y >= SENTIR_ZONE.y0 && y <= SENTIR_ZONE.y1 ? sentir : world.encounters),
  };
  const [fx, fy] = feebas[0];
  const good = fishingSystem(world, { x: fx, y: fy }, 'GOODROD', { state });
  assert.equal(good.choose(fishingType(good, 'GOODROD')).species, 'FEEBAS');
  const other = water.find(([x, y]) => !feebas.some(([a, b]) => a === x && b === y));
  assert.equal(fishingType(fishingSystem(world, { x: other[0], y: other[1] }, 'GOODROD', { state }), 'GOODROD'), null, 'la Caña Buena pica fuera de las casillas de Feebas');
  assert.equal(fishingType(fishingSystem(world, { x: other[0], y: other[1] }, 'SUPERROD', { state }), 'SUPERROD'), 'fish_super');
  assert.equal(fishingType(fishingSystem(world, { x: 20, y: 30 }, 'SUPERROD', { state }), 'SUPERROD'), null, 'la Supercaña pica fuera del Lago del Sentir');
});

// ───────────────────────────── Células ─────────────────────────────

test('Células: C095 en los Lagos y C097–C100 (una por ala y otra en el Telar) en el santuario', async () => {
  const lagos = (await buildMapNode('lagos_alma')).def.events.filter((e) => e.type === 'zygardeCell');
  assert.deepEqual(lagos.map((e) => e.cell), cellsOnMap('lagos_alma').map((c) => c.key));
  const sant = (await buildMapNode('santuario_alma')).def.events.filter((e) => e.type === 'zygardeCell');
  assert.deepEqual(sant.map((e) => e.cell), ['cell_alma_1', 'cell_alma_2', 'cell_alma_3', 'cell_alma_4']);
  assert.deepEqual(cellsOnMap('santuario_alma').map((c) => c.id), ['C097', 'C098', 'C099', 'C100']);
  const at = (k) => sant.find((e) => e.cell === k);
  assert.deepEqual([at('cell_alma_1').x, at('cell_alma_1').y], [SABER.cell.x, SABER.cell.y]);
  assert.deepEqual([at('cell_alma_2').x, at('cell_alma_2').y], [SENTIR.cell.x, SENTIR.cell.y]);
  assert.deepEqual([at('cell_alma_3').x, at('cell_alma_3').y], [QUERER.wind.cell.x, QUERER.wind.cell.y]);
  assert.deepEqual([at('cell_alma_4').x, at('cell_alma_4').y], [TELAR.cell.x, TELAR.cell.y]);
});

// ───────────────────────────── Guiones con ctx simulado ─────────────────────────────

/** Estado de entrada del bloque: P1–P7, Fragmentos 1–7, Nadar y todo lo anterior, `cells` primeras células, 5 núcleos. */
function entryState(cells = 96) {
  const s = GameState.create({ name: 'Prueba' });
  for (let n = 1; n <= 7; n++) { s.setFlag(`p${n}_restored`); s.addFragment(`F0${n}`); }
  for (const k of ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive']) s.setZygardeAbility(k, true);
  for (const id of CORE_IDS) s.addCore(id);
  for (const c of CELLS.slice(0, cells)) s.addCell(c.key);
  s.setFlag('zyg_core_5');
  s.setFlag('b15_n5');
  s.setZygardeForm('50');
  return s;
}

function stubCtx(state, { choice = 0 } = {}) {
  const said = [];
  const events = [];
  const ctx = {
    state, said,
    map: { id: 'lagos_alma' },
    player: { x: 28, y: 24, direction: 2, moveTo(x, y) { this.x = x; this.y = y; }, straighten() {} },
    world: {
      events, followers: [],
      spawnEvent: (d) => { const e = { ...d, opacity: 255 }; events.push(e); return e; },
      removeEvent: (e) => { const i = events.indexOf(e); if (i >= 0) events.splice(i, 1); },
      current: { def: { id: 'lagos_alma' } },
    },
    scene: { refreshFollower: () => {} },
    ui: { toast: () => {} },
    say: async (text, opts = {}) => { said.push({ text, speaker: opts.speaker ?? (opts.telepathy ? 'Zygarde' : null) }); },
    choice: async () => choice,
    confirm: async () => true,
    move: async () => {}, face: () => {}, emote: async () => {}, wait: async () => {}, fade: async () => {},
    flash: async () => {}, shake: () => {}, tone: async () => {}, weather: async () => {}, bgm: () => {}, se: () => {},
    me: () => {}, cry: () => {}, heal: () => {}, warp: async () => {}, setTile: () => {}, requestRefresh: () => {},
    effect: () => ({ remove: () => {} }),
    camera: { pan: async () => {}, reset: async () => {} },
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    zygarde: (k) => state.zygardeAbility(k),
    giveItem: async (id, n = 1) => { if (db.items[id]?.pocket === 8) state.addKeyItem(id); else state.addItem(id, n); },
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

async function runTelar(state) {
  state.setFlag(F.saber); state.setFlag(F.sentir); state.setFlag(F.querer); state.setFlag(F.telarOpen);
  for (const id of ['KNOWLEDGETHREAD', 'EMOTIONTHREAD', 'WILLTHREAD']) state.addKeyItem(id);
  const def = (await buildMapNode('santuario_alma')).def;
  const loom = def.events.find((e) => e.id === 'telar_alma');
  const ctx = stubCtx(state);
  await loom.pages[1].script(ctx);
  return ctx;
}

test('Telar: el ritual trenza las tres Hebras en la Cadena Roja y restaura el P8 (Fragmento 8, verso VIII); el cielo espera', async () => {
  const s = entryState(99);
  s.addCell('cell_alma_4');
  const ctx = await runTelar(s);
  assert.ok(s.hasKeyItem('REDCHAIN'), 'sin Cadena Roja');
  for (const id of ['KNOWLEDGETHREAD', 'EMOTIONTHREAD', 'WILLTHREAD']) assert.ok(!s.hasKeyItem(id), `${id} sigue en la Mochila`);
  assert.ok(s.flag('p8_restored') && s.flag('verse_8') && s.data.fragments.includes('F08'));
  assert.equal(s.var('crisis_phase', null), 2, 'el cielo no espera a la salida para romperse');
  assert.ok(!s.zygardeAbility('fly'), 'la Forma Completa llega dentro del santuario');
  assert.ok(ctx.said.some((l) => /y el guardián volverá a ser entero/.test(l.text)), 'el trío no recita el verso VIII');
});

test('Hito con 100 células: Forma Completa, Vuelo y Reconstrucción, hueco A alzado y tutorial en el zócalo B', async () => {
  const s = entryState(96);
  for (const k of ['cell_alma_1', 'cell_alma_2', 'cell_alma_3', 'cell_alma_4']) s.addCell(k);
  await runTelar(s);
  const def = (await buildMapNode('lagos_alma')).def;
  const auto = def.events.find((e) => e.id === 'hito_forma_completa');
  const ctx = stubCtx(s);
  await auto.pages[0].script(ctx);
  assert.ok(s.zygardeAbility('fly') && s.zygardeAbility('rebuild'), 'sin Vuelo o Reconstrucción');
  assert.equal(s.zygardeForm, 'complete');
  assert.ok(s.flag('zyg_complete') && s.flag(F.bridgeA) && s.flag(F.bridgeBroken) && s.flag(F.milestoneScene));
  assert.ok(!s.flag(F.milestone), 'el hito termina antes de reconstruir el hueco B');
  assert.ok(ctx.said.some((l) => /Si no me sostengo ahora, no habrá nada que sostener\./.test(l.text)));
  assert.ok(ctx.said.some((l) => /Nada me obliga\. El mundo necesita que esté entero, y elijo estarlo\./.test(l.text)));
  // El zócalo B (tipo rebuildGap ampliado): tutorial, piedras, flag y final del hito
  const sock = expandEventDef(def.events.find((e) => e.id === 'zocalo_b_0'), def);
  assert.ok(sock.pages[0].when(s, { selfSwitch: () => false }), 'el zócalo B no aparece tras hundirse el tramo');
  const ctx2 = stubCtx(s);
  await sock.pages[0].script(ctx2);
  assert.ok(s.flag(F.bridgeB) && s.flag(F.milestone) && s.flag(F.bond) && s.flag(F.radio) && s.flag(F.genesis));
  assert.ok(s.flag('zyg_rebuild_tutorial'), 'el tutorial de Reconstrucción no queda visto');
  assert.ok(ctx2.said.some((l) => /zócalo con hexágonos gastados/.test(l.text)), 'sin tutorial');
  for (const who of ['Leandro (radio)', 'Abril (radio)', 'Fermín (radio)']) assert.ok(ctx2.said.some((l) => l.speaker === who), `falta ${who}`);
  assert.equal(s.var('crisis_phase', null), null, 'la fase de crisis queda forzada');
  assert.ok(sock.pages[1].when(s, { selfSwitch: () => false }) && sock.pages[1].patch.length === 6, 'las piedras no persisten');
});

test('Hito sin todas las células: sostiene a medias, los vecinos cruzan y «Me faltan dos partes. Las siento todas encendidas.»', async () => {
  const s = entryState(94);
  for (const k of ['cell_alma_1', 'cell_alma_2', 'cell_alma_3', 'cell_alma_4']) s.addCell(k);
  await runTelar(s);
  const def = (await buildMapNode('lagos_alma')).def;
  const ctx = stubCtx(s);
  await def.events.find((e) => e.id === 'hito_forma_completa').pages[0].script(ctx);
  assert.ok(!s.zygardeAbility('fly'), 'hay Forma Completa sin las 100 células');
  assert.ok(s.flag(F.milestone) && s.flag(F.milestonePartial) && s.flag(F.bridgeBroken) && !s.flag(F.bridgeA));
  assert.ok(ctx.said.some((l) => l.text === 'Me faltan dos partes. Las siento todas encendidas.'));
  // La célula 100 más tarde: la escena corta genérica activa la Forma Completa
  const { checkZygardeProgress } = await import('../game/src/world/zygarde/scenes.js');
  s.addCell('cell_lagos_1'); s.addCell('cell_mar_boreal_1');
  const c2 = stubCtx(s);
  await checkZygardeProgress(c2);
  assert.ok(s.zygardeAbility('fly') && s.zygardeAbility('rebuild'));
  assert.ok(c2.said.some((l) => /elijo estarlo/.test(l.text)), 'la versión corta no usa la línea del hito');
});

test('Mesprit: las tres respuestas se guardan en la variable que usa B20', async () => {
  const def = (await buildMapNode('santuario_alma')).def;
  const ev = def.events.find((e) => e.id === 'mesprit_pregunta');
  for (const [i, a] of MESPRIT_ANSWERS.entries()) {
    const s = entryState(96);
    s.setFlag(F.memory);
    await ev.pages[0].script(stubCtx(s, { choice: i }));
    assert.equal(s.var(V.answer, null), a.id);
    assert.ok(s.flag(F.sentir) && s.hasKeyItem('EMOTIONTHREAD'));
  }
  assert.deepEqual(MESPRIT_ANSWERS.map((a) => a.id), ['culpa', 'lejos', 'permiso']);
});

test('Don Evaristo (B09b): tras el P8 enseña la carta y abre la pista T14', async () => {
  const def = (await buildMapNode('nexo_correos')).def;
  const ev = def.events.find((e) => e.id === 'evaristo');
  assert.equal(ev.pages.length, 2);
  const s = entryState(96);
  assert.ok(!ev.pages[1].when(s), 'la página de T14 está antes del P8');
  s.setFlag('p8_restored');
  assert.ok(ev.pages[1].when(s));
  const ctx = stubCtx(s);
  await ev.pages[1].script(ctx);
  assert.ok(s.flag(F.letter));
  assert.equal(ctx.story.clueStatus('T14'), 'active');
  assert.ok(ctx.said.some((l) => /Mesa de los Vientos/.test(l.text)));
});

test('Lagos: el agua solo hierve (sin nadar) entre la Forma Completa y el hueco B, también al volver a entrar', async () => {
  const { syncLakesBoiling, lakesBoiling, setLakesBoiling } = await import('../game/src/content/events/b16_hito.js');
  const def = (await import('../game/src/content/maps/b16/lagos_alma.js')).default;
  const s = entryState(96);
  setLakesBoiling(true); // p. ej. se quedó así de otra partida
  await def.onEnter({ state: s });
  assert.equal(lakesBoiling(), false, 'hierve sin estar en el hito');
  assert.equal(def.noSwim, false);
  s.setFlag(F.restored); s.setFlag(F.milestoneScene);
  syncLakesBoiling({ state: s });
  assert.equal(def.noSwim, true, 'tras cargar a mitad del hito completo se puede nadar');
  s.setFlag(F.milestone);
  syncLakesBoiling({ state: s });
  assert.equal(lakesBoiling(), false);
});

test('Recuerdo: montado en el 10 %, se baja de la montura antes de ponerse el aspecto de Gael', async () => {
  const { dismountForMemory } = await import('../game/src/content/events/b16_recuerdo.js');
  const world = { zygMount: { riding: true, form: '10', savedCharsets: null } };
  let frames = 0;
  // syncMount (cada fotograma) quita la forma cuando ya no se va montado
  const ctx = { world, wait: async () => { frames += 1; if (!world.zygMount.riding) world.zygMount.form = null; } };
  await dismountForMemory(ctx);
  assert.equal(world.zygMount.riding, false);
  assert.equal(world.zygMount.form, null, 'no espera a que la montura desaparezca');
  assert.ok(frames >= 1);
  const idle = { world: { zygMount: { riding: false, form: null } }, wait: async () => { throw new Error('no hacía falta esperar'); } };
  await dismountForMemory(idle);
});

test('Recuerdo: Gael dice «Llegué antes. No me ha dejado pasar.» cuando llega el protagonista (B02)', async () => {
  const def = (await buildMapNode('santuario_alma_recuerdo')).def;
  const bench = def.events.find((e) => e.id === 'recuerdo_piedra');
  const s = entryState(96);
  s.setVar('b16_recuerdo_fase', 3);
  const ctx = stubCtx(s);
  await bench.script(ctx);
  const i = ctx.said.findIndex((l) => /Al rato llegas tú/.test(l.text));
  const j = ctx.said.findIndex((l) => l.text === 'Llegué antes. No me ha dejado pasar.' && l.speaker === 'Gael');
  assert.ok(i >= 0 && j > i, `orden: llegada ${i}, frase de Gael ${j}`);
  assert.equal(s.var('b16_recuerdo_fase'), 4);
});

test('Lagos: tras el hito la observadora no dice que nadie cruza y da el recado de Don Evaristo (T14)', async () => {
  const def = (await buildMapNode('lagos_alma')).def;
  const obs = def.events.find((e) => e.id === 'observadora');
  const s = entryState(96);
  s.setFlag(F.restored); s.setFlag(F.milestone);
  const ctx = stubCtx(s);
  await obs.pages[0].script(ctx);
  assert.ok(!ctx.said.some((l) => /nadie cruza/.test(l.text)), 'repite que nadie cruza al santuario');
  assert.ok(ctx.said.some((l) => /Don Evaristo/.test(l.text)), 'sin el recado de Don Evaristo');
  s.setFlag(F.letter);
  const ctx2 = stubCtx(s);
  await obs.pages[0].script(ctx2);
  assert.ok(!ctx2.said.some((l) => /Don Evaristo/.test(l.text)), 'el recado sigue tras abrir la pista');
  const sign = def.events.find((e) => e.id === 'cartel_lagos');
  const ctx3 = stubCtx(s);
  await sign.script(ctx3);
  assert.ok(/se fundió/.test(ctx3.said[0].text), 'con el puente aún roto, el cartel cambia');
  s.setFlag(F.bridgeA); s.setFlag(F.bridgeB);
  const ctx4 = stubCtx(s);
  await sign.script(ctx4);
  assert.ok(!/se fundió/.test(ctx4.said[0].text), 'el cartel sigue diciendo que el tramo se fundió');
});

test('rebuildGap ampliado: `flag` compartido entre zócalos, `when`, patch persistente y sin romper el uso básico', () => {
  const flagged = expandEventDef({ id: 'z', type: 'rebuildGap', x: 1, y: 1, tiles: [[1, 2, 2, 999]], flag: 'hueco', when: (s) => s.flag('abierto') }, {});
  const s = GameState.create({ name: 'P' });
  const ev = { selfSwitch: () => false };
  assert.ok(!flagged.pages[0].when(s, ev), 'aparece sin su condición');
  s.setFlag('abierto');
  assert.ok(flagged.pages[0].when(s, ev) && !flagged.pages[1].when(s, ev));
  s.setFlag('hueco');
  assert.ok(!flagged.pages[0].when(s, ev) && flagged.pages[1].when(s, ev));
  const plain = expandEventDef({ id: 'p', type: 'rebuildGap', x: 1, y: 1, tiles: [[1, 2, 2, 999]] }, {});
  assert.ok(plain.pages[0].when(s, { selfSwitch: () => false }) && plain.pages[1].when(s, { selfSwitch: () => true }));
  assert.equal(BRIDGE.sockets.A.length, 2);
});
