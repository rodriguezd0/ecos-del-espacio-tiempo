import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB11Observer} from './e2e_campaign_b11_page.mjs';
import {collectLandCells} from './e2e_campaign_cells.mjs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';


const RETRY=false, GENDER='M';
function defaultChoice(s) {
  const items = s.choices || [];
  const last = s.lastText || '';
  if (/mote/i.test(last)) return items.indexOf('No') >= 0 ? items.indexOf('No') : 1;
  if (items.includes('La casa de té')) return items.indexOf('La casa de té');
  if (items.includes('El Archivo Hondo')) {
    const log = s.recent || '';
    if (/escalera que se hunde/.test(log)) return items.indexOf('El Archivo Hondo');
    if (/círculo de piedras/.test(log)) return items.indexOf('El Santuario de los Glifos');
    if (/estanque redondo/.test(log)) return items.indexOf('El estanque de lotos');
  }
  return 0;
}

// ───────────────────────────── Tramos ─────────────────────────────

async function neblino(d) {
  await d.milestone('neblino_llegada', (s) => (s.map === 'ruta_9_neblino' ? null : `mapa ${s.map}`));
  await d.walkTo(23, 49);
  await d.expectSaid(/La niebla se ha retirado/, 'la llegada sin niebla');
  // Nilo, de noche, en su escondite junto al río.
  const nilo = [{ re: /No me delates/, name: 'nilo_escondido', delay: 200 }];
  await d.walkTo(13, 18, { face: 'up' });
  await d.interact({ watch: nilo });
  await d.expectSaid(/Me llamo Nilo/, 'la presentación de Nilo');
  await d.interact();
  await d.expectSaid(/subimos a la Ruta 10/, 'la segunda pista de Nilo');
  await d.milestone('t10_pistas', (s) => (s.flags.b11_t10_nilo_cuenta ? null : 'sin la segunda pista'));
  // C047: la loma del tronco hueco (Trepar).
  await d.climb(35, 11, 'up', [35, 7]);
  await d.walkTo(35, 6);
  await d.settle();
  await d.milestone('c047', (s) => (s.cells.includes('cell_neblino_1') ? null : 'sin C047'));
  await d.climb(35, 7, 'down', [35, 11]);
  await d.walkTo(21, 0);
  await d.crossEdge('up', 'ruta_10');
}

async function ruta10(d) {
  // Sin pista de Zygarde hacia casa (Zygarde habla muy poco): se sube del sendero del Neblino.
  const s0 = await d.snapState();
  if (s0.y > 30) await d.walkTo(21, 29);
  await d.climb(30, 17, 'up', [30, 13]);
  await d.milestone('ruta10_alto');
  // C049 en la repisa de la pared de raíces.
  await d.climb(15, 6, 'up', [15, 2]);
  await d.walkTo(14, 1);
  await d.settle();
  await d.milestone('c049', (s) => (s.cells.includes('cell_ruta_10_2') ? null : 'sin C049'));
  await d.climb(15, 2, 'down', [15, 6]);
  // Alarma a propósito: esperar a que el centinela 2 mire abajo y pisar su línea.
  await d.walkTo(39, 12);
  const end = Date.now() + 20000;
  while (Date.now() < end) {
    const dir = await d.eval(() => window.__b11.eventPos('centinela_2')?.dir);
    if (dir === 2) break;
    await d.wait(60);
  }
  await d.step(6);
  await d.settle({ watch: [{ re: /voz de alarma/, name: 't10_alarma', delay: 200 }] });
  await d.expectSaid(/voz de alarma/, 'la alarma del centinela');
  await d.milestone('t10_punto_seguro', (s) => (s.x === 31 && s.y === 13 ? null : `tras la alarma en (${s.x},${s.y})`));
  // Sigilo: planificador con el reloj de los centinelas.
  for (let n = 0; n < 400; n++) {
    const s = await d.snapState();
    if (s.busy || s.top !== 'MapScene') throw new Error(`El sigilo ha fallado en (${s.x},${s.y}): ${s.lastText}`);
    if (s.x === 46 && s.y === 7) break;
    const a = await d.eval(() => window.__b11.stealthNext(46, 7));
    if (a === null) throw new Error(`Sin plan de sigilo desde (${s.x},${s.y})`);
    if (a === 0) { await d.wait(70); continue; }
    await d.step(a);
  }
  await d.milestone('t10_sigilo', (s) => (s.x === 46 && s.y === 7 ? null : `no se llegó a la cornisa: (${s.x},${s.y})`));
  await d.climb(46, 7, 'up', [46, 3]);
  // La cuadrilla.
  await d.walkTo(44, 3, { face: 'up' });
  await d.interact({ watch: [{ re: /tiende vetas verdes/, name: 't10_cuadrilla', delay: 200 }] });
  await d.milestone('t10_rescate', (s) => (s.flags.b11_t10_cuadrilla ? null : 'sin rescate'));
  // El Honchkrow Alfa y la Tabla Oscura.
  await d.walkTo(48, 1, { face: 'right' });
  await d.interact({ watch: [{ scene: 'BattleScene', name: 't10_alfa', delay: 4000 }] });
  await d.milestone('t10_alfa', (s) => (s.flags.b11_t10_alfa ? null : 'el Alfa sigue en pie'));
  await d.walkTo(48, 2, { face: 'right' });
  await d.interact({ watch: [{ re: /Tabla Oscura/, name: 't10_tabla', delay: 400 }, { re: /planos de la Estación Talasa/, name: 't10_nilo', delay: 200 }] });
  await d.expectSaid(/Lo dejo\./, 'la deserción de Nilo');
  await d.milestone('t10_resuelto', (s) => {
    if (!s.tablets.includes('DREADPLATE')) return 'sin Tabla Oscura';
    return s.flags.b11_nilo_desertor && s.flags.b11_planos_talasa ? null : 'Nilo no ha desertado';
  });
  await d.climb(30, 13, 'down', [30, 17]);
  await d.walkTo(59, 20);
  await d.crossEdge('right', 'ruta_1');
}

async function villa(d) {
  await d.walkTo(14, 0);
  await d.crossEdge('up', 'villa_alba');
  await d.settle();
  await d.milestone('regreso_casa', (s) => (s.flags.b11_regreso ? null : 'sin b11_regreso'));
  // Casa: Mamá y el huevo de Togepi.
  await d.walkTo(10, 26);
  await d.exitTo('up', 'casa_prota_1f');
  await d.settle({ watch: [{ re: /Una Togepi puso un huevo/, name: 'huevo_mama', delay: 200 }] });
  await d.expectSaid(/Una Togepi puso un huevo en el jardín y no ha vuelto\. Creo que es para ti\./, 'la frase de Mamá');
  await d.milestone('huevo', (s) => (s.partyFull.some((p) => p.egg && p.species === 'TOGEPI') ? null : 'sin huevo en el equipo'));
  await d.walkTo(7, 10);
  await d.exitTo('down', 'villa_alba');
  await d.settle();
  // Laboratorio: Gael frente a Alerce.
  await d.walkTo(37, 19);
  await d.exitTo('up', 'laboratorio_alerce');
  await d.settle({ watch: [{ re: /Sabía de qué eran capaces/, name: 'gael_alerce', delay: 100 }] });
  await d.expectSaid(/Usted sabía quiénes eran desde el principio\./, 'la acusación de Gael');
  await d.expectSaid(/Sabía de qué eran capaces\./, 'la respuesta de Alerce');
  await d.milestone('laboratorio', (s) => (s.flags.b11_gael_alerce ? null : 'sin la escena del laboratorio'));
  await d.walkTo(9, 13);
  await d.exitTo('down', 'villa_alba');
  await d.settle();
}

async function campamento(d) {
  await d.walkTo(22, 35);
  await d.crossEdge('down', 'ruta_1');
  await d.walkTo(0, 16);
  await d.crossEdge('left', 'ruta_10');
  await d.climb(30, 17, 'up', [30, 13]);
  await d.walkTo(0, 7);
  await d.crossEdge('left', 'campamento_monte');
  const watch = [
    { re: /EXP-03, sellada y registrada/, name: 'exp03', delay: 200 },
    { re: /Intenté subir/, name: 'gael_monte', delay: 200 },
    { scene: 'BattleScene', name: 'gael_b4', delay: 4000 },
  ];
  await d.walkTo(34, 7, { watch, stopWhen: (s) => s.flags.b11_gael_b4 });
  await d.settle({ watch });
  await d.expectSaid(/Cuando vuelvas, cuéntame qué hay\./, 'la frase de Gael');
  await d.expectSaid(/…No\. Da igual\./, 'el final de Gael');
  await d.milestone('gael_b4', (s) => {
    if (!s.flags.b11_exp03) return 'Genesis no se ha llevado EXP-03';
    if (RETRY && !s.lost.includes('b11_gael_b4')) return 'no se simuló la derrota';
    return s.flags.b11_gael_b4 ? null : 'sin b11_gael_b4';
  });
  // La senda del Monte, abierta: sube a la explanada del prólogo y vuelve.
  await d.walkTo(10, 1);
  await d.exitTo('up', 'montana_portal');
  await d.settle();
  await d.milestone('monte_portal');
  await d.walkTo(17, 49);
  await d.press('ArrowDown', 600);
  await d.until((s) => s.map === 'campamento_monte' && s.ready, { timeout: 15000, what: 'volver al campamento' });
  await d.settle();
  await d.milestone('campamento_recogido', (s) => (s.flags.b11_gael_b4 ? null : 'sin salida'));
}

async function t09(d) {
 await d.exitTo('right','ruta_10'); await d.climb(30,13,'down',[30,17]); await d.travel('aldea_mnemos'); await d.walkTo(5,20,{face:'up'});
  await d.exitTo('up', 'mnemos_casa_iker'); // puerta de la casa de Íker (B10: ikerDoorEvent)
  await d.settle();
  await d.milestone('casa_iker');
  const recentChoose = async () => {
    const log = (await d.log()).slice(-3).map((l) => l.text).join(' ');
    return (s) => defaultChoice({ ...s, recent: log });
  };
  await d.walkTo(10, 5, { face: 'up' });
  // Cada dibujo lleva su pregunta: se elige leyendo el texto del dibujo recién mostrado.
  await d.press('KeyZ', 300);
  for (let guard = 0; guard < 200; guard++) {
    const s = await d.snapState();
    if (s.top === 'MapScene' && s.ready && !s.busy) break;
    if (s.top === 'ChoiceScene') {
      const choose = await recentChoose();
      const want = choose(s);
      for (let i = s.choiceIndex; i < want; i++) await d.press('ArrowDown', 110);
      await d.press('KeyZ', 250);
      continue;
    }
    if (s.top === 'MessageScene') await d.press('KeyZ', 150);
    else await d.wait(120);
  }
  await d.settle();
  await d.expectSaid(/¡La casa de té!/, 'la deducción del pozo');
  await d.milestone('t09_pozo_deducido', (s) => (s.flags.b11_t09_pozo_deducido ? null : 'sin deducción'));
  await d.walkTo(7, 10);
  await d.exitTo('down', 'aldea_mnemos');
  await d.settle();
  // Casa de té: el Musharna abre el pozo.
  await d.walkTo(7, 33);
  await d.exitTo('up', 'mnemos_casa_te');
  await d.settle();
  await d.walkTo(11, 9, { face: 'right' });
  await d.interact({ watch: [{ re: /escalera de piedra que baja/, name: 't09_musharna', delay: 200 }] });
  await d.until((s) => s.map === 'mnemos_pozo_custodios' && s.ready, { timeout: 15000, what: 'bajar al pozo' });
  await d.settle();
  await d.walkTo(8, 5, { face: 'up' });
  await d.interact({ watch: [{ re: /Tabla Mental/, name: 't09_tabla', delay: 400 }] });
  await d.milestone('t09_tabla', (s) => (s.tablets.includes('MINDPLATE') ? null : 'sin Tabla Mental'));
  await d.walkTo(8, 12);
  await d.step(2);
  await d.settle();
  await d.until((s) => s.map === 'mnemos_casa_te' && s.ready, { timeout: 15000, what: 'volver a la casa de té' });
  await d.settle();
  await d.walkTo(7, 10);
  await d.exitTo('down', 'aldea_mnemos');
  await d.settle();
  await d.walkTo(5, 20, { face: 'up' });
  await d.exitTo('up', 'mnemos_casa_iker');
  await d.settle({ watch: [{ re: /la Mnemos de antes se ha ido/, name: 't09_iker', delay: 200 }] });
  const items = await d.eval(() => window.__b11.items('CHIMECHITE'));
  await d.milestone('t09_resuelto', (s) => (s.flags.b11_t09_iker_curado && items === 1 ? null : `curado ${s.flags.b11_t09_iker_curado}, Chimechita ${items}`));
}

async function cerro(d) {
 await d.exitTo('aldea_mnemos'); await d.travel('ruta_1'); await d.walkTo(23,7,{face:'right'});
  await d.interact();
  await d.until((s) => s.map === 'cerro_alba' && s.ready, { timeout: 15000, what: 'subir al Cerro del Alba' });
  await d.settle();
  await d.expectSaid(/tejados de Villa Alba/, 'la llegada al cerro');
  await d.climb(11, 23, 'up', [11, 19]);
  await d.walkTo(18, 15);
  await d.settle();
  await d.milestone('c054', (s) => (s.cells.includes('cell_cerro_alba_1') ? null : 'sin C054'));
  await d.walkTo(12, 5, { face: 'up' });
  await d.interact();
  await d.expectSaid(/brasero antiguo/, 'el brasero');
  await d.climb(11, 19, 'down', [11, 23]);
  await d.walkTo(5, 28);
  await d.step(2);
  await d.settle();
  await d.until((s) => s.map === 'ruta_1' && s.ready, { timeout: 15000, what: 'bajar a la Ruta 1' });
  await d.settle();
  await d.milestone('cerro_bajada', (s) => (s.x === 23 && s.y === 7 ? null : `(${s.x},${s.y})`));
}

const STAGES = { neblino, ruta10, villa, campamento, t09, cerro };

// ───────────────────────────── Principal ─────────────────────────────


export async function runB11(d){await refreshDriver(d); await installB11Observer(d.page); await d.stages('B11',{preparar:async d=>{await d.travel('mnemos_centro');if((await d.snap()).partyList.length===6)await d.depositAtPC('EEVEE');await d.travel('ruta_9_neblino');await d.rest('mnemos_centro','Noche');},neblino,ruta10,villa,campamento,t09,cerro,
 opcionales:async d=>{await collectLandCells(d,['cell_ruta_1_5','cell_ruta_1_6','cell_ruta_10_1','cell_neblino_2','cell_garganta_3','cell_ruta_6_2']);}
 });}
