// Plantilla de carrera para el cuerpo "chaqueta" (misma rejilla y símbolos que body_jacket.mjs).
// Ciclo de 4 frames como en los charsets _run de Añil: 0 y 2 = paso cruzado (cuerpo agachado 1 px),
// 1 y 3 = zancada (cuerpo elevado), brazos flexionados.
import { toBack } from './body_jacket.mjs';
import { mirrorLimbs } from './assemble.mjs';

const RUN_DOWN0 = [
  '..................', // 16
  '..................', // 17
  '....kkkkkkkkkk....', // 18
  '...kLLJJTTJJjjk...', // 19
  '..kLLdLJGJJjdjjk..', // 20
  '.kLLJdLJdJJjdjjjk.', // 21
  '.kSskdJJdJJjdkSsk.', // 22
  '.ksskjjjdjjjjkssk.', // 23
  '..kkkkPPPPPpkkkk..', // 24
  '.....kPPkkPpk.....', // 25
  '.....kPPkkQqk.....', // 26
  '.....kQqkkBBbk....', // 27
  '.....kQqk.kkk.....', // 28
  '....kBBBk.........', // 29
  '.....kkk..........', // 30
  '..................', // 31
];

const RUN_DOWN1 = [
  '..................', // 16
  '....kkkkkkkkkk....', // 17
  '...kLLJJTTJJjjk...', // 18
  '..kLLdLJGJJjdjjk..', // 19
  '.kSsLdLJdJJjdjjk..', // 20
  '.ksskdJJdJJjdjjk..', // 21
  '..kkkdJJdJjjdSsk..', // 22
  '....kjjjdjjjkssk..', // 23
  '....kPPPPPPpkkk...', // 24
  '....kPPkkkPpk.....', // 25
  '...kPPk..kPpk.....', // 26
  '...kBBbk.kQqk.....', // 27
  '....kkk..kQqk.....', // 28
  '.........kQqk.....', // 29
  '........kBBBbk....', // 30
  '.........kkkk.....', // 31
];

export const RUN = {
  down: [
    { key: 'rdown0', lift: 1, body: RUN_DOWN0 },
    { key: 'rdown1', lift: 0, body: RUN_DOWN1 },
    { key: 'rdown2', lift: 1, body: mirrorLimbs(RUN_DOWN0, { keepRows: [2, 7] }) },
    { key: 'rdown3', lift: 0, body: mirrorLimbs(RUN_DOWN1, { keepRows: [1, 7] }) },
  ],
  left: [
    {
      key: 'rleft0', lift: 1, headX: -1, body: [
        '..................', // 16
        '..................', // 17
        '......kkkkkk......', // 18
        '.....kTJLLJjk.....', // 19
        '.....kGdLLdjk.....', // 20
        '.....kJdLLdjk.....', // 21
        '.....kJkSsdjk.....', // 22
        '.....kjkssdjk.....', // 23
        '......kPPPPpk.....', // 24
        '......kPPkPpk.....', // 25
        '.....kPPk.kppk....', // 26
        '.....kQqk.kqqk....', // 27
        '....kBBBk..kbbk...', // 28
        '....kkkk...kbbk...', // 29
        '............kk....', // 30
        '..................', // 31
      ],
    },
    {
      key: 'rleft1', lift: 0, headX: -1, body: [
        '..................', // 16
        '......kkkkkk......', // 17
        '.....kTJLLJjk.....', // 18
        '.....kGdLLdjk.....', // 19
        '....kSsdLJjjk.....', // 20
        '....kssdLJjjk.....', // 21
        '.....kkjjjjjk.....', // 22
        '......kPPPPpk.....', // 23
        '.....kPPPkPPpk....', // 24
        '...kPPPk..kPpk....', // 25
        '..kQqkk....kqqk...', // 26
        '.kBBk.......kqqk..', // 27
        '.kbbk.......kbbbk.', // 28
        '..kk.........kkk..', // 29
        '..................', // 30
        '..................', // 31
      ],
    },
    {
      key: 'rleft2', lift: 1, headX: -1, body: [
        '..................', // 16
        '..................', // 17
        '......kkkkkk......', // 18
        '.....kTJLLJjk.....', // 19
        '.....kGdLLdjk.....', // 20
        '.....kJdLLdjk.....', // 21
        '.....kJdLSskk.....', // 22
        '.....kjdLsskk.....', // 23
        '......kPPPPpk.....', // 24
        '......kPpkPPk.....', // 25
        '.....kppk.kPPk....', // 26
        '.....kqqk.kQqk....', // 27
        '....kbbbk..kBBk...', // 28
        '....kkkk...kBBk...', // 29
        '............kk....', // 30
        '..................', // 31
      ],
    },
    {
      key: 'rleft3', lift: 0, headX: -1, body: [
        '..................', // 16
        '......kkkkkk......', // 17
        '.....kTJLLJjk.....', // 18
        '.....kGdLLdjk.....', // 19
        '.....kJJdLLdjk....', // 20
        '.....kJJdLLSsk....', // 21
        '.....kjjjjdssk....', // 22
        '......kPPPPkk.....', // 23
        '.....kppPkPPpk....', // 24
        '...kpppk..kPPk....', // 25
        '..kqqkk....kQqk...', // 26
        '.kbbk.......kQqk..', // 27
        '.kbbk.......kBBBk.', // 28
        '..kk.........kkk..', // 29
        '..................', // 30
        '..................', // 31
      ],
    },
  ],
};

RUN.up = RUN.down.map((p) => ({ ...p, key: p.key.replace('rdown', 'rup'), body: toBack(p.body) }));
