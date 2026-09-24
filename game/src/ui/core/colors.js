// Colores de texto de Essentials 21.1 (MessageConfig / getSkinColor) y paleta de la UI.
const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

export const LIGHT_BASE = hex(248, 248, 248);
export const LIGHT_SHADOW = hex(72, 80, 88);
export const DARK_BASE = hex(80, 80, 88);
export const DARK_SHADOW = hex(160, 160, 168);
export const MALE_BASE = hex(48, 80, 200);
export const MALE_SHADOW = hex(208, 208, 200);
export const FEMALE_BASE = hex(224, 8, 8);
export const FEMALE_SHADOW = hex(208, 208, 200);

/** Pares [base, sombra] de \c[n] (1..14) sobre fondo claro; en fondo oscuro se invierten (salvo el 12). */
const TEXT_COLORS = [
  [hex(0, 112, 248), hex(120, 184, 232)], // 1 azul
  [hex(232, 32, 16), hex(248, 168, 184)], // 2 rojo
  [hex(96, 176, 72), hex(174, 208, 144)], // 3 verde
  [hex(72, 216, 216), hex(168, 224, 224)], // 4 cian
  [hex(208, 56, 184), hex(232, 160, 224)], // 5 magenta
  [hex(176, 143, 93), hex(235, 235, 44)], // 6 amarillo
  [hex(160, 160, 168), hex(208, 208, 216)], // 7 gris
  [hex(240, 240, 248), hex(120, 120, 128)], // 8 blanco
  [hex(114, 64, 232), hex(184, 168, 224)], // 9 morado
  [hex(248, 152, 24), hex(248, 200, 152)], // 10 naranja
  [DARK_BASE, DARK_SHADOW], // 11 oscuro por defecto
  [LIGHT_BASE, LIGHT_SHADOW], // 12 claro por defecto
  [hex(120, 120, 128), hex(240, 240, 248)], // 13
  [hex(150, 150, 150), hex(40, 40, 40)], // 14
];

/**
 * Colores [base, sombra] para un código de color de mensaje.
 * @param {number|string|null} code  null/0 = por defecto, 1..14, 'male', 'female' o '#rrggbb'
 * @param {boolean} darkSkin
 * @returns {[string, string]}
 */
export function messageColors(code, darkSkin) {
  if (code === 'male') return [MALE_BASE, MALE_SHADOW];
  if (code === 'female') return [FEMALE_BASE, FEMALE_SHADOW];
  if (typeof code === 'string' && code[0] === '#') return [code, darkSkin ? LIGHT_SHADOW : DARK_SHADOW];
  if (!code || code > TEXT_COLORS.length) return darkSkin ? [LIGHT_BASE, LIGHT_SHADOW] : [DARK_BASE, DARK_SHADOW];
  const [b, s] = TEXT_COLORS[code - 1];
  return darkSkin && code !== 12 ? [s, b] : [b, s];
}

// Paleta de pantallas (valores sacados de los scripts de Añil).
export const C = {
  white: LIGHT_BASE,
  whiteShadow: hex(104, 104, 104),
  panelShadow: hex(40, 40, 40),
  black: hex(64, 64, 64),
  blackShadow: hex(176, 176, 176),
  gray: hex(192, 200, 208),
  grayShadow: hex(208, 216, 224),
  red: hex(248, 56, 32),
  redShadow: hex(224, 152, 144),
  blue: hex(24, 112, 216),
  blueShadow: hex(136, 168, 208),
  maleSym: hex(24, 146, 240),
  maleSymShadow: hex(13, 73, 119),
  femaleSym: hex(249, 93, 210),
  femaleSymShadow: hex(128, 20, 90),
  bagText: hex(88, 88, 80),
  bagShadow: hex(168, 184, 184),
  statUp: hex(136, 96, 72),
  statDown: hex(64, 120, 152),
  // Core de Zygarde (telepatía): sobrio, verde sobre marco oscuro.
  core: '#b9ff66',
  coreShadow: '#1d3a12',
  coreFrame: '#0b1410',
  coreEdge: '#4f7a2a',
};

/** Colores de PP según fracción restante (Summary de Essentials). */
export function ppColors(pp, total) {
  if (total <= 0) return [C.black, C.blackShadow];
  if (pp === 0) return [hex(248, 72, 72), hex(136, 48, 48)];
  if (pp * 4 <= total) return [hex(248, 136, 32), hex(144, 72, 24)];
  if (pp * 2 <= total) return [hex(248, 192, 0), hex(144, 104, 0)];
  return [C.black, C.blackShadow];
}
