// Recorrido E2E del Bloque 14 — Pilar de los Ecos (P7) (docs/CAMPANA.md B14) en navegador real (Chrome headless +
// playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9; CAMPANA B14 «Entrada: b13_talasa,
// zyg_core_4, zyg_dive»): P1–P6 restaurados (F01–F06), capacidades de Zygarde hasta Buceo, N1–N4, 76 células (hasta
// C076), equipo alto y sin encuentros aleatorios. Tramos (cada uno puede arrancar solo con su URL):
//   caleta    Tobías, Carmela y el Core (Real de cobre) · nadar hasta el remolino del suroeste · bucear al arrecife
//   arrecife  llegada · Buceador Casimiro · la draga tapa la Puerta de Antea · campana de dragado: Rufino, Eulalia y la
//             jefa Adela (planos de la corona) · el cabezal apartado · Puerta de Antea
//   sala1     entrada · C082 · primera caracola (tutorial y primer eco) · estatua empujada en Antea → boca libre
//   sala2     equipo de Fausto · corriente del aljibe · Fausto en Antea: parada equivocada (el día vuelve a empezar),
//             redes → compuerta → caracola (despierta, Real de plata) · aljibe seco en el presente
//   sala3     caracola de tres capas · era primigenia · una embestida de la Bramaluna a propósito (vuelta a la caracola)
//             · brote y helecho con sigilo · raíz en Antea · C083 en la terraza del presente
//   sala4     C084 · corriente de la Fosa · brote y helecho con sigilo · raíz y aliviadero en Antea · boca en calma
//   fosa      Bramaluna eco: derrota real, cura en el manantial y victoria (captura desactivada) · núcleo:
//             Fragmento 7, verso VII, T13 · captura normal de Bramaluna real · corriente a Caleta Sonda
//   regreso   escena final en la playa (mareas, Fausto, ferri, el norte) · Fausto y Carmela · cartel del ferri
//   fondo     arrecife → Fondo del Mar del Sur por el este · C079, C080, C077, C078, C081 (con respiraderos)
// Capturas en tools/cache/screens/e2e_b14_<nn>_<hito>.png y transcripción en e2e_b14_dialogos.txt.
// Uso: node tools/e2e_b14.mjs [--base=http://localhost:8080] [--headed] [--from=<tramo>] [--only=<tramo>]
//      [--to=<tramo>] [--no-retry]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver } from './e2e_b14_driver.mjs';
import { FONDO } from '../game/src/content/maps/b14/layout.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const arg = (n, d) => (argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const BASE = arg('base', 'http://localhost:8080');
const RETRY = !argv.includes('--no-retry');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

/** Estado de entrada del bloque. */
const BASE_FLAGS = [
  'p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored', 'p6_restored',
  'zyg_10', 'zyg_50', 'zyg_core_2', 'zyg_core_3', 'zyg_core_4', 'zyg_dive', 'b13_talasa', 'b13_dive_resonance', 'b13_buceo_escena',
].join(',');
const AFTER = {
  caleta: 'b14_caleta_intro,b14_tobias_moneda',
  arrecife: 'b14_arrecife_llegada,b14_draga_vista,b14_jefa_vencida,b14_draga_apartada',
  sala1: 'b14_antea_entrada,b14_caracola_tuto,b14_primer_eco',
  sala2: 'b14_compuerta,b14_fausto_despierto,b14_fausto_visto',
  sala3: 'b14_helecho_3,b14_primigenia_vista,b14_bramaluna_vista',
  sala4: 'b14_helecho_4,b14_aliviadero',
};
const flagsUpTo = (stage) => {
  const keys = Object.keys(AFTER);
  const i = keys.indexOf(stage);
  return (i < 0 ? keys : keys.slice(0, i)).map((k) => AFTER[k]).join(',');
};
const entry = (stage, over) => new URLSearchParams({
  // Equipo muy por encima del tramo (~51): el piloto automático solo usa su primer movimiento de daño y, con 72, el
  // Magneton de Rufino o el equipo de Adela lo tumbaban a veces (el equilibrio de esos combates se valora a mano).
  scene: 'map', party: 'AZUMARILL:85,TOGEKISS:84,TORTERRA:84', fragments: '6', noenc: '1', time: '11', core: '1',
  zygarde: 'run,ram,terrain,climb,swim,detect,dive', zcells: '76', zcores: '4', ...over,
  flags: [BASE_FLAGS, flagsUpTo(stage), over?.flags].filter(Boolean).join(','),
});
const STARTS = {
  caleta: entry('caleta', { map: 'caleta_sonda', x: '12', y: '20', dir: '2' }),
  arrecife: entry('arrecife', { map: 'arrecife_eco', x: '22', y: '31', dir: '8' }),
  sala1: entry('sala1', { map: 'antea_1_presente', x: '16', y: '21', dir: '8' }),
  sala2: entry('sala2', { map: 'antea_2_presente', x: '16', y: '21', dir: '8', vars: 'b14_estatua:1' }),
  sala3: entry('sala3', { map: 'antea_3_presente', x: '16', y: '23', dir: '8', vars: 'b14_estatua:1,b14_fausto:3' }),
  sala4: entry('sala4', { map: 'antea_4_presente', x: '16', y: '23', dir: '8', vars: 'b14_estatua:1,b14_fausto:3' }),
  fosa: entry('fosa', { map: 'fosa_eco', x: '15', y: '23', dir: '8', vars: 'b14_estatua:1,b14_fausto:3' }),
  regreso: entry('fosa', { map: 'caleta_sonda', x: '4', y: '28', dir: '2', fragments: '7', flags: 'b14_fosa_entrada,b14_bramaluna_eco,p7_restored,b14_t13' }),
  fondo: entry('sala1', { map: 'arrecife_eco', x: '40', y: '17', dir: '6' }),
};
const ORDER = ['caleta', 'arrecife', 'sala1', 'sala2', 'sala3', 'sala4', 'fosa', 'regreso', 'fondo'];
/** Tramos que cargan su propia URL aunque se venga del anterior. */
const FRESH = new Set(['fondo']);
const FROM = arg('from', 'caleta');
const ONLY = arg('only', '');
const TO = arg('to', '');
if (!STARTS[FROM]) throw new Error(`--from desconocido: ${FROM} (${ORDER.join(', ')})`);

const has = (s, f) => Boolean(s.flags[f]);
const need = (cond, msg) => (cond ? null : msg);

// ───────────────────────────── Tramos ─────────────────────────────

async function caleta(d) {
  // La escena la lanza un vigilante en paralelo en cuanto el jugador está quieto en tierra.
  await d.until((s) => has(s, 'b14_caleta_intro') || s.busy || s.top !== 'MapScene', { timeout: 15000, what: 'la escena de la playa' });
  await d.settle({ watch: [{ re: /¡Otra vez la marea!/, name: 'caleta_tobias', delay: 150 }] });
  await d.expectSaid(/¡Otra vez la marea!/, 'a Tobías');
  await d.expectSaid(/A mí la marea me ha quitado a mi hijo/, 'a Carmela');
  const coins = await d.eval(() => window.__b14.items('RELICCOPPER'));
  await d.milestone('caleta_intro', (s) => need(has(s, 'b14_caleta_intro') && coins >= 1, `intro ${has(s, 'b14_caleta_intro')}, monedas ${coins}`));
  await d.swimTo(4, 28);
  await d.milestone('remolino', (s) => need(s.surfing && s.x === 4 && s.y === 28, `(${s.x},${s.y}) nadando ${s.surfing}`));
  await d.interact();
  await d.until((s) => s.map === 'arrecife_eco' && s.ready, { timeout: 15000, what: 'bucear al arrecife' });
  await d.settle();
}

async function arrecife(d) {
  await d.walkTo(22, 29);
  await d.milestone('arrecife', (s) => need(s.dive && s.map === 'arrecife_eco', 'sin burbuja de buceo'));
  await d.faceEvent('buceador_casimiro');
  await d.interact({ watch: [{ scene: 'BattleScene', name: 'buceador', delay: 2500 }] });
  await d.walkTo(22, 15, { face: 'up' });
  await d.interact();
  await d.expectSaid(/cabezal de una draga enorme/, 'la draga');
  await d.expectSaid(/se pierde hacia el oeste, hasta una campana/, 'la pista de la campana');
  await d.milestone('draga', (s) => need(has(s, 'b14_draga_vista') && s.battles.includes('b14_buceador_casimiro'), 'sin draga o sin Casimiro'));
  // La campana de dragado de Genesis.
  await d.walkTo(8, 13, { stopWhen: (s) => s.map === 'arrecife_campana' });
  await d.until((s) => s.map === 'arrecife_campana' && s.ready, { timeout: 15000, what: 'entrar en la campana' });
  await d.settle();
  await d.milestone('campana');
  await d.faceEvent('tecnico_rufino');
  await d.interact();
  await d.faceEvent('tecnica_eulalia');
  await d.interact();
  await d.walkTo(8, 4, { face: 'up' });
  // El piloto automático no usa objetos: se cura al equipo antes de la jefa (el jugador usaría pociones).
  await d.eval(() => window.__b14.heal());
  await d.interact({ watch: [{ re: /Soy Adela/, name: 'adela', delay: 200 }, { scene: 'BattleScene', name: 'adela_combate', delay: 3000 }] });
  await d.expectSaid(/planos de la corona del rey de Antea/, 'los planos de la corona');
  await d.expectSaid(/Al doctor le interesa/, 'la mención al doctor');
  await d.milestone('adela', (s) => {
    const all = ['b14_tecnico_rufino', 'b14_tecnica_eulalia', 'b14_jefa_adela'].filter((t) => !s.battles.includes(t));
    return all.length ? `faltan combates: ${all}` : need(has(s, 'b14_jefa_vencida') && has(s, 'b14_draga_apartada'), 'la draga sigue en la puerta');
  });
  await d.walkTo(8, 10);
  await d.exitTo('down', 'arrecife_eco');
  const aside = await d.eval(() => [window.__b14.eventAlive('draga_cabezal'), window.__b14.eventAlive('draga_apartada')]);
  await d.walkTo(22, 14);
  await d.milestone('puerta_antea', () => need(!aside[0] && aside[1], `cabezal ${aside}`));
  await d.exitTo('up', 'antea_base');
  await d.milestone('p7_piso1_ruinas', (s) => need(s.map === 'antea_base' && !s.dive, 'sin primer piso de ruinas'));
  // Se baja y se vuelve a subir antes de resolver ningún puzzle.
  await d.walkTo(13, 21);
  await d.exitTo('down', 'arrecife_eco');
  await d.walkTo(22, 14);
  await d.exitTo('up', 'antea_base');
  await d.walkTo(13, 6);
  await d.exitTo('up', 'antea_1_presente');
  await d.milestone('p7_piso2_capas', (s) => need(s.map === 'antea_1_presente', 'sin segundo piso'));
}

async function sala1(d) {
  await d.walkTo(16, 17);
  await d.milestone('c082', (s) => need(s.cells.includes('cell_ecos_1'), 'sin C082'));
  await d.walkTo(16, 5, { face: 'up' });
  await d.interact();
  await d.expectSaid(/estatua caída tapa la boca/, 'la estatua caída');
  await d.caracola({ x: 16, y: 14, dir: 8 }, 'Golpearla', 'antea_1_antea');
  await d.expectSaid(/Es un eco de la ciudad/, 'el primer eco');
  await d.milestone('antea_s1', (s) => need(has(s, 'b14_primer_eco'), 'sin primer eco'));
  await d.walkTo(15, 6, { face: 'left' });
  await d.interact({ watch: [{ re: /Empujas con el hombro/, name: 'estatua', delay: 100 }] });
  await d.milestone('estatua_empujada', (s) => need(Number(s.vars.b14_estatua) === 1, `estatua ${s.vars.b14_estatua}`));
  await d.caracola({ x: 16, y: 14, dir: 8 }, 'Golpearla', 'antea_1_presente');
  const gone = await d.eval(() => !window.__b14.eventAlive('estatua_caida_boca') && window.__b14.eventAlive('estatua_caida_hornacina'));
  await d.walkTo(16, 5);
  await d.milestone('boca_libre', () => need(gone, 'la estatua sigue en la boca'));
  await d.exitTo('up', 'antea_2_presente');
}

async function sala2(d) {
  await d.faceEvent('equipo_fausto');
  await d.interact();
  await d.expectSaid(/«FAUSTO»/, 'el equipo de Fausto');
  // La corriente del aljibe empuja hacia atrás mientras la compuerta de Antea siga abierta.
  await d.walkTo(16, 12);
  await d.step(8);
  await d.settle();
  await d.expectSaid(/Una corriente violenta sale del aljibe/, 'la corriente del aljibe');
  await d.milestone('aljibe_corriente', (s) => need(s.y > 12, `no empujó: (${s.x},${s.y})`));
  await d.caracola({ x: 8, y: 16, dir: 2 }, 'Golpearla', 'antea_2_antea');
  // Fausto: primero una parada fuera de orden (el día vuelve a empezar) y luego su rutina.
  await d.faceEvent('fausto_eco');
  d.want = ['La compuerta del aljibe'];
  await d.interact();
  await d.expectSaid(/Juraría que esto ya te lo he dicho/, 'Fausto repite su día');
  await d.expectSaid(/Eso no toca ahora/, 'el día que vuelve a empezar');
  await d.milestone('fausto_reinicio', (s) => need(Number(s.vars.b14_fausto || 0) === 0, `parada ${s.vars.b14_fausto}`));
  for (const [label, stop] of [['El puesto de redes', 1], ['La compuerta del aljibe', 2], ['La caracola del muelle', 3]]) {
    await d.faceEvent('fausto_eco');
    d.want = [label];
    await d.interact({ watch: [{ re: /Giráis la rueda/, name: 'compuerta', delay: 100 }] });
    const s = await d.snapState();
    if (Number(s.vars.b14_fausto) !== stop) throw new Error(`Fausto no llegó a la parada ${stop} (${label}): ${s.vars.b14_fausto}`);
  }
  await d.expectSaid(/Nos vemos en la caleta/, 'la despedida de Fausto');
  const silver = await d.eval(() => window.__b14.items('RELICSILVER'));
  await d.milestone('fausto_despierto', (s) => need(has(s, 'b14_fausto_despierto') && has(s, 'b14_compuerta') && silver === 1, `despierto ${has(s, 'b14_fausto_despierto')}, compuerta ${has(s, 'b14_compuerta')}, plata ${silver}`));
  await d.caracola({ x: 8, y: 16, dir: 2 }, 'Golpearla', 'antea_2_presente');
  await d.walkTo(16, 10);
  await d.settle();
  await d.expectSaid(/El aljibe está seco/, 'el aljibe seco');
  await d.walkTo(16, 5);
  await d.milestone('aljibe_seco');
  await d.exitTo('up', 'antea_3_presente');
}

/** Se deja ver por la Bramaluna a propósito (casillas bajo su parada mirando al sur). */
async function provokeCharge(d, cells) {
  const before = Number((await d.snapState()).vars.b14_bramaluna_pillado || 0);
  const watch = [{ re: /La Bramaluna ruge/, name: 'bramaluna_embiste', delay: 150 }];
  for (const [x, y] of cells) {
    try {
      await d.walkTo(x, y, { watch, stopWhen: (s) => Number(s.vars.b14_bramaluna_pillado || 0) > before });
      break;
    } catch (err) {
      if (!/Sin ruta/.test(err.message)) throw err;
    }
  }
  await d.until((s) => Number(s.vars.b14_bramaluna_pillado || 0) > before || s.busy, { timeout: 30000, what: 'la embestida' });
  await d.settle({ watch });
}

async function sala3(d) {
  await d.caracola({ x: 16, y: 19, dir: 8 }, 'La era primigenia', 'antea_3_primigenia');
  await d.expectSaid(/Helechos gigantes y aire tibio/, 'la llegada a la era primigenia');
  await d.milestone('primigenia_s3', () => null);
  await provokeCharge(d, [[21, 17], [21, 18], [12, 17], [12, 18]]);
  await d.expectSaid(/el eco te devuelve junto a la caracola/, 'la vuelta a la caracola');
  await d.milestone('embestida', (s) => need(s.map === 'antea_3_primigenia' && s.x === 16 && s.y === 19, `tras la embestida en ${s.map} (${s.x},${s.y})`));
  const c1 = await d.sneakTo([[26, 19]], { face: 6 });
  await d.interact();
  const c2 = await d.sneakTo([[9, 14]], { face: 8 });
  await d.interact();
  await d.milestone('helecho_s3', (s) => need(has(s, 'b14_helecho_3'), `sin helecho (embestidas ${c1 + c2})`));
  await d.sneakTo([[16, 19]], { face: 8 });
  await d.caracola({ x: 16, y: 19, dir: 8 }, 'Antea', 'antea_3_antea');
  await d.climb(9, 13, 'up', [9, 9]);
  await d.expectSaid(/Una raíz gruesa como un tronco/, 'la raíz viva');
  await d.milestone('raiz_s3');
  await d.caracola({ x: 24, y: 8, dir: 8 }, 'El presente', 'antea_3_presente');
  await d.walkTo(6, 6);
  await d.settle();
  await d.milestone('c083', (s) => need(s.cells.includes('cell_ecos_2'), 'sin C083'));
  await d.walkTo(16, 5);
  await d.exitTo('up', 'antea_4_presente');
}

async function sala4(d) {
  await d.walkTo(16, 10);
  await d.settle();
  await d.milestone('c084', (s) => need(s.cells.includes('cell_ecos_3'), 'sin C084'));
  await d.walkTo(16, 7);
  await d.step(8);
  await d.settle();
  await d.expectSaid(/De la boca de la Fosa sale una corriente/, 'la corriente de la Fosa');
  await d.milestone('fosa_corriente', (s) => need(s.y > 7, `no empujó: (${s.x},${s.y})`));
  await d.caracola({ x: 16, y: 20, dir: 8 }, 'La era primigenia', 'antea_4_primigenia');
  const c1 = await d.sneakTo([[25, 13]], { face: 6 });
  await d.interact();
  const c2 = await d.sneakTo([[7, 13]], { face: 8 });
  await d.interact();
  await d.milestone('helecho_s4', (s) => need(has(s, 'b14_helecho_4'), `sin helecho (embestidas ${c1 + c2})`));
  await d.sneakTo([[16, 20]], { face: 8 });
  await d.caracola({ x: 16, y: 20, dir: 8 }, 'Antea', 'antea_4_antea');
  await d.climb(7, 12, 'up', [7, 8]);
  await d.walkTo(6, 6, { face: 'left' });
  await d.interact();
  await d.expectSaid(/el rumor del agua que corría hacia la Fosa se apaga/, 'el aliviadero cerrado');
  await d.milestone('aliviadero', (s) => need(has(s, 'b14_aliviadero'), 'aliviadero abierto'));
  await d.climb(7, 8, 'down', [7, 12]);
  await d.caracola({ x: 16, y: 20, dir: 8 }, 'El presente', 'antea_4_presente');
  const calm = await d.eval(() => !window.__b14.eventAlive('corriente_fosa_0') && !window.__b14.eventAlive('corriente_fosa_3'));
  await d.walkTo(16, 5);
  await d.milestone('boca_en_calma', () => need(calm, 'la corriente sigue'));
  await d.exitTo('up', 'fosa_eco');
}

async function fosa(d) {
  await d.settle();
  const inFosa = (s) => s.map !== 'fosa_eco' || has(s, 'b14_bramaluna_eco');
  if (RETRY) {
    const moneyBefore = await d.eval(() => window.__b14.money());
    await d.eval(() => window.__b14.realLossTeam());
    await d.walkTo(15, 16, { stopWhen: inFosa });
    await d.settle();
    await d.expectSaid(/Has tenido que retirarte/, 'la derrota sin pérdida');
    await d.expectSaid(/Magikarp se debilitó/, 'el debilitamiento real del equipo de prueba');
    const loss = await d.eval(() => ({ battle: window.__b14.battles.at(-1), health: window.__b14.health(), money: window.__b14.money() }));
    await d.milestone('eco_derrota', (s) => need(s.map === 'antea_4_presente' && s.x === 21 && s.y === 11 && loss.battle.outcome === 'lose' && Number.isInteger(loss.battle.turns) && loss.money === moneyBefore && loss.health.every((p) => p.hp === p.maxHP), `tras perder en ${s.map} (${s.x},${s.y}): ${JSON.stringify(loss)}`));
    await d.eval(() => window.__b14.restoreTeam());
    await d.walkTo(16, 5);
    await d.exitTo('up', 'fosa_eco');
  }
  await d.walkTo(15, 16, { stopWhen: inFosa, watch: [{ re: /se yergue en su nido/, name: 'bramaluna_eco', delay: 200 }, { scene: 'BattleScene', name: 'combate_eco', delay: 5000 }] });
  await d.settle();
  await d.expectSaid(/se deshace en ondas verdes/, 'la victoria sobre el eco');
  const echo = await d.eval(() => window.__b14.battles.filter((b) => b.tag === 'bramaluna_eco').pop());
  await d.milestone('eco_vencido', (s) => {
    if (!has(s, 'b14_bramaluna_eco')) return 'el eco sigue en pie';
    if (!echo || echo.level !== 56 || !echo.alpha || echo.ability !== 'PROTOSYNTHESIS' || echo.item !== 'BOOSTERENERGY') return `combate del eco: ${JSON.stringify(echo)}`;
    if (echo.canRun !== false || echo.catchRule?.allowed !== false || !/Es un eco: no hay nada que atrapar/.test(echo.catchRule?.reason || '')) return `reglas del eco: ${JSON.stringify(echo)}`;
    return null;
  });
  await d.walkTo(15, 13, { face: 'up' });
  await d.interact({ watch: [{ scene: 'VerseScene', name: 'verso_vii', delay: 1500 }] });
  await d.expectSaid(/La decimotercera tabla espera en el hielo más viejo/, 'la pista T13');
  await d.expectSaid(/ya no es un eco/, 'la Bramaluna real');
  const story = await d.eval(() => ({ fragments: window.__b14.fragments(), t13: window.__b14.hasClue('T13') }));
  await d.milestone('p7_restaurado', (s) => need(has(s, 'p7_restored') && has(s, 'b14_t13') && story.fragments.includes('F07') && story.t13, `P7 ${has(s, 'p7_restored')}, ${JSON.stringify(story)}`));
  await d.faceEvent('bramaluna_real');
  await d.interact({ watch: [{ scene: 'BattleScene', name: 'bramaluna_real', delay: 4000 }] });
  const real = await d.eval(() => window.__b14.battles.filter((b) => b.tag === 'bramaluna_real').pop());
  const captured = await d.eval(() => window.__b14.captured().includes('ROARINGMOON'));
  await d.milestone('bramaluna_real', () => need(real && real.level === 58 && real.alpha && !real.catchRule && real.outcome === 'caught' && captured, `captura real: ${JSON.stringify(real)}`));
  await d.walkTo(24, 19);
  await d.interact();
  await d.until((s) => s.map === 'caleta_sonda' && s.ready, { timeout: 15000, what: 'subir a Caleta Sonda' });
  await d.settle();
}

async function regreso(d) {
  await d.toLand();
  await d.settle({ watch: [{ re: /ferri vuelve a salir/, name: 'ferri', delay: 150 }] });
  await d.expectSaid(/ha subido cuando tocaba/, 'las mareas a su hora');
  await d.expectSaid(/Lo has arreglado, ¿verdad\?/, 'a Fausto de vuelta');
  await d.expectSaid(/el hielo raro del norte se ha retirado/, 'el norte (el marinero)');
  await d.milestone('caleta_final', (s) => need(has(s, 'b14_caleta_final'), 'sin escena final'));
  await d.faceEvent('b14_fausto');
  await d.interact();
  await d.expectSaid(/La marea ya no suena a voces/, 'a Fausto en la playa');
  await d.faceEvent('cartel_ferri_caleta');
  await d.interact();
  await d.expectSaid(/Servicio reanudado/, 'el cartel del ferri');
  await d.milestone('ferri');
}

async function fondo(d) {
  await d.walkTo(43, 17);
  await d.exitTo('right', 'fondo_mar_sur');
  await d.milestone('fondo', (s) => need(s.dive, 'sin burbuja'));
  const C = FONDO.cells;
  const cells = ['fondo_sur_3', 'fondo_sur_4', 'fondo_sur_1', 'fondo_sur_2', 'fondo_sur_5'].map((k) => [`cell_${k}`, C[k].x, C[k].y]);
  for (const [key, x, y] of cells) {
    await d.walkTo(x, y, { maxSteps: 1500 });
    await d.settle();
    const s = await d.snapState();
    if (!s.cells.includes(key)) throw new Error(`Sin ${key} en (${x},${y})`);
    console.log(`  · ${key}`);
  }
  await d.milestone('fondo_celulas', (s) => need(s.cells.length >= 81, `${s.cells.length} células`));
}

const STAGES = { caleta, arrecife, sala1, sala2, sala3, sala4, fosa, regreso, fondo };

// ───────────────────────────── Principal ─────────────────────────────

function stageList() {
  if (ONLY) return [ONLY];
  const from = ORDER.indexOf(FROM);
  const to = TO ? ORDER.indexOf(TO) : ORDER.length - 1;
  return ORDER.slice(from, to + 1);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME, headless: !argv.includes('--headed'),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const errors = [];
  const t0 = Date.now();
  let failed = null;
  let d = null;
  const transcript = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[error] ${msg.text()}`); });
    page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });
    d = new Driver(page, errors, {
      outDir: OUT, root: ROOT, captureReal: true,
      // Azumarill con Carantoña delante: el piloto automático usa siempre el primer movimiento de daño.
      leadMoves: ['PLAYROUGH', 'AQUATAIL', 'ICEPUNCH', 'SUPERPOWER'],
    });
    try {
      let loaded = false;
      for (const name of stageList()) {
        if (!STAGES[name]) throw new Error(`Tramo desconocido: ${name}`);
        if (!loaded || FRESH.has(name)) {
          if (loaded) transcript.push(...(await d.log().catch(() => [])));
          await d.goto(`${BASE}/?${STARTS[name].toString()}&debug`);
          loaded = true;
        }
        console.log(`— ${name}`);
        await STAGES[name](d);
      }
      const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
      if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
    } catch (err) {
      failed = err;
      await d.shot('fallo').catch(() => {});
    }
    transcript.push(...(await d.log().catch(() => [])));
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'e2e_b14_dialogos.txt'), transcript.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d?.milestones.join(' → ') || '—'} (${secs} s; ${transcript.length} diálogos en tools/cache/screens/e2e_b14_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 14 completo de principio a fin.');
  }
}

await main();
