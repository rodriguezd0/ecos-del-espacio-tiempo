// Bloque 20 — Pilar del Origen: datos, reglas puras y guiones sin navegador (docs/CAMPANA.md B20; D19, D20; §6.3–6.4).
//   · Puerta de las Quince: nichos, lo que falta (Tablillas, Fragmentos, Forma Completa) y la losa.
//   · Senda: piedras giratorias, puertas de caballeros y bribones con salida única, pasillo del viento, encuentros.
//   · Trío de las Nubes: peticiones (niveles, movimientos, sin huida, captura desactivada con el motivo literal), la pregunta
//     y la respuesta de Zygarde según el género, la línea de las torres del Anillo (B17).
//   · Gael B6: equipo, música del último Pokémon y la conversación con la línea de Mesprit (B16).
//   · Núcleo: Fragmento 10, Flauta Azur, profecía entera y falsa calma (fase 4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameState } from '../game/src/core/state.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { storyApi } from '../game/src/content/story/api.js';
import { CAMPAIGN_TABLETS } from '../game/src/content/story/tablets.js';
import { VERSES } from '../game/src/content/story/verses.js';
import { crisisPhase } from '../game/src/content/story/crisis.js';
import { clueStatus } from '../game/src/content/story/clueLogic.js';
import { F, V } from '../game/src/content/events/b20_common.js';
import {
  doorRequirements, placeableNiches, ALL_NICHES, STONES, stonePresses, DOOR_ROUNDS, doorExit, doorText, corridorPath,
  corridorLedge, trioRequest, TRIO, SEAL_REASON, TRIO_ANSWERS, ringTowersOff, GAEL_MESPRIT_LINE, platePresses,
} from '../game/src/content/events/b20_logic.js';
import { doorScript } from '../game/src/content/events/b20_puerta.js';
import { SENDA_CUEVA, UNOWN_ORIGEN } from '../game/src/content/encounters/b20.js';
import { mapInfo } from '../game/src/content/services/zones.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { getTrainer } from '../game/src/content/trainers/index.js';
import { T8, INNER, ARRIVE, CIELO, NUCLEO, tramoId } from '../game/src/content/maps/b20/layout.js';
import { tramo9Events } from '../game/src/content/events/b20_tramos_c.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { AXIS_TIME, AXIS_SPACE } from '../game/src/world/axis/logic.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const db = {
  species: load('species.json'), moves: load('moves.json'), abilities: load('abilities.json'), types: load('types.json'),
  items: { ...load('items.json'), ...load('items_axis.json') }, trainerTypes: load('trainer_types.json'),
};

/** Estado de entrada del bloque (CAMPANA B20): b19_calzada, P1–P9, nueve Fragmentos, quince Tablillas, Forma Completa. */
function entryState({ tablets = 15, fragments = 9, gender = 'M' } = {}) {
  const s = GameState.create({ name: 'Prueba', gender });
  for (let n = 1; n <= 9; n++) s.setFlag(`p${n}_restored`);
  for (const f of ['b19_calzada', 'zyg_complete']) s.setFlag(f);
  for (let n = 1; n <= fragments; n++) s.addFragment(`F0${n}`);
  for (const t of CAMPAIGN_TABLETS.slice(0, tablets)) { s.addTablet(t.id); s.addItem(t.id, 1); }
  for (const k of ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive', 'fly', 'rebuild']) s.setZygardeAbility(k, true);
  s.setZygardeForm('complete');
  s.setVar('gael_starter', 'LITTEN');
  return s;
}

function stubCtx(state, { choice = 0 } = {}) {
  const said = [];
  const events = [];
  const ctx = {
    state, said,
    map: { id: 'puerta_quince', def: {} },
    player: { x: 16, y: 18, direction: 8, moveTo(x, y) { this.x = x; this.y = y; }, straighten() {} },
    world: {
      events, followers: [],
      spawnEvent: (d) => { const e = { ...d, opacity: 255 }; events.push(e); return e; },
      removeEvent: (e) => { const i = events.indexOf(e); if (i >= 0) events.splice(i, 1); },
      current: { def: {} },
    },
    scene: { refreshFollower: () => {} },
    ui: { toast: () => {} },
    say: async (text, opts = {}) => { said.push({ text, speaker: opts.speaker ?? (opts.telepathy ? 'Zygarde' : null) }); },
    choice: async () => choice,
    move: async () => {}, face: () => {}, emote: async () => {}, wait: async () => {}, fade: async () => {},
    flash: async () => {}, shake: () => {}, tone: async () => {}, bgm: () => {}, se: () => {}, me: () => {}, cry: () => {},
    heal: () => {}, warp: async () => {}, requestRefresh: () => {}, effect: () => ({ remove: () => {} }),
    movePlayerTo: async () => {}, turnToPlayer: () => {}, setHealPoint: () => {},
    camera: { pan: async () => {}, reset: async () => {} },
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    zygarde: (k) => state.zygardeAbility(k),
    battle: async () => 'win',
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

const text = (ctx) => ctx.said.map((l) => l.text).join('\n');

// ───────────────────────────── Puerta de las Quince ─────────────────────────────

test('Puerta: con las quince Tablillas y los nueve Fragmentos se encienden los quince nichos y se hunde la losa', async () => {
  const s = entryState();
  assert.equal(doorRequirements(s, 0).ready, true);
  assert.equal(placeableNiches(s, 0).length, 15);
  const ctx = stubCtx(s);
  await doorScript(ctx);
  assert.equal(s.var(V.niches, 0), ALL_NICHES);
  assert.ok(s.flag(F.doorOpen), 'la losa no se hunde');
  assert.ok(!s.hasKeyItem('AZUREFLUTE'), 'la Flauta no se exige ni se da en la puerta (biblia §6.10)');
  assert.ok(s.data.tablets.length === 15 && s.hasItem('MEADOWPLATE'), 'las Tablillas se quedan con el jugador');
});

test('Puerta: si falta una Tablilla la nombra, marca su pista en la Libreta y conserva los nichos encendidos', async () => {
  const s = entryState({ tablets: 14 });
  const missing = CAMPAIGN_TABLETS[14];
  const ctx = stubCtx(s);
  await doorScript(ctx);
  assert.ok(!s.flag(F.doorOpen));
  assert.ok(text(ctx).includes(missing.name), 'la puerta no dice qué Tablilla falta');
  assert.notEqual(clueStatus(s, missing.arc), null, 'la Libreta no anota la pista de la Tablilla que falta');
  assert.equal(s.var(V.niches, 0), ALL_NICHES & ~(1 << 14));
  s.addTablet(missing.id);
  const ctx2 = stubCtx(s);
  await doorScript(ctx2);
  assert.ok(s.flag(F.doorOpen), 'con la última Tablilla no se abre');
});

test('Puerta: el camino proyectado se alza con su propio texto (nunca estuvo en pie: sin «ha vuelto a su sitio»)', async () => {
  const def = (await buildMapNode('puerta_quince')).def;
  const socket = def.events.find((e) => e.id === 'puerta_zocalo');
  assert.match(socket.doneText, /quince piedras suben del vacío/);
  assert.match(socket.askText, /alce las piedras/);
});

test('Puerta: sin un Fragmento la luz no llega a la losa y lo dice', async () => {
  const s = entryState({ fragments: 8 });
  const req = doorRequirements(s, 0);
  assert.deepEqual(req.fragments, [9]);
  const ctx = stubCtx(s);
  await doorScript(ctx);
  assert.ok(!s.flag(F.doorOpen));
  assert.ok(text(ctx).includes('Pilar de la Convergencia'));
});

// ───────────────────────────── Senda ─────────────────────────────

test('tramo 1: cada piedra gira hasta su respuesta en 1–3 pulsaciones (orden de B02)', () => {
  assert.deepEqual(STONES.map((s) => stonePresses(s)), [1, 3, 2]);
});

test('tramo 4: la placa solo baja montado (B08: a pie 1, montado 3)', () => {
  assert.equal(platePresses(false), false);
  assert.equal(platePresses(true), true);
});

test('tramo 8: cada variante de las puertas tiene una única salida, distinta, y habla del viaje', () => {
  const exits = new Set();
  DOOR_ROUNDS.forEach((round, v) => {
    exits.add(doorExit(v));
    assert.ok(round.some((i) => i.fact), 'ninguna inscripción habla del viaje');
    for (let n = 1; n <= 3; n++) assert.match(doorText(v, n), /^«.+»$/);
  });
  assert.equal(exits.size, DOOR_ROUNDS.length, 'dos variantes con la misma salida');
  // pasillo: de la llegada a cada losa clara sin tramos imposibles de recorrer sin parar
  const ledges = [];
  T8.rows.forEach((r, j) => [...r].forEach((ch, i) => { if (corridorLedge(i, j) && j > 0) ledges.push([i, j]); }));
  assert.ok(ledges.length >= 6);
  for (const [c, r] of ledges) assert.ok(corridorPath(ARRIVE.x - INNER.x, ARRIVE.y - INNER.y, c, r), `losa (${c},${r}) sin camino`);
});

test('tramo 8: con la puerta verdadera ya abierta, leer otra no «olvida» ni cambia la salida', async () => {
  const def = (await buildMapNode(tramoId(8))).def;
  const exit = doorExit(0);
  const wrong = [1, 2, 3].find((n) => n !== exit);
  const s = entryState();
  s.setFlag(F.t8Door);
  const ctx = stubCtx(s, { choice: 0 });
  ctx.map = { id: tramoId(8), def };
  let warped = null;
  ctx.warp = async (map) => { warped = map; };
  await def.events.find((e) => e.id === `t8_puerta_${wrong}`).pages[0].script(ctx);
  assert.equal(Number(s.var(V.t8Variant, 0)), 0, 'la variante cambia');
  assert.equal(warped, null, 'una puerta falsa lleva al tramo 9');
  assert.match(text(ctx), /sigue abierta/);
  const open = stubCtx(s);
  open.map = ctx.map;
  open.warp = async (map) => { warped = map; };
  await def.events.find((e) => e.id === `t8_puerta_${exit}`).pages[0].script(open);
  assert.equal(warped, tramoId(9), 'la puerta verdadera no cruza');
});

test('encuentros de la Senda: tabla de POKEDEX_DISTRIBUCION (62–68, pesos 100, Unown con las letras de ORIGEN)', () => {
  const total = SENDA_CUEVA.reduce((a, r) => a + r[0], 0);
  assert.equal(total, 100);
  for (const [, sp, min, max] of SENDA_CUEVA) {
    assert.ok(db.species[sp], `especie ${sp}`);
    assert.ok(min === 62 && max === 68);
  }
  assert.equal(SENDA_CUEVA.filter((r) => r[1] === 'UNOWN').reduce((a, r) => a + r[0], 0), 30);
  assert.deepEqual(Object.keys(UNOWN_ORIGEN).join(''), 'ORIGEN');
  const w = (sp) => SENDA_CUEVA.filter((r) => r[1] === sp).reduce((a, r) => a + r[0], 0);
  assert.deepEqual([w('BRONZONG'), w('DRAGONAIR'), w('HAKAMOO'), w('METANG')], [20, 20, 15, 15]);
});

test('zonas: los tramos senda_origen_N son del Pilar del Origen (atlas y fondo Cielo)', () => {
  for (const id of ['senda_origen_1', 'senda_origen_6_giro', 'senda_origen_7_fondo', 'puerta_quince', 'nucleo_origen']) {
    assert.equal(mapInfo(id)?.name, 'Pilar del Origen', id);
  }
});

// ───────────────────────────── Tramo 9 · cristales de cambio ─────────────────────────────

test('tramo 9: los cristales tensan la Cadena Roja del tramo (no la del Cruce) y la narración describe cada eje una vez', async () => {
  const crystal = expandEventDef(tramo9Events().find((e) => e.type === 'axisCrystal'));
  const script = crystal.pages[0].script;
  // Sin la Cadena Roja el cristal solo vibra
  const bare = stubCtx(entryState(), { choice: 0 });
  await script(bare);
  assert.equal(bare.state.var(V.t9Axis, null), null);
  assert.match(text(bare), /no tienes nada con lo que tirar/);
  // Con la Cadena: explicación la primera vez, tiempo (la cascada se para) y luego espacio (el pliegue se abre)
  const s = entryState();
  s.addItem('REDCHAIN', 1);
  const time = stubCtx(s, { choice: 0 });
  await script(time);
  assert.equal(s.var(V.t9Axis, null), AXIS_TIME);
  assert.equal(s.var('cadena_eje', null), null, 'tensa la Cadena de la Cámara del Cruce');
  assert.ok(s.flag(F.t9Crystal) && s.flag(F.t9Frozen) && !s.flag(F.t9Fold));
  assert.match(text(time), /eco de la Cámara del Cruce/);
  // Zygarde habla muy poco (autor, 25-09-2026): la explicación y los cambios son narración.
  assert.ok(!time.said.some((l) => l.speaker === 'Zygarde'), 'Zygarde explica el cristal');
  assert.match(text(time), /La cascada se ha parado/);
  const space = stubCtx(s, { choice: 1 });
  await script(space);
  assert.equal(s.var(V.t9Axis, null), AXIS_SPACE);
  assert.ok(s.flag(F.t9Fold));
  assert.doesNotMatch(text(space), /eco de la Cámara del Cruce/, 'la explicación se repite');
  assert.match(text(space), /Las marcas violetas se han abierto/);
  const again = stubCtx(s, { choice: 0 });
  await script(again);
  assert.doesNotMatch(text(again), /La cascada se ha parado/, 'la narración de la cascada se repite');
  assert.ok(![...space.said, ...again.said].some((l) => l.speaker === 'Zygarde'), 'Zygarde habla en el tramo 9');
});

// ───────────────────────────── Trío de las Nubes ─────────────────────────────

test('Trío: Tornadus 68, Thundurus 68, Landorus 70 con sus movimientos de CAMPANA; sin huida ni captura («No es momento: es un sello»)', () => {
  const must = { tornadus: ['HURRICANE', 'NASTYPLOT'], thundurus: ['THUNDERBOLT', 'DARKPULSE'], landorus: ['EARTHPOWER', 'STONEEDGE'] };
  for (const [k, lv] of [['tornadus', 68], ['thundurus', 68], ['landorus', 70]]) {
    const r = trioRequest(k);
    assert.equal(r.wild.level, lv);
    for (const m of must[k]) assert.ok(r.wild.moves.includes(m), `${k} sin ${m}`);
    for (const m of r.wild.moves) assert.ok(db.moves[m], `movimiento ${m}`);
    assert.equal(r.rules.canRun, false);
    assert.deepEqual(r.rules.catchCondition(), { allowed: false, reason: SEAL_REASON });
    assert.equal(SEAL_REASON, 'No es momento: es un sello.');
  }
  assert.deepEqual(TRIO_ANSWERS.map((a) => a.text), ['Para arreglar el cielo', 'Para que nadie lo haga por la fuerza', 'No lo sé; Zygarde me lo pidió']);
  assert.equal(TRIO.landorus.species, 'LANDORUS');
});

async function council(gender, { towers = false, choice = 1 } = {}) {
  const s = entryState({ gender });
  s.setFlag(F.tornadus); s.setFlag(F.thundurus); s.setFlag(F.landorus);
  if (towers) s.setVar('b17_torres_apagadas', 1);
  const def = (await buildMapNode('cielo_interior')).def;
  const land = def.events.find((e) => e.id === 'trio_landorus');
  const ctx = stubCtx(s, { choice });
  ctx.map = { id: 'cielo_interior', def };
  await land.pages[1].script(ctx);
  return { s, ctx };
}

test('Trío: la pregunta, Zygarde responde por él o por ella y el Trío se retira; las torres apagadas (B17) añaden su línea', async () => {
  const him = await council('M', { choice: 2 });
  assert.ok(him.s.flag(F.trio));
  assert.equal(him.s.var(V.trioAnswer), 'zygarde');
  assert.ok(him.ctx.said.some((l) => l.speaker === 'Zygarde' && l.text === 'Yo respondo por él.'), 'Zygarde no responde «por él»');
  assert.ok(!text(him.ctx).includes('Alguien apagó las torres'));
  const her = await council('F', { towers: true });
  assert.ok(her.ctx.said.some((l) => l.speaker === 'Zygarde' && l.text === 'Yo respondo por ella.'), 'Zygarde no responde «por ella»');
  assert.ok(her.ctx.said.some((l) => l.speaker === 'Landorus' && l.text === 'Alguien apagó las torres. Lo sentimos.'));
  // Zygarde habla muy poco (autor, 25-09-2026): en el Consejo solo dice la canónica.
  assert.deepEqual(her.ctx.said.filter((l) => l.speaker === 'Zygarde').map((l) => l.text), ['Yo respondo por ella.']);
  assert.equal(ringTowersOff(her.s), true);
});

test('Trío: la pregunta la hacen los tres y hay que responderla (B vuelve a preguntar)', async () => {
  const s = entryState();
  s.setFlag(F.tornadus); s.setFlag(F.thundurus); s.setFlag(F.landorus);
  const def = (await buildMapNode('cielo_interior')).def;
  const ctx = stubCtx(s);
  ctx.map = { id: 'cielo_interior', def };
  const answers = [-1, 1];
  const speakers = [];
  ctx.choice = async (_items, opts = {}) => { speakers.push(opts.speaker); return answers.shift() ?? 1; };
  await def.events.find((e) => e.id === 'trio_landorus').pages[1].script(ctx);
  assert.equal(speakers.length, 2, 'cancelar no vuelve a preguntar');
  assert.ok(speakers.every((sp) => sp === 'Los tres'));
  assert.equal(s.var(V.trioAnswer), 'fuerza');
  assert.ok(s.flag(F.trio));
});

// ───────────────────────────── Gael ─────────────────────────────

test('Gael B6: equipo de §6.3 (Mega Absol con el aro), dinero de rival y «Ultimo Pokemon» con su último Pokémon', () => {
  const s = entryState();
  const t = getTrainer('b20_gael_b6', s);
  assert.deepEqual(t.party.map((p) => [p.species, p.level]), [
    ['STARAPTOR', 70], ['LUCARIO', 70], ['WEAVILE', 70], ['GARCHOMP', 71], ['ABSOL', 71], ['INCINEROAR', 72],
  ]);
  assert.equal(t.party[4].item, 'ABSOLITE');
  assert.equal(t.money, 60);
  assert.doesNotMatch(t.winText, /^Otra vez/, 'repite el «Otra vez. Siéntate.» de la cura tras perder');
  const { meta, config } = buildBattleConfig({ type: 'trainer', trainer: 'b20_gael_b6' }, { db, state: s, getTrainer });
  assert.equal(meta.bgm, 'CombateRival');
  assert.equal(meta.lastPokemonBgm, 'Ultimo Pokemon');
  assert.equal(config.opponent.megaRing, true);
});

test('Gael: cura, combate y conversación del verso X con la línea de Mesprit; Zygarde dice su nombre; se va sin llevarse nada', async () => {
  const def = (await buildMapNode('terraza_ultimo_sello')).def;
  for (const [answer, line] of Object.entries(GAEL_MESPRIT_LINE)) {
    const s = entryState();
    s.setVar('b16_mesprit_respuesta', answer);
    const ctx = stubCtx(s);
    ctx.map = { id: 'terraza_ultimo_sello', def };
    const gael = def.events.find((e) => e.id === 'gael');
    await gael.pages[0].script(ctx);
    const t = text(ctx);
    assert.ok(t.includes('Siéntate. No voy a pelear contra un equipo roto.') && t.includes('No quiero ganarte con trampas ni perder con excusas.'));
    assert.ok(t.includes('Antes quería medirme contigo.'), 'Gael no dice por qué no ha entrado');
    assert.ok(s.flag(F.gaelHeal) && s.flag(F.gaelB6) && s.flag(F.gaelTalk) && s.flag(F.gaelGone));
    assert.ok(t.includes('¿«Querrá ser quien llama»? …Eso sí lo entiendo.'));
    assert.ok(t.includes('Yo pedí permiso.'));
    assert.ok(ctx.said.some((l) => l.speaker === 'Gael' && l.text === line.gael), `sin la línea de ${answer}`);
    assert.ok(ctx.said.some((l) => l.speaker === 'Zygarde' && l.text === 'Gael. No respondí contra ti.'));
    assert.ok(ctx.said.some((l) => l.speaker === 'Gael' && l.text === 'Ya. Por eso es peor.'));
    assert.ok(s.flag('verse_10'), 'no se lee el verso X');
  }
});

test('Gael: si se pierde el B6, cura otra vez y espera (sin derrota general)', async () => {
  const def = (await buildMapNode('terraza_ultimo_sello')).def;
  const s = entryState();
  const ctx = stubCtx(s);
  ctx.battle = async () => 'lose';
  let healed = 0;
  ctx.heal = () => { healed += 1; };
  await def.events.find((e) => e.id === 'gael').pages[0].script(ctx);
  assert.ok(s.flag(F.gaelHeal) && !s.flag(F.gaelB6));
  assert.ok(healed >= 2, 'no vuelve a curar tras perder');
  assert.equal(s.var(V.gaelTries), 1);
});

// ───────────────────────────── Núcleo ─────────────────────────────

test('Núcleo: Fragmento 10, los diez se unen en la Flauta Azur, profecía entera de corrido y falsa calma (fase 4)', async () => {
  const s = entryState();
  const def = (await buildMapNode('nucleo_origen')).def;
  const core = def.events.find((e) => e.id === 'nucleo_origen');
  const ctx = stubCtx(s);
  ctx.map = { id: 'nucleo_origen', def };
  await core.pages[0].script(ctx);
  assert.ok(s.flag('p10_restored') && s.flag(F.flute) && s.flag(F.prophecy) && s.flag(F.calm));
  assert.ok(s.data.fragments.includes('F10'));
  assert.ok(s.hasKeyItem('AZUREFLUTE'), 'sin Flauta Azur');
  assert.equal(s.itemCount('AZUREFRAGMENT'), 0, 'los Fragmentos siguen sueltos');
  const lines = ctx.said.map((l) => l.text);
  const idx = VERSES.map((v) => lines.indexOf(`${v.numeral}. ${v.text}`));
  assert.ok(idx.every((i) => i >= 0), 'falta algún verso');
  assert.deepEqual([...idx].sort((a, b) => a - b), idx, 'los versos no van en orden');
  assert.ok(idx[9] - idx[0] === 9, 'la profecía no se lee de corrido');
  // Zygarde habla muy poco (autor, 25-09-2026): en el núcleo solo la canónica de la falsa calma.
  assert.deepEqual(ctx.said.filter((l) => l.speaker === 'Zygarde').map((l) => l.text), ['El Eje está entero. Pero quien lo sostiene duerme.']);
  assert.equal(crisisPhase(s), 4);
});

test('Núcleo: el emblema de la Liga (parece una Poké Ball) queda tapado por alfombra lisa y el hexágono del kit', async () => {
  const { entry } = await buildMapNode('nucleo_origen');
  const m = entry.map;
  const at = (layer, x, y) => { const L = m.layers[layer]; return Array.isArray(L?.[0]) ? L[y][x] : L[y * m.width + x]; };
  const E = NUCLEO.emblem;
  for (let y = E.y0; y <= E.y1; y++) {
    for (let x = E.x0; x <= E.x1; x++) assert.equal(at(1, x, y), at(2, E.plainX, y), `(${x},${y}) conserva el emblema`);
  }
  assert.ok(at(2, NUCLEO.core.x, NUCLEO.core.y) > 0, 'sin la cámara de núcleo sobre el sello');
});

test('Núcleo: sin el Fragmento 9 el núcleo no responde (cadena de resonancia)', async () => {
  const s = entryState({ fragments: 8 });
  const def = (await buildMapNode('nucleo_origen')).def;
  const ctx = stubCtx(s);
  await def.events.find((e) => e.id === 'nucleo_origen').pages[0].script(ctx);
  assert.ok(!s.flag('p10_restored') && !s.hasKeyItem('AZUREFLUTE'));
});

test('Cielo Interior: cada manantial cura y guarda punto de control', async () => {
  const def = (await buildMapNode('cielo_interior')).def;
  for (const sp of CIELO.springs) {
    const s = entryState();
    const ctx = stubCtx(s);
    let healed = false;
    ctx.heal = () => { healed = true; };
    ctx.setHealPoint = (x, y, dir) => { s.setHealPoint('cielo_interior', x, y, dir); };
    ctx.map = { id: 'cielo_interior', def };
    const ev = def.events.find((e) => e.id === `cielo_manantial_${sp.n}`);
    await ev.pages[0].script(ctx);
    assert.ok(healed && s.flag(F.spring(sp.n + 2)));
    assert.deepEqual([s.healPoint.x, s.healPoint.y], [sp.stand.x, sp.stand.y]);
  }
});
