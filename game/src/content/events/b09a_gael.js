// Gael, combate B3 en la escalinata del Museo de las Eras (docs/CAMPANA.md B09 punto 1; §6.2 «seducción de Genesis»;
// §6.3: Staravia 32, Lucario 32, Gabite 31, Absol 32, inicial evolucionado 34 → content/trainers/b09a.js gael_3).
// Continúa la historia aunque el jugador pierda (§2.6, BALANCE): sin pérdida de dinero, equipo curado y otra frase.
import { F, SPEAKER, SPRITE, MUSIC, when, say, lines } from './b09a_common.js';
import { getTrainer } from '../trainers/index.js';
import { SPOTS, STAIRS } from '../maps/b09a/lumina_layout.js';

const G = SPEAKER.gael;

/** Configuración del combate B3 (sin derrota general). */
export function gael3BattleConfig(state) {
  const t = getTrainer('gael_3', state);
  if (!t.party?.length) throw new Error('gael_3 sin Pokémon');
  return { type: 'trainer', trainer: 'gael_3', bgm: MUSIC.rival, canLose: true, rules: { canLose: true, noMoneyLoss: true, canRun: false } };
}

async function stepsScene(ctx) {
  if (ctx.flag(F.gaelB3)) return;
  const gael = ctx.world.events.find((e) => e.id === 'gael_escalinata');
  ctx.bgm('intro_tough');
  if (gael) {
    ctx.face(gael, 'down');
    await ctx.emote(gael, '…');
  }
  const meet = { x: SPOTS.gael.x, y: STAIRS.y + STAIRS.h };
  if (ctx.player.x !== meet.x || ctx.player.y !== meet.y) await ctx.movePlayerTo(meet.x, meet.y, { through: false });
  ctx.face('player', 'up');
  await lines(ctx, G, [
    'Has tardado.',
    'Vértice ha leído mi informe. Entero. Nadie lo había leído entero. Ni siquiera el profesor.',
    'Tres años contando Staravia, y el primero que lo toma en serio es un desconocido con una fundación.',
    '…No me mires así. No he venido a hablar de él.',
    'Combate.',
  ]);
  // Si el combate fallara, la historia sigue como tras una derrota (sin marcar la victoria del jugador).
  let outcome = 'error';
  try {
    outcome = await ctx.battle(gael3BattleConfig(ctx.state));
  } catch (err) {
    console.error('[b09a] combate con Gael (B3)', err);
  }
  ctx.bgm(MUSIC.lumina);
  if (outcome === 'win') {
    ctx.setFlag(F.gaelB3Won);
    await lines(ctx, G, [
      'Sigues por delante. Bien. Así sé hacia dónde mirar.',
      'La curadora te ha pedido algo. Os he visto hablar. Haz lo que tengas que hacer.',
    ]);
  } else {
    ctx.heal();
    await lines(ctx, G, [
      'Esta vez no. …Tampoco cambia nada.',
      'La curadora te ha pedido algo. Os he visto hablar. Ve.',
    ]);
  }
  await say(ctx, G, 'Yo tengo mis propios asuntos.');
  if (gael) {
    await ctx.move(gael, ['down', 'down', 'right', 'down', 'down', 'down', 'right', 'right', 'right', 'right', 'right', 'right'], { through: true, speed: 4 });
    ctx.erase(gael);
  }
  ctx.setFlag(F.gaelB3);
}

/** Gael en la escalinata y la franja del pie de la escalera que dispara la escena (tras la gala). */
export function gaelStepsEvents() {
  const waiting = when({ all: [F.gala], none: [F.gaelB3] });
  const t = SPOTS.gaelTrigger;
  const strip = [];
  for (let x = t.x0; x <= t.x1; x++) strip.push({ id: `escalinata_gael_${x}`, x, y: t.y, trigger: 'touch', through: true, when: waiting, script: stepsScene });
  return [
    { id: 'gael_escalinata', x: SPOTS.gael.x, y: SPOTS.gael.y, name: G, sprite: SPRITE.gael, dir: SPOTS.gael.dir, move: 'still', when: waiting, trigger: 'action', script: stepsScene },
    ...strip,
  ];
}
