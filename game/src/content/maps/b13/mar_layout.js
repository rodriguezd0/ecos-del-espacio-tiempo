// Coordenadas del Mar del Sur (docs/CAMPANA.md §1.2 y §1.4: un solo mar en tres sectores; tileset 1). Fuente única
// para el constructor, los eventos, el README y los tests. Módulo puro.
//
// Trazado (DECIDIDO-DEV B13): el mar ocupa la franja al sur de la costa de B09b, que en el mundo es una sola línea
// Caleta Sonda (36) · Ruta 15 (90) · Ciudad Nexo (64) = 190 casillas. Cada mapa de la costa conecta su borde sur con
// el borde norte del mar (vuelta simétrica); el islote y la estación cuelgan del borde sur y el volcán, del este:
//   x 0–59   sector OESTE  · frente a Caleta Sonda, boyas-farolillo hacia el Islote Lumbre (x 20–43, al sur)
//   x 60–129 sector CENTRO · escollos camino de la Estación Talasa (x 76–115, al sur)
//   x 130–189 sector ESTE  · islas de basalto; al este, el Volcán Tizón (borde este, filas 0–49)
// Los bordes sur de la costa no están a la misma altura (Caleta 34, Ruta 15 40 y Nexo 46 filas bajo la Ruta 15):
// desde el mar cada vecino se dibuja pegado a su conexión (MapScene recoloca los vecinos al cambiar de mapa).
//   w mar · s arena (bancos con espuma) · r roca en el agua · k escollo (roca grande en el agua)
export const W = 190;
export const H = 50;

/** Conexiones (offset = x de ESTE mapa donde cae la x 0 del vecino). */
export const LINKS = Object.freeze({
  north: Object.freeze([
    { to: 'caleta_sonda', offset: 0, width: 36 },
    { to: 'ruta_15', offset: 36, width: 90 },
    { to: 'ciudad_nexo', offset: 126, width: 64 },
  ]),
  south: Object.freeze([
    { to: 'islote_lumbre', offset: 20, width: 24 },
    { to: 'estacion_talasa', offset: 76, width: 40 },
  ]),
  // El volcán se alza al este del sector este (su ladera sube hacia el norte, como en los mapas de Añil).
  east: Object.freeze([{ to: 'volcan_tizon', offset: 0, height: 50 }]),
});

export const SECTORS = Object.freeze({ west: [0, 59], centre: [60, 129], east: [130, 189] });

/** Bancos de arena (rectángulos convexos: el pincel `playa` los bordea de espuma). */
export const SANDBARS = Object.freeze([
  { id: 'banco_caleta', x: 3, y: 14, w: 7, h: 5 }, // frente a Caleta Sonda (C062)
  { id: 'banco_boyas', x: 44, y: 22, w: 6, h: 4 }, // a medio camino del islote
  { id: 'banco_pescador', x: 86, y: 9, w: 8, h: 5 }, // sector centro: el pescador del banco
  { id: 'banco_talasa', x: 118, y: 36, w: 6, h: 4 }, // cerca de la plataforma
  { id: 'basalto_1', x: 132, y: 13, w: 7, h: 5 }, // islas de basalto (C065)
  { id: 'basalto_2', x: 181, y: 36, w: 7, h: 5 }, // (C066)
  { id: 'banco_nexo', x: 158, y: 8, w: 5, h: 3 }, // bajo el espigón de Nexo
]);

/**
 * Farallones: peñascos de roca (pincel `acantilado`, rectángulo interior) sobre un banco de arena con espuma. La
 * arena alrededor se pisa; el peñasco no.
 */
export const STACKS = Object.freeze([
  { id: 'farallon_oeste', x: 51, y: 30, w: 8, h: 8 },
  { id: 'farallon_centro', x: 121, y: 13, w: 8, h: 7 },
  { id: 'farallon_sur', x: 58, y: 41, w: 7, h: 7 },
  { id: 'farallon_este', x: 163, y: 35, w: 8, h: 8 },
  { id: 'farallon_norte', x: 176, y: 12, w: 7, h: 7 },
]);

/** Rocas grandes de basalto sobre los bancos del este (roca_grande 2×2). */
export const BASALT = Object.freeze([[133, 13], [136, 14], [182, 36], [185, 37], [159, 8]]);

/** Escollos (rocas sueltas en el agua): sectores oeste, centro y este. */
export const ROCKS = Object.freeze([
  // oeste: frente a Caleta y la barrera del arrecife (suroeste)
  [14, 3], [21, 8], [33, 11], [2, 24], [5, 27], [9, 30], [3, 33], [12, 34], [7, 38], [15, 41], [4, 44], [10, 46],
  // (ninguna roca junto a arena: al saltar al agua desde tierra se podría caer encima y quedar atrapado)
  [38, 16], [52, 12], [61, 29], [50, 40], [36, 44],
  // centro: los escollos camino de Talasa (dos barreras con paso)
  [62, 6], [64, 18], [66, 20], [68, 20], [70, 19], [72, 21], [74, 23], [63, 26], [65, 28], [69, 28], [71, 26],
  [80, 17], [82, 24], [96, 19], [98, 21], [100, 22], [102, 20], [104, 18], [106, 23], [108, 26], [110, 24],
  [112, 16], [116, 12], [120, 22], [124, 30], [60, 40], [66, 44], [122, 44], [127, 8],
  // este: alrededor de las islas de basalto y el volcán
  [130, 22], [140, 20], [142, 25], [146, 12], [150, 30], [154, 26], [166, 34], [172, 24], [176, 30], [186, 20],
  [188, 28], [178, 44], [138, 42], [184, 46],
]);

/** Células del mar (§2.3): C057–C058 centro, C061–C062 oeste, C065–C066 este. */
export const CELLS = Object.freeze({
  c057: { key: 'cell_mar_sur_1', x: 67, y: 23 }, // dentro del anillo de escollos (se entra por el hueco sur)
  c058: { key: 'cell_mar_sur_2', x: 105, y: 20 }, // en la segunda barrera, junto al hueco
  c061: { key: 'cell_mar_sur_3', x: 18, y: 4 }, // frente al muelle de buzos de Caleta
  c062: { key: 'cell_mar_sur_4', x: 6, y: 16 }, // en el banco de arena frente a Caleta
  c065: { key: 'cell_mar_sur_5', x: 135, y: 16 }, // isla de basalto del oeste
  c066: { key: 'cell_mar_sur_6', x: 184, y: 39 }, // isla de basalto del este
});

/** Boyas-farolillo de Caleta Sonda hacia el Islote Lumbre (se encienden de noche). */
export const BUOYS = Object.freeze([[20, 12], [24, 18], [28, 24], [31, 30], [33, 36], [33, 42]]);

/** Veleros fondeados (stamp velero / velero_2, esquina sup.-izq.). */
export const BOATS = Object.freeze([['velero', 40, 4], ['velero_2', 150, 3], ['velero', 110, 6]]);

/**
 * Remolinos de Buceo al Fondo del Mar del Sur (B14, `fondo_mar_sur`, mismas coordenadas: world/zygarde/dive.js). Son
 * los puntos donde B14 pone sus haces de luz de subida; solo existen si el fondo está registrado.
 */
export const WHIRLPOOLS = Object.freeze([[20, 8], [52, 20], [76, 30], [110, 12], [138, 36], [150, 10]]);

/** Aviso del Arrecife del Eco (B14): boya con cartel en la barrera del suroeste. */
export const REEF_SIGN = Object.freeze({ x: 8, y: 36 });

export const TRAINERS = Object.freeze([
  { id: 'nadadora_ines', trainer: 'b13_nadadora_ines', name: 'Nadadora Inés', sprite: 'anil:nadadora', x: 15, y: 24, dir: 6, sight: 4 },
  { id: 'nadador_hugo', trainer: 'b13_nadador_hugo', name: 'Nadador Hugo', sprite: 'anil:nadador', x: 76, y: 14, dir: 4, sight: 4 },
  { id: 'pescador_ruben', trainer: 'b13_pescador_ruben', name: 'Pescador Rubén', sprite: 'anil:pescador', x: 90, y: 10, dir: 2, sight: 3 },
  { id: 'nadadora_paula', trainer: 'b13_nadadora_paula', name: 'Nadadora Paula', sprite: 'anil:nadadora', x: 100, y: 38, dir: 8, sight: 4 },
  // Su acercamiento queda en la fila 15; la fila 16 conserva libre C065 tras combatir.
  { id: 'marinero_ezequiel', trainer: 'b13_marinero_ezequiel', name: 'Marinero Ezequiel', sprite: 'anil:marinero', x: 135, y: 15, dir: 4, sight: 3 },
  { id: 'nadador_ivan', trainer: 'b13_nadador_ivan', name: 'Nadador Iván', sprite: 'anil:nadador', x: 160, y: 22, dir: 2, sight: 4 },
]);

export const ITEMS = Object.freeze([
  { id: 'objeto_mar_1', x: 8, y: 15, item: 'MYSTICWATER' },
  { id: 'objeto_mar_2', x: 47, y: 23, item: 'DIVEBALL' },
  { id: 'objeto_mar_3', x: 92, y: 12, item: 'BIGPEARL', hidden: true },
  { id: 'objeto_mar_4', x: 121, y: 38, item: 'ULTRABALL' },
  { id: 'objeto_mar_5', x: 187, y: 38, item: 'HEARTSCALE', hidden: true },
  { id: 'objeto_mar_6', x: 161, y: 9, item: 'PEARL' },
  { id: 'objeto_mar_7', x: 69, y: 21, item: 'HYPERPOTION' },
]);

/** Aves y Pokémon que descansan en los bancos (decorado). */
export const BIRDS = Object.freeze([[5, 15], [46, 24], [134, 17], [184, 40], [120, 37]]);

/** Aparición por defecto: en el banco de arena frente a Caleta (tierra: sin Nadar no se aparece en el agua). */
export const START = Object.freeze({ x: 4, y: 16, dir: 6 });

/** Mapa del cuadrado de caracteres (para tests y README). */
export function terrainGrid() {
  const g = Array.from({ length: H }, () => Array(W).fill('w'));
  for (const s of [...SANDBARS, ...STACKS]) for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) g[y][x] = 's';
  for (const s of STACKS) for (let y = s.y + 1; y < s.y + s.h - 2; y++) for (let x = s.x + 2; x < s.x + s.w - 2; x++) g[y][x] = 'c';
  for (const [x, y] of ROCKS) if (g[y]?.[x] === 'w') g[y][x] = 'r';
  return g;
}
