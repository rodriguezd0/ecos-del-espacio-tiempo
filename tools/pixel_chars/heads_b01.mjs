// Cabezas del elenco nuevo de los bloques 1–2 (rejilla local de 18 px; pueden medir más de 18 filas
// cuando el pelo cae sobre la espalda). Mismos símbolos que heads_cast.mjs; U = detalle del pelo
// (horquilla, goma). Todas PROVISIONALES (D30); ver docs/arte.md.

// Madre del protagonista (D01): adulta cálida; castaño medio con raya a un lado, flequillo
// barrido y coleta baja; ojos suaves y sonrisa pequeña.
export const MADRE = {
  down: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkHHHhhhkk....', // 3
    '...kHHhhhhhhhhk...', // 4
    '..kHhhhhhhhhhhmk..', // 5
    '.kHhhhhhhhhhhhmmk.', // 6
    '.khhhhhhhhhhmhhmk.', // 7
    '.khhhhhhhhhmSmhmk.', // 8
    '.kmhhhhhhhmSSmhmk.', // 9
    '.kmhhhhhhmSSSSmnk.', // 10
    'osmhhhhmmSSSSSmnso', // 11
    'osnmhmmSSSSSSSmnso', // 12
    '.okmmSSSSSSSSsmko.', // 13
    '..krseesSSseesrk..', // 14
    '..krswesSSsewsrk..', // 15
    '...krsssrrsssrk...', // 16
    '.....kkrrrrkk.....', // 17
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
    '.kSSSsmhmoohmnkkk.', // 12
    'kSSeesssmsromnkhk.', // 13
    'kSsewsssmoommkhk..', // 14
    '.kssssssrmnnkhmk..', // 15
    '..krsrrsrnkkhmk...', // 16
    '...kkrrrkk.khmk...', // 17
    '...........khmk...', // 18
    '............kk....', // 19
  ],
  up: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkHHHhhhkk....', // 3
    '...kHHhhhhhhhhk...', // 4
    '..kHhhhhhhhhhhmk..', // 5
    '.kHhhhhhhhhhhhmmk.', // 6
    '.khhhhhhhhhhhhhmk.', // 7
    '.khhhhmhhhhmhhhmk.', // 8
    '.kmhhhhmhhmhhhmnk.', // 9
    '.kmhhhhhmmhhhhmnk.', // 10
    'osnmhhhhmmhhhmmnso', // 11
    'osnmmhhhmmhhmmmnso', // 12
    '.oknmmmmkkmmmmnko.', // 13
    '..knnmmkHhkmmnnk..', // 14
    '...kknkhhmkknkk...', // 15
    '.....krkhmkrk.....', // 16
    '.......khmk.......', // 17
    '.......kmmk.......', // 18
    '........kk........', // 19
  ],
};

// Ayudante del laboratorio (NPC genérico, PROPUESTA): joven, melena corta negra azulada a la altura
// de la mandíbula, flequillo recto con brillo en banda y horquilla amarilla. Bata clara en el cuerpo.
export const AYUDANTE = {
  down: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkhhhhhhkk....', // 3
    '...khhhhhhhhhhk...', // 4
    '..khHHHhhHHHhhmk..', // 5
    '.khHhhHHHhhHUUmmk.', // 6
    '.khhhhhhhhhhhhmmk.', // 7
    '.khhhhhhhhhhhhmmk.', // 8
    'kmhhhhhhhhhhhhhmnk', // 9
    'kmhhmmhmmhmmhmmmnk', // 10
    'kmhmSSSSSSSSSSmmnk', // 11
    'kmhmSSSSSSSSSSmmnk', // 12
    'kmhmsSSSSSSSSsmmnk', // 13
    'kmhmswesSSsewsmmnk', // 14
    'kmmnssesSSsessnmnk', // 15
    'knmnkrssssssrknmnk', // 16
    '.kkkkkkrrrrkkkkkk.', // 17
  ],
  left: [
    '..................', // 0
    '..................', // 1
    '.......kkkkk......', // 2
    '.....kkhhhhhkk....', // 3
    '....khhhhhhhhhk...', // 4
    '...khHHHhhHHHhhk..', // 5
    '..khHhhHHHhhHUUk..', // 6
    '.khhhhhhhhhhhhhmk.', // 7
    '.khhhhhhhhhhhhhmk.', // 8
    'khhhhhhhhhhhhhmmk.', // 9
    'khhmhmhhhhhhhmmnk.', // 10
    'kmSSSSmhhhhhhmmnk.', // 11
    '.kSSSSmhhhhhmmnnk.', // 12
    'kSSewSmhhhhmmnnk..', // 13
    'kSsessmhhhmmnnk...', // 14
    '.ksssrmmmmmnnk....', // 15
    '..krsssrkkkkk.....', // 16
    '...kkrrrkk........', // 17
  ],
  up: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkhhhhhhkk....', // 3
    '...khhhhhhhhhhk...', // 4
    '..khHHHhhHHHhhmk..', // 5
    '.khUUHHHhhHHHhhmk.', // 6
    '.khhhhhhhhhhhhmmk.', // 7
    '.khhhhhhhhhhhhhmk.', // 8
    'kmhhhhhhhhhhhhhmnk', // 9
    'kmhhhhhhhhhhhhmmnk', // 10
    'kmmhhhmhhhhmhhmmnk', // 11
    'kmmhhmhhhhhhmhmnnk', // 12
    'kmmmhmhhhmhhmmmnnk', // 13
    'knmmmmmhmmmmmmnnnk', // 14
    'knnmmmnmmmnmmmnnnk', // 15
    '.knnnnkkrrkknnnnk.', // 16
    '..kkkk..kk..kkkk..', // 17
  ],
};

// Guardiana del Umbral (D07): veterana escéptica de unos 60 años. Pelo cano peinado hacia atrás con
// raya al medio y moño alto en la coronilla; cejas rectas, arrugas marcadas y boca firme (sin gesto
// de enfado).
export const GUARDIANA = {
  down: [
    '..................', // 0
    '.......kkkk.......', // 1
    '......kHHhhk......', // 2
    '......khhhmk......', // 3
    '....kkkmmmmkkk....', // 4
    '...kHHhhhhhhhmk...', // 5
    '..kHhhhhhmhhhhmk..', // 6
    '.kHhhhhhmmhhhhhmk.', // 7
    '.khhhhhmhhmhhhhmk.', // 8
    '.khhhhmhhhhmhhmmk.', // 9
    '.kmhhmSSSSSSmhmnk.', // 10
    'osnmmSSSSSSSSmnnso', // 11
    'osnmSSSSSSSSSSmnso', // 12
    '.okmSnnSSSSnnSmko.', // 13
    '..krswesSSsewsrk..', // 14
    '..krrsesSSsesrrk..', // 15
    '...krsrrrrrrsrk...', // 16
    '.....kkrrrrkk.....', // 17
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
    '.kShhhhhhhhhmmnnk.', // 10
    'kSSSshmhhhhmmnnk..', // 11
    '.kSnnSsmhmoohmnk..', // 12
    'kSSewsssmsromnk...', // 13
    'kSsesssrmoommk....', // 14
    '.krssssrrmnnk.....', // 15
    '..krrrssrnkk......', // 16
    '...kkrrrkk........', // 17
  ],
  up: [
    '..................', // 0
    '.......kkkk.......', // 1
    '......kHHhhk......', // 2
    '......kHhhmk......', // 3
    '....kkkhmmmkkk....', // 4
    '...kHHhhhhhhhmk...', // 5
    '..kHhhhhhhhhhhmk..', // 6
    '.kHhhhhhmhhhhhhmk.', // 7
    '.khhhhhmhhmhhhhmk.', // 8
    '.khhhhmhhhhmhhhmk.', // 9
    '.kmhhmhhhhhhmhhnk.', // 10
    'osnmhmhhhhhhmhmnso', // 11
    'osnmmhhhhhhhhmmnso', // 12
    '.oknmmmhmmhmmmnko.', // 13
    '..knnmmmmmmmmnnk..', // 14
    '...kknnnnnnnnkk...', // 15
    '.....kkrrrrkk.....', // 16
    '.......kkkk.......', // 17
  ],
};
