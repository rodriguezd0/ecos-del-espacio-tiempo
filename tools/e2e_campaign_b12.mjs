import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB12Observer} from './e2e_campaign_b12_page.mjs';
import {Driver as ImpossibleDriver, KEY, dirTo} from './e2e_b12_driver.mjs';
import { MONTE, VESTIBULO, MIRADA, SUMIDERO, NUCLEO, P6_VERTICAL as P } from '../game/src/content/maps/b12/layout.js';
import { facetRoom, facetMapId, MARGIN } from '../game/src/content/maps/b12/rooms.js';
import { facetMasks, decodeAnchor } from '../game/src/world/impossible/logic.js';
const has = (s, key) => Boolean(s.flags[key]);
const cellsHas = (s, key) => (s.cells.includes(key) ? null : `sin ${key}`);
/** ¿Está el jugador en la casilla guardada por la última Ancla? */
const atAnchor = (s) => {
  const a = decodeAnchor(s.anchor);
  if (!a) return 'sin Ancla';
  return a.map === s.map && a.x === s.x && a.y === s.y ? null : `en ${s.map} (${s.x},${s.y}); Ancla ${s.anchor}`;
};

// ───────────────────────────── utilidades de tramo ─────────────────────────────

/** Pasos de La Cara Vuelta hacia `goal` hasta que done(s) o el planificador diga «ya está». */
async function facetRun(d, goal, done, watch = []) {
  for (let n = 0; n < 300; n++) {
    const s = await d.snapState();
    if (done(s)) return s;
    const a = await d.eval((g) => window.__b12.facetNext(g), goal);
    if (a === 0) return s;
    if (a === null) throw new Error(`La Cara Vuelta: sin plan hacia ${goal} desde ${s.map} (${s.x},${s.y})`);
    await d.step(a, { watch });
  }
  throw new Error(`La Cara Vuelta: demasiados pasos hacia ${goal}`);
}

/** Recoge un objeto de suelo que está al lado: lo encara y pulsa A. */
async function pickAdjacent(d, eventId, item) {
  const [s, pos] = [await d.snapState(), await d.eval((id) => window.__b12.eventPos(id), eventId)];
  if (!pos) throw new Error(`No existe el objeto ${eventId} en ${s.map}`);
  const before = await d.eval((id) => window.__b12.items(id), item);
  await d.face(dirTo(s.x, s.y, pos.x, pos.y));
  await d.interact();
  const after = await d.eval((id) => window.__b12.items(id), item);
  if (after <= before) throw new Error(`No se recogió ${item} (${eventId})`);
}

/** Pasos de La Mirada hacia (x, y) (o a su lado): girar en firme, avanzar sobre los puentes mirándolos. */
async function gazeRun(d, x, y, { adj = false, watch = [], stopWhen = null } = {}) {
  for (let n = 0; n < 300; n++) {
    const s = await d.snapState();
    if (stopWhen && stopWhen(s)) return s;
    const a = await d.eval(([gx, gy, o]) => window.__b12.gazeNext(gx, gy, { adj: o }), [x, y, adj]);
    if (a === 0) return s;
    if (a === null) throw new Error(`La Mirada: sin plan hacia (${x},${y}) desde (${s.x},${s.y}) dir ${s.dir}`);
    if (a.turn) await d.face(a.turn);
    else await d.step(a.step, { watch });
  }
  throw new Error(`La Mirada: demasiados pasos hacia (${x},${y})`);
}

/** Sube por una cascada invertida abierta (pisa la boca) y espera a la cima. */
async function rideFall(d, fall) {
  await d.walkTo(fall.base.x, fall.base.y, { stopWhen: (s) => s.x === fall.top.x && s.y === fall.top.y });
  await d.until((s) => s.x === fall.top.x && s.y === fall.top.y, { timeout: 15000, what: `subir por la cascada ${fall.id}` });
  return d.settle();
}

/** Se deja caer al vacío desde donde está (o desde `from`) y espera a volver al poste. */
async function dropIntoVoid(d, from = null) {
  const hp = await d.eval(() => window.__b12.hp());
  if (from) {
    // Con la máquina cargada un paso puede alargarse y caer antes de llegar al borde: eso ya es la caída buscada.
    const start = await d.snapState();
    let away = atAnchor(start) !== null; // se empieza lejos del poste (o se sale de él al andar)
    let fell = false;
    const stopWhen = (s) => {
      if (atAnchor(s) !== null) away = true;
      else if (away) fell = true;
      return fell;
    };
    await d.walkTo(from[0], from[1], { stopWhen });
    if (fell) {
      const hpEarly = await d.eval(() => window.__b12.hp());
      if (JSON.stringify(hp) !== JSON.stringify(hpEarly)) throw new Error(`La caída ha cambiado los PS: ${hp} → ${hpEarly}`);
      return d.settle();
    }
  }
  const dir = await d.eval(() => window.__b12.voidDir());
  if (!dir) {
    const s = await d.snapState();
    throw new Error(`No hay vacío junto a (${s.x},${s.y}) en ${s.map}`);
  }
  await d.step(dir, { settle: false });
  await d.until((s) => s.busy || s.top !== 'MapScene', { timeout: 5000, what: 'empezar a caer' });
  const s = await d.settle();
  const hpAfter = await d.eval(() => window.__b12.hp());
  if (JSON.stringify(hp) !== JSON.stringify(hpAfter)) throw new Error(`La caída ha cambiado los PS: ${hp} → ${hpAfter}`);
  return s;
}

// ───────────────────────────── tramos ─────────────────────────────

async function alba(d) {
  await d.milestone('alba_noche', (s) => (s.map === 'villa_alba' ? null : `mapa ${s.map}`));
  await d.until((s) => has(s, 'b12_temblor_visto'), { timeout: 90000, what: 'el temblor nocturno' });
  await d.milestone('alba_temblores', (s) => (has(s, 'b12_temblor_visto') ? null : 'sin b12_temblor_visto'));
}

async function monte(d) {
 await d.rest('casa_prota_2f','Mañana'); await d.travel('montana_portal');
  await d.settle();
  await d.milestone('monte_de_dia', (s) => (has(s, 'b12_monte_llegada') ? null : 'sin llegada'));
  // Pozos de sondeo de Genesis (tras EXP-03).
  const [hx, hy] = MONTE.drillHoles[1];
  await d.approach(hx, hy);
  await d.interact();
  await d.expectSaid(/pozo de sondeo/, 'el pozo de sondeo');
  await d.walkTo(MONTE.cells.C050.x, MONTE.cells.C050.y);
  await d.settle();
  await d.milestone('c050', (s) => cellsHas(s, 'cell_monte_1'));
  // Repisa de la cascada (Trepar) y su gruta.
  const [fx, fy] = MONTE.climb.foot;
  const [tx, ty] = MONTE.climb.top;
  await d.walkTo(fx, fy, { face: 'up' });
  await d.interact();
  await d.until((s) => s.x === tx && s.y === ty, { timeout: 10000, what: 'trepar a la repisa' });
  await d.settle();
  await d.walkTo(tx, ty - 1);
  await d.settle();
  await d.expectSaid(/Desde lo alto del macizo/, 'la vista de la repisa');
  await d.walkTo(MONTE.grutaDoor.x, MONTE.grutaDoor.y + 1);
  await d.step(8);
  await d.arrive('monte_gruta', 'entrar en la gruta');
  await d.milestone('gruta', (s) => (s.map === 'monte_gruta' ? null : s.map));
  await d.step(2);
  await d.arrive('montana_portal', 'salir de la gruta');
  await d.walkTo(tx, ty, { face: 'down' });
  await d.interact();
  await d.until((s) => s.x === fx && s.y === fy, { timeout: 10000, what: 'bajar de la repisa' });
  await d.settle();
  // Mitad de la escalinata (C051, obligatoria) y lo que dejó Genesis junto al aljibe.
  await d.walkTo(MONTE.cells.C051.x, MONTE.cells.C051.y);
  await d.settle();
  await d.milestone('c051', (s) => cellsHas(s, 'cell_monte_2'));
  await d.approach(MONTE.sensor.x, MONTE.sensor.y);
  await d.interact();
  await d.expectSaid(/Lectura desde el perímetro/, 'los sensores de Genesis');
  // El aljibe responde a Zygarde: se baja al Mundo Distorsión.
  await d.walkTo(MONTE.aljibeFront.x, MONTE.aljibeFront.y, { face: 'up' });
  await d.milestone('columna_exterior', async () => {
    const column = await d.eval(() => window.__map.world.events.find((e) => e.id === 'b12_columna_exterior')?.page?.patch?.length);
    return column === 56 ? null : `columna ${column}`;
  });
  const watch = [
    { re: /sujetando la puerta/, name: 'aljibe_responde', delay: 150 },
    { fn: (s) => Math.abs(s.rot) > 1.2, name: 'aljibe_media_vuelta' },
  ];
  await d.interact({ watch });
  await d.arrive('pilar_invertido', 'bajar por el aljibe');
  await d.expectSaid(/Al otro lado está la parte de mí que se quedó sujetando la puerta\./, 'la respuesta del aljibe');
  await d.settle();
  const pano = await d.eval(() => window.__b12.panorama());
  await d.milestone('explanada_interior', (s) => (s.rot === 0 && pano && has(s, 'b12_interior_visto') ? null : `giro ${s.rot}, panorama ${pano}`));
}

async function cara(d) {
  // Ancla de la explanada interior y portal a La Cara Vuelta.
  await d.bump(VESTIBULO.anchor.x, VESTIBULO.anchor.y);
  await d.milestone('ancla_explanada', (s) => (String(s.anchor).startsWith('pilar_invertido|') ? null : `Ancla ${s.anchor}`));
  // El atajo vertical no permite saltarse La Cara Vuelta al llegar por primera vez.
  await d.walkTo(36, 19);
  await d.walkTo(P.baseUp.x, P.baseUp.y);
  await d.settle();
  await d.expectSaid(/Las vetas de la escalera aún no encajan/, 'el ascenso cerrado');
  await d.milestone('piso_1_ascenso_cerrado', (s) => (s.map === 'pilar_invertido' ? null : 'se saltó Cara Vuelta'));
  await d.walkTo(VESTIBULO.portalCara.x, VESTIBULO.portalCara.y, { stopWhen: (s) => s.map !== 'pilar_invertido' });
  await d.arrive(facetMapId('cara_1', 0), 'entrar en La Cara Vuelta');
  // Ancla de la sala y caída al vacío: vuelve al poste, sin daño.
  const room = facetRoom('cara_1');
  const m0 = facetMasks(room, 0, MARGIN);
  const [ax, ay] = m0.map(room.anchors[0].x, room.anchors[0].y);
  await d.bump(ax, ay);
  const [sx, sy] = m0.map(room.start.x, room.start.y);
  await dropIntoVoid(d, [sx, sy]);
  await d.expectSaid(/sin un rasguño.*último poste/, 'la primera caída');
  await d.milestone('cara_caida', (s) => atAnchor(s) || (has(s, 'b12_caida_vista') ? null : 'sin b12_caida_vista'));
  // El glifo de llegada permite salir con A si se pierde la orientación; se vuelve sin reiniciar el puzzle.
  await d.walkTo(sx, sy);
  await d.interact();
  await d.arrive('pilar_invertido', 'regresar por el glifo de Cara Vuelta');
  await d.milestone('cara_regreso_seguro', (s) => (s.map === 'pilar_invertido' && s.rot === 0 ? null : 'no volvió a suelo firme'));
  await d.step(6);
  await d.arrive(facetMapId('cara_1', 0), 'reentrar en La Cara Vuelta');
  // Sala 1: una arista (la pantalla gira 90° y se carga el gemelo).
  const turnWatch = [{ fn: (s) => Math.abs(s.rot) > 0.5, name: 'cara_giro' }];
  await facetRun(d, 'exit', (s) => s.map === facetMapId('cara_2', 0), turnWatch);
  await d.settle();
  await d.milestone('cara_sala_1', (s) => (s.map === facetMapId('cara_2', 0) ? null : s.map));
  // Sala 2: C052 en la repisa que solo existe girada y el objeto de la repisa.
  await facetRun(d, 'cell', (s) => s.cells.includes('cell_invertido_1'));
  await d.settle();
  await d.milestone('c052', (s) => cellsHas(s, 'cell_invertido_1'));
  await facetRun(d, 'item:objeto_repisa', () => false);
  await pickAdjacent(d, 'objeto_repisa', 'MAXETHER');
  await facetRun(d, 'exit', (s) => s.map === facetMapId('cara_3', 0));
  await d.settle();
  // Sala 3: la espiral (cuatro aristas).
  await facetRun(d, 'item:objeto_espiral', () => false);
  await pickAdjacent(d, 'objeto_espiral', 'FULLRESTORE');
  await facetRun(d, 'exit', (s) => s.map === 'pilar_invertido_mirada');
  await d.arrive('pilar_invertido_mirada', 'salir de La Cara Vuelta');
  await d.milestone('cara_vuelta_hecha', (s) => (has(s, 'b12_cara_vuelta') && s.rot === 0 ? null : `flag ${has(s, 'b12_cara_vuelta')} giro ${s.rot}`));
  // Escalera 2 → 1 y vuelta: no devuelve a una casilla de ascenso automáticamente.
  await d.step(2);
  await d.arrive('pilar_invertido', 'bajar del piso 2 al 1');
  await d.milestone('piso_2_descenso', (s) => (s.x === P.baseReturn.x && s.y === P.baseReturn.y ? null : 'llegada incorrecta'));
  await d.step(2);
  await d.arrive('pilar_invertido_mirada', 'subir por el atajo de Cara Vuelta resuelta');
}

async function mirada(d) {
  await d.settle();
  const anchor = MIRADA.anchors[0];
  await gazeRun(d, anchor.x, anchor.y, { adj: true });
  const s0 = await d.snapState();
  await d.face(dirTo(s0.x, s0.y, anchor.x, anchor.y));
  await d.bump(anchor.x, anchor.y);
  await d.milestone('mirada_ancla', (s) => (String(s.anchor).startsWith('pilar_invertido_mirada|') ? null : `Ancla ${s.anchor}`));
  // Girar encima de un puente: el puente deja de existir y se cae al poste.
  const [bx, by] = MIRADA.bridges[1].from;
  await gazeRun(d, bx, by);
  const visible = await d.eval(() => window.__b12.bridgesVisible());
  await d.shot('mirada_puente');
  if (!visible) throw new Error('Sobre el puente no se ve ninguna losa');
  for (let i = 0; i < 4; i++) {
    await d.press(KEY[8], 150, 25);
    const s = await d.snapState();
    if (s.busy || s.top !== 'MapScene' || s.dir !== 6) break;
  }
  await d.until((s) => s.busy || s.top !== 'MapScene' || s.dir !== 6, { timeout: 4000, what: 'girar sobre el puente' });
  await d.settle();
  await d.milestone('mirada_giro_caida', atAnchor);
  // Salida (isla del noreste).
  await gazeRun(d, MIRADA.exit.x, MIRADA.exit.y, { stopWhen: (s) => s.map !== 'pilar_invertido_mirada' });
  await d.arrive('pilar_invertido_sumidero', 'salir de La Mirada');
  await d.milestone('mirada_hecha', (s) => (has(s, 'b12_mirada') ? null : 'sin b12_mirada'));
  await d.step(2);
  await d.arrive('pilar_invertido_mirada', 'bajar del piso 3 al 2');
  await d.milestone('piso_3_descenso', (s) => (s.x === P.miradaReturn.x && s.y === P.miradaReturn.y ? null : 'rebote en la escalera'));
  await d.step(6);
  await d.arrive('pilar_invertido_sumidero', 'volver a subir al piso 3');
}

async function sumidero(d) {
  await d.settle();
  // La escalera de revisita no permite saltarse las cascadas ni C053.
  await d.walkTo(P.sumideroUp.x, SUMIDERO.start.y);
  await d.step(2);
  await d.settle();
  await d.milestone('sumidero_sello_cerrado', (s) => (s.map === 'pilar_invertido_sumidero' && !has(s, 'b12_sumidero') ? null : 'acceso prematuro al sello'));
  await d.step(8); // rodear el descenso de (16,43), sin que el buscador de rutas lo pise
  await d.walkTo(SUMIDERO.start.x, SUMIDERO.start.y);
  const [a0, a1] = SUMIDERO.anchors;
  const [W1, W2, W3] = SUMIDERO.falls;
  const [p1, p2, p3] = SUMIDERO.buttons;
  await d.bump(a0.x, a0.y);
  await d.walkTo(p1.x, p1.y);
  await d.settle();
  await d.milestone('sumidero_pulsador_1', (s) => (has(s, 'b12_pulsador_1') ? null : 'sin pulsador'));
  await rideFall(d, W1);
  await d.milestone('sumidero_cascada_1', (s) => (s.x === W1.top.x && s.y === W1.top.y ? null : `(${s.x},${s.y})`));
  await d.bump(a1.x, a1.y);
  await d.walkTo(p2.x, p2.y);
  await d.settle();
  await rideFall(d, W2);
  // La sombra de Giratina cruza el vacío mayor (una vez): la dispara la mitad este de la isla alta, donde está C053
  // (obligatoria), así que salta de camino a la célula o al asomarse al borde. Captura a mitad del cruce (por
  // fotogramas del juego, no por reloj: con la máquina cargada el juego va más lento).
  let still = null;
  const watch = [{ fn: (s) => { if (s.sil > 0 && still === null) still = s.still; return s.silK >= 0.45; }, name: 'sombra_giratina' }];
  await d.walkTo(SUMIDERO.cell.x, SUMIDERO.cell.y, { watch });
  await d.settle({ watch });
  await d.milestone('c053', (s) => cellsHas(s, 'cell_invertido_2'));
  const edge = { x: SUMIDERO.shadowStrip.x, y: 14 };
  if (!has(await d.snapState(), 'b12_sombra')) await d.walkTo(edge.x, edge.y, { watch, stopWhen: (s) => has(s, 'b12_sombra') });
  await d.settle({ watch });
  await d.expectSaid(/No mires\. No nos busca\. Aún\./, 'la frase de Zygarde ante la sombra');
  await d.milestone('sumidero_sombra', (s) => (has(s, 'b12_sombra') && still !== false ? null : `sombra ${has(s, 'b12_sombra')}, Zygarde quieto ${still}`));
  await d.walkTo(p3.x, p3.y);
  await d.settle();
  await d.expectSaid(/Solo queda el vacío/, 'la pista de dejarse caer');
  // Gengarita en el rincón.
  await d.walkTo(SUMIDERO.gengarita.x + 1, SUMIDERO.gengarita.y);
  await d.settle();
  await pickAdjacent(d, 'b12_gengarita', 'GENGARITEX');
  await d.milestone('gengarita', () => null);
  // Desde la isla alta no hay bajada: caer y volver al poste de la isla media.
  await dropIntoVoid(d, [edge.x, edge.y - 1]);
  await d.milestone('sumidero_caida', atAnchor);
  await rideFall(d, W3);
  await d.walkTo(SUMIDERO.exit.x, SUMIDERO.exit.y, { stopWhen: (s) => s.map !== 'pilar_invertido_sumidero' });
  await d.arrive('pilar_invertido_nucleo', 'salir del Sumidero');
  await d.milestone('sumidero_hecho', (s) => (has(s, 'b12_sumidero') ? null : 'sin b12_sumidero'));
  // El sello no encierra al jugador mientras falta la restauración o el Fragmento 5.
  await d.step(2);
  await d.arrive('pilar_invertido_sumidero', 'salir del sello sin restaurar');
  await d.milestone('sello_regreso_seguro', (s) => (s.x === P.sumideroReturn.x && s.y === P.sumideroReturn.y ? null : 'llegada incorrecta'));
  await d.step(2);
  await d.arrive('pilar_invertido_mirada', 'bajar hasta el segundo piso desde el sello');
  await d.milestone('sello_descenso_piso_2', (s) => (s.x === P.miradaReturn.x && s.y === P.miradaReturn.y ? null : 'el sello deja al jugador atrapado'));
  await d.step(6);
  await d.arrive('pilar_invertido_sumidero', 'volver al rellano del Sumidero');
  await d.walkTo(P.sumideroUp.x, SUMIDERO.start.y);
  await d.step(2);
  await d.arrive('pilar_invertido_nucleo', 'volver al sello por la escalera del Sumidero resuelto');
  await d.milestone('sumidero_sello_reentrada', (s) => (s.x === NUCLEO.arrival.x && s.y === NUCLEO.arrival.y ? null : 'llegada incorrecta'));
}

async function nucleo(d) {
  await d.settle();
  await d.expectSaid(/En el orden en que se cruza este lugar/, 'la inscripción del núcleo');
  const [veta, ojo, gota] = NUCLEO.anchors;
  // Orden equivocado: el sello se abre más y se empieza de nuevo (sin castigo).
  await d.bump(ojo.x, ojo.y);
  await d.expectSaid(/El sello se abre un poco más/, 'el aviso del orden equivocado');
  const order0 = await d.eval(() => window.__b12.vars().b12_nucleo_orden ?? 0);
  if (order0 !== 0) throw new Error(`El orden no se reinició: ${order0}`);
  await d.bump(veta.x, veta.y);
  await d.bump(ojo.x, ojo.y);
  await d.milestone('nucleo_dos_anclas', async () => {
    const n = await d.eval(() => window.__b12.vars().b12_nucleo_orden);
    return n === 2 ? null : `orden ${n}`;
  });
  const watch = [
    { scene: 'VerseScene', name: 'verso_vi', delay: 1500 },
  ];
  await d.bump(gota.x, gota.y, { watch });
  await d.expectSaid(/Arriba, muy lejos, el aljibe deja de gemir/, 'el efecto local del Pilar');
  const z = await d.eval(() => ({ form: window.__b12.form(), swim: window.__b12.ability('swim'), cores: window.__b12.cores(), fragments: window.__b12.fragments() }));
  await d.milestone('p6_restaurado', (s) => {
    if (!has(s, 'p6_restored')) return 'sin p6_restored';
    if (!z.fragments.includes('F06')) return `Fragmentos ${z.fragments}`;
    if (!z.cores.includes('N3')) return `núcleos ${z.cores}`;
    return z.form === '50' && z.swim ? null : `forma ${z.form}, Nadar ${z.swim}`;
  });
}

async function regreso(d) {
  await d.walkTo(NUCLEO.portalBack.x, NUCLEO.portalBack.y, { stopWhen: (s) => s.map !== 'pilar_invertido_nucleo' });
  await d.arrive('pilar_invertido', 'volver a la explanada interior');
  await d.settle({ watch: [{ re: /Aquí lo empujé/, name: 'respuesta', delay: 150 }] });
  await d.expectSaid(/Aquí lo empujé\. Tres noches\./, 'la Respuesta de Zygarde');
  await d.milestone('respuesta', (s) => (has(s, 'b12_respuesta') ? null : 'sin b12_respuesta'));
  // Aljibe de vuelta al Monte.
  await d.approach(VESTIBULO.aljibe.x, VESTIBULO.aljibe.y);
  await d.interact();
  await d.arrive('montana_portal', 'subir al Monte');
  await d.expectSaid(/la puerta se sostiene sola/, 'el regreso al Monte');
  await d.milestone('monte_tras_p6', (s) => (has(s, 'b12_regreso') ? null : 'sin b12_regreso'));
  // Puerta anclada: se puede volver a bajar (X16) y subir otra vez.
  await d.walkTo(MONTE.aljibeFront.x, MONTE.aljibeFront.y, { face: 'up' });
  await d.interact();
  await d.arrive('pilar_invertido', 'volver a bajar por el aljibe');
  await d.expectSaid(/¿Vuelves a bajar al otro lado\?|Ya no se filtra nada/, 'el aljibe en calma');
  await d.milestone('aljibe_reentrada', (s) => (s.map === 'pilar_invertido' ? null : s.map));
  // Revisita del Pilar restaurado: el ascenso al piso 2 sigue abierto y sus descensos siguen siendo seguros.
  await d.walkTo(36, 19);
  await d.walkTo(P.baseUp.x, P.baseUp.y, { stopWhen: (s) => s.map !== 'pilar_invertido' });
  await d.arrive('pilar_invertido_mirada', 'revisitar el piso 2 tras restaurar');
  await d.milestone('p6_revisita_piso_2', (s) => (has(s, 'p6_restored') ? null : 'se perdió la restauración'));
  await d.step(2);
  await d.arrive('pilar_invertido', 'bajar del piso 2 restaurado');
  await d.approach(VESTIBULO.aljibe.x, VESTIBULO.aljibe.y);
  await d.interact();
  await d.arrive('montana_portal', 'subir al Monte otra vez');
}

async function nadar(d) {
  // Nadar (50 %) en la poza al pie de la cascada: C076.
  const c = MONTE.cells.C076;
  const shore = await d.eval(([x, y]) => window.__b12.shoreNear(x, y), [c.x, c.y]);
  if (!shore) throw new Error('No hay orilla junto a la poza');
  await d.walkTo(shore.x, shore.y, { face: shore.dir });
  await d.interact();
  await d.until((s) => !s.busy, { timeout: 8000, what: 'meterse en el agua' });
  const surf = await d.eval(() => window.__b12.surfing());
  if (!surf) throw new Error('No se pudo nadar en la poza del Monte');
  await d.walkTo(c.x, c.y);
  await d.settle();
  await d.milestone('c076_nadar', (s) => cellsHas(s, 'cell_monte_3'));
  await d.walkTo(shore.x, shore.y);
  await d.settle();
  // La montañera, ya sin temblores.
  await d.approach(MONTE.hiker.x, MONTE.hiker.y);
  await d.interact();
  await d.expectSaid(/La montaña se ha quedado quieta/, 'la montañera tras el P6');
  // Nadar también en el agua de un mapa de otro bloque (estanque de la Ruta 2, B03).
  await d.travel('ruta_2');
  await d.arrive('ruta_2', 'saltar a la Ruta 2');
  const pond = await d.eval(() => window.__b12.shoreNear(21, 31));
  if (!pond) throw new Error('No hay orilla junto al estanque de la Ruta 2');
  await d.walkTo(pond.x, pond.y, { face: pond.dir });
  await d.interact();
  await d.until((s) => !s.busy, { timeout: 8000, what: 'meterse en el estanque' });
  const surf2 = await d.eval(() => window.__b12.surfing());
  await d.milestone('nadar_ruta_2', () => (surf2 ? null : 'no se nada en la Ruta 2'));
}

async function zaguan(d) {
  const s0 = await d.snapState();
  if (s0.map !== 'villa_zaguan') {
    await d.rest('zaguan_centro','Mañana');
    await d.travel('villa_zaguan');
    await d.until((s) => s.map === 'villa_zaguan' && s.ready, { timeout: 20000, what: 'llegar a Villa Zaguán' });
  }
  await d.settle({ watch: [{ re: /Mi marido la encontró/, name: 'casilda_lucarita', delay: 150 }] });
  await d.expectSaid(/Toma\. Mi marido la encontró hace años\. Ahora sé para quién era\./, 'la frase de Casilda');
  const lucarita = await d.eval(() => window.__b12.items('LUCARIONITE'));
  await d.milestone('lucarita', (s) => (has(s, 'b12_lucarita') && lucarita === 1 ? null : `flag ${has(s, 'b12_lucarita')}, Lucarita ${lucarita}`));
  // Villa Alba de noche, ya sin temblores.
  await d.rest('zaguan_centro','Noche');
  await d.travel('villa_alba');
  await d.arrive('villa_alba', 'volver a Villa Alba');
  // El temblor ya no tiene línea de Zygarde (habla muy poco): basta con que el evento no esté activo.
  const alive = await d.eval(() => window.__b12.eventAlive('b12_temblor_nocturno'));
  await d.wait(15000);
  await d.settle();
  await d.milestone('alba_sin_temblores', () => (!alive ? null : `temblor activo ${alive}`));
}

const STAGES = { alba, monte, cara, mirada, sumidero, nucleo, regreso, nadar, zaguan };

// ───────────────────────────── Principal ─────────────────────────────

export async function runB12(d){
 await refreshDriver(d); await installB12Observer(d.page);
 for(const method of ['step','face','approach','bump','arrive','expectNotSaid']) d[method]=ImpossibleDriver.prototype[method];
 await d.stages('B12',{entrada:async d=>{await d.travel('villa_alba'); await d.rest('casa_prota_2f','Noche');},alba,monte,cara,mirada,sumidero,nucleo,regreso,nadar,zaguan});
 for(const method of ['step','face','approach','bump','arrive','expectNotSaid']) delete d[method];
}
