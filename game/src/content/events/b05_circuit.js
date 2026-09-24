// Lógica PURA del circuito de la subestación de Brontia (TABLILLAS T03: «reconectar los cables: un circuito de
// interruptores con un solo camino válido, para desviar el rayo de la torre a la red»). Sin DOM ni motor: la usan
// el mapa (para crear los eventos), los guiones y los tests (que demuestran que el camino válido es único).
//
// Tablero de 3×3 cajas de empalme (J<fila><col>) unidas por 12 interruptores (uno por cable entre cajas vecinas).
// La línea del pararrayos entra por J00 (arriba a la izquierda) y la red del pueblo sale por J22 (abajo a la derecha).
// Tres cajas están quemadas: derivan a tierra. Reglas (las explican la operaria y el esquema de la pared):
//   · La corriente recorre los interruptores CERRADOS desde J00.
//   · Si llega a una caja quemada, salta el diferencial: chispazo y todos los interruptores vuelven a abrirse.
//   · Si llega a J22 sin tocar ninguna caja quemada, la línea está conectada.
// Solo hay un camino de J00 a J22 que evite las cajas quemadas: J00 → J10 → J11 → J21 → J22.

export const ROWS = 3;
export const COLS = 3;
export const INPUT = 'J00';
export const OUTPUT = 'J22';
export const DAMAGED = Object.freeze(['J01', 'J12', 'J20']);

export const node = (r, c) => `J${r}${c}`;

/** Interruptores: { id, a, b, axis: 'h'|'v', r, c } (r, c = celda de la caja a). */
export const SWITCHES = Object.freeze((() => {
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c + 1 < COLS) out.push(Object.freeze({ id: `int_${r}${c}_${r}${c + 1}`, a: node(r, c), b: node(r, c + 1), axis: 'h', r, c }));
      if (r + 1 < ROWS) out.push(Object.freeze({ id: `int_${r}${c}_${r + 1}${c}`, a: node(r, c), b: node(r + 1, c), axis: 'v', r, c }));
    }
  }
  return out;
})());

/** Casilla del mapa de una caja o interruptor con el tablero en (x0, y0) (cajas cada 2 casillas). */
export function nodeTile(id, x0, y0) {
  const r = Number(id[1]); const c = Number(id[2]);
  return { x: x0 + 2 * c, y: y0 + 2 * r };
}
export function switchTile(sw, x0, y0) {
  return sw.axis === 'h' ? { x: x0 + 2 * sw.c + 1, y: y0 + 2 * sw.r } : { x: x0 + 2 * sw.c, y: y0 + 2 * sw.r + 1 };
}

/**
 * Evalúa el tablero con el conjunto de interruptores cerrados (ids).
 * → { result: 'ok' | 'short' | 'open', energized: [cajas con corriente], shortAt: caja quemada | null }
 */
export function evaluateCircuit(closed) {
  const on = new Set(closed);
  const seen = new Set([INPUT]);
  const queue = [INPUT];
  while (queue.length) {
    const n = queue.shift();
    for (const sw of SWITCHES) {
      if (!on.has(sw.id)) continue;
      const other = sw.a === n ? sw.b : (sw.b === n ? sw.a : null);
      if (other && !seen.has(other)) { seen.add(other); queue.push(other); }
    }
  }
  const energized = [...seen];
  const shortAt = energized.find((n) => DAMAGED.includes(n)) || null;
  if (shortAt) return { result: 'short', energized, shortAt };
  return { result: seen.has(OUTPUT) ? 'ok' : 'open', energized, shortAt: null };
}

/** Todos los caminos simples de INPUT a OUTPUT que no pasan por cajas quemadas (para los tests). */
export function validPaths() {
  const paths = [];
  const walk = (n, path) => {
    if (n === OUTPUT) { paths.push(path); return; }
    for (const sw of SWITCHES) {
      const other = sw.a === n ? sw.b : (sw.b === n ? sw.a : null);
      if (!other || path.includes(other) || DAMAGED.includes(other)) continue;
      walk(other, [...path, other]);
    }
  };
  walk(INPUT, [INPUT]);
  return paths;
}

/** Interruptores del camino válido (solución de referencia). */
export function solutionSwitches() {
  const [path] = validPaths();
  const out = [];
  for (let i = 0; i + 1 < path.length; i++) {
    const sw = SWITCHES.find((s) => (s.a === path[i] && s.b === path[i + 1]) || (s.b === path[i] && s.a === path[i + 1]));
    out.push(sw.id);
  }
  return out;
}
