import { installB04Helpers } from './e2e_b04_page.mjs';
import { refreshDriver } from './e2e_campaign_refresh.mjs';
const has = (s, k) => Boolean(s.flags[k]);
const needFlags = (...ks) => (s) => { const miss = ks.filter((k) => !has(s, k)); return miss.length ? `faltan flags ${miss.join(', ')}` : null; };
const needCells = (...ks) => (s) => { const miss = ks.filter((k) => !s.cells.includes(k)); return miss.length ? `faltan células ${miss.join(', ')}` : null; };
const both = (...fs) => (s) => fs.map((f) => f(s)).find(Boolean) || null;
const waterOf = (s) => [0, 1, 2, 3, 4, 5].filter((i) => (s.puzzle.water >> i) & 1).map((i) => `E${i + 1}`).join(',');
const needWater = (want) => (s) => (waterOf(s) === want ? null : `agua ${waterOf(s)} ≠ ${want} (${s.puzzle.text})`);

// ───────────────────────────── Recorrido ─────────────────────────────

async function ruta3(d) {
  if ((await d.snap()).top !== 'MapScene') await d.closeDialogs();
  await d.travel('caudal_centro'); await d.talk('enfermera');
  if (((await d.snap()).items.SUPERPOTION || 0) < 4) {
    await d.travel('caudal_tienda'); await d.purchase({ SUPERPOTION: 6 });
  }
  if ((await d.snap()).map !== 'ruta_3') await d.travel('ruta_3');
  await d.settle();
  await d.milestone('caudal_entrada');
  if ((await d.snap()).map === 'ciudad_caudal') { await d.walkTo(0,4); await d.crossEdge('left','ruta_3'); }
  await d.settle();
  await d.milestone('ruta_3', (s) => (s.map === 'ruta_3' ? null : s.map));
  await d.mount();
  const watch = [{ scene: 'BattleScene', name: 'combate_ruta3', delay: 3500 }];
  // El recorrido continuo entrena con los rivales de la ruta; los fixtures antiguos ya traían niveles altos.
  for (const id of ['pescador_nicanor', 'excursionista_rufo', 'aspirante_vera']) {
    await d.talk(id, { watch });
    await d.travel('caudal_centro'); await d.talk('enfermera'); await d.travel('ruta_3'); await d.mount();
  }
  if (((await d.snap()).items.SUPERPOTION || 0) < 3) { await d.travel('caudal_tienda'); await d.purchase({ SUPERPOTION: 4 }); }
  await d.travel('ruta_3'); await d.mount();
  for (const [id, x, y] of [['cell_ruta_3_1', 23, 28], ['cell_ruta_3_3', 36, 7], ['cell_ruta_3_2', 14, 10]]) {
    await d.walkTo(x, y, { watch, stopWhen: (s) => s.cells.includes(id) });
    await d.settle({ watch });
    await d.mount();
  }
  await d.milestone('cuestas_de_grava', needCells('cell_ruta_3_1', 'cell_ruta_3_2', 'cell_ruta_3_3'));
  await d.walkTo(9, 0, { watch });
  await d.crossEdge('up', 'garganta_albo');
}

async function garganta(d) {
  if ((await d.snap()).map !== 'garganta_albo') await d.travel('garganta_albo');
  await d.settle(); // Zygarde habla muy poco (autor, 25-09-2026): la llegada ya no lleva aviso del Core.
  await d.milestone('garganta', needFlags('b04_garganta_llegada'));
  await d.mount();
  const watch = [{ scene: 'BattleScene', name: 'combate_tecnico', delay: 3500 }];
  // Baliza 1 (garganta baja): el técnico la vigila.
  await d.interact(23, 36, 'left', { watch });
  if (!(await d.snapState()).flags.b04_baliza_1) await d.interact(23, 36, 'left', { watch });
  await d.milestone('baliza_1', needFlags('b04_baliza_1'));
  // C019 en la repisa de la cascada pequeña (orilla oeste, cuesta de grava).
  await d.walkTo(9, 21, { watch, stopWhen: (s) => s.cells.includes('cell_garganta_1') });
  await d.settle();
  await d.mount();
  // Baliza 2 (molino) y C020 junto a la rueda del molino abandonado.
  await d.walkTo(15, 18, { watch, stopWhen: (s) => s.cells.includes('cell_garganta_2') });
  await d.settle();
  await d.interact(30, 21, 'down', { watch });
  if (!(await d.snapState()).flags.b04_baliza_2) await d.interact(30, 21, 'down', { watch });
  await d.milestone('baliza_2_molino', both(needFlags('b04_baliza_2'), needCells('cell_garganta_1', 'cell_garganta_2')));
  // Leandro en la esclusa.
  await d.interact(16, 12, 'left');
  await d.expectSaid(/Esta esclusa la puso mi tatarabuelo/, 'Leandro en la esclusa');
  // Baliza 3 junto a la puerta del Pilar: al retirarla, choque de Gael y Leandro.
  const clash = [...watch, { re: /Nadie te ha pedido nada/, name: 'choque_gael_leandro', delay: 300 }];
  await d.interact(21, 5, 'up', { watch: clash });
  if (!(await d.snapState()).flags.b04_baliza_3) await d.interact(21, 5, 'up', { watch: clash });
  await d.settle({ watch: clash });
  await d.expectSaid(/Nadie te ha pedido nada, chaval\./, 'la línea de Leandro');
  await d.expectSaid(/Por eso lo hago yo\./, 'la línea de Gael');
  await d.milestone('choque_y_puerta', needFlags('b04_baliza_3', 'b04_balizas_retiradas', 'b04_choque'));
  const st = await d.eval(() => window.__e2e.b04.story());
  if (st.beacons !== 3) throw new Error(`balizas en la mochila: ${st.beacons}`);
  await d.walkTo(26, 9, { stopWhen: (s) => s.map === 'pilar_corriente_base' });
  await d.until((s) => s.map === 'pilar_corriente_base' && s.ready, { what: 'entrar en el piso 1' });
}

async function control(d, [x, y, face], phaseCheck, name, watch) {
  const before = JSON.stringify((await d.snap()).puzzle);
  for (let attempt = 0; attempt < 3; attempt++) {
    await d.walkTo(x, y); await d.face(face); d.nextChoice = 0;
    await d.interact({ watch }); d.nextChoice = null;
    if (JSON.stringify((await d.snap()).puzzle) !== before) break;
  }
  if (JSON.stringify((await d.snap()).puzzle) === before) throw new Error(`El mando de (${x},${y}) no cambio tras tres pulsaciones reales`);
  if (phaseCheck) await d.milestone(name, phaseCheck);
}

async function pilar(d) {
  await d.settle();
  if ((await d.snap()).flags.b04_ciclo) return;
  if ((await d.snap()).map === 'pilar_corriente_base') {
  await d.milestone('piso_1_entrenadores');
  // Comprobamos la salida y el regreso antes de resolver la Escalera.
  await d.walkTo(13, 25, { stopWhen: (s) => s.map === 'garganta_albo' });
  await d.until((s) => s.map === 'garganta_albo' && s.ready, { what: 'salir del piso 1' });
  await d.walkTo(26, 9, { stopWhen: (s) => s.map === 'pilar_corriente_base' });
  await d.until((s) => s.map === 'pilar_corriente_base' && s.ready, { what: 'volver al piso 1' });
  const baseWatch = [{ scene: 'BattleScene', name: 'combate_piso_1', delay: 3500 }];
  await d.walkTo(13, 6, { watch: baseWatch, stopWhen: (s) => s.map === 'pilar_corriente' });
  await d.until((s) => s.map === 'pilar_corriente' && s.ready, { what: 'subir al piso del puzzle' });
  await d.settle({ watch: [{ re: /ya veremos si sabes dónde pisas/, name: 'reto_leandro', delay: 200 }] });
  await d.expectSaid(/ya veremos si sabes dónde pisas/, 'el reto de Leandro');
  await d.milestone('pilar_reto', needFlags('b04_reto'));
  }
  const puzzle = (await d.snap()).puzzle;
  if (puzzle.gates || puzzle.noria || puzzle.water !== 9) {
    await d.talk('palanca_reinicio');
    await d.milestone('reinicio_manual', s => s.puzzle.gates === 0 && !s.puzzle.noria && s.puzzle.water === 9 ? null : 'reinicio incompleto');
  }
  const watch = [{ scene: 'BattleScene', name: 'combate_escalera', delay: 3500 }];
  // Fase 1: abrir C1 (rellano) y C2 (repisa tras E2): E1 se vacía.
  await control(d, [24, 34, 'up'], null, '', watch);
  await control(d, [35, 7, 'right'], null, '', watch);
  await d.milestone('fase_1_E1_vacio', needWater('E3,E4'));
  // Fase 2: cerrar C2 y abrir C3 (repisa norte, por el fondo de E1: C021): E4 se vacía; enganchar la noria (C022).
  await control(d, [35, 7, 'right'], null, '', watch);
  await d.walkTo(20, 7, { watch, stopWhen: (s) => s.cells.includes('cell_corriente_1') });
  await d.settle();
  await control(d, [17, 4, 'left'], needWater('E3,E5'), 'fase_2_E4_vacio', watch);
  await d.walkTo(20, 29, { watch, stopWhen: (s) => s.cells.includes('cell_corriente_2') });
  await d.settle();
  await control(d, [20, 28, 'up'], (s) => (s.puzzle.noria ? null : 'noria suelta'), 'fase_2_noria', watch);
  // Fase 3: por E5 (losas) y el fondo de E6 (C023) al mando de C4; abrirlo: la noria sube el agua y E2 se llena.
  await d.walkTo(7, 9, { watch, stopWhen: (s) => s.cells.includes('cell_corriente_3') });
  await d.settle();
  await control(d, [3, 7, 'up'], needWater('E2,E3'), 'fase_3_losas_E2', watch);
  // Fase 4: por las losas de E2 al mando de C2 y abrirlo: ciclo completo (escena de la corriente).
  const cycle = [{ re: /Por los canales corre una luz azul/, name: 'la_corriente', delay: 300 }];
  await control(d, [35, 7, 'right'], null, '', [...watch, ...cycle]);
  await d.settle({ watch: cycle });
  await d.milestone('fase_4_ciclo', both(needFlags('b04_ciclo'), needCells('cell_corriente_1', 'cell_corriente_2', 'cell_corriente_3')));
}

async function nucleo(d) {
  await d.settle();
  const watch = [{ scene: 'BattleScene', name: 'combate_leandro', delay: 4500 }, { re: /Trescientos años girando llaves/, name: 'verso_ii', delay: 300 }];
  if ((await d.snapState()).map === 'pilar_corriente') {
    await d.walkTo(20, 18, { stopWhen: (s) => s.map === 'pilar_corriente_nucleo' });
    await d.until((s) => s.map === 'pilar_corriente_nucleo' && s.ready, { what: 'subir al piso del Guardián' });
  }
  await d.settle({ watch });
  for (let attempt = 0; attempt < 5 && !(await d.snap()).flags.b04_leandro_vencido; attempt++) {
    await d.talk('leandro_isla', {watch});
  }
  await d.milestone('leandro_vencido', needFlags('b04_leandro_vencido'));
  await d.interact(13, 12, 'up', { watch });
  await d.settle({ watch });
  await d.expectSaid(/Trescientos años girando llaves… y el río solo necesitaba que alguien lo escuchara\./, 'la línea de Leandro');
  await d.expectSaid(/La segunda tabla gira donde el agua trabaja/, 'la inscripción (T02)');
  const st = await d.eval(() => window.__e2e.b04.story());
  if (!st.fragments.includes('F02')) throw new Error(`sin Fragmento 2: ${st.fragments}`);
  if (!st.t02 || st.t02.step !== 2) throw new Error(`T02 sin segunda pista: ${JSON.stringify(st.t02)}`);
  if (!st.t03) throw new Error('T03 sin abrir');
  await d.milestone('pilar_restaurado', needFlags('p2_restored', 'verse_2', 'b04_inscripcion', 'b04_leandro_despedida'));
  await d.walkTo(13, 25, { stopWhen: (s) => s.map === 'pilar_corriente' });
  await d.until((s) => s.map === 'pilar_corriente' && s.ready, { what: 'bajar al piso del puzzle' });
  await d.walkTo(20, 38, { stopWhen: (s) => s.map === 'pilar_corriente_base' });
  if ((await d.snapState()).map !== 'pilar_corriente_base') { await d.press('ArrowDown', 600); }
  await d.until((s) => s.map === 'pilar_corriente_base' && s.ready, { what: 'bajar al piso 1' });
  await d.walkTo(13, 25, { stopWhen: (s) => s.map === 'garganta_albo' });
  await d.until((s) => s.map === 'garganta_albo' && s.ready, { what: 'salir a la Garganta' });
  await d.settle();
  await d.milestone('garganta_en_calma');
  await d.mount();
  await d.walkTo(17, 39);
  await d.crossEdge('down', 'ruta_3');
}

async function caudal(d) {
  await d.settle();
  const watch = [{ re: /Lleva días mirando la puerta/, name: 'alerce_inicial', delay: 300 }, { re: /Vecinos de Caudal/, name: 'plaza_gracias', delay: 300 }];
  await d.walkTo(39, 33, { watch });
  await d.crossEdge('right', 'ciudad_caudal');
  await d.settle({ watch });
  await d.expectSaid(/Lleva días mirando la puerta\./, 'la entrega de Alerce');
  await d.milestone('gracias_e_inicial', both(needFlags('b04_gracias', 'b04_inicial'), (s) => (s.party.includes('SOBBLE') ? null : `equipo ${s.party}`)));
}


export async function runB04(d) {await refreshDriver(d);await installB04Helpers(d.page); await d.stages('B04', {ruta3, garganta, pilar, nucleo, caudal});}
