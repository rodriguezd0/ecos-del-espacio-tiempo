// Bloque 8 — Cámara de los Contrapesos (docs/CAMPANA.md B08, Pilar de la Masa): reglas PURAS del puzle
// (content/events/b08_balance_logic.js). Pesos (a pie 1, montado 3, bloque 2, piedra 1), placa y suelo quebradizo
// con 3 o más, arena solo montado, la Gran Balanza con solución única (A = bloque + bloque, B = bloque + piedra +
// piedra, C = piedra + jugador montado), plan de referencia completo y ausencia de estados sin salida.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CELL, WEIGHT, PRESS, PAN_TARGET, PIECES, PIECE_IDS, PANS, SPOTS, SOLUTION_TARGETS, cellAt, cellsOf, initialPuzzle,
  normalizePuzzle, step, pull, settle, resetPieces, balanceReading, balanceSolutions, walkRoute, planPiece,
  applyActions, referencePlan, playerCanStand, canToggleMount, landingSpot,
} from '../game/src/content/events/b08_balance_logic.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const at = (st, pieces) => ({ ...st, pieces: { ...st.pieces, ...pieces } });

test('pesos y umbrales literales de CAMPANA', () => {
  assert.deepEqual({ ...WEIGHT }, { stone: 1, block: 2, foot: 1, mounted: 3 });
  assert.equal(PRESS, 3);
  assert.equal(PAN_TARGET, 4);
  const kinds = PIECE_IDS.map((id) => PIECES[id].kind).sort();
  assert.deepEqual(kinds, ['block', 'block', 'block', 'stone', 'stone', 'stone'], '3 bloques y 3 piedras');
});

test('Gran Balanza: la única solución es A = 2 bloques, B = bloque + 2 piedras, C = piedra + jugador montado', () => {
  const sols = balanceSolutions();
  assert.equal(sols.length, 1, `soluciones: ${JSON.stringify(sols)}`);
  const [s] = sols;
  assert.deepEqual({ aB: s.aB, aS: s.aS, bB: s.bB, bS: s.bS, cB: s.cB, cS: s.cS, mounted: s.mounted },
    { aB: 2, aS: 0, bB: 1, bS: 2, cB: 0, cS: 1, mounted: true });
  assert.ok(sols.every((x) => x.mounted), 'la montura es imprescindible');
});

test('lectura de la Balanza: niveladas pero ligeras no abren; la solución de referencia sí', () => {
  const st = initialPuzzle();
  const target = at(st, Object.fromEntries(SOLUTION_TARGETS));
  const leverFrom = { x: SPOTS.leverFrom.x, y: SPOTS.leverFrom.y };
  assert.equal(balanceReading(target, { ...leverFrom, mounted: true }).solved, true);
  const onFoot = balanceReading(target, { ...leverFrom, mounted: false });
  assert.equal(onFoot.solved, false, 'a pie el platillo C pesa 2');
  assert.deepEqual(onFoot.lightest, ['C']);
  // Una piedra en cada platillo y el jugador a pie: niveladas (1, 1, 1) pero sin todo el peso → no cede.
  const light = at(st, { o1: [11, 12], o2: [17, 12], o3: [24, 12] });
  const r = balanceReading(light, { x: 25, y: 12, mounted: false });
  assert.equal(r.level, false, 'con el jugador en C, C pesa 2');
  const light2 = at(st, { o1: [11, 12], o2: [17, 12] });
  const r2 = balanceReading(light2, { x: 25, y: 12, mounted: false });
  assert.equal(r2.level, true);
  assert.equal(r2.light, true);
  assert.equal(r2.solved, false);
});

test('placa: a pie (1) no se hunde; montado (3) sí y queda enclavada; subir la plataforma habilita el foso', () => {
  const [[px, py]] = cellsOf(CELL.PLATE);
  const st = initialPuzzle();
  assert.equal(settle(st, px, py, false).pressed, false);
  const r = settle(st, px, py, true);
  assert.equal(r.pressed, true);
  assert.equal(r.state.plate, true);
  const [[fx, fy]] = cellsOf(CELL.PIT);
  assert.equal(playerCanStand(st, fx, fy, true), false, 'el foso sin plataforma');
  assert.equal(playerCanStand(r.state, fx, fy, true), true, 'la plataforma subida');
  assert.equal(resetPieces(r.state).plate, true, 'la palanca de retorno no baja la placa');
});

test('suelo quebradizo: a pie aguanta; montado se rompe y se cae sin daño a la galería inferior (C039)', () => {
  const [[fx, fy]] = cellsOf(CELL.FRAGILE);
  const st = initialPuzzle();
  const foot = settle(st, fx, fy, false);
  assert.equal(foot.fell, false);
  const mounted = settle(st, fx, fy, true);
  assert.equal(mounted.fell, true);
  assert.equal(mounted.broke, true);
  assert.deepEqual(mounted.at, [SPOTS.landing.x, SPOTS.landing.y]);
  assert.equal(cellAt(...mounted.at), CELL.LOW, 'se cae a la galería inferior');
  // Por el agujero se cae también a pie; los contrapesos no pasan por él.
  assert.equal(settle(mounted.state, fx, fy, false).fell, true);
  // La célula C039 está en la galería inferior, junto al punto de caída.
  assert.equal(cellAt(SPOTS.c039.x, SPOTS.c039.y), CELL.LOW);
  // Palanca de retorno: las losas rotas vuelven a su sitio.
  assert.deepEqual(resetPieces(mounted.state).holes, []);
});

test('arena profunda: solo se cruza montado; no se puede desmontar encima', () => {
  const st = initialPuzzle();
  const [sx, sy] = cellsOf(CELL.SAND)[0];
  assert.equal(playerCanStand(st, sx, sy, false), false);
  assert.equal(playerCanStand(st, sx, sy, true), true);
  assert.equal(canToggleMount(st, sx, sy, false), false);
  const eastWing = [33, 23];
  assert.equal(walkRoute(st, [SPOTS.entry.x, SPOTS.entry.y], eastWing, { mounted: false }), null, 'al ala este a pie');
  assert.ok(walkRoute(st, [SPOTS.entry.x, SPOTS.entry.y], eastWing, { mounted: true }), 'al ala este montado');
});

test('empujar y tirar: el contrapeso se mueve, el jugador no atraviesa nada', () => {
  const st = initialPuzzle();
  const { x, y } = PIECES.b1; // bloque en la sala de entrada
  const push = step(st, x, y + 1, 8, false);
  assert.equal(push.kind, 'push');
  assert.deepEqual(push.state.pieces.b1, [x, y - 1]);
  assert.deepEqual(push.at, [x, y + 1], 'empujar no mueve al jugador');
  const back = pull(push.state, x, y, 8, false);
  assert.equal(back.kind, 'pull');
  assert.deepEqual(back.state.pieces.b1, [x, y]);
  assert.deepEqual(back.at, [x, y + 1]);
  // Nada se empuja contra la roca ni a la arena.
  const [sx, sy] = cellsOf(CELL.SAND)[0];
  const beside = at(st, { b1: [sx - 1, sy] });
  assert.equal(step(beside, sx - 2, sy, 6, false).ok, false, 'un bloque no entra en la arena');
});

test('las piedras de la galería inferior no suben sin la placa (la plataforma es su único camino)', () => {
  const st = initialPuzzle();
  const player = { x: SPOTS.landing.x, y: SPOTS.landing.y, mounted: true };
  assert.equal(planPiece(st, 'o1', [17, 12], player), null, 'sin placa, la piedra llega a la Balanza');
  assert.ok(planPiece({ ...st, plate: true }, 'o1', [17, 12], player), 'con la placa hundida, la piedra sube');
});

test('plan de referencia: resuelve la Balanza desde la entrada sin pasos imposibles', () => {
  const plan = referencePlan();
  const again = applyActions(initialPuzzle(), { x: SPOTS.entry.x, y: SPOTS.entry.y, mounted: false }, plan.actions);
  assert.deepEqual(again.player, plan.player);
  const reading = balanceReading(again.state, again.player);
  assert.equal(reading.solved, true, JSON.stringify(reading.weights));
  assert.deepEqual([plan.player.x, plan.player.y, plan.player.mounted], [SPOTS.leverFrom.x, SPOTS.leverFrom.y, true]);
  for (const [id, target] of SOLUTION_TARGETS) assert.deepEqual(again.state.pieces[id], target, id);
  assert.ok(plan.actions.includes('montar'));
});

test('estados guardados: normalizar tolera datos rotos', () => {
  assert.deepEqual(normalizePuzzle(null), initialPuzzle());
  const odd = normalizePuzzle({ pieces: { b1: ['x', 3], o1: [20, 12] }, holes: ['1,1', '17,18', '17,18'], plate: 1 });
  assert.deepEqual(odd.pieces.b1, [PIECES.b1.x, PIECES.b1.y]);
  assert.deepEqual(odd.pieces.o1, [20, 12]);
  assert.deepEqual(odd.holes, ['17,18'], 'solo losas quebradizas y sin repetir');
  assert.equal(odd.plate, true);
});

/**
 * Grafo de posiciones (x, y, montado) con las reglas de la cámara (andar, montar/bajar, caer por el suelo
 * quebradizo). Los contrapesos, en su sitio (obstáculos). → Map clave → vecinas.
 */
function positionGraph(st) {
  const k = (x, y, m) => `${x},${y},${m ? 1 : 0}`;
  const graph = new Map();
  const queue = [[SPOTS.entry.x, SPOTS.entry.y, false]];
  graph.set(k(...queue[0]), null);
  while (queue.length) {
    const [x, y, m] = queue.shift();
    const next = [];
    if (canToggleMount(st, x, y, !m)) next.push([x, y, !m]);
    for (const d of [2, 4, 6, 8]) {
      const r = step(st, x, y, d, m);
      if (r.ok && r.kind === 'walk') next.push([r.at[0], r.at[1], m]);
    }
    graph.set(k(x, y, m), next.map((n) => k(...n)));
    for (const n of next) if (!graph.has(k(...n))) { graph.set(k(...n), null); queue.push(n); }
  }
  return graph;
}

test('sin casillas trampa: desde cualquier posición alcanzable se vuelve a la salida (también tras caer)', () => {
  for (const [label, st] of [['al entrar', initialPuzzle()], ['con la placa hundida', { ...initialPuzzle(), plate: true }]]) {
    const graph = positionGraph(st);
    const back = new Map();
    for (const [from, list] of graph) for (const to of list || []) { if (!back.has(to)) back.set(to, []); back.get(to).push(from); }
    const home = `${SPOTS.entry.x},${SPOTS.entry.y},0`;
    const ok = new Set([home]);
    const q = [home];
    while (q.length) for (const prev of back.get(q.shift()) || []) if (!ok.has(prev)) { ok.add(prev); q.push(prev); }
    const stuck = [...graph.keys()].filter((key) => !ok.has(key));
    assert.deepEqual(stuck, [], `${label}: posiciones sin vuelta`);
    assert.ok(graph.has(`${landingSpot(st).join(',')},1`), `${label}: la caída es alcanzable`);
  }
});

test('los platillos y la palanca: la palanca solo se acciona desde el hueco este del platillo C', () => {
  assert.equal(cellAt(SPOTS.lever.x, SPOTS.lever.y), CELL.LEVER);
  assert.deepEqual(PANS.C.at(-1), [SPOTS.leverFrom.x, SPOTS.leverFrom.y]);
  const around = Object.values(DV).map(([dx, dy]) => cellAt(SPOTS.lever.x + dx, SPOTS.lever.y + dy));
  assert.deepEqual(around.filter((c) => c !== CELL.VOID && c !== CELL.SOLID).sort(), ['C'], 'otra casilla toca la palanca');
});
