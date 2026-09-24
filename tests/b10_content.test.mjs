// Bloque 10 — Pilar de la Memoria: contenido (mapas, enlaces, células, entrenadores, encuentros), reglas puras de los
// puzles del Archivo Hondo y los guiones clave con un ctx simulado (notas de nombres, palancas, puerta glífica,
// rollos, Mural, Olvido, núcleo con restorePillar(5), informe tachado y la Losa del Olvido). docs/CAMPANA.md B10.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAPS } from '../game/src/content/maps/index.js';
import { TRAINERS } from '../game/src/content/trainers/index.js';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { storyApi } from '../game/src/content/story/api.js';
import { B10_CELLS } from '../game/src/content/events/b10_cells.js';
import { F, V, NOTES, OBJ, notesDelivered } from '../game/src/content/events/b10_common.js';
import {
  LEVER_TARGET, LEVER_START, nextLever, leversSolved, GLYPH_SEQUENCE, DOOR_GLYPHS, RELATO, touchGlyph,
  SCROLL_SEQUENCE, EMPTY_SLOTS, placeScroll, remainingScrolls, slotColor, PANELS, MURAL_START, MURAL_SOLUTION,
  swapPanels, placePanel, muralSolved, muralCorrect, panelHints,
} from '../game/src/content/events/b10_hondo_logic.js';
import { stepsAlong, ecoMove, ecoVanish, GATE_TALL } from '../game/src/content/events/b10_hondo_eco.js';
import { SUELO, sueloTraps, HONDO_ITEMS } from '../game/src/content/maps/b10/hondo_layout.js';
import { ALDEA_MNEMOS, ARCHIVO_HONDO, MNEMOS_HONEY } from '../game/src/content/encounters/b10.js';
import { hondoEvents } from '../game/src/content/events/b10_hondo.js';
import { nucleoEvents } from '../game/src/content/events/b10_hondo_nucleo.js';
import { archivoEvents } from '../game/src/content/events/b10_archivo.js';
import { olvidoPlazaTalk, cellHint } from '../game/src/content/events/b10_mnemos_story.js';
import * as notes from '../game/src/content/events/b10_notes.js';
import { mnemosEvents } from '../game/src/content/events/b10_mnemos.js';

const B10_MAPS = ['aldea_mnemos', 'mnemos_centro', 'mnemos_herbolario', 'mnemos_casa_te', 'mnemos_casa_olvido',
  'mnemos_casa_jacinta', 'mnemos_santuario', 'mnemos_archivo', 'archivo_hondo'];
const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const species = load('species.json');

/** ctx mínimo para guiones (sin DOM). `answers`: respuestas de choice en orden. */
function mockCtx(state, extra = {}, answers = []) {
  const said = [];
  const queue = [...answers];
  const ctx = {
    state, said, map: { id: 'archivo_hondo' },
    say: async (t) => { said.push(String(t)); },
    choice: async () => (queue.length ? queue.shift() : 0),
    confirm: async () => true,
    flag: (k) => state.flag(k),
    setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d),
    setVar: (k, v) => state.setVar(k, v),
    wait: async () => {}, fade: async () => {}, flash: async () => {}, tone: async () => {}, emote: async () => {},
    se: () => {}, me: () => {}, cry: () => {}, bgm: () => {}, shake: () => {},
    move: async () => {}, erase: () => {}, face: () => {}, requestRefresh: () => {}, directionTo: () => 2,
    giveItem: async (id, n = 1) => { state.addItem(id, n); },
    givePokemon: async (spec) => spec,
    heal: () => {},
    warp: async () => {},
    zygarde: (k) => state.zygardeAbility(k),
    world: { events: [], input: { held: () => false } },
    event: null,
    ui: { toast: () => {} },
    ...extra,
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

test('mapas del bloque: registrados, construyen sin avisos y crean sus eventos', async () => {
  for (const id of B10_MAPS) {
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

test('enlaces: Mnemos ↔ Ruta 8 (sur) y ↔ Ruta 9 (norte) simétricos cuando el vecino existe', async () => {
  const mn = (await MAPS.aldea_mnemos()).default;
  for (const [to, dir, back] of [['ruta_8_marisma', 'south', 'north'], ['ruta_9_neblino', 'north', 'south']]) {
    if (!MAPS[to]) continue;
    const other = (await MAPS[to]()).default;
    const a = (mn.connections || []).find((c) => c.to === to);
    const b = (other.connections || []).find((c) => c.to === 'aldea_mnemos');
    assert.ok(a, `Mnemos conecta con ${to}`);
    assert.equal(a.dir, dir);
    if (b) {
      assert.equal(b.dir, back);
      assert.equal((a.offset || 0) + (b.offset || 0), 0, `${to}: offsets simétricos`);
    }
  }
});

test('células: C045, C046 y C074 en su mapa, casilla y etapa del registro', async () => {
  assert.deepEqual(B10_CELLS.map((c) => c.code), ['C045', 'C046', 'C074']);
  for (const c of B10_CELLS) {
    const reg = cellByKey(c.id);
    assert.equal(reg.id, c.code);
    assert.equal(reg.map, c.map);
    assert.equal(reg.stage, c.stage);
    const def = (await MAPS[c.map]()).default;
    const ev = def.events.find((e) => e.type === 'zygardeCell' && e.cell === c.id);
    assert.ok(ev, `${c.id}: evento en ${c.map}`);
    assert.deepEqual([ev.x, ev.y], [c.x, c.y]);
  }
  assert.ok(cellByKey('cell_memoria_1').required, 'C046 obligatoria');
});

test('entrenadores: Olvido con el equipo del guion, dinero según BALANCE y niveles del tramo', () => {
  const o = TRAINERS.b10_olvido;
  assert.equal(o.party.map((p) => `${p.species}:${p.level}`).join(','), 'CHIMECHO:38,BEHEEYEM:38,BRONZONG:39,SPIRITOMB:40');
  assert.equal(o.money, 100);
  assert.equal(o.bgm, 'CombateLider');
  for (const [id, t] of Object.entries(TRAINERS).filter(([k]) => k.startsWith('b10_') && k !== 'b10_olvido')) {
    for (const p of t.party) assert.ok(p.level >= 36 && p.level <= 39, `${id}: nivel ${p.level} fuera de 36–39`);
    if (/tecnic/.test(id)) assert.equal(t.money, 40, `${id}: técnico de Genesis = 40`);
  }
});

test('encuentros: Mnemos día/noche y miel suman 100; el Archivo Hondo trae Unown en sus 28 formas', () => {
  for (const [name, table] of Object.entries({ day: ALDEA_MNEMOS.grassDay, night: ALDEA_MNEMOS.grassNight, honey: MNEMOS_HONEY })) {
    assert.equal(table.reduce((a, e) => a + e[0], 0), 100, name);
    for (const [, sp, min, max] of table) assert.ok(species[sp] && min >= 35 && max <= 40, `${name} ${sp}`);
  }
  const cave = ARCHIVO_HONDO.cave;
  const weight = (e) => (Array.isArray(e) ? e[0] : e.weight);
  assert.equal(cave.reduce((a, e) => a + weight(e), 0), 100);
  const unown = cave.filter((e) => !Array.isArray(e) && e.species === 'UNOWN');
  assert.equal(unown.length, 28);
  assert.equal(unown.reduce((a, e) => a + e.weight, 0), 30);
  for (const e of unown) assert.ok(e.form === 0 || species.UNOWN.forms[String(e.form)], `forma ${e.form}`);
});

test('reglas: Suelo Olvidado, Dos Manos, Lectura y Rollos', () => {
  // Suelo: el recorrido es contiguo, dentro de la rejilla, y las trampas son el resto.
  assert.equal(stepsAlong({ x: SUELO.start.x, y: SUELO.start.y }, SUELO.path).length, SUELO.path.length);
  assert.equal(sueloTraps().length + SUELO.path.length, SUELO.grid.w * SUELO.grid.h);
  // Dos Manos: se empieza sin resolver y basta con dejar cada palanca en su posición.
  assert.ok(!leversSolved(...LEVER_START));
  assert.ok(leversSolved(...LEVER_TARGET));
  assert.equal(nextLever(3), 0);
  // Lectura: el orden del relato; un glifo fuera de orden apaga la puerta.
  assert.deepEqual(RELATO.map((l) => l.glyph), GLYPH_SEQUENCE);
  assert.deepEqual([...DOOR_GLYPHS].sort(), [...GLYPH_SEQUENCE].sort());
  assert.notDeepEqual(DOOR_GLYPHS, GLYPH_SEQUENCE, 'la puerta no está en el orden del relato');
  let r = { step: 0 };
  for (const g of GLYPH_SEQUENCE.slice(0, 3)) r = touchGlyph(r.step, g);
  assert.equal(r.step, 3);
  assert.deepEqual(touchGlyph(3, 'flauta'), { step: 0, ok: false, done: false });
  r = { step: 0 };
  for (const g of GLYPH_SEQUENCE) r = touchGlyph(r.step, g);
  assert.ok(r.done);
  // Rollos: color y hueco en el orden del custodio; un error devuelve todo a la cesta.
  let s = { step: 0, slots: EMPTY_SLOTS };
  const first = SCROLL_SEQUENCE[0];
  assert.deepEqual(placeScroll(0, EMPTY_SLOTS, first.color, (first.cubby + 1) % 4).ok, false);
  for (const { color, cubby } of SCROLL_SEQUENCE) s = placeScroll(s.step, s.slots, color, cubby);
  assert.ok(s.done);
  assert.deepEqual(remainingScrolls(s.slots), []);
  assert.equal(slotColor(s.slots, first.cubby), first.color);
});

test('reglas: el Mural se ordena por intercambios; las Tablillas añaden pistas opcionales', () => {
  assert.ok(!muralSolved(MURAL_START));
  assert.equal(muralCorrect(MURAL_SOLUTION), 6);
  assert.equal(swapPanels('123456', 0, 5), '623451');
  let o = MURAL_START;
  for (let slot = 0; slot < 6; slot++) o = placePanel(o, slot, slot + 1);
  assert.ok(muralSolved(o));
  assert.deepEqual(panelHints(PANELS[0], []), [], 'sin Tablillas no hace falta ninguna pista');
  assert.match(panelHints(PANELS[0], ['MEADOWPLATE'])[0], /Crónica I:/);
});

test('notas de nombres: Olvido encarga cinco, se reparten en cualquier orden y abre el Archivo', async () => {
  const s = GameState.create({ name: 'P' });
  s.setFlag(F.arrival);
  let ctx = mockCtx(s, { event: { id: 'olvido_plaza' } });
  await olvidoPlazaTalk(ctx);
  assert.ok(s.flag(F.olvidoMet));
  assert.ok(ctx.said.some((t) => /Existes|Olvido Arrieta/.test(t)));
  const talkers = { sabina: notes.sabinaTalk, tome: notes.tomeTalk, jacinta: notes.jacintaTalk, amaro: notes.amaroTalk, bruno: notes.brunoTalk };
  for (const n of [...NOTES].reverse()) {
    ctx = mockCtx(s);
    await talkers[n.key](ctx);
    assert.ok(s.flag(n.flag), `nota de ${n.who}`);
  }
  assert.equal(notesDelivered(s), 5);
  assert.ok(s.flag(F.sinistea), 'Sabina regala el Sinistea');
  ctx = mockCtx(s, { event: null });
  await olvidoPlazaTalk(ctx);
  assert.ok(s.flag(F.notes) && s.flag(F.archivoOpen), 'Olvido abre el Archivo');
});

const byId = (list, id) => list.find((e) => e.id === id);
const pageFor = (ev, s) => [...ev.pages].reverse().find((p) => !p.when || p.when(s, { selfSwitch: () => false })) || null;

test('Archivo Hondo: palancas, puerta glífica (relato en la Libreta), rollos y Mural abren sus losas', async () => {
  const s = GameState.create({ name: 'P' });
  const evs = hondoEvents();
  // Dos Manos: la oeste de 0 a 2 y la este de 1 a 3.
  for (let i = 0; i < 2; i++) await pageFor(byId(evs, 'palanca_1'), s).script(mockCtx(s));
  for (let i = 0; i < 2; i++) await pageFor(byId(evs, 'palanca_2'), s).script(mockCtx(s));
  assert.ok(s.flag(F.manos), 'b10_manos');
  // Puerta glífica: se tocan los glifos en el orden del relato.
  const answers = GLYPH_SEQUENCE.map((g) => DOOR_GLYPHS.indexOf(g));
  const door = byId(evs, 'puerta_glifica');
  await pageFor(door, s).script(mockCtx(s, {}, [DOOR_GLYPHS.indexOf(GLYPH_SEQUENCE[1])]));
  assert.equal(s.var(V.glyphStep, 0), 0, 'un error apaga la puerta');
  await pageFor(door, s).script(mockCtx(s, {}, answers));
  assert.ok(s.flag(F.lectura));
  assert.ok(s.hasClue('b10_relato'), 'el relato queda en la Libreta');
  // Rollos: en cada hueco se elige el color (índice entre los que quedan).
  for (const { color, cubby } of SCROLL_SEQUENCE) {
    const left = remainingScrolls(s.var(V.scrollSlots, EMPTY_SLOTS));
    await pageFor(byId(evs, `hueco_rollo_${cubby}`), s).script(mockCtx(s, {}, [left.indexOf(color)]));
  }
  assert.ok(s.flag(F.rollos), 'b10_rollos');
  // Mural: en cada hueco se elige el panel que le toca.
  for (let slot = 0; slot < 6; slot++) {
    const ev = byId(evs, `panel_mural_${slot}`);
    await pageFor(ev, s).script(mockCtx(s, {}, [slot]));
  }
  assert.ok(s.flag(F.mural), 'b10_mural');
});

test('Olvido: perder cura y devuelve a la antesala sin cambiar el punto de cura; ganar abre el núcleo', async () => {
  const s = GameState.create({ name: 'P' });
  s.setFlag(F.olvidoDown);
  s.setHealPoint('mnemos_centro', 9, 7, 8);
  const olvido = byId(nucleoEvents(), 'olvido_hondo');
  const calls = [];
  let ctx = mockCtx(s, { battle: async () => 'lose', warp: async (...a) => { calls.push(a); } });
  await olvido.pages[0].script(ctx);
  assert.ok(ctx.said.some((t) => /¡Existes! Eres una nota a pie de página que camina\./.test(t)));
  assert.equal(calls.length, 1);
  assert.ok(!s.flag(F.olvido));
  ctx = mockCtx(s, { battle: async (req) => { assert.equal(req.trainer, 'b10_olvido'); assert.ok(req.rules.noMoneyLoss); return 'win'; } });
  await olvido.pages[0].script(ctx);
  assert.ok(s.flag(F.olvido));
  assert.deepEqual(s.healPoint, { mapId: 'mnemos_centro', x: 9, y: 7, dir: 8 });
});

test('núcleo: Fragmento 5, verso V completo con la Clave Glífica, T09, Trepar y la llamada de Alerce', async () => {
  const s = GameState.create({ name: 'P' });
  for (let i = 1; i <= 4; i++) s.addFragment(`F0${i}`);
  s.setFlag(F.olvidoDown); s.setFlag(F.olvido);
  s.data.zygarde.form = '10';
  const ped = byId(nucleoEvents(), 'nucleo_memoria');
  const warps = [];
  const ctx = mockCtx(s, { warp: async (...a) => { warps.push(a); }, scene: null });
  await ped.pages[1].script(ctx);
  assert.ok(s.flag(F.restored) && s.flag('verse_5'), 'p5_restored y verso V');
  assert.ok(s.data.fragments.includes('F05'));
  assert.ok(s.hasKeyItem('GLYPHKEY'), 'Clave Glífica');
  assert.ok(ctx.said.some((t) => /Eres tú\./.test(t)));
  assert.ok(ctx.said.some((t) => /Gael/.test(t)), 'Gael estuvo antes');
  assert.ok(ctx.said.some((t) => /La novena tabla sueña en voz ajena/.test(t)));
  assert.ok((s.clues || []).some((c) => c.id === 'T09'), 'pista T09');
  assert.ok(s.flag('p5_restored'), 'hito de Trepar (climb → p5_restored)');
  assert.ok(s.flag(F.alerce), 'Alerce llama');
  assert.deepEqual(warps[0].slice(0, 1), ['mnemos_archivo']);
});

test('Archivo de papel: cameo de Casia antes del P5; informe tachado y Piedra Espíritu después', async () => {
  const s = GameState.create({ name: 'P' });
  s.setFlag(F.archivoOpen);
  const evs = archivoEvents();
  let ctx = mockCtx(s);
  await byId(evs, 'escena_casia').script(ctx);
  assert.ok(ctx.said.some((t) => /Nosotros también salvamos lo que se pierde\./.test(t)));
  assert.ok(s.flag(F.casia) && s.flag(F.olvidoDown));
  s.setFlag(F.restored);
  ctx = mockCtx(s);
  await byId(evs, 'escena_informe').script(ctx);
  assert.ok(ctx.said.some((t) => /Los tachones también son memoria\./.test(t)));
  assert.ok(ctx.said.some((t) => /Laguna Clara/.test(t)));
  assert.ok(!ctx.said.some((t) => /Alerce/.test(t)), 'nadie dice un nombre');
  assert.ok(s.hasItem('ODDKEYSTONE') && s.flag(F.informe));
});

test('Losa del Olvido: de noche y con la Piedra Espíritu; si huye, vuelve tras descansar; capturado, se queda', async () => {
  const s = GameState.create({ name: 'P' });
  const losa = byId(mnemosEvents(), 'losa_olvido');
  const night = () => { s.data.clock.minutes = 22 * 60; };
  let battles = 0;
  let ctx = mockCtx(s, { wildBattle: async () => { battles += 1; return 'run'; } });
  night();
  await losa.script(ctx);
  assert.equal(battles, 0, 'sin la Piedra Espíritu no pasa nada');
  s.addItem('ODDKEYSTONE', 1);
  await losa.script(ctx);
  assert.equal(battles, 1);
  await losa.script(ctx);
  assert.equal(battles, 1, 'hasta descansar no vuelve');
  s.setVar(V.restCount, Number(s.var(V.restCount, 0)) + 1);
  ctx = mockCtx(s, { wildBattle: async () => { battles += 1; return 'caught'; } });
  await losa.script(ctx);
  assert.equal(battles, 2);
  assert.ok(s.flag(F.spiritomb) && !s.hasItem('ODDKEYSTONE'));
});

test('ecos: tras moverse o desvanecerse vuelven a ser atravesables (no tapan el Suelo Olvidado)', async () => {
  const home = { x: SUELO.start.x, y: SUELO.start.y, dir: 6 };
  const ev = { through: true, x: home.x, y: home.y, direction: 6, def: { home }, moveTo(x, y) { this.x = x; this.y = y; } };
  // ctx.move real deja `through` apagado al acabar; el mock lo imita (y una ruta que falla también).
  const ctx = { se() {}, move: async (e, route) => { e.through = false; if (route.includes('boom')) throw new Error('boom'); } };
  await ecoMove(ctx, ev, ['right']);
  assert.equal(ev.through, true);
  await assert.rejects(ecoMove(ctx, ev, ['boom']));
  assert.equal(ev.through, true, 'también si la ruta falla');
  ev.x = 30; ev.y = 30;
  await ecoVanish(ctx, ev);
  assert.deepEqual([ev.x, ev.y, ev.through], [home.x, home.y, true]);
});

test('umbrales: los pasos abordados desde el norte usan losas bajas; los del sur, la losa alta', () => {
  const pageOf = (id) => hondoEvents().find((e) => e.id === id).pages[0];
  assert.equal(pageOf('losa_manos').sprite, OBJ.threshold);
  assert.equal(pageOf('puerta_glifica').sprite, OBJ.threshold);
  for (const id of ['losa_rollos', 'losa_mural']) assert.equal(pageOf(id).sprite, GATE_TALL.sprite, id);
  assert.ok(fs.existsSync(new URL('../game/assets/objects/b10_umbral.png', import.meta.url)));
});

test('herbolario: Elio vende las hierbas de Mnemos y su saludo cambia al recuperar su nombre', async () => {
  const shop = (await MAPS.mnemos_herbolario()).default;
  const clerk = shop.events.find((e) => e.id === 'dependiente');
  const s = GameState.create({ name: 'P' });
  const opened = [];
  const ctx = { state: s, say: async () => {}, ui: { openShop: async (stock, o) => { opened.push({ stock, greeting: o.greeting }); } } };
  await clerk.script(ctx);
  s.setFlag(NOTES.find((n) => n.key === 'tome').flag);
  await clerk.script(ctx);
  assert.ok(['HEALPOWDER', 'REVIVALHERB', 'HONEY', 'POTION'].every((id) => opened[0].stock.includes(id)));
  assert.match(opened[0].greeting, /no se acuerda de mi nombre/);
  assert.match(opened[1].greeting, /me llama Elio otra vez/);
});

test('Olvido da la pista verbal de la célula más escondida (CAMPANA §2.2): bambú, luego el islote', () => {
  const s = GameState.create({ name: 'P' });
  assert.match(cellHint(s), /bambú/);
  s.addCell('cell_mnemos_1');
  assert.match(cellHint(s), /islote/);
  s.addCell('cell_mnemos_2');
  assert.equal(cellHint(s), null);
});

test('objetos del Archivo Hondo existen', () => {
  const items = { ...load('items.json'), ...load('items_axis.json') };
  for (const it of HONDO_ITEMS) assert.ok(items[it.item], it.item);
  assert.ok(items.GLYPHKEY && items.ODDKEYSTONE && items.GARDEVOIRITE);
});
