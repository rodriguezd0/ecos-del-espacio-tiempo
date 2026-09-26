// Tramos del E2E del Bloque 13 en la costa, el mar y la Estación Talasa (docs/CAMPANA.md B13): muelle de buzos (aviso
// del Core antes de N4) → a nado al Mar del Sur (llamada de Alerce) → células C061, C062, C057 y C058 → Talasa (Alerce
// llega en barca: «Esta vez voy yo.») → técnico del control → invernadero (investigadora y consola: compuerta) →
// despacho (foto del «Proyecto Laguna», tarjeta) → C060 → C059 y laboratorio (Casia y Garrido; doble con Alerce, derrota
// simulada y reintento desde la puerta; escena clave a mitad del combate; Vértice en pantalla; N4) → despedida al
// atardecer (Porygon de Nilo; «…Ha dejado de contestar.») → a nado de vuelta a Caleta → resonancia del Buceo → Ramón.
import * as MAR from '../game/src/content/maps/b13/mar_layout.js';
import * as TAL from '../game/src/content/maps/b13/talasa_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';
import { GREENHOUSE, OFFICE } from '../game/src/content/events/b13_talasa_interiores.js';
import { LAB } from '../game/src/content/events/b13_talasa_lab.js';
import { prefer } from './e2e_b13_driver.mjs';

const need = (ok, msg) => (ok ? null : msg);
const flag = (s, k) => Boolean(s.flags[k]);
const hasCell = (s, key) => s.cells.includes(key);

/** Cruza del mapa actual al vecino nadando por la casilla de borde (x, y). */
export async function swimAcross(d, x, y, dir, toMap) {
  await d.swimTo(x, y);
  await d.crossEdge(dir, toMap);
}

// ───────────────────────────── Caleta → Mar del Sur ─────────────────────────────

export async function mar(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'caleta_sonda' && s.ready, { timeout: 30000, what: 'Caleta Sonda' });
  await d.settle();
  const r = CL.DIVERS.resonance;
  await d.walkTo(r.x, r.y);
  await d.settle();
  await d.expectSaid(/Al final del muelle, el agua baja muy honda/, 'el aviso del muelle antes de N4');
  await d.milestone('muelle_aviso', (s) => need(flag(s, 'b13_buceo_pista') && !flag(s, 'b13_dive_resonance'), 'sin el aviso del muelle'));
  await d.turn('down');
  await d.interact({ choose: prefer('Sí') });
  await d.until((s) => s.surfing, { timeout: 8000, what: 'nadar desde el muelle' });
  const watch = [{ re: /Es una llamada del Prof\. Alerce/, name: 'llamada_alerce', delay: 200 }];
  await d.crossEdge('down', 'mar_del_sur', { watch });
  await d.settle({ watch });
  await d.expectSaid(/Me ha escrito un tal Nilo/, 'los planos de Nilo en la llamada');
  await d.expectSaid(/No entres (solo|sola) en esa estación/, 'el aviso de Alerce');
  await d.milestone('mar_llamada', (s) => need(flag(s, 'b13_mar_llamada') && s.map === 'mar_del_sur', 'sin la llamada'));
  for (const c of [MAR.CELLS.c061, MAR.CELLS.c062, MAR.CELLS.c057, MAR.CELLS.c058]) {
    await d.swimTo(c.x, c.y);
    await d.settle();
    const s = await d.snapState();
    if (!hasCell(s, c.key)) throw new Error(`sin la célula ${c.key} en (${c.x},${c.y})`);
    if (c === MAR.CELLS.c062) await d.shot('c062_banco');
  }
  await d.milestone('mar_celulas', (s) => need(['c061', 'c062', 'c057', 'c058'].every((k) => hasCell(s, MAR.CELLS[k].key)), 'faltan células del mar'));
  // Hacia Talasa: el borde sur del sector centro cae sobre el norte de la estación (x − 76).
  const talasa = MAR.LINKS.south.find((l) => l.to === 'estacion_talasa');
  await swimAcross(d, talasa.offset + TAL.JETTY.x + 1, MAR.H - 1, 'down', 'estacion_talasa');
}

// ───────────────────────────── Estación Talasa ─────────────────────────────

export async function talasaArrival(d) {
  await d.until((s) => s.map === 'estacion_talasa' && s.ready, { timeout: 30000, what: 'la Estación Talasa' });
  const s = await d.settle();
  if (s.surfing) await d.swimTo(TAL.JETTY.x + 1, TAL.JETTY.y);
  const watch = [{ re: /^Esta vez voy yo\.$/, name: 'alerce_barca', delay: 200 }];
  await d.walkTo(TAL.ARRIVAL.trigger[1][0], TAL.ARRIVAL.trigger[1][1], { watch });
  await d.settle({ watch });
  await d.expectSaid(/^Esta vez voy yo\.$/, '«Esta vez voy yo.»');
  await d.expectSaid(/Según los planos de Nilo/, 'los planos en boca de Alerce');
  await d.expectSaid(/Yo me quedo en la barca/, 'Nilo en la barca');
  await d.milestone('talasa_llegada', (s) => need(flag(s, 'b13_talasa_llegada'), 'Alerce no ha llegado'));
}

async function greenhouse(d) {
  const door = TAL.BUILDINGS.greenhouse.door;
  const watch = [{ scene: 'BattleScene', name: 'tecnico_control', delay: 2500 }];
  await d.push(door.x, door.y + 1, 'up', 'talasa_invernadero', { watch });
  // La consola no obedece mientras la investigadora vigila.
  await d.talkTo(GREENHOUSE.researcher.x, GREENHOUSE.researcher.y, { watch: [{ scene: 'BattleScene', name: 'investigadora', delay: 2500 }] });
  await d.talk(GREENHOUSE.console.x, GREENHOUSE.console.y + 1, 'up', { choose: prefer('Sí') });
  await d.expectSaid(/la compuerta de la cubierta sur se repliega/, 'la compuerta abriéndose');
  await d.milestone('invernadero_compuerta', (s) => need(flag(s, 'b13_talasa_invernadero'), 'la compuerta sigue cerrada'));
  await d.leave(GREENHOUSE.door.x, GREENHOUSE.door.y, 'down', 'estacion_talasa');
}

async function office(d) {
  const door = TAL.BUILDINGS.tower.door;
  await d.push(door.x, door.y + 1, 'up', 'talasa_despacho');
  await d.talk(OFFICE.photoFrom.x, OFFICE.photoFrom.y, 'up', { watch: [{ re: /Proyecto Laguna/, name: 'foto_laguna', delay: 200 }] });
  await d.expectSaid(/rostros está rascado hasta el cartón/, 'el rostro rascado');
  await d.expectSaid(/Como el que Alerce lleva siempre en el bolsillo/, 'el cuaderno verde');
  await d.expectSaid(/^Alerce no se gira\.$/, '«Alerce no se gira.»');
  await d.talk(OFFICE.deskFront.x, OFFICE.deskFront.y, 'up');
  await d.milestone('tarjeta_direccion', (s) => need(flag(s, 'b13_talasa_tarjeta') && flag(s, 'b13_talasa_foto'), 'sin tarjeta o sin foto'));
  await d.leave(OFFICE.door.x, OFFICE.door.y, 'down', 'estacion_talasa');
}

async function laboratory(d, retry) {
  const c60 = TAL.CELLS.c060;
  await d.walkTo(c60.x, c60.y);
  await d.settle();
  const lab = TAL.BUILDINGS.lab.door;
  const c59 = TAL.CELLS.c059;
  const watch = [
    { re: /MUESTRA Z-4/, name: 'tanque_z4', delay: 200 },
    { scene: 'BattleScene', name: 'doble_alerce', delay: 4000 },
    { re: /Sigue calibrando a mano/, name: 'escena_calibrar', delay: 100 },
    { re: /Aurelio Vértice/, name: 'vertice_pantalla', delay: 300 },
  ];
  await d.push(c59.x, c59.y, 'up', 'talasa_laboratorio', { watch });
  await d.settle({ watch });
  let s = await d.snapState();
  if (!flag(s, 'b13_talasa_n4') && s.map === 'talasa_laboratorio') {
    if (retry) {
      await d.milestone('lab_reintento', (st) => need(st.lost.includes('b13_casia') && st.x === LAB.retry.x && st.y === LAB.retry.y,
        `tras perder: (${st.x},${st.y}), derrotas ${st.lost}`));
      await d.expectSaid(/Otra vez\. Son dos, pero nosotros también\./, 'el ánimo de Alerce al perder');
    }
    await d.talkTo(LAB.alerceDoor.x, LAB.alerceDoor.y, { choose: prefer('Sí'), watch });
    s = await d.snapState();
  }
  await d.expectSaid(/Sigue calibrando a mano\? Vértice siempre decía que usted era el único que sabía escuchar a los Pilares/, 'la frase de Casia');
  await d.expectSaid(/^Alerce: «Ya no\.»$/, '«Ya no.»');
  await d.expectSaid(/No mira los mandos ni una sola vez/, 'Alerce abre el tanque sin mirar');
  await d.expectSaid(/Déjales el núcleo\. Ya hemos aprendido lo que necesitábamos\./, 'Vértice en la pantalla');
  const battles = await d.eval(() => window.__b13.battles.slice());
  const dbl = battles.find((b) => b.trainers.includes('b13_casia'));
  if (!dbl || dbl.format !== 'double' || dbl.ally !== 'Alerce' || dbl.phases !== 1) throw new Error(`combate doble mal formado: ${JSON.stringify(dbl)}`);
}

export async function talasa(d, { retry = true } = {}) {
  await greenhouse(d);
  await office(d);
  await laboratory(d, retry);
  const watch = [{ re: /Ha dejado de contestar/, name: 'despedida_gael', delay: 200 }];
  await d.until((s) => s.map === 'estacion_talasa' && s.ready, { timeout: 30000, what: 'volver al embarcadero' });
  await d.settle({ watch, choose: prefer('No', 'Sí') });
  await d.expectSaid(/Era del laboratorio\. No puedo quedármelo\./, 'el Porygon de Nilo');
  await d.expectSaid(/^…Ha dejado de contestar\.$/, '«…Ha dejado de contestar.»');
  await d.milestone('talasa_salida', (s) => need(flag(s, 'b13_talasa') && flag(s, 'zyg_core_4') && flag(s, 'b13_nilo_porygon')
    && s.party.some((p) => p.startsWith('PORYGON:40')) && s.hour >= 19 && hasCell(s, TAL.CELLS.c059.key) && hasCell(s, TAL.CELLS.c060.key),
  `salida ${flag(s, 'b13_talasa')}, N4 ${flag(s, 'zyg_core_4')}, equipo ${s.party}, hora ${s.hour}`));
}

// ───────────────────────────── De vuelta a Caleta: resonancia del Buceo y Ramón ─────────────────────────────

export async function caleta(d) {
  let s = await d.snapState();
  if (s.map === 'estacion_talasa') {
    await d.walkTo(TAL.JETTY.x + 1, TAL.JETTY.y, { face: 'up' });
    await d.interact({ choose: prefer('Sí') });
    await d.until((st) => st.surfing, { timeout: 8000, what: 'nadar desde el pantalán' });
    await swimAcross(d, TAL.JETTY.x + 1, 0, 'up', 'mar_del_sur');
    await swimAcross(d, CL.DIVERS.resonance.x, 0, 'up', 'caleta_sonda');
  }
  const r = CL.DIVERS.resonance;
  const watch = [{ re: /como una burbuja/, name: 'resonancia_buceo', delay: 300 }];
  await d.swimTo(r.x, r.y, { watch });
  await d.settle({ watch });
  s = await d.snapState();
  if (!flag(s, 'b13_dive_resonance')) {
    await d.walkTo(r.x, r.y - 1);
    await d.walkTo(r.x, r.y, { watch });
    await d.settle({ watch });
  }
  await d.expectSaid(/El campo verde de Zygarde te envuelve/, 'la resonancia del muelle');
  await d.milestone('buceo_resonancia', (st) => need(flag(st, 'b13_dive_resonance') && st.abilities.dive === true && flag(st, 'zyg_dive'),
    `hito ${flag(st, 'b13_dive_resonance')}, Buceo ${st.abilities.dive}, células ${st.cellCount}`));
  await d.expectSaid(/Con eso podrías bajar al bosque de algas/, 'el buzo tras la burbuja');
  // Ramón (Faro): la segunda pista de T11.
  const fa = CL.BUILDINGS.faro.door;
  await d.push(fa.x, fa.y + 1, 'up', 'caleta_faro');
  await d.talk(4, 6, 'up', { watch: [{ re: /Mi nieta, Lucía/, name: 'ramon_t11', delay: 200 }] });
  await d.milestone('t11_ramon', (st) => need(flag(st, 'b13_t11_ramon') && st.clues.some((c) => c.id === 'T11' && c.step === 2), 'sin la segunda pista de T11'));
  await d.leave(6, 9, 'down', 'caleta_sonda');
}
