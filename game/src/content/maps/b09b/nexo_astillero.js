import { withB24Events } from '../../events/b24_maps.js';
// Astillero de Ciudad Nexo (docs/CAMPANA.md §1.3 «astillero»; POKEDEX §7.7: Scizorita en el astillero). Nave del
// Interior1 de Añil (`central_almacen`) con carpinteros de ribera. Tileset 4.
import { BUILDINGS, INTERIOR_ENTRIES } from './nexo_layout.js';
import { SPEAKER, SPRITE, lines, examine } from '../../events/b09b_common.js';

const E = INTERIOR_ENTRIES.nexo_astillero;
const OUT = BUILDINGS.astillero.door;
/** Nave colocada en (1, 1): hueco de salida sur en x 9–12, fila 19 (como el almacén del Parque Eólico, B06). */
const EXIT_TILES = [9, 10, 11, 12];

export default {
  id: 'nexo_astillero',
  name: 'Ciudad Nexo',
  tileset: 4,
  width: 27,
  height: 21,
  outdoor: false,
  bgm: 'CiudadCarmin',
  battleback: 'indoor',
  showLocation: false,
  start: { x: 10, y: 18, dir: 8 },

  build(b) {
    b.fill(0, 'vacio');
    b.stamp('central_almacen', 1, 1);
  },

  warps: EXIT_TILES.map((x) => ({ x, y: 19, dirTrigger: 2, to: 'ciudad_nexo', tx: OUT.x, ty: OUT.y + 1, dir: 2, door: true })),

  events: withB24Events('nexo_astillero', [
    {
      id: 'carpintera', x: 17, y: 10, name: SPEAKER.shipwright, sprite: SPRITE.workerF, dir: 4, move: 'look', trigger: 'action',
      script: (ctx) => lines(ctx, SPEAKER.shipwright, [
        'Desde que la mar anda revuelta, arreglamos más barcos de los que botamos.',
        'Anoche entró una barca con el casco lleno de lapas de otra época. Como si hubiera pasado siglos en el fondo. Y salió del puerto hace tres días.',
      ]),
    },
    {
      id: 'carpintero', x: 7, y: 13, name: 'Carpintero de ribera', sprite: SPRITE.worker, dir: 6, move: 'look', trigger: 'action',
      script: (ctx) => lines(ctx, 'Carpintero de ribera', [
        'Madera de la Reserva del Delta, clavos de la forja de Tizón. Bueno, clavos ya no nos llegan.',
        'Los herreros no mandan nada desde hace semanas. Pregunta en el mercado, a ver si alguien sabe algo.',
      ]),
    },
    { id: 'megapiedra_scizorita', type: 'item', x: 21, y: 15, item: 'SCIZORITE' },
    examine('caja_herramientas', 4, 9, 'Cajas de herramientas de carpintero: gubias, mazos, calafates… y un frasco de brea.', { solid: true }),
  ]),
};
