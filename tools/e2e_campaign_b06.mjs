import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB06Observer} from './e2e_campaign_b06_page.mjs';
import { P3_VERTICAL as P } from '../game/src/content/maps/b06/layout.js';
const RETRY=false;
const DIR = { down: 2, left: 4, right: 6, up: 8 };
async function ruta5(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'ruta_5' && s.ready, { timeout: 30000, what: 'la Ruta 5' });
  await d.settle();
  await d.milestone('ruta_5', (s) => (s.cells.length >= 24 && s.abilities.ram ? null : `células ${s.cells.length}, ram ${s.abilities.ram}`));
  const watch = [{ scene: 'BattleScene', name: 'ruta5_entrenador', delay: 3500 }];
  await d.walkTo(30, 15, { face: 'right', watch });
  await d.interact({ watch });
  await d.expectSaid(/¿Quieres que Zygarde embista\?/, 'la pregunta de la Embestida');
  if (await d.eval(() => window.__b06.eventAlive('troncos_paso_0') || window.__b06.eventAlive('troncos_paso_1'))) throw new Error('Los troncos del paso siguen en pie');
  await d.milestone('troncos_rotos');
  // C028: tronco del rincón norte y la célula.
  await d.walkTo(41, 11, { face: 'up', watch });
  await d.interact();
  await d.walkTo(41, 5, { watch });
  await d.settle();
  await d.milestone('c028', (s) => (s.cells.includes('cell_ruta_5_1') ? null : 'sin C028'));
  await d.walkTo(59, 14, { watch });
  await d.crossEdge('right', 'meseta_impulso');
  await d.settle();
}

async function meseta(d) {
  await d.walkTo(3, 23, { watch: [{ re: /aerogeneradores del Parque están quietos/, name: 'meseta_llegada', delay: 200 }] });
  await d.settle({ watch: [{ re: /aerogeneradores del Parque están quietos/, name: 'meseta_llegada', delay: 200 }] });
  await d.expectSaid(/aerogeneradores del Parque están quietos/, 'la llegada a la Meseta');
  const watch = [
    { re: /Tú también lo has notado/, name: 'gael_puerta', delay: 300 },
    { scene: 'BattleScene', name: 'combate_doble', delay: 4500 },
  ];
  await d.walkTo(17, 21, { watch, stopWhen: (s) => s.flags.b06_doble_ganado });
  await d.settle({ watch });
  await d.expectSaid(/Procedimiento de contención/, 'el reto de los técnicos');
  await d.expectSaid(/No ha estado mal/, 'Gael tras el combate doble');
  await d.milestone('doble_ganado', (s) => (s.flags.b06_doble_ganado ? null : 'sin b06_doble_ganado'));
  await d.walkTo(17, 15, { face: 'up' });
  await d.step(8);
  await d.until((s) => s.map === 'parque_eolico' && s.ready, { timeout: 15000, what: 'entrar al Parque' });
  await d.settle();
}

async function parque(d) {
  if((await d.snap()).map!=='parque_eolico')await d.travel('parque_eolico');
  const watch = [
    { scene: 'BattleScene', name: 'parque_tecnico', delay: 3500 },
    { re: /Somos Genesis/, name: 'casia_genesis', delay: 300 },
  ];
  await d.milestone('parque_almacen');
  if((await d.snap()).x<26) {
    await d.walkTo(12, 5, { face: 'up', watch });
    await d.step(8); // empuja la puerta de servicio
  }
  await d.until((s) => s.map === 'parque_eolico' && s.x === 35 && s.y === 13, { timeout: 15000, what: 'sala del Colector' });
  await d.settle({ watch });
  await d.walkTo(35, 11, { watch, stopWhen: (s) => s.flags.b06_casia_presentada || s.lost.includes('b06_casia') });
  await d.settle({ watch });
  await d.expectSaid(/No somos un consorcio\. Somos Genesis\./, 'la presentación de Casia');
  await d.expectSaid(/¿Quién votó a Dialga\?/, 'la doctrina de Genesis');
  for(let tries=0;!(await d.snap()).flags.b06_colector_roto&&tries<8;tries++)await d.talk('casia',{watch});
  if (RETRY) {
    // Derrota simulada: vuelve a la puerta del Colector con el equipo curado y Casia sigue ahí.
    await d.milestone('casia_derrota', (s) => (s.map === 'parque_eolico' && s.x === 35 && s.y === 13 && !s.flags.b06_colector_roto ? null : `tras perder: ${s.map} (${s.x},${s.y})`));
    await d.walkTo(35, 11, { watch, stopWhen: (s) => s.flags.b06_colector_roto });
    await d.settle({ watch });
    await d.expectSaid(/Otra medición/, 'el reintento con Casia');
  }
  await d.expectSaid(/Solo lo estábamos escuchando/, 'la retirada de Casia');
  await d.expectSaid(/Ahora recuerdo cómo se pisa la tierra blanda/, 'la fusión de N2');
  await d.expectSaid(/Cada punto verde es una célula/, 'Gael ante las pantallas');
  await d.milestone('colector_roto', (s) => {
    if (!s.flags.b06_colector_roto || !s.flags.zyg_core_2) return 'sin Colector roto o sin N2';
    if (!['cell_colector_1', 'cell_colector_2', 'cell_colector_3', 'cell_colector_4'].every((c) => s.cells.includes(c))) return 'faltan C029–C032';
    if (!s.abilities.terrain) return 'sin Terreno complicado';
    return s.flags.b06_gael_pantallas ? null : 'Gael no ha visto las pantallas';
  });
  // Salida del Parque: hueco de la sala → almacén → puerta sur.
  await d.walkTo(35, 13);
  await d.step(2);
  await d.until((s) => s.x === 12 && s.y === 5 && s.ready, { timeout: 15000, what: 'volver al almacén' });
  await d.settle();
  await d.walkTo(10, 18);
  await d.step(2);
  await d.press('ArrowDown', 400);
  await d.until((s) => s.map === 'meseta_impulso' && s.ready, { timeout: 15000, what: 'salir a la Meseta' });
  await d.settle();
}

async function anillo(d) {
  await d.walkTo(39, 10, { stopWhen: (s) => s.map === 'anillo_vientos_base' });
  if ((await d.snapState()).map !== 'anillo_vientos_base') await d.step(8);
  await d.until((s) => s.map === 'anillo_vientos_base' && s.ready, { timeout: 15000, what: 'entrar en la base' });
  await d.settle();
  await d.milestone('anillo_base');
  for (const [x, y, face] of [[7, 16, 'right'], [19, 14, 'left']]) {
    await d.walkTo(x, y, { face });
    await d.interact();
  }
  await d.milestone('entrenadores_piso1');
  await d.walkTo(P.up.x, P.up.y + 1);
  await d.step(8);
  await d.until((s) => s.map === 'galerias_soplo' && s.ready, { timeout: 15000, what: 'subir a las galerías del piso2' });
  await d.settle();
}

/** Recorre una lista de acciones del solucionador ('up', 'montar', …) desde la posición actual. */
async function ride(d, actions) {
  for (const a of actions) {
    if (a === 'montar') await d.toggleMount(true);
    else if (a === 'bajar') await d.toggleMount(false);
    else await d.step(DIR[a]);
    await d.settle();
  }
}

async function galerias(d) {
  await d.milestone('flechas');
  // (a) Flechas: bajar al pasillo de la izquierda, dejarse llevar hasta la isla NO, coger C033, río al rellano,
  // montar y remontar la rampa de fuerza 1 hasta la salida.
  await d.walkTo(9, 28);
  await ride(d, ['up']); // la ráfaga lleva al oeste y luego al norte
  let s = await d.snapState();
  if (!(s.x === 4 && s.y === 23)) throw new Error(`Las Flechas no han llevado a la isla NO: (${s.x},${s.y})`);
  await d.walkTo(6, 21);
  await d.settle();
  await d.milestone('c033', (st) => (st.cells.includes('cell_impulso_1') ? null : 'sin C033'));
  await ride(d, ['right']);
  s = await d.snapState();
  if (!(s.x === 12 && s.y === 21)) throw new Error(`El río no ha llevado al rellano: (${s.x},${s.y})`);
  // A pie, la rampa devuelve (pista narrada); montado, se remonta.
  await ride(d, ['up']);
  await d.expectSaid(/Contra este viento no se avanza a pie/, 'la pista de montar');
  await ride(d, ['montar', 'up', 'up', 'up', 'up']);
  await d.until((st) => st.y <= 17, { timeout: 8000, what: 'salir de las Flechas' });
  await d.milestone('flechas_superada');
  // (b) Remolino: probar el bucle, girar las dos veletas y dejarse llevar hasta el rellano.
  await d.walkTo(8, 9);
  await ride(d, ['down']);
  await d.expectSaid(/da vueltas sobre sí mismo/, 'la pista del bucle');
  await d.walkTo(14, 11, { face: 'left' });
  for (let i = 0; i < 3; i++) await d.interact();
  await d.walkTo(9, 8, { face: 'left' });
  await d.interact();
  const v = (await d.snapState()).vars;
  if ((v.b06_veleta_remolino_a % 4) !== 3 || (v.b06_veleta_remolino_b % 4) !== 1) throw new Error(`Veletas mal giradas: ${JSON.stringify(v)}`);
  await d.milestone('veletas');
  await d.walkTo(8, 9);
  await ride(d, ['down']);
  s = await d.snapState();
  if (!(s.x === 7 && s.y === 5)) throw new Error(`El remolino no ha llevado al rellano: (${s.x},${s.y})`);
  await d.milestone('remolino_superado');
  await ride(d, ['up']);
  await d.until((st) => st.map === 'anillo_vientos' && st.ready, { timeout: 15000, what: 'subir a la Sala' });
  await d.settle();
}

async function sala(d) {
  await d.milestone('sala_llegada', (s) => (s.x === 24 && s.y === 17 ? null : `llegada (${s.x},${s.y})`));
  await d.toggleMount(false);
  // Carril sur (fuerza 2, al oeste) hasta el pasillo del oeste.
  await ride(d, ['up']);
  let s = await d.snapState();
  if (!(s.x === 13 && s.y === 16)) throw new Error(`El carril sur no ha llevado al oeste: (${s.x},${s.y})`);
  // Norte: remontar montado el carril del oeste y pasar por C034.
  await d.walkTo(13, 12);
  await ride(d, ['montar', 'up', 'up', 'up', 'up', 'up']);
  // A pie por la cornisa norte: montado se avanza más deprisa y un paso de más cae en el río de la campana Este.
  await d.toggleMount(false);
  await d.walkTo(21, 7, { face: 'up' });
  s = await d.snapState();
  if (!s.cells.includes('cell_impulso_2')) throw new Error('Sin C034 camino de la campana Norte');
  await d.hold('KeyZ', 1100); // golpe largo
  await d.settle();
  await d.expectSaid(/tañido largo/, 'el golpe largo');
  // Este: el río del norte lleva hasta la campana del este.
  await ride(d, ['right']);
  s = await d.snapState();
  if (!(s.x === 29 && s.y === 12)) throw new Error(`El río norte no ha llevado a la campana Este: (${s.x},${s.y})`);
  await d.turn('right');
  await d.interact();
  await d.expectSaid(/golpe corto/, 'el golpe corto');
  // Oeste: bajar al carril sur y dejarse llevar; subir a la campana del oeste.
  await d.walkTo(29, 15);
  await ride(d, ['down']);
  await d.walkTo(13, 14, { face: 'left' });
  await d.interact({ watch: [{ re: /suenan a la vez/, name: 'campanas', delay: 200 }] });
  await d.settle();
  await d.milestone('campanas_resueltas', (st) => (st.flags.b06_campanas && !st.flags.b06_abril_vencida ? null : 'sin campanas o Guardiana vencida antes del puzzle'));
}

async function nucleo(d) {
  await d.toggleMount(false);
  if((await d.snap()).map!=='anillo_vientos_nucleo') {
    await d.walkTo(21, 11, { face: 'up', watch: [] });
    await d.interact();
  }
  await d.until((s) => s.map === 'anillo_vientos_nucleo' && s.ready, { timeout: 15000, what: 'subir al tercer piso' });
  await d.settle();
  await d.expectSaid(/Cinco años aquí arriba y nunca las había oído sonar/, 'Abril oye las campanas');
  const watch = [{ re: /Termina rápido/, name: 'abril_reto', delay: 300 }, { scene: 'BattleScene', name: 'combate_abril', delay: 4500 }];
  for (let i = 0; i < 8 && !(await d.snap()).flags.b06_abril_vencida; i++) {
    await d.walkTo(P.guardian.x, P.guardian.y + 2);
    await d.step(8);
    await d.settle({ watch });
    if (i === 0 && RETRY) {
      await d.milestone('abril_derrota', (s) => (!s.flags.b06_abril_vencida && s.map === 'anillo_vientos_nucleo' && s.x === P.retry.x && s.y === P.retry.y ? null : `tras perder: ${s.map} (${s.x},${s.y})`));
    }
  }
  await d.expectSaid(/Cinco años vigilando una piedra que no hace nada/, 'Abril y su tedio');
  await d.expectSaid(/Termina rápido, que se me enfría la comida/, 'el reto de Abril');
  await d.milestone('abril_vencida', (s) => (s.flags.b06_abril_vencida ? null : 'sin b06_abril_vencida'));
  await d.walkTo(P.pedestal.x, P.pedestal.y + 1, { face: 'up' });
  await d.interact({ watch: [{ scene: 'VerseScene', name: 'verso_iii', delay: 1200 }] });
  await d.expectSaid(/Fragmento Azur 3/, 'el Fragmento Azur 3');
  await d.expectSaid(/Aquí arriba el viento nunca ha tenido camino/, 'Abril lee el verso');
  await d.expectSaid(/La cuarta tabla duerme entre capas de piedra/, 'la inscripción de T04');
  await d.expectSaid(/Vale\. Esto no es aburrido\./, 'la respuesta de Abril');
  const clues = await d.eval(() => window.__b06.clues());
  const crisis = await d.eval(() => window.__b06.crisis());
  await d.milestone('p3_restaurado', (st) => {
    if (!st.flags.p3_restored || !st.flags.verse_3) return 'sin p3_restored o sin verso III';
    if (!st.fragments.includes('F03')) return 'sin Fragmento 3';
    if (!clues.some((c) => c.id === 'T04')) return 'sin pista T04';
    return crisis === 1 ? null : `crisis ${crisis}`;
  });
}

async function salida(d) {
  await d.walkTo(P.down.x, P.down.y - 1);
  await d.step(2);
  await d.until((s) => s.map === 'anillo_vientos' && s.ready, { timeout: 15000, what: 'volver a las campanas' });
  await d.settle();
  await d.walkTo(26, 17);
  await d.interact();
  await d.until((s) => s.map === 'galerias_soplo' && s.ready, { timeout: 15000, what: 'volver al Remolino' });
  await d.settle();
  await d.walkTo(10, 28);
  await d.step(2);
  await d.until((s) => s.map === 'anillo_vientos_base' && s.ready, { timeout: 15000, what: 'bajar a la base' });
  await d.settle();
  await d.walkTo(P.down.x, P.down.y - 1);
  await d.step(2);
  await d.until((s) => s.map === 'meseta_impulso' && s.ready, { timeout: 15000, what: 'bajar a la Meseta' });
  await d.settle();
  await d.walkTo(29, 20);
  await d.turn('up');
  const spinning = await d.eval(() => window.__b06.eventPage('aerogenerador_3'));
  await d.milestone('aerogeneradores_giran', (s) => (s.flags.p3_restored && spinning === 1 ? null : `p3 ${s.flags.p3_restored}, página ${spinning}`));
}

// ───────────────────────────── Principal ─────────────────────────────

export async function runB06(d){await refreshDriver(d);await d.configureOptions();await installB06Observer(d.page);await d.eval(()=>{window.__e2e.route=window.__b06.calmRoute;});await d.stages('B06',{preparar:async d=>{await d.travel('brontia_centro');await d.talk('enfermera');await d.purchase({SUPERPOTION:8});await d.travel('ruta_5');},ruta5,meseta,parque,anillo,galerias,sala,nucleo,salida});await d.walkTo(0,23);await d.crossEdge('left','ruta_5');await d.walkTo(0,19);await d.crossEdge('left','villa_brontia');}
