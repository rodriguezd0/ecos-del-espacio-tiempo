// Casa de Abril Céspedes (Guardiana del Impulso; CAMPANA §1.3 «casa de Abril»). Por la noche Abril está en casa;
// de día, antes del P3, vigila el Anillo (B06) y, tras el P3, está en la plaza (abrilTalk en
// content/events/b05_brontia.js). Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { withB22bHints } from '../../events/b22b_hints.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './villa_brontia_layout.js';
import { F, SPEAKER, SPRITE, isNight, examine } from '../../events/b05_common.js';
import { abrilTalk } from '../../events/b05_brontia.js';

const E = INTERIOR_ENTRIES.brontia_casa_abril;
const OUT = BUILDINGS.abril.door;

export default {
  id: 'brontia_casa_abril',
  name: 'Villa Brontia',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'PuebloMarengo',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('cama_individual', 1, 3);
    b.stamp('tele', 5, 3);
    b.stamp('consola', 5, 6);
    b.stamp('estanteria_naranja', 8, 3);
    b.stamp('ventana', 9, 2);
    b.stamp('sofa', 10, 4);
    b.stamp('planta', 1, 8);
    b.rect(null, 4, 6, 4, 2, 'alfombra_azul');
  },

  warps: exitWarps(E.x, E.y, { map: 'villa_brontia', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: withB22bHints([
    ...exitArrowEvents(E.x, E.y + 1),
    {
      id: 'abril_casa', x: 7, y: 7, name: SPEAKER.abril, sprite: SPRITE.abril, dir: 4, move: 'look',
      when: (s) => isNight(s) && s.flag(F.p3),
      script: (ctx) => abrilTalk(ctx, { home: true }),
    },
    // Antes del P3, Abril acampa en el Anillo de los Vientos (B06): solo queda su nota.
    examine('cama_abril', 2, 5, (s) => (s.flag(F.p3)
      ? 'La cama de Abril, sin hacer. Encima hay una revista de carreras abierta por la mitad.'
      : 'Sobre la cama hay una nota: «Me subo al Anillo. Vuelvo cuando me aburra. —A.»')),
    examine('tele', 5, 5, (s) => {
      if (s.flag(F.p3)) return 'Echan un programa sobre el Parque Eólico. Abril lo ha dejado en silencio.';
      return s.flag(F.light) ? 'La tele está apagada. Con la luz a medias, en Brontia nadie se arriesga a encenderla.' : 'La tele está apagada: no hay corriente.';
    }),
    examine('estanteria', 8, 5, 'Revistas de carreras de Cyclizar, muy manoseadas.', { solid: true }),
  ]),
};
