import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB07Observer} from './e2e_campaign_b07_page.mjs';
import { room } from '../game/src/content/events/b07_strata_rooms.js';
import { solveRoom } from '../game/src/content/events/b07_strata_logic.js';
import { RUTA6, CANTERIA, GALERIAS, HERRERIA } from '../game/src/content/maps/b07/layout.js';
const RETRY=false;
async function brontia(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'villa_brontia' && s.ready, { timeout: 30000, what: 'Villa Brontia' });
  await d.settle();
  await d.milestone('brontia_sur');
  await d.walkTo(22, 39);
  await d.crossEdge('down', 'ruta_6');
  await d.settle();
  await d.milestone('ruta_6', (s) => (s.map === 'ruta_6' && s.y <= 2 ? null : `llegada (${s.x},${s.y})`));
}

async function ruta(d) {
  const watch = [{ scene: 'BattleScene', name: 'combate_carmen', delay: 3500 }];
  // Bajada del rellano alto: la Veterana Carmen vigila la escalera.
  await d.walkTo(21, 18, { watch });
  const pre = await d.snapState();
  if (!pre.battles.some((b) => b.id === 'b07_veterana_carmen' && !b.ring)) throw new Error('La Veterana Carmen no ha combatido');
  await d.expectSaid(/Nadie baja esta escalera/, 'el reto de Carmen');
  const log0 = await d.log();
  if (log0.some((l) => /megaevolucionado/.test(l.text))) throw new Error('Se ha megaevolucionado ANTES del Mega Aro');
  // La franja de la Cantería: la voladura y Bea.
  await d.walkTo(21, RUTA6.arrivalY, { watch: [{ re: /BUUUM/, name: 'voladura', delay: 300 }] });
  await d.settle({ watch: [{ re: /Soy Bea, Bea Solano/, name: 'bea', delay: 200 }] });
  await d.expectSaid(/Mi hermano Quino estaba dentro, con su cuadrilla de Timburr/, 'la segunda pista (Bea)');
  const clues = await d.eval(() => window.__b07.clues());
  await d.milestone('llegada_canteria', (s) => {
    if (!s.flags.b07_llegada) return 'sin b07_llegada';
    const t04 = clues.find((c) => c.id === 'T04');
    return t04 && t04.step === 2 ? null : `pista T04: ${JSON.stringify(t04)}`;
  });
}

async function consorcio(d) {
  const t = CANTERIA.techSpot;
  const watch = [
    { re: /Zona de voladura del Consorcio/, name: 'tecnicos', delay: 200 },
    { scene: 'BattleScene', name: 'combate_tecnico', delay: 3500 },
    { re: /Ulises Garrido/, name: 'garrido', delay: 200 },
    { re: /Ese es el que manda volar/, name: 'canteros_senalan', delay: 200 },
    { re: /nunca rompas la capa que sostiene a otra/, name: 'leccion_alerce', delay: 200 },
  ];
  // Cualquier casilla del perímetro dispara la escena (el guion lleva al jugador delante de los técnicos).
  const lossesBefore=(await d.snap()).lost.length;
  await d.walkTo(t.x, t.y, { watch, stopWhen: (s) => s.flags.b07_tecnicos || s.lost.length > lossesBefore });
  await d.settle({ watch });
  for(let tries=0;!(await d.snap()).flags.b07_tecnicos&&tries<8;tries++)await d.talk('tecnico_voladura_0',{watch});
  if (RETRY) {
    await d.milestone('tecnico_derrota', (s) => (!s.flags.b07_tecnicos && s.x === t.x && s.y === t.y ? null : `tras perder: (${s.x},${s.y})`));
    await d.step(2);
    await d.step(8);
    await d.settle({ watch });
    await d.until((s) => s.flags.b07_alerce, { timeout: 5000, what: 'la cadena Garrido → Alerce' });
    await d.expectSaid(/Otra vez usted/, 'el reintento con los técnicos');
  }
  await d.expectSaid(/Ulises Garrido\. Dirijo las operaciones de campo del Consorcio/, 'la presentación de Garrido');
  await d.expectSaid(/Retirad las cargas\. Hoy no se vuela nada más/, 'la retirada de Garrido');
  await d.expectSaid(/No lo hago por ti/, 'el pragmatismo de Garrido');
  await d.expectSaid(/nunca rompas la capa que sostiene a otra/, 'la regla de Alerce');
  await d.milestone('consorcio_fuera', (s) => (s.flags.b07_garrido && s.flags.b07_alerce ? null : 'sin b07_garrido o b07_alerce'));
}

async function enterGalerias(d) {
  const door = CANTERIA.mine.door;
  await d.walkTo(door.x, door.y + 1, { face: 'up' });
  await d.step(8);
  await d.until((s) => s.map === 'canteria_solano' && s.ready, { timeout: 15000, what: 'entrar en las galerías' });
  await d.settle();
  await d.expectSaid(/La galería huele a polvo reciente/, 'la llegada a las galerías');
}

const inMap = (n, x, y) => [x + GALERIAS.rooms[n].ox, y + GALERIAS.rooms[n].oy];

/**
 * Ejecuta la solución del solucionador de la sala n desde su llegada: camina (con rutas recalculadas en la página, a
 * prueba de pasos dobles) hasta cada casilla desde la que hay que embestir o rescatar, mira hacia la roca o el
 * atrapado y pulsa A. El último paso (sobre el pozo, si lo hay) se da a mano para que salte la bajada.
 */
async function solve(d, n, watch = []) {
  const r = room(n);
  const sol = solveRoom(r);
  if (!sol.solved) throw new Error(`La sala ${n} no tiene solución`);
  let pos = r.marks.S[0];
  const acts = sol.actions;
  for (let k = 0; k < acts.length; k++) {
    const act = acts[k];
    if (act.type !== 'move') {
      await d.walkTo(...inMap(n, ...pos));
      await d.turn(act.dir);
      await d.interact({ watch });
      continue;
    }
    const last = k === acts.length - 1;
    if (last && r.marks.E.length) {
      // Si un paso doble ya ha metido al jugador en el pozo, la bajada está hecha (otra sala).
      const [ox] = inMap(n, 0, 0);
      const away = (s) => s.x < ox || s.x >= ox + r.w;
      const s0 = await d.walkTo(...inMap(n, ...pos), { stopWhen: away });
      if (!away(s0)) {
        await d.step(act.dir);
        await d.settle({ watch });
      }
    }
    pos = [act.x, act.y];
  }
  const s = await d.snapState();
  if (!r.marks.E.length && s.map === 'canteria_solano') await d.walkTo(...inMap(n, ...pos));
}

async function galerias(d) {
  await d.milestone('galeria_ocre');
  // Derrumbe a propósito: la caliza de la pila del primer Timburr, desde el nicho (la sostiene la arenisca).
  const [nx, ny] = inMap(1, 4, 2);
  await d.walkTo(nx, ny, { face: 'right' });
  await d.interact({ watch: [{ re: /Esa roca sostenía la capa de encima/, name: 'derrumbe', delay: 200 }] });
  await d.expectSaid(/Esa roca sostenía la capa de encima/, 'el derrumbe');
  await d.expectSaid(/la capa de abajo aguanta a la de arriba/, 'la llamada de Alerce');
  const [sx, sy] = inMap(1, ...room(1).marks.S[0]);
  await d.milestone('sala_reiniciada', (s) => (s.x === sx && s.y === sy && (s.vars.b07_sala_1 || 0) === 0 && s.vars.b07_derrumbes === 1 ? null : `(${s.x},${s.y}) sala ${s.vars.b07_sala_1} derrumbes ${s.vars.b07_derrumbes}`));
  // Sala 1 (tutorial) y bajada por el pozo.
  await solve(d, 1);
  await d.until((s) => s.map === 'canteria_solano' && s.x === inMap(2, 7, 8)[0], { timeout: 15000, what: 'bajar a la sala 2' });
  await d.settle();
  await d.milestone('sala_1_resuelta', (s) => (s.flags.b07_timburr_1 ? null : 'sin el primer Timburr'));
  await solve(d, 2);
  await d.until((s) => s.x === inMap(3, 7, 8)[0], { timeout: 15000, what: 'bajar a la sala 3' });
  await d.settle();
  await d.expectSaid(/Aquí, detrás de la roca roja/, 'el grito de Quino');
  await d.milestone('sala_2_resuelta', (s) => (s.flags.b07_timburr_2 && s.flags.b07_timburr_3 ? null : 'faltan Timburr'));
  const watch = [
    { re: /asoma una losa de piedra tallada/, name: 'tabla_petrea', delay: 400 },
    { re: /nunca había visto una veta así/, name: 'veta', delay: 200 },
    // La fiesta arranca sola al salir por el pozo (evento automático del patio).
    { re: /La cuadrilla entera fuera/, name: 'fiesta_patio', delay: 300 },
    { re: /anillo de la roca/, name: 'anillo_de_la_roca', delay: 200 },
  ];
  await solve(d, 3, watch);
  await d.until((s) => s.map === 'ruta_6' && s.ready, { timeout: 30000, what: 'salir por el pozo de ventilación' });
  await d.expectSaid(/Has obtenido la Tabla Pétrea/, 'la Tabla Pétrea');
  const tablets = await d.eval(() => window.__b07.tablets());
  await d.milestone('rescate_completo', (s) => {
    if (!['b07_quino', 'b07_tablilla', 'b07_piedra'].every((f) => s.flags[f])) return 'faltan flags del rescate';
    return tablets.includes('STONEPLATE') ? null : 'sin STONEPLATE';
  });
}

async function fiesta(d) {
  await d.settle({ watch: [{ re: /¡Quino!/, name: 'bea_quino', delay: 200 }, { re: /anillo de la roca/, name: 'anillo_de_la_roca', delay: 200 }] });
  await d.expectSaid(/En Solano, al que saca a alguien de la roca le damos un anillo de la roca/, 'la frase de Bea');
  await d.expectSaid(/Ya estamos escribiendo el aviso/, 'la denuncia de los canteros');
  const clues = await d.eval(() => window.__b07.clues());
  await d.milestone('fiesta_canteros', (s) => {
    if (!s.flags.b07_rescate || !s.flags.b07_denuncia) return 'sin b07_rescate o b07_denuncia';
    const t04 = clues.find((c) => c.id === 'T04');
    return t04 && t04.status === 'solved' ? null : `pista T04: ${JSON.stringify(t04)}`;
  });
}

async function herreria(d) {
  const f = CANTERIA.forgeFront;
  await d.walkTo(f.x, f.y, { face: 'up' });
  await d.step(8);
  await d.until((s) => s.map === 'canteria_herreria', { timeout: 15000, what: 'entrar en la herrería' });
  await d.settle({ watch: [{ re: /Es una Piedra Activadora/, name: 'alerce_piedra', delay: 200 }, { scene: 'ObtainScene', name: 'mega_aro', delay: 600 }] });
  await d.expectSaid(/Es una Piedra Activadora\. Responde a los lazos…/, 'Alerce examina la piedra');
  await d.expectSaid(/Te va a hacer falta\./, 'Alerce: «Te va a hacer falta»');
  const ring = await d.eval(() => window.__b07.has('MEGARING'));
  await d.milestone('mega_aro', (s) => (ring && s.flags.b07_megaring && s.flags.b07_ruta_despejada ? null : `aro ${ring}, flags ${s.flags.b07_megaring}/${s.flags.b07_ruta_despejada}`));
  await d.walkTo(HERRERIA.entry.x, HERRERIA.entry.y);
  await d.press('ArrowDown', 500);
  await d.until((s) => s.map === 'ruta_6' && s.ready, { timeout: 15000, what: 'salir de la herrería' });
  await d.settle();
}

async function mega(d) {
  // Paso despejado: se cruza el antiguo derrumbe; el Minero Tino combate y Lucario megaevoluciona.

  await d.walkTo(RUTA6.rubbleSouth.x, RUTA6.rubbleSouth.y);
  await d.milestone('derrumbe_despejado');
  const watch = [{ scene: 'BattleScene', name: 'combate_mega', delay: 6000 }];
  await d.walkTo(15, 49, { watch, stopWhen: (s) => s.battles.some((b) => b.id === 'b07_minero_tino') });
  await d.settle({ watch });
  const s = await d.snapState();
  if (!s.battles.some((b) => b.id === 'b07_minero_tino' && b.ring)) throw new Error('El Minero Tino no ha combatido con el Mega Aro');
  await d.expectSaid(/ha megaevolucionado/, 'la Megaevolución en combate');
  await d.milestone('megaevolucion');
}

async function estrato(d) {
  const s0 = await d.snapState();
  const toEstrato = await d.eval(() => Boolean(window.__map?.world?.current?.def?.connections?.some((c) => c.to === 'ciudad_estrato')));
  await d.walkTo(15, RUTA6.south.y - 1);
  if (toEstrato) {
    await d.crossEdge('down', 'ciudad_estrato');
    await d.settle();
    await d.milestone('ciudad_estrato');
  } else {
    await d.step(2);
    await d.settle();
    await d.expectSaid(/hacia Ciudad Estrato, pero por ahora no puedes continuar/, 'el aviso del enlace pendiente');
    await d.milestone('camino_estrato', () => (s0.flags.b07_megaring ? null : 'sin salida del bloque'));
  }
}

// ───────────────────────────── Principal ─────────────────────────────

export async function runB07(d){await refreshDriver(d);await installB07Observer(d.page);await d.stages('B07',{brontia,ruta,consorcio,enterGalerias,galerias,fiesta,herreria,mega,estrato});}
