// Cabezas de Genesis (CAMPANA §5, D13–D15; biblia §13.5–13.6). Rejilla local de 18 px. Científicos
// serios y ordenados, nada militar ni bufonesco. Todas PROVISIONALES (D30); ver docs/arte.md §7.
import { PROFESOR } from './heads_cast.mjs';
import { MADRE } from './heads_b01.mjs';
import { withGlasses } from './heads_campaign.mjs';

const EYES_DOWN = ['..krswesSSsewsrk..', '..krssesSSsessrk..'];
const JAW_DOWN = ['...krssssssssrk...', '.....kkrrrrkk.....'];
const FACE_LEFT = [
  'kSSewsssmsromnk...', 'kSsessssmoommk....', '.kssssssrmnnk.....', '..krssssrnkk......', '...kkrrrkk........',
];
const NAPE_UP = [
  '.oknmmmhmmhmmmnko.', '..knnmmmmmmmmnnk..', '...kknnnnnnnnkk...', '.....kkrrrrkk.....', '.......kkkk.......',
];

// Dr. Aurelio Vértice (63, D14): pelo plateado peinado hacia atrás, gafas redondas con tinte violeta
// y barba blanca corta.
export const VERTICE = {
  down: [
    '..................', '..................', '......kkkkkk......', '....kkHHHHHhkk....',
    '...kHHhHhHhhhhk...', '..kHhHhHhhhhhhmk..', '.kHhhhhhhhhhhhmmk.', '.khhhhhhhhhhhhmmk.',
    '.kmhhhhhhhhhhhmnk.', '.kmhSSSSSSSSSShnk.', '.kmSSSSSSSSSSSSnk.', 'osnSSSSSSSSSSSSnso',
    'osnSSSSSSSSSSSSnso', '.okmggggSSggggmko.', '..krgleggggelgrk..', '..krggggSSggggrk..',
    '...kFfssFFssfFk...', '.....kFFFFFFk.....',
  ],
  left: [
    '..................', '..................', '.......kkkkk......', '.....kkHHHHhkk....',
    '....kHHhhHhhhhk...', '...kHhhhhhHhhhhk..', '..kSHhhhhhhhhhmk..', '..kSShhhhhhhhhhmk.',
    '.kSSSShhhhhhhhmmk.', '.kSSSSSmhhhhhmmnk.', 'kSSSSSSSmhhhmmnk..', 'kSSSSSSSmhhhmnnk..',
    '.kggggsmhmoohmnk..', 'kSgelgssmsromnk...', 'kSggggssmoommk....', '.kFsssFFrmnnk.....',
    '..kFFFFFnkk.......', '...kkkkkk.........',
  ],
  up: [
    '..................', '..................', '......kkkkkk......', '....kkHHHHHhkk....',
    '...kHHhHhHhhhhk...', '..kHhHhHhHhhhhmk..', '.kHhHhHhHhhhhhmmk.', '.khHhHhHhhhhhhmmk.',
    '.kmhhhhhhhhhhhmnk.', '.kmhHhHhHhhhhmmnk.', '.kmhhhhhhhhhhmmnk.', 'osnmhHhHhHhhhmmnso',
    'osnmmhhhhhhhhmmnso', '.oknmmmmmmmmmmnko.', ...NAPE_UP.slice(1),
  ],
};

// Dra. Casia Varela (41): melena lisa a la altura de la mandíbula con raya a un lado y la frente
// despejada; mirada precisa.
export const CASIA = {
  down: [
    '..................', '..................', '......kkkkkk......', '....kkHHHHhhkk....',
    '...kHHhhhhhhhhk...', '..kHhhhhhhhhhhhk..', '.kHhhhhhhhhhhhhmk.', '.khhhhhhhhhhhhmmk.',
    '.khhhhhhhmSShhmmk.', 'kmhhhhhhmSSSSmhmnk', 'kmhhhhhmSSSSSSmmnk', 'kmhhhmSSSSSSSSSmnk',
    'kmhhmSSSSSSSSSSmnk', 'kmhmSnnSSSSnnSSmnk', 'kmhmswesSSsewsmmnk', 'kmmnssesSSsessnmnk',
    'knmnkrssssssrknmnk', '.kkkkkkrrrrkkkkkk.',
  ],
  left: [
    '..................', '..................', '.......kkkkk......', '.....kkHHHhhkk....',
    '....kHHhhhhhhhk...', '...kHhhhhhhhhhhk..', '..kHhhhhhhhhhhhhk.', '.kHhhhhhhhhhhhhmk.',
    '.kSShhhhhhhhhhmmk.', 'kSSSShhhhhhhhmmnk.', 'kSSSSShhhhhhmmmnk.', 'kSSSSSmhhhhmmmnnk.',
    '.kSnnsmhhhhmmnnnk.', 'kSSewsmhhhmmmnnk..', 'kSsessmhhmmmnnk...', '.ksssrmmmmmnnk....',
    '..krsssrkkkkk.....', '...kkrrrkk........',
  ],
  up: [
    '..................', '..................', '......kkkkkk......', '....kkHHHHhhkk....',
    '...kHHhhhhhhhhk...', '..kHhhhhhhhhhhhk..', '.kHhhhhhhhhhhhhmk.', '.khhhhhhhhhhhhmmk.',
    '.khhhhhmhhhhhhhmk.', 'kmhhhhhmhhhhhhhmnk', 'kmhhhhhmhhhhhhmmnk', 'kmmhhhmhhhhmhhmmnk',
    'kmmhhmhhhhhhmhmnnk', 'kmmmhmhhhmhhmmmnnk', 'knmmmmmhmmmmmmnnnk', 'knnmmmnmmmnmmmnnnk',
    '.knnnnkkrrkknnnnk.', '..kkkk..kk..kkkk..',
  ],
};

// Ulises Garrido (47): excapataz; pelo gris al rape, frente ancha, cejas gruesas y barba de días.
export const GARRIDO = {
  down: [
    '..................', '..................', '......kkkkkk......', '....kkhhhhhhkk....',
    '...khHhHhHhhhhk...', '..khHhHhHhhhhhmk..', '..khhhhhhhhhhhmk..', '.kmhhhhhhhhhhhmmk.',
    '.kmhSSSSSSSSSShmk.', '.kmSSSSSSSSSSSSmk.', '.kSSSSSSSSSSSSSSk.', 'osSSSSSSSSSSSSSSso',
    'osSSSSSSSSSSSSSsso', '.okSnnnSSSSnnnSko.', EYES_DOWN[0], '..kFssesSSsessFk..',
    '..kFFsssrrsssFFk..', '...kkFFFFFFFFkk...',
  ],
  left: [
    '..................', '..................', '.......kkkkk......', '.....kkhhhhhkk....',
    '....khHhHhHhhhk...', '...khHhHhhhhhhhk..', '..khhhhhhhhhhhhmk.', '.kShhhhhhhhhhhmmk.',
    '.kSSShhhhhhhhmmnk.', 'kSSSSSShhhhhhmmnk.', 'kSSSSSSShhhhmmnk..', 'kSSSSSSSmhhmmnk...',
    '.kSnnnsmmoohmnk...', 'kSSewsssmsromnk...', 'kSsessssmoommk....', '.kFssssFrmnnk.....',
    '..kFFFFFrnkk......', '...kkkkkkk........',
  ],
  up: [
    '..................', '..................', '......kkkkkk......', '....kkhhhhhhkk....',
    '...khHhHhHhhhhk...', '..khHhHhHhhhhhmk..', '..khhhhhhhhhhhmk..', '.kmhhhhhhhhhhhmmk.',
    '.kmhhhhhhhhhhhmmk.', '.kmhhhhhhhhhhhmmk.', '.kmmhhhhhhhhhmmmk.', 'osnmmhhhhhhhhmmnso',
    'osnmmmhhhhhhmmmnso', '.oknmmmmmmmmmmnko.', '..kSnnmmmmmmnnSk..', '...kSSSSSSSSSSk...',
    '.....kkrrrrkk.....', '.......kkkk.......',
  ],
};

// Técnico de campo: gorra petróleo con el emblema y visor magenta sobre la frente (no tapa los ojos).
const CAP_DOWN = [
  '..................', '..................', '.....kkkkkkkk.....', '...kkUUUUUUuukk...',
  '..kUUUUUGGUuuuuk..', '.kUUUUUUUUuuuuuuk.', '.kUUUUUUUUuuuuuuk.', '.kvvvvvvvvvvvvvvk.',
  '.kXXXXXXXXXXXXXXk.', '..kkkkkkkkkkkkkk..',
];
const CAP_LEFT = [
  '..................', '..................', '......kkkkkkk.....', '....kkUUUUUuukk...',
  '...kGGUUUUuuuuuk..', '..kUUUUUUuuuuuuuk.', '..kUUUUUUuuuuuuuk.', 'kkkvvvvvvvvvvvvvk.',
];
const CAP_UP = [
  '..................', '..................', '.....kkkkkkkk.....', '...kkUUUUUUuukk...',
  '..kUUUUUUUUuuuuk..', '.kUUUUUUUUuuuuuuk.', '.kUUUUUUUuuuuuuuk.', '.kvvvvvvvvvvvvvvk.',
  '.kkkkkkkkkkkkkkkk.',
];

export const TECNICO = {
  down: [
    ...CAP_DOWN, '..kmhSSSSSSSShmk..', 'osnmSSSSSSSSSSmnso', 'osnmSSSSSSSSSSmnso', '.okmSSSSSSSSSSmko.',
    ...EYES_DOWN, ...JAW_DOWN,
  ],
  left: [
    ...CAP_LEFT, 'kVVXXXXXXvvvvvvk..', '.kkkkkkkkhhhhmmk..', '.kSSSSmhhhhhmmnk..', 'kSSSSSmhhhhmmnk...',
    '.kSSSsmhmoohmnk...', ...FACE_LEFT,
  ],
  up: [
    ...CAP_UP, '.kmhhhhmhhmhhhmnk.', '.kmhhmhhhhhhmhmnk.', 'osnmhhmhhmhhhmmnso', 'osnmmhhmhhmhhmmnso',
    ...NAPE_UP,
  ],
};

// Técnica de campo: la misma gorra con coleta que sale por detrás.
export const TECNICA = {
  down: TECNICO.down,
  left: [
    ...CAP_LEFT, 'kVVXXXXXXvvvvvvkk.', '.kkkkkkkkhhhhmmkhk', '.kSSSSmhhhhhmmnkhk', 'kSSSSSmhhhhmmnkkmk',
    '.kSSSsmhmoohmnk.kk', ...FACE_LEFT,
  ],
  up: [
    ...CAP_UP, '.kmhhhhmhhmhhhmnk.', '.kmhhmhhhhhhmhmnk.', 'osnmhhmhhmhhhmmnso', 'osnmmhhmhhmhhmmnso',
    '.oknmmmkhhkmmmnko.', '..knnmmkhmkmmnnk..', '...kknnkhmknnkk...', '.....kkkhmkkk.....', '.......khmk.......',
    '.......kmmk.......', '........kk........',
  ],
};

// Investigadores: gafas-visor con cristal magenta (el investigador con el corte del profesor; la
// investigadora con raya y coleta baja).
export const INVESTIGADOR = withGlasses(PROFESOR);
export const INVESTIGADORA = withGlasses(MADRE);
