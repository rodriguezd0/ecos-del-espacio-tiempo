// Cabezas de los protagonistas para el kit (prota_kit.mjs): 18×20 por vista, 4.ª pasada (25-09-2026) al estilo
// de los charsets BW de Añil (guay, cheren, chaval): cabeza redonda (cúpula de pelo de 16 px que se ensancha
// fila a fila), cara estrecha enmarcada por el pelo, orejas, barbilla estrecha perfilada con el tono oscuro de
// la piel (no con negro) y ojos 2×2 (brillo exterior, pupila/iris interior) con el párpado en la columna
// interior. Pelo desde la fila 2, ojos en 15–16, barbilla en 18 y su base en 19.
// Símbolos: k contorno · H/h/m/n pelo (luz, base, sombra, línea interior) · S/s/r piel, o línea de piel
// · e pupila · w brillo · i iris.
import { checkHead } from './prota_kit.mjs';

// Protagonista masculino (biblia §13.1): castaño cobrizo, sin gorra. Cresta de mechones barridos hacia atrás y
// a su izquierda (derecha de la pantalla; de espaldas, a la izquierda), con un mechón que sobresale por ese
// lado: la silueta tiene dirección, sin casco ni las puntas verticales de Gael. Rayas de mechón en diagonal,
// flequillo en tres mechones con punta que deja ver la frente, patillas y orejas.
export const PROTA_M_HEAD = checkHead('PROTA_M_HEAD', {
  down: [
    '..................', // 0
    '..................', // 1
    '........n...nn....', // 2
    '.....kkHnkkHhnk...', // 3
    '....kHHhhkHHhhhk..', // 4
    '...kHHhhhhhhhhhnk.', // 5
    '..kHHhhhhhhhhmhhnk', // 6
    '..kHhhhhhhhhmhhhmk', // 7
    '.kHhhhhhhhhmhhhmnk', // 8
    '.kHhhhhhhhmhhhmmk.', // 9
    '.khhhhmhhmhhhmhmk.', // 10
    '.khhhmhhmhhhmhhmk.', // 11
    '.kmhmhhmhhhmhhmnk.', // 12
    '.ksnhSmhhSSmhSnsk.', // 13
    '.osnSSkSSSSkSSnso.', // 14
    '..kosweSSSSewsok..', // 15
    '...kswiSSSSiwsk...', // 16
    '....osSSSSSSso....', // 17
    '....kosSssSsok....', // 18
    '........oo........', // 19
  ],
  left: [
    '..................', // 0
    '..................', // 1
    '.........n..nn....', // 2
    '......kkHnkHhnk...', // 3
    '.....kHHhhHhhhhk..', // 4
    '....kHHhhhhhhhhnk.', // 5
    '...kHHhhhhhhhhmhnk', // 6
    '...kHhhhhhhhhmhhmk', // 7
    '..kHhhhhhhhhmhhhmk', // 8
    '..kHhhhhhhhmhhhmnk', // 9
    '..khhhhhhhmhhhmmnk', // 10
    '..khhhhhhmhhhmmnk.', // 11
    '..kmhhhmhhhmmmnnk.', // 12
    '..kmmhmhhmmmmnnnk.', // 13
    '..oSkSSnmhmmmnnk..', // 14
    '..oSewSnsommnnk...', // 15
    '..oSiwSSsomnnk....', // 16
    '...oSSSSSokkk.....', // 17
    '....ooSSsok.......', // 18
    '......ooo.........', // 19
  ],
  up: [
    '..................', // 0
    '..................', // 1
    '.....n...n........', // 2
    '....knHkknHk......', // 3
    '...kHHhhkHHhhk....', // 4
    '..kHHhhhhhhhhhk...', // 5
    '..kHhhhhhhhhhhhk..', // 6
    '.kHhhhhhhhhhhhhhk.', // 7
    '.kHhmhhhhhhhhhhhk.', // 8
    '.khhhmhhhhhhmhhhk.', // 9
    '.khhhhmhhhhhhmhhk.', // 10
    '.kmhhhhmhhhhhhmhk.', // 11
    'osmmhhhhmhhhhhmmso', // 12
    'osmmmhhhhmhhhmmmso', // 13
    'osnmmmhhhhmhmmmnso', // 14
    '.knnmmmmhhmmmmnnk.', // 15
    '..knnmmmmmmmmnnk..', // 16
    '...knnnmmmmnnnk...', // 17
    '....knnnnnnnnk....', // 18
    '......knnnnk......', // 19
  ],
});
