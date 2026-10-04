import { refreshDriver } from './e2e_campaign_refresh.mjs';
const pick = (re) => (s) => Math.max(0, s.choiceItems.findIndex((i) => re.test(i)));

// ───────────────────────────── T02: el Molino del Diezmo ─────────────────────────────

async function molino(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'molino_diezmo' && s.ready, { timeout: 30000, what: 'molino_diezmo' });
  await d.settle({ watch: [{ re: /pesa como un río/, name: 't02_anselmo', delay: 200 }] });
  await d.expectSaid(/La muela del Diezmo pesa como un río/, 'la frase de Anselmo');
  await d.milestone('t02_llegada', (s) => (s.flags.b05_t02_anselmo && s.clues.some((c) => c.id === 'T02') ? null : 'sin Anselmo o sin pista T02'));
  if (!(await d.snap()).flags.b05_t02_eje_abierto) {
  // Rueda pequeña entre los sacos
  await d.use(2, 8, 'down');
  await d.expectSaid(/rueda dentada pequeña/, 'la rueda pequeña');
  // Desván: rueda mediana
  await d.walkTo(14, 4, { stopWhen: (s) => s.x >= 20 });
  await d.settle();
  const med = await d.pos('rueda_desvan');
  await d.use(med.x, med.y + 1, 'up');
  await d.expectSaid(/rueda dentada mediana/, 'la rueda mediana');
  // Canal alto por la puerta trasera del desván
  await d.walkTo(22, 4, { face: 'up' });
  await d.pushInto('up', 'caudal_canal_alto');
  await d.shot('canal_alto');
  await d.use(16, 7, 'up', { choose: pick(/^Sí$/) }); // cuesta de grava: montar en el 10 %
  const g = await d.snapState();
  if (!g.riding) console.log('  (aviso: no se detectó la montura; se intenta subir igualmente)');
  await d.walkTo(20, 3, { face: 'right' });
  await d.press('KeyZ', 400);
  await d.settle();
  await d.milestone('t02_rueda_grande', (s) => (s.flags.b05_t02_engranaje_g ? null : 'sin la rueda grande'));
  await d.walkTo(16, 7);
  await d.walkTo(4, 12);
  await d.pushInto('up', 'molino_diezmo');
  // Bajar al taller y montar el tren: pequeña (izquierdas), mediana (derechas), grande (izquierdas)
  await d.walkTo(27, 4, { stopWhen: (s) => s.x <= 14 });
  await d.settle();
  const choices = [
    [4, pick(/pequeña/)], [4, pick(/vuelta/)],
    [6, pick(/mediana/)],
    [8, pick(/grande/)], [8, pick(/vuelta/)],
  ];
  for (const [x, choose] of choices) await d.use(x, 5, 'up', { choose });
  await d.shot('t02_engranajes');
  await d.use(12, 7, 'up', { choose: pick(/^Sí$/), timeout: 400000, watch: [
    { re: /moler a derechas/, name: 't02_muela_gira', delay: 300 },
    { re: /Consorcio Meridiano de Estudios/, name: 't02_tecnicos', delay: 300 },
    { scene: 'BattleScene', name: 't02_combate', delay: 4000 },
  ] });
  await d.settle({ timeout: 400000 });
  }
  for (let tries=0; !(await d.snap()).flags.b05_t02_tecnicos && tries<8; tries++) {
    const remaining=Number((await d.snap()).vars.b05_t02_tec_0)===1 ? 'tecnico_1' : 'tecnico_0';
    await d.talk(remaining, {timeout:400000});
    await d.settle({timeout:400000});
  }
  await d.expectSaid(/Venimos a tomar muestras del eje/, 'la llegada de los técnicos');
  await d.expectSaid(/Parque Eólico/, 'el aviso de Darío');
  await d.milestone('t02_dario', (s) => (s.flags.b05_t02_tecnicos && s.flags.b05_t02_dario ? null : 'sin técnicos vencidos o sin Darío'));
  await d.use(8, 9, 'up');
  await d.milestone('t02_tabla_linfa', (s) => (s.flags.b05_t02_tablilla && s.tablets.includes('SPLASHPLATE') ? null : `tablillas ${s.tablets}`));
}

// ───────────────────────────── Caudal → Ruta 4 ─────────────────────────────

async function toRuta4(d) { await d.exitTo('ciudad_caudal');await d.walkTo(63,29);await d.crossEdge('right','ruta_4');}
async function ruta4(d) {
  const watch = [{ scene: 'BattleScene', name: 'ruta4_combate', delay: 4000 }, { re: /Recuerdo cómo se abre paso/, name: 'ruta4_embestida', delay: 200 }];
  await d.walkTo(17, 14, { watch }); // al otro lado del vado
  await d.milestone('ruta4_vado', (s) => (s.x >= 16 ? null : 'no cruzó el vado'));
  await d.walkTo(56, 26, { watch, stopWhen: (s) => s.cells.includes('cell_ruta_4_1') });
  await d.settle({ watch });
  await d.expectSaid(/Recuerdo cómo se abre paso/, 'la escena de Embestida');
  await d.milestone('ruta4_c025_embestida', (s) => (s.ram && s.cells.includes('cell_ruta_4_1') ? null : `ram ${s.ram}, ${s.cells.length} células`));
  await d.use(69, 24, 'right', { choose: pick(/^Sí$/), watch });
  const broken = await d.eval(() => window.__e2e.selfSwitch('ruta_4', 'roca_tutorial'));
  await d.milestone('ruta4_roca', () => (broken ? null : 'la roca de tutorial sigue entera'));
  await d.walkTo(77, 27, { watch, stopWhen: (s) => s.cells.includes('cell_ruta_4_2') });
  await d.settle();
  await d.use(75, 24, 'up');
  await d.milestone('ruta4_c026_heracrossita', (s) => (s.cells.includes('cell_ruta_4_2') && s.items.HERACRONITE === 1 ? null : `células ${s.cells.length}, heracrossita ${s.items.HERACRONITE}`));
  await d.walkTo(79, 5, { watch });
  await d.crossEdge('right', 'villa_brontia');
  await d.walkTo(3, 19, { stopWhen: (s) => s.flags.b05_brontia });
  await d.settle({ watch: [{ re: /Bienvenido a Villa Brontia/, name: 'brontia_llegada', delay: 200 }] });
  await d.expectSaid(/mantenimiento/, 'el contrato del Consorcio');
  await d.milestone('brontia', (s) => (s.flags.b05_brontia ? null : 'sin b05_brontia'));
}

// ───────────────────────────── T03 en Villa Brontia ─────────────────────────────

async function enterTower(d) {
  await d.walkTo(25, 16, { face: 'up' });
  await d.pushInto('up', 'brontia_campanario');
}

async function t03Day(d) {
  await enterTower(d);
  await d.use(3, 7, 'up');
  await d.expectSaid(/Cada noche cae un rayo en el campanario, sin tormenta/, 'la pista de Sixto');
  await d.use(6, 4, 'right', { choose: pick(/^Sí$/) });
  await d.milestone('t03_escombros', (s) => (s.map === 'brontia_campanario' ? null : 'fuera del campanario'));
  await d.walkTo(8, 4, { stopWhen: (s) => s.x >= 12 });
  await d.settle();
  await d.use(15, 6, 'up');
  await d.milestone('t03_campana', (s) => (s.flags.b05_t03_campanil ? null : 'sin ver la campana'));
  await d.walkTo(17, 4, { stopWhen: (s) => s.x <= 9 });
  await d.settle();
  await d.walkTo(5, 10, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
  // Casa de Abril: antes del P3 acampa en el Anillo (B06) y solo está su nota; su segunda pista de T03 la da allí
  // o, tras el P3, en Brontia (se comprueba al final).
  await d.walkTo(30, 9, { face: 'up' });
  await d.pushInto('up', 'brontia_casa_abril');
  await d.use(2, 6, 'up');
  await d.expectSaid(/Me subo al Anillo/, 'la nota de Abril');
  await d.milestone('t03_casa_abril', (s) => (s.map === 'brontia_casa_abril' ? null : `mapa ${s.map}`));
  await d.walkTo(6, 9, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
}

async function substation(d) {
  await d.walkTo(37, 33, { face: 'up' });
  await d.pushInto('up', 'brontia_subestacion');
  await d.use(5, 8, 'left');
  // Prueba equivocada: J00→J01 (caja quemada) → salta el diferencial
  await d.walkTo(8, 5);
  await d.press('KeyZ', 300);
  await d.settle();
  await d.use(14, 5, 'up', { choose: pick(/Probar/) });
  await d.expectSaid(/Chispazo/, 'el cortocircuito');
  await d.shot('t03_cortocircuito');
  for (const [x, y] of [[7, 6], [8, 7], [9, 8], [10, 9]]) {
    await d.walkTo(x, y);
    await d.press('KeyZ', 300);
    await d.settle();
  }
  await d.shot('t03_circuito');
  await d.use(14, 5, 'up', { choose: pick(/Probar/) });
  await d.milestone('t03_linea', (s) => (s.flags.b05_t03_circuito ? null : 'la línea no quedó conectada'));
  await d.walkTo(9, 11, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
}

async function nightAndBell(d) {
  if((await d.snap()).map!=='brontia_campanario') {
  await d.walkTo(4, 31, { face: 'up' });
  await d.pushInto('up', 'brontia_posada');
  await d.use(4, 5, 'up', { choose: (s) => (s.choiceItems.includes('Noche') ? s.choiceItems.indexOf('Noche') : 0) });
  await d.milestone('t03_noche', (s) => (s.hour >= 20 || s.hour < 6 ? null : `hora ${s.hour}`));
  await d.walkTo(7, 10, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
  await d.settle({ watch: [{ re: /Ha sonado sola/, name: 't03_rayo', delay: 100 }] });
  await d.expectSaid(/bajo la campana, algo brilla/, 'la narración tras el rayo');
  await d.milestone('t03_luz', (s) => (s.flags.b05_t03_rayo && s.flags.b05_brontia_luz ? null : 'sin rayo o sin luz'));
  await enterTower(d);
  }
  await d.walkTo(8, 4, { stopWhen: (s) => s.x >= 12 });
  await d.settle();
  await d.eval(()=>{window.__campaign.control.wild='fight';});
  try {
    await d.use(15, 8, 'up', { timeout: 500000, watch: [{ scene: 'BattleScene', name: 't03_horda', delay: 4000 }, { re: /Así suena Brontia/, name: 't03_sixto_campana', delay: 200 }] });
  } finally {await d.eval(()=>{window.__campaign.control.wild='run';});}
  await d.settle({ timeout: 300000 });
  await d.milestone('t03_tabla_trueno', (s) => (s.tablets.includes('ZAPPLATE') && s.flags.b05_t03_tablilla && s.items.RAICHUITEX === 1 ? null : `tablillas ${s.tablets}, raichuita ${s.items.RAICHUITEX}`));
  await d.walkTo(17, 4, { stopWhen: (s) => s.x <= 9 });
  await d.settle();
  await d.walkTo(5, 10, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
}

async function brontiaExtras(d) {
  await d.use(40, 11, 'up', { choose: pick(/^Sí$/) });
  await d.walkTo(39, 11, { stopWhen: (s) => s.cells.includes('cell_brontia_1') });
  await d.settle();
  await d.milestone('brontia_c027', (s) => (s.cells.includes('cell_brontia_1') ? null : 'sin C027'));
  await d.walkTo(21, 35, { face: 'down' });
  await d.step(2);
  await d.settle();
  await d.expectSaid(/vendaval sin rumbo/, 'el vendaval de la Ruta 6');
  await d.milestone('brontia_vendaval', (s) => (s.map === 'villa_brontia' && s.y <= 35 ? null : `pos ${s.x},${s.y}`));
}

export async function runB05(d){await refreshDriver(d);await d.configureOptions();await d.stages('B05',{entrada:async d=>d.exitTo('molino_diezmo'),molino,toRuta4,ruta4,t03Day,substation,nightAndBell,brontiaExtras});await d.walkTo(43,19);await d.crossEdge('right','ruta_5');}
