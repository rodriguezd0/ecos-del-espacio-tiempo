// La herrería de los Solano y el Mega Aro (docs/CAMPANA.md B07 y X14; TABLILLAS T04 «Consecuencia»): Bea monta la
// piedra activadora en un anillo en la fragua; Alerce la examina («Es una Piedra Activadora. Responde a los lazos…
// Te va a hacer falta.») → MEGARING. Mientras, los canteros y los Timburr despejan el camino de Estrato. Tras la
// escena la Megaevolución funciona en combate (battle/scene/setup.js lee MEGARING de la mochila; tecla E).
import { F, SPEAKER, SPRITE, OBJ, say, lines, eventById, routeTo } from './b07_common.js';
import { restSpotEvent } from '../services/inn.js';
import { HERRERIA } from '../maps/b07/layout.js';

const H = HERRERIA;
const HEADLESS = typeof document === 'undefined';

export const MEGARING_TEXT = Object.freeze({
  got: '¡Has obtenido el Mega Aro!',
  tutorial: 'Con el Mega Aro, un Pokémon que lleve equipada su megapiedra puede megaevolucionar una vez por combate. Al elegir su movimiento, pulsa E para activarlo.',
  forge: 'La fragua de la herrería. Las brasas no se apagan nunca del todo.',
  forgeLit: 'La fragua ruge. Bea la tiene a pleno fuego.',
  anvil: 'Un yunque viejo sobre un tocón de encina, lleno de marcas de martillo.',
  bed: '¿Quieres echarte un rato en el catre de la herrería?',
  tools: 'Martillos, tenazas y cinceles de cantero, colgados por tamaños.',
});

/** Presentación del objeto (rayos y mensaje) con la del agente de historia; en Node, solo el mensaje. */
async function presentRing(ctx) {
  let handle = null;
  if (!HEADLESS) {
    try {
      const fx = await import('../story/storyFx.js');
      handle = fx.openObtain({ item: 'MEGARING', color: [255, 214, 120] });
      await handle.ready;
    } catch (err) {
      console.error('[b07] Presentación del Mega Aro', err);
      handle = null;
    }
  }
  ctx.me('key_item_get');
  try {
    await ctx.say(MEGARING_TEXT.got);
  } finally {
    if (handle) await handle.close();
  }
}

/** Entrega el Mega Aro (objeto clave) con su presentación. → true si era nuevo. */
export async function giveMegaRing(ctx) {
  if (ctx.state.hasKeyItem('MEGARING')) return false;
  ctx.state.addKeyItem('MEGARING');
  ctx.requestRefresh();
  await presentRing(ctx);
  return true;
}

async function hammer(ctx, anvil) {
  for (let k = 0; k < 3; k++) {
    ctx.se('PRSFX- Metal Sound', { volume: 80 });
    ctx.shake(1, 8, 6);
    await ctx.flash([255, 190, 110], 6, 120);
    await ctx.wait(16);
  }
  if (anvil) anvil.direction = 4;
  ctx.se('PRSFX- Rock Polish');
}

/** Escena del anillo: al entrar en la herrería después del rescate. */
export async function ringScene(ctx) {
  if (ctx.flag(F.megaring) || !ctx.flag(F.rescate)) return;
  const bea = eventById(ctx, 'bea_herreria');
  const alerce = eventById(ctx, 'alerce_herreria');
  const anvil = eventById(ctx, 'yunque');
  await ctx.movePlayerTo(H.playerRing.x, H.playerRing.y, { through: true, speed: 3.5 });
  ctx.face('player', 'up');
  await say(ctx, SPEAKER.bea, 'Pasa, pasa. Ya casi está.');
  if (bea) ctx.face(bea, 'left');
  await hammer(ctx, anvil);
  await lines(ctx, SPEAKER.bea, [
    'Un aro de hierro de la fragua y tu piedra en el centro, bien engastada. Como los hacía mi abuelo.',
  ]);
  if (bea) bea.turnToward(ctx.player);
  await say(ctx, SPEAKER.bea, 'Para ti. Póntelo, que te lo has ganado.');
  if (alerce) alerce.turnToward({ x: H.anvil.x, y: H.anvil.y });
  await say(ctx, SPEAKER.alerce, 'Déjame verlo un momento.');
  await ctx.wait(40);
  await say(ctx, SPEAKER.alerce, 'Es una Piedra Activadora. Responde a los lazos…');
  await ctx.wait(30);
  if (alerce) alerce.turnToward(ctx.player);
  await say(ctx, SPEAKER.alerce, 'Te va a hacer falta.');
  if (anvil) anvil.direction = 2;
  await giveMegaRing(ctx);
  await ctx.say(MEGARING_TEXT.tutorial);
  ctx.setFlag(F.megaring);
  await ctx.wait(20);
  ctx.se('Mining collapse', { volume: 40 });
  await lines(ctx, SPEAKER.bea, [
    '¿Oyes eso? Son los Timburr en el camino. Ya están sacando las últimas piedras del derrumbe.',
    'En un rato Estrato vuelve a tener paso. Y tú, a tener camino.',
  ]);
  ctx.setFlag(F.ruta);
  await say(ctx, SPEAKER.alerce, 'Tengo que volver al laboratorio. Id con cuidado.');
  if (alerce) {
    await ctx.move(alerce, routeTo(alerce.x, alerce.y, H.entry.x, H.entry.y).concat(['down']), { through: true, speed: 3.5 });
    ctx.se('Door exit');
    ctx.erase(alerce);
  }
  ctx.setFlag(F.alerceFuera);
}

export function herreriaEvents() {
  const forgeBase = { directionFix: true, walkAnime: false, solid: true, trigger: 'action', shadow: false };
  return [
    {
      id: 'fragua', x: H.forge.x, y: H.forge.y, name: 'Fragua',
      pages: [
        { ...forgeBase, sprite: OBJ.forge, dir: 2, stepAnime: true, speed: 2, light: { radius: 56, intensity: 0.6 }, script: async (ctx) => { await ctx.say(MEGARING_TEXT.forge); } },
        { ...forgeBase, when: (s) => Boolean(s?.flag(F.rescate)) && !s.flag(F.megaring), sprite: OBJ.forge, dir: 4, stepAnime: true, speed: 4, light: { radius: 88, intensity: 0.9 }, script: async (ctx) => { await ctx.say(MEGARING_TEXT.forgeLit); } },
      ],
    },
    { id: 'fragua_i', x: H.forge.x - 1, y: H.forge.y, solid: true, noOver: true, trigger: 'action', script: async (ctx) => { await ctx.say(MEGARING_TEXT.forge); } },
    { id: 'fragua_d', x: H.forge.x + 1, y: H.forge.y, solid: true, noOver: true, trigger: 'action', script: async (ctx) => { await ctx.say(MEGARING_TEXT.forge); } },
    {
      id: 'yunque', x: H.anvil.x, y: H.anvil.y, name: 'Yunque', sprite: OBJ.anvil, dir: 2, directionFix: true, walkAnime: false,
      solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MEGARING_TEXT.anvil); },
    },
    {
      id: 'bea_herreria', x: H.bea.x, y: H.bea.y, name: SPEAKER.bea,
      pages: [{
        when: (s) => Boolean(s?.flag(F.rescate)), sprite: SPRITE.bea, dir: H.bea.dir, move: 'look', trigger: 'action',
        script: async (ctx) => {
          if (!ctx.flag(F.megaring)) { await ringScene(ctx); return; }
          await lines(ctx, SPEAKER.bea, [
            'El Mega Aro solo despierta si tu Pokémon lleva su megapiedra. Cuando des con una, ya sabes: en combate, al elegir el movimiento.',
            'Y cuídalo, que es hierro de Solano.',
          ]);
        },
      }],
    },
    {
      id: 'alerce_herreria', x: H.alerce.x, y: H.alerce.y, name: SPEAKER.alerce,
      pages: [{
        when: (s) => Boolean(s?.flag(F.rescate)) && !s.flag(F.alerceFuera), sprite: SPRITE.alerce, dir: H.alerce.dir, trigger: 'action',
        script: async (ctx) => { if (!ctx.flag(F.megaring)) await ringScene(ctx); },
      }],
    },
    {
      id: 'escena_anillo', x: 0, y: 0, through: true, trigger: 'auto',
      when: (s) => Boolean(s?.flag(F.rescate)) && !s.flag(F.megaring), script: ringScene,
    },
    { ...restSpotEvent('catre', H.cot.x, H.cot.y, { kind: 'bed', message: MEGARING_TEXT.bed }) },
  ];
}
