// Arrecife del Eco (docs/CAMPANA.md B14 y §5.4): fondo de arrecife ante la muralla hundida de Antea. La draga de
// Genesis «draga Antea en busca de reliquias del Rey (los planos de la corona)»: su cabezal tapa la Puerta de Antea
// hasta que la jefa de la campana de dragado lo aparta (b14_campana.js). Tras el P7 la draga queda inservible (el eco
// la envejece: coral y óxido). Llegada y salida por el remolino de Caleta Sonda; paso al Fondo del Mar del Sur por el
// este. Módulo puro salvo los guiones.
import { ARRECIFE, CALETA, ROOMS, roomMap } from '../maps/b14/layout.js';
import { F, OBJ, SPRITE, zygardeSays, lines } from './b14_common.js';
import { ventEvents, itemEvents, bigSprite } from './b14_antea_common.js';
import { coralEvents, crateEvents } from '../maps/b14/paint.js';

const A = ARRECIFE;
const aside = (s) => Boolean(s?.flag(F.dredgeAside));
const restored = (s) => Boolean(s?.flag(F.restored));

export const ARRECIFE_TEXT = Object.freeze({
  arrive: ['Aquí abajo el agua suena a voces. Muchas. Muy antiguas.', 'Al norte hay una muralla. Una ciudad entera, dormida.'],
  dredge: 'El cabezal de una draga enorme, con el emblema de los tubos cruzados, remueve el lecho justo delante de la puerta de la muralla.',
  dredgeCore: 'Están cavando la ciudad… y tapan la entrada. Los que la manejan estarán cerca: esa campana, al oeste.',
  dredgeAside: 'El cabezal de la draga, apartado de la puerta. Sigue girando y escupiendo arena.',
  dredgeAged: 'El cabezal de la draga, cubierto de coral y de óxido como si llevara siglos aquí. No se mueve.',
  bell: 'Una campana de trabajo de Genesis, anclada al fondo. Por la escotilla de abajo sale el aire en burbujas.',
  bellDark: 'La campana de dragado, a oscuras. Nadie la maneja ya.',
  crates: ['Cajas selladas con una etiqueta: «ANTEA — Catalogado». Dentro suena algo metálico.'],
  cratesEmpty: 'Una caja vacía. Solo queda la etiqueta: «ANTEA — Catalogado».',
  gate: 'La Puerta de Antea: un arco de piedra en la muralla hundida. Por dentro se oye… música de mercado.',
  column: 'Una columna caída, más antigua que cualquier cosa de Caleta. Tiene glifos gastados.',
});

function dredgeEvents() {
  const head = A.dredge;
  const side = A.dredgeAside;
  const blocking = bigSprite('draga_cabezal', head.x, head.y, OBJ.dredge, 2, ARRECIFE_TEXT.dredge, {
    block: A.dredgeBlock, when: (s) => !aside(s), extra: { stepAnime: true, speed: 4 },
  }).map((ev) => ({
    ...ev,
    pages: ev.pages.map((p) => ({
      ...p,
      script: async (ctx) => {
        await ctx.say(ARRECIFE_TEXT.dredge);
        if (!ctx.flag(F.dredgeSeen)) { ctx.setFlag(F.dredgeSeen); await zygardeSays(ctx, ARRECIFE_TEXT.dredgeCore); }
      },
    })),
  }));
  const moved = bigSprite('draga_apartada', side.x, side.y, OBJ.dredge, 2, ARRECIFE_TEXT.dredgeAside, {
    block: A.dredgeAsideBlock, when: (s) => aside(s) && !restored(s), extra: { stepAnime: true, speed: 4 },
  });
  // Tras el P7 la draga queda inservible, envejecida por el eco (coral y óxido).
  const aged = bigSprite('draga_vieja', side.x, side.y, OBJ.dredge, 6, ARRECIFE_TEXT.dredgeAged, {
    block: A.dredgeAsideBlock, when: restored,
  });
  return [...blocking, ...moved, ...aged];
}

function bellEvents() {
  const B = A.bell;
  return [
    ...bigSprite('campana_dragado', B.x, B.y, OBJ.bell, 2, (s) => (restored(s) ? ARRECIFE_TEXT.bellDark : ARRECIFE_TEXT.bell), {
      block: A.bellBlock, extra: { stepAnime: true, speed: 2 },
    }).map((ev) => (ev.id === 'campana_dragado'
      ? { ...ev, pages: [...ev.pages, { ...ev.pages[0], when: restored, dir: 4, stepAnime: false }] }
      : ev)),
  ];
}

async function arrive(ctx) {
  if (ctx.flag(F.reefArrival)) return;
  ctx.setFlag(F.reefArrival);
  for (const t of ARRECIFE_TEXT.arrive) await zygardeSays(ctx, t);
}

export function arrecifeEvents() {
  const R = CALETA.reefDive;
  return [
    { id: 'superficie', type: 'diveSpot', surface: true, x: A.arrival.x, y: A.arrival.y, to: 'caleta_sonda', tx: R.x, ty: R.y, dir: 2 },
    ...dredgeEvents(),
    ...bellEvents(),
    {
      id: 'escotilla_campana', x: A.hatch.x, y: A.hatch.y, name: 'Escotilla',
      pages: [{
        through: true, trigger: 'touch',
        script: async (ctx) => {
          ctx.se('Door enter');
          await ctx.warp('arrecife_campana', 8, 10, 8);
        },
      }],
    },
    ...crateEvents('caja_reliquias', A.crates, ARRECIFE_TEXT.crates),
    ...ventEvents('respiradero_arrecife', A.vents),
    ...coralEvents('coral_arrecife', A.corals),
    { id: 'columna_antea', x: A.column.x, y: A.column.y, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say(ARRECIFE_TEXT.column); } },
    {
      id: 'llegada_arrecife', x: A.arrival.x, y: A.arrival.y - 1,
      pages: [{ when: (s) => !s.flag(F.reefArrival), through: true, trigger: 'touch', lock: false, script: arrive }],
    },
    {
      id: 'buceador_casimiro', type: 'trainer', trainer: 'b14_buceador_casimiro', name: 'Buceador Casimiro', sprite: 'anil:buceador',
      x: A.trainers.casimiro.x, y: A.trainers.casimiro.y, dir: A.trainers.casimiro.dir, sight: 4,
      intro: '¿Tú también vienes a buscar a Fausto? Primero, a ver cómo te mueves aquí abajo.',
      after: 'Fausto bajó siguiendo unas luces junto a la muralla. Nadie lo ha vuelto a ver. Si entras ahí, ten cuidado.',
    },
    {
      id: 'buceadora_rocio', type: 'trainer', trainer: 'b14_buceadora_rocio', name: 'Buceadora Rocío', sprite: 'anil:buceadora',
      x: A.trainers.rocio.x, y: A.trainers.rocio.y, dir: A.trainers.rocio.dir, sight: 4,
      intro: 'Esa draga lleva días removiendo el arrecife. Estoy de mal humor. ¡Combate!',
      after: 'Por el este se baja al fondo del mar. Allí hay praderas de algas enteras… y una fosa que no tiene fondo.',
    },
    ...itemEvents(A.items),
  ];
}

export { lines, ROOMS, roomMap, SPRITE };
