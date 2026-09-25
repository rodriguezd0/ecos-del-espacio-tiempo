// Caleta Sonda en el Bloque 13 (docs/CAMPANA.md B13 «Otras acciones»; §2.1 Buceo; TABLILLAS T11): la resonancia del
// Buceo en el extremo del muelle de buzos (hito b13_dive_resonance, casilla prevista por B09b en caleta_layout.js:
// DIVERS.resonance), la segunda pista de T11 (Ramón: su nieta Lucía), la fiesta de los farolillos cuando Lucía vuelve
// (Ramón da la pista del P7, «las luces de la ciudad hundida», y la Clefablita) y Lucía en el faro. Se añaden a los
// eventos de B09b (maps/b09b/caleta_sonda.js y caleta_faro.js) sin cambiar los suyos.
import { reachMilestone } from '../../world/zygarde/scenes.js';
import { F, SPEAKER, SPRITE, OBJ, when, lines, zygardeSays, isNight, findEvent, objectPage, placePlayer } from './b13_common.js';
import { DIVERS } from '../maps/b09b/caleta_layout.js';

const R = { speaker: SPEAKER.ramon };

/** Farolillos de la fiesta en la playa de Caleta (tras T11 se quedan; de noche, encendidos). */
export const FEAST = Object.freeze({
  lanterns: [[14, 21], [19, 23], [26, 23], [30, 22]], // en la arena (la fila 24 ya es la espuma; (27–28, 23), la palmera)
  ramon: { x: 22, y: 22, dir: 2 },
  lucia: { x: 23, y: 22, dir: 2 },
  stand: { x: 22, y: 23, dir: 8 }, // el jugador, en la arena delante de Ramón
});

export const CALETA_B13_TEXT = Object.freeze({
  hint: 'Aquí el agua baja muy honda. Todavía no puedo seguirla.',
  here: 'Aquí. El agua es honda y está quieta.',
  diverWow: '¿Eh? ¿Qué es esa luz verde?',
  diverAfter: '¡Una burbuja! Con eso podrías bajar al bosque de algas sin botella. Ahí, donde el remolino.',
  diverWait: 'La luz se apaga… Vuelve cuando quieras. El muelle no se mueve de aquí.',
  lantern: 'Un farolillo de papel en un poste, junto a la orilla.',
  lanternLit: 'Un farolillo encendido. La fila de luces llega hasta el agua.',
});

// ───────────────────────────── Resonancia del Buceo ─────────────────────────────

async function diveHint(ctx) {
  ctx.setFlag(F.diveHint);
  await zygardeSays(ctx, CALETA_B13_TEXT.hint);
}

async function resonanceScene(ctx) {
  if (ctx.flag(F.diveMilestone)) return;
  ctx.face('player', 'down');
  await zygardeSays(ctx, CALETA_B13_TEXT.here);
  const diver = findEvent(ctx, 'buzo_muelle');
  if (diver) { ctx.turnToPlayer(diver); await ctx.emote(diver, '!'); }
  await ctx.say(CALETA_B13_TEXT.diverWow, { speaker: SPEAKER.diver });
  ctx.se('PRSFX- Dive1', { volume: 60 });
  let bubble = null;
  try {
    bubble = ctx.effect?.('zygardeBubble', { target: ctx.player, size: 110 });
  } catch (err) {
    console.warn('[b13] burbuja de la resonancia', err);
  }
  await ctx.flash([120, 255, 170], 16, 120);
  await ctx.say('El campo verde de Zygarde te envuelve por completo, como una burbuja.');
  const { unlocked } = await reachMilestone(ctx, 'dive');
  ctx.setFlag(F.diveScene);
  bubble?.remove?.(30);
  if (unlocked.includes('dive')) await ctx.say(CALETA_B13_TEXT.diverAfter, { speaker: SPEAKER.diver });
  else await ctx.say(CALETA_B13_TEXT.diverWait, { speaker: SPEAKER.diver });
}

function resonanceEvent() {
  const r = DIVERS.resonance;
  return {
    id: 'resonancia_buceo', x: r.x, y: r.y,
    pages: [
      { through: true },
      { when: when({ all: [F.swimForm], none: [F.core4, F.diveHint] }), through: true, trigger: 'touch', script: diveHint },
      { when: when({ all: [F.core4], none: [F.diveMilestone] }), through: true, trigger: 'touch', script: resonanceScene },
    ],
  };
}

// ───────────────────────────── Fiesta de los farolillos (T11) ─────────────────────────────

const feastReady = when({ all: [F.lumPlate, F.lumLucia], none: [F.lumFeast] });

async function feastScene(ctx) {
  if (ctx.flag(F.lumFeast)) return;
  await ctx.fade('out', 30);
  const s = FEAST.stand;
  if (ctx.player.surfing) {
    // Llegando a nado (desde el islote): a la arena, delante de Ramón; la escena vuelve a empezar al cargar el mapa.
    await ctx.warp(ctx.map.id, s.x, s.y, s.dir, { fade: false });
    return;
  }
  await placePlayer(ctx, s);
  const st = ctx.state;
  const now = st.data?.clock?.minutes ?? 0;
  const delta = ((21 * 60 - (now % 1440)) + 1440) % 1440;
  if (delta > 0) st.advanceMinutes(delta);
  ctx.requestRefresh();
  await ctx.wait(10);
  const ramon = findEvent(ctx, 'ramon_fiesta');
  if (ramon) ctx.face('player', ctx.directionTo(ctx.player, ramon));
  await ctx.fade('in', 30);
  ctx.bgm('Pokeflauta');
  await ctx.say('Esa noche, Caleta Sonda celebra la fiesta de los farolillos.');
  await lines(ctx, SPEAKER.ramon, [
    '¡\\PN! Lucía volvió remando como si nada. Con los ojos como platos y la cabeza llena de Clefairy.',
    'En Caleta, cuando el mar nos devuelve a alguien, se encienden farolillos. Hoy los encendemos por ella. Y por ti.',
  ]);
  await ctx.say('¡Mira, abuelo! Desde aquí se ven las luces del islote.', { speaker: SPEAKER.lucia });
  await ctx.say('Esto lo saqué hace años entre las redes. Brilla como esas luces. Quédatelo.', R);
  await ctx.giveItem('CLEFABLITE', 1);
  await lines(ctx, SPEAKER.ramon, [
    'Y una cosa más. Desde el faro, las noches de marea rara, veo otras luces. Bajo el agua, frente al arrecife.',
    'Como si ahí abajo hubiera una ciudad con las ventanas encendidas.',
    'Las luces de la ciudad hundida. Así las llamaba mi padre.',
  ]);
  await zygardeSays(ctx, 'Allí abajo hay algo que se repite. Como un eco.');
  // Cierre: la fiesta termina y Ramón y Lucía vuelven al faro (sus eventos de la playa desaparecen tras el fundido).
  await ctx.fade('out', 30);
  ctx.setFlag(F.lumFeast);
  ctx.requestRefresh();
  await ctx.wait(10);
  await ctx.fade('in', 30);
  await ctx.say('La fiesta dura hasta tarde. Ramón y Lucía acaban volviendo al faro; los farolillos se quedan en la playa.');
}

function feastEvents() {
  const lit = (s) => Boolean(s?.flag(F.lumFeast) || feastReady(s)) && (isNight(s) || feastReady(s));
  return [
    { id: 'fiesta_farolillos', x: 0, y: 1, trigger: 'auto', when: feastReady, script: feastScene },
    ...FEAST.lanterns.map(([x, y], i) => ({
      id: `farolillo_fiesta_${i}`, x, y, name: 'Farolillo',
      pages: [
        { through: true },
        { when: (s) => Boolean(s?.flag(F.lumFeast)) || feastReady(s), ...objectPage(OBJ.lantern, 2), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CALETA_B13_TEXT.lantern); } },
        { when: lit, ...objectPage(OBJ.lantern, 4, { stepAnime: true }), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CALETA_B13_TEXT.lanternLit); } },
      ],
    })),
    {
      id: 'ramon_fiesta', x: FEAST.ramon.x, y: FEAST.ramon.y, name: SPEAKER.ramon,
      pages: [{ through: true }, { when: feastReady, sprite: SPRITE.ramon, dir: FEAST.ramon.dir, solid: true }],
    },
    {
      id: 'lucia_fiesta', x: FEAST.lucia.x, y: FEAST.lucia.y, name: SPEAKER.lucia,
      pages: [{ through: true }, { when: feastReady, sprite: SPRITE.lucia, dir: FEAST.lucia.dir, solid: true }],
    },
  ];
}

/** Eventos del B13 que se añaden a Caleta Sonda (maps/b09b/caleta_sonda.js). */
export function b13CaletaEvents() {
  return [resonanceEvent(), ...feastEvents()];
}

// ───────────────────────────── Faro Sonda: Ramón y Lucía ─────────────────────────────

/**
 * Ramón en el B13 (se llama antes que su guion de B09b; devuelve true si ha hablado). Con Nadar da la segunda pista de
 * T11 (Lucía no ha vuelto); tras la fiesta, su frase de después.
 */
export async function ramonB13(ctx) {
  if (ctx.flag(F.lumFeast)) {
    await lines(ctx, SPEAKER.ramon, [
      'Lucía no para de hablar de los Clefairy. Dice que de mayor será farera. O bailarina. Según el día.',
      'Si bajas al arrecife, fíjate en las luces. Yo ya no tengo edad para bucear.',
    ]);
    return true;
  }
  if (ctx.flag(F.lumLucia)) {
    await ctx.say('¡Lucía ha vuelto! Esta noche encendemos los farolillos en la playa. Tienes que estar.', R);
    return true;
  }
  if (!ctx.state.zygardeAbility('swim')) return false;
  if (!ctx.flag(F.lumRamon)) {
    if (!ctx.flag('b09_caleta_ramon_t11')) {
      await ctx.say('En el islote de enfrente bailan luces desde que la luna está rara.', R);
      ctx.setFlag('b09_caleta_ramon_t11');
    }
    await lines(ctx, SPEAKER.ramon, [
      'Y ahora es peor. Mi nieta, Lucía, siguió a los Clefairy hasta el islote. Cogió la barca de remos… y no ha vuelto.',
      'Anoche la vi desde aquí arriba, en el claro, entre las luces. «Bailan sin parar», me dijo antes de irse.',
      'Yo ya no cruzo ese trecho a nado. Tú… tú sí puedes. Por favor.',
    ]);
    const status = ctx.story.clueStatus('T11');
    if (status !== 'active' && status !== 'solved') await ctx.story.openClue('T11', { direct: true });
    await ctx.story.advanceClue('T11', 2);
    ctx.setFlag(F.lumRamon);
    return true;
  }
  await ctx.say('El islote está al suroeste. Sigue la fila de boyas con farolillos. De noche se encienden.', R);
  return true;
}

/** Lucía en el faro, de vuelta en casa (tras la gruta). */
export function lighthouseEvents() {
  return [{
    id: 'lucia_faro', x: 2, y: 6, name: SPEAKER.lucia,
    pages: [
      { through: true },
      {
        when: when({ all: [F.lumLucia] }), sprite: SPRITE.lucia, dir: 2, move: 'look', solid: true, trigger: 'action',
        script: async (ctx) => { await lines(ctx, SPEAKER.lucia, ['Los Clefairy siguen bailando de noche. Ahora ya no los sigo… mucho.']); },
      },
    ],
  }];
}
