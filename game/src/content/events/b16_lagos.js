// Lagos del Alma (docs/CAMPANA.md B16): llegada, vecinos de Villa Boreal en el mirador de las auroras (desvinculación:
// «en Boreal piden marcharse»), la observadora del refugio, el campamento de Genesis que registra el santuario desde la
// orilla (lo que luego usa en B17), objetos, C095 y la salida sur hacia Villa Boreal (B15; aviso neutro mientras no
// exista). El puente de hielo y el hito de la Forma Completa están en b16_hito.js.
import {
  F, SPEAKER, SPRITE, OBJ, lines, zygardeSays, byGender, examine, frame,
} from './b16_common.js';
import {
  NPC, CAMP, LAGOS_ITEMS, CELL_LAGOS, EXITS, SANCTUARY,
} from '../maps/b16/lagos_layout.js';
import { PENDING_LINKS, mapRegistered } from '../maps/b16/pending_links.js';

const restored = (s) => s.flag(F.restored);
const done = (s) => s.flag(F.milestone);

export const LAGOS_TEXT = Object.freeze({
  arrival: 'Tres lagos quietos bajo la nieve y, en medio, un islote con una roca labrada. El aire huele a hielo y a algo más viejo.',
  coreArrival: 'Ahí. El octavo. Tres voces lo guardan.',
  sign: 'LAGOS DEL ALMA\nAl norte, el Santuario. El puente de hielo no llega al islote: el último tramo se fundió.',
  signAfter: 'LAGOS DEL ALMA\nAl norte, el Santuario, por el puente de hielo.',
  stele: 'Una estela con letras antiguas. Traducidas dicen: «Lo que se sabe. Lo que se siente. Lo que se quiere.»',
  steleAfter: 'La estela está tibia. Sus letras brillan con un rosa pálido.',
  southBlocked: 'El sendero baja hacia Villa Boreal, pero por ahora no puedes continuar.',
  evaristoHint: 'Con el ferri de Nexo ha llegado el correo, y un recado de Don Evaristo, el de Correos: busca a alguien que sepa llegar a la Mesa de los Vientos.',
});

// ─────────────────────────────── Vecinos de Boreal ───────────────────────────────

function martaEvents() {
  const N = NPC;
  return [
    {
      id: 'marta', x: N.marta.x, y: N.marta.y, name: SPEAKER.marta,
      pages: [
        {
          when: (s) => !restored(s), sprite: SPRITE.marta, dir: N.marta.dir, move: 'look',
          script: (ctx) => lines(ctx, SPEAKER.marta, [
            'Mi Snorunt me sigue desde que era un huevo. Y ahora me mira como si no me hubiera visto nunca.',
            'Subimos aquí a ver la aurora, como todos los años. Él se queda allí apartado.',
            'En el pueblo ya hay quien habla de marcharse. Si los Pokémon no nos reconocen, ¿qué hacemos aquí arriba?',
          ]),
        },
        {
          when: done, sprite: SPRITE.marta, dir: 6, move: 'look',
          script: (ctx) => lines(ctx, SPEAKER.marta, [
            (s) => `Ha vuelto a mi lado en cuanto hemos pisado la orilla. Como si nada. Gracias, ${byGender(s, 'chico', 'chica')}.`,
            'Nadie va a marcharse de Boreal. No mientras siga habiendo auroras que mirar.',
          ]),
        },
      ],
    },
    {
      id: 'snorunt_marta', x: N.snorunt.x, y: N.snorunt.y, name: 'Snorunt',
      pages: [
        {
          when: (s) => !restored(s), sprite: SPRITE.snorunt, dir: N.snorunt.dir, move: { wander: 1 },
          script: async (ctx) => { ctx.cry('SNORUNT'); await ctx.say('Snorunt se aparta. No deja que te acerques.'); },
        },
      ],
    },
    {
      id: 'snorunt_con_marta', x: N.snorunt_after.x, y: N.snorunt_after.y, name: 'Snorunt',
      pages: [
        {
          when: done, sprite: SPRITE.snorunt, dir: N.snorunt_after.dir, move: 'look', stepAnime: true,
          script: async (ctx) => { ctx.cry('SNORUNT'); await ctx.say('Snorunt da vueltas alrededor de las botas de Marta.'); },
        },
      ],
    },
    {
      id: 'anciano_boreal', x: NPC.elder.x, y: NPC.elder.y, name: SPEAKER.elder,
      pages: [
        {
          when: (s) => !restored(s), sprite: SPRITE.elder, dir: NPC.elder.dir, move: 'look',
          script: (ctx) => lines(ctx, SPEAKER.elder, [
            'Sesenta inviernos mirando el cielo desde este mirador. Nunca había visto a los Pokémon del norte apartarse de nosotros.',
            'Dicen que en el santuario del islote viven tres guardianes. Mi abuela les dejaba pan en la orilla.',
          ]),
        },
        {
          when: done, sprite: SPRITE.elder, dir: 8, move: 'look',
          script: (ctx) => lines(ctx, SPEAKER.elder, [
            'La luna no ha vuelto a su tamaño, ni el cielo a su color. Pero los Pokémon nos miran otra vez.',
            'Con eso, de momento, me basta.',
          ]),
        },
      ],
    },
    {
      id: 'nino_boreal', x: NPC.kid.x, y: NPC.kid.y, name: SPEAKER.kid,
      pages: [
        {
          when: (s) => !restored(s), sprite: SPRITE.kid, dir: NPC.kid.dir, move: 'look',
          script: (ctx) => lines(ctx, SPEAKER.kid, [
            '¡Desde el arco del puente se ve la aurora entera! Pero el trozo que llega al islote se deshizo.',
            'Mi padre dice que el hielo viejo lo sostenía algo que ya no está.',
          ]),
        },
        {
          when: done, sprite: SPRITE.kid, dir: 8, move: 'look',
          script: (ctx) => lines(ctx, SPEAKER.kid, [
            '¡Lo he visto todo! ¡Un Pokémon enorme hecho de hexágonos, sujetando el puente!',
            (s) => `¿Es tuyo? ${byGender(s, 'Eres el que', 'Eres la que')} lo llevaba encima, ¿verdad?`,
          ]),
        },
      ],
    },
  ];
}

// ─────────────────────────────── Refugio y observadora ───────────────────────────────

function observerEvent() {
  const O = NPC.observer;
  return {
    id: 'observadora', x: O.x, y: O.y, name: SPEAKER.observer,
    pages: [
      {
        sprite: SPRITE.observer, dir: O.dir, move: 'look',
        script: async (ctx) => {
          // Tras el hito (aunque sea la primera vez que se le habla): nada de «nadie cruza al santuario».
          if (ctx.flag(F.milestone)) {
            ctx.setFlag(F.observer);
            await lines(ctx, SPEAKER.observer, [
              'Tengo la radio abierta toda la noche. Los Guardianes siguen informando desde sus comarcas.',
              'El cielo sigue roto, pero aquí arriba ya nadie habla de irse.',
            ]);
            // Pista de la pista T14 (la abre Don Evaristo en Correos de Nexo tras el P8; TABLILLAS §4.4).
            if (!ctx.flag(F.letter)) await lines(ctx, SPEAKER.observer, [LAGOS_TEXT.evaristoHint]);
            return;
          }
          if (!ctx.flag(F.observer)) {
            await lines(ctx, SPEAKER.observer, [
              'Del Observatorio Boreal. Tenemos el refugio para las noches de aurora; si necesitas descansar, las literas están libres.',
              'El puente es hielo de la glaciación-eco. Cuando el eco se retiró del norte, el tramo del islote se fundió en una noche.',
              'Desde entonces nadie cruza al santuario. Haría falta nadar, y el agua de estos lagos no perdona.',
            ]);
            ctx.setFlag(F.observer);
            return;
          }
          await lines(ctx, SPEAKER.observer, ['Las literas del refugio están libres. Y la estufa, encendida.']);
        },
      },
    ],
  };
}

// ─────────────────────────────── Genesis ───────────────────────────────

function genesisEvents() {
  const gone = (s) => s.flag(F.genesis);
  const tecnica = async (ctx) => {
    if (!ctx.flag(F.genesisMet)) {
      await lines(ctx, SPEAKER.tecnica, [
        'Buenas tardes. Genesis, sección de campo. No se preocupe: no vamos a entrar en el santuario.',
        'No nos hace falta. El registrador capta desde la orilla todo lo que resuena ahí dentro.',
        'Si usted entra, lo sabremos. Considérelo una colaboración que no ha pedido.',
      ]);
      ctx.setFlag(F.genesisMet);
      return;
    }
    const trials = [F.saber, F.sentir, F.querer].filter((f) => ctx.flag(f)).length;
    if (trials) {
      await lines(ctx, SPEAKER.tecnica, [`Lecturas nuevas: ${trials === 3 ? 'tres picos' : trials === 2 ? 'dos picos' : 'un pico'} de resonancia. Muy limpios. Gracias.`]);
    } else {
      await lines(ctx, SPEAKER.tecnica, ['El registrador sigue en silencio. Cuando empiece a sonar, será por usted.']);
    }
  };
  return [
    {
      id: 'genesis_tecnica', x: CAMP.tecnica.x, y: CAMP.tecnica.y, name: SPEAKER.tecnica,
      pages: [{ when: (s) => !gone(s), sprite: SPRITE.tecnica, dir: CAMP.tecnica.dir, move: 'still', script: tecnica }],
    },
    {
      id: 'genesis_tecnico', x: CAMP.tecnico.x, y: CAMP.tecnico.y, name: SPEAKER.tecnico,
      pages: [{
        when: (s) => !gone(s), sprite: SPRITE.tecnico, dir: CAMP.tecnico.dir, move: 'look',
        script: (ctx) => lines(ctx, SPEAKER.tecnico, [
          'Tres firmas distintas dentro de la misma roca. Saber, sentir, querer, las llama la doctora.',
          'Las grabamos por separado. Algún día alguien sabrá qué hacer con ellas.',
        ]),
      }],
    },
    {
      id: 'genesis_tripode', x: CAMP.tripod.x, y: CAMP.tripod.y, name: 'Registrador',
      pages: [{
        when: (s) => !gone(s), sprite: OBJ.tripod, dir: CAMP.tripod.dir, solid: true, directionFix: true,
        script: async (ctx) => { await ctx.say('Un trípode con un disco de antenas apuntado al islote. En su pantalla, una línea casi plana.'); },
      }],
    },
    ...CAMP.crates.map(([x, y], i) => ({
      id: `genesis_caja_${i}`, x, y, name: 'Caja',
      pages: [{
        when: (s) => !gone(s), sprite: OBJ.crate, ...frame(4 + i), solid: true,
        script: async (ctx) => { await ctx.say('Cajas de instrumentos con el emblema de dos tubos cruzados sobre un círculo.'); },
      }],
    })),
  ];
}

// ─────────────────────────────── Llegada, carteles, objetos, célula y salida sur ───────────────────────────────

async function arrivalScene(ctx) {
  ctx.setFlag(F.arrival);
  await ctx.say(LAGOS_TEXT.arrival);
  await zygardeSays(ctx, LAGOS_TEXT.coreArrival);
}

function southExitEvents() {
  const link = PENDING_LINKS.villa_boreal;
  const out = [];
  for (let x = EXITS.south.x0; x <= EXITS.south.x1; x++) {
    out.push({
      id: `borde_sur_${x}`, x, y: EXITS.south.y, trigger: 'touch', through: true,
      when: () => !mapRegistered(link.to),
      script: async (ctx) => {
        await ctx.say(link.blocked);
        await ctx.move('player', ['up'], { through: false });
      },
    });
  }
  return out;
}

export function lagosEvents() {
  return [
    ...NPC.arrivalStrip.map(([x, y]) => ({
      id: `llegada_${x}`, x, y, trigger: 'touch', through: true, when: (s) => !s.flag(F.arrival), script: arrivalScene,
    })),
    ...martaEvents(),
    observerEvent(),
    ...genesisEvents(),
    examine('cartel_lagos', NPC.sign.x, NPC.sign.y, (s) => (s.flag(F.bridgeA) && s.flag(F.bridgeB) ? LAGOS_TEXT.signAfter : LAGOS_TEXT.sign)),
    // estela del islote (2×2): se lee desde la fila de abajo
    ...[0, 1].map((i) => examine(`estela_lagos_${i}`, SANCTUARY.stele.x + i, SANCTUARY.stele.y + 1, (s) => (s.flag(F.restored) ? LAGOS_TEXT.steleAfter : LAGOS_TEXT.stele))),
    ...LAGOS_ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, hidden: Boolean(it.hidden) })),
    { id: 'celula_lagos_1', type: 'zygardeCell', cell: 'cell_lagos_1', x: CELL_LAGOS.x, y: CELL_LAGOS.y },
    ...southExitEvents(),
  ];
}
