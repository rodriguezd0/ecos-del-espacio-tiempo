// Niños del pueblo: cuerpo infantil (proporción de los charsets BW de Añil `nino`/`nina`: cabeza de
// ~15 filas y cuerpo de ~9) y cabezas de niño y niña. Misma rejilla de 18 px que body_jacket.mjs;
// la cabeza se dibuja 4 filas más abajo (`headLift: 4`). Todo PROVISIONAL (D30).
// Símbolos del cuerpo: L/J/j/d camiseta o vestido · S/s brazos · P/p pantalón corto · Q/q piernas
// (color de piel en la paleta) · B/b calzado · C/c/x falda (superposición).
import { toBack } from './body_jacket.mjs';
import { mirrorLimbs } from './assemble.mjs';

const EMPTY = '..................';
const pad = (rows) => [...Array(16 - rows.length).fill(EMPTY), ...rows];

const KID_DOWN0 = pad([
  '......kkkkkk......', // 22
  '....kkLLJJJjkk....', // 23
  '...kLdLLJJJjdjk...', // 24
  '...kSdLJJJjjdsk...', // 25
  '...kskPPPPPpksk...', // 26
  '....kkPPkkPpkk....', // 27
  '.....kQqkkQqk.....', // 28
  '....kBBBkkBBbk....', // 29
  '.....kkk..kkk.....', // 30
  EMPTY, // 31
]);

const KID_DOWN1 = pad([
  '......kkkkkk......', // 21
  '....kkLLJJJjkk....', // 22
  '...kLdLLJJJjdjk...', // 23
  '...kSdLJJJjjdsk...', // 24
  '...kskPPPPPpksk...', // 25
  '....kkQqkkPpkk....', // 26
  '....kBBBkkQqk.....', // 27
  '.....kkk.kQqk.....', // 28
  '.........kBBbk....', // 29
  '..........kkk.....', // 30
  EMPTY, // 31
]);

const KID_LEFT0 = pad([
  '.......kkkkk......', // 22
  '......kLLJJjk.....', // 23
  '......kJLLJjk.....', // 24
  '......kjSsjjk.....', // 25
  '......kPPPPpk.....', // 26
  '.......kPPpk......', // 27
  '.......kQqk.......', // 28
  '......kBBBk.......', // 29
  '......kkkk........', // 30
  EMPTY, // 31
]);

const KID_LEFT1 = pad([
  '.......kkkkk......', // 21
  '......kLLJJjk.....', // 22
  '......kJLLJjk.....', // 23
  '......kSsJjjk.....', // 24
  '......kPPPPpk.....', // 25
  '.....kPPkkppk.....', // 26
  '....kQqk..kqqk....', // 27
  '...kQqk....kqqk...', // 28
  '..kBBBk...kbbbk...', // 29
  '...kkk.....kkk....', // 30
  EMPTY, // 31
]);

const KID_LEFT3 = pad([
  '.......kkkkk......', // 21
  '......kLLJJjk.....', // 22
  '......kJLLJjk.....', // 23
  '......kjjSsjk.....', // 24
  '......kPPPPpk.....', // 25
  '.....kppkkPPk.....', // 26
  '....kqqk..kQqk....', // 27
  '...kqqk....kQqk...', // 28
  '..kbbbk...kBBBk...', // 29
  '...kkk.....kkk....', // 30
  EMPTY, // 31
]);

// Paso opuesto de frente: se espejan las piernas y se conserva el torso (luz a la izquierda).
const KID_DOWN3 = mirrorLimbs(KID_DOWN1, { keepRows: [5, 9], keepCols: [5, 12] });

export const KID_WALK = {
  down: [
    { key: 'kdown0', lift: 0, body: KID_DOWN0 },
    { key: 'kdown1', lift: -1, body: KID_DOWN1 },
    { key: 'kdown3', lift: -1, body: KID_DOWN3 },
  ],
  left: [
    { key: 'kleft0', lift: 0, body: KID_LEFT0 },
    { key: 'kleft1', lift: -1, body: KID_LEFT1 },
    { key: 'kleft3', lift: -1, body: KID_LEFT3 },
  ],
  up: [
    { key: 'kup0', lift: 0, body: toBack(KID_DOWN0) },
    { key: 'kup1', lift: -1, body: toBack(KID_DOWN1) },
    { key: 'kup3', lift: -1, body: toBack(KID_DOWN3) },
  ],
};

// Falda del vestido de la niña (sobre el pantalón corto de la plantilla).
const sparse = (map) => Array.from({ length: 16 }, (_, i) => map[16 + i] || EMPTY);
const SKIRT_FRONT = { 26: '.....kCCCCcck.....', 27: '....kxxxxxxxxk....' };
const SKIRT_SIDE = { 26: '......kCCCcck.....', 27: '.....kxxxxxxk.....' };
const up1 = (map) => Object.fromEntries(Object.entries(map).map(([y, r]) => [Number(y) - 1, r]));
export const KID_SKIRT = {
  kdown0: sparse(SKIRT_FRONT), kdown1: sparse(up1(SKIRT_FRONT)), kdown3: sparse(up1(SKIRT_FRONT)),
  kleft0: sparse(SKIRT_SIDE), kleft1: sparse(up1(SKIRT_SIDE)), kleft3: sparse(up1(SKIRT_SIDE)),
  kup0: sparse(SKIRT_FRONT), kup1: sparse(up1(SKIRT_FRONT)), kup3: sparse(up1(SKIRT_FRONT)),
};

// Niño del pueblo: pelo castaño revuelto con remolino; ojos grandes (3 filas) y mejillas.
export const NINO = {
  down: [
    EMPTY, EMPTY, EMPTY, // 0-2
    '.........kk.......', // 3
    '......kkkHhk......', // 4
    '....kkHHhhhhkk....', // 5
    '...kHHhhhhhhhhk...', // 6
    '..kHhhhhhhhhhhmk..', // 7
    '.kHhhhhhhhhhhhhmk.', // 8
    '.khhhhmhhhhmhhhmk.', // 9
    '.khhhmShhhmShhmmk.', // 10
    '.kmhmSSshmSSshmnk.', // 11
    '.kmSSSSSSSSSSSSmk.', // 12
    '.kSSSeeSSSSeeSSSk.', // 13
    '.kSSSweSSSSewSSSk.', // 14
    '.krSSeeSSSSeeSSrk.', // 15
    '..krssssssssssrk..', // 16
    '....kkkrrrrkkk....', // 17
  ],
  left: [
    EMPTY, EMPTY, EMPTY, // 0-2
    '..........kk......', // 3
    '.......kkkHhk.....', // 4
    '.....kkHHhhhhkk...', // 5
    '....kHHhhhhhhhhk..', // 6
    '...kHhhhhhhhhhhmk.', // 7
    '..kHhhhhhhhhhhhmk.', // 8
    '.kHhhhmhhhhhmhhmk.', // 9
    '.khhhmShhhhmhhmnk.', // 10
    'kmhhmSSmhhhhhmmnk.', // 11
    'kSSSSSSsmhoohmnk..', // 12
    'kSSeeSssmsromnk...', // 13
    'kSSweSssmoommk....', // 14
    'kSSeeSsrrmnnk.....', // 15
    '.krsssssrnkk......', // 16
    '..kkrrrrkk........', // 17
  ],
  up: [
    EMPTY, EMPTY, EMPTY, // 0-2
    '.........kk.......', // 3
    '......kkkHhk......', // 4
    '....kkHHhhhhkk....', // 5
    '...kHHhhhhhhhhk...', // 6
    '..kHhhhhmhhhhhmk..', // 7
    '.kHhhhhmhhhhmhhmk.', // 8
    '.khhhhmhhhhmhhhmk.', // 9
    '.kmhhmhhhhmhhhmnk.', // 10
    '.kmhmhhhmhhhmhmnk.', // 11
    'oknmhhmhhmhhmhnnko', // 12
    'osnmmhmmhmmhmmnnso', // 13
    '.oknmnmmnmmnmnnko.', // 14
    '..knnknnnnknnnk...', // 15
    '...kk.krrk.kkk....', // 16
    '.......kkkk.......', // 17
  ],
};

// Niña del pueblo: castaño rojizo con flequillo recto y dos coletas bajas con gomas (U). Una fila
// más baja que el niño: la coronilla es más redonda y la barbilla debe tocar el torso (fila 17).
export const NINA = {
  down: [
    EMPTY, EMPTY, EMPTY, EMPTY, // 0-3
    '......kkkkkk......', // 4
    '....kkHHHhhhkk....', // 5
    '...kHHhhhhhhhhk...', // 6
    '..kHhhhhhhhhhhmk..', // 7
    '.kHhhhhhhhhhhhhmk.', // 8
    '.khhhhhhhhhhhhmmk.', // 9
    '.khhmhhmhhmhhmmmk.', // 10
    'kUkmSSSSSSSSSSmkUk', // 11
    'khkSSSSSSSSSSSSkhk', // 12
    'khkSSeeSSSSeeSSkmk', // 13
    'khkSSweSSSSewSSkmk', // 14
    'kmkrSeeSSSSeeSrkmk', // 15
    'kmmkrssssssssrkmnk', // 16
    '.kk.kkkrrrrkkk.kk.', // 17
  ],
  left: [
    EMPTY, EMPTY, EMPTY, EMPTY, // 0-3
    '.......kkkkk......', // 4
    '.....kkHHHhhkk....', // 5
    '....kHHhhhhhhhk...', // 6
    '...kHhhhhhhhhhhk..', // 7
    '..kHhhhhhhhhhhhmk.', // 8
    '.khhhhhhhhhhhhmmk.', // 9
    '.khmhmhhhhhhhmmnk.', // 10
    'kmSSSSmhhhhhhmUUk.', // 11
    'kSSSSSsmhoohmkhhmk', // 12
    'kSSeeSssmsromkhmk.', // 13
    'kSSweSssmoommkhmk.', // 14
    'kSSeeSsrrmnnkhmk..', // 15
    '.krsssssrnkkkmk...', // 16
    '..kkrrrrkk..kk....', // 17
  ],
  up: [
    EMPTY, EMPTY, EMPTY, EMPTY, // 0-3
    '......kkkkkk......', // 4
    '....kkHHHhhhkk....', // 5
    '...kHHhhhhhhhhk...', // 6
    '..kHhhhhhhhhhhmk..', // 7
    '.kHhhhhhmhhhhhhmk.', // 8
    '.khhhhhhmhhhhhmmk.', // 9
    '.khhhhhhmhhhhmmmk.', // 10
    'kUkmhhhhmhhhhmmkUk', // 11
    'khkmmhhhmhhhmmnkhk', // 12
    'khkmmmhhmhhmmnnkmk', // 13
    'khknmmmmmmmmmnnkmk', // 14
    'kmkknnnnnnnnnnkkmk', // 15
    'kmmk.kkrrrrkk.kmnk', // 16
    '.kk....kkkk....kk.', // 17
  ],
};
