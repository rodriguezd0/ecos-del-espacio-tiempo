// Caras que giran (Mundo Distorsión profundo, docs/CAMPANA.md B22: «Fijar tres "caras" con el Anclaje»; X16 y
// biblia §8: el Anclaje espacial «fija una orientación inestable»). Lógica PURA (sin DOM ni motor): la usan los
// eventos (b22a_faces.js), la construcción de los mapas, las pruebas (BFS) y el E2E.
//
// Una cara es una losa de piedra suspendida sobre el vacío con un dibujo tallado (un centro y dos brazos de 2
// casillas): mientras nadie la sujete gira sola un cuarto de vuelta cada FACE_PERIOD fotogramas y no se puede pisar
// (su dibujo es solo un reflejo sobre el vacío). Anclada con Zygarde, se queda en la orientación que tenía en ese
// instante y su dibujo se vuelve suelo firme. Orientación 0 = la forma base; cada +1, un cuarto de vuelta horario.
//   Barra (I): N+S · E+W · N+S · E+W        Codo (L): N+E · E+S · S+W · W+N

export const ARM = 2;
export const SIDES = Object.freeze(['N', 'E', 'S', 'W']);
export const SIDE_VECTOR = Object.freeze({ N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] });
export const SHAPES = Object.freeze({ I: Object.freeze(['N', 'S']), L: Object.freeze(['N', 'E']) });
/** Fotogramas que la cara pasa en cada orientación mientras gira (≈1,7 s). */
export const FACE_PERIOD = 100;
/** Fotogramas finales de cada orientación en los que el reflejo parpadea (aviso del giro). */
export const FACE_WARN = 24;
/** Nombre de las orientaciones para los textos. */
export const SIDE_NAMES = Object.freeze({ N: 'norte', E: 'este', S: 'sur', W: 'oeste' });

/** Variable de la partida con la orientación anclada de una cara (null o -1 = gira libre). */
export const faceVar = (id) => `b22a_cara_${id}`;

/** Lados que une el dibujo de una cara de forma `shape` en la orientación `o` (0–3). */
export function sidesAt(shape, o) {
  const base = SHAPES[shape];
  if (!base) throw new Error(`Cara: forma desconocida «${shape}» (I | L)`);
  const k = ((Number(o) % 4) + 4) % 4;
  return base.map((s) => SIDES[(SIDES.indexOf(s) + k) % 4]);
}

/** ¿El dibujo de la cara en la orientación `o` llega al lado `side`? */
export const pointsTo = (face, o, side) => o !== null && o !== undefined && sidesAt(face.shape, o).includes(side);

/**
 * Casillas de la cara (centro + 2 por cada lado = 9): [{ x, y, side: 'N'|…|null, k: índice del brazo 1–2 (0 el
 * centro), key: 'c' | 'N1' … }]. `end` marca la punta de cada brazo (la que toca una isla o el corazón).
 */
export function faceCells(face) {
  const out = [{ x: face.cx, y: face.cy, side: null, k: 0, key: 'c', end: false }];
  for (const side of SIDES) {
    const [dx, dy] = SIDE_VECTOR[side];
    for (let k = 1; k <= ARM; k++) out.push({ x: face.cx + dx * k, y: face.cy + dy * k, side, k, key: `${side}${k}`, end: k === ARM });
  }
  return out;
}

/** ¿La casilla `cell` de la cara forma parte del dibujo en la orientación `o`? */
export function cellInPattern(face, cell, o) {
  if (o === null || o === undefined || o < 0) return false;
  return cell.side === null || sidesAt(face.shape, o).includes(cell.side);
}

/** Casillas ('x,y') del dibujo de la cara en la orientación `o`. */
export function patternCells(face, o) {
  return new Set(faceCells(face).filter((c) => cellInPattern(face, c, o)).map((c) => `${c.x},${c.y}`));
}

/** Casilla de fuera que toca la punta del brazo `side` (donde empieza la isla o el corazón). */
export function beyond(face, side) {
  const [dx, dy] = SIDE_VECTOR[side];
  return { x: face.cx + dx * (ARM + 1), y: face.cy + dy * (ARM + 1) };
}

/** Orientación mientras gira: función del contador de fotogramas del rotor. */
export const rotorPhase = (t) => Math.floor(Math.max(0, t) / FACE_PERIOD) % 4;
/** ¿El reflejo parpadea (va a girar)? */
export const rotorWarning = (t) => Math.max(0, t) % FACE_PERIOD >= FACE_PERIOD - FACE_WARN;

/** Orientación anclada de una cara en la partida (0–3) o null si gira libre. */
export function anchoredOf(state, face) {
  const v = state?.var?.(faceVar(face.id), null);
  const n = Number(v);
  return v === null || v === undefined || v === '' || !Number.isInteger(n) || n < 0 || n > 3 ? null : n;
}

/** Orientaciones en las que la cara apunta a su corazón (lado `heart`). */
export const heartOrientations = (face) => [0, 1, 2, 3].filter((o) => pointsTo(face, o, face.heart));

/** ¿Miran las tres caras al corazón a la vez? (el corazón se abre). */
export function heartReady(state, faces) {
  return faces.length > 0 && faces.every((f) => f.heart && pointsTo(f, anchoredOf(state, f), f.heart));
}

/** Descripción de una orientación para los textos: «norte y este». */
export function orientationText(face, o) {
  return sidesAt(face.shape, o).map((s) => SIDE_NAMES[s]).join(' y ');
}
