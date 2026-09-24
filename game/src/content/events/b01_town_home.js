// Casa del protagonista (B01 §4.1 y §4.7, D01): despertar, la madre (cura y regalo) y el PC.
// Los textos de la madre son los del guion; los de los muebles son descriptivos y neutros.
import { F, SPEAKER, SPRITE, AUDIO, when, setHomeHealPoint } from './b01_town_common.js';
import { walkToPlayer } from './b01_town_path.js';

const MOM = SPEAKER.mom;

const MOM_INTRO = [
  '¡Buenos días, \\PN! ¿Has dormido algo? Con los temblores de estas noches, ni los Starly del tejado pegaban ojo.',
  'Ah, ha pasado por aquí el profesor Alerce. Dice que te espera en el laboratorio esta mañana.',
  'No sé qué tramáis, pero lo decía con una cara muy seria. …Bueno, ¡él siempre la pone!',
];
const MOM_REST = 'Si alguna vez tus Pokémon están cansados, vuelve a casa. Aquí siempre hay sitio para descansar.';
const MOM_ASK_REST = '¿Descansáis un poco?';
const MOM_GIFT_BYE = 'Por si acaso. Y vuelve de vez en cuando.';

/** Fundido + curación del equipo + ME, y la casa pasa a ser el punto de regreso tras perder. */
export async function restAtHome(ctx) {
  await ctx.fade('out', 16);
  ctx.heal();
  setHomeHealPoint(ctx);
  ctx.me(AUDIO.heal);
  await ctx.wait(90);
  await ctx.fade('in', 16);
}

// ----------------------------------------------------------------------------- planta alta

/** Eventos de la habitación: despertar (auto, una vez) y PC de almacenamiento. */
export function bedroomEvents() {
  return [
    {
      id: 'despertar', x: 0, y: 0, trigger: 'auto',
      when: when({ none: [F.woke] }),
      script: async (ctx) => {
        // Sin sueño explicativo (biblia §5): luz de mañana y el protagonista se levanta.
        setHomeHealPoint(ctx);
        await ctx.wait(30);
        ctx.face('player', 'down');
        ctx.setFlag(F.woke);
      },
    },
    ...[1, 2, 3].map((x) => ({
      id: `pc_${x}`, x, y: 4, trigger: 'action', noOver: true,
      script: usePC,
    })),
  ];
}

async function usePC(ctx) {
  ctx.se('pc_open');
  await ctx.say('\\PN enciende el PC.');
  try {
    await ctx.ui.openStorage();
  } catch (err) {
    console.error('PC de almacenamiento', err);
    await ctx.say('El PC no responde. Inténtalo más tarde.');
  }
  ctx.se('pc_close');
}

// ----------------------------------------------------------------------------- planta baja

/**
 * La madre. Páginas (gana la última que se cumple): charla por defecto → presentación al bajar
 * (auto, una vez) → cura y regalo al volver con la Pokédex (auto, una vez).
 * @param {{x:number,y:number,dir?:number}} pos
 */
export function momEvent(pos) {
  return {
    id: 'mama', x: pos.x, y: pos.y, sprite: SPRITE.mom, dir: pos.dir || 2, move: 'still',
    pages: [
      { when: () => true, trigger: 'action', script: momTalk },
      { when: when({ all: [F.woke], none: [F.metMom] }), trigger: 'auto', script: momIntro },
      { when: when({ all: [F.dex], none: [F.momGift] }), trigger: 'auto', script: momGift },
    ],
  };
}

async function momIntro(ctx) {
  await ctx.emote('mama', '!');
  await walkToPlayer(ctx, 'mama');
  for (const line of MOM_INTRO) await ctx.say(line, { speaker: MOM });
  ctx.setFlag(F.metMom);
}

async function momTalk(ctx) {
  if (!ctx.flag(F.starter) || !ctx.state.party.length) {
    await ctx.say(MOM_REST, { speaker: MOM });
    return;
  }
  const yes = await ctx.confirm(MOM_ASK_REST, { speaker: MOM });
  if (yes) await restAtHome(ctx);
}

async function momGift(ctx) {
  await ctx.emote('mama', '!');
  await walkToPlayer(ctx, 'mama');
  await ctx.say('¡Ya estás de vuelta, \\PN! Anda, que tus Pokémon descansen un poco.', { speaker: MOM });
  await restAtHome(ctx);
  await ctx.giveItem('POTION', 3);
  await ctx.say(MOM_GIFT_BYE, { speaker: MOM });
  ctx.setFlag(F.momGift);
}
