// Fondo de PRUEBAS del Buceo (sin canon). Tileset 15 (Cueva Azul). Burbuja de Zygarde con medidor de
// 8 segmentos: la zona somera junto a la llegada no gasta; dos respiraderos (verde y bolsa de aire), una
// corriente que empuja al este y la salida a la superficie en la casilla de llegada.
// Entrada: remolino de dev_zygarde (30, 6). Prueba directa: ?scene=map&map=dev_zygarde_fondo&zygarde=all&debug
export default {
  id: 'dev_zygarde_fondo',
  name: 'Fondo de pruebas',
  tileset: 15,
  width: 30,
  height: 22,
  cave: true,
  bgm: 'Emociones',
  battleback: 'Sub',
  start: { x: 6, y: 12, dir: 6 },
  dark: { amount: 0.88 },
  tone: [-60, -12, 34, 40],
  noFollower: true,
  underwater: { shallow: [[3, 10, 5, 5]] },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 3, 4, 24, 15, 'sala');
    for (const [x, y] of [[11, 6], [18, 11], [23, 6], [9, 16]]) b.stamp('roca_grande', x, y);
  },

  events: [
    { id: 'superficie', type: 'diveSpot', surface: true, x: 6, y: 12, to: 'dev_zygarde', tx: 30, ty: 6, dir: 2 },
    { id: 'respiradero', type: 'diveVent', x: 16, y: 8 },
    { id: 'bolsa', type: 'diveVent', kind: 'bolsa', x: 24, y: 16 },
    { id: 'corriente_1', type: 'diveCurrent', x: 12, y: 13, dir: 6, length: 5 },
    { id: 'corriente_2', type: 'diveCurrent', x: 12, y: 14, dir: 6, length: 5 },
  ],
};
