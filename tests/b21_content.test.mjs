// Bloque 21 — Final (docs/CAMPANA.md B21; D21–D24): reglas y escenas probadas sin navegador.
//   · Arceus en tres fases con el motor real (battle/core/bossPhases.js): orden fijo Tierra → Fantasma → Normal, la
//     Tabla Legendaria no se equipa, transiciones sin debilitarse (curación total, limpieza, +25 % al equipo), captura
//     bloqueada en las fases 1–2 sin gastar Ball ni turno, activa en la 3 bajo el 50 % (Master Ball), Recuperación una
//     sola vez en la 3, victoria al debilitarlo en la 3 y fase alcanzada al perder.
//   · Reintentar fase / Retirarse con la fase guardada; captura voluntaria de Zygarde (Forma Completa nv 70, Honor Ball,
//     menú obligatorio del Arca con el equipo lleno); resolución (18 Tablillas, confirmación, eje reparado, game_cleared);
//     epílogo (huevo del inicial de Gael que espera si el equipo está lleno); textos con el género del protagonista.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameState } from '../game/src/core/state.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { storyApi } from '../game/src/content/story/api.js';
import { crisisPhase } from '../game/src/content/story/crisis.js';
import {
  arceusRequest, reachedPhase, clampPhase, ARCEUS_PHASES, boostPlayerTeam, arceusCatchRule, phaseStage,
} from '../game/src/content/events/b21_arceus_logic.js';
import { fightArceus, resolutionScene, restoreSnapshot } from '../game/src/content/events/b21_arceus.js';
import { captureZygarde, zygardeQuestion, createTeamZygarde, ZYGARDE_MOVES } from '../game/src/content/events/b21_zygarde.js';
import { giveGaelEgg, gaelEggSpecies } from '../game/src/content/events/b21_epilogo.js';
import { socketTablet } from '../game/src/content/events/b21_columna.js';
import { RESOLUTION_TEXT, BATTLE_TEXT, EPILOGUE_TEXT } from '../game/src/content/events/b21_texts.js';
import { F, V } from '../game/src/content/events/b21_common.js';
import { SOCKETS, ARCEUS_SOCKET_KS } from '../game/src/content/maps/b21/layout.js';
import { TABLETS } from '../game/src/content/story/tablets.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const items = { ...load('items.json'), ...load('items_axis.json') };
const db = {
  species: load('species.json'), moves: load('moves.json'), types: load('types.json'), items,
  abilities: load('abilities.json'), trainerTypes: load('trainer_types.json'),
};
const MAX_ROLL = () => 0.9999;
const IVS = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

/** Atacante fuerte con un movimiento eficaz para cada fase de Arceus (Agua vs Tierra, Siniestro vs Fantasma, Lucha). */
const striker = () => createPokemon(db, 'MEWTWO', 100, {
  rng: () => 0.5, ivs: IVS, nature: 'MODEST', moves: ['SURF', 'DARKPULSE', 'AURASPHERE', 'RECOVER'], shiny: false,
});
const PHASE_MOVE = ['SURF', 'DARKPULSE', 'AURASPHERE'];

/** UI de prueba: elige el movimiento eficaz de la fase; intenta Balls cuando `plan` lo pide. */
class ArceusUI extends HeadlessBattleUI {
  constructor(start, plan = {}) {
    super({ chooseMove: (battler, moves) => this.pickMove(moves) });
    this.start = start;
    this.plan = { earlyBall: null, finalBall: null, ...plan };
    this.thrown = [];
  }

  phase() { return clampPhase(this.start + (this.battle?.phaseState?.index || 0)); }

  pickMove(moves) {
    const want = PHASE_MOVE[this.phase()];
    const m = moves.find((x) => x.id === want && x.selectable) || moves.find((x) => x.selectable && x.category !== 'Status')
      || moves.find((x) => x.selectable) || moves[0];
    return { index: m.index, mega: false };
  }

  wantsBall() {
    const b = this.battle;
    if (this.plan.earlyBall && this.phase() < 2 && !this.thrown.includes('early')) return this.plan.earlyBall;
    if (this.plan.finalBall && this.phase() === 2 && b?.b21LegendDropped && !this.thrown.includes('final')) return this.plan.finalBall;
    return null;
  }

  async chooseAction() { return this.wantsBall() ? 'bag' : 'fight'; }

  async chooseItem() {
    const ball = this.wantsBall();
    if (!ball) return null;
    this.thrown.push(this.phase() < 2 ? 'early' : 'final');
    return { item: ball, target: 0, move: -1 };
  }
}

function playerState(party, bag = {}) {
  const st = GameState.create({ name: 'Prueba' });
  st.setParty(party);
  for (const [id, n] of Object.entries(bag)) st.addItem(id, n);
  return st;
}

async function runArceus(start, { party = [striker(), striker(), striker()], bag = {}, plan = {}, session = { snapshots: {} } } = {}) {
  const req = arceusRequest({ db, startPhase: start, session, rng: () => 0.5 });
  const st = playerState(party, bag);
  const { config } = buildBattleConfig({ ...req, opponent: { party: [req.wild] } }, { db, state: st });
  const ui = new ArceusUI(start, plan);
  const battle = new Battle({ ...config, rng: MAX_ROLL }, ui);
  ui.battle = battle;
  const result = await battle.run();
  return { battle, ui, result, session, state: st };
}

// ───────────────────────────── petición y datos ─────────────────────────────

test('Arceus: nivel 75, Multitipo, orden fijo Tierra → Fantasma → Normal y la Tabla Legendaria sin equipar', () => {
  assert.deepEqual(ARCEUS_PHASES.map((p) => [p.form, p.item]), [[4, 'EARTHPLATE'], [7, 'SPOOKYPLATE'], [0, null]]);
  assert.deepEqual(ARCEUS_PHASES.map((p) => db.species.ARCEUS.forms[p.form]?.types?.[0] ?? 'NORMAL'), ['GROUND', 'GHOST', 'NORMAL']);
  const r = arceusRequest({ db, startPhase: 0, session: { snapshots: {} } });
  assert.equal(r.wild.species, 'ARCEUS');
  assert.equal(r.wild.level, 75);
  assert.equal(r.wild.ability, 'MULTITYPE');
  assert.equal(r.wild.shiny, false);
  assert.deepEqual(r.wild.moves.map((m) => m.id), ['JUDGMENT', 'STONEEDGE', 'SWORDSDANCE', 'RECOVER']);
  assert.equal(r.phases.length, 2);
  assert.equal(r.rules.canRun, false);
  assert.equal(r.rules.canLose, true);
  assert.equal(r.rules.noMoneyLoss, true);
  assert.equal(r.bgm, 'Legendario mayor');
  assert.equal(r.battleback, 'ColumnaLanza');
  assert.equal(r.phases[1].item, null, 'fase Normal sin objeto');
  const last = arceusRequest({ db, startPhase: 2 });
  assert.equal(last.phases.length, 0);
  assert.equal(last.wild.heldItem, null);
  assert.equal(last.wild.moves.find((m) => m.id === 'RECOVER').pp, 1, 'Recuperación una sola vez en la fase 3');
  assert.deepEqual(phaseStage(2), { bgm: 'PrismaBossFinal', battleback: 'Arceus' });
  assert.equal(db.species.ARCEUS.catchRate, 3);
  assert.equal(reachedPhase(1, { phase: { index: 1 } }), 2);
  assert.equal(reachedPhase(0, { phase: { index: 7 } }), 2);
});

test('captura: bloqueada en las fases 1 y 2 con «Arceus aún sostiene la Tabla X»; en la 3 solo tras soltar la Legendaria', () => {
  const fake = (index, dropped = false) => ({ phaseState: { index }, b21LegendDropped: dropped });
  assert.deepEqual(arceusCatchRule(fake(0), 0), { allowed: false, reason: 'Arceus aún sostiene la Tabla Terrax.' });
  assert.deepEqual(arceusCatchRule(fake(1), 0), { allowed: false, reason: 'Arceus aún sostiene la Tabla Terror.' });
  assert.deepEqual(arceusCatchRule(fake(0), 2), { allowed: false, reason: 'Arceus aún sostiene la Tabla Legendaria.' });
  assert.equal(arceusCatchRule(fake(0, true), 2).allowed, true);
  assert.equal(arceusCatchRule(fake(2, true), 0).allowed, true);
});

test('+25 % de PS al equipo del jugador: activos y en reserva; los debilitados siguen debilitados', () => {
  const a = { hp: 100, egg: false };
  const b = { hp: 0 };
  const c = { hp: 390 };
  let recovered = 0;
  const active = { opposes: () => false, pokemonIndex: 0, pokemon: a, totalhp: 400, pbRecoverHP: (n) => { recovered = n; a.hp += n; return n; } };
  const battle = { party1: [a, b, c], party1starts: [0], battlers: [active, null], maxHPOf: () => 400 };
  const total = boostPlayerTeam(battle, 0.25);
  assert.equal(recovered, 100);
  assert.equal(a.hp, 200);
  assert.equal(b.hp, 0);
  assert.equal(c.hp, 400);
  assert.equal(total, 110);
});

// ───────────────────────────── combate real ─────────────────────────────

test('combate completo: transiciones sin debilitarse, Balls bloqueadas sin gastar nada y Master Ball bajo el 50 % en la fase 3', async () => {
  const session = { snapshots: {} };
  const { battle, ui, result } = await runArceus(0, { bag: { POKEBALL: 5, MASTERBALL: 1 }, plan: { earlyBall: 'POKEBALL', finalBall: 'MASTERBALL' }, session });
  const text = ui.messages.join('\n');
  assert.equal(result.outcome, 'caught', text.slice(-600));
  assert.equal(result.caught.species, 'ARCEUS');
  assert.equal(result.bag.POKEBALL, 5, 'la Poké Ball bloqueada no se gasta');
  assert.equal(result.bag.MASTERBALL || 0, 0);
  const forms = ui.events.filter((e) => e.type === 'changeForm' && e.index === 1).map((e) => e.form);
  assert.deepEqual(forms, [7, 0], 'Fantasma y luego Normal');
  const order = ['Arceus aún sostiene la Tabla Terrax.', '¡Arceus ha soltado la Tabla Terrax!', BATTLE_TEXT.change('Fantasma'), BATTLE_TEXT.boon,
    '¡Arceus ha soltado la Tabla Terror!', BATTLE_TEXT.change('Normal'), BATTLE_TEXT.legend, BATTLE_TEXT.catchable];
  let at = -1;
  for (const m of order) {
    const i = ui.messages.findIndex((x, k) => k > at && x.includes(m));
    assert.ok(i > at, `falta o está fuera de orden: «${m}»`);
    at = i;
  }
  assert.ok(!ui.messages.some((m) => /Arceus salvaje se debilitó|Arceus se debilitó/.test(m)), 'Arceus no se debilita en las transiciones');
  assert.ok(ui.messages.some((m) => m.includes('¿Miras la sombra sin volverte ella?')));
  assert.ok(ui.messages.some((m) => m.includes('¿Qué eres cuando no queda nada que ganar?')));
  assert.ok(session.snapshots[1] && session.snapshots[2], 'instantáneas al empezar las fases 2 y 3');
  assert.equal(battle.phaseState.index, 2);
  assert.equal(battle.battlers[1]?.pokemon?.heldItem ?? null, null);
});

test('fase 3: Recuperación una vez; al soltar la Tabla Legendaria ya no la usa; debilitado = victoria', async () => {
  const { battle, ui, result } = await runArceus(2);
  assert.equal(result.outcome, 'win');
  assert.ok(ui.messages.some((m) => m.includes(BATTLE_TEXT.legend)) || result.turns <= 2, 'suelta la Tabla al bajar del 50 %');
  const uses = ui.events.filter((e) => e.type === 'animateMove' && e.user === 1 && e.moveId === 'RECOVER').length;
  assert.ok(uses <= 1, `Recuperación usada ${uses} veces`);
  assert.equal(battle.phaseState.total, 0);
});

test('derrota: el resultado dice la fase alcanzada (se guarda para reintentar o volver)', async () => {
  const weak = createPokemon(db, 'MAGIKARP', 5, { rng: () => 0.5, moves: ['SPLASH'], shiny: false });
  const { result } = await runArceus(1, { party: [weak] });
  assert.equal(result.outcome, 'lose');
  assert.equal(reachedPhase(1, result), 1);
  assert.equal(result.moneyChange, 0, 'sin pérdida de dinero');
});

// ───────────────────────────── reintento y retirada ─────────────────────────────

function stubCtx(state, { choices = [], battles = [] } = {}) {
  const said = [];
  const ctx = {
    state, db, said,
    map: { id: 'columna_lanza' },
    player: { x: 14, y: 9, direction: 8, moveTo(x, y) { this.x = x; this.y = y; }, straighten() {} },
    world: { events: [], followers: [], spawnEvent: (d) => ({ ...d }), removeEvent: () => {}, core: null },
    scene: {
      refreshFollower: () => {}, camera: { snapToTarget: () => {} },
      startBattle: async () => battles.shift() || { outcome: 'win', phase: { index: 0 } },
    },
    ui: { toast: () => {}, openParty: async () => 0 },
    say: async (text, opts = {}) => { said.push({ text, speaker: opts.speaker ?? (opts.telepathy ? 'Zygarde' : null) }); },
    choice: async () => (choices.length ? choices.shift() : 0),
    confirm: async () => true,
    move: async () => {}, face: () => {}, emote: async () => {}, wait: async () => {}, fade: async () => {},
    flash: async () => {}, shake: () => {}, tone: async () => {}, bgm: () => {}, se: () => {}, me: () => {}, cry: () => {},
    heal: () => { state.setParty(state.party.map((p) => ({ ...p, hp: 999 }))); },
    warp: async () => {}, requestRefresh: () => {}, effect: () => null,
    camera: { pan: async () => {}, reset: async () => {} },
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    giveItem: async (id, n = 1) => { if (items[id]?.pocket === 8) state.addKeyItem(id); else state.addItem(id, n); },
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

test('«Reintentar fase» devuelve equipo y objetos a la instantánea; «Retirarse» cura y guarda la fase', async () => {
  const st = playerState([striker()], { POTION: 3 });
  const start = JSON.parse(JSON.stringify(st.party));
  // 1.ª derrota en la fase 2 (índice 1): se reintenta; la instantánea de esa fase no existe en la sesión → la de inicio.
  const lose = (index) => {
    st.setParty(st.party.map((p) => ({ ...p, hp: 0 })));
    st.removeItem('POTION', 1);
    return { outcome: 'lose', phase: { index } };
  };
  const ctx = stubCtx(st, { choices: [0, 1] });
  let calls = 0;
  ctx.scene.startBattle = async (req) => {
    calls += 1;
    assert.equal(req.rules.canRun, false);
    return lose(calls === 1 ? 1 : 0);
  };
  const out = await fightArceus(ctx);
  assert.equal(out, 'retreat');
  assert.equal(calls, 2);
  assert.equal(st.var(V.phase), 1, 'la fase alcanzada (Fantasma) se guarda');
  assert.equal(st.itemCount('POTION'), 2, 'el reintento devolvió la Poción; la retirada no');
  assert.ok(st.party.every((p) => p.hp > 0), 'retirarse cura al equipo');
  assert.ok(ctx.said.some((l) => l.text === BATTLE_TEXT.retreat));
  assert.equal(start[0].uid, st.party[0].uid);
  // El siguiente combate empieza en la fase guardada.
  let requested = null;
  ctx.scene.startBattle = async (req) => { requested = req; return { outcome: 'caught', phase: { index: 0 } }; };
  assert.equal(await fightArceus(ctx), 'caught');
  assert.equal(requested.wild.form, 7, 'retoma en la fase Fantasma con todos sus PS');
  assert.ok(st.flag(F.arceusCaught) && st.flag(F.arceusDone));
  assert.ok(restoreSnapshot(st, { party: start, bag: { POTION: 9 } }));
  assert.equal(st.itemCount('POTION'), 9);
});

// ───────────────────────────── Zygarde ─────────────────────────────

test('Zygarde se une: Forma Completa nv 70, Agrupamiento, Honor Ball y sus cuatro movimientos', async () => {
  const st = playerState([striker()]);
  st.setZygardeForm('complete');
  const z = createTeamZygarde(db, st);
  assert.equal(z.species, 'ZYGARDE');
  assert.equal(z.form, 2);
  assert.equal(z.level, 70);
  assert.equal(z.ability, 'POWERCONSTRUCT');
  assert.equal(z.ball, 'PREMIERBALL');
  assert.deepEqual(z.moves.map((m) => m.id), [...ZYGARDE_MOVES]);
  assert.deepEqual(ZYGARDE_MOVES, ['THOUSANDARROWS', 'THOUSANDWAVES', 'COREENFORCER', 'DRAGONDANCE']);
  // «Todavía no»: la escena espera; «Sí»: se une.
  const ctx = stubCtx(st, { choices: [1, 0] });
  assert.equal(await zygardeQuestion(ctx), false);
  assert.ok(st.flag(F.zygardeAsked) && !st.flag(F.zygardeJoined));
  assert.equal(await zygardeQuestion(ctx), true);
  assert.ok(st.flag(F.zygardeJoined));
  assert.equal(st.party.length, 2);
  assert.ok(st.data.dex.caught.ZYGARDE);
});

test('equipo lleno: el Arca obliga a enviar uno al PC (no se puede cancelar) y después se une Zygarde', async () => {
  const party = Array.from({ length: 6 }, () => striker());
  const st = playerState(party);
  st.setZygardeForm('complete');
  const ctx = stubCtx(st);
  const asks = [null, -1, 3]; // cancela dos veces: el menú vuelve a abrirse
  ctx.ui.openParty = async () => asks.shift();
  const sentUid = party[3].uid;
  assert.equal(await captureZygarde(ctx), true);
  assert.equal(st.party.length, 6);
  assert.equal(st.party[5].species, 'ZYGARDE');
  assert.ok(st.data.boxes.some((b) => b.some((p) => p?.uid === sentUid)), 'el elegido está en el PC');
  assert.equal(asks.length, 0);
  assert.ok(ctx.said.filter((l) => /Elige a quién enviar/.test(l.text)).length === 2);
});

// ───────────────────────────── resolución ─────────────────────────────

test('resolución: las 18 Tablillas, la confirmación, el eje no elegido y el cielo restablecido (game_cleared)', async () => {
  const st = playerState([striker()]);
  st.player.gender = 'F';
  for (const t of TABLETS.filter((x) => !x.arceusPhase)) st.addTablet(t.id);
  for (let n = 1; n <= 10; n++) { st.setFlag(`p${n}_restored`); st.addFragment(`F${String(n).padStart(2, '0')}`); }
  st.setZygardeForm('complete');
  for (const k of ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive', 'fly', 'rebuild']) st.setZygardeAbility(k, true);
  st.setVar(V.p9Choice, 'DIALGA');
  st.setFlag(F.arceusDone);
  st.setFlag(F.arceusFainted);
  const ctx = stubCtx(st);
  assert.equal(crisisPhase(st), 4, 'falsa calma antes del final');
  await resolutionScene(ctx);
  assert.equal(st.data.tablets.length, 18);
  for (const id of ['EARTHPLATE', 'SPOOKYPLATE', 'LEGENDPLATE']) assert.ok(st.hasItem(id), id);
  assert.ok(st.flag('verse_confirmation'));
  assert.ok(st.flag(F.gameCleared) && st.flag(F.axisRepaired) && st.flag(F.finalResolved) && st.flag(F.tabletsComplete));
  assert.equal(crisisPhase(st), 5);
  assert.ok(st.zygardeAbility('anchor'), 'Anclaje (postgame) tras Arceus');
  const said = ctx.said.map((l) => l.text);
  assert.ok(said.includes('Respondiste a la llamada. Eres aquella de la que hablaban las piedras.'), 'confirmación en femenino');
  assert.ok(said.includes(RESOLUTION_TEXT.axis.DIALGA), 'Dialga elegido: se repara el espacio');
  assert.ok(said.includes(RESOLUTION_TEXT.stays), 'Arceus sin capturar se queda en Columna Lanza');
});

test('la confirmación respeta el género y el texto masculino es el canon', () => {
  const m = GameState.create({ name: 'A', gender: 'M' });
  const f = GameState.create({ name: 'B', gender: 'F' });
  assert.equal(RESOLUTION_TEXT.confirm(m), 'Respondiste a la llamada. Eres aquel del que hablaban las piedras.');
  assert.match(RESOLUTION_TEXT.confirm(f), /aquella de la que/);
  assert.match(EPILOGUE_TEXT.mom[2](f), /entera/);
  assert.match(EPILOGUE_TEXT.momAfterTv[1](m), /hijo/);
});

test('zócalos: dieciocho, uno por Tablilla; las tres de Arceus junto al altar', () => {
  const ids = SOCKETS.map((s) => socketTablet(s.k)?.id);
  assert.equal(new Set(ids).size, 18);
  assert.ok(!ids.includes('BLANKPLATE'));
  assert.deepEqual(ARCEUS_SOCKET_KS.map((k) => socketTablet(k).id), ['EARTHPLATE', 'SPOOKYPLATE', 'LEGENDPLATE']);
  assert.equal(new Set(SOCKETS.map((s) => `${s.x},${s.y}`)).size, 18, 'sin zócalos repetidos');
});

// ───────────────────────────── revisión: canon, orden y reintento ─────────────────────────────

test('textos: ninguna línea del bloque habla de «altar» (DESCARTADO en la biblia) y la tele no contradice las detenciones', async () => {
  const texts = await import('../game/src/content/events/b21_texts.js');
  const st = GameState.create({ name: 'A', gender: 'F' });
  const all = [];
  const walk = (v) => {
    if (typeof v === 'string') all.push(v);
    else if (typeof v === 'function') { try { const r = v.length >= 2 ? v('X', 'Y') : v(st); if (typeof r === 'string') all.push(r); } catch { /* plantilla */ } }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  Object.values(texts).forEach(walk);
  assert.ok(all.length > 80, `pocos textos (${all.length})`);
  assert.deepEqual(all.filter((t) => /\baltar/i.test(t)), []); // «Saltar» no cuenta
  assert.ok(!EPILOGUE_TEXT.tv.some((t) => /resto de la dirección/.test(t)), 'Casia y Garrido ya están detenidos (B18)');
});

test('Salto: Zygarde toma la Forma 10 % ANTES de «Súbete. Esta forma…» y llega a Columna Lanza', async () => {
  const { nodoOrigenScript } = await import('../game/src/content/events/b21_salto.js');
  const st = playerState([striker()]);
  st.setZygardeForm('complete');
  st.setFlag(F.p10Restored);
  const ctx = stubCtx(st, { choices: [0] });
  const warps = [];
  const forms = [];
  ctx.warp = async (to, x, y) => { warps.push([to, x, y]); };
  const say = ctx.say;
  ctx.say = async (text, opts) => { forms.push([text, st.data.zygarde.form]); return say(text, opts); };
  await nodoOrigenScript(ctx);
  const ride = forms.find(([t]) => /^Súbete/.test(t));
  assert.ok(ride, 'falta «Súbete…»');
  assert.equal(ride[1], '10', 'Zygarde dice «Esta forma…» sin estar en la Forma 10 %');
  const iForm = forms.findIndex(([t]) => /Forma 10/.test(t));
  assert.ok(iForm >= 0 && iForm < forms.indexOf(ride), 'la transformación se narra antes de la frase');
  assert.deepEqual(warps, [['columna_lanza', 14, 31]]);
  assert.ok(st.flag(F.jumpDone));
});

test('«Reintentar fase» dentro del combate: la instantánea deshace la Megaevolución y devuelve el objeto inicial', async () => {
  const { battleSnapshot } = await import('../game/src/content/events/b21_arceus_logic.js');
  const mega = createPokemon(db, 'GARCHOMP', 80, { rng: () => 0.5, shiny: false, heldItem: 'GARCHOMPITE' });
  const megaForm = Object.entries(db.species.GARCHOMP.forms || {}).find(([, f]) => f.megaStone === 'GARCHOMPITE')?.[0];
  assert.ok(megaForm, 'Garchomp sin megaforma en los datos');
  const inBattle = { ...mega, form: Number(megaForm), premegaForm: 0, premegaAbility: mega.ability, heldItem: null, hp: 1 };
  const battle = { db, party1: [inBattle], party1starts: [0], initialItems: [['GARCHOMPITE']], bag: { POTION: 2 } };
  const snap = battleSnapshot(battle);
  assert.equal(snap.party[0].form, 0, 'sigue Megaevolucionado');
  assert.equal(snap.party[0].premegaForm, undefined);
  assert.equal(snap.party[0].heldItem, 'GARCHOMPITE', 'el objeto perdido en la fase anterior no vuelve');
  assert.equal(snap.party[0].hp, 1);
  assert.deepEqual(snap.bag, { POTION: 2 });
  assert.equal(inBattle.form, Number(megaForm), 'la instantánea no toca al Pokémon del combate');
});

// ───────────────────────────── epílogo ─────────────────────────────

test('huevo del inicial de Gael: su especie (gael_starter) y espera si el equipo está lleno', async () => {
  const st = playerState(Array.from({ length: 6 }, () => striker()));
  st.setVar('gael_starter', 'SOBBLE');
  assert.equal(gaelEggSpecies(st), 'SOBBLE');
  const ctx = stubCtx(st);
  assert.equal(await giveGaelEgg(ctx), false);
  assert.ok(st.flag(F.gaelEggWaiting) && !st.flag(F.gaelEggGiven));
  st.depositPokemon(5, 0);
  assert.equal(await giveGaelEgg(ctx), true);
  const egg = st.party[5];
  assert.equal(egg.egg, true);
  assert.equal(egg.species, 'SOBBLE');
  assert.ok(st.flag(F.gaelEggGiven) && !st.flag(F.gaelEggWaiting));
  assert.ok(!st.data.dex.caught.SOBBLE, 'el huevo no cuenta en la Pokédex hasta eclosionar');
  const fallback = GameState.create({ name: 'C' });
  fallback.setVar('starter', 'TURTWIG');
  assert.equal(gaelEggSpecies(fallback), 'LITTEN');
});
