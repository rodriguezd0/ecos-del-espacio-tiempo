// Casa del protagonista — planta alta (habitación). Punto de inicio de la partida (B01 §0.4 y §4.1).
// Tileset 4 (Interior1). Guion: docs/bloques/B01_apertura.md.
import { ROOM_BRUSHES, examineRect } from './common.js';
import { bedroomEvents } from '../../events/b01_town_home.js';
import { F, when } from '../../events/b01_town_common.js';
import { b21CuartoEvents } from '../../events/b21_epilogo.js'; // B21: despertar tras los créditos
import { b22aCuartoEvents } from '../../events/b22a_home.js'; // B22a: línea base del descanso de Arceus (postgame)

/** Punto de inicio de partida nueva (junto a la cama, mirando abajo). */
export const START = Object.freeze({ x: 8, y: 6, dir: 2 });
/** Casilla de la escalera (se pisa desde la izquierda) y llegada desde la planta baja. */
export const STAIRS = Object.freeze({ x: 10, y: 4 });
export const STAIRS_ARRIVAL = Object.freeze({ x: 9, y: 4, dir: 4 });
/** Casilla del evento con la vista de la ventana (fotograma 96×64 centrado en x 5: cubre la ventana 5–6). */
export const WINDOW_VIEW = Object.freeze({ x: 5, y: 3 });
const WINDOW_TEXT = 'Entra la luz de la mañana. Sobre los tejados de Villa Alba y el bosque se alza el Monte del Portal, con su gran cascada.';

export default {
  id: 'casa_prota_2f',
  name: 'Villa Alba',
  tileset: 4,
  width: 13,
  height: 10,
  outdoor: false,
  bgm: 'town_start',
  battleback: 'indoor',
  showLocation: false,
  start: START,
  brushes: ROOM_BRUSHES,

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 8, 'habitacion_beige');
    // Pared: ventana con cortinas y reloj
    b.stamp('ventana_cortinas', 5, 2);
    b.stamp('reloj_pared', 8, 2);
    // Rincón de estudio: escritorio con PC, estantería y cómoda
    b.stamp('escritorio_pc', 1, 3);
    b.stamp('estanteria_naranja', 4, 3);
    b.stamp('comoda', 8, 3);
    // Escalera que baja (pared derecha)
    b.stamp('escalera_bajar_der', 10, 3);
    // Alfombra con la tele y la consola
    b.rect(null, 3, 6, 5, 3, 'alfombra_azul');
    b.stamp('tele', 4, 5);
    b.stamp('consola', 4, 7);
    // Cama y planta
    b.stamp('cama', 9, 5);
    b.stamp('planta_alta', 1, 7);
  },

  warps: [
    { x: STAIRS.x, y: STAIRS.y, to: 'casa_prota_1f', tx: 11, ty: 4, dir: 4 },
  ],

  events: [
    ...bedroomEvents(),
    // Luz de mañana por la ventana (B01 §4.1), hasta que se elige inicial
    {
      id: 'luz_manana', x: 5, y: 4, through: true, when: when({ none: [F.starter] }),
      glow: { name: 'softLight', radius: 110, intensity: 0.22, pulse: 0.08, color: [255, 232, 160] },
    },
    // Vista por la ventana: el Monte del Portal con su gran cascada (CAMPANA «B01 — ajustes»; X22).
    // Sprite generado por tools/b01_assets.mjs: solo pinta los cristales del stamp 'ventana_cortinas'.
    {
      id: 'vista_monte', x: WINDOW_VIEW.x, y: WINDOW_VIEW.y, sprite: 'asset:objects/ventana_monte.png', dir: 2,
      through: true, directionFix: true, walkAnime: false, stepAnime: true, speed: 1, shadow: false,
    },
    ...examineRect('ventana', 5, 3, 2, 1, WINDOW_TEXT),
    ...examineRect('estanteria', 4, 4, 1, 1, 'Libros de Pokémon y un par de mapas del bosque, muy usados.'),
    ...examineRect('comoda', 8, 4, 1, 1, 'Ropa doblada. La mochila está preparada al lado.'),
    ...examineRect('tele', 4, 5, 2, 2, 'Un programa sobre Pokémon del bosque. Nada que no sepas ya.'),
    ...examineRect('consola', 4, 7, 2, 1, 'Una consola de videojuegos. Ahora no es momento.'),
    ...examineRect('cama', 9, 6, 3, 3, 'Tu cama. Sigue deshecha.'),
    ...b21CuartoEvents(),
    ...b22aCuartoEvents(),
  ],
};
