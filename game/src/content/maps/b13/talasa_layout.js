// Coordenadas de la Estación Talasa (docs/CAMPANA.md §1.4 y B13: plataforma de investigación de Genesis, 40×40,
// tileset 5 + interiores en 4). Cuelga del borde sur del Mar del Sur (x 76–115 del mar = x 0–39 de aquí). Módulo puro.
//
// Plataforma de hormigón sobre pilotes, con barandilla blanca en todo el perímetro, en cuatro cubiertas alrededor de la
// dársena central (el pozo de agua por el que bajan los buzos de Genesis):
//   N  muelle de carga (y 10–16): se llega nadando por el pantalán del norte (único hueco de la barandilla)
//   O  cubierta oeste (x 3–14): control con un técnico en el paso, invernadero de Solosis (cúpula) y escalerilla a la
//      dársena; la compuerta de seguridad hacia la cubierta sur se abre desde la consola del invernadero
//   S  cubierta sur (x 15–24) y E cubierta este (x 25–34): torre de dirección (despacho: foto y tarjeta) y el
//      laboratorio del tanque (puerta sellada hasta tener la tarjeta)
// La cubierta N no da a la E (barandilla) ni a la O salvo por el paso del control.
export const W = 40;
export const H = 40;

/** Borde norte: conexión simétrica con el Mar del Sur (su x 76 cae en nuestra x 0). */
export const SEA_LINK = Object.freeze({ to: 'mar_del_sur', offset: -76 });

export const DECKS = Object.freeze({
  north: { x: 3, y: 10, w: 32, h: 7 },
  west: { x: 3, y: 17, w: 12, h: 19 },
  south: { x: 15, y: 30, w: 10, h: 6 },
  east: { x: 25, y: 17, w: 10, h: 19 },
});

/** Dársena central (agua cercada por las cubiertas). */
export const POOL = Object.freeze({ x: 15, y: 17, w: 10, h: 13 });

/** Pantalán de llegada (muelle_tablas 3×7; se pisa la columna central) y amarre de la barca de Alerce. */
export const JETTY = Object.freeze({ x: 18, y: 3, w: 3, h: 7 });
export const BOAT = Object.freeze({ x: 22, y: 6, from: { x: 38, y: 6 } });
export const ARRIVAL = Object.freeze({ trigger: [[18, 10], [19, 10], [20, 10]], alerce: { x: 21, y: 12 }, nilo: { x: 22, y: 6 } });

/**
 * Huecos de la barandilla perimetral: la cabeza del pantalán (y 10) y la escalerilla de la dársena (14,18).
 * Barandillas interiores: N↔O salvo el paso del control (x 4–7) y N↔E entera.
 */
export const OPENINGS = Object.freeze([[18, 10], [19, 10], [20, 10], [14, 18]]);
export const INNER_RAILS = Object.freeze([[8, 16, 14, 16], [25, 16, 34, 16]]);
// El técnico del control vigila el pasillo (y 15) desde el aparcamiento: quien va al paso del oeste pasa por delante.
export const GATE = Object.freeze({ x0: 4, x1: 7, y: 16, guard: { x: 8, y: 14, dir: 2 } });
export const LADDER = Object.freeze({ x: 14, y: 18 });

/** Compuerta de seguridad entre las cubiertas O y S (se abre desde la consola del invernadero). */
export const SHUTTER = Object.freeze({ x: 15, y0: 31, y1: 34 });

/** Edificios (stamp, esquina y puerta: la casilla de la entrada en la fachada). */
export const BUILDINGS = Object.freeze({
  greenhouse: { stamp: 'estacion_cupula', x: 6, y: 20, door: { x: 9, y: 26 }, to: 'talasa_invernadero' },
  lab: { stamp: 'pabellon_azul', x: 26, y: 18, door: { x: 30, y: 23 }, to: 'talasa_laboratorio' },
  tower: { stamp: 'bloque_morado', x: 30, y: 25, door: { x: 32, y: 32 }, to: 'talasa_despacho' },
});

/** Entradas en los interiores (felpudo de la salida, mirando hacia dentro). */
export const INTERIOR_ENTRIES = Object.freeze({
  talasa_invernadero: { x: 9, y: 13 },
  talasa_laboratorio: { x: 12, y: 15 },
  talasa_despacho: { x: 6, y: 9 },
});

/** Remolino de la dársena (Buceo → talasa_pilotes, mismas coordenadas). */
export const DIVE = Object.freeze({ x: 20, y: 23 });

export const TRAINERS = Object.freeze([
  { id: 'tecnico_control', trainer: 'b13_tecnico_control', name: 'Técnico Óscar', female: false, x: GATE.guard.x, y: GATE.guard.y, dir: GATE.guard.dir, sight: 1 },
  { id: 'tecnica_cubierta', trainer: 'b13_tecnica_cubierta', name: 'Técnica Leire', female: true, x: 11, y: 32, dir: 4, sight: 4 },
  { id: 'tecnico_torre', trainer: 'b13_tecnico_torre', name: 'Técnico Rodrigo', female: false, x: 28, y: 34, dir: 4, sight: 4 },
  // Desde el extremo este, su acercamiento queda a la derecha de C059 y deja libre la puerta del laboratorio.
  { id: 'tecnica_laboratorio', trainer: 'b13_tecnica_laboratorio', name: 'Técnica Nerea', female: true, x: 33, y: 24, dir: 4, sight: 3 },
]);

/** Células C059–C060 (cubiertas; C059 en el camino obligatorio: ante la puerta del laboratorio). */
export const CELLS = Object.freeze({
  c059: { key: 'cell_talasa_1', x: 30, y: 24 },
  c060: { key: 'cell_talasa_2', x: 33, y: 34 },
});

export const ITEMS = Object.freeze([
  { id: 'objeto_talasa_1', x: 33, y: 14, item: 'UPGRADE' },
  { id: 'objeto_talasa_2', x: 4, y: 34, item: 'FULLRESTORE' },
  { id: 'objeto_talasa_3', x: 23, y: 34, item: 'METALCOAT', hidden: true },
  { id: 'objeto_talasa_4', x: 12, y: 17, item: 'REVIVE' },
]);

/** Decorado (stamps de Exterior3). Las farolas (1×5) se colocan con la base en la cubierta. */
export const PROPS = Object.freeze([
  ['contenedores', 26, 11], ['contenedores', 30, 11], ['tuberias', 9, 11], ['deposito', 4, 28],
  ['aparcamiento', 4, 11], ['chapa_metal', 21, 13], ['chapa_metal', 17, 32], ['barrera_obras', 16, 12],
  ['aerogenerador', 12, 28], ['boca_incendios', 5, 18], ['farola_hierro', 16, 7], ['farola_hierro', 22, 7],
  ['farola_hierro', 11, 15], ['farola_hierro', 26, 27],
  // Detalles de las cubiertas (sin cerrar pasos: el test de alcance lo comprueba).
  ['maquinas_expendedoras', 26, 24], ['buzon_azul', 29, 27], ['papelera', 13, 17], ['barrera_obras', 17, 34],
]);

/** Cajas y bidones sueltos (bloquean): eventos examinables. */
export const CRATES = Object.freeze([[24, 12], [25, 12], [7, 33], [20, 31], [23, 31]]);

/** Pilotes de la plataforma que asoman en el agua (decorado, eventos sólidos). */
export const PILES = Object.freeze([
  [2, 12], [2, 18], [2, 24], [2, 30], [37, 12], [37, 18], [37, 24], [37, 30], [6, 37], [12, 37], [18, 37],
  [24, 37], [30, 37], [34, 37], [6, 9], [12, 9], [28, 9], [33, 9], [17, 20], [22, 20], [17, 27], [22, 27],
]);

export const START = Object.freeze({ x: 19, y: 12, dir: 2 });
