import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB10Observer} from './e2e_campaign_b10_page.mjs?routes=2';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { NPC, BUILDINGS, BAMBOO, RISCO, EXITS, FOG_WALL_Y, INTERIOR_ENTRIES } from '../game/src/content/maps/b10/mnemos_layout.js';
import { ARCHIVO_ROOM } from '../game/src/content/maps/b10/archivo_layout.js';
import { SUELO, MANOS, LECTURA, ROLLOS, MURAL, NUCLEO, MEMORIA_STAIRS, ENTRY } from '../game/src/content/maps/b10/hondo_layout.js';
import {
  GLYPH_SEQUENCE, DOOR_GLYPHS, SCROLL_SEQUENCE, SCROLL_COLORS, LEVER_TARGET, LEVER_START,
} from '../game/src/content/events/b10_hondo_logic.js';


const RETRY=false, GENDER='M';
async function mnemos(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'aldea_mnemos' && s.ready, { timeout: 30000, what: 'Aldea Mnemos' });
  await d.settle({ watch: [{ re: /niebla fina/, name: 'llegada_niebla', delay: 300 }] });
  await d.expectSaid(/Una niebla fina cubre la aldea/, 'la llegada con la niebla');
  await d.expectSaid(/Me llamo… eh… Fausta/, 'Fausta, que olvida su nombre');
  const fog = await d.eval(() => window.__b10.fog());
  await d.milestone('llegada', (s) => (s.flags.b10_llegada && fog ? null : `llegada ${s.flags.b10_llegada}, niebla ${fog}`));
  // El camino del norte da vueltas: la niebla devuelve a la aldea.
  await d.walkTo(EXITS.north.x0, FOG_WALL_Y + 1, { face: 'up' });
  await d.step(8);
  await d.settle();
  await d.expectSaid(/no ves ni tus pies/, 'el bucle de la niebla');
  await d.milestone('niebla_bucle', (s) => (s.y > FOG_WALL_Y + 1 ? null : `no ha vuelto: (${s.x},${s.y})`));
  // Olvido en la plaza.
  await d.talkTo(NPC.olvido.x, NPC.olvido.y, { watch: [{ re: /Olvido Arrieta/, name: 'olvido', delay: 200 }] });
  await d.expectSaid(/Repártelas y te abro el Archivo/, 'el encargo de las notas');
  await d.milestone('encargo_notas', (s) => (s.flags.b10_olvido_conocida ? null : 'sin b10_olvido_conocida'));
}

async function notes(d) {
  // Bruno y Bambú, junto al estanque.
  await d.talkTo(NPC.bruno.x, NPC.bruno.y);
  await d.expectSaid(/Tu Pancham se llama Bambú/, 'la nota de Bruno');
  // Jacinta.
  await d.enterDoor(BUILDINGS.jacinta.door, 'mnemos_casa_jacinta');
  await d.talkTo(2, 6);
  await d.expectSaid(/Tu nieta se llama Nerea/, 'la nota de Jacinta');
  await d.exitInterior(INTERIOR_ENTRIES.mnemos_casa_jacinta, 'aldea_mnemos');
  // Amaro, en el Santuario de los Glifos (terraza, escalera roja).
  await d.enterDoor(BUILDINGS.santuario.door, 'mnemos_santuario');
  await d.talkTo(6, 13);
  await d.expectSaid(/Te llamas Amaro/, 'la nota de Amaro');
  await d.exitInterior(INTERIOR_ENTRIES.mnemos_santuario, 'aldea_mnemos');
  // Tomé, en el herbolario.
  await d.enterDoor(BUILDINGS.herbolario.door, 'mnemos_herbolario');
  await d.talkTo(6, 5);
  await d.expectSaid(/Tu aprendiz se llama Elio/, 'la nota de Tomé');
  await d.exitInterior(INTERIOR_ENTRIES.mnemos_herbolario, 'aldea_mnemos');
  // Sabina, en la casa de té: nota y Sinistea.
  await d.enterDoor(BUILDINGS.te.door, 'mnemos_casa_te');
  await d.talkTo(7, 4, { watch: [{ re: /Sinistea se coló/, name: 'sabina_sinistea', delay: 200 }] });
  await d.expectSaid(/Te llamas Sabina/, 'la nota de Sabina');
  await d.milestone('notas_repartidas', (s) => {
    const missing = ['sabina', 'tome', 'jacinta', 'amaro', 'bruno'].filter((k) => !s.flags[`b10_nota_${k}`]);
    if (missing.length) return `faltan ${missing.join(', ')}`;
    return s.party.includes('SINISTEA') || s.boxedPokemon?.some(p=>p.species==='SINISTEA') ? null : 'sin Sinistea en equipo ni PC';
  });
  await d.exitInterior(INTERIOR_ENTRIES.mnemos_casa_te, 'aldea_mnemos');
  // C045 en el claro del bambú, tras la casa de té.
  await d.walkTo(BAMBOO.clearing.x, BAMBOO.clearing.y);
  await d.settle();
  await d.milestone('c045', (s) => (s.cells.includes('cell_mnemos_1') ? null : 'sin C045'));
  // Olvido abre el Archivo.
  await d.talkTo(NPC.olvido.x, NPC.olvido.y);
  await d.expectSaid(/Cinco de cinco/, 'Olvido con las cinco notas');
  await d.milestone('archivo_abierto', (s) => (s.flags.b10_archivo_abierto ? null : 'sin b10_archivo_abierto'));
}

async function archivo(d) {
  const watch = [
    { re: /Nosotros también salvamos lo que se pierde/, name: 'casia_cameo', delay: 200 },
    { scene: 'BattleScene', name: 'combate_tecnico', delay: 3500 },
  ];
  await d.enterDoor(BUILDINGS.archivo.door, 'mnemos_archivo');
  await d.settle({ watch });
  await d.expectSaid(/Nosotros también salvamos lo que se pierde\./, 'el cameo de Casia');
  await d.expectSaid(/Te espero en lo alto, donde duerme la piedra/, 'Olvido sube por su camino');
  await d.milestone('casia', (s) => (s.flags.b10_casia && s.flags.b10_olvido_baja ? null : 'sin cameo'));
  // Escalera de la primera planta a los recuerdos del segundo piso.
  await d.walkTo(ARCHIVO_ROOM.stairsWarp.x - 1, ARCHIVO_ROOM.stairsWarp.y, { face: 'right', watch });
  await d.step(6);
  await d.until((s) => s.map === 'archivo_hondo' && s.ready, { timeout: 15000, what: 'subir a los recuerdos del Archivo Hondo' });
  await d.settle();
  // Volver antes de resolver los recuerdos comprueba la llegada nueva junto a la escalera del piso 1.
  const [x, y] = ENTRY.exitTiles[1];
  await d.walkTo(x, y);
  await d.step(8);
  await d.until((s) => s.map === 'mnemos_archivo' && s.ready, { timeout: 15000, what: 'bajar al Archivo de papel' });
  await d.settle();
  await d.milestone('regreso_piso_1', (s) => (s.x === ARCHIVO_ROOM.stairsArrival.x && s.y === ARCHIVO_ROOM.stairsArrival.y ? null : `llegada (${s.x},${s.y})`));
  await d.walkTo(ARCHIVO_ROOM.stairsWarp.x - 1, ARCHIVO_ROOM.stairsWarp.y, { face: 'right', watch });
  await d.step(6);
  await d.until((s) => s.map === 'archivo_hondo' && s.ready, { timeout: 15000, what: 'volver al segundo piso' });
  await d.settle();
}

// ───────────────────────────── Archivo Hondo ─────────────────────────────

async function suelo(d) {
  await refreshDriver(d); await installB10Observer(d.page);
  await d.milestone('hondo_llegada');
  // Eco del custodio: la losa de recuerdo.
  await d.walkTo(SUELO.losa.x, SUELO.losa.y, { watch: [{ re: /papel viejo/, name: 'eco_suelo', delay: 1400 }] });
  await d.settle({ watch: [{ re: /papel viejo/, name: 'eco_suelo', delay: 1400 }] });
  // Un paso en falso: se cae y vuelve al borde.
  await d.walkTo(SUELO.start.x, SUELO.start.y);
  await d.walkTo(SUELO.start.x, SUELO.start.y - 1);
  await d.stepsExact(['right']);
  await d.settle();
  await d.expectSaid(/El suelo no estaba ahí/, 'la caída del Suelo Olvidado');
  let s = await d.snapState();
  if (!(s.x === SUELO.start.x && s.y === SUELO.start.y)) throw new Error(`La caída no devuelve al borde: (${s.x},${s.y})`);
  // Caminar permite recalcular desde la posición observada si Chrome entrega
  // tarde una pulsación. La ruta evita las trampas reales y reproduce el camino
  // del custodio; no se avanza por un contador de pasos después de una caída.
  await d.page.keyboard.up('ShiftLeft');
  try { await d.walkTo(SUELO.exit.x, SUELO.exit.y); }
  finally { await d.page.keyboard.down('ShiftLeft'); }
  await d.settle();
  s = await d.milestone('suelo_cruzado', (st) => (st.flags.b10_suelo ? null : `sin b10_suelo en (${st.x},${st.y})`));
}

async function manos(d) {
  await d.walkTo(MANOS.losa.x, MANOS.losa.y, { watch: [{ re: /papel viejo/, name: 'eco_manos', delay: 2600 }] });
  await d.settle({ watch: [{ re: /papel viejo/, name: 'eco_manos', delay: 2600 }] });
  await d.expectSaid(/Las palancas vuelven a donde tú las dejaste/, 'el eco de las Dos Manos');
  for (let i = 0; i < 2; i++) {
    const lv = MANOS.levers[i];
    await d.walkTo(lv.x, lv.y + 1, { face: 'up' });
    const pulls = (LEVER_TARGET[i] - LEVER_START[i] + 4) % 4;
    for (let k = 0; k < pulls; k++) await d.interact();
  }
  await d.expectSaid(/la losa del dintel se hunde/, 'la losa de las Dos Manos');
  await d.milestone('dos_manos', (s) => (s.flags.b10_manos ? null : `palancas ${JSON.stringify(s.vars)}`));
}

async function lectura(d) {
  await d.walkTo(LECTURA.losa.x, LECTURA.losa.y, { watch: [{ re: /diez piedras/, name: 'eco_lectura', delay: 300 }] });
  await d.settle({ watch: [{ re: /diez piedras/, name: 'eco_lectura', delay: 300 }] });
  await d.expectSaid(/flauta.*se rompió en diez/, 'el relato de la custodia');
  await d.walkTo(LECTURA.door.x, LECTURA.door.y - 1, { face: 'down' });
  // Un glifo fuera de orden apaga la puerta.
  if (RETRY) {
    // Tras un glifo equivocado la puerta se apaga y el guion termina: no hay más elecciones.
    const wrong = DOOR_GLYPHS.indexOf(GLYPH_SEQUENCE[2]);
    await d.interact({ choose: () => wrong });
    await d.expectSaid(/todos los glifos se apagan/, 'el error de la puerta');
  }
  // La elección sale del paso guardado (b10_glifo_paso), no de un contador: con la máquina cargada `settle` puede
  // ver la misma elección dos veces antes de que llegue la pulsación, y un contador se adelantaría.
  const order = GLYPH_SEQUENCE.map((g) => DOOR_GLYPHS.indexOf(g));
  const glyphFor = (s) => order[Math.min(Number(s.vars?.b10_glifo_paso) || 0, order.length - 1)];
  await d.interact({ choose: glyphFor, watch: [{ re: /a ras del suelo, sin un ruido/, name: 'puerta_glifica', delay: 200 }] });
  await d.expectSaid(/El relato queda copiado en la Libreta/, 'el relato en la Libreta');
  await d.milestone('lectura', (s) => (s.flags.b10_lectura ? null : 'sin b10_lectura'));
}

async function rollos(d) {
  await d.walkTo(ROLLOS.losa.x, ROLLOS.losa.y, { watch: [{ re: /papel viejo/, name: 'eco_rollos', delay: 4000 }] });
  await d.settle({ watch: [{ re: /papel viejo/, name: 'eco_rollos', delay: 4000 }] });
  await d.expectSaid(/solo quedan los rollos que has puesto tú/, 'el eco de los Rollos');
  const placed = [];
  for (const { color, cubby } of SCROLL_SEQUENCE) {
    const c = ROLLOS.cubbies[cubby];
    await d.walkTo(c.x, c.y + 1, { face: 'up' });
    const left = SCROLL_COLORS.filter((x) => !placed.includes(x));
    await d.interact({ choose: () => left.indexOf(color) });
    placed.push(color);
  }
  await d.expectSaid(/la losa del dintel del noroeste se retira/, 'la losa de los Rollos');
  await d.milestone('rollos', (s) => (s.flags.b10_rollos ? null : `rollos ${JSON.stringify(s.vars)}`));
  await d.walkTo(ROLLOS.cell.x, ROLLOS.cell.y);
  await d.settle();
  await d.milestone('c046', (s) => (s.cells.includes('cell_memoria_1') ? null : 'sin C046'));
}

async function mural(d) {
  const [sx, sy] = MURAL.springUse[0];
  await d.walkTo(sx, sy, { face: 'up' });
  await d.interact();
  await d.expectSaid(/Tus Pokémon beben y se recuperan/, 'el manantial');
  for (let slot = 0; slot < 6; slot++) {
    const p = MURAL.panels[slot];
    await d.walkTo(p.x, p.y + 1, { face: 'up' });
    await d.interact({ choose: () => slot });
  }
  await d.expectSaid(/Los seis paneles se iluminan/, 'el Mural ordenado');
  await d.milestone('mural', (s) => (s.flags.b10_mural ? null : `mural ${s.vars.b10_mural_orden}`));
}

async function olvido(d) {
  await d.walkTo(MEMORIA_STAIRS.up.x, MEMORIA_STAIRS.up.y, { stopWhen: (s) => s.map === 'archivo_hondo_nucleo' });
  await d.until((s) => s.map === 'archivo_hondo_nucleo' && s.ready, { timeout: 15000, what: 'subir al tercer piso' });
  await d.settle();
  const watch = [
    { re: /nota a pie de página/, name: 'olvido_existes', delay: 200 },
    { scene: 'BattleScene', name: 'combate_olvido', delay: 4500 },
  ];
  await d.walkTo(NUCLEO.battleSpot.x, NUCLEO.battleSpot.y, { watch, stopWhen: (s) => s.flags.b10_olvido_retada });
  await d.settle({ watch });
  await d.expectSaid(/¡Existes! Eres una nota a pie de página que camina\./, 'el reto de Olvido');
  if (RETRY) {
    await d.milestone('olvido_derrota', (s) => (!s.flags.b10_olvido_vencida && s.x === NUCLEO.battleSpot.x && s.y === NUCLEO.battleSpot.y ? null : `tras perder: (${s.x},${s.y})`));
    await d.walkTo(NUCLEO.battleSpot.x, NUCLEO.battleSpot.y, { face: 'down' });
    await d.interact({ watch });
    await d.expectSaid(/primer intento/, 'el reintento con Olvido');
  }
  await d.milestone('olvido_vencida', (s) => (s.flags.b10_olvido_vencida ? null : 'sin b10_olvido_vencida'));
}

async function nucleo(d) {
  await d.walkTo(NUCLEO.front.x, NUCLEO.front.y, { face: 'up' });
  await d.interact({ watch: [{ scene: 'VerseScene', name: 'verso_v', delay: 1500 }], choose: () => 0 });
  await d.until((s) => s.map === 'mnemos_archivo' && s.ready, { timeout: 30000, what: 'subir al Archivo de papel' });
  await d.settle({ watch: [{ re: /Los tachones también son memoria/, name: 'informe_tachado', delay: 200 }] });
  for (const [re, what] of [
    [/Fragmento Azur 5/, 'el Fragmento Azur 5'],
    [/Entonces uno caminará entre el tiempo y el espacio llevando consigo al guardián roto/, 'el verso V completo'],
    [/Clave Glífica/, 'la Clave Glífica'],
    [/…Eres tú\./, '«Eres tú.»'],
    [/Firmó en mi libro de visitas: Gael/, 'la visita de Gael'],
    [/La novena tabla sueña en voz ajena/, 'la inscripción de T09'],
    [/Recuerdo cómo se sube/, 'Trepar'],
    [/Es una llamada del Prof\. Alerce/, 'la llamada de Alerce'],
    [/Los tachones también son memoria\./, 'el informe tachado'],
    [/Piedra Espíritu/, 'la Piedra Espíritu'],
  ]) await d.expectSaid(re, what);
  const clues = await d.eval(() => window.__b10.clues());
  const items = await d.eval(() => window.__b10.items(['GLYPHKEY', 'ODDKEYSTONE']));
  await d.milestone('p5_restaurado', (s) => {
    if (!s.flags.p5_restored || !s.flags.verse_5) return 'sin p5_restored o sin verso V';
    if (!s.fragments.includes('F05')) return 'sin Fragmento 5';
    if (!s.abilities.climb) return 'sin Trepar';
    if (!clues.some((c) => c.id === 'T09')) return 'sin pista T09';
    if (!items.GLYPHKEY || !items.ODDKEYSTONE) return `objetos ${JSON.stringify(items)}`;
    return s.flags.b10_informe ? null : 'sin informe';
  });
}

async function salida(d) {
  await d.exitInterior(ARCHIVO_ROOM.entry, 'aldea_mnemos');
  await d.expectSaid(/La niebla se ha levantado/, 'la aldea sin niebla');
  const fog = await d.eval(() => window.__b10.fog());
  await d.milestone('niebla_levantada', () => (fog ? `sigue la niebla ${fog}` : null));
  // Trepar: el risco de la Losa del Olvido.
  await d.walkTo(RISCO.wall.x, RISCO.wall.y + 1, { face: 'up' });
  await d.interact({ choose: () => 0 });
  await d.until((s) => s.y === RISCO.wall.top[1], { timeout: 10000, what: 'subir el risco' });
  await d.settle();
  await d.milestone('risco_trepado', (s) => (s.x === RISCO.wall.top[0] && s.y === RISCO.wall.top[1] ? null : `(${s.x},${s.y})`));
  await d.walkTo(RISCO.down.x, RISCO.down.y - 1, { face: 'down' });
  await d.interact({ choose: () => 0 });
  await d.until((s) => s.y === RISCO.down.bottom[1], { timeout: 10000, what: 'bajar el risco' });
  await d.settle();
  // El camino del norte ya no da vueltas.
  await d.walkTo(EXITS.north.x0, FOG_WALL_Y - 1);
  await d.milestone('camino_norte_abierto', (s) => (s.map !== 'aldea_mnemos' || s.y < FOG_WALL_Y ? null : `(${s.x},${s.y})`));
}

// ───────────────────────────── Principal ─────────────────────────────


export async function runB10(d){await refreshDriver(d); await installB10Observer(d.page); await d.stages('B10',{
 entrada:async d=>{
  await d.travel('mnemos_centro');await d.talk('enfermera');
  const s=await d.snap(),stock=s.items.SUPERPOTION||0;
  if(stock<12)await d.purchase({SUPERPOTION:12-stock});
  await d.milestone('equipo_curado',s=>s.pokemon.every(p=>p.hp===p.maxHP&&!p.status)?null:'el Centro no curó el equipo');
  await d.travel('aldea_mnemos');
 },mnemos,notes,archivo,suelo,manos,lectura,rollos,mural,olvido,nucleo,salida});}
