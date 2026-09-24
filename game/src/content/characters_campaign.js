// Entradas del registro de personajes para la campaña (CAMPANA §2.7–2.8, §3, §5, §6). PROVISIONALES
// (D30): se generan con `node tools/pixel_build.mjs` (fuentes en tools/pixel_chars/). Ver docs/arte.md §7–8.
// characters.js las incorpora a CHARACTERS; este módulo solo describe las hojas.

/**
 * Corrección horizontal (px de pantalla, por dirección 4/6) de la montura 10 %: en las filas laterales la pareja
 * Zygarde+jinete no está centrada en su frame de 96 px (caja opaca desplazada 11–12 px hacia la cola), así que
 * se veía ~5 píxeles de arte a un lado de la casilla. world/zygarde/mount.js la aplica como xOffset del jugador.
 * Valores pares: el arte sigue alineado con la rejilla de 2 px.
 */
const RIDE10_ANCHOR_X = Object.freeze({
  protagonista_m: Object.freeze({ 4: -10, 6: 10 }),
  protagonista_f: Object.freeze({ 4: -12, 6: 12 }),
});

/** Hojas de monturas y acciones de Zygarde de un protagonista (`p` = 'protagonista_m' | 'protagonista_f'). */
function fieldSheets(p, label, { charset, effect }) {
  const big = { frameW: 96, frameH: 96 };
  return {
    [`${p}_ride10`]: charset(`${p}_ride10.png`, {
      ...big, variantOf: p, name: `${label} — montado en Zygarde 10%`, anchorX: RIDE10_ANCHOR_X[p],
      note: 'Correr (CAMPANA §2.7). Base: seguidor ZYGARDE_1 de Añil con el jinete encima; 4 direcciones × 4 patrones, frames 96×96 anclados abajo-centro (anchorX corrige las filas laterales).',
    }),
    [`${p}_ride50`]: charset(`${p}_ride50.png`, {
      ...big, variantOf: p, name: `${label} — nadando sobre Zygarde 50%`,
      note: 'Nadar (CAMPANA §2.7). Base: seguidor ZYGARDE de Añil; el cuerpo queda bajo la línea de agua con espuma animada. Frames 96×96.',
    }),
    [`${p}_dive`]: charset(`${p}_dive.png`, {
      ...big, variantOf: p, name: `${label} — buceo en la burbuja verde`,
      note: 'Buceo (CAMPANA §2.8): campo verde del 50% alrededor del jugador, sin relleno (se ve el fondo) y con destellos hexagonales que giran. Frames 96×96.',
    }),
    [`${p}_climb`]: charset(`${p}_climb.png`, {
      variantOf: p, name: `${label} — trepar`,
      note: 'Trepar: de espaldas, agarrado a la pared; 4 frames (mano izquierda arriba, subir, mano derecha arriba, subir). Las 4 filas son iguales.',
    }),
    [`${p}_fish_offset`]: charset(`${p}_fish_offset.png`, {
      ...big, variantOf: p, offsetY: 16, name: `${label} — pescar`,
      note: 'Pesca en 4 direcciones: 0 caña atrás, 1 en alto, 2 lanzada, 3 lanzada con sedal. El id lleva "_offset": el motor la dibuja 16 px más abajo (como Essentials).',
    }),
    [`${p}_vuelo`]: effect(`${p}_vuelo.png`, {
      ...big, cols: 8, rows: 1, variantOf: p, name: `${label} — Vuelo (disgregación en hexágonos)`,
      note: 'Tira de 8 frames: 0 aura, 1 red hexagonal, 2–6 se deshace de los pies a la cabeza en hexágonos que suben, 7 últimas chispas. Al revés = llegada (CAMPANA §1.7).',
    }),
  };
}

/** Variantes de campo de un protagonista (ids de las hojas anteriores). */
export function fieldVariants(p) {
  return {
    ride10: `${p}_ride10`, ride50: `${p}_ride50`, dive: `${p}_dive`, climb: `${p}_climb`,
    fish: `${p}_fish_offset`, vuelo: `${p}_vuelo`,
  };
}

/** Todas las entradas de la campaña. `f` = fábricas { charset, battleFront, effect } de characters.js. */
export function campaignEntries(f) {
  const { charset, battleFront, effect } = f;
  const withFront = (id, name, note, frontNote, extra = {}) => ({
    [id]: charset(`${id}.png`, { name, note, battle: { front: `${id}_front` }, ...extra }),
    [`${id}_front`]: battleFront(`${id}_front.png`, { name: `${name} — combate, frontal`, note: frontNote }),
  });
  return {
    ...fieldSheets('protagonista_m', 'Protagonista (masculino)', f),
    ...fieldSheets('protagonista_f', 'Protagonista (femenina)', f),
    zygarde_hex: effect('zygarde_hex.png', {
      frameW: 32, frameH: 32, cols: 4, rows: 2, name: 'Zygarde — partículas hexagonales',
      note: 'Fila 0: celda hexagonal de la red (brillante, media, tenue, chispa). Fila 1: partícula que se apaga (grande, media, chispa, chispa pequeña).',
    }),
    // Guardianes (X06) y Sol Galena.
    ...withFront('leandro', 'Leandro Alcántara, Maestre de Esclusas',
      'Guardián de la Corriente (38, orgullo): levita azul río con botones de latón, camisa blanca y botas de agua; tupé oscuro y barba de pocos días.',
      'Mano en la cadera y la gran llave de esclusa al hombro, barbilla alta (orgullo).'),
    ...withFront('abril', 'Abril Céspedes',
      'Guardiana del Impulso (19, tedio): rubio ceniza revuelto por el viento, cortavientos mostaza con capucha gris, auriculares cian, pantalón corto y mallas.',
      'Manos en los bolsillos y párpados a media asta: aburrida, no hostil.'),
    ...withFront('fermin', 'Fermín Galena',
      'Guardián de la Masa (51, carga familiar): casco de minero ocre con lámpara, barba canosa, chaqueta gris plomo con banda reflectante.',
      'Pico al hombro, cejas caídas (cansancio) y barba canosa.'),
    ...withFront('olvido', 'Olvido Arrieta',
      'Guardiana de la Memoria (78, fascinación): moño bajo cano con un lápiz, gafas redondas, rebeca sepia y falda larga granate.',
      'Sostiene su libreta abierta y sonríe con curiosidad.'),
    ...withFront('sol', 'Sol Galena',
      'Hija de Fermín (TABLILLAS T05): casco blanco con lámpara, trenza, chaqueta teja con banda amarilla.',
      'Manos en la cadera; trenza al hombro.'),
    // Genesis (CAMPANA §5): petróleo, blanco clínico, carbón y magenta; nunca el verde de Zygarde.
    ...withFront('vertice', 'Dr. Aurelio Vértice',
      'Líder Supremo de Genesis (63, D14) en su papel de mecenas: traje carbón con alfiler magenta, pelo plateado hacia atrás, barba blanca corta y gafas redondas con tinte violeta.',
      'Como Líder Supremo (Talasa, P9): bata blanca y capa corta carbón, manos a la espalda.'),
    vertice_lider: charset('vertice_lider.png', {
      name: 'Dr. Aurelio Vértice (Líder Supremo)', battle: { front: 'vertice_front' },
      note: 'Aparición como líder (CAMPANA §5.1): bata blanca y capa corta carbón sobre los hombros.',
    }),
    ...withFront('casia', 'Dra. Casia Varela',
      'Directora de Investigación de Genesis (41): melena lisa con raya, bata larga con solapas carbón y ribete magenta.',
      'Tableta con el brillo magenta contra el pecho; emblema en la bata.'),
    ...withFront('garrido', 'Ulises Garrido',
      'Director de Operaciones de Genesis (47), excapataz: pelo gris al rape, barba de días, bata de director sobre ropa carbón.',
      'Casco de obra bajo el brazo (pasado de capataz); pragmático, nada cruel.'),
    ...withFront('genesis_tecnico', 'Técnico de Genesis',
      'Técnico de campo (Consorcio Meridiano): gorra y mono petróleo con visor magenta, peto blanco clínico con el emblema de los tubos cruzados, guantes y botas carbón, maletín.',
      'Maletín de instrumentos; emblema en la gorra y el peto.'),
    ...withFront('genesis_tecnica', 'Técnica de Genesis',
      'Técnica de campo: como el técnico, con coleta.',
      'Maletín de instrumentos; coleta por detrás.'),
    genesis_investigador: charset('genesis_investigador.png', {
      name: 'Investigador de Genesis',
      note: 'Bata corta blanca con el emblema sobre ropa petróleo y gafas-visor magenta.',
    }),
    genesis_investigadora: charset('genesis_investigadora.png', {
      name: 'Investigadora de Genesis',
      note: 'Bata corta blanca con el emblema, coleta baja y gafas-visor magenta.',
    }),
    // Servicios y oficios.
    enfermera: charset('enfermera.png', {
      name: 'Enfermera del Centro Pokémon',
      note: 'Diseño propio de Axis: cofia blanca con banda rosa, moño castaño, uniforme rosa pálido y delantal blanco.',
    }),
    dependiente: charset('dependiente.png', {
      name: 'Dependiente de tienda',
      note: 'Camisa celeste, delantal azul marino y pantalón caqui.',
    }),
    molinero: charset('molinero.png', {
      name: 'Molinero',
      note: 'Boina, pelo y bigote blancos, chaleco marrón y delantal enharinado (Anselmo, T02).',
    }),
    buzo: charset('buzo.png', {
      name: 'Buzo',
      note: 'Neopreno con franja cian y gafas de buceo en la frente (Fausto y los buzos de Caleta Sonda).',
    }),
    archivista: charset('archivista.png', {
      name: 'Archivista',
      note: 'Gafas redondas, chaleco sepia y camisa blanca (Archivo Hondo, museo).',
    }),
  };
}

/**
 * Alias de personajes con nombre → hoja que los representa (propia o de Añil). getCharacter y
 * getBattleSprite los resuelven. Los que apuntan a 'anil:…' son provisionales hasta tener arte propio.
 */
export const CHARACTER_ALIASES = Object.freeze({
  // Nombres fijados en CAMPANA/X07 para arte ya existente.
  casilda: 'guardiana', casilda_front: 'guardiana_front',
  alerce: 'profesor', alerce_front: 'profesor_front',
  olmedo: 'policia', lia: 'ayudante',
  // Personajes secundarios con nombre (CAMPANA §3 y TABLILLAS).
  anselmo: 'molinero', fausto: 'buzo', nilo: 'genesis_tecnico', iker: 'nino', sixto: 'anciano',
  ramon: 'anil:capitan', remedios: 'anil:anciana1', rosalia: 'anil:empresariaa', rosendo: 'anil:anciano2',
  evaristo: 'anil:anciano1', quino: 'anil:operario', bea: 'anil:minera', dario: 'anil:empresario',
});
