import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB14Observer} from './e2e_campaign_b14_page.mjs';
import {Driver as EchoDriver} from './e2e_b14_driver.mjs';
import {FONDO} from '../game/src/content/maps/b14/layout.js';
const RETRY=false;
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
  await d.milestone('draga', (s) => need(has(s, 'b14_draga_vista') && s.battles.some(b=>b.id==='b14_buceador_casimiro'), 'sin draga o sin Casimiro'));
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

  await d.interact({ watch: [{ re: /Soy Adela/, name: 'adela', delay: 200 }, { scene: 'BattleScene', name: 'adela_combate', delay: 3000 }] });
  await d.expectSaid(/planos de la corona del rey de Antea/, 'los planos de la corona');
  await d.expectSaid(/Al doctor le interesa/, 'la mención al doctor');
  await d.milestone('adela', (s) => {
    const all = ['b14_tecnico_rufino', 'b14_tecnica_eulalia', 'b14_jefa_adela'].filter((t) => !s.battles.some(b=>b.id===t));
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
  // Regreso al arrecife después de comprobar el ferri en la superficie.
  if ((await d.snap()).map === 'caleta_sonda') {
    await d.swimTo(4,28);
    await d.interact();
    await d.until(s=>s.map==='arrecife_eco'&&s.ready,{timeout:20000,what:'volver a bucear al arrecife'});
  }
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
  await d.milestone('fondo_celulas', (s) => need(cells.every(([key])=>s.cells.includes(key)), 'faltan células del Fondo'));
  await d.travel('arrecife_eco');
  await d.walkTo(24,19);
  await d.interact();
  await d.until(s=>s.map==='caleta_sonda'&&s.ready,{timeout:20000,what:'emerger después del Fondo'});
  await d.toLand();
}

const STAGES = { caleta, arrecife, sala1, sala2, sala3, sala4, fosa, regreso, fondo };

// ───────────────────────────── Principal ─────────────────────────────

function stageList() {
  if (ONLY) return [ONLY];
  const from = ORDER.indexOf(FROM);
  const to = TO ? ORDER.indexOf(TO) : ORDER.length - 1;
  return ORDER.slice(from, to + 1);
}


export async function runB14(d){
 await refreshDriver(d);await installB14Observer(d.page);
 for(const method of ['walkTo','caracola','sneakTo','swimTo','toLand'])d[method]=EchoDriver.prototype[method];
 await d.stages('B14',{preparacion:async d=>{await d.travel('caleta_tienda');await d.purchase({DIVEBALL:10,ULTRABALL:10});await d.travel('caleta_sonda');},caleta,arrecife,sala1,sala2,sala3,sala4,fosa,regreso,fondo});
 for(const method of ['walkTo','caracola','sneakTo','swimTo','toLand'])delete d[method];
}
