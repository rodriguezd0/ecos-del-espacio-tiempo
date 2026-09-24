// Cabezas del elenco de la campaña (Guardianes, Sol y oficios). Rejilla local de 18 px, filas y=0..17
// (pueden pasar de 18 filas cuando el pelo cae por la espalda). Símbolos en palettes_campaign.mjs.
// Todas PROVISIONALES (D30); ver docs/arte.md §7.
import { PROFESOR, VECINO } from './heads_cast.mjs';

// Filas de cara compartidas (ojos 2×2 con brillo exterior).
const EYES_DOWN = ['..krswesSSsewsrk..', '..krssesSSsessrk..'];
const JAW_DOWN = ['...krssssssssrk...', '.....kkrrrrkk.....'];
const FACE_LEFT = [
  'kSSewsssmsromnk...', // 13
  'kSsessssmoommk....', // 14
  '.kssssssrmnnk.....', // 15
  '..krssssrnkk......', // 16
  '...kkrrrkk........', // 17
];
const NAPE_UP = [
  'osnmhhmhhmhhhmmnso', // 11
  'osnmmhhmhhmhhmmnso', // 12
  '.oknmmmhmmhmmmnko.', // 13
  '..knnmmmmmmmmnnk..', // 14
  '...kknnnnnnnnkk...', // 15
  '.....kkrrrrkk.....', // 16
  '.......kkkk.......', // 17
];

/**
 * Gafas redondas sobre una cabeza con la cara estándar (ojos en columnas 5–6 y 11–12, filas 14–15 de
 * frente; ojo en columnas 3–4, fila 13 de perfil). `tint`: el cristal ('l') tapa el blanco del ojo.
 * Devuelve una cabeza nueva (no modifica la original).
 */
export function withGlasses(head, { tint = true } = {}) {
  const patch = (rows, y, cols) => rows.map((r, i) => {
    if (i !== y) return r;
    const out = [...r];
    for (const [x, ch] of cols) out[x] = ch;
    return out.join('');
  });
  const bar = (x0) => [0, 1, 2, 3].map((i) => [x0 + i, 'g']);
  let down = head.down;
  down = patch(down, 13, [...bar(4), ...bar(10)]);
  down = patch(down, 14, [[4, 'g'], [7, 'g'], [8, 'g'], [9, 'g'], [10, 'g'], [13, 'g'], ...(tint ? [[5, 'l'], [12, 'l']] : [])]);
  down = patch(down, 15, [...bar(4), ...bar(10)]);
  let left = head.left;
  left = patch(left, 12, bar(2));
  left = patch(left, 13, [[2, 'g'], [5, 'g'], ...(tint ? [[4, 'l']] : [])]);
  left = patch(left, 14, bar(2));
  return { down, left, up: head.up };
}

// ─────────────────────────── Guardianes ───────────────────────────

// Leandro Alcántara (38, orgullo): pelo oscuro peinado hacia atrás con tupé, cejas rectas y barba de
// pocos días que marca la mandíbula.
export const LEANDRO = {
  down: [
    '..................', '..................', '....kkkHHHhkk.....', '...kHHhhhhhhhkk...',
    '..kHhhhhhhhhhhhk..', '..khhhhhhhhhhhmk..', '.kHhhhhhhhhhhhmmk.', '.khhhmhhhhhmhhmmk.',
    '.kmhhhmhhhhhmhmnk.', '.kmhhhhmmmmhhhmnk.', '.kmhhmSSSSSSmhmnk.', 'osnmmSSSSSSSSmnnso',
    'osnmSSSSSSSSSSmnso', '.okmSnnSSSSnnSmko.', EYES_DOWN[0], '..kFssesSSsessFk..',
    '...kFfssssssfFk...', '.....kkffffkk.....',
  ],
  left: [
    '..................', '..................', '.....kkkHHHhkk....', '....kHHhhhhhhhkk..',
    '...kHhhhhhhhhhhhk.', '..kHhhhhhhhhhhhmk.', '..khhhhhhhhhhhhmk.', '.khhhmhhhhhhhhmmk.',
    '.kmhhhmhhhhhhmmnk.', '.kSmhhhmmhhhmmnnk.', 'kSSSmmhhhmhhmmnk..', 'kSSSSmmhmhhmmnnk..',
    '.kSnnsmhmoohmnk...', 'kSSewsssmsromnk...', 'kSsesssFmoommk....', '.kssssFFrmnnk.....',
    '..kFffFrnkk.......', '...kkkkkk.........',
  ],
  up: [
    '..................', '..................', '....kkkHHHhkk.....', '...kHHhhhhhhhkk...',
    '..kHhhhhhhhhhhhk..', '..khhhhhhhhhhhmk..', '.kHhhhhhhhhhhhmmk.', '.khhhhmhhhhmhhmmk.',
    '.kmhhhhmhhmhhhmnk.', '.kmhhhhhmmhhhhmnk.', '.kmhhmhhhhhhmhmnk.', 'osnmhmhhhhhhmhmnso',
    'osnmmhhhhhhhhmmnso', ...NAPE_UP.slice(2),
  ],
};

// Abril Céspedes (19, tedio): media melena rubio ceniza revuelta hacia su izquierda por el viento y
// párpados a media asta (aburrimiento, no enfado).
export const ABRIL = {
  down: [
    '..................', '..................', '.....kkkkkk..kk...', '...kkHHhhhhkkHhk..',
    '..kHHhhhhhhhhhhk..', '.kHhhhhhhhhhhhhmkk', '.khhhhhhhhhhhhhmmk', 'kHhhhhhhhhhhhhmmk.',
    'khhhhhhhmhhhhhmmk.', 'kmhhhhhmhhhmhhmnk.', 'kmhhhmhhSmhhSmhnk.', 'kmhhmhhSSSmmSSmnso',
    'kmhmhSSSSSSSSSmnso', '.kmmSSSSSSSSSSmko.', '..krsoesSSseosrk..', '..kmssesSSsessrk..',
    '...krsssrrsssrk...', '.....kkrrrrkk.....',
  ],
  left: [
    '..................', '..................', '.......kkkkk..kk..', '.....kkHHhhhkkHhk.',
    '....kHHhhhhhhhhhk.', '...kHhhhhhhhhhhhmk', '..kHhhhhhhhhhhhhmk', '.kHhhhhhhhhhhhhmmk',
    '.khhhhhhhhhhhhhmnk', 'khhhhmhhhhhhhhmnk.', 'kmhhmShmhhhhhmmnk.', 'kSSmSSmhhmhhhmnk..',
    '.kSSSsmhmoohhmnk..', 'kSSoesssmsromnk...', ...FACE_LEFT.slice(1),
  ],
  up: [
    '..................', '..................', '.....kkkkkk..kk...', '...kkHHhhhhkkHhk..',
    '..kHHhhhhhhhhhhk..', '.kHhhhhhhhhhhhhmkk', '.khhhhhmhhhhhhhmmk', 'kHhhhhmhhhhmhhmmk.',
    'khhhhmhhhhmhhhmmk.', 'kmhhmhhhhmhhhhmnk.', 'kmhmhhhhmhhhhmmnk.', 'kmmhhhmhhhmhhmmnso',
    'knmmhmhhhmhhmmmnso', '.knmmmmhmmhmmmnko.', ...NAPE_UP.slice(3),
  ],
};

// Casco de minero con lámpara (Fermín y Sol): de frente la lámpara corona el casco; de perfil apunta
// hacia delante.
// La coronilla empieza en la fila 2, como el resto: con el torso estirado de adulto (tall) y el paso
// elevado, la fila 1 quedaría fuera del frame.
const HELMET_DOWN = [
  '..................', '..................', '......kkkkkk......', '....kkUkYYkuukk...',
  '...kUUUkyykuuuuk..', '..kUUUUUkkuuuuuuk.', '.kUUUUUUUUuuuuuuk.', '.kUUUUUUUuuuuuuuk.',
  'kvvvvvvvvvvvvvvvvk', '.kkkkkkkkkkkkkkkk.',
];
const HELMET_LEFT = [
  '..................', '..................', '.....kkkkkkk......', '...kkUUUUUuukk....',
  'kkkUUUUUUUuuuuk...', 'kYkUUUUUUuuuuuuk..', 'kYkUUUUUUuuuuuuuk.', 'kkvvvvvvvvvvvvvvk.',
  'kvvvvvvkkkkkkkkk..',
];
const HELMET_UP = [
  '..................', '..................', '.....kkkkkkkk.....', '...kkUUUUUUuukk...',
  '..kUUUUUUUUuuuuk..', '.kUUUUUUUuuuuuuuk.', '.kUUUUUUuuuuuuuuk.', 'kvvvvvvvvvvvvvvvvk',
  '.kkkkkkkkkkkkkkkk.',
];

// Fermín Galena (51, carga familiar): casco ocre con lámpara, barba canosa y cejas caídas (cansancio).
export const FERMIN = {
  down: [
    ...HELMET_DOWN, '.kmhSSSSSSSSSShmk.', 'osnmSSSSSSSSSSmnso', 'osnmSSSSSSSSSSmnso', '.okmnnSSSSSSnnmko.',
    EYES_DOWN[0], '..kFssesSSsessFk..', '..kFFfsrrrrsfFFk..', '...kFFFffffFFFk...',
  ],
  left: [
    ...HELMET_LEFT, '.kkkkSmhhhhhmmnk..', '.kSSSSmhhhhmmnnk..', 'kSSSSSmhhhmmnnk...', '.kSnnsmhmoohmnk...',
    'kSSewsssmsromnk...', 'kSseFssFmoommk....', '.kFFFFFFrmnnk.....', '..kFFffFnkk.......', '...kkkkkk.........',
  ],
  up: [...HELMET_UP, '.kmhhhhmhhmhhhmnk.', '.kmhhmhhhhhhmhmnk.', ...NAPE_UP],
};

// Sol Galena (hija de Fermín): casco blanco con lámpara y trenza a la espalda.
export const SOL = {
  down: [
    ...HELMET_DOWN, '.kmhhhmhhhmhhhhmk.', 'osnmhSmhhhmSShmnso', 'osnmSSSmhmSSSSmnso', '.okmSSSSSSSSSSmko.',
    ...EYES_DOWN, ...JAW_DOWN,
  ],
  left: [
    ...HELMET_LEFT, '.kkkkhmhhhhhmmnk..', '.kSSmhhhhhhmmnnk..', 'kSSSSmhhhhmmnnkk..', '.kSSSsmhmoohmnkhk.',
    'kSSewsssmsromnkhk.', 'kSsessssmoommkkhk.', '.kssssssrmnnk.khk.', '..krssssrnkk..khk.', '...kkrrrkk.....k..',
  ],
  up: [
    ...HELMET_UP, '.kmhhhhmhhmhhhmnk.', '.kmhhmhhhhhhmhmnk.', NAPE_UP[0], NAPE_UP[1], '.oknmmmhmmhmmmnko.',
    '..knnmmkhhkmmnnk..', '...kknnkhmknnkk...', '.....kkkhmkkk.....', '.......khmk.......', '.......kmmk.......',
    '........kk........',
  ],
};

// Olvido Arrieta (78, fascinación): pelo cano con raya al medio recogido en un moño bajo atravesado por
// un lápiz, gafas redondas y sonrisa curiosa. (Se dibuja con headLift 1, como el anciano.)
export const OLVIDO = {
  down: [
    '..................', '..................', '......kkkkkk......', '....kkHHHhhhkk....',
    '...kHHhhhhhhhhk...', '..kHhhhhmmhhhhmk..', '.kHhhhhmhhmhhhhmk.', '.khhhhmhhhhmhhmmk.',
    '.khhhmhhhhhhmhmmk.', '.kmhhSSSSSSSShmnk.', '.kmhSSSSSSSSSSmnk.', 'osnmSSSSSSSSSSmnso',
    'osnmSrrSSSSrrSmnso', '.okmggggSSggggmko.', '..krgweggggewgrk..', '..krggggSSggggrk..',
    '...krsssoosssrk...', '.....kkrrrrkk.....',
  ],
  left: [
    '..................', '..................', '.......kkkkk......', '.....kkHHHhhkk....',
    '....kHHhhhhhhhk...', '...kHhhhhhhhhhhk..', '..kHhhhhhhhhhhhmk.', '..khhhhhhhhhhhhmk.',
    '.kSSShhhhhhhhhmmk.', '.kSSSShhhhhhhmmnk.', '.kSSSSmhhhhhmmnnkk', 'kSSSSSSmhhhmmnnkUk',
    '.kgggsmhmoohmnkhhk', 'kSglegsmsromnkhmhk', 'kSgggsssmoommkkhk.', '.kssssssrmnnk.kk..',
    '..krssssrnkk......', '...kkrrrkk........',
  ],
  up: [
    '..................', '..................', '......kkkkkk......', '....kkHHHhhhkk....',
    '...kHHhhhhhhhhk...', '..kHhhhhhhhhhhmk..', '.kHhhhhhmhhhhhhmk.', '.khhhhhmhhmhhhhmk.',
    '.khhhhmhhhhmhhmmk.', '.kmhhmhhhhhhmhmnk.', '.kmhhhmkkkkmhhmnk.', 'osnmhhkHhhhkhmmnso',
    'osnmmkhhUUhmkmmnso', '.oknmkhmhhmmknnko.', '..knnmkmmmmknnnk..', '...kknnkkkknnkk...',
    '.....kkrrrrkk.....', '.......kkkk.......',
  ],
};

// ─────────────────────────── Oficios ───────────────────────────

// Molinero (Anselmo, 70): boina, pelo y cejas blancas, bigote poblado. (headLift 1.)
export const MOLINERO = {
  down: [
    '..................', '..................', '.....kkkkkkkk.....', '...kkUUUUUUuukk...',
    '..kUUUUUUUUuuuuk..', '.kUUUUUUUUuuuuuuk.', '.kvvvvvvvvvvvvvvk.', '..kkVVVVVVVVVVkk..',
    '.khhkkkkkkkkkkhhk.', '.khhSSSSSSSSSShhk.', '.kmhSSSSSSSSSShmk.', 'osnhSSSSSSSSSShnso',
    'osnmSSSSSSSSSSmnso', '.okmHHHSSSSHHHmko.', EYES_DOWN[0], EYES_DOWN[1],
    '...krHHHhhHHHrk...', '.....kkrrrrkk.....',
  ],
  left: [
    '..................', '..................', '......kkkkkkk.....', '....kkUUUUUuukk...',
    '...kUUUUUUuuuuuk..', '..kUUUUUUuuuuuuuk.', '..kvvvvvvvvvvvvvk.', 'kkkVVVkkkkkkkkkk..',
    'kVVVkkShhhhhhhmk..', '.kkSSSShhhhhhmmk..', '.kSSSSmhhhhhmmnk..', 'kSSSSSmhhhhmmnk...',
    '.kSHHsmhmoohmnk...', 'kSSewsssmsromnk...', 'kSsessssmoommk....', 'kHHHssssrmnnk.....',
    '.kHHksssrnkk......', '..kk.kkkkk........',
  ],
  up: [
    '..................', '..................', '.....kkkkkkkk.....', '...kkUUUUUUuukk...',
    '..kUUUUUUUUuuuuk..', '.kUUUUUUUUuuuuuuk.', '.kvvvvvvvvvvvvvvk.', '.kkkkkkkkkkkkkkkk.',
    '.khhhhhhhhhhhhhhk.', '.kmhhhhhhhhhhhhmk.', '.kmhhhhhhhhhhhmnk.', ...NAPE_UP,
  ],
};

// Buzo (Fausto y los buzos de Caleta Sonda): pelo corto mojado y gafas de buceo subidas a la frente.
export const BUZO = {
  down: [
    '..................', '..................', '......kkkkkk......', '....kkHHhHhhkk....',
    '...kHhhHhhhHhhk...', '..kHhhhhhhhhhhmk..', '.kvkkkkkkkkkkkkvk.', '.kvUllllUUllllUvk.',
    '.kvUiiilUUiiilUvk.', '.khkkkkkkkkkkkkhk.', '.kmhSSSSSSSSSShmk.', 'osnmSSSSSSSSSSmnso',
    'osnmSSSSSSSSSSmnso', '.okmSkkSSSSkkSmko.', ...EYES_DOWN, ...JAW_DOWN,
  ],
  left: [
    '..................', '..................', '.......kkkkk......', '.....kkHHhHhkk....',
    '....kHhhHhhhhhk...', '...kHhhhhhhhhhhk..', '..kkkkkkkhhhhhmk..', '.kllllUvhhhhhhmk..',
    '.kiiilUvhhhhhmmk..', '.kkkkkkvhhhhmmnk..', '.kSSSSmhhhhhmmnk..', 'kSSSSSmhhhhmmnk...',
    '.kSkksmhmoohmnk...', ...FACE_LEFT,
  ],
  up: [
    '..................', '..................', '......kkkkkk......', '....kkHHhHhhkk....',
    '...kHhhHhhhHhhk...', '..kHhhhhhhhhhhmk..', '.kvhhhhhhhhhhhmvk.', '.kvvvvvvvvvvvvvvk.',
    '.kmhhhhmhhmhhhmnk.', '.kmhhmhhhhhhmhmnk.', '.kmhhhmhhmhhhmmnk.', ...NAPE_UP,
  ],
};

// Enfermera de los Centros Pokémon: cofia blanca con banda rosa y moño bajo castaño.
export const ENFERMERA = {
  down: [
    '..................', '......kkkkkk......', '.....kUUUUuuk.....', '....kUUvvvvuuk....',
    '....kkkkkkkkkk....', '...kHHhhhhhhhhk...', '..kHhhhhhhhhhhmk..', '.kHhhhhmhhhhhhhmk.',
    '.khhhhmhhhhhhhmmk.', '.khhhmhhhhhmhhmmk.', '.kmhmmSSSSSSmmmnk.', 'osnmSSSSSSSSSSmnso',
    'osnmSSSSSSSSSSmnso', '.okmSSSSSSSSSSmko.', ...EYES_DOWN, '...krsssrrsssrk...', JAW_DOWN[1],
  ],
  left: [
    '..................', '.......kkkkkk.....', '......kUUUUuuk....', '.....kUUvvvvuuk...',
    '.....kkkkkkkkkk...', '....kHHhhhhhhhk...', '...kHhhhhhhhhhhk..', '..kHhhhhhhhhhhhmk.',
    '.khhhhhhhhhhhhmmkk', '.kmhhhhhhhhhhmmkhk', '.kSmhhhhhhhhmmnkhk', 'kSSSmmhhmhhhmmnkkk',
    '.kSSSsmhmoohmnk...', ...FACE_LEFT,
  ],
  up: [
    '..................', '......kkkkkk......', '.....kUUUUuuk.....', '....kUUUUUuuuk....',
    '....kkkkkkkkkk....', '...kHHhhhhhhhhk...', '..kHhhhhhhhhhhmk..', '.kHhhhhhmhhhhhhmk.',
    '.khhhhhmhhmhhhhmk.', '.khhhhmkkkkmhhmmk.', '.kmhhmkHhhhkmhmnk.', 'osnmhmkhhhmkhmmnso',
    'osnmmhkhmmmkhmmnso', '.oknmmmkkkkmmmnko.', ...NAPE_UP.slice(3),
  ],
};

// Dependiente de tienda: peinado corto con raya (misma forma que el profesor, otra paleta).
export const DEPENDIENTE = PROFESOR;

// Archivista: pelo corto con flequillo (forma del vecino) y gafas redondas sin tinte.
export const ARCHIVISTA = withGlasses(VECINO, { tint: false });
