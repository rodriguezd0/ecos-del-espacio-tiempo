// Cerro Plomo (docs/CAMPANA.md B08, paso 2–3): las galerías de la familia Galena bajo el cerro, la verja con su
// candado y la puerta del Pilar de la Masa. Fermín espera en la verja tras el pozo lateral de la Mina Galena (flag
// b08_fermin_cerro) y la abre; sin él, la verja sigue cerrada.
import { F, SPEAKER, SPRITE, OBJ, lines, examine, findEvent } from './b08_common.js';
import { CERRO } from '../maps/b08/layout.js';

export const CERRO_TEXT = Object.freeze({
  gateLocked: 'Una verja de hierro con un candado enorme. Una placa oxidada: «Propiedad de la familia Galena. Prohibido el paso».',
  gateOpen: 'La verja está abierta. Al fondo, la boca oscura de la puerta del Pilar.',
  sign: 'GALERÍA DEL CERRO\nFamilia Galena. Explotación cerrada.\n«Lo que pesa, no se vende.»',
  plaque: 'Una estela con glifos antiguos a los lados de la puerta. La Pokédex solo reconoce una palabra: «peso».',
});

async function gateTalk(ctx) {
  if (ctx.flag(F.gateOpen)) { await ctx.say(CERRO_TEXT.gateOpen); return; }
  await ctx.say(CERRO_TEXT.gateLocked);
  if (!ctx.flag(F.ferminCerro)) return;
  await ferminOpens(ctx);
}

async function ferminOpens(ctx) {
  const fermin = findEvent(ctx, 'fermin_cerro');
  if (fermin) fermin.turnToward(ctx.player);
  await lines(ctx, SPEAKER.fermin, [
    'Has venido. Bien.',
    'Esta verja la puso mi bisabuelo. Detrás está la puerta. En casa la llamamos la Cámara de los Contrapesos.',
    'Hay una balanza enorme colgada sobre un agujero sin fondo. Nunca la he visto moverse. Ni mi padre. Ni el suyo.',
    'Y el suelo cruje. Si notas que cruje, no vayas cargado.',
  ]);
  ctx.se('PRSFX- Shift Gear', { volume: 80 });
  await ctx.wait(10);
  ctx.se('Door enter');
  ctx.setFlag(F.gateOpen);
  await lines(ctx, SPEAKER.fermin, [
    'Ya está. Adelante.',
    'Yo me quedo en la puerta. Si esa balanza se mueve, lo oiré desde aquí. Se oirá hasta en Estrato.',
  ]);
}

async function ferminTalk(ctx) {
  if (!ctx.flag(F.gateOpen)) { await ferminOpens(ctx); return; }
  await ctx.say('Te espero aquí. Si la balanza se mueve, lo oiré.', { speaker: SPEAKER.fermin });
}

function gateEvents() {
  const [cx] = CERRO.gate[1];
  return [
    ...CERRO.gate.map(([x, y]) => ({
      id: `verja_${x}`, x, y, name: 'Verja',
      pages: [
        { sprite: OBJ.gate, dir: 2, pattern: x - cx + 1, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: gateTalk },
        { when: (s) => Boolean(s?.flag(F.gateOpen)), through: true },
      ],
    })),
    {
      id: 'fermin_cerro', x: CERRO.fermin.x, y: CERRO.fermin.y, name: SPEAKER.fermin,
      pages: [
        { when: (s) => Boolean(s) && s.flag(F.ferminCerro) && !s.flag(F.balance), sprite: SPRITE.fermin, dir: CERRO.fermin.dir, trigger: 'action', script: ferminTalk },
      ],
    },
    // Al acercarse a la verja con Fermín esperando, él mismo la abre.
    ...CERRO.gateFront.map(([x, y]) => ({
      id: `verja_frente_${x}`, x, y,
      pages: [{ when: (s) => Boolean(s) && s.flag(F.ferminCerro) && !s.flag(F.gateOpen), through: true, trigger: 'touch', script: ferminOpens }],
    })),
  ];
}

/** Pisar la boca del Pilar lleva a la Cámara de los Contrapesos. */
function doorEvent() {
  const { x, y } = CERRO.door;
  return {
    id: 'puerta_pilar', x, y, through: true, trigger: 'touch',
    script: async (ctx) => {
      ctx.se('Door enter');
      await ctx.warp('camara_contrapesos', 14, 33, 8);
    },
  };
}

export async function cerroOnEnter(ctx) {
  if (ctx.flag(F.cerroSeen)) return;
  ctx.setFlag(F.cerroSeen); // Zygarde habla muy poco (autor, 25-09-2026): sin comentario del Core al llegar.
}

export function cerroEvents() {
  return [
    ...gateEvents(),
    doorEvent(),
    examine('cartel_galena', 10, 20, CERRO_TEXT.sign, { solid: true }),
    examine('estela_puerta_0', 11, 7, CERRO_TEXT.plaque, { solid: true }),
    examine('estela_puerta_1', 12, 7, CERRO_TEXT.plaque, { solid: true }),
    {
      id: 'minera_blanca', type: 'trainer', trainer: 'b08_minera_cerro', name: 'Minera Blanca', sprite: 'anil:minera',
      x: 20, y: 22, dir: 4, sight: 4,
      intro: 'Esta galería era de los Galena. Ahora la vigilo yo, que no se cuele nadie del Consorcio.',
      after: 'El padre de Fermín bajaba aquí cada domingo. Decía que el cerro «respiraba». Nadie le creía.',
    },
    {
      id: 'montanero_octavio', type: 'trainer', trainer: 'b08_montanero_cerro', name: 'Montañero Octavio', sprite: 'anil:montanero',
      x: 20, y: 9, dir: 4, sight: 3,
      intro: '¿Pasas de la verja? Entonces tendrás que pasar de mí.',
      after: 'Esa puerta del fondo… Me acerqué una vez y me dolieron las rodillas. Como si llevara un saco a la espalda.',
    },
    { id: 'objeto_cerro_1', type: 'item', x: 7, y: 25, item: 'REVIVE', hidden: true },
    { id: 'objeto_cerro_2', type: 'item', x: 22, y: 7, item: 'HYPERPOTION' },
    { id: 'objeto_cerro_3', type: 'item', x: 7, y: 11, item: 'STARDUST' },
  ];
}
