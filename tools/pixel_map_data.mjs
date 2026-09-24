// Datos de la ilustración del mapa regional de Axis (CAMPANA §1.1–1.2, X02 DECIDIDO-DEV).
// Coordenadas en el espacio final 480×320 (casillas de 16 px, como ui/logic/regionMapData.js).
// Cada lugar se coloca en el CENTRO de una casilla: xy = [16·cx + 8, 16·cy + 8].
// PROVISIONAL (D30): la forma exacta de la costa y del relieve es una propuesta.

export const MAP_W = 480;
export const MAP_H = 320;
export const CELL = 16;

/**
 * Lugares: id → [cx, cy, nombre, tipo, extra]. Tipos: town (pueblo), city (ciudad), route (ruta),
 * pillar (Pilar/mazmorra de Pilar), place (zona o lugar de trama), sea (mar), post (postgame).
 * `parent`: el lugar está dentro de otro (misma casilla que su población).
 */
export const PLACES = {
  // Poblaciones.
  villa_alba: [10, 8, 'Villa Alba', 'town', { mapIds: ['villa_alba', 'casa_prota_1f', 'casa_prota_2f', 'casa_gael', 'casa_vecinos_n', 'casa_vecinos_se', 'laboratorio_alerce'] }],
  villa_zaguan: [10, 10, 'Villa Zaguán', 'town', { mapIds: ['villa_zaguan', 'zaguan_centro', 'casa_dintel'] }],
  ciudad_caudal: [11, 12, 'Ciudad Caudal', 'city', { mapIds: ['ciudad_caudal'] }],
  villa_brontia: [19, 12, 'Villa Brontia', 'town', { mapIds: ['villa_brontia'] }],
  ciudad_estrato: [22, 16, 'Ciudad Estrato', 'city', { mapIds: ['ciudad_estrato', 'mina_galena'] }],
  ciudad_lumina: [4, 14, 'Ciudad Lúmina', 'city', { mapIds: ['ciudad_lumina'] }],
  aldea_mnemos: [2, 10, 'Aldea Mnemos', 'town', { mapIds: ['aldea_mnemos'] }],
  ciudad_nexo: [5, 17, 'Ciudad Nexo', 'city', { mapIds: ['ciudad_nexo'] }],
  caleta_sonda: [1, 18, 'Caleta Sonda', 'town', { mapIds: ['caleta_sonda'] }],
  villa_boreal: [25, 5, 'Villa Boreal', 'town', { mapIds: ['villa_boreal'] }],
  mesa_vientos: [27, 8, 'Mesa de los Vientos', 'town', { mapIds: ['mesa_vientos'], flyOnly: true }],
  bastion_axis: [26, 18, 'Bastión Axis', 'post', { mapIds: ['bastion_axis'] }],
  // Rutas (el punto marca su tramo central; la línea se dibuja entre lugares).
  ruta_1: [10, 9, 'Ruta 1', 'route', { mapIds: ['ruta_1'] }],
  ruta_2: [10, 11, 'Ruta 2', 'route', { mapIds: ['ruta_2'] }],
  ruta_3: [8, 12, 'Ruta 3', 'route', { mapIds: ['ruta_3'] }],
  ruta_4: [15, 12, 'Ruta 4', 'route', { mapIds: ['ruta_4'] }],
  ruta_5: [22, 11, 'Ruta 5', 'route', { mapIds: ['ruta_5'] }],
  ruta_6: [19, 14, 'Ruta 6', 'route', { mapIds: ['ruta_6'] }],
  ruta_7: [9, 16, 'Ruta 7', 'route', { mapIds: ['ruta_7'] }],
  ruta_8_marisma: [3, 12, 'Ruta 8 · Marisma Turbia', 'route', { mapIds: ['ruta_8_marisma'] }],
  ruta_9_neblino: [3, 7, 'Ruta 9 · Bosque Neblino', 'route', { mapIds: ['ruta_9_neblino'] }],
  ruta_10: [7, 6, 'Ruta 10', 'route', { mapIds: ['ruta_10'] }],
  ruta_11: [20, 10, 'Ruta 11', 'route', { mapIds: ['ruta_11'] }],
  ruta_12_senda_lazo: [17, 4, 'Ruta 12 · Senda del Lazo', 'route', { mapIds: ['ruta_12_senda_lazo'] }],
  ruta_13: [23, 6, 'Ruta 13', 'route', { mapIds: ['ruta_13'] }],
  ruta_14_reserva: [5, 16, 'Ruta 14 · Reserva del Delta', 'route', { mapIds: ['ruta_14_reserva'] }],
  ruta_15: [3, 17, 'Ruta 15 · Sendero de los Acantilados', 'route', { mapIds: ['ruta_15'] }],
  // Pilares (el P5 está dentro de Aldea Mnemos; P9 y P10 comparten la Sima).
  ruinas_dintel: [9, 10, 'Ruinas del Dintel (Pilar del Umbral)', 'pillar', { pillar: 1, mapIds: ['explanada_umbral', 'ruinas_dintel'] }],
  garganta_albo: [7, 11, 'Garganta del Albo (Pilar de la Corriente)', 'pillar', { pillar: 2, mapIds: ['garganta_albo', 'pilar_corriente'] }],
  meseta_impulso: [26, 10, 'Meseta del Impulso (Pilar del Impulso)', 'pillar', { pillar: 3, mapIds: ['meseta_impulso', 'parque_eolico', 'anillo_vientos', 'galerias_soplo'] }],
  cerro_plomo: [27, 15, 'Cerro Plomo (Pilar de la Masa)', 'pillar', { pillar: 4, mapIds: ['cerro_plomo', 'camara_contrapesos'] }],
  archivo_hondo: [2, 10, 'Archivo Hondo (Pilar de la Memoria)', 'pillar', { pillar: 5, parent: 'aldea_mnemos', mapIds: ['archivo_hondo'] }],
  aljibe_portal: [4, 2, 'Aljibe del Portal (Pilar Invertido)', 'pillar', { pillar: 6, mapIds: ['pilar_invertido'] }],
  arrecife_eco: [2, 19, 'Arrecife del Eco (Pilar de los Ecos)', 'pillar', { pillar: 7, mapIds: ['arrecife_eco', 'fondo_mar_sur', 'fosa_eco'] }],
  lagos_alma: [25, 2, 'Lagos del Alma (Pilar del Alma)', 'pillar', { pillar: 8, mapIds: ['lagos_alma', 'santuario_alma'] }],
  sima_eje: [13, 14, 'Sima del Eje (Pilares de la Convergencia y del Origen)', 'pillar', { pillar: 9, pillars: [9, 10], mapIds: ['sima_eje', 'puente_convergencia', 'camara_cruce', 'puerta_quince', 'senda_origen', 'cielo_interior', 'nucleo_origen'] }],
  // Zonas y lugares de trama.
  laberinto_profundidad: [10, 7, 'Laberinto de la Profundidad', 'place', { mapIds: ['laberinto_profundidad'] }],
  cerro_del_alba: [12, 7, 'Cerro del Alba', 'place', { mapIds: ['cerro_del_alba'] }],
  montana_portal: [5, 4, 'Monte del Portal', 'place', { mapIds: ['montana_portal', 'campamento_monte'] }],
  cumbre_azur: [15, 2, 'Cumbre Azur · Columna Lanza', 'place', { mapIds: ['columna_lanza'] }],
  paso_del_norte: [21, 7, 'Paso del Norte', 'place', { mapIds: ['paso_del_norte'] }],
  gruta_escarcha: [28, 5, 'Gruta Escarcha', 'place', { mapIds: ['gruta_escarcha'] }],
  mar_boreal: [21, 2, 'Mar Boreal', 'sea', { mapIds: ['mar_boreal'] }],
  instalacion_cierzo: [27, 1, 'Instalación Cierzo', 'post', { mapIds: ['instalacion_cierzo'] }],
  canteria_solano: [20, 15, 'Cantería Solano', 'place', { mapIds: ['canteria_solano'] }],
  dunas_ceniza: [25, 16, 'Dunas de Ceniza', 'place', { mapIds: ['dunas_ceniza'] }],
  senda_mirador: [12, 13, 'Senda del Mirador', 'place', { mapIds: ['senda_mirador'] }],
  mirador_sur: [13, 15, 'Mirador Sur', 'place', { mapIds: ['mirador_sur'] }],
  calzada_rey: [16, 14, 'Calzada del Rey', 'place', { mapIds: ['calzada_rey'] }],
  mar_del_sur: [16, 18, 'Mar del Sur', 'sea', { mapIds: ['mar_del_sur'] }],
  islote_lumbre: [8, 19, 'Islote Lumbre', 'place', { mapIds: ['islote_lumbre'] }],
  estacion_talasa: [14, 19, 'Estación Talasa', 'place', { mapIds: ['estacion_talasa'] }],
  volcan_tizon: [20, 18, 'Volcán Tizón', 'place', { mapIds: ['volcan_tizon'] }],
};

/** Centro en píxeles (480×320) de una casilla. */
export const cellCenter = (cx, cy) => [cx * CELL + CELL / 2, cy * CELL + CELL / 2];

/** Caminos terrestres (líneas de ruta del mapa). Cada par se une con un codo horizontal→vertical. */
export const PATHS = [
  ['villa_alba', 'laberinto_profundidad'], ['villa_alba', 'ruta_1'], ['ruta_1', 'villa_zaguan'],
  ['ruta_1', 'cerro_del_alba'], ['ruta_1', 'ruta_10'], ['ruta_10', 'montana_portal'], ['ruta_10', 'ruta_9_neblino'],
  ['villa_zaguan', 'ruinas_dintel'], ['villa_zaguan', 'ruta_2'], ['ruta_2', 'ciudad_caudal'],
  ['ciudad_caudal', 'ruta_3'], ['ruta_3', 'garganta_albo'], ['ciudad_caudal', 'ruta_4'], ['ruta_4', 'villa_brontia'],
  ['villa_brontia', 'ruta_5'], ['ruta_5', 'meseta_impulso'], ['villa_brontia', 'ruta_11'], ['ruta_11', 'paso_del_norte'],
  ['paso_del_norte', 'ruta_12_senda_lazo'], ['ruta_12_senda_lazo', 'cumbre_azur'], ['paso_del_norte', 'ruta_13'],
  ['ruta_13', 'villa_boreal'], ['villa_boreal', 'lagos_alma'], ['villa_boreal', 'gruta_escarcha'],
  ['villa_brontia', 'ruta_6'], ['ruta_6', 'canteria_solano'], ['canteria_solano', 'ciudad_estrato'],
  ['ciudad_estrato', 'dunas_ceniza'], ['dunas_ceniza', 'cerro_plomo'], ['ciudad_estrato', 'ruta_7'],
  ['ruta_7', 'ciudad_lumina'], ['mirador_sur', 'ruta_7'], ['mirador_sur', 'sima_eje'], ['sima_eje', 'senda_mirador'],
  ['senda_mirador', 'ciudad_caudal'], ['sima_eje', 'calzada_rey'], ['calzada_rey', 'ruta_6'],
  ['ciudad_lumina', 'ruta_8_marisma'], ['ruta_8_marisma', 'aldea_mnemos'], ['aldea_mnemos', 'ruta_9_neblino'],
  ['ciudad_lumina', 'ruta_14_reserva'], ['ruta_14_reserva', 'ciudad_nexo'], ['ciudad_nexo', 'ruta_15'],
  ['ruta_15', 'caleta_sonda'], ['montana_portal', 'aljibe_portal'],
];

/** Travesías por mar (línea de puntos). */
export const SEA_PATHS = [
  ['caleta_sonda', 'arrecife_eco'], ['ciudad_nexo', 'islote_lumbre'], ['islote_lumbre', 'estacion_talasa'],
  ['estacion_talasa', 'volcan_tizon'], ['volcan_tizon', 'bastion_axis'], ['villa_boreal', 'mar_boreal'],
  ['mar_boreal', 'instalacion_cierzo'],
];

// ───────────────────────── Geografía (espacio 480×320) ─────────────────────────

/** Contorno del continente (sentido horario). La costa se irregulariza con ruido. */
export const MAINLAND = [
  [10, 30], [60, 18], [120, 22], [180, 16], [230, 14], [262, 18], [300, 20], [322, 24],
  // Fiordo del Mar Boreal (entra desde el norte hasta el Paso del Norte).
  [326, 12], [332, 60], [340, 98], [352, 108], [370, 100], [388, 86], [386, 56], [380, 12],
  [410, 10], [450, 12], [472, 22], [474, 60], [466, 100], [476, 140], [470, 180], [474, 220], [466, 250],
  [470, 272], [440, 280], [400, 276], [360, 282], [320, 276], [280, 280], [240, 276], [200, 284], [160, 278],
  [122, 282], [104, 290], [84, 290], [60, 296], [40, 302], [24, 308], [10, 304], [8, 270], [12, 230], [6, 190],
  [10, 150], [6, 110], [10, 70],
];

/** Islas: [cx, cy, rx, ry]. */
export const ISLANDS = [
  [136, 310, 9, 6], // Islote Lumbre
  [328, 298, 15, 11], // Volcán Tizón
  [424, 294, 16, 9], // Bastión Axis (fortaleza costera)
  [38, 316, 7, 3], // bajío del Arrecife del Eco
];

/** Cordilleras: polilínea de cresta, anchura y altura (se modulan con ruido de crestas). */
export const RANGES = [
  { pts: [[20, 44], [72, 52], [120, 36], [170, 30], [214, 36], [248, 44], [292, 38], [318, 60]], width: 40, h: 0.72 },
  { pts: [[392, 28], [440, 36], [462, 70], [458, 98]], width: 30, h: 0.62 }, // tierras altas de los Lagos
  { pts: [[296, 96], [318, 128], [328, 150]], width: 22, h: 0.46 }, // vertiente nevada de la Ruta 11
  { pts: [[392, 104], [404, 132]], width: 20, h: 0.44 }, // Ruta 13
  { pts: [[98, 164], [120, 180], [142, 196]], width: 16, h: 0.46 }, // Garganta del Albo
];

/** Cimas destacadas [cx, cy, radio, altura, agudeza]. */
export const PEAKS = [
  [72, 50, 30, 0.7, 1.2], // Monte del Portal
  [248, 44, 28, 0.9, 1.4], // Cumbre Azur (la más alta)
  [456, 90, 16, 0.3, 1.2], // Gruta Escarcha
  [200, 118, 12, 0.36, 1], // Cerro del Alba
  [440, 246, 12, 0.46, 1.3], // Cerro Plomo
];

/** Mesetas de cima plana [cx, cy, rx, ry, altura]. */
export const PLATEAUS = [
  [424, 168, 38, 24, 0.55], // Meseta del Impulso
  [440, 136, 11, 8, 0.66], // Mesa de los Vientos
];

/** Río Albo: de la gran cascada del Monte del Portal a la Sima; reaparece y forma el Delta junto a Nexo. */
export const RIVERS = [
  [[94, 70], [98, 90], [108, 108], [114, 132], [118, 158], [122, 178], [132, 192], [156, 202], [184, 206], [204, 218], [214, 230]],
  [[204, 262], [176, 268], [146, 266], [120, 272], [104, 284]],
  [[120, 272], [110, 276], [96, 288]],
  [[410, 58], [404, 76], [400, 92]], // arroyo de los Lagos del Alma
  [[280, 60], [272, 90], [262, 120], [248, 150], [236, 180], [226, 206]], // arroyo de la Cumbre al Albo
];

/** Lagos: [cx, cy, rx, ry]. */
export const LAKES = [
  [398, 38, 5, 3], [414, 44, 6, 3], [406, 54, 5, 3], // Lagos del Alma (Saber, Sentir, Querer)
  [82, 262, 6, 4], // laguna de la Reserva
  [48, 204, 5, 3], [62, 212, 4, 2], // charcas de la Marisma Turbia
];

/** Biomas (elipses con borde irregular): [nombre, cx, cy, rx, ry]. Gana el primero que coincide. */
export const BIOMES = [
  ['sima', 216, 234, 22, 11],
  ['desert', 420, 258, 44, 20],
  ['canyon', 350, 246, 36, 26],
  ['meseta', 424, 168, 38, 24],
  ['meseta', 440, 136, 12, 9], // Mesa de los Vientos (roca, sin nieve)
  ['marsh', 56, 206, 26, 18],
  ['lilac', 56, 118, 30, 22],
  ['bamboo', 38, 166, 20, 14],
  ['tropical', 90, 264, 30, 14],
  ['forest', 160, 128, 42, 28],
  ['forest', 118, 98, 26, 16],
];

/**
 * Frío (0 = templado, 1 = nieve incluso en llano): norte de la región y vertientes de Ruta 11/13,
 * Paso del Norte, Villa Boreal y los Lagos. La Meseta y la Mesa de los Vientos quedan fuera.
 */
export function coldAt(x, y) {
  const north = (60 - y) / 80; // cordillera norte (solo las cumbres)
  // Norte helado: Paso del Norte, Rutas 11 (tramo alto) y 13, Villa Boreal, Lagos del Alma.
  const boreal = x > 290 && y < 185 ? Math.min(1, (185 - y) / 50) * Math.min(1, (x - 290) / 25) : 0;
  return Math.max(0, Math.min(1, Math.max(north, boreal)));
}
