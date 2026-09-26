// Cabeza de la PROTAGONISTA FEMENINA para el kit de protagonistas (prota_kit.mjs): 20 filas por vista y
// 22 columnas (la rejilla de 18 + 2 por lado, centrada, para que las puntas de la melena sobresalgan), con
// la cara en el mismo sitio que la del masculino: coronilla en la fila 2, ojos 2×3 en 13–15, barbilla en la 18.
// Biblia §13.2: azul marino casi nocturno con lectura azul (anillo de brillo H en la coronilla, mechones en
// sombra m/n). Diseño propio PROVISIONAL (DECIDIDO-DEV): media melena hasta los hombros con raya a su
// izquierda y flequillo barrido hacia su derecha en puntas; las puntas se abren hacia fuera en los hombros;
// por su izquierda el pelo se recoge en una TRENZA fina que cae por delante del hombro, atada con una goma
// verde #B9FF66 (su acento). De frente la trenza queda a la derecha de la pantalla, de espaldas a la
// izquierda y de perfil cae detrás de la oreja.
// Símbolos: k contorno · H/h/m/n pelo · S/s/r piel, o línea de piel · e pupila, w brillo, i iris · G verde.
import { checkHead } from './prota_kit.mjs';

export const PROTA_F_HEAD = checkHead('PROTA_F_HEAD', {
  down: [
    '......................', // 0
    '......................', // 1
    '........kkkkkk........', // 2
    '......kkhHHHHhkk......', // 3
    '.....khHHhmmhHHhk.....', // 4
    '....khHhhhhhhnhHhk....', // 5
    '...khHHhhhhhhnHHhhk...', // 6
    '..khHhhHHHHHhmnHhmmk..', // 7
    '..kHhhhhhhhmhhmnHmmk..', // 8
    '..kHhhhhhhmhhhmmnHmk..', // 9
    '..khhhhhhmhhhmmnnmHk..', // 10
    '..kmhhhhmhhmhmmSSHmk..', // 11
    '..kmhmSSSSmSSSSSSmHk..', // 12
    '..kmhSSkkSSSSkkSSHmk..', // 13
    '..kmhSSweSSSSewSSmHk..', // 14
    '..kmmSSwiSSSSiwSSHmk..', // 15
    '.kHmmsSSSSSSSSSSsmHk..', // 16
    'kHhmnksSSSSrSSSskGGk..', // 17
    '.khmmnkkossssokkkhmk..', // 18
    '..kkkk...........kk...', // 19
  ],
  left: [
    '......................', // 0
    '......................', // 1
    '.........kkkkk........', // 2
    '.......kkhHHHhkk......', // 3
    '......khHHhmhHHhk.....', // 4
    '.....khHhhhhhhhHhk....', // 5
    '....khHhhhhhhhhHhmk...', // 6
    '....kHhhHHHHHHhhhmmk..', // 7
    '...kHhhhhmhhhhmhhmmk..', // 8
    '...kHhhhmHhhhhhmhmmk..', // 9
    '...khhhmHhhmhhhhmmnk..', // 10
    '...khhmHhhmhhmhhmmnk..', // 11
    '...kmhmSSmhhmHmhmmnk..', // 12
    '...kmSkkSSSoSmHmmnnk..', // 13
    '...kSSewSSSoSHmmmnnk..', // 14
    '..kSSSiwSSSosmHmnnnk..', // 15
    '...kSSSSSSSSkHmmnnmHk.', // 16
    '....kSrSSSSkkGGknnmhHk', // 17
    '.....kkosssokHmkmnkkk.', // 18
    '.............kk.kk....', // 19
  ],
  up: [
    '......................', // 0
    '......................', // 1
    '........kkkkkk........', // 2
    '......kkhHHHHhkk......', // 3
    '.....khHHhmmhHHhk.....', // 4
    '....khHhhhhhhhhHhk....', // 5
    '...khhHhhhhhhhhHhmk...', // 6
    '..khhhhHHHHHHHhhhmmk..', // 7
    '..kHhhHhhhHhhhHhhmmk..', // 8
    '..kHmhHhhmHhhmHhmmnk..', // 9
    '..kmHhHhhmHhhmhhmmnk..', // 10
    '..kHmhHhhmHhhmhhmmnk..', // 11
    '..kmHhhhhmhhhmhmmmnk..', // 12
    '..kHmkhhhmhhhmhmmnnk..', // 13
    '..kmHkhhhmhhhmmmmnnk..', // 14
    '..kHmkmhhmmhhmmmmnnk..', // 15
    '..kmHkmhhmmhhmmmnnHmk.', // 16
    '..kGGkmmhmmmhmmnnnmhHk', // 17
    '..khmkmnnkmnnknnnmnkk.', // 18
    '...kk.kkk.kkk.kkkkk...', // 19
  ],
});
