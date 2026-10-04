import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB15Observer} from './e2e_campaign_b15_page.mjs';
import { RUTA11 } from '../game/src/content/maps/b15/layout_ruta11.js';
import { PASO, REFUGIO } from '../game/src/content/maps/b15/layout_paso.js';
import { SENDA, wrongTops, stairColumn, footRow } from '../game/src/content/maps/b15/layout_senda.js';
import { RUTA13 } from '../game/src/content/maps/b15/layout_ruta13.js';
import { BOREAL, OBSERVATORIO, TERRAZA, TALLERES } from '../game/src/content/maps/b15/layout_boreal.js';
import { LAGO, lakeToMap } from '../game/src/content/maps/b15/layout_lago.js';
import { ESCARCHA, MAR as MAR_BOREAL } from '../game/src/content/maps/b15/layout_escarcha.js';
import { LAKE, solveLake, runSteps, initialState } from '../game/src/content/events/b15_lago_logic.js';
import {collectDiveCells,collectWaterCells} from './e2e_campaign_cells.mjs?shore=5';
import {installB13Observer} from './e2e_campaign_b13_page.mjs?shore=5';
import {Driver as SeaDriver} from './e2e_b13_driver.mjs';
const RETRY=false;
const has = (s, f) => Boolean(s.flags[f]);
const need = (ok, msg) => (ok ? null : msg);
const AVOID_SENDA = wrongTops().map((w) => `${w.x},${w.y}`);

// El Driver común no acepta avoid; conserva aquí la ruta segura del E2E original.
export async function walkSenda(d, x, y, { onto = true, face = null, maxSteps = 600, stopWhen = null, watch = [], avoid = AVOID_SENDA } = {}) {
  const startMap = (await d.snapState()).map;
  for (let n = 0; n < maxSteps; n++) {
    let s = await d.snapState();
    if (s.busy || s.top !== 'MapScene') s = await d.settle({ watch });
    if (stopWhen?.(s) || s.map !== startMap) return s;
    const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
    if (done) {
      if (face) await d.turn(face);
      return s;
    }
    const route = await d.eval(([tx, ty, a, o]) => window.__b15.routeAvoid(tx, ty, a, { onto: o }), [x, y, avoid, onto]);
    if (!route?.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
    await d.step(route[0]);
  }
  throw new Error(`walkSenda(${x},${y}): demasiados pasos`);
}

// ───────────────────────────── Tramos ─────────────────────────────

async function ruta11(d) {
  await d.milestone('r11_llegada', (s) => need(s.map === 'ruta_11', `mapa ${s.map}`));
  const T = RUTA11.unbound.trigger;
  await d.walkTo(14, T.y - 1, { watch: [{ re: /Me mira como si no me hubiera visto nunca/, name: 'desvinculacion', delay: 200 }] });
  await d.expectSaid(/¡Escarcha!/, 'la llamada de la montañera');
  await d.milestone('desvinculacion', (s) => need(has(s, 'b15_desvinculacion') && has(s, 'b15_r11_llegada'), 'sin la desvinculación'));
  const C = RUTA11.cells;
  await d.walkTo(C.c089.x, C.c089.y);
  await d.settle();
  await d.milestone('c089', (s) => need(s.cells.includes('cell_ruta_11_1'), 'sin C089'));
  const L = RUTA11.ledge;
  await d.walkTo(L.rock.x, L.rock.y + 1, { face: 'up' });
  await d.interact();
  await d.walkTo(C.c090.x, C.c090.y);
  await d.settle();
  await d.milestone('c090', (s) => need(s.cells.includes('cell_ruta_11_2'), 'sin C090'));
  await d.walkTo(14, 0);
  await d.crossEdge('up', 'paso_del_norte');
}

async function paso(d) {
  await d.walkTo(14, PASO.arrival.y - 1);
  await d.expectSaid(/columna de luz clavada sobre la Cumbre Azur/, 'la llegada al collado');
  await d.milestone('paso_llegada', (s) => need(has(s, 'b15_paso_llegada'), 'sin llegada'));
  const door = PASO.refugio.door;
  await d.walkTo(door.x, door.y + 1, { face: 'up' });
  await d.exitTo('up', 'paso_refugio');
  const G = REFUGIO.guarda;
  await d.walkTo(G.x, G.y + 1, { face: 'up' });
  await d.interact();
  await d.expectSaid(/Tres garras/, 'la pista de la guarda');
  await d.milestone('refugio', (s) => need(has(s, 'b15_refugio_pista'), 'sin la pista del refugio'));
  await d.walkTo(REFUGIO.entry.x, REFUGIO.entry.y);
  await d.exitTo('down', 'paso_del_norte');
  const T = PASO.tecnicos;
  await d.fightTrainer('paso_del_norte', 'tecnico_paso', [T.german.x, T.german.y + 1], 'up');
  await d.fightTrainer('paso_del_norte', 'tecnica_paso', [T.candela.x - 1, T.candela.y], 'right');
  await d.milestone('tecnicos_genesis');
  await d.walkTo(0, PASO.west.y0 + 1);
  await d.crossEdge('left', 'ruta_12_senda_lazo');
}

async function senda(d) {
  await d.walkTo(SENDA.east.x - 3, 41);
  await d.expectSaid(/La Senda del Lazo sube por la ladera/, 'la llegada a la Senda');
  // Una escalera falsa de la primera cara: al coronarla, el lazo devuelve al principio.
  const x = stairColumn(0, 'O');
  await walkSenda(d, x, footRow(0));
  const L = SENDA.loopStart;
  for (let i = 0; i < 8; i++) {
    const s = await d.snapState();
    if (s.x === L.x && s.y === L.y) break;
    await d.step(8);
    await d.settle({ watch: [{ re: /el aire se dobla/, name: 'senda_lazo', delay: 150 }] });
  }
  await d.expectSaid(/estás otra vez junto a la piedra de los pastores/, 'la vuelta al principio');
  await d.milestone('senda_vuelta', (s) => need(Number(s.vars.b15_senda_vueltas) >= 1 && s.x === L.x && s.y === L.y, `vueltas ${s.vars.b15_senda_vueltas} en (${s.x},${s.y})`));
  // La pauta de los Larvitar: ninguna escalera falsa hasta el mirador.
  const M = SENDA.mirador;
  await walkSenda(d, M.stone.x, M.stone.y + 1, { face: 'up' });
  await d.expectSaid(/Desde el mirador, la columna de luz/, 'el mirador');
  await d.interact();
  const tyr = await d.eval(() => window.__b15.items('TYRANITARITE'));
  await d.milestone('senda_mirador', (s) => need(has(s, 'b15_senda_mirador') && tyr === 1, `mirador ${has(s, 'b15_senda_mirador')}, Tyranitarita ${tyr}`));
  // El tramo alto: un bucle que aún no se rompe.
  await walkSenda(d, SENDA.high.back.x, SENDA.high.y + 1);
  await d.step(8);
  await d.settle({ watch: [{ re: /el camino se pierde entre las nubes/, name: 'senda_alto', delay: 150 }] });
  await d.expectSaid(/como si no hubieras dado un paso/, 'la vuelta del tramo alto');
  await d.milestone('senda_alto', (s) => need(has(s, 'b15_senda_alto'), 'sin el tramo alto'));
  await walkSenda(d, SENDA.east.x, 41);
  await d.crossEdge('right', 'paso_del_norte');
  await d.walkTo(14, 0);
  await d.crossEdge('up', 'ruta_13');
}

async function ruta13(d) {
  await d.walkTo(14, RUTA13.arrival.y - 1);
  await d.settle();
  await d.milestone('r13_llegada', (s) => need(has(s, 'b15_r13_llegada'), 'sin llegada a la Ruta 13'));
  for (const [k, id] of [['c092', 'cell_ruta_13_2'], ['c091', 'cell_ruta_13_1']]) {
    const c = RUTA13.cells[k];
    await d.walkTo(c.x, c.y);
    await d.settle();
    await d.milestone(k, (s) => need(s.cells.includes(id), `sin ${k}`));
  }
  await d.walkTo(14, 0);
  await d.crossEdge('up', 'villa_boreal');
}

async function boreal(d) {
  await d.walkTo(21, BOREAL.npcs.llegada.y - 2, { watch: [{ re: /¡Bolita!/, name: 'boreal_bolita', delay: 200 }] });
  await d.expectSaid(/Desde hace días ni me mira/, 'el niño y su Swinub');
  await d.milestone('boreal_llegada', (s) => need(has(s, 'b15_boreal_llegada'), 'sin llegada a Villa Boreal'));
  const door = BOREAL.buildings.talleres.door;
  await d.walkTo(door.x, door.y + 1, { face: 'up' });
  await d.exitTo('up', 'boreal_talleres');
  const T = TALLERES;
  await d.walkTo(T.rosendo.x + 1, T.rosendo.y, { face: 'left' });
  await d.interact();
  await d.expectSaid(/no lo reconocí/, 'la historia de Rosendo');
  await d.walkTo(T.nieves.x - 1, T.nieves.y, { face: 'right' });
  await d.interact();
  await d.milestone('t13_nieves', (s) => need(has(s, 'b15_t13_rosendo') && has(s, 'b15_t13_nieves'), 'Nieves no va al lago'));
  await d.walkTo(T.entry.x, T.entry.y);
  await d.exitTo('down', 'villa_boreal');
  await d.walkTo(BOREAL.lakeExit.x, BOREAL.lakeExit.y0 + 1);
  await d.exitTo('right', 'boreal_lago');
}

/** Ejecuta un paso del solucionador del lago y comprueba la casilla con las reglas puras. */
async function lakeStep(d, st, expect) {
  if (st.act === 'mover') {
    await d.step(st.dir);
    await d.settle();
  } else {
    await d.turn(st.dir);
    await d.interact({ watch: st.act === 'sacar' ? [
      { re: /¡Una tabla!/, name: 't13_tabla', delay: 200 },
      { re: /Esta sí\. Esta la conozco\./, name: 'ceremonia_torre', delay: 200 },
    ] : [] });
  }
  if (!expect) return;
  const s = await d.snapState();
  if (s.map === 'boreal_lago' && (s.x !== expect[0] || s.y !== expect[1])) {
    throw new Error(`Lago: tras ${st.act} ${st.dir} en (${s.x},${s.y}), se esperaba (${expect})`);
  }
}

async function lago(d) {
  const start = lakeToMap(initialState(LAKE).x, initialState(LAKE).y);
  await d.walkTo(start[0], start[1]);
  await d.expectSaid(/Este es el Lago Viejo/, 'Nieves en el lago');
  // A propósito: subir, bajar y volver a subir por la misma columna hunde la placa (tercera pasada).
  for (const dir of [8, 2, 8]) await lakeStep(d, { act: 'mover', dir });
  await d.expectSaid(/La placa cede bajo tus pies/, 'la caída al agua');
  await d.milestone('lago_caida', (s) => need(Number(s.vars.b15_lago_caidas) >= 1 && s.x === LAGO.respawn.x && s.y === LAGO.respawn.y, `caídas ${s.vars.b15_lago_caidas} en (${s.x},${s.y})`));
  await d.walkTo(start[0], start[1]);
  const { steps } = solveLake();
  if (!steps) throw new Error('El lago no tiene solución');
  for (let i = 0; i < steps.length; i++) {
    const st = runSteps(LAKE, steps.slice(0, i + 1));
    await lakeStep(d, steps[i], steps[i].act === 'sacar' ? null : lakeToMap(st.x, st.y));
  }
  const froslass = await d.eval(() => window.__b15.items('FROSLASSITE'));
  await d.milestone('t13_resuelto', (s) => {
    if (!s.tablets.includes('ICICLEPLATE')) return `sin Tabla Helada (${s.tablets})`;
    if (!has(s, 'b15_torre') || !has(s, 'b15_froslassita') || froslass !== 1) return `Torre ${has(s, 'b15_torre')}, Froslassita ${froslass}`;
    return need(s.map === 'villa_boreal', `mapa ${s.map}`);
  });
}

async function gael(d) {
  const door = BOREAL.buildings.observatorio.door;
  await d.walkTo(door.x, door.y + 1, { face: 'up' });
  await d.exitTo('up', 'boreal_observatorio');
  const O = OBSERVATORIO;
  await d.walkTo(O.directora.x, O.directora.y + 1, { face: 'up' });
  await d.interact();
  await d.expectSaid(/Fundación Meridiano/, 'la directora del Observatorio');
  await d.walkTo(O.stairs.x - 1, O.stairs.y);
  const watch = [
    { re: /Si me ganas, es tuyo/, name: 'gael_reto', delay: 150 },
    { scene: 'BattleScene', name: 'gael_b5', delay: 4000 },
    { re: /A mí no me habla/, name: 'gael_n5', delay: 150 },
  ];
  await d.exitTo('right', 'boreal_observatorio_terraza', { watch });
  await d.settle({ watch });
  await d.expectSaid(/Si me ganas, es tuyo\. Si no… también\. Pero quiero saberlo\./, 'el reto de Gael');
  await d.expectSaid(/A mí no me habla\. Nunca me ha hablado\./, 'la frase de Gael');
  await d.expectSaid(/^Gracias, Gael\.$/, 'las gracias de Zygarde');
  const cores = await d.eval(() => window.__b15.cores());
  await d.milestone('n5', (s) => {
    if (!has(s, 'b15_n5') || !has(s, 'zyg_core_5') || !cores.includes('N5')) return `N5 ${cores}`;
    return need(!RETRY || s.lost.includes('b15_gael_b5'), 'no se simuló la derrota');
  });
  await d.walkTo(TERRAZA.cell.x, TERRAZA.cell.y);
  await d.settle();
  await d.milestone('c093', (s) => need(s.cells.includes('cell_boreal_1'), 'sin C093'));
  await d.walkTo(TERRAZA.stairs.x, TERRAZA.stairs.y - 1);
  await d.exitTo('down', 'boreal_observatorio');
  await d.walkTo(O.entry.x, O.entry.y);
  await d.exitTo('down', 'villa_boreal', { watch: [{ re: /Ese aro no es de ninguna tienda/, name: 'alerce_aro', delay: 150 }] });
  await d.expectSaid(/^Ese aro no es de ninguna tienda\.$/, 'la llamada de Alerce');
  await d.milestone('alerce', (s) => need(has(s, 'b15_alerce_aro'), 'sin la llamada de Alerce'));
}

async function gruta(d) {
  await d.walkTo(BOREAL.cave.arrival.x, BOREAL.cave.arrival.y, { face: 'right' });
  await d.exitTo('right', 'gruta_escarcha');
  await d.walkTo(ESCARCHA.entry.x, ESCARCHA.entry.y - 1);
  await d.settle();
  await d.expectSaid(/huele a hielo limpio/, 'la llegada a la Gruta Escarcha');
  await d.milestone('gruta_escarcha', (s) => need(has(s, 'b15_escarcha_llegada'), 'sin llegada'));
  await d.walkTo(ESCARCHA.entry.x, ESCARCHA.exit.y);
  await d.exitTo('down', 'villa_boreal');
  await d.milestone('gruta_vuelta', (s) => need(s.map === 'villa_boreal', `mapa ${s.map}`));
}

const STAGES = { ruta11, paso, senda, ruta13, boreal, lago, gael, gruta };

async function opcionalesNorte(d) {
  await collectWaterCells(d,['cell_escarcha_1']);
  await d.travel('villa_boreal');
  await installB13Observer(d.page);
  const swim=(x,y)=>SeaDriver.prototype.walkTo.call(d,x,y,{router:(tx,ty)=>d.eval(([x,y])=>window.__b13.routeMixed(x,y),[tx,ty])});
  await SeaDriver.prototype.startSwim.call(d,0,18);
  await swim(0,18);
  await d.crossEdge(4,'mar_boreal');
  await collectWaterCells(d,['cell_mar_boreal_1']);
  if(!(await d.snap()).surfing)await SeaDriver.prototype.startSwim.call(d,MAR_BOREAL.width-1,18);
  await swim(MAR_BOREAL.width-1,18);
  await d.crossEdge(6,'villa_boreal');
  const land=await d.eval(()=>window.__b13.shoreFor(20,18));
  if(!land)throw Error('No hay regreso a tierra en Villa Boreal');
  await swim(land.x,land.y);
  await d.settle();
}

// ───────────────────────────── Principal ─────────────────────────────


export async function runB15(d){await refreshDriver(d);await installB15Observer(d.page);await d.stages('B15',{
 regresosBuceo:async d=>collectDiveCells(d,['cell_caleta_2','cell_reserva_3','cell_garganta_5']),
 entrada:async d=>d.travel('ruta_11'),ruta11,paso,senda,ruta13,boreal,lago,gael,gruta,opcionalesNorte});}
