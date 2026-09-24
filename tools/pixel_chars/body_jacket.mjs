// Plantilla de cuerpo "chaqueta" (rejilla local de 18 px de ancho, filas y=16..31 del frame nativo).
// Símbolos: k contorno · L/J/j/d chaqueta (luz/base/sombra/línea) · G acento verde · T camiseta
// S/s piel · P/p pantalón (muslo) · Q/q pierna baja · B/b calzado.
// `lift` = desplazamiento de la cabeza en ese frame (los pasos elevan el cuerpo 1 px, como en BW).
// La vista de espaldas se deriva de la frontal (sin cuello de camiseta, tirador ni cremallera).

const ZIP_COL = 8;

/** Frontal → espalda: quita camiseta, acento y la línea de cremallera. */
export function toBack(rows) {
  return rows.map((row) => {
    let r = row.replace(/[TG]/g, 'J');
    if (r[ZIP_COL] === 'd') r = `${r.slice(0, ZIP_COL)}J${r.slice(ZIP_COL + 1)}`;
    return r;
  });
}

const DOWN0 = [
  '..................', // 16
  '....kkkkkkkkkk....', // 17
  '...kLLJJTTJJjjk...', // 18
  '..kLLdLJGJJjdjjk..', // 19
  '..kLJdLJdJJjdjjk..', // 20
  '..kLJdLJdJJjdjjk..', // 21
  '..kJJdJJdJJjdjjk..', // 22
  '..kJJdJJdJjjdjjk..', // 23
  '..kSsdjjdjjjdSsk..', // 24
  '..ksskPPPPPpkssk..', // 25
  '...kkkPPkkPpkkk...', // 26
  '.....kPPkkPpk.....', // 27
  '.....kQqkkQqk.....', // 28
  '....kBBBkkBBbk....', // 29
  '.....kkk..kkk.....', // 30
  '..................', // 31
];

const DOWN1 = [
  '....kkkkkkkkkk....', // 16
  '...kLLJJTTJJjjk...', // 17
  '..kLLdLJGJJjdjjk..', // 18
  '..kLJdLJdJJjdjjk..', // 19
  '..kLJdLJdJJjdjjk..', // 20
  '..kJJdJJdJJjdjjk..', // 21
  '..kJJdJJdJjjdjjk..', // 22
  '..kSsdjjdjjjdjjk..', // 23
  '..ksskPPPPPpkSsk..', // 24
  '...kkkPPkkPpkssk..', // 25
  '.....kQqkkPpkkk...', // 26
  '....kBBBkkPpk.....', // 27
  '.....kkk.kQqk.....', // 28
  '........kBBBbk....', // 29
  '.........kkkk.....', // 30
  '..................', // 31
];

const DOWN3 = [
  '....kkkkkkkkkk....', // 16
  '...kLLJJTTJJjjk...', // 17
  '..kLLdLJGJJjdjjk..', // 18
  '..kLJdLJdJJjdjjk..', // 19
  '..kLJdLJdJJjdjjk..', // 20
  '..kJJdJJdJJjdjjk..', // 21
  '..kLJdJJdJjjdjjk..', // 22
  '..kLJdjjdjjjdSsk..', // 23
  '..kSsdPPPPPpkssk..', // 24
  '..ksskPPkkPpkkk...', // 25
  '...kkkPpkkQqk.....', // 26
  '.....kPpkkBBbk....', // 27
  '.....kQqk.kkk.....', // 28
  '....kBBBbk........', // 29
  '.....kkkk.........', // 30
  '..................', // 31
];

export const WALK = {
  down: [
    { key: 'down0', lift: 0, body: DOWN0 },
    { key: 'down1', lift: -1, body: DOWN1 },
    { key: 'down3', lift: -1, body: DOWN3 },
  ],
  left: [
    {
      key: 'left0', lift: 0, body: [
        '..................', // 16
        '......kkkkkk......', // 17
        '.....kTJLLJjk.....', // 18
        '.....kGdLLdjk.....', // 19
        '.....kJdLJdjk.....', // 20
        '.....kJdLJdjk.....', // 21
        '.....kJdLJdjk.....', // 22
        '.....kjdLJdjk.....', // 23
        '.....kjdSsdjk.....', // 24
        '......kPssPk......', // 25
        '......kPPPpk......', // 26
        '.......kPpk.......', // 27
        '.......kQqk.......', // 28
        '......kBBBk.......', // 29
        '......kkkk........', // 30
        '..................', // 31
      ],
    },
    {
      key: 'left1', lift: -1, body: [
        '......kkkkkk......', // 16
        '.....kTJLLJjk.....', // 17
        '.....kGdLLdjk.....', // 18
        '.....kJJdLLdk.....', // 19
        '.....kJJdLJdk.....', // 20
        '.....kjJdLJdk.....', // 21
        '.....kjjdSsdk.....', // 22
        '......kPPssPk.....', // 23
        '......kPPPPpk.....', // 24
        '.....kPPkkPpk.....', // 25
        '....kPPk..kppk....', // 26
        '...kQqk....kqqk...', // 27
        '..kBBk.....kqqk...', // 28
        '..kbbk....kbbbk...', // 29
        '...kk......kkk....', // 30
        '..................', // 31
      ],
    },
    {
      key: 'left3', lift: -1, body: [
        '......kkkkkk......', // 16
        '.....kTJLLJjk.....', // 17
        '.....kGLLdJjk.....', // 18
        '....kLLdJJjjk.....', // 19
        '....kLJdJJjjk.....', // 20
        '....kSsdJJjjk.....', // 21
        '....kssdjjjjk.....', // 22
        '.....kkPPPPpk.....', // 23
        '......kPPPPpk.....', // 24
        '.....kppkkPPk.....', // 25
        '....kppk..kPPk....', // 26
        '...kqqk....kQqk...', // 27
        '..kbbk.....kQqk...', // 28
        '..kbbk....kBBBk...', // 29
        '...kk......kkk....', // 30
        '..................', // 31
      ],
    },
  ],
  up: [
    { key: 'up0', lift: 0, body: toBack(DOWN0) },
    { key: 'up1', lift: -1, body: toBack(DOWN1) },
    { key: 'up3', lift: -1, body: toBack(DOWN3) },
  ],
};
