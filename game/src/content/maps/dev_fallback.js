// Respaldo de stamps/brushes del tileset 7 para los mapas de prueba: el MapBuilder solo los usa si la
// biblioteca de content/stamps no está disponible (misma geometría que ExteriorBosqueCeleste.js).
export const DEV_FALLBACK_7 = {
  stamps: {
    casa_roja: { src: [0, 60, 7, 11], layer: 2, door: [4, 7] },
    arbol: { src: [4, 41, 2, 4], layer: 2 },
    pino: { src: [6, 41, 2, 4], layer: 2 },
    roca_agua: { src: [7, 15, 1, 1], layer: 2 },
    tocon: { src: [5, 5, 1, 1], layer: 2 },
    brotes: { src: [4, 3, 1, 1], layer: 2 },
    cartel_madera: { src: [7, 10, 1, 1], layer: 2 },
    macizo_flores: { src: [5, 4, 2, 1], layer: 1 },
    flores_rosas: { src: [5, 3, 1, 1], layer: 1 },
    flores_blancas: { src: [6, 2, 1, 1], layer: 1 },
  },
  brushes: {
    cesped: { pattern: [0, 0, 4, 4], layer: 0 },
    hierba_alta: { tile: 396, layer: 1 },
    camino_arena: { nine: [0, 4], inner: [3, 4], layer: 1 },
    agua: { grid: [[136, 134], [130, 132]], layer: 0 },
    orilla: { nine: [0, 520], inner: [3, 520], fill: 0, layer: 1 },
    flores_azules: { autotile: 2, layer: 1 },
    bosque: { forest: { trees: [[0, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1 },
    bosque_pinos: { forest: { trees: [[2, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1 },
    saliente: { line: { ids: [651, 657, 652] }, layer: 1 },
  },
};
