// Regreso a Villa Alba (docs/CAMPANA.md B11, pasos 2–4; §5.5 escalera de Alerce, escena 6; §6 Gael):
//   · Villa Alba: primer regreso a casa tras el P5 (Zygarde mira el Monte) y una vecina que ha oído voces en el
//     laboratorio.
//   · Casa: Mamá entrega el huevo de Togepi («Una Togepi puso un huevo en el jardín y no ha vuelto. Creo que es para
//     ti.»). Si el equipo está lleno, lo guarda hasta que haya sitio (CAMPANA §2.6: los regalos esperan).
//   · Laboratorio: Gael se enfrenta a Alerce («Usted sabía quiénes eran desde el principio.» / «Sabía de qué eran
//     capaces.») y se va hacia el Monte.
// Villa Alba, la casa y el laboratorio son mapas del Bloque 1: los añaden con una línea (edición mínima y aditiva).
import { F, SPEAKER, SPRITE, when, lines, zygardeSays, byGender, pause } from './b11_common.js';
import { walkToPlayer } from './b01_town_path.js';
import { restAtHome } from './b01_town_home.js';
import { createEgg, addEggToParty, EGG_TEXT } from '../../world/eggs.js';

const P5 = 'p5_restored';

export const HOME_TEXT = Object.freeze({
  village: 'Tu pueblo. Desde aquí se ve el Monte.',
  neighbor: '¿Has visto a Gael? Ha entrado en el laboratorio hace un rato. Se le oía desde la calle.',
  neighborAfter: 'Gael salió del laboratorio sin mirar a nadie. Iba hacia la Ruta 1, a paso ligero.',
  mom: {
    hello: (s) => `¡\\PN! ¡Qué alegría verte! Estás más ${byGender(s, 'moreno', 'morena')}. …Y más ${byGender(s, 'alto', 'alta')}, ¿puede ser?`,
    egg: 'Una Togepi puso un huevo en el jardín y no ha vuelto. Creo que es para ti.',
    full: 'Uy, llevas el equipo completo. Te lo guardo aquí, bien calentito. Cuando tengas sitio, vuelve a por él.',
    later: '¡Ya tienes sitio! Toma, el huevo de la Togepi. Lo he tenido junto a la estufa.',
    walk: 'Dicen que los huevos se abren antes si se pasean mucho. Tú caminas mucho, ¿no?',
    rest: '¿Descansáis un poco antes de iros?',
    gael: 'Por cierto, Gael ha pasado por aquí hace un rato. Muy serio. Iba hacia el laboratorio.',
  },
  lab: {
    gael1: 'El Consorcio. La Fundación Meridiano. Genesis.',
    gael2: 'Usted sabía quiénes eran desde el principio.',
    alerce: 'Sabía de qué eran capaces.',
    lia: 'Antes de que llegaras ha dicho que iba a subir al Monte del Portal. Solo.',
    alerce2: 'Siento que hayas tenido que oír esto, \\PN. Ve con cuidado.',
    // Al volver a hablarle (b01_town_lab.js#alerceTalk): antes y después del combate B4 (hasta el P6).
    alerceLater: 'Gael ha ido hacia el Monte del Portal. …Ve con cuidado, \\PN.',
    alerceMonte: 'El Monte del Portal no es sitio para subir con prisa. Ve con cuidado, \\PN.',
  },
});

// ------------------------------------------------------------------ Villa Alba

/** Eventos que añade Villa Alba (villa_alba.js). */
export function b11VillaAlbaEvents() {
  return [
    {
      id: 'b11_regreso', x: 0, y: 0, trigger: 'auto', when: when({ all: [P5], none: [F.homeReturn] }),
      script: async (ctx) => {
        ctx.setFlag(F.homeReturn);
        await pause(ctx, 20);
        await zygardeSays(ctx, HOME_TEXT.village);
      },
    },
    {
      id: 'b11_vecina_lab', x: 38, y: 20, name: SPEAKER.vecina,
      pages: [
        { when: when({ all: [P5], none: [F.gaelAlerce] }), sprite: SPRITE.vecina, dir: 4, move: 'look', trigger: 'action', script: async (ctx) => { await ctx.say(HOME_TEXT.neighbor, { speaker: SPEAKER.vecina }); } },
        { when: when({ all: [F.gaelAlerce], none: [F.gaelB4] }), sprite: SPRITE.vecina, dir: 2, move: 'look', trigger: 'action', script: async (ctx) => { await ctx.say(HOME_TEXT.neighborAfter, { speaker: SPEAKER.vecina }); } },
      ],
    },
  ];
}

// ------------------------------------------------------------------ casa: el huevo de Togepi

const eggPending = (s) => Boolean(s) && s.flag(P5) && !s.flag(F.eggGiven)
  && (!s.flag(F.eggWaiting) || s.party.length < 6);

async function giveEgg(ctx) {
  const egg = createEgg(ctx.db, 'TOGEPI', { ot: { name: ctx.state.player.name, id: ctx.state.player.id }, metMap: 'villa_alba' });
  if (!addEggToParty(ctx.state, egg)) return false;
  ctx.me?.('egg_get');
  await ctx.say(EGG_TEXT.received);
  ctx.setFlag(F.eggGiven);
  return true;
}

async function eggScene(ctx) {
  const M = HOME_TEXT.mom;
  await ctx.emote('mama', '!');
  await walkToPlayer(ctx, 'mama');
  const waiting = ctx.flag(F.eggWaiting);
  if (!waiting) {
    await ctx.say(M.hello(ctx.state), { speaker: SPEAKER.mom });
    await ctx.say(M.egg, { speaker: SPEAKER.mom });
  } else {
    await ctx.say(M.later, { speaker: SPEAKER.mom });
  }
  if (!ctx.flag(F.homeReturn)) ctx.setFlag(F.homeReturn);
  if (!(await giveEgg(ctx))) {
    ctx.setFlag(F.eggWaiting);
    await ctx.say(M.full, { speaker: SPEAKER.mom });
    await gaelHint(ctx);
    return;
  }
  await ctx.say(M.walk, { speaker: SPEAKER.mom });
  await gaelHint(ctx);
  if (await ctx.confirm(M.rest)) await restAtHome(ctx);
}

/** Primera visita (antes de la escena del laboratorio): Mamá encamina hacia Gael y Alerce. */
async function gaelHint(ctx) {
  if (ctx.flag(F.gaelAlerce) || ctx.flag('b11_mama_gael')) return;
  ctx.setFlag('b11_mama_gael');
  await ctx.say(HOME_TEXT.mom.gael, { speaker: SPEAKER.mom });
}

/** Eventos que añade la casa del protagonista (casa_prota_1f.js). */
export function b11HomeEvents() {
  return [{ id: 'b11_huevo', x: 0, y: 0, trigger: 'auto', when: eggPending, script: eggScene }];
}

// ------------------------------------------------------------------ laboratorio: Gael y Alerce

const LAB_GAEL = Object.freeze({ x: 10, y: 10, dir: 8 });

async function labScene(ctx) {
  const L = HOME_TEXT.lab;
  ctx.bgm?.('Amenaza', { fadeOutPrevious: 30 });
  ctx.face('player', 'up');
  ctx.face('alerce', 'down');
  await pause(ctx, 30);
  await ctx.say(L.gael1, { speaker: SPEAKER.gael });
  await ctx.say(L.gael2, { speaker: SPEAKER.gael });
  await pause(ctx, 40);
  await ctx.say(L.alerce, { speaker: SPEAKER.alerce });
  await ctx.emote('b11_gael_lab', '…');
  await pause(ctx, 20);
  // Gael se va sin decir nada más; al pasar junto al jugador lo mira un instante.
  await ctx.move('b11_gael_lab', ['down', 'down'], { through: true });
  ctx.face('b11_gael_lab', 'left');
  await pause(ctx, 30);
  await ctx.move('b11_gael_lab', ['down'], { through: true });
  ctx.se?.('door_exit');
  ctx.erase('b11_gael_lab');
  ctx.setFlag(F.gaelAlerce);
  ctx.face('player', 'up');
  await ctx.say(L.lia, { speaker: SPEAKER.lia });
  await ctx.say(L.alerce2, { speaker: SPEAKER.alerce });
  ctx.bgm?.('lab', { fadeOutPrevious: 30 });
}

/** Eventos que añade el laboratorio (laboratorio_alerce.js). */
export function b11LabEvents() {
  const pending = when({ all: [P5], none: [F.gaelAlerce] });
  return [
    { id: 'b11_gael_lab', x: LAB_GAEL.x, y: LAB_GAEL.y, name: 'Gael', pages: [{ when: pending, sprite: SPRITE.gael, dir: LAB_GAEL.dir, move: 'still' }] },
    { id: 'b11_escena_lab', x: 0, y: 0, trigger: 'auto', when: pending, script: labScene },
  ];
}

/**
 * Línea de Alerce al volver a hablarle tras la escena (la usa b01_town_lab.js#alerceTalk): hasta el P6, según se
 * haya combatido ya con Gael al pie del Monte. null = la línea que corresponda a otro bloque.
 */
export function alerceB11Line(state) {
  if (!state?.flag(F.gaelAlerce) || state.flag('p6_restored')) return null;
  return state.flag(F.gaelB4) ? HOME_TEXT.lab.alerceMonte : HOME_TEXT.lab.alerceLater;
}

export { lines };
