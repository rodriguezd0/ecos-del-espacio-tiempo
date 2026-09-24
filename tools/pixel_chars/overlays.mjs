// Superposiciones sobre la plantilla de cuerpo (misma rejilla de 18×16 que body_jacket.mjs), por
// clave de pose. Símbolos: C luz · c sombra · x borde oscuro · d abertura · k contorno · s mano.
// Solo se definen las filas afectadas; el resto queda transparente.

const ROWS = 16;
const BODY_Y = 16;
const EMPTY = '..................';

/** { y: fila } (y absoluta del frame, 16..31) → matriz de 16 filas. */
function sparse(map) {
  return Array.from({ length: ROWS }, (_, i) => map[BODY_Y + i] || EMPTY);
}

// Abrigo largo hasta la rodilla, abierto por delante (profesor).
const COAT_FRONT = {
  down0: sparse({ 25: '.....kCCdCcck.....', 26: '.....kCCdCcck.....', 27: '.....kxxdxxxk.....' }),
  down1: sparse({ 24: '.....kCCdCcck.....', 25: '.....kCCdCcck.....', 26: '.....kxxdxxxk.....' }),
  down3: sparse({ 24: '.....kCCdCcck.....', 25: '.....kCCdCcck.....', 26: '.....kxxdxxxk.....' }),
  left0: sparse({ 25: '.....kCCssCck.....', 26: '.....kCCCCcck.....', 27: '......kxxxxk......' }),
  left1: sparse({ 23: '.....kCCCssck.....', 24: '.....kCCCCcck.....', 25: '....kxxxxxxxk.....' }),
  left3: sparse({ 23: '.....kCCCCcck.....', 24: '.....kCCCCcck.....', 25: '....kxxxxxxxk.....' }),
};
export const COAT = {
  ...COAT_FRONT,
  up0: COAT_FRONT.down0,
  up1: COAT_FRONT.down1,
  up3: COAT_FRONT.down3,
};

// Delantal de casa (madre): peto con tirantes al cuello y faldón hasta medio muslo; de espaldas,
// lazo en la cintura. Coordenadas en la rejilla sin estirar (el estirado de adulto se aplica igual).
const APRON_BIB = {
  19: '.......C..C.......', 20: '.......CCCc.......', 21: '.......CCCc.......', 22: '.......CCCc.......',
  23: '.......CCCc.......', 24: '......CCCCcc......', 25: '.....kCCCCcck.....', 26: '.....kCCCCcck.....',
  27: '.....kxxxxxxk.....',
};
const APRON_SIDE = {
  19: '......C...........', 20: '......C...........', 21: '......C...........', 22: '......C...........',
  23: '......C...........', 24: '......C...........', 25: '.....kCc..........', 26: '.....kCc..........',
  27: '.....kxxk.........',
};
const APRON_BOW = { 23: '........CC........', 24: '......cCxxCc......', 25: '.......Cc.cC......' };

/** Desplaza un mapa { y: fila } `dy` filas (poses con el cuerpo elevado). */
function shiftMap(map, dy) {
  return Object.fromEntries(Object.entries(map).map(([y, row]) => [Number(y) + dy, row]));
}

export const APRON = {
  down0: sparse(APRON_BIB), down1: sparse(shiftMap(APRON_BIB, -1)), down3: sparse(shiftMap(APRON_BIB, -1)),
  left0: sparse(APRON_SIDE), left1: sparse(shiftMap(APRON_SIDE, -1)), left3: sparse(shiftMap(APRON_SIDE, -1)),
  up0: sparse(APRON_BOW), up1: sparse(shiftMap(APRON_BOW, -1)), up3: sparse(shiftMap(APRON_BOW, -1)),
};

// Falda larga acampanada (vecina).
const SKIRT_FRONT = {
  down0: sparse({
    25: '.....kCCCCcck.....', 26: '....kCCCCCccck....', 27: '....kCCCCCccck....', 28: '....kxxxxxxxxk....',
  }),
  down1: sparse({
    24: '.....kCCCCcck.....', 25: '....kCCCCCccck....', 26: '....kCCCCCccck....', 27: '....kCCCCCccck....',
    28: '....kxxxxxxxxk....',
  }),
  down3: sparse({
    24: '.....kCCCCcck.....', 25: '....kCCCCCccck....', 26: '....kCCCCCccck....', 27: '....kCCCCCccck....',
    28: '....kxxxxxxxxk....',
  }),
  left0: sparse({
    25: '.....kCCssCck.....', 26: '.....kCCCCcck.....', 27: '....kCCCCCcck.....', 28: '....kxxxxxxxk.....',
  }),
  left1: sparse({
    23: '.....kCCCssck.....', 24: '.....kCCCCcck.....', 25: '....kCCCCCcck.....', 26: '....kxxxxxxxxk....',
  }),
  left3: sparse({
    23: '.....kCCCCcck.....', 24: '.....kCCCCcck.....', 25: '....kCCCCCcck.....', 26: '....kxxxxxxxxk....',
  }),
};
export const SKIRT = {
  ...SKIRT_FRONT,
  up0: SKIRT_FRONT.down0,
  up1: SKIRT_FRONT.down1,
  up3: SKIRT_FRONT.down3,
};

// ───────────────────────── Elenco de la campaña ─────────────────────────

/** Superposición con los símbolos cambiados ({ C: 'Y', … }): permite dos piezas de distinto color. */
export function recolorOverlay(overlay, map) {
  const sub = (rows) => rows.map((r) => [...r].map((ch) => map[ch] || ch).join(''));
  return Object.fromEntries(Object.entries(overlay).map(([k, rows]) => [k, sub(rows)]));
}

/** Poses { down, left, up } con los símbolos del cuerpo cambiados (p. ej. manos → guantes). */
export function recolorPoses(poses, map) {
  const sub = (rows) => rows.map((r) => [...r].map((ch) => map[ch] || ch).join(''));
  return Object.fromEntries(Object.entries(poses).map(([dir, list]) => [dir, list.map((p) => ({ ...p, body: sub(p.body) }))]));
}

// Peto blanco del mono de los técnicos de Genesis, con el emblema (G) en el pecho; de espaldas, tirantes.
const PETO_BIB = {
  18: '......C..c........', 19: '......CCCcc.......', 20: '......CCGcc.......', 21: '......CCCcc.......',
  22: '......CCCcc.......', 23: '......CCCcc.......', 24: '......xxxxx.......',
};
const PETO_SIDE = { 19: '......CC..........', 20: '......CG..........', 21: '......CC..........', 22: '......CC..........', 23: '......cc..........' };
const PETO_BACK = { 18: '......c..c........', 19: '......c..c........', 20: '.......cc.........', 21: '.......cc.........', 22: '......c..c........' };
export const PETO = {
  down0: sparse(PETO_BIB), down1: sparse(shiftMap(PETO_BIB, -1)), down3: sparse(shiftMap(PETO_BIB, -1)),
  left0: sparse(PETO_SIDE), left1: sparse(shiftMap(PETO_SIDE, -1)), left3: sparse(shiftMap(PETO_SIDE, -1)),
  up0: sparse(PETO_BACK), up1: sparse(shiftMap(PETO_BACK, -1)), up3: sparse(shiftMap(PETO_BACK, -1)),
};

// Capa corta carbón del Líder Supremo (sobre la bata): de frente cubre hombros y deja ver el centro;
// de espaldas cubre la espalda. Símbolos Y (luz), y (sombra), Z (bajo).
const CAPE_FRONT = {
  18: '...kYYYk..kyyyk...', 19: '..kYYYYk..kyyyyk..', 20: '..kYYYYk..kyyyyk..', 21: '..kZZZZk..kZZZZk..', 22: '...kkkk....kkkk...',
};
const CAPE_BACK = {
  18: '...kYYYYYYYYyyk...', 19: '..kYYYYYYYYYyyyk..', 20: '..kYYYYYYYYYyyyk..', 21: '..kYYYYYYYYYyyyk..',
  22: '..kZZZZZZZZZZZZk..', 23: '...kkkkkkkkkkkk...',
};
const CAPE_SIDE = {
  18: '.....kYYYYyk......', 19: '.....kYYYYyyk.....', 20: '.....kYYYYyyk.....', 21: '.....kZZZZZZk.....', 22: '......kkkkkk......',
};
export const CAPE = {
  down0: sparse(CAPE_FRONT), down1: sparse(shiftMap(CAPE_FRONT, -1)), down3: sparse(shiftMap(CAPE_FRONT, -1)),
  left0: sparse(CAPE_SIDE), left1: sparse(shiftMap(CAPE_SIDE, -1)), left3: sparse(shiftMap(CAPE_SIDE, -1)),
  up0: sparse(CAPE_BACK), up1: sparse(shiftMap(CAPE_BACK, -1)), up3: sparse(shiftMap(CAPE_BACK, -1)),
};

// Maletín de instrumentos (técnicos): colgado de la mano derecha, solo visible de frente.
const CASE_ROWS = ['.............kkkkk', '.............kMMmk', '.............kkkkk'];
const caseAt = (y) => sparse(Object.fromEntries(CASE_ROWS.map((r, i) => [y + i, r])));
export const CASE = { down0: caseAt(26), down1: caseAt(26), down3: caseAt(25) };
