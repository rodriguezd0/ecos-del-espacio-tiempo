// Tramos del E2E del Bloque 13 en el agua honda y las islas (docs/CAMPANA.md B13; TABLILLAS T11, T12):
//   buceo   dársena de Talasa → remolino (Buceo genérico: punto equivalente) → pilotes, C087, subir bajo la cubierta no
//           se puede, emerger en la dársena en la casilla equivalente
//   lumbre  a nado al Islote Lumbre de día (descubrimiento directo de T11) → banco hasta la noche → el corro enseña el
//           baile → los ocho pasos → gruta de la luna (Lucía, Tabla Duende, C063) → de vuelta a Caleta: fiesta de los
//           farolillos (Clefablita y la pista del P7)
//   tizon   C066 → a nado al Volcán Tizón (T12 directa) → C067 → Brasa (segunda pista) → bocamina → tres galerías de
//           coladas (bloques de obsidiana; plan calculado con las reglas puras) y sus respiraderos → cráter: la jefa de
//           perforación (derrota simulada y reintento) → Tabla Llama → de vuelta al caserío: la forja arde (Houndoomita)
import * as TAL from '../game/src/content/maps/b13/talasa_layout.js';
import * as LUM from '../game/src/content/maps/b13/lumbre_layout.js';
import * as TIZ from '../game/src/content/maps/b13/tizon_layout.js';
import * as CUE from '../game/src/content/maps/b13/tizon_cueva_layout.js';
import * as MAR from '../game/src/content/maps/b13/mar_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';
import { PILOTES } from '../game/src/content/maps/b13/talasa_pilotes.js';
import { CRATER } from '../game/src/content/events/b13_tizon_crater.js';
import { DANCE } from '../game/src/content/events/b13_dance_logic.js';
import { ROOMS, DV, roomStart, roomState, walkable, push, isSolved } from '../game/src/content/events/b13_lava_logic.js';
import { prefer, DIR } from './e2e_b13_driver.mjs';
import { swimAcross } from './e2e_b13_steps.mjs';

const need = (ok, msg) => (ok ? null : msg);
const flag = (s, k) => Boolean(s.flags[k]);
const has = (s, id) => (s.items[id] || 0) > 0;

// ───────────────────────────── Buceo genérico en la dársena de Talasa ─────────────────────────────

export async function buceo(d) {
  await d.until((s) => s.map === 'estacion_talasa' && s.ready, { timeout: 30000, what: 'la Estación Talasa' });
  await d.settle();
  await d.walkTo(TAL.LADDER.x, TAL.LADDER.y, { face: 'right' });
  await d.interact({ choose: prefer('Sí') });
  await d.until((s) => s.surfing, { timeout: 8000, what: 'nadar en la dársena' });
  await d.swimTo(TAL.DIVE.x, TAL.DIVE.y);
  await d.interact({ choose: prefer('Sí') });
  await d.until((s) => s.map === 'talasa_pilotes' && s.ready, { timeout: 20000, what: 'bucear a los pilotes' });
  await d.settle();
  await d.milestone('pilotes', (s) => need(s.x === TAL.DIVE.x && s.y === TAL.DIVE.y, `llegada (${s.x},${s.y}): no es el punto equivalente`));
  await d.walkTo(PILOTES.cell.x, PILOTES.cell.y);
  await d.settle();
  await d.milestone('c087', (s) => need(s.cells.includes(PILOTES.cell.key), 'sin C087'));
  // Bajo la cubierta no hay agua abierta: no se puede subir.
  await d.interact({ choose: prefer('Sí') });
  await d.expectSaid(/Encima no hay agua abierta/, 'el aviso de que no se puede subir bajo la cubierta');
  const up = { x: 17, y: 20 };
  await d.walkTo(up.x, up.y);
  await d.interact({ choose: prefer('Sí') });
  await d.until((s) => s.map === 'estacion_talasa' && s.ready, { timeout: 20000, what: 'emerger en la dársena' });
  await d.settle();
  await d.milestone('emerger', (s) => need(s.x === up.x && s.y === up.y && s.surfing, `(${s.x},${s.y}) nadando ${s.surfing}`));
}

// ───────────────────────────── T11 · Islote Lumbre ─────────────────────────────

const STONE_AVOID = [...LUM.STONES, [LUM.RING_CENTER.x, LUM.RING_CENTER.y]];

async function danceStones(d) {
  const router = (tx, ty) => d.eval(([x, y, avoid]) => window.__b13.routeAvoid(x, y, avoid), [tx, ty, STONE_AVOID]);
  for (const i of DANCE) {
    const [x, y] = LUM.STONES[i];
    await d.walkTo(x, y, { router, watch: [{ re: /Los ocho pasos/, name: 'baile_completo', delay: 100 }] });
    await d.settle();
    const s = await d.snapState();
    if (s.lastText && /confusos/.test(s.lastText)) throw new Error(`fallo en el baile al pisar la piedra ${i}`);
  }
}

export async function lumbre(d) {
  let s = await d.snapState();
  if (s.map === 'caleta_sonda') {
    const r = CL.DIVERS.resonance;
    await d.walkTo(r.x, r.y, { face: 'down' });
    await d.interact({ choose: prefer('Sí') });
    await d.until((st) => st.surfing, { timeout: 8000, what: 'nadar desde el muelle' });
    await swimAcross(d, r.x + 8, 31, 'down', 'mar_del_sur');
    const link = MAR.LINKS.south.find((l) => l.to === 'islote_lumbre');
    await swimAcross(d, link.offset + LUM.START.x, MAR.H - 1, 'down', 'islote_lumbre');
  }
  const watch = [{ re: /Las luces bailan de noche/, name: 'lumbre_dia', delay: 200 }];
  await d.swimTo(LUM.START.x, LUM.ISLAND.y + 1, { watch });
  await d.settle({ watch });
  await d.milestone('lumbre_llegada', (st) => need(flag(st, 'b13_t11_islote') && st.clues.some((c) => c.id === 'T11' && c.status === 'active'), 'sin T11 activa'));
  // De día no hay baile: el banco deja esperar a la noche.
  await d.talkTo(LUM.BENCH.x + 1, LUM.BENCH.y, { choose: prefer('Descansar', 'Noche') });
  await d.until((st) => st.night === true, { timeout: 10000, what: 'la noche' });
  await d.wait(1500);
  await d.settle();
  await d.milestone('lumbre_noche', (st) => need(st.night, 'sigue siendo de día'));
  const c = LUM.RING_CENTER;
  const router = (tx, ty) => d.eval(([x, y, avoid]) => window.__b13.routeAvoid(x, y, avoid), [tx, ty, STONE_AVOID]);
  await d.walkTo(c.x, c.y - 1, { onto: false, router, stopWhen: (st) => Math.abs(st.x - c.x) + Math.abs(st.y - c.y) === 1 });
  s = await d.snapState();
  await d.turn(s.x < c.x ? 6 : s.x > c.x ? 4 : s.y < c.y ? 2 : 8);
  await d.interact({ choose: prefer('Mirar el baile'), watch: [{ re: /Las piedras se encienden una a una/, name: 'baile_demo', delay: 600 }] });
  await d.expectSaid(/Te toca a ti/, 'el turno del jugador');
  await danceStones(d);
  await d.expectSaid(/la roca se aparta/, 'la peña que se abre');
  await d.milestone('t11_baile', (st) => need(flag(st, 'b13_t11_baile'), 'la gruta sigue cerrada'));
  const rock = LUM.MOON_ROCK;
  await d.walkTo(rock.x, rock.y, { router, stopWhen: (st) => st.map === 'lumbre_gruta' });
  await d.until((st) => st.map === 'lumbre_gruta' && st.ready, { timeout: 20000, what: 'la gruta de la luna' });
  await d.settle();
  const G = LUM.GROTTO;
  await d.talkTo(G.lucia.x, G.lucia.y, { watch: [{ re: /Te manda mi abuelo/, name: 'lucia', delay: 200 }] });
  await d.talkTo(G.pedestal.x, G.pedestal.y, { watch: [{ re: /losa rosada/, name: 'tabla_duende', delay: 200 }] });
  await d.walkTo(G.cell.x, G.cell.y);
  await d.settle();
  await d.milestone('t11_tablilla', (st) => need(flag(st, 'b13_t11_lucia') && (st.tablets.includes('PIXIEPLATE') || has(st, 'PIXIEPLATE'))
    && st.cells.includes(G.cell.key), 'sin Lucía, Tabla Duende o C063'));
  await d.leave(G.exit.x, G.exit.y, 'down', 'islote_lumbre');
  // De vuelta a Caleta: la fiesta de los farolillos.
  await d.startSwim(LUM.START.x, 0);
  await swimAcross(d, LUM.START.x, 0, 'up', 'mar_del_sur');
  const fiesta = [{ re: /fiesta de los farolillos/, name: 'fiesta_farolillos', delay: 400 }];
  await d.swimTo(CL.DIVERS.resonance.x + 6, 0);
  await d.crossEdge('up', 'caleta_sonda', { watch: fiesta });
  await d.settle({ watch: fiesta });
  await d.expectSaid(/Las luces de la ciudad hundida/, 'la pista del P7');
  await d.milestone('t11_fiesta', (st) => need(flag(st, 'b13_t11_fiesta') && has(st, 'CLEFABLITE'), 'sin fiesta o sin Clefablita'));
}

// ───────────────────────────── T12 · Volcán Tizón ─────────────────────────────

/** Plan de una sala de coladas (BFS sobre las reglas puras) desde un estado: [{ dir, push, dam }]. */
export function planRoom(n, sx, sy, start = roomStart(n)) {
  const enc = (px, py, st) => `${px},${py}|${Object.entries(st.blocks).map(([k, p]) => `${k}:${p ? p.join('.') : 'x'}`).join(';')}|${[...st.dammed].sort().join('')}`;
  const prev = new Map([[enc(sx, sy, start), null]]);
  const queue = [[sx, sy, start]];
  for (let head = 0; head < queue.length && head < 300000; head++) {
    const [px, py, st] = queue[head];
    const k = enc(px, py, st);
    if (isSolved(n, st)) {
      const out = [];
      let cur = k;
      while (prev.get(cur)) { const [from, move] = prev.get(cur); out.unshift(move); cur = from; }
      return out;
    }
    for (const dir of [2, 4, 6, 8]) {
      const [dx, dy] = DV[dir];
      let next = null;
      let move = null;
      if (walkable(n, st, px + dx, py + dy)) { next = [px + dx, py + dy, st]; move = { dir, push: false, dam: false }; } else {
        const r = push(n, st, px, py, dir);
        if (r.ok) { next = [r.dammed ? px : px + dx, r.dammed ? py : py + dy, r.state]; move = { dir, push: true, dam: Boolean(r.dammed) }; }
      }
      if (!next) continue;
      const nk = enc(...next);
      if (prev.has(nk)) continue;
      prev.set(nk, [k, move]);
      queue.push(next);
    }
  }
  throw new Error(`la sala ${n} no tiene solución desde (${sx},${sy})`);
}

/**
 * Resuelve la sala con teclas reales: cada vez planea desde el estado VIVO (posición y variable de la sala), da un
 * solo paso o empujón (tap) y vuelve a planear. Empujar = chocar con el bloque (evento de contacto).
 */
async function solveRoomLive(d, n) {
  let moves = 0;
  let stuck = 0;
  let last = '';
  for (;;) {
    const s = await d.snapState();
    const st = roomState(n, s.vars[`b13_colada_${n}`]);
    if (isSolved(n, st)) return moves;
    const key = `${s.x},${s.y}|${JSON.stringify(st)}`;
    stuck = key === last ? stuck + 1 : 0;
    if (stuck >= 3) throw new Error(`sala ${n}: sin avance en (${s.x},${s.y}) con ${JSON.stringify(st)}`);
    last = key;
    const [m] = planRoom(n, s.x, s.y, st);
    await d.tap(m.dir);
    moves += 1;
    if (moves > 400) throw new Error(`sala ${n}: demasiados movimientos`);
  }
}

/** Pasa por un túnel dentro de la cueva: se coloca delante de la boca y pulsa hacia ella hasta llegar a `arrive`. */
async function tunnel(d, door, dir, arrive, toMap = 'tizon_cueva') {
  const [dx, dy] = DV[DIR[dir]];
  await d.walkTo(door.x - dx, door.y - dy, { stopWhen: (s) => s.map === toMap && s.x === arrive.x && s.y === arrive.y });
  await d.step(DIR[dir]);
  await d.until((s) => s.map === toMap && s.x === arrive.x && s.y === arrive.y && s.ready, { timeout: 20000, what: `el túnel hacia (${arrive.x},${arrive.y}) en ${toMap}` });
  return d.settle();
}

async function openVent(d, n) {
  const v = ROOMS[n].vent;
  await d.talkTo(v.x, v.y, { choose: prefer('Sí') });
  const s = await d.snapState();
  if (!flag(s, `b13_t12_respiradero_${n}`)) throw new Error(`el respiradero ${n} sigue taponado`);
}

async function cave(d) {
  const E = CUE.EXITS;
  await tunnel(d, E.hallWest.door, 'left', E.hallWest.arrive);
  const p1 = await solveRoomLive(d, 1);
  await d.expectSaid(/Donde se corta el flujo, la roca se enfría/, 'el Core ante la primera costra');
  await openVent(d, 1);
  await d.milestone('colada_1', (s) => need(flag(s, 'b13_t12_respiradero_1'), `sala 1 (${p1} movimientos)`));
  await tunnel(d, E.r1North.door, 'up', E.r1North.arrive);
  await solveRoomLive(d, 2);
  await openVent(d, 2);
  await d.milestone('colada_2', (s) => need(flag(s, 'b13_t12_respiradero_2'), 'sala 2'));
  await tunnel(d, E.r2North.door, 'up', E.r2North.arrive);
  await solveRoomLive(d, 3);
  await openVent(d, 3);
  await d.expectSaid(/La montaña vuelve a respirar/, 'los tres respiraderos');
  await d.milestone('respiraderos', (s) => need(flag(s, 'b13_t12_respiraderos'), 'faltan respiraderos'));
  await tunnel(d, E.r3North.door, 'up', E.r3North.arrive, 'tizon_crater');
}

async function crater(d, retry) {
  const watch = [{ re: /Alguien ha reabierto los respiraderos/, name: 'jefa_perforacion', delay: 200 }, { scene: 'BattleScene', name: 'jefa_combate', delay: 3000 }];
  await d.settle({ watch });
  let s = await d.snapState();
  if (!flag(s, 'b13_t12_jefa')) {
    if (retry) await d.milestone('jefa_reintento', (st) => need(st.lost.includes('b13_jefa_perforacion') && st.x === CRATER.retry.x && st.y === CRATER.retry.y, `(${st.x},${st.y})`));
    await d.talkTo(CRATER.chief.x, CRATER.chief.y, { watch });
    s = await d.snapState();
  }
  await d.milestone('jefa_vencida', (st) => need(flag(st, 'b13_t12_jefa'), 'la sonda sigue'));
  await d.talk(CRATER.hearth.x, CRATER.hearth.y + 2, 'up', { watch: [{ re: /algo rojo brilla/, name: 'tabla_llama', delay: 200 }] });
  await d.milestone('t12_tablilla', (st) => need(st.tablets.includes('FLAMEPLATE') || has(st, 'FLAMEPLATE'), 'sin Tabla Llama'));
}

async function backToVillage(d) {
  const E = CUE.EXITS;
  await tunnel(d, { x: CRATER.exit.x, y: CRATER.exit.y }, 'down', { x: E.r3North.door.x, y: E.r3North.door.y + 2 });
  await tunnel(d, E.r3West.door, 'left', E.r3West.arrive);
  await tunnel(d, E.r2West.door, 'left', E.r2West.arrive);
  await tunnel(d, E.r1East.door, 'right', E.r1East.arrive);
  await tunnel(d, E.hallSouth.door, 'down', E.hallSouth.arrive, 'volcan_tizon');
}

export async function tizon(d, { retry = true } = {}) {
  let s = await d.snapState();
  if (s.map === 'mar_del_sur') {
    const c66 = MAR.CELLS.c066;
    await d.walkTo(c66.x, c66.y);
    await d.settle();
    await d.startSwim(MAR.W - 1, 30);
    await swimAcross(d, MAR.W - 1, 30, 'right', 'volcan_tizon');
  }
  const watch = [{ re: /Como si alguien le tapara la boca/, name: 'tizon_llegada', delay: 200 }];
  await d.swimTo(7, 30, { watch });
  await d.settle({ watch });
  await d.milestone('tizon_llegada', (st) => need(flag(st, 'b13_t12_llegada') && st.clues.some((c) => c.id === 'T12'), 'sin T12'));
  await d.walkTo(TIZ.FORGE.cell.x, TIZ.FORGE.cell.y);
  await d.settle();
  await d.talkTo(TIZ.FORGE.brasa.x, TIZ.FORGE.brasa.y, { watch: [{ re: /Soy Brasa/, name: 'brasa', delay: 200 }] });
  await d.milestone('t12_brasa', (st) => need(flag(st, 'b13_t12_brasa') && st.cells.includes(TIZ.FORGE.cell.key)
    && st.clues.some((c) => c.id === 'T12' && c.step === 2), 'sin la segunda pista de T12 o sin C067'));
  await d.push(TIZ.MINE.door.x, TIZ.MINE.door.y + 1, 'up', 'tizon_cueva', { watch: [{ scene: 'BattleScene', name: 'tecnico_bocamina', delay: 2500 }] });
  await cave(d);
  await crater(d, retry);
  await backToVillage(d);
  await d.talkTo(TIZ.FORGE.brasa.x, TIZ.FORGE.brasa.y, { watch: [{ re: /La forja arde/, name: 'forja_arde', delay: 300 }] });
  await d.expectSaid(/Un crisol que ningún fuego funde/, 'el crisol');
  await d.milestone('t12_forja', (st) => need(flag(st, 'b13_t12_forja') && has(st, 'HOUNDOOMINITE'), 'sin la forja o sin Houndoomita'));
}
