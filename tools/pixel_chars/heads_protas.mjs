// Cabezas de los protagonistas (rejilla local de 18 px, filas y=0..17 del frame nativo).
// Símbolos: k contorno · H/h/m/n pelo (luz/base/sombra/oscuro) · S/s/r piel · o contorno de piel
// e ojo · w blanco del ojo.

// Protagonista masculino: castaño cobrizo; puntas superiores hacia atrás/derecha y flequillo en
// dos mechones que caen hacia su derecha dejando ver la frente. Sin gorra.
export const PROTA_M = {
  down: [
    '..................', // 0
    '..........kk......', // 1
    '.....kk..kHhk.....', // 2
    '....kHhkkhHhhk....', // 3
    '...kHhhhhhhhhhhk..', // 4
    '..kHHhhhhhhhhhhmk.', // 5
    '.kHHhhhhhhhhhhhmk.', // 6
    '.kHhhhhhhhhhhhmmk.', // 7
    '.khhhhhmhhhhhmhmk.', // 8
    '.kmhhhmhhhhhmhhmk.', // 9
    '.kmhhmhhhhhmhhhnk.', // 10
    'osnmmhhhhmhhhhmnso', // 11
    'osnmhhmSshhmSsmnso', // 12
    '.okmmSSssmSSssmko.', // 13
    '..krswesSSsewsrk..', // 14
    '..krssesSSsessrk..', // 15
    '...krssssssssrk...', // 16
    '.....kkrrrrkk.....', // 17
  ],
  left: [
    '..................', // 0
    '...........kk.....', // 1
    '......kk..kHhk....', // 2
    '.....kHhkkhHhhk...', // 3
    '....kHhhhhhhhhhhk.', // 4
    '...kHHhhhhhhhhhhk.', // 5
    '..kHHhhhhhhhhhhmk.', // 6
    '.kHhhhhhhhhhhhhmmk', // 7
    '.khhhhmhhhhhmhhmnk', // 8
    'khhhhmhhhhhmhhhmnk', // 9
    'kmhhmhhhhhmhhhmmnk', // 10
    'kmmSSmhhmhhhmhmnnk', // 11
    '.kSSSsmhmoohhmnnk.', // 12
    'kSSewsssmsromnnk..', // 13
    'kSsessssmoommnk...', // 14
    '.kssssssrmnnk.....', // 15
    '..krssssrnkk......', // 16
    '...kkrrrkk........', // 17
  ],
  up: [
    '..................', // 0
    '..........kk......', // 1
    '.....kk..kHhk.....', // 2
    '....kHhkkhHhhk....', // 3
    '...kHhhhhhhhhhhk..', // 4
    '..kHHhhhhhhhhhhmk.', // 5
    '.kHHhhhhhhhhhhhmk.', // 6
    '.kHhhhhhhhhhhhmmk.', // 7
    '.khhhhhmhhhhhhmmk.', // 8
    '.kmhhhhhmhhhhmhmk.', // 9
    '.kmhmhhhhmhhmhhnk.', // 10
    'osnmhmhhhmhmhhmnso', // 11
    'osnmmhmhhmhhmhmnso', // 12
    '.oknmmhmmhmmhmnko.', // 13
    '..knmmnmmmnmmnnk..', // 14
    '...knnknnnnknnk...', // 15
    '....kk.krrk.kk....', // 16
    '.......kkkk.......', // 17
  ],
};

// Protagonista femenina: azul marino casi nocturno (biblia §13.2). Peinado PROVISIONAL (D30):
// melena por los hombros con raya y flequillo ladeado; sin gorra ni coletas.
export const PROTA_F = {
  down: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkhhhhhhkk....', // 3
    '...khhhhhhhhhhk...', // 4
    '..khHHHhhHHHhhmk..', // 5
    '.khHhhHHHhhHHhhmk.', // 6
    '.khhhhhhhhhhhhmmk.', // 7
    '.khhhhhhhhhhhmmmk.', // 8
    '.khhhhhhmhhhhhhmk.', // 9
    'kmhhhhhmhhhhhhhmnk', // 10
    'kmhhhhmSshhhhhhmnk', // 11
    'kmhhhmSSSshhhhmmnk', // 12
    'kmhhmSSSSSsmhhmmnk', // 13
    'kmhmrwesSSsewrmnnk', // 14
    'kmhmrsesSSsesrmnnk', // 15
    'kmmnkrssssssrknmnk', // 16
    'knmnkkkrrrrkkknmnk', // 17
    '.knnk........knnk.', // 18
    '..kk..........kk..', // 19
  ],
  left: [
    '..................', // 0
    '..................', // 1
    '.......kkkkk......', // 2
    '.....kkhhhhhkk....', // 3
    '....khhhhhhhhhk...', // 4
    '...khHHHhhHHHhhk..', // 5
    '..khHhhHHHhhHHhmk.', // 6
    '.khhhhhhhhhhhhhmk.', // 7
    '.khhhhhhhhhhhhhmmk', // 8
    'khhhhhhhhhhhhhhmmk', // 9
    'khhhhmhhhhhhhhmmnk', // 10
    'kmhhmSmhhhhhhmmmnk', // 11
    '.kmSSSSmhhhhhmmnnk', // 12
    'kSSewSSmhhhhmmmnnk', // 13
    'kSsesssmhhhmmmnnk.', // 14
    '.kssssrmhhmmmnnk..', // 15
    '..krsssrkmmmnnk...', // 16
    '...kkrrrkmmmnnk...', // 17
    '.........kmnnk....', // 18
    '..........kkk.....', // 19
  ],
  up: [
    '..................', // 0
    '..................', // 1
    '......kkkkkk......', // 2
    '....kkhhhhhhkk....', // 3
    '...khhhhhhhhhhk...', // 4
    '..khHHHhhHHHhhmk..', // 5
    '.khHhhHHHhhHHhhmk.', // 6
    '.khhhhhhhhhhhhmmk.', // 7
    '.khhhhhhhhhhhmmmk.', // 8
    '.khhhhhhhhhhhhhmk.', // 9
    'kmhhhhhhhhhhhhhmnk', // 10
    'kmhhhhhhhhhhhhmmnk', // 11
    'kmhhhhhhhhhhhhmmnk', // 12
    'kmmhhhmhhhhmhhmmnk', // 13
    'kmmhhmhhhhhhmhmnnk', // 14
    'kmmmhmhhhmhhmmmnnk', // 15
    'knmmmmmhmmmmmmnnnk', // 16
    'knnmmmnmmmnmmmnnnk', // 17
    '.knnnnkknnkknnnnk.', // 18
    '..kkkk..kk..kkkk..', // 19
  ],
};
