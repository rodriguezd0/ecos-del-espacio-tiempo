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
