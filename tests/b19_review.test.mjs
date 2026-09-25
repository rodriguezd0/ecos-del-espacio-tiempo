// Bloque 19 — correcciones de la revisión: visita temprana al Mirador (la Ruta 7 lo abre desde el P4: textos de época,
// estela sin Clave Glífica y puesto por progreso), coherencia de Casandra (la regla de cruzar a pie y su Noivern), zonas
// de encuentro (nunca el Umbral ni los tramos) y bordillos de la calzada sin costuras en recodos y cruces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { CAMP_TEXT, CAMP_STOCK, campStock } from '../game/src/content/events/b19_calzada.js';
import { PENA_TEXT } from '../game/src/content/events/b19_pena.js';
import { TALLER_TEXT } from '../game/src/content/events/b19_taller.js';
import { ENCOUNTER_RECTS as SIMA_ZONES, UMBRAL, GAP_FINAL } from '../game/src/content/maps/b19/sima_layout.js';
import { ENCOUNTER_RECTS as CALZADA_ZONES, CAMP, NPC, isChasm, RIM_S } from '../game/src/content/maps/b19/calzada_layout.js';
import { SPAN_DEFS, cellsOf } from '../game/src/content/events/b19_spans_logic.js';
import { roadTileAt, tid } from '../game/src/content/maps/b19/tiles.js';
import { loadMapDefinition } from '../game/src/content/maps/index.js';

const inR = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const PILLARS = ['p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored', 'p6_restored', 'p7_restored', 'p8_restored', 'p9_restored'];

function stateWith(flags = [], gender = 'M') {
  const st = GameState.create({ name: 'Prueba', gender });
  for (const f of flags) st.setFlag(f);
  return st;
}

async function runLines(list, state) {
  return list.map((t) => (typeof t === 'function' ? t(state) : t));
}

test('Mirador antes del P8: Leocadia no habla de las máquinas del Mirador Sur (Genesis llega en el B17)', async () => {
  const early = await runLines(CAMP_TEXT.leocadia.early, stateWith(PILLARS.slice(0, 4), 'F'));
  assert.match(early[0], /^¡Una visitante! Bienvenida/);
  assert.ok(!early.some((t) => /máquinas/.test(t)), early.join(' | '));
  const late = await runLines(CAMP_TEXT.leocadia.early, stateWith(PILLARS.slice(0, 8)));
  assert.match(late[0], /^¡Un visitante! Bienvenido/);
  assert.ok(late.some((t) => /Mirador Sur hay gente con máquinas/.test(t)));
  for (const t of [...early, ...late]) assert.match(t, /./);
});

test('estela del Mirador: sin la Clave Glífica (P5) no se lee', async () => {
  const def = await loadMapDefinition('calzada_rey');
  const ev = def.events.find((e) => e.id === 'estela_mirador');
  const said = [];
  const run = async (st) => {
    said.length = 0;
    const ctx = { state: st, flag: (k) => st.flag(k), say: async (t) => { said.push(t); }, se() {} };
    await ev.pages[0].script(ctx);
    return [...said];
  };
  assert.deepEqual(await run(stateWith(PILLARS.slice(0, 4))), [CAMP_TEXT.steleNoKey]);
  const withKey = stateWith(PILLARS.slice(0, 5));
  withKey.addItem('GLYPHKEY', 1);
  assert.deepEqual(await run(withKey), CAMP_TEXT.stele);
});

test('puesto del Peregrino: solo lo que ya vende una tienda general con ese progreso', () => {
  assert.deepEqual(campStock(stateWith(PILLARS.slice(0, 4))), ['REVIVE']);
  assert.deepEqual(new Set(campStock(stateWith(PILLARS.slice(0, 5)))), new Set(['REVIVE', 'ULTRABALL', 'HYPERPOTION', 'FULLHEAL']));
  assert.deepEqual(new Set(campStock(stateWith(PILLARS))), new Set(CAMP_STOCK));
});

test('Casandra: la regla de cruzar a pie explica que nunca volaran, que ella cruce con Noivern y la Salamencita', () => {
  const intro = CAMP_TEXT.casandra.intro.join(' ');
  assert.match(intro, /a pie, o no se llega/);
  assert.ok(!/último rey/.test(intro), 'la Crónica no dice que fuera el último rey');
  assert.ok(PENA_TEXT.casandra.some((t) => /Noivern/.test(t) && /regla/.test(t)));
  assert.ok(!PENA_TEXT.casandra.some((t) => /en un día/.test(t)), 'los tramos pueden alzarse en días distintos');
  assert.ok(TALLER_TEXT.casandra.some((t) => /Noivern la trajo/.test(t)));
  assert.ok(!PENA_TEXT.alerce.some((t) => /en un día/.test(t)));
});

test('encuentros: nunca en el Umbral, el último tramo, los tramos forzados ni el campamento', () => {
  for (const r of SIMA_ZONES) {
    for (let y = UMBRAL.plaza.y0; y <= UMBRAL.plaza.y1; y++) {
      for (let x = UMBRAL.plaza.x0; x <= UMBRAL.plaza.x1; x++) assert.ok(!inR(r, x, y), `Umbral (${x},${y}) con encuentros`);
    }
    for (const [x, y] of GAP_FINAL.cells) assert.ok(!inR(r, x, y), `último tramo (${x},${y}) con encuentros`);
  }
  for (const r of CALZADA_ZONES) {
    for (const s of SPAN_DEFS) for (const st of cellsOf(s.n).stones) assert.ok(!inR(r, st.x, st.y), `piedra (${st.x},${st.y})`);
    for (const p of [CAMP.fire, CAMP.resonator, NPC.leocadia, NPC.mercader]) assert.ok(!inR(r, p.x, p.y), `campamento (${p.x},${p.y})`);
    assert.ok(r.y1 < RIM_S, 'ninguna zona al sur de la Sima');
  }
  assert.ok(isChasm(13, 39));
});

test('calzada: el bordillo sigue en recodos y cruces (sin ladrillo liso donde la calzada no continúa)', () => {
  // Forma en T: una calzada horizontal (y 9–11, x 0–8) con un ramal al norte (x 3–5, y 5–8).
  const cells = new Set();
  for (let y = 9; y <= 11; y++) for (let x = 0; x <= 8; x++) cells.add(`${x},${y}`);
  for (let y = 5; y <= 8; y++) for (let x = 3; x <= 5; x++) cells.add(`${x},${y}`);
  const isRoad = (x, y) => cells.has(`${x},${y}`);
  const row = (id) => Math.floor((id - 384) / 8) - 670;
  const col = (id) => (id - 384) % 8;
  for (let x = 0; x <= 8; x++) assert.equal(row(roadTileAt(x, 11, isRoad)), 4, `bordillo sur en (${x},11)`);
  for (let y = 5; y <= 8; y++) assert.equal(col(roadTileAt(3, y, isRoad)), 1, `bordillo oeste del ramal en (3,${y})`);
  assert.equal(col(roadTileAt(0, 10, isRoad)), 1);
  assert.equal(row(roadTileAt(4, 10, isRoad)) >= 2 && row(roadTileAt(4, 10, isRoad)) <= 3, true, 'ladrillo en el cruce');
  assert.equal(roadTileAt(4, 10, isRoad) >= tid(0, 670), true);
});

test('campamento: sin la pila de cajas de puerto (sus tiles no bloquean en Exterior1)', async () => {
  assert.equal(CAMP.crates, undefined);
  const def = await loadMapDefinition('calzada_rey');
  assert.ok(def.events.some((e) => e.id === 'mercader_peregrino'));
});
