// Piezas propias del norte (tileset 1, Exterior1) para los mapas del Bloque 15, pasadas en `stamps`/`brushes` de cada
// definición (el MapBuilder les da prioridad sobre la biblioteca). Salen de las composiciones nevadas de Añil (Ruta 25
// Norte, Ciudad Añil, Monte Plateado): las terrazas de nieve son las mismas piezas que la `terraza` de hierba de la
// biblioteca desplazadas 503 filas en la imagen (+4024 en el ID), el bosque apila el pino nevado (2×6) como el
// `bosque_pinos`, la hierba alta nevada es el tile 4925 (tag Grass) y las losas de plaza, barandillas y la casa de
// cúpula azul son las de Ciudad Añil. Módulo puro.
const T = (x, y) => 384 + y * 8 + x;

/** +4024: fila 50 → 553 (anillo) y 54 → 557 (meseta) de la terraza de hierba (content/stamps/ExteriorBosqueCeleste.js). */
const S = (id) => id + 4024;

export const B15_BRUSHES = Object.freeze({
  /** Terraza de muros finos nevados (convexa, ancho ≥ 5): borde norte, laterales y cara sur de 3 filas. */
  terraza_nevada: {
    terrace: {
      rim: { w0: S(824), w1: S(817), mid: S(818), e1: S(819), e0: S(828) },
      side: { w0: [S(840)], w1: [S(825), S(833)], e1: [S(827), S(835)], e0: [S(844)] },
      face: {
        w0: [S(840), S(848), S(856)], w1: [S(841), S(849), S(857)], mid: [S(842), S(850), S(858)],
        e1: [S(843), S(851), S(859)], e0: [S(844), S(852), S(860)],
      },
    },
    layer: 1,
    desc: 'Terraza de nieve con cara de tierra (convexa)',
  },
  /** Pinar nevado denso (pino nevado 2×6 apilado cada 4 filas; copas en capa 2, troncos en capa 1). */
  bosque_nevado: { forest: { trees: [[0, 563]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1, desc: 'Pinar nevado' },
  /** Hierba alta nevada (encuentros; tag Grass) con alguna mata verde sin nieve. */
  hierba_nevada: { tile: 4925, variants: [4933], chance: 0.12, layer: 1, desc: 'Hierba alta nevada' },
  /** Losas grises de plaza (Ciudad Añil): centro en mosaico 2×2 y borde con bordillo. */
  losas_centro: { grid: [[5564, 5565], [5572, 5573]], layer: 1 },
  losas_borde: { nine: 'ids', ids: [[5555, 5556, 5558], [5563, 0, 5566], [5579, 5580, 5582]], fill: 0, layer: 1 },
  /** Barandillas de madera (horizontal / vertical) y de hierro oscuro. */
  baranda: { line: { ids: [T(4, 583), T(5, 583), T(6, 583)] }, layer: 2 },
  baranda_v: { line: { ids: [T(2, 584), T(2, 585), T(2, 586)], axis: 'v' }, layer: 2 },
  baranda_hierro: { line: { ids: [T(4, 641), T(5, 641), T(6, 641)] }, layer: 2 },
  baranda_hierro_v: { line: { ids: [T(2, 642), T(2, 643), T(2, 644)], axis: 'v' }, layer: 2 },
  /** Mar de nubes (panorama de Exterior1, 8×6) para el borde del mirador de la Senda del Lazo. */
  mar_nubes: { pattern: [0, 576, 8, 6], layer: 0 },
  /** Muro invisible (tile vacío que bloquea: el mismo que usa el bosque para los troncos sin copa). Sobre las nubes. */
  muro_invisible: { tile: 503, layer: 2, desc: 'Muro invisible' },
});

export const B15_STAMPS = Object.freeze({
  /** Casa de cúpula azul de Ciudad Añil (5×8 con sombra; puerta en la segunda columna). */
  casa_cupula: { src: [0, 588, 5, 8], layer: 2, door: [1, 5], solid: true, desc: 'Casa de cúpula azul (Observatorio Boreal)' },
  /** Solo la cúpula azul con su marco blanco (5×4): la del Observatorio vista desde su azotea. */
  cupula: { src: [0, 588, 5, 4], layer: 2, solid: true, desc: 'Cúpula azul del Observatorio' },
  /** Cobertizo de tejado azul inclinado, sin puerta (4×7). */
  cobertizo_azul: { src: [0, 597, 4, 7], layer: 2, solid: true, desc: 'Cobertizo de tejado azul' },
  /** Montón de nieve (2×2, pisable). */
  monton_nieve: { src: [0, 572, 2, 2], layer: 1, desc: 'Montón de nieve' },
  /** Tufos de hierba asomando en la nieve (1×1, decorativo). */
  matas_nieve: { src: [3, 571, 1, 1], layer: 1, desc: 'Brotes en la nieve' },
});

/** Opciones comunes para las definiciones de mapa de tileset 1 del bloque. */
export const NORTH_PIECES = Object.freeze({ stamps: B15_STAMPS, brushes: B15_BRUSHES });
