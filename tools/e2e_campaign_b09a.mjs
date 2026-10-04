import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB09aObserver} from './e2e_campaign_b09a_page.mjs';
import {collectLandCells} from './e2e_campaign_cells.mjs';
import {GALLERY} from '../game/src/content/maps/b09a/museo_layout.js';

const RETRY=false;
const pick = (label) => (s) => { const i = s.choices.findIndex((c) => c === label || c.startsWith(label)); return i < 0 ? 0 : i; };

// ───────────────────────────── Recorrido ─────────────────────────────

async function ruta7(d) {
  const current=await d.snap();
  if(current.map==='lumina_hotel'&&current.flags.b09_gala&&current.cells.includes('cell_ruta_7_1'))return;
  await d.until((s) => s.top === 'MapScene' && s.map === 'ruta_7' && s.ready, { timeout: 30000, what: 'la Ruta 7' });
  await d.settle();
  await d.walkTo(84, 17);
  const rubble = await d.eval(() => window.__b09a.eventAlive('derrumbe_76_17'));
  await d.milestone('ruta7_paso_despejado', (s) => (!rubble && s.flags.b09_r7_llegada ? null : 'el derrumbe sigue en pie'));
  // C041 bajo el andén abandonado (barro: Terreno complicado)
  await d.walkTo(38, 13);
  await d.walkTo(38, 11);
  await d.settle();
  await d.milestone('c041', (s) => (s.cells.includes('cell_ruta_7_1') ? null : 'sin C041'));
  await d.walkTo(0, 21);
  await d.crossEdge('left', 'ciudad_lumina',{acceptArrival:s=>s.map==='lumina_hotel'&&(s.busy||s.flags?.b09_gala)});
}

async function gala(d) {
  const watch = [{ re: /acompañante verde/, name: 'botones', delay: 200 }, { re: /mecenas de esta gala/, name: 'gala', delay: 200 },
    { re: /Así que tú eres quien lleva/, name: 'vertice', delay: 200 }, { re: /Rosalía Quintana/, name: 'rosalia', delay: 200 }];
  await d.until((s) => s.map === 'lumina_hotel' || s.busy, { timeout: 20000, what: 'la invitación a la gala' });
  await d.settle({ watch });
  await d.expectSaid(/Lúmina le debe mucho a la gente que escucha a las piedras/, 'la frase de Vértice');
  await d.expectSaid(/migraciones de Staravia/, 'el elogio del informe de Gael');
  await d.expectSaid(/Ven al museo de noche/, 'la pista de Rosalía');
  await d.milestone('gala', (s) => (s.flags.b09_gala && s.clues.some((c) => c.id === 'T06') ? null : 'sin gala o sin pista T06'));
  await d.leave(13, 20, 'down', 'ciudad_lumina');
}

async function gaelB3(d) {
  const watch = [{ re: /Vértice ha leído mi informe/, name: 'gael_escalinata', delay: 200 }, { scene: 'BattleScene', name: 'combate_gael', delay: 3500 }];
  await d.walkTo(35, 29);
  await d.walkTo(35, 28, { watch });
  await d.settle({ watch });
  await d.expectSaid(/Combate\./, 'el reto de Gael');
  await d.milestone('gael_b3', (s) => {
    if (!s.flags.b09_gael_b3) return 'sin b09_gael_b3';
    if (RETRY && s.flags.b09_gael_b3_ganado) return 'la derrota simulada no se aplicó';
    return null;
  });
  if (RETRY) await d.expectSaid(/Esta vez no/, 'la frase de Gael tras la derrota del jugador');
}

async function t07(d) {
  const current=await d.snap();
  const flowerFlags=['b09_t07_flor_pradera','b09_t07_flor_ribera','b09_t07_flor_huerto'];
  if(!flowerFlags.every(flag=>(current.flags||{})[flag])) {
  await d.travel('ciudad_lumina');
  // Iván en el Centro
  await d.push(57, 44, 'up', 'lumina_centro');
  await d.talk(7, 8, 'left', { watch: [{ re: /Soy Iván/, name: 'ivan', delay: 200 }] });
  await d.milestone('t07_pista', (s) => (s.flags.b09_ivan && s.clues.some((c) => c.id === 'T07') ? null : 'sin pista T07'));
  await d.leave(9, 12, 'down', 'ciudad_lumina');
  // Ruta 14 y la puerta de la Reserva
  await d.walkTo(35, 63);
  await d.crossEdge('down', 'ruta_14_reserva');
  await d.walkTo(35, 35);
  await d.walkTo(37, 35, { stopWhen: (s) => s.flags.b09_reserva_paso });
  await d.settle();
  await d.expectSaid(/Iván me ha dicho que vendrías/, 'la guarda de la Reserva');
  // La colmena: segunda pista
  await d.walkTo(40, 30, { watch: [{ re: /losa de piedra gris/, name: 'colmena', delay: 200 }] });
  await d.settle();
  await d.expectSaid(/Síguelas/, 'la pista de las obreras');
  await d.milestone('t07_colmena', (s) => (s.clues.some((c) => c.id === 'T07' && c.step === 2) ? null : 'sin segunda pista de T07'));
  // Tres obreras y tres flores
  await d.talk(42, 28, 'up');
  await d.talk(54, 27, 'up');
  await d.talk(41, 25, 'left');
  await d.talk(51, 23, 'up');
  await d.talk(38, 30, 'up');
  await d.talk(43, 46, 'up');
  await d.milestone('t07_flores', (s) => (['b09_t07_flor_pradera', 'b09_t07_flor_ribera', 'b09_t07_flor_huerto'].every((f) => s.flags[f]) ? null : 'faltan flores'));
  }
  // La reina: Vespiquen Alfa (derrota simulada y reintento)
  const watch = [{ re: /¡La reina sale de la colmena!/, name: 'reina', delay: 200 }, { scene: 'BattleScene', name: 'vespiquen_alfa', delay: 3500 }];
  for(let attempt=0;attempt<4;attempt++) {
    if((await d.snap()).tablets.includes('INSECTPLATE'))break;
    await d.talk(40, 29, 'up', { watch });
  }
  if (RETRY) {
    await d.milestone('t07_reintento', (s) => (s.lost.includes('VESPIQUEN') && !s.flags.b09_t07_tablilla && s.x === 40 && s.y === 29 ? null : `tras perder: (${s.x},${s.y})`));
    await d.turn('up');
    await d.interact({ watch });
  }
  await d.milestone('t07_tablilla', (s) => {
    if (!s.tablets.includes('INSECTPLATE')) return 'sin Tabla Bicho';
    if (!s.flags.b09_reserva_abierta || !s.flags.b09_scolipedita) return 'sin Reserva abierta o sin Scolipedita';
    return null;
  });
  // Vuelta a Lúmina
  await d.walkTo(29, 1);
  await d.crossEdge('up', 'ciudad_lumina');
}

async function nightRest(d, slot) {
  await d.push(43, 9, 'up', 'lumina_hotel');
  await d.talk(18, 16, 'right', { choose: (s) => (s.choices.includes(slot) ? s.choices.indexOf(slot) : pick('Descansar')(s)) });
  await d.leave(13, 20, 'down', 'ciudad_lumina');
}

async function t06(d) {
  await nightRest(d, 'Noche');
  await d.milestone('noche', (s) => (s.hour >= 20 || s.hour < 6 ? null : `hora ${s.hour}`));
  // Museo, ala derecha: Rosalía
  await d.push(37, 23, 'up', 'lumina_museo');
  await d.expectSaid(/cambiado todas las etiquetas/, 'la segunda pista de T06');
  await d.milestone('t06_noche', (s) => (s.flags.b09_t06_noche && s.clues.some((c) => c.id === 'T06' && c.step === 2) ? null : 'sin segunda pista de T06'));
  // Sótano: báscula y ficha de 1962
  await d.push(30, 14, 'right', 'lumina_museo_taller');
  await d.talk(20, 6, 'up');
  await d.talk(3, 16, 'up');
  // Galería: foto; sala de Antea: calco y vitrina
  await d.push(3, 4, 'left', 'lumina_museo');
  await d.leave(28, 16, 'down', 'ciudad_lumina');
  await d.push(36, 23, 'up', 'lumina_museo');
  await d.push(8, 15, 'right', 'lumina_museo_galeria');
  await d.talk(14, 4, 'up');
  await d.pushTo(2, 5, 'up', 34, 11);
  await d.talk(32, 4, 'up');
  await d.talk(34, 5, 'up');
  await d.milestone('t06_pistas', (s) => ((Number(s.vars.b09_t06_pistas) & 31) === 31 ? null : `pistas ${s.vars.b09_t06_pistas}`));
  await d.pushTo(34, 12, 'down', 4, 5);
  await d.push(19, 13, 'left', 'lumina_museo');
  await d.leave(19, 16, 'down', 'ciudad_lumina');
  await d.push(37, 23, 'up', 'lumina_museo');
  await d.push(30, 14, 'right', 'lumina_museo_taller');
  // Sala de Réplicas: un error y la original
  const pallets = [[4, 7], [7, 7], [10, 7], [4, 11], [7, 11], [10, 11]];
  const yes = pick('Sí');
  if (RETRY) {
    const w = await d.eval(() => window.__b09a.wrongPos());
    await d.talk(pallets[w][0], pallets[w][1] + 1, 'up', { choose: yes });
    await d.expectSaid(/^No\.$/, 'el «No» de Rosalía');
    await d.milestone('t06_error', (s) => (Number(s.vars.b09_t06_intento) === 1 && s.x === 7 && s.y === 13 ? null : `tras el error (${s.x},${s.y})`));
  }
  const o = await d.eval(() => window.__b09a.originalPos());
  await d.talk(pallets[o][0], pallets[o][1] + 1, 'up', { choose: yes, watch: [{ re: /Cuarenta años mirándola/, name: 'rosalia_confirma', delay: 200 }] });
  await d.milestone('t06_original', (s) => (s.flags.b09_t06_original && s.flags.b09_t06_persecucion ? null : 'sin la original'));
  // Muelle de carga
  const watch = [{ scene: 'BattleScene', name: 'combate_muelle', delay: 3500 }];
  await d.walkTo(19, 15, { watch, stopWhen: (s) => s.flags.b09_t06_restauradores || s.lost.length > 0 && s.lost.includes('b09a_restaurador_bruno') });
  await d.settle({ watch });
  if (RETRY && !(await d.snapState()).flags.b09_t06_restauradores) {
    await d.milestone('muelle_reintento', (s) => (s.x === 17 && s.y === 15 ? null : `tras perder: (${s.x},${s.y})`));
    await d.walkTo(19, 15, { watch, stopWhen: (s) => s.flags.b09_t06_restauradores });
    await d.settle({ watch });
  }
  await d.expectSaid(/El museo no puede protegerla; tú sí\./, 'la frase de Rosalía');
  await d.milestone('t06_tablilla', (s) => {
    if (!s.tablets.includes('IRONPLATE')) return 'sin Tabla Acero';
    if (!s.partyList.includes('EEVEE')) return 'sin Eevee';
    if (!s.clues.some((c) => c.id === 'T08')) return 'sin pista T08';
    return null;
  });
  // Ficha de la Laguna Clara
  await d.talk(7, 16, 'up');
  await d.expectSaid(/Nunca publicaron nada\./, 'la ficha de la Laguna Clara');
  await d.milestone('ficha_laguna', (s) => (s.flags.b09_ficha_laguna ? null : 'sin ficha'));
  await d.leave(29, 17, 'down', 'ciudad_lumina');
}

async function gifts(d) {
  // Guardería: Piedra Oval y Audinita
  await d.push(53, 9, 'up', 'lumina_guarderia');
  await d.talk(9, 6, 'up');
  await d.interact();
  await d.milestone('guarderia', (s) => (s.flags.b09_piedra_oval && s.flags.b09_audinita ? null : 'sin regalos de la guardería'));
  await d.leave(7, 10, 'down', 'ciudad_lumina');
  // Tienda de trastos: Rotom de noche
  await d.push(5, 9, 'up', 'lumina_trastos');
  await d.talk(3, 5, 'up', { watch: [{ re: /Un Rotom sale de la tele/, name: 'rotom', delay: 200 }] });
  await d.milestone('rotom', (s) => (s.flags.b09_rotom && s.partyList.includes('ROTOM') ? null : 'sin Rotom'));
  await d.leave(7, 10, 'down', 'ciudad_lumina');
  // De día: fósil y Sala de las Crónicas
  await nightRest(d, 'Mañana');
  await d.push(37, 23, 'up', 'lumina_museo');
  await d.talk(27, 7, 'up', { choose: () => 0 });
  await d.milestone('fosil', (s) => (s.flags.b09_fosil_craneo || s.flags.b09_fosil_coraza ? null : 'sin fósil revivido'));
  await d.leave(28, 16, 'down', 'ciudad_lumina');
  await d.push(36, 23, 'up', 'lumina_museo');
  await d.push(8, 15, 'right', 'lumina_museo_galeria');
  await d.pushTo(21, 5, 'up', 43, 11);
  await d.talk(44, 11, 'up', { choose: () => 0 });
  await d.expectSaid(/Los Custodios escribían para no olvidar/, 'Rosalía lee la Crónica');
  await d.milestone('cronicas', (s) => (s.map === 'lumina_museo_galeria' ? null : `mapa ${s.map}`));
}

// ───────────────────────────── Principal ─────────────────────────────

async function salida(d) {
  const s=await d.snap(),room=GALLERY.cronicas;
  if(s.map==='lumina_museo_galeria'&&s.x>=room.room[0]) {
    await d.pushTo(room.door.x,room.door.y,'down',room.back.x,room.back.y);
  }
  if((await d.snap()).map==='lumina_museo_galeria') {
    await d.push(GALLERY.fromHall.x,GALLERY.fromHall.y,'left','lumina_museo');
  }
  await d.travel('ciudad_lumina');await d.travel('ruta_8_marisma');
}

export async function runB09a(d){await refreshDriver(d);await installB09aObserver(d.page);await d.stages('B09a',{
 opcionales:async d=>{await collectLandCells(d,['cell_dunas_2','cell_ruta_6_1']);await d.travel('ruta_7');},
 ruta7,gala,gaelB3,t07,
 celulas:async d=>{await collectLandCells(d,['cell_lumina_1','cell_reserva_1']);await d.travel('ciudad_lumina');},
 t06,gifts,salida});}
