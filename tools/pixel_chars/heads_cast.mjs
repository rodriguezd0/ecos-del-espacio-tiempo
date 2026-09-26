// Cabezas del elenco secundario (rejilla local de 18 px, filas y=0..17). Mismos símbolos que
// palettes.mjs (k contorno · H/h/m/n pelo · S/s/r/o piel · e/w ojos); la gorra del policía usa U/u (copa), v (banda), V (visera), G (placa).
// Todas PROVISIONALES (D30); ver docs/arte.md.

// Filas de cara frontal compartidas (ojos 2×2 con brillo exterior, mentón redondeado).
const FACE_DOWN = [
  '..krswesSSsewsrk..', // 14
  '..krssesSSsessrk..', // 15
  '...krssssssssrk...', // 16
  '.....kkrrrrkk.....', // 17
];

// Filas bajas de perfil compartidas (ojo, oreja, mandíbula).
const FACE_LEFT = [
  'kSSewsssmsromnk...', // 13
  'kSsessssmoommk....', // 14
  '.kssssssrmnnk.....', // 15
  '..krssssrnkk......', // 16
  '...kkrrrkk........', // 17
];

// Nuca compartida (vista de espaldas).
const NAPE_UP = [
  '.oknmmhmmhmmhmnko.', // 13
  '..knmmnmmmnmmnnk..', // 14
  '...knnknnnnknnk...', // 15
  '....kk.krrk.kk....', // 16
  '.......kkkk.......', // 17
];

// Gael (rival): rubio con puntas hacia arriba, frente despejada (antecedente del autor §13.3).
export const GAEL = {
  down: [
    '..................', // 0
    '.....kk...kk......', // 1
    '....kHk..kHk..kk..', // 2
    '...kHhk.kHhhkkHk..', // 3
    '...kHhhkHhhhhHhk..', // 4
    '..kHhhhhhhhhhhhmk.', // 5
    '.kHhhhhhhhhhhhhmk.', // 6
    '.khhhhhhhhhhhhmmk.', // 7
    '.khhhmhhhhmhhhmmk.', // 8
    '.kmhmhhhhmhhhmmnk.', // 9
    '.kmhhmhhhhhhmhmnk.', // 10
    'osnmmkSmhhmSkmnnso', // 11
    'osnmkSSSsmSSSkmnso', // 12
    '.oknmrSSSSSSsrmko.', // 13
    ...FACE_DOWN,
  ],
  left: [
    '..................', // 0
    '.........kk...kk..', // 1
    '.......kkHk..kHk..', // 2
    '.....kkHhhkkkHhk..', // 3
    '....kHHhhhhhHhhhk.', // 4
    '...kHhhhhhhhhhhhhk', // 5
    '..kHhhhhhhhhhhhhmk', // 6
    '.kHhhhhhhhhhhhhmmk', // 7
    '.khhhhmhhhhhmhhmnk', // 8
    '.kmhhmhhhhhmhhhmnk', // 9
    '.kkmmhhhhhmhhhmmnk', // 10
    'kSSkmmhhmhhhmhmnnk', // 11
    '.kSSSsmhmoohhmnnk.', // 12
    'kSSewsssmsromnnk..', // 13
    'kSsessssmoommnk...', // 14
    '.kssssssrmnnk.....', // 15
    '..krssssrnkk......', // 16
    '...kkrrrkk........', // 17
  ],
  up: null, // se completa abajo (mismas puntas que de frente + nuca)
};
GAEL.up = [
  ...GAEL.down.slice(0, 9),
  '.kmhhmhhhhmhhhmmk.', // 9
  '.kmhmhhhmhhhmhmnk.', // 10
  'osnmhmhhhmhmhhmnso', // 11
  'osnmmhmhhmhhmhmnso', // 12
  ...NAPE_UP,
];

// Profesor (D03 abierto): investigador adulto neutro, pelo castaño oscuro corto con raya.
export const PROFESOR = {
  down: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkHHHhhhkk....', // 3
    '...kHHhhhhhhhhk...', // 4
    '..kHhhhhhhhhhhmk..', // 5
    '..khhhhhhhhhhhmk..', // 6
    '.khHhhhhhhhhhmmmk.', // 7
    '.khhhhhhhhhhhhmmk.', // 8
    '.kmhhhhhhhmmhhmnk.', // 9
    '.kmhhhhhmmSSmmmnk.', // 10
    'osnmhhmmSSSSsmnnso', // 11
    'osnmmSSSSSSSSrnnso', // 12
    '.okmSSSSSSSSssmko.', // 13
    ...FACE_DOWN,
  ],
  left: [
    '..................', // 0
    '..................', // 1
    '.......kkkkk......', // 2
    '.....kkHHHhhkk....', // 3
    '....kHHhhhhhhhk...', // 4
    '...kHhhhhhhhhhhk..', // 5
    '..kHhhhhhhhhhhhmk.', // 6
    '..khhhhhhhhhhhhmk.', // 7
    '.khhhhhhhhhhhhmmk.', // 8
    '.kmhhhhhhhhhhmmnk.', // 9
    '.kSmhhhhhhhhmmnnk.', // 10
    'kSSSmmhhmhhhmmnk..', // 11
    '.kSSSsmhmoohmnk...', // 12
    ...FACE_LEFT,
  ],
  up: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkHHHhhhkk....', // 3
    '...kHHhhhhhhhhk...', // 4
    '..kHhhhhhhhhhhmk..', // 5
    '..khhhhhhhhhhhmk..', // 6
    '.khHhhhhhhhhhmmmk.', // 7
    '.khhhhhhhhhhhhmmk.', // 8
    '.kmhhhhhhhhhhhmnk.', // 9
    '.kmhhmhhhhhhmhmnk.', // 10
    'osnmhhmhhhhmhhmnso', // 11
    'osnmmhhmhhmhhmmnso', // 12
    '.oknmmmhmmhmmmnko.', // 13
    '..knnmmmmmmmmnnk..', // 14
    '...kknnnnnnnnkk...', // 15
    '.....kkrrrrkk.....', // 16
    '.......kkkk.......', // 17
  ],
};

// Policía del acceso restringido (genérico, §13.8): gorra de plato con placa dorada.
export const POLICIA = {
  down: [
    '..................', // 0
    '..................', // 1
    '.....kkkkkkkk.....', // 2
    '...kkUUUUUUuukk...', // 3
    '..kUUUUUGGUUuuuk..', // 4
    '.kUUUUUUGGUuuuuuk.', // 5
    '.kUUUUUUUUuuuuuuk.', // 6
    '.kvvvvvvvvvvvvvvk.', // 7
    '.kvvvvvvvvvvvvvvk.', // 8
    '..kkVVVVVVVVVVkk..', // 9
    '..kmkVVVVVVVVkmk..', // 10
    'osnmrkkkkkkkkrmnso', // 11
    'osnmrrsssssssrmnso', // 12
    '.okmsSSSSSSSSsmko.', // 13
    ...FACE_DOWN,
  ],
  left: [
    '..................', // 0
    '..................', // 1
    '......kkkkkkk.....', // 2
    '....kkUUUUUuukk...', // 3
    '...kUUUUUUuuuuuk..', // 4
    '..kUGGUUUUuuuuuuk.', // 5
    '..kUGGUUUUuuuuuuk.', // 6
    '..kvvvvvvvvvvvvvk.', // 7
    'kkkvvvvvvvvvvvvvk.', // 8
    'kVVVkkkkkkkkkkkk..', // 9
    '.kkkmmhhhhhhmmnk..', // 10
    '.kSSmmhhmhhhmnnk..', // 11
    '.kSSSsmhmoohmnk...', // 12
    ...FACE_LEFT,
  ],
  up: [
    '..................', // 0
    '..................', // 1
    '.....kkkkkkkk.....', // 2
    '...kkUUUUUUuukk...', // 3
    '..kUUUUUUUUUuuuk..', // 4
    '.kUUUUUUUUUuuuuuk.', // 5
    '.kUUUUUUUUuuuuuuk.', // 6
    '.kvvvvvvvvvvvvvvk.', // 7
    '.kvvvvvvvvvvvvvvk.', // 8
    '..kkkkkkkkkkkkkk..', // 9
    '..knmhhhhhhhhmnk..', // 10
    'osnmmhhmhhmhhmmnso', // 11
    'osnmmhmhhmhhmhmnso', // 12
    '.oknmmhmmhmmhmnko.', // 13
    '..knnmmmmmmmmnnk..', // 14
    '...kknnnnnnnnkk...', // 15
    '.....kkrrrrkk.....', // 16
    '.......kkkk.......', // 17
  ],
};

// Vecino genérico: adulto, pelo corto oscuro con flequillo corto.
export const VECINO = {
  down: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkHHhhhhkk....', // 3
    '...kHHhhhhhhhhk...', // 4
    '..kHhhhhhhhhhhmk..', // 5
    '..khhhhhhhhhhhmk..', // 6
    '.khHhhhhhhhhhmmmk.', // 7
    '.khhhmhhhmhhhmmmk.', // 8
    '.kmhmhhhmhhhmhmnk.', // 9
    '.kmmhhmhhhmhhmmnk.', // 10
    'osnmmSmhmSmhmSmnso', // 11
    'osnmSSSsSSSsSSrnso', // 12
    '.okmSSSSSSSSssmko.', // 13
    ...FACE_DOWN,
  ],
  left: [
    '..................', // 0
    '..................', // 1
    '.......kkkkk......', // 2
    '.....kkHHhhhkk....', // 3
    '....kHHhhhhhhhk...', // 4
    '...kHhhhhhhhhhhk..', // 5
    '..kHhhhhhhhhhhhmk.', // 6
    '..khhhmhhhhhhhhmk.', // 7
    '.khhhmhhhhmhhhmmk.', // 8
    '.kmhmhhhhmhhhmmnk.', // 9
    'kmmSmhhhmhhhmmnnk.', // 10
    'kSSSSmhhmhhhmmnk..', // 11
    '.kSSSsmhmoohmnk...', // 12
    ...FACE_LEFT,
  ],
  up: PROFESOR.up,
};

// Vecina genérica: adulta, pelo recogido en moño.
export const VECINA = {
  down: [
    '..................', // 0
    '.......kkkk.......', // 1
    '......kHHhhk......', // 2
    '......khhhmk......', // 3
    '....kkkmmmmkkk....', // 4
    '...kHHhhhhhhhmk...', // 5
    '..kHhhhhhhhhhhmk..', // 6
    '.kHhhhhhmmhhhhhmk.', // 7
    '.khhhhhmhhmhhhhmk.', // 8
    '.khhhhmhhhhmhhmmk.', // 9
    '.kmhhmkSSSSkmhmnk.', // 10
    'osnmmkSSSSSSkmnnso', // 11
    'osnmkSSSSSSSSkmnso', // 12
    '.okmsSSSSSSSSsmko.', // 13
    ...FACE_DOWN,
  ],
  left: [
    '..................', // 0
    '..........kkkk....', // 1
    '.........kHHhhk...', // 2
    '.........kHhhmk...', // 3
    '.....kkkkkhmmkk...', // 4
    '....kHHhhhhhhhk...', // 5
    '...kHhhhhhhhhhmk..', // 6
    '..kHhhhhhhhhhhmk..', // 7
    '.kHhhhhhhhhhhhmmk.', // 8
    '.khhhhhhhhhhhmmnk.', // 9
    '.kkhhhhhhhhhmmnnk.', // 10
    'kSSkmhhhhhhmmnnk..', // 11
    '.kSSSsmhmoohmnk...', // 12
    ...FACE_LEFT,
  ],
  up: [
    '..................', // 0
    '.......kkkk.......', // 1
    '......kHHhhk......', // 2
    '......kHhhmk......', // 3
    '....kkkhmmmkkk....', // 4
    '...kHHhhhhhhhmk...', // 5
    '..kHhhhhhhhhhhmk..', // 6
    '.kHhhhhhhhhhhhhmk.', // 7
    '.khhhhhhhhhhhhhmk.', // 8
    '.khhhhmhhhhmhhmmk.', // 9
    '.kmhhhhmhhmhhhmnk.', // 10
    'osnmhhhmhhmhhmmnso', // 11
    'osnmmhhhmmhhhmmnso', // 12
    '.oknmmmhmmhmmmnko.', // 13
    '..knnmmmmmmmmnnk..', // 14
    '...kknnnnnnnnkk...', // 15
    '.....kkrrrrkk.....', // 16
    '.......kkkk.......', // 17
  ],
};

// Anciano genérico: coronilla calva, pelo lateral gris, cejas y bigote grises.
export const ANCIANO = {
  down: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkSSSSsskk....', // 3
    '...kSSSSSSsssrk...', // 4
    '..kSSSSSSssssrrk..', // 5
    '..kSSSSsssssssrk..', // 6
    '.kSSsssssssssrrrk.', // 7
    '.khHssssssssssrhk.', // 8
    '.khhHssssssssrhhk.', // 9
    '.kmhhrssssssrrhmk.', // 10
    'osmhhrssssssrhhmso', // 11
    'osnmhrsssssssrmnso', // 12
    '.okmrhhSSSShhrmko.', // 13
    '..krswesSSsewsrk..', // 14
    '..krssesSSsessrk..', // 15
    '...krsHhhhhhsrk...', // 16
    '.....kkrrrrkk.....', // 17
  ],
  left: [
    '..................', // 0
    '..................', // 1
    '.......kkkkk......', // 2
    '.....kkSSSsskk....', // 3
    '....kSSSSsssssk...', // 4
    '...kSSSSssssssrk..', // 5
    '..kSSSssssssssrk..', // 6
    '..kSsssssssssrrk..', // 7
    '.kSssssssssrrhhmk.', // 8
    '.kssssssssrhhhhmk.', // 9
    '.khsssssssrhhhmmk.', // 10
    'khhSssssssrhhmmnk.', // 11
    '.kSSSssshmoohmnk..', // 12
    'kSSewsssmsromnk...', // 13
    'kSsessssmoommk....', // 14
    '.kssHhhsrmnnk.....', // 15
    '..krssssrnkk......', // 16
    '...kkrrrkk........', // 17
  ],
  up: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkSSSSsskk....', // 3
    '...kSSSSSSsssrk...', // 4
    '..kSSSSSsssssrrk..', // 5
    '..kSSSsssssssssk..', // 6
    '.kSSssssssssssrrk.', // 7
    '.khHssssssssssrhk.', // 8
    '.khhHsssssssssrhk.', // 9
    '.kmhhhhrrrrhhhhmk.', // 10
    'osnmhhhhhhhhhhmnso', // 11
    'osnmmhhhhhhhhmmnso', // 12
    '.oknmmhmmhmmhmnko.', // 13
    '..knnmmmmmmmmnnk..', // 14
    '...kknnnnnnnnkk...', // 15
    '.....kkrrrrkk.....', // 16
    '.......kkkk.......', // 17
  ],
};
