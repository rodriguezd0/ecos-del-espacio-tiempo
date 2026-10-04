export const ROOMS = Object.freeze({
  archive: {
    id: 'alerce_cuarto_fondo', entry: { x: 9, y: 15, dir: 8 },
    return: { map: 'laboratorio_alerce', x: 13, y: 4, dir: 2 },
    papers: { foto: { x: 4, y: 7 }, calibracion: { x: 7, y: 7 }, fechas: { x: 13, y: 7 }, cuaderno: { x: 15, y: 11 } },
  },
  hatch: { x: 9, y: 34 },
  talasa: {
    id: 'ruinas_talasa', entry: { x: 14, y: 21, dir: 8 },
    return: { map: 'estacion_talasa', x: 9, y: 33, dir: 8 },
    ditto: { x: 19, y: 10 }, stone: { x: 6, y: 14 },
    tank: { x: 20, y: 8 }, notes: { x: 7, y: 8 },
  },
});
