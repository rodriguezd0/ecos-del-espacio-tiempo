// Patio central del Santuario del Alma (docs/CAMPANA.md B16): la bienvenida del trío, el manantial que cura, el
// hexágono sellado del Telar (se abre con las tres Hebras) y las estatuas. Las alas y el Telar tienen su archivo:
// b16_saber.js, b16_sentir.js, b16_querer.js y b16_telar.js.
import { F, SPEAKER, OBJ, TRIO_COLORS, zygardeSays, when, examine, frame, hasAllThreads, pause } from './b16_common.js';
import { PATIO, TELAR } from '../maps/b16/santuario_layout.js';

export const PATIO_TEXT = Object.freeze({
  voices: 'Tres voces suenan a la vez, sin eco, desde las tres puertas del norte.',
  seal: 'En el centro del patio, un hexágono de piedra con tres huecos: uno dorado, uno rosa y uno azul.',
  sealAfter: (n) => (n ? `El hexágono tiene ${n === 1 ? 'un hueco encendido' : `${n} huecos encendidos`}. Faltan los demás.` : 'Un hexágono de piedra con tres huecos apagados: uno dorado, uno rosa y uno azul.'),
  sealOpens: 'Las tres Hebras brillan en tu Mochila y los tres huecos se encienden a la vez. El hexágono se abre hacia arriba en una escalera de luz.',
  sealOpen: 'El hexágono está abierto. La escalera de luz sube hacia el Telar del Alma.',
  spring: 'El agua del manantial está tibia. Tus Pokémon se han recuperado por completo.',
  statue: 'Una estatua sin rostro sostiene una esfera. En la peana: «Lo que se sabe, se siente y se quiere, no se pierde».',
});

async function introScene(ctx) {
  ctx.setFlag(F.sanctuaryIntro);
  await ctx.say(PATIO_TEXT.voices);
  await ctx.say('Quien entra aquí trae lo que ha visto. Veremos si lo recuerda.', { speaker: SPEAKER.uxie });
  await ctx.say('Y lo que ha sentido. Y lo que otros sintieron a su lado.', { speaker: SPEAKER.mesprit });
  await ctx.say('Y lo que quiere, aunque el viento sople en contra.', { speaker: SPEAKER.azelf });
  await zygardeSays(ctx, 'Las tres guardan el octavo. Pide paso a cada una. El orden no importa.');
  await ctx.say(PATIO_TEXT.seal);
}

async function openSeal(ctx) {
  ctx.se('PRSFX- Heal Bell');
  const colors = Object.values(TRIO_COLORS);
  for (const c of colors) {
    ctx.effect?.('softLight', { x: PATIO.seal.x, y: PATIO.seal.y, radius: 60, color: c, intensity: 0.7, fadeIn: 8 })?.remove?.(40);
    await pause(ctx, 16);
  }
  await ctx.flash([255, 240, 246], 20, 180);
  ctx.setFlag(F.telarOpen);
  await ctx.say(PATIO_TEXT.sealOpens);
}

async function goToTelar(ctx) {
  ctx.se('PRSFX- Psych Up');
  const a = TELAR.entry.arrive;
  await ctx.warp(ctx.map.id, a.x, a.y, 8);
}

function sealEvent() {
  const S = PATIO.seal;
  const count = (s) => [F.saber, F.sentir, F.querer].filter((f) => s.flag(f)).length;
  return {
    id: 'sello_telar', x: S.x, y: S.y, name: 'Hexágono',
    pages: [
      ...[0, 1, 2, 3].map((n) => ({
        when: (s) => !s.flag(F.telarOpen) && count(s) === n, sprite: OBJ.seal, ...frame(n), solid: true, trigger: 'action',
        script: async (ctx) => {
          if (hasAllThreads(ctx.state)) {
            await openSeal(ctx);
            await goToTelar(ctx);
            return;
          }
          await ctx.say(PATIO_TEXT.sealAfter(count(ctx.state)));
        },
      })),
      {
        when: (s) => s.flag(F.telarOpen), sprite: OBJ.seal, ...frame(4), solid: true, trigger: 'action',
        glow: { name: 'softLight', radius: 70, intensity: 0.45, pulse: 0.4, color: [255, 214, 228] },
        script: async (ctx) => {
          await ctx.say(PATIO_TEXT.sealOpen);
          if (await ctx.confirm('¿Subir al Telar del Alma?')) await goToTelar(ctx);
        },
      },
    ],
  };
}

function springEvents() {
  const heal = async (ctx) => {
    ctx.heal();
    ctx.me('heal');
    ctx.scene?.refreshFollower?.();
    await ctx.say(PATIO_TEXT.spring);
  };
  // Casillas del manantial desde las que se usa: la de abajo (centro) y las de los lados.
  const s = PATIO.spring;
  return [[s.x + 1, s.y + 2], [s.x, s.y + 1], [s.x + 2, s.y + 1]].map(([x, y], i) => ({
    id: `manantial_alma_${i}`, x, y, trigger: 'action', solid: true, noOver: true, script: heal,
  }));
}

export function patioEvents() {
  return [
    {
      id: 'patio_bienvenida', x: PATIO.exit.arrive.x, y: PATIO.exit.arrive.y,
      pages: [{ when: when({ none: [F.sanctuaryIntro] }), trigger: 'auto', script: introScene }],
    },
    sealEvent(),
    ...springEvents(),
    ...PATIO.statues.map(([x, y], i) => examine(`estatua_patio_${i}`, x, y, PATIO_TEXT.statue)),
  ];
}
