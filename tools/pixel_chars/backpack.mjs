// Mochila de los protagonistas (decisión D06 del autor, 24-09-2026: llevan mochila, preferida a la
// bandolera). Se aplica como transformación de las poses de cuerpo (misma rejilla de 18×16 que
// body_jacket.mjs), así sigue el rebote de cada frame sin dibujar a mano cada pose:
//   · de frente: dos correas verticales sobre el pecho (columnas 6 y 11, junto a los brazos);
//   · de perfil: volumen de la bolsa detrás de la espalda y correa sobre el hombro;
//   · de espaldas: la bolsa completa con solapa, centrada.
// Símbolos nuevos de paleta: A luz · a base · D sombra · z costura/solapa (k = contorno común).

const STRAP_COLS = [6, 11];
const STRAP_ROWS = 5;

// Bolsa de espaldas (8 de ancho) y de perfil (4 de ancho, pegada al contorno de la espalda).
const BACK_BAG = {
  walk: ['.kkkkkk.', 'kAAAAaak', 'kAaaaaDk', 'kzzzzzzk', 'kAaaaaDk', 'kDDDDDDk', '.kkkkkk.'],
  run: ['.kkkkkk.', 'kAAAAaak', 'kzzzzzzk', 'kAaaaaDk', 'kDDDDDDk', '.kkkkkk.'],
};
const SIDE_BAG = {
  walk: ['kkk.', 'kAak', 'kzzk', 'kAak', 'kaDk', 'kDDk', 'kkk.'],
  run: ['kkk.', 'kAak', 'kzzk', 'kaDk', 'kDDk', 'kkk.'],
};
const BACK_BAG_X = 5;

/** Índice de la primera fila con contorno (línea superior de los hombros). */
export function shoulderRow(rows) {
  const y = rows.findIndex((r) => r.includes('k'));
  if (y < 0) throw new Error('mochila: pose sin contorno');
  return y;
}

/** Copia de `rows` con `patch` (matriz; '.' = no tocar) pegada en (x, y). */
export function paste(rows, patch, x, y) {
  const out = rows.map((r) => [...r]);
  patch.forEach((line, j) => {
    [...line].forEach((ch, i) => {
      if (ch === '.') return;
      const row = out[y + j];
      if (!row || x + i < 0 || x + i >= row.length) throw new Error(`mochila: se sale de la rejilla en (${x + i}, ${y + j})`);
      row[x + i] = ch;
    });
  });
  return out.map((r) => r.join(''));
}

function frontStraps(rows) {
  const top = shoulderRow(rows);
  let out = rows;
  STRAP_COLS.forEach((x, side) => {
    for (let j = 1; j <= STRAP_ROWS; j++) {
      const ch = j === STRAP_ROWS ? 'D' : side === 0 ? 'A' : 'a';
      out = paste(out, [ch], x, top + j);
    }
  });
  return out;
}

function sideBag(rows, kind) {
  const top = shoulderRow(rows);
  const line = rows[top + 1];
  const back = line.lastIndexOf('k');
  let out = paste(rows, SIDE_BAG[kind], back, top + 1);
  // Correa que pasa por encima del hombro, justo delante de la bolsa.
  out = paste(out, ['aa'], back - 2, top + 1);
  return out;
}

function backBag(rows, kind) {
  const top = shoulderRow(rows);
  return paste(rows, BACK_BAG[kind], BACK_BAG_X, top + 1);
}

/**
 * Poses { down, left, up } → nuevas poses con mochila (no modifica las originales).
 * Las claves que empiezan por 'r' son de carrera (torso más corto: bolsa de 6 filas).
 */
export function withBackpack(poses) {
  const kindOf = (p) => (p.key.startsWith('r') ? 'run' : 'walk');
  return {
    down: poses.down.map((p) => ({ ...p, body: frontStraps(p.body) })),
    left: poses.left.map((p) => ({ ...p, body: sideBag(p.body, kindOf(p)) })),
    up: poses.up.map((p) => ({ ...p, body: backBag(p.body, kindOf(p)) })),
  };
}
