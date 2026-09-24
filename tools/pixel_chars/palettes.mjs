// Paletas de personajes (todas PROVISIONALES, D30). Símbolos compartidos por cabezas y cuerpos:
// k contorno · H/h/m/n pelo · S/s/r piel · e/i ojos · L/J/j/d chaqueta · G acento · T/t camiseta
// P/p pantalón · Q/q pierna baja · B/b/W calzado · C/c/x faldón/abrigo (superposiciones).

export const ZYGARDE_GREEN = '#B9FF66';

const EYES = { e: '#1C1820', w: '#F8F8F8' };
const SKIN_LIGHT = { S: '#FCE0C4', s: '#F2BC8E', r: '#C8845A', o: '#7A4A30', ...EYES };
const SKIN_MID = { S: '#F4CCA4', s: '#DDA070', r: '#AE6E46', o: '#6A3E26', ...EYES };
const SKIN_TAN = { S: '#E8B888', s: '#C98E5E', r: '#99603A', o: '#5A3420', ...EYES };

export const PALETTES = {
  // Protagonista masculino (biblia §13.1): castaño cobrizo, chaqueta azul petróleo cerrada, camiseta
  // clara reducida, pantalón y calzado oscuros, tirador de cremallera verde #B9FF66.
  protagonista_m: {
    k: '#1C1820',
    H: '#E8A060', h: '#BC6630', m: '#8C4424', n: '#5C2A1A',
    ...SKIN_LIGHT,
    L: '#3E8E96', J: '#256870', j: '#194A52', d: '#0E3036',
    G: ZYGARDE_GREEN,
    T: '#EEF2EE', t: '#B8C4C0',
    P: '#383C52', p: '#262838', Q: '#383C52', q: '#262838',
    B: '#2E2C36', b: '#1C1A22', W: '#6C6A7A',
  },
  // Protagonista femenina (biblia §13.2): azul marino profundo con lectura azul; comparte el acento
  // verde. PROPUESTA PROVISIONAL (D30): chaqueta corta clara (blanco hueso) cerrada, cuello interior
  // azul noche, pantalón corto oscuro sobre mallas, calzado oscuro.
  protagonista_f: {
    k: '#161624',
    H: '#5A6CB4', h: '#34427E', m: '#222C58', n: '#141A38',
    ...SKIN_LIGHT,
    L: '#F6F4EE', J: '#DCD8CC', j: '#A9A496', d: '#6C685E',
    G: ZYGARDE_GREEN,
    T: '#2A3052', t: '#1C2038',
    P: '#343850', p: '#22253A', Q: '#24242E', q: '#17171F',
    B: '#3A3446', b: '#231E2A', W: '#6C6A7A',
  },
  // Gael (§13.3, paleta histórica del autor a ratificar): rubio, chaqueta bordó, ropa inferior gris,
  // botas azul oscuro, ojos claros. Sin acento verde (tirador metálico).
  gael: {
    k: '#281810',
    H: '#F8F8C8', h: '#E0C870', m: '#A08840', n: '#604820',
    ...SKIN_LIGHT,
    e: '#284C70',
    L: '#A03848', J: '#782030', j: '#481018', d: '#30080C',
    G: '#A8A8B0',
    T: '#404040', t: '#303030',
    P: '#606060', p: '#404040', Q: '#606060', q: '#404040',
    B: '#406090', b: '#203050', W: '#607090',
  },
  // Profesor (D03 abierto): abrigo claro de campo, jersey pizarra, pantalón marrón. Sin emblemas.
  profesor: {
    k: '#1E1A18',
    H: '#8A6A4C', h: '#5E4432', m: '#422E22', n: '#2A1C14',
    ...SKIN_MID,
    L: '#EEEADC', J: '#D6D0BC', j: '#A8A08A', d: '#746C5A',
    C: '#D6D0BC', c: '#A8A08A', x: '#746C5A',
    G: '#D6D0BC',
    T: '#4A5870', t: '#34405A',
    P: '#5A4838', p: '#3E3226', Q: '#5A4838', q: '#3E3226',
    B: '#3A2A20', b: '#241A14', W: '#5A4A3E',
  },
  // Policía genérico del acceso restringido (§13.8): uniforme azul marino, camisa celeste.
  policia: {
    k: '#14141E',
    H: '#4A4038', h: '#322A24', m: '#221C18', n: '#161210',
    ...SKIN_MID,
    U: '#3C4C84', u: '#2A3666', v: '#161C34', V: '#1C1C24',
    L: '#44548C', J: '#2E3A6C', j: '#1E264C', d: '#121834',
    G: '#E8C050',
    T: '#B8D0E8', t: '#88A0C0',
    P: '#262E50', p: '#181E38', Q: '#262E50', q: '#181E38',
    B: '#1E1E24', b: '#101014', W: '#3C3C48',
  },
  // Vecino genérico: chaqueta ocre, vaqueros.
  vecino: {
    k: '#1A1614',
    H: '#5A5A70', h: '#38384A', m: '#24242E', n: '#16161C',
    ...SKIN_TAN,
    L: '#E6B85A', J: '#C48E34', j: '#8C6024', d: '#5A3C14',
    G: '#C48E34',
    T: '#F0F0E8', t: '#C0C0B8',
    P: '#5070A8', p: '#34507E', Q: '#5070A8', q: '#34507E',
    B: '#6A4028', b: '#422818', W: '#8A6A50',
  },
  // Vecina genérica: rebeca coral, falda azul noche, moño castaño.
  vecina: {
    k: '#1C1418',
    H: '#A86A44', h: '#7C4A2E', m: '#58321E', n: '#3A2014',
    ...SKIN_LIGHT,
    L: '#F4A488', J: '#DA7C5C', j: '#A6573C', d: '#6E3624',
    G: '#DA7C5C',
    T: '#F4F0E8', t: '#C8C0B4',
    C: '#4A5680', c: '#323C60', x: '#1E2440',
    P: '#4A5680', p: '#323C60', Q: '#3A3040', q: '#261E2C',
    B: '#7A2E34', b: '#4E1A20', W: '#9A5058',
  },
  // Anciano genérico: rebeca marrón, pantalón beige, pelo cano.
  anciano: {
    k: '#1C1814',
    H: '#F0F0F4', h: '#C4C4CE', m: '#9494A4', n: '#646474',
    ...SKIN_LIGHT,
    L: '#B0906A', J: '#8A6C4C', j: '#624C36', d: '#3E2E20',
    G: '#8A6C4C',
    T: '#F0F0E8', t: '#C0C0B8',
    P: '#BEAE8C', p: '#8E806A', Q: '#BEAE8C', q: '#8E806A',
    B: '#4A3426', b: '#2E2018', W: '#6A5444',
  },
};
