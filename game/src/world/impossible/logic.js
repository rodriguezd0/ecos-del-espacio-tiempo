// Espacio imposible (Mundo Distorsión, P6; reutilizable en el P10): lógica PURA, sin DOM ni motor.
// docs/CAMPANA.md B12 «Espacio imposible 2D (reglas)»:
//   · Vacío: una casilla sin suelo (capas 0 y 1 vacías) es vacío; quien termina un paso en ella cae (fundido y vuelta
//     a la última Ancla, sin daño ni contador). Solo en mapas con `impossible` en su definición.
//   · Anclas: postes de piedra; tocarlos fija el punto seguro (var `ancla_actual` = 'mapa|x|y|dir').
//   · Aristas: al pisar una veta violeta la pantalla gira 90° y se carga el mapa GEMELO precalculado; la posición
//     equivalente se obtiene girando la casilla alrededor del centro del mapa (mapas cuadrados → mismo tamaño).
//   · Puentes de la mirada: existen solo a ≤ `reach` casillas en la dirección en que mira el jugador; si gira encima
//     de uno, cae.
//   · Cascadas invertidas: ascensores de un solo sentido (base → cima) que se abren con un pulsador.
// Las caras de una sala de La Cara Vuelta se describen con una rejilla física de caracteres (FACET_CHARS) y se
// derivan las dos orientaciones con facetMasks().

/** Variable de la partida con la última Ancla tocada ('mapa|x|y|dir'). */
export const ANCHOR_VAR = 'ancla_actual';
/** Alcance por defecto de la mirada (CAMPANA: «a 4 casillas o menos en la dirección de avance»). */
export const GAZE_REACH = 4;

const DX = { 2: 0, 4: -1, 6: 1, 8: 0 };
const DY = { 2: 1, 4: 0, 6: 0, 8: -1 };
export const stepOf = (dir) => [DX[dir] ?? 0, DY[dir] ?? 0];

// ───────────────────────────── vacío ─────────────────────────────

/**
 * ¿La casilla (x, y) de un GameMap es vacío? Vacío = sin suelo: capas 0 y 1 sin tile. La capa 2 puede llevar
 * decorado que cuelga sobre el vacío (la cara de roca bajo el borde sur de una isla): no sostiene a nadie.
 * Fuera del mapa no es vacío.
 */
export function isVoidCell(map, x, y) {
  if (!map?.valid?.(x, y)) return false;
  return !map.data(x, y, 0) && !map.data(x, y, 1);
}

// ───────────────────────────── giros (aristas) ─────────────────────────────

/**
 * Casilla equivalente tras girar el mapa `turn` cuartos de vuelta (+1 horario, −1 antihorario) alrededor de su
 * centro. `w`, `h` = tamaño del mapa ORIGEN; el girado mide h × w. → [x', y']
 */
export function rotatePoint(x, y, w, h, turn) {
  const t = ((turn % 4) + 4) % 4;
  if (t === 0) return [x, y];
  if (t === 1) return [h - 1 - y, x];
  if (t === 2) return [w - 1 - x, h - 1 - y];
  return [y, w - 1 - x];
}

/** Dirección RMXP girada `turn` cuartos de vuelta (horario: arriba → derecha → abajo → izquierda). */
export function rotateDir(dir, turn) {
  const order = [8, 6, 2, 4];
  const i = order.indexOf(dir);
  if (i < 0) return dir;
  return order[(((i + turn) % 4) + 4) % 4];
}

/** Rejilla de texto girada `turn` cuartos de vuelta (filas de igual longitud). */
export function rotateRows(rows, turn) {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const t = ((turn % 4) + 4) % 4;
  const [W, H] = t % 2 ? [h, w] : [w, h];
  const out = Array.from({ length: H }, () => Array(W).fill(' '));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [nx, ny] = rotatePoint(x, y, w, h, turn);
      out[ny][nx] = rows[y][x];
    }
  }
  return out.map((r) => r.join(''));
}

/** Posición y dirección en el gemelo tras cruzar una arista. → { x, y, dir } */
export function twinPosition(w, h, x, y, dir, turn) {
  const [nx, ny] = rotatePoint(x, y, w, h, turn);
  return { x: nx, y: ny, dir: rotateDir(dir, turn) };
}

// ───────────────────────────── Anclas ─────────────────────────────

/** 'mapa|x|y|dir' ← { map, x, y, dir } */
export function encodeAnchor({ map, x, y, dir = 2 }) {
  if (!map || !Number.isInteger(x) || !Number.isInteger(y)) throw new Error('encodeAnchor: faltan mapa o casilla');
  return `${map}|${x}|${y}|${dir}`;
}

/** { map, x, y, dir } ← 'mapa|x|y|dir' (null si no es válido). */
export function decodeAnchor(value) {
  if (typeof value !== 'string') return null;
  const [map, x, y, dir] = value.split('|');
  const nx = Number(x);
  const ny = Number(y);
  if (!map || !Number.isInteger(nx) || !Number.isInteger(ny)) return null;
  return { map, x: nx, y: ny, dir: Number(dir) || 2 };
}

// ───────────────────────────── puentes de la mirada ─────────────────────────────

/** ¿(x, y) está a 1..reach casillas delante de (px, py) mirando hacia `dir`? */
export function inGaze(px, py, dir, x, y, reach = GAZE_REACH) {
  const [dx, dy] = stepOf(dir);
  if (!dx && !dy) return false;
  const ox = x - px;
  const oy = y - py;
  if (dx) return oy === 0 && Math.sign(ox) === dx && Math.abs(ox) <= reach;
  return ox === 0 && Math.sign(oy) === dy && Math.abs(oy) <= reach;
}

/**
 * ¿Existe ahora el puente de (x, y)? Existe si el jugador lo mira (a ≤ reach) o si está encima y no ha girado
 * desde que lo pisó. `player` = { x, y, dir, turned }.
 */
export function bridgeExists(player, x, y, reach = GAZE_REACH) {
  if (player.x === x && player.y === y) return !player.turned;
  return inGaze(player.x, player.y, player.dir, x, y, reach);
}

// ───────────────────────────── cascadas invertidas ─────────────────────────────

/** Ruta de la cascada invertida: pasos 'up' de la base a la cima (misma x). */
export function liftRoute(base, top) {
  if (base.x !== top.x || top.y >= base.y) throw new Error('liftRoute: la cima debe estar encima de la base, en la misma columna');
  return Array(base.y - top.y).fill('up');
}

// ───────────────────────────── caras (La Cara Vuelta) ─────────────────────────────

/**
 * Caracteres de la rejilla FÍSICA de una sala de dos orientaciones (0 = mapa base, 1 = gemelo girado):
 *   ' ' vacío en ambas          '.' suelo en ambas           '#' roca en ambas
 *   'A' suelo en 0 / pared en 1 'B' pared en 0 / suelo en 1  (la cara vuelta: «la pared pasa a ser suelo»)
 *   'a' suelo en 0 / vacío en 1 'b' vacío en 0 / suelo en 1
 *   '*' arista (veta violeta; suelo en ambas; pisarla gira)
 *   '@' Ancla (poste sobre suelo en ambas)   'S' llegada   'X' salida   'c' célula (suelo en la orientación que diga la sala)
 */
export const FACET_CHARS = Object.freeze({
  ' ': ['void', 'void'], '.': ['floor', 'floor'], '#': ['wall', 'wall'],
  A: ['floor', 'wall'], B: ['wall', 'floor'], a: ['floor', 'void'], b: ['void', 'floor'],
  '*': ['floor', 'floor'], '@': ['floor', 'floor'], S: ['floor', 'floor'], X: ['floor', 'floor'],
});

/** Tipo físico de una casilla ('void' | 'floor' | 'wall') en la orientación `orient` (0 | 1). */
export function facetKind(ch, orient, { cellOrient = 1 } = {}) {
  if (ch === 'c') return orient === cellOrient ? 'floor' : 'wall';
  const k = FACET_CHARS[ch];
  if (!k) throw new Error(`Cara: carácter desconocido «${ch}»`);
  return k[orient ? 1 : 0];
}

/**
 * Analiza la rejilla física (filas de igual longitud). → { w, h, rows, start, exit, aristas[], anchors[], cell }
 */
export function parseFacetRoom(rows, opts = {}) {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  if (!h || rows.some((r) => r.length !== w)) throw new Error('parseFacetRoom: filas de distinta longitud');
  const out = { w, h, rows: [...rows], start: null, exit: null, aristas: [], anchors: [], cell: null, cellOrient: opts.cellOrient ?? 1 };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      facetKind(ch, 0, out);
      if (ch === 'S') out.start = { x, y };
      else if (ch === 'X') out.exit = { x, y };
      else if (ch === '*') out.aristas.push({ x, y });
      else if (ch === '@') out.anchors.push({ x, y });
      else if (ch === 'c') out.cell = { x, y };
    }
  }
  if (!out.start || !out.exit) throw new Error('parseFacetRoom: falta la llegada (S) o la salida (X)');
  return out;
}

/**
 * Máscaras de una orientación EN COORDENADAS DEL MAPA de esa orientación (con un margen de vacío `margin`
 * alrededor): { size, floor: Set, wall: Set, vuelta: Set (paredes que son suelo en la otra), map(x, y) → [mx, my] }.
 * La orientación 1 es la rejilla física girada 90° en sentido horario.
 */
export function facetMasks(room, orient, margin = 0) {
  const size = Math.max(room.w, room.h) + margin * 2;
  const W = room.w + margin * 2;
  const H = room.h + margin * 2;
  const toMap = (x, y) => (orient ? rotatePoint(x + margin, y + margin, W, H, 1) : [x + margin, y + margin]);
  const floor = new Set();
  const wall = new Set();
  const vuelta = new Set();
  for (let y = 0; y < room.h; y++) {
    for (let x = 0; x < room.w; x++) {
      const ch = room.rows[y][x];
      const kind = facetKind(ch, orient, room);
      const [mx, my] = toMap(x, y);
      const k = `${mx},${my}`;
      if (kind === 'floor') floor.add(k);
      else if (kind === 'wall') {
        wall.add(k);
        if (facetKind(ch, orient ? 0 : 1, room) === 'floor') vuelta.add(k);
      }
    }
  }
  return { size, width: orient ? H : W, height: orient ? W : H, floor, wall, vuelta, map: toMap };
}

/**
 * Grafo de estados (x, y, orientación) de una sala para pruebas y solucionadores: vecinos a pie (suelo de la
 * orientación actual) y giro al pisar una arista (cambia la orientación en la misma casilla física).
 * → (state) => [state…]; state = { x, y, o }
 */
export function facetNeighbours(room) {
  const aristas = new Set(room.aristas.map((a) => `${a.x},${a.y}`));
  const walk = (x, y, o) => x >= 0 && y >= 0 && x < room.w && y < room.h && facetKind(room.rows[y][x], o, room) === 'floor';
  return ({ x, y, o }) => {
    const out = [];
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (!walk(nx, ny, o)) continue;
      // Pisar una arista gira: se llega a la misma casilla en la otra orientación.
      out.push(aristas.has(`${nx},${ny}`) ? { x: nx, y: ny, o: 1 - o } : { x: nx, y: ny, o });
    }
    return out;
  };
}

/** BFS sobre facetNeighbours desde `from` ({x, y, o}). → Set de claves 'x,y,o' */
export function facetReach(room, from) {
  const next = facetNeighbours(room);
  const k = (s) => `${s.x},${s.y},${s.o}`;
  const seen = new Set([k(from)]);
  const q = [from];
  while (q.length) {
    const s = q.shift();
    for (const n of next(s)) {
      if (seen.has(k(n))) continue;
      seen.add(k(n));
      q.push(n);
    }
  }
  return seen;
}
