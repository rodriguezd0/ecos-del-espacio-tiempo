// Escalera de Estanques del Pilar de la Corriente (docs/CAMPANA.md B04, «Mazmorra»). Módulo PURO (sin DOM):
// estado del puzle, reglas del agua y grafo de accesos para el solucionador de los tests.
//
// Reglas de CAMPANA (literal):
//   - Un estanque LLENO levanta losas flotantes (puentes). Uno VACÍO deja caminar por su fondo.
//   - Cuatro compuertas C1–C4 dejan pasar el agua cuesta abajo, de E1 a E6.
//   - La NORIA sube el agua de E6 a E1, solo con su engranaje enganchado; la palanca del engranaje está en el
//     fondo de E4.
//   - Objetivo: cerrar el ciclo E1→E6→noria→E1 con todas las compuertas abiertas (así fluye la corriente del núcleo).
//   - Sin temporizador; una palanca en la entrada devuelve todo al estado inicial.
//
// Modelo (DECIDIDO-DEV, verificado con el solucionador de tests/b04_pilar.test.mjs): cada estanque cabe una
// «unidad» de agua (lleno/vacío) y hay dos unidades en total. Enlaces cuesta abajo:
//   E1 ─C1─ E2 ─── E3 ─C2─ E4 ─C3─ E5 ─C4─ E6 ─noria─ E1       (E2 y E3 comparten vaso: sin compuerta)
// Estado inicial: todo cerrado, noria desenganchada, E1 y E4 llenos. El agua baja mientras el enlace esté abierto
// y el estanque de abajo vacío; la noria enganchada sube la unidad de E6 a E1 si E1 está vacío.
// Solución de referencia (CAMPANA, 4 fases) con este modelo:
//   (1) abrir C1 y C2 (C3 cerrada): E1 se vacía (su agua para en E3) → por su fondo al mando de C3.
//   (2) cerrar C2 y abrir C3: E4 se vacía (C2 cerrada impide que E3 lo rellene) → palanca de la noria.
//   (3) abrir C4: E5 baja a E6, E6 se llena, la noria gira, sube el agua a E1 y de ahí a E2 (C2 cerrada):
//       suben las losas de E2.
//   (4) por las losas de E2 al mando de C2 y abrirlo: todas abiertas + noria = ciclo completo.

export const POND_COUNT = 6;
export const GATE_COUNT = 4;
/** Enlace i (0..4) = de E(i+1) a E(i+2); gate = índice de compuerta (0..3) o null (vaso comunicado). */
export const LINKS = Object.freeze([
  Object.freeze({ from: 0, to: 1, gate: 0 }), // E1 → E2 por C1
  Object.freeze({ from: 1, to: 2, gate: null }), // E2 ↔ E3: mismo vaso
  Object.freeze({ from: 2, to: 3, gate: 1 }), // E3 → E4 por C2
  Object.freeze({ from: 3, to: 4, gate: 2 }), // E4 → E5 por C3
  Object.freeze({ from: 4, to: 5, gate: 3 }), // E5 → E6 por C4
]);

/** Variables de la partida (state.var) y flag del ciclo completo. */
export const PUZZLE_VARS = Object.freeze({ gates: 'b04_compuertas', noria: 'b04_noria', water: 'b04_agua' });
export const CYCLE_FLAG = 'b04_ciclo';

const bit = (i) => 1 << i;
export const INITIAL = Object.freeze({ gates: 0, noria: false, water: bit(0) | bit(3) });

export const pondName = (i) => `E${i + 1}`;
export const gateName = (g) => `C${g + 1}`;
export const isFull = (water, i) => (water & bit(i)) !== 0;
export const isOpen = (gates, g) => (gates & bit(g)) !== 0;
export const allOpen = (gates) => gates === (1 << GATE_COUNT) - 1;
const count = (mask) => { let n = 0; for (let i = 0; i < POND_COUNT; i++) if (mask & bit(i)) n += 1; return n; };

/** Estado normalizado (copia) a partir de algo parecido: { gates, noria, water }. */
export function puzzleState(raw = INITIAL) {
  const gates = Number(raw.gates) & ((1 << GATE_COUNT) - 1);
  const water = Number(raw.water) & ((1 << POND_COUNT) - 1);
  return Object.freeze({ gates, noria: Boolean(raw.noria), water });
}

/** Estado del puzle guardado en la partida (o el inicial si aún no se tocó nada). */
export function readPuzzle(state) {
  if (!state || state.var(PUZZLE_VARS.water, null) === null) return puzzleState(INITIAL);
  return puzzleState({
    gates: state.var(PUZZLE_VARS.gates, 0),
    noria: state.var(PUZZLE_VARS.noria, 0) === 1,
    water: state.var(PUZZLE_VARS.water, INITIAL.water),
  });
}

/** Guarda el estado del puzle en la partida (API de GameState). */
export function writePuzzle(state, p) {
  state.setVar(PUZZLE_VARS.gates, p.gates);
  state.setVar(PUZZLE_VARS.noria, p.noria ? 1 : 0);
  state.setVar(PUZZLE_VARS.water, p.water);
}

/** ¿Ciclo completo? Todas las compuertas abiertas, la noria enganchada y agua en la escalera. */
export function cycleComplete(p) {
  return allOpen(p.gates) && p.noria && p.water !== 0;
}

const linkOpen = (gates, link) => link.gate === null || isOpen(gates, link.gate);

/**
 * Deja correr el agua hasta que se estabiliza. Devuelve { water, steps, noriaTurned, cycle }:
 * `steps` = movimientos en orden [{ from, to, by: 'C1'|'vaso'|'noria' }] (para animar). Con el ciclo completo el
 * agua circula sin fin: se devuelve cycle = true y el reparto que haya en ese momento.
 */
export function settle(p) {
  let water = p.water;
  const steps = [];
  let noriaTurned = false;
  if (cycleComplete(p)) return { water, steps, noriaTurned: true, cycle: true };
  for (let guard = 0; guard < 64; guard++) {
    let moved = false;
    // De abajo arriba: los estanques bajos se vacían antes y dejan sitio a los de arriba.
    for (let i = LINKS.length - 1; i >= 0; i--) {
      const l = LINKS[i];
      if (isFull(water, l.from) && !isFull(water, l.to) && linkOpen(p.gates, l)) {
        water = (water & ~bit(l.from)) | bit(l.to);
        steps.push({ from: l.from, to: l.to, by: l.gate === null ? 'vaso' : gateName(l.gate) });
        moved = true;
      }
    }
    if (p.noria && isFull(water, 5) && !isFull(water, 0)) {
      water = (water & ~bit(5)) | bit(0);
      steps.push({ from: 5, to: 0, by: 'noria' });
      noriaTurned = true;
      moved = true;
    }
    if (!moved) break;
  }
  return { water, steps, noriaTurned, cycle: false };
}

/**
 * Trinquete de seguridad de la noria (DECIDIDO-DEV; lo explica la placa junto al mando de C4): C4 no se abre con
 * la noria suelta (el agua quedaría presa en E6) y la noria no se suelta con C4 abierta. Así el orden de las fases
 * 2 → 3 de CAMPANA («se engancha la noria» antes de «abrir C4») es obligatorio. Con el ciclo completo nada se
 * mueve. → null si se puede, o el motivo: 'c4_trabada' | 'noria_trabada' | 'ciclo'.
 */
export function actionBlocked(p, action) {
  if (action.type === 'reset') return cycleComplete(p) ? 'ciclo' : null;
  if (cycleComplete(p)) return 'ciclo';
  if (action.type === 'gate' && action.gate === 3 && !isOpen(p.gates, 3) && !p.noria) return 'c4_trabada';
  if (action.type === 'noria' && p.noria && isOpen(p.gates, 3)) return 'noria_trabada';
  return null;
}

/** Acciones del jugador: { type: 'gate', gate } (alterna), { type: 'noria' } (alterna), { type: 'reset' }. */
export function applyAction(p, action) {
  let next;
  if (action.type === 'reset') next = puzzleState(INITIAL);
  else if (action.type === 'gate') next = puzzleState({ ...p, gates: p.gates ^ bit(action.gate) });
  else if (action.type === 'noria') next = puzzleState({ ...p, noria: !p.noria });
  else throw new Error(`Escalera de Estanques: acción desconocida ${JSON.stringify(action)}`);
  if (action.type === 'reset') return { state: next, steps: [], noriaTurned: false, cycle: false };
  const r = settle(next);
  return { state: puzzleState({ ...next, water: r.water }), steps: r.steps, noriaTurned: r.noriaTurned, cycle: r.cycle || cycleComplete(next) };
}

// ───────────────────────────── Accesos (grafo abstracto del mapa) ─────────────────────────────
// Zonas del mapa pilar_corriente (content/maps/b04/pilar_corriente_layout.js las sitúa en casillas):
//   entrada   rellano sur: palanca de reinicio, mando de C1, manantial; salida a la Garganta
//   este      pasillo oriental (sube por el lado de E2 y E3)    norte  franja al sur de E1
//   e1        fondo de E1 (vacío)          c3   repisa norte del mando de C3 (salto de vuelta a «norte»)
//   e2        vaso de E2 (fondo o losas)   c2   repisa del mando de C2 (solo por E2)
//   e3        vaso de E3 (fondo o losas: islote con objeto)
//   e4        fondo de E4 (vacío): palanca de la noria       oeste  paso suroeste (salto de vuelta a «entrada»)
//   e5        vaso de E5 (fondo o losas)   paso   franja entre E5 y E6
//   e6        vaso de E6 (fondo o losas)   c4   repisa del mando de C4
//   nucleo    isla del núcleo (losas del foso solo con el ciclo completo)
// Aristas: [a, b, condición(p) | null, sentido] — 'both' o 'oneway' (a → b, salientes).
export const EDGES = Object.freeze([
  ['entrada', 'este', null, 'both'],
  ['este', 'norte', null, 'both'],
  ['norte', 'e1', (p) => !isFull(p.water, 0), 'both'],
  ['e1', 'c3', (p) => !isFull(p.water, 0), 'both'],
  ['c3', 'norte', null, 'oneway'],
  ['este', 'e2', null, 'both'],
  ['e2', 'c2', null, 'both'],
  ['este', 'e3', null, 'both'],
  ['entrada', 'e4', (p) => !isFull(p.water, 3), 'both'],
  ['e4', 'oeste', (p) => !isFull(p.water, 3), 'both'],
  ['oeste', 'entrada', null, 'oneway'],
  ['oeste', 'e5', null, 'both'],
  ['e5', 'paso', null, 'both'],
  ['paso', 'e6', null, 'both'],
  ['e6', 'c4', null, 'both'],
  ['entrada', 'nucleo', (p) => cycleComplete(p), 'both'],
]);

/** Dónde está cada mando o palanca (zona) y qué acción hace. */
export const CONTROLS = Object.freeze([
  Object.freeze({ id: 'mando_c1', zone: 'entrada', action: Object.freeze({ type: 'gate', gate: 0 }) }),
  Object.freeze({ id: 'mando_c2', zone: 'c2', action: Object.freeze({ type: 'gate', gate: 1 }) }),
  Object.freeze({ id: 'mando_c3', zone: 'c3', action: Object.freeze({ type: 'gate', gate: 2 }) }),
  Object.freeze({ id: 'mando_c4', zone: 'c4', action: Object.freeze({ type: 'gate', gate: 3 }) }),
  Object.freeze({ id: 'palanca_noria', zone: 'e4', action: Object.freeze({ type: 'noria' }) }),
  Object.freeze({ id: 'palanca_reinicio', zone: 'entrada', action: Object.freeze({ type: 'reset' }) }),
]);

/** Zonas a las que llega el jugador desde `from` con el agua del estado `p`. */
export function reachableZones(p, from = 'entrada') {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const z = queue.shift();
    for (const [a, b, cond, dir] of EDGES) {
      if (cond && !cond(p)) continue;
      const nexts = [];
      if (a === z) nexts.push(b);
      if (dir === 'both' && b === z) nexts.push(a);
      for (const n of nexts) if (!seen.has(n)) { seen.add(n); queue.push(n); }
    }
  }
  return seen;
}

/** Texto breve del estado (depuración y tests): «C1 C3 · noria · E1 E4». */
export function describePuzzle(p) {
  const gates = [0, 1, 2, 3].filter((g) => isOpen(p.gates, g)).map(gateName).join(' ') || 'compuertas cerradas';
  const water = [0, 1, 2, 3, 4, 5].filter((i) => isFull(p.water, i)).map(pondName).join(' ') || 'sin agua';
  return `${gates} · ${p.noria ? 'noria enganchada' : 'noria suelta'} · llenos: ${water}`;
}

/** Cuenta de unidades de agua (siempre 2 salvo error). */
export const waterUnits = (p) => count(p.water);
