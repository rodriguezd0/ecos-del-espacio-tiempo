// T03 «La campana que llama al rayo» (docs/TABLILLAS.md T03; CAMPANA B05): el campanero Sixto, la escalera
// derrumbada del campanario (Embestida), la campana grande con el cable cortado del pararrayos, el rayo de la noche
// que —con los cables de la subestación reconectados (content/events/b05_t03_station.js)— carga la red y hace que
// la campana suelte la Tablilla, la horda de Elekid, la Tabla Trueno (ZAPPLATE), la Raichuita X y la luz a medias
// de Brontia (b05_brontia_luz). Reintento: nada se pierde (la Tablilla espera; la horda vuelve a salir).
import { F, SPEAKER, SPRITE, say, isNight } from './b05_common.js';
import { strikeFx, applyBlackout } from './b05_brontia_night.js';
import { ELEKID_HORDE } from '../encounters/b05.js';

/** Coordenadas del interior del campanario (content/maps/b05/brontia_campanario.js). */
export const BELFRY = Object.freeze({
  width: 20, height: 13,
  groundRoom: { x: 1, y: 1, w: 9, h: 10 }, // planta baja: suelo y 4–10
  bellRoom: { x: 12, y: 1, w: 7, h: 8 }, // campanil: suelo y 4–8
  door: { x: 5, y: 10 }, // felpudo central de la salida
  stairsUp: { stamp: 'escalera_subir_der', x: 8, y: 3, warp: { x: 8, y: 4 }, arrive: { x: 7, y: 4, dir: 4 } },
  stairsDown: { stamp: 'escalera_bajar_der', x: 17, y: 3, warp: { x: 17, y: 4 }, arrive: { x: 16, y: 4, dir: 4 } },
  rubble: [{ x: 7, y: 4 }, { x: 8, y: 5 }],
  sixto: { x: 3, y: 6, dir: 2 },
  sixtoTop: { x: 18, y: 7, dir: 4 },
  bell: { x: 15, y: 5 },
  cable: [{ x: 12, y: 5 }, { x: 12, y: 6 }],
  tablet: { x: 15, y: 7 },
  elekid: [{ x: 13, y: 7, dir: 6 }, { x: 17, y: 7, dir: 4 }, { x: 14, y: 8, dir: 6 }],
});

const T = Object.freeze({
  sixtoIntro: [
    '¿Vienes por el rayo? Todos vienen por el rayo. Nadie viene por la campana.',
    'Cada noche cae un rayo en el campanario, sin tormenta.',
    'Llevo sesenta años tocando esa campana. Mi padre la tocó antes que yo. Y ahora el cielo la castiga cada noche.',
    'El pueblo quiere derribar la torre. Dicen que atrae la desgracia.',
    'Y yo ya ni puedo subir: con los temblores se vino abajo la escalera. Ahí la tienes, hecha escombros.',
  ],
  sixtoRubble: 'Esos cascotes no los mueve ni un Pokémon fuerte. Lo intentaron los mozos del pueblo.',
  sixtoWait: 'Si de verdad hubiera algo ahí arriba, en mi campana… Pero ¿qué va a haber? Bronce y años.',
  sixtoCircuit: '¿La línea del pararrayos? Se cortó hace mucho, cuando la subestación dejó de usarla. Mi padre decía que el rayo, bien llevado, daba luz.',
  sixtoStrike: '¡Has oído? ¡La campana ha sonado sola! Sube tú, que yo no puedo. Y ten cuidado.',
  sixtoDone: 'Cada hora en punto, como antes. Que la oiga todo el pueblo.',
  cable: 'Un cable de cobre baja por la pared desde el pararrayos del chapitel… y termina cortado en el suelo. Una placa dice: «LÍNEA A LA SUBESTACIÓN».',
  bell: 'La campana grande. El bronce está tibio y, muy dentro, algo chisporrotea.',
  bellCharged: 'La campana todavía vibra. Bajo ella brilla algo.',
  bellDone: 'La campana grande, en silencio hasta la próxima hora.',
  hordeIntro: '¡La losa chisporrotea! Algo la ha estado esperando…',
  hordeRun: 'Los Elekid siguen rondando la losa. No dejan acercarse.',
  hordeSecond: '¡Queda otro Elekid!',
});

/** Tras la batalla, ¿cuenta como superada? (vencer o capturar). */
const passed = (outcome) => outcome === 'win' || outcome === 'caught';

/** Horda de Elekid: un combate doble (21 y 22) y el tercero (23). Si el doble falla, combates sucesivos. */
export async function elekidHorde(ctx) {
  const [a, b, c] = ELEKID_HORDE.levels;
  const sp = ELEKID_HORDE.species;
  let out = await ctx.battle({ type: 'wild', format: 'double', opponent: { party: [{ species: sp, level: a }, { species: sp, level: b }] } });
  if (out === 'forfeit') {
    out = await ctx.wildBattle({ species: sp, level: a });
    if (passed(out)) out = await ctx.wildBattle({ species: sp, level: b });
  }
  if (!passed(out)) return out;
  await ctx.say(T.hordeSecond);
  return ctx.wildBattle({ species: sp, level: c });
}

/** Escena final en el campanil: Sixto sube y toca la campana; entrega la Raichuita X. */
async function sixtoRings(ctx) {
  await ctx.fade('out', 16);
  ctx.setFlag(F.t03Done);
  await ctx.wait(10);
  await ctx.fade('in', 16);
  await say(ctx, SPEAKER.sixto, 'He subido como he podido… ¿Qué es eso que tienes en la mano?');
  await say(ctx, SPEAKER.sixto, 'Una losa. Dentro de mi campana. Tantas noches con miedo a mi propia campana, y el rayo solo venía a buscar esto.');
  await say(ctx, SPEAKER.sixto, 'Déjame. Hace mucho que no la toco.');
  const bell = ctx.world.events.find((e) => e.id === 'campana');
  if (bell) { bell.stepAnime = true; bell.setMoveSpeed?.(3); }
  for (let i = 0; i < 3; i++) { ctx.se('PRSFX- Heal Bell', { volume: 90 }); await ctx.wait(40); }
  if (bell) { bell.stepAnime = false; bell.pattern = 0; }
  await say(ctx, SPEAKER.sixto, 'Así suena Brontia.');
  await say(ctx, SPEAKER.sixto, 'Toma. Mi padre la encontró al pie de la torre la noche de la gran tormenta, hace muchos años. Decía que atraía al rayo. Ya no me hace falta.');
  ctx.setFlag(F.raichuita);
  await ctx.giveItem('RAICHUITEX', 1);
}

/** Recoger la Tablilla del campanil: horda de Elekid, Tabla Trueno y escena de Sixto. */
async function takeTablet(ctx) {
  await ctx.say(T.hordeIntro);
  const pos = BELFRY.elekid;
  for (const [i] of pos.entries()) ctx.setVar(`b05_elekid_${i}`, 1);
  ctx.cry('ELEKID');
  for (let i = 0; i < pos.length; i++) await ctx.emote(`elekid_${i}`, '!');
  const out = await elekidHorde(ctx);
  if (!passed(out)) {
    for (let i = 0; i < pos.length; i++) ctx.setVar(`b05_elekid_${i}`, 0);
    if (out === 'run') await ctx.say(T.hordeRun);
    return; // derrota: el jugador vuelve al punto de cura; la losa sigue aquí (TABLILLAS §4.8)
  }
  for (let i = 0; i < pos.length; i++) ctx.setVar(`b05_elekid_${i}`, 0);
  ctx.setFlag(F.horde);
  await ctx.story.giveTablet('ZAPPLATE');
  await sixtoRings(ctx);
}

/** Eventos del interior del campanario. */
export function belfryEvents() {
  const B = BELFRY;
  const out = [];
  // Escombros de la escalera (Embestida): se rompen juntos.
  B.rubble.forEach((r, i) => out.push({
    id: `escombros_${i}`, type: 'ramRock', x: r.x, y: r.y, group: 'escombros_escalera',
    sprite: SPRITE.barrier, dir: 2, directionFix: true, stepAnime: true,
    blockedText: 'La escalera del campanario se ha venido abajo: los cascotes tapan los primeros peldaños. Tienen una fisura blanca.',
  }));
  // Sixto (planta baja) y Sixto arriba (tras la Tablilla).
  out.push({
    id: 'sixto', x: B.sixto.x, y: B.sixto.y, name: SPEAKER.sixto, sprite: SPRITE.sixto, dir: B.sixto.dir, move: 'look',
    when: (s) => !s?.flag(F.t03Done),
    script: async (ctx) => {
      if (!ctx.flag(F.sixto)) {
        for (const line of T.sixtoIntro) await say(ctx, SPEAKER.sixto, line);
        ctx.setFlag(F.sixto);
        await ctx.story.openClue('T03', { direct: true });
        return;
      }
      if (ctx.flag(F.strike)) { await say(ctx, SPEAKER.sixto, T.sixtoStrike); return; }
      if (ctx.flag(F.belfry)) { await say(ctx, SPEAKER.sixto, T.sixtoCircuit); return; }
      if (!ctx.selfSwitch('A', 'escombros_0')) { await say(ctx, SPEAKER.sixto, T.sixtoRubble); return; }
      await say(ctx, SPEAKER.sixto, T.sixtoWait);
    },
  });
  out.push({
    id: 'sixto_arriba', x: B.sixtoTop.x, y: B.sixtoTop.y, name: SPEAKER.sixto, sprite: SPRITE.sixto, dir: B.sixtoTop.dir, move: 'look',
    when: (s) => Boolean(s?.flag(F.t03Done)),
    script: async (ctx) => { await say(ctx, SPEAKER.sixto, T.sixtoDone); },
  });
  // Campana grande (quieta; con chispas tras el rayo) y cable cortado del pararrayos.
  out.push({
    id: 'campana', x: B.bell.x, y: B.bell.y, sprite: 'asset:objects/b05_campana.png', dir: 2, directionFix: true, walkAnime: false, solid: true, shadow: false, speed: 4,
    pages: [
      { script: async (ctx) => { await ctx.say(T.bell); ctx.setFlag(F.belfry); } },
      { when: (s) => s?.flag(F.strike) && !s.flag(F.t03Done), dir: 4, stepAnime: true, light: { radius: 80, intensity: 0.8 }, script: async (ctx) => { await ctx.say(T.bellCharged); } },
      { when: (s) => Boolean(s?.flag(F.t03Done)), dir: 2, script: async (ctx) => { await ctx.say(T.bellDone); } },
    ],
  });
  B.cable.forEach((c, i) => out.push({
    id: `cable_${i}`, x: c.x, y: c.y, sprite: SPRITE.board, dir: 8, pattern: 3, directionFix: true, walkAnime: false, shadow: false, solid: true,
    trigger: 'action', script: async (ctx) => { await ctx.say(T.cable); ctx.setFlag(F.belfry); },
  }));
  // La Tablilla bajo la campana (tras el rayo) y la horda de Elekid.
  out.push({
    id: 'tablilla_trueno', x: B.tablet.x, y: B.tablet.y,
    when: (s) => s?.flag(F.strike) && !s.flag(F.t03Done),
    sprite: 'asset:objects/b05_tablilla.png', dir: 2, stepAnime: true, directionFix: true, walkAnime: false, speed: 3, shadow: false,
    light: { radius: 56, intensity: 0.9 }, trigger: 'action', script: takeTablet,
  });
  B.elekid.forEach((e, i) => out.push({
    id: `elekid_${i}`, x: e.x, y: e.y, when: (s) => Number(s?.var(`b05_elekid_${i}`, 0)) === 1,
    sprite: 'follower:ELEKID', dir: e.dir, stepAnime: true, through: true,
  }));
  return out;
}

/**
 * Exterior de Brontia: la noche en que el rayo cae con la línea reconectada. Cae el rayo, se encienden las farolas
 * (luz a medias), la campana suena sola y Zygarde nota que algo se ha soltado arriba.
 */
export function strikeEvents() {
  return [{
    id: 'escena_rayo', x: 0, y: 1, through: true,
    when: (s) => isNight(s) && s.flag(F.circuit) && !s.flag(F.strike),
    trigger: 'auto',
    script: async (ctx) => {
      await ctx.wait(20);
      await ctx.camera.pan(25, 12, 40);
      await ctx.wait(30);
      await strikeFx(ctx, { power: 2 });
      await ctx.wait(10);
      ctx.se('PRSFX- Thunderbolt1', { volume: 80 });
      await ctx.flash([255, 240, 150], 16, 180);
      ctx.setFlag(F.strike);
      ctx.setFlag(F.light);
      applyBlackout(ctx);
      await ctx.wait(20);
      for (let i = 0; i < 2; i++) { ctx.se('PRSFX- Heal Bell', { volume: 80 }); await ctx.wait(36); }
      await say(ctx, SPEAKER.sixto, '¡La campana! ¡Ha sonado sola!');
      await ctx.say(ctx.flag(F.p3)
        ? 'El rayo baja por la línea hasta la subestación. Esta vez, ni una farola parpadea.'
        : 'Las farolas de Brontia parpadean… y se encienden. Algunas.');
      await ctx.camera.reset(30);
      // Zygarde habla muy poco (autor, 25-09-2026): narración neutra en lugar de la línea del Core.
      await ctx.say('En lo alto del campanario, bajo la campana, algo brilla.');
    },
  }];
}
