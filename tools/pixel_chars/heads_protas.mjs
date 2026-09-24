// Cabezas de los protagonistas (rejilla local de 18 px, filas y=0..17 del frame nativo).
// Símbolos: k contorno · H/h/m/n pelo (luz/base/sombra/oscuro) · S/s/r piel · o contorno de piel
// e ojo · w blanco del ojo.

// Protagonista masculino: castaño cobrizo; puntas superiores hacia atrás/derecha y flequillo en
// dos mechones que caen hacia su derecha dejando ver la frente. Sin gorra.
// 2.ª pasada: cabeza 2 filas más baja y 2 px más estrecha (proporción BW ≈ Cheren: cabeza 15 filas,
// cara 7), contorno de pelo irregular (puntas, patillas, mechones de nuca) y mechones con dirección
// para que no se lea como un casco.
export const PROTA_M = {
  down: [
    '..................', // 0
    '..................', // 1
    '..........kk.k....', // 2
    '......kk.kHhkHk...', // 3
    '.....kHhkHhhhhhk..', // 4
    '....kHhhhHhhhhhhk.', // 5
    '...kHHhhhhHhhhhmk.', // 6
    '..kHhhhhhhhhhhhmk.', // 7
    '.kHhhhhhhhhhhhmmk.', // 8
    '.khhhhmhhhhhmhhmk.', // 9
    '.khhhmShhhhmShhnk.', // 10
    '.kmhmSSshhmSSshnk.', // 11
    '.kmmSSSsSmSSSSmnk.', // 12
    '.kmSSeeSSSSeeSsmk.', // 13
    '.osSSweSSSSewSsso.', // 14
    '..osSssSSSSssSso..', // 15
    '...krssssssssrk...', // 16
    '.....kkrrrrkk.....', // 17
  ],
  left: [
    '..................', // 0
    '..................', // 1
    '...........kk.....', // 2
    '.......kk.kHhk.k..', // 3
    '......kHhkHhhhkHk.', // 4
    '.....kHhhHhhhhhhk.', // 5
    '....kHHhhhHhhhhmk.', // 6
    '...kHhhhhhhhhhhmk.', // 7
    '..kHhhhhhhhhhmmmk.', // 8
    '.kHhhhmhhhhhmhmnk.', // 9
    'khhhhmShhhmhhmmnk.', // 10
    'kmhhmSSmhhhhhmnnk.', // 11
    '.kmSSSSsmhoohmnk..', // 12
    'kSSeesssmsromnk...', // 13
    'kSSewsssmoommk....', // 14
    '.kssssssrmnnk.....', // 15
    '..krssssrnkk......', // 16
    '...kkrrrkk........', // 17
  ],
  up: [
    '..................', // 0
    '..................', // 1
    '..........kk.k....', // 2
    '......kk.kHhkHk...', // 3
    '.....kHhkHhhhhhk..', // 4
    '....kHhhhHhhhhhhk.', // 5
    '...kHHhhhhHhhhhmk.', // 6
    '..kHhhhhmhhhhhhmk.', // 7
    '.kHhhhhmhhhhmhmmk.', // 8
    '.khhhhmhhhhmhhhmk.', // 9
    '.kmhhmhhhhmhhhmnk.', // 10
    '.kmhhmhhmhhhmhmnk.', // 11
    '.knmhhmhhmhhmhnnk.', // 12
    'oknmmhmmhmmhmmnnko', // 13
    '.oknmnmmnmmnmnnko.', // 14
    '..knnknnnnknnnk...', // 15
    '...kk.krrk.kkk....', // 16
    '.......kkkk.......', // 17
  ],
};

// Protagonista femenina: azul marino casi nocturno (biblia §13.2). Peinado PROVISIONAL (D30):
// melena por los hombros con raya y flequillo ladeado; sin gorra ni coletas. 2.ª pasada: coronilla
// 1 fila más baja para igualar la altura de cabeza del masculino.
export const PROTA_F = {
  down: [
    '..................', // 0
    '..................', // 1
    '..................', // 2
    '.....kkkkkkkk.....', // 3
    '...kkhhhhhhhhkk...', // 4
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
    '..................', // 2
    '......kkkkkkk.....', // 3
    '....kkhhhhhhhkk...', // 4
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
    '..................', // 2
    '.....kkkkkkkk.....', // 3
    '...kkhhhhhhhhkk...', // 4
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
