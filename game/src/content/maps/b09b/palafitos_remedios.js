// Casa de Doña Remedios, curandera de los Palafitos (docs/CAMPANA.md §1.4 «curandera Remedios»; TABLILLAS T08,
// segunda pista). Cura al equipo y fija el punto de cura delante de ella. Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { HOUSES, INTERIOR_ENTRIES } from './ruta_8_layout.js';
import { F, SPEAKER, SPRITE, examine } from '../../events/b09b_common.js';
import { remediosTalk } from '../../events/b09b_t08.js';

const E = INTERIOR_ENTRIES.palafitos_remedios;
const OUT = HOUSES.remedios.door;
const REMEDIOS = Object.freeze({ x: 6, y: 5, dir: 2 });
const HEAL_POINT = Object.freeze({ x: 6, y: 6, dir: 8, map: 'palafitos_remedios' });

export default {
  id: 'palafitos_remedios',
  name: 'Ruta 8',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'PuebloLavanda',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('estanteria_roja', 1, 2);
    b.stamp('estanteria_naranja', 3, 2);
    b.stamp('fregadero', 8, 2);
    b.stamp('nevera', 10, 2);
    b.stamp('cama_individual', 9, 6);
    b.stamp('planta', 1, 7);
    b.stamp('planta_alta', 4, 2);
    b.stamp('sartenes', 8, 1);
    b.stamp('ventana', 5, 1);
    b.rect(null, 4, 6, 5, 2, 'alfombra_verde');
  },

  warps: exitWarps(E.x, E.y, { map: 'ruta_8_marisma', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    {
      id: 'remedios', x: REMEDIOS.x, y: REMEDIOS.y, name: SPEAKER.remedios, sprite: SPRITE.remedios, dir: REMEDIOS.dir, move: 'still',
      script: (ctx) => remediosTalk(ctx, { x: HEAL_POINT.x, y: HEAL_POINT.y, dir: HEAL_POINT.dir }),
    },
    examine('estanteria_hierbas', 1, 4, 'Tarros de hierbas secas con etiquetas escritas a mano: «Raíz de juncal», «Flor de Croagunk», «Para la tos».', { solid: true }),
    examine('estanteria_hierbas_2', 2, 4, 'Tarros de hierbas secas con etiquetas escritas a mano: «Raíz de juncal», «Flor de Croagunk», «Para la tos».', { solid: true }),
    examine('libros_remedios', 3, 3, (s) => (s.flag(F.healed)
      ? 'Un cuaderno de recetas abierto. En la última página, con letra nueva: «Agua de la laguna: ya se puede hervir».'
      : 'Un cuaderno de recetas abierto. En la última página: «Agua de la laguna: NO usar».'), { solid: true }),
  ],
};
