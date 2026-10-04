// B03 continuo, todas las acciones por controles.
import { refreshDriver } from './e2e_campaign_refresh.mjs';
async function zaguan(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'villa_zaguan' && s.ready, { timeout: 30000, what: 'Villa Zaguán' });
  await d.settle();
  await d.shot('zaguan_entrada');
  // Segunda pista: el jardinero
  await d.talk('t01_jardinero');
  await d.expectSaid(/la hierba muerta… gira|gira\. Como un remolino/, 'la segunda pista del jardinero');
  await d.milestone('t01_jardinero', async () => {
    const st = await d.story();
    const t01 = st.clues.find((c) => c.id === 'T01');
    return t01?.step === 2 ? null : `pista T01 ${JSON.stringify(t01)}`;
  });
  // Vista cenital desde el campanario
  const bell = await d.eval(() => window.__e2e.eventPos('t01_campana_0'));
  const view = [{ re: /La hierba seca dibuja una espiral/, name: 't01_vista_cenital', delay: 400 }];
  await d.useFrom(bell.x, bell.y, bell.x, bell.y + 1, { watch: view });
  await d.expectSaid(/su centro no está en el árbol/, 'la vista de la espiral');
  await d.milestone('t01_campanario', (s) => (s.flags.b03_t01_vista ? null : 'sin b03_t01_vista'));
  // Excavación bajo el banco de piedra
  const bench = await d.eval(() => window.__e2e.eventPos('t01_banco_1'));
  const dig = [{ re: /Apartar el banco de piedra/, name: 't01_banco' },{ re: /tabla de piedra verdosa/, name: 't01_excavacion', delay: 300 }];
  await d.useFrom(bench.x, bench.y, bench.x, bench.y + 1, { watch: dig });
  await d.expectSaid(/Tabla Pradal/, 'la Tabla Pradal');
  await d.milestone('t01_tabla_pradal', async (s) => {
    const st = await d.story();
    if (!st.tablets.includes('MEADOWPLATE')) return `Tablillas ${st.tablets}`;
    const t01 = st.clues.find((c) => c.id === 'T01');
    return s.flags.b03_t01_tablilla && t01?.status === 'solved' ? null : `T01 ${JSON.stringify(t01)}`;
  });
  // Mirta: Semilla Milagro
  await d.talk('t01_mirta');
  await d.milestone('t01_mirta_semilla', async () => ((await d.story()).items.MIRACLESEED ? null : 'sin Semilla Milagro'));
  // Lía en el Centro: Repartir Exp
  await d.exitTo('zaguan_centro');
  await d.talk('lia');
  await d.expectSaid(/Repartir Exp/, 'la explicación de Lía');
  await d.milestone('lia_repartir_exp', async () => ((await d.story()).items.EXPSHARE ? null : 'sin Repartir Exp'));
  const nurse = await d.eval(() => window.__e2e.eventPos('enfermera'));
  await d.useFrom(nurse.x, nurse.y, nurse.x, nurse.y + 2);
  await d.exitTo('villa_zaguan');
  await d.walkTo(19, 35);
  await d.crossEdge('down', 'ruta_2');
}

async function ruta2(d) {
  // Con --desde=ruta2 la página acaba de cargar: esperar al mapa antes de comprobar el hito.
  await d.until((s) => s.map === 'ruta_2' && s.ready, { what: 'Ruta 2' });
  await d.milestone('ruta_2', (s) => (s.map === 'ruta_2' ? null : `mapa ${s.map}`));
  const battles = [{ scene: 'BattleScene', name: 'combate_ruta_2', delay: 3500 }];
  // C013 bajo el puente del primer arroyo
  await d.walkTo(16, 18, { watch: battles, stopWhen: (s) => s.cells.includes('cell_ruta_2_1') });
  await d.settle();
  await d.milestone('c013_bajo_el_puente', (s) => (s.cells.includes('cell_ruta_2_1') ? null : 'sin C013'));
  // C015: montar en el 10 % (tecla E = botón R) y subir por la rampa de grava
  await d.walkTo(5, 43, { watch: battles });
  await d.press('KeyE', 600);
  await d.settle();
  await d.walkTo(4, 38, { watch: battles, stopWhen: (s) => s.cells.includes('cell_ruta_2_2') });
  await d.settle();
  await d.milestone('c015_rampa_correr', (s) => (s.cells.includes('cell_ruta_2_2') ? null : 'sin C015'));
  await d.walkTo(5, 43, { watch: battles });
  await d.press('KeyE', 600);
  await d.settle();
  // Hacia Caudal por el camino (los entrenadores con visión saltan solos)
  await d.walkTo(14, 69, { watch: battles, stopWhen: (s) => s.map === 'ciudad_caudal' });
  const s = await d.snapState();
  if (s.map !== 'ciudad_caudal') await d.crossEdge('down', 'ciudad_caudal');
}

async function caudal(d) {
  await d.until((s) => s.map === 'ciudad_caudal' && s.ready, { what: 'Ciudad Caudal' });
  await d.settle();
  await d.shot('caudal_llegada');
  // Gael en el puente dorado (B2) y la llamada de Alerce
  const watch = [
    { re: /Se me escapó de las manos… hacia ti/, name: 'gael_celula', delay: 200 },
    { scene: 'BattleScene', name: 'combate_gael_b2', delay: 4500 },
    { re: /¿Balizas de tres patas en la Garganta\?/, name: 'llamada_alerce' },
  ];
  await d.walkTo(31, 9, { watch, stopWhen: (s) => s.flags.b03_gael_b2 });
  await d.settle({ watch });
  await d.expectSaid(/Encontré una célula/, 'la célula de Gael');
  await d.expectSaid(/…Da igual\. Id con cuidado\./, 'la respuesta de Alerce');
  await d.milestone('gael_b2_y_alerce', (s) => (s.flags.b03_gael_b2 && s.flags.b03_llamada_alerce ? null : 'faltan flags de Gael/Alerce'));
  // C014 en la pasarela de la Esclusa mayor
  const cell = await d.eval(() => window.__e2e.eventPos('cell_caudal_1'));
  await d.walkTo(cell.x, cell.y, { stopWhen: (s) => s.cells.includes('cell_caudal_1') });
  await d.settle();
  await d.milestone('c014_esclusa_mayor', (s) => (s.cells.includes('cell_caudal_1') ? null : 'sin C014'));
  // Anselmo: pista T02
  await d.talk('anselmo');
  await d.expectSaid(/La muela del Diezmo pesa como un río/, 'la pista de Anselmo');
  await d.milestone('anselmo_t02', async () => {
    const t02 = (await d.story()).clues.find((c) => c.id === 'T02');
    return t02 && t02.status !== 'solved' ? null : `T02 ${JSON.stringify(t02)}`;
  });
  // Pescador del mercado: Caña Vieja
  await d.talk('pescador');
  await d.milestone('cana_vieja', async () => ((await d.story()).items.OLDROD ? null : 'sin Caña Vieja'));
  // Centro Pokémon
  await d.exitTo('caudal_centro');
  const nurse = await d.eval(() => window.__e2e.eventPos('enfermera'));
  await d.useFrom(nurse.x, nurse.y, nurse.x, nurse.y + 2);
  await d.expectSaid(/Tus Pokémon se han recuperado/, 'la curación del Centro');
  await d.milestone('caudal_centro');
  await d.exitTo('ciudad_caudal');
  // Leandro en la Casa de las Esclusas
  await d.exitTo('caudal_esclusas');
  await d.talk('leandro');
  await d.expectSaid(/trescientos años llevando el río a mano/, 'Leandro');
  await d.milestone('leandro_casa_esclusas');
  await d.exitTo('ciudad_caudal');
  // Salida del bloque: el sendero de la ribera hacia la Ruta 3 (B04)
  const hasRuta3 = await d.eval(async () => Object.hasOwn((await import('/src/content/maps/index.js')).MAPS, 'ruta_3'));
  await d.walkTo(1, 4, { stopWhen: (s) => s.map !== 'ciudad_caudal' });
  if (hasRuta3) {
    if ((await d.snapState()).map !== 'ruta_3') await d.crossEdge('left', 'ruta_3');
    await d.milestone('salida_ruta_3', (s) => (s.map === 'ruta_3' ? null : `mapa ${s.map}`));
  } else {
    await d.step(4);
    await d.settle();
    await d.expectSaid(/Garganta del Albo/, 'el aviso del sendero cerrado');
    await d.milestone('salida_ruta_3_pendiente');
  }
}


export async function runB03(d){await refreshDriver(d);await zaguan(d);await ruta2(d);await caudal(d);}
