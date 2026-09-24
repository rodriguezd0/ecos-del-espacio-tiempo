// Sala de PRUEBAS de la biblioteca de stamps (sin canon): recinto de Pilar hecho solo con el kit común
// (content/stamps/pilar.js, X23) sobre Cueva1 y con el tinte del P1. Sirve para ver en el juego los tiles
// propios del overlay (extraTiles.js), su pasabilidad/prioridad y el tono por Pilar.
// Prueba: ?scene=map&map=dev_stamps&debug   (vars=pilar:N cambia el tinte al entrar, N = 1…10)
import { pilarTone } from '../stamps/pilar.js';

export default {
  id: 'dev_stamps',
  name: 'Sala del kit de Pilar',
  tileset: 2,
  width: 26,
  height: 24,
  cave: true,
  battleback: 'Templo',
  start: { x: 12, y: 19, dir: 8 },
  tone: pilarTone('P1'),
  noFollower: true,

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 4, 5, 18, 16, 'sala_gris');
    b.rect(null, 5, 6, 16, 14, 'pilar_enlosado');
    b.stamp('boca_norte_gris', 11, 1);
    b.stamp('pilar_camara_nucleo', 10, 9);
    b.stamp('pilar_pedestal', 12, 10);
    b.stamp('pilar_monolito', 6, 6);
    b.stamp('pilar_monolito', 18, 6);
    b.stamp('pilar_columna', 5, 12);
    b.stamp('pilar_columna', 20, 9);
    b.stamp('pilar_columna_quebrada', 20, 13);
    b.stamp('pilar_placa_unown', 6, 16);
    b.stamp('pilar_arista_grande', 18, 16);
    b.stamp('pilar_arista', 16, 7);
    b.stamp('pilar_manantial', 15, 13);
    b.stamp('pilar_losa_eco', 8, 12);
    b.paint('pilar_canal', [[6, 10], [7, 10], [8, 10]]);
    b.paint('pilar_canal_v', [[17, 10], [17, 11], [17, 12]]);
    b.stamp('pilar_dintel', 10, 16);
    b.stamp('pilar_escalinata', 12, 6);
    b.stamp('pilar_glifo', 9, 7);
    b.stamp('pilar_glifo_2', 13, 13);
    b.stamp('pilar_zocalo_gastado', 5, 19);
    b.stamp('pilar_zocalo', 6, 19);
    b.stamp('pilar_zocalo_vivo', 7, 19);
  },

  onEnter: async (ctx) => {
    const n = ctx.var('pilar', 0);
    if (n >= 1 && n <= 10) await ctx.tone(pilarTone(n), 1);
  },

  events: [
    { id: 'placa', type: 'sign', x: 6, y: 17, text: 'Unos glifos antiguos cubren la estela. (Sala de pruebas del kit de Pilar.)' },
    { id: 'pedestal', type: 'sign', x: 12, y: 11, text: 'Un pedestal hexagonal con un hueco en el centro.' },
    // Gráficos de evento de las barreras (game/assets/objects/barreras.png)
    { id: 'roca', type: 'ramRock', x: 9, y: 17, sprite: 'asset:objects/barreras.png', dir: 2, directionFix: true, stepAnime: true },
    { id: 'tronco', type: 'ramRock', x: 16, y: 18, sprite: 'asset:objects/barreras.png', dir: 4, directionFix: true, stepAnime: true },
    { id: 'roca_nieve', type: 'ramRock', x: 17, y: 18, sprite: 'asset:objects/barreras.png', dir: 8, directionFix: true, stepAnime: true },
    { id: 'vetas', type: 'climbWall', x: 20, y: 17, to: [20, 15], sprite: 'asset:objects/barreras.png', dir: 6, directionFix: true, stepAnime: true },
  ],
};
