// Añadidos del Bloque 14 en Caleta Sonda (mapa de B09b; docs/CAMPANA.md B14 «Problema humano: las mareas del eco se
// llevan a los pescadores de Caleta Sonda durante horas; vuelven con monedas antiguas. El joven buzo Fausto no ha
// vuelto»): Tobías (volvió con monedas) y Carmela, la madre de Fausto, en la playa; el remolino del Arrecife del Eco
// en el agua del suroeste; Fausto, de vuelta, tras despertar en el eco; y la escena de después del P7 (las mareas a su
// hora, el ferri, el hielo-eco del norte). Se añaden al mapa con `...b14CaletaEvents()` (edición mínima en B09b).
// Módulo puro salvo los guiones.
import { CALETA, ARRECIFE } from '../maps/b14/layout.js';
import { F, SPEAKER, SPRITE, lines, byGender, placePlayer, pause } from './b14_common.js';

const C = CALETA;
const onLand = (ev) => !ev?.world?.player?.surfing;
const restored = (s) => Boolean(s?.flag(F.restored));

export const CALETA_B14_TEXT = Object.freeze({
  intro: {
    tobias1: [
      '¡Otra vez la marea! Salí a faenar al alba y la mar me arrastró… Tres horas, dice mi mujer. A mí me parecieron minutos.',
      'Y mira lo que traía en la red: monedas. Monedas de un sitio que no conoce nadie.',
    ],
    carmela: [
      'Monedas… A mí la marea me ha quitado a mi hijo.',
      'Fausto bajó al arrecife hace tres días, a buscar unas luces verdes junto a la muralla hundida. No ha vuelto.',
      'Los buzos dicen que ahí abajo el agua ya no se porta como agua. Que la marea se lleva a la gente… a otro día.',
    ],
    tobias2: (s) => `¿Vas a bajar, ${byGender(s, 'chaval', 'chavala')}? Toma, por si te trae suerte. A mí no me la ha traído.`,
    carmela2: 'El remolino del arrecife está al suroeste, pasado el embarcadero. Si lo encuentras… dile que vuelva a casa.',
  },
  carmelaWait: ['El remolino del arrecife está al suroeste, pasado el embarcadero.', 'Por favor. Es lo único que tengo.'],
  carmelaBack: ['¡Ha vuelto! Llegó empapado, diciendo que había vivido la misma mañana cien veces.', 'No sé qué hiciste ahí abajo. Gracias.'],
  carmelaAfter: ['La marea ya sube a su hora. Fausto dice que ya no oye campanas bajo el agua.'],
  tobiasBefore: ['La marea sube y baja a destiempo. Nadie se atreve a salir con las barcas.', 'Y los que salimos volvemos con los bolsillos llenos de monedas raras.'],
  tobiasAfter: ['La marea ha vuelto a su hora. Las redes salen con peces, no con monedas. ¡Como debe ser!'],
  faustoBefore: ['Aún oigo las campanas de aquella ciudad. Muy lejos. ¿Tú también las oyes?', 'Mi madre no me deja acercarme al agua. Normal.'],
  faustoAfter: ['La marea ya no suena a voces. Solo a mar.', 'Cuando pueda volver a bajar, no pienso seguir ninguna luz. Palabra.'],
  // Si el P7 lo soltó sin que se le despertara en la sala 2, su regalo espera en la playa (CAMPANA §2.6).
  faustoGift: [
    'Tú estabas allí abajo, ¿verdad? En aquel día que no se acababa. Te vi pasar muchas veces.',
    'Toma. Me lo traje de allí sin querer, y no lo quiero en casa.',
  ],
  tobiasGift: (s) => `Tú vas a bajar al arrecife, ¿no, ${byGender(s, 'chaval', 'chavala')}? Toma, por si te trae suerte. A mí no me la ha traído.`,
  final: {
    tobias: '¡La marea! Esta mañana ha subido cuando tocaba, ni un minuto antes ni un minuto después.',
    fausto: 'Tú… Lo has arreglado, ¿verdad? Lo he notado: las campanas de aquella ciudad se han callado.',
    carmela: 'Gracias. De verdad.',
    // Zygarde habla muy poco (autor, 25-09-2026): la pista del norte la da el marinero.
    sailor: [
      '¡Eh, la playa! ¡Con la mar en calma, el ferri vuelve a salir! ¡A Nexo y, desde allí, al norte!',
      'Y dicen que el hielo raro del norte se ha retirado. El camino de Brontia hacia las montañas vuelve a estar libre.',
    ],
  },
  whirl: 'Un remolino oscuro gira sobre el arrecife. Desde abajo sube un rumor de voces.',
});

async function introScene(ctx) {
  const T = CALETA_B14_TEXT.intro;
  await ctx.fade('out', 16);
  await placePlayer(ctx, C.sceneSpot);
  await pause(ctx, 6);
  await ctx.fade('in', 16);
  await lines(ctx, SPEAKER.tobias, T.tobias1);
  await lines(ctx, SPEAKER.carmela, T.carmela);
  await ctx.say(T.tobias2(ctx.state), { speaker: SPEAKER.tobias });
  if (!ctx.flag(F.coinsGift)) {
    await ctx.giveItem('RELICCOPPER', 1);
    ctx.setFlag(F.coinsGift);
  }
  await ctx.say(T.carmela2, { speaker: SPEAKER.carmela });
  ctx.setFlag(F.caletaIntro);
}

async function finalScene(ctx) {
  const T = CALETA_B14_TEXT.final;
  await ctx.fade('out', 16);
  await placePlayer(ctx, C.sceneSpot);
  await pause(ctx, 6);
  await ctx.fade('in', 16);
  await ctx.say(T.tobias, { speaker: SPEAKER.tobias });
  await ctx.say(T.fausto, { speaker: SPEAKER.fausto });
  await ctx.say(T.carmela, { speaker: SPEAKER.carmela });
  ctx.se('Anim/Water1', { volume: 50 });
  await lines(ctx, SPEAKER.sailor, T.sailor);
  ctx.setFlag(F.caletaFinal);
}

function npcEvents() {
  return [
    {
      id: 'b14_carmela', x: C.mother.x, y: C.mother.y, name: SPEAKER.carmela,
      pages: [
        { when: (s) => s.flag(F.caletaIntro) || s.flag(F.faustoAwake), sprite: SPRITE.carmela, dir: C.mother.dir, move: 'look', trigger: 'action',
          script: async (ctx) => {
            const s = ctx.state;
            const list = restored(s) ? CALETA_B14_TEXT.carmelaAfter : s.flag(F.faustoAwake) ? CALETA_B14_TEXT.carmelaBack : CALETA_B14_TEXT.carmelaWait;
            await lines(ctx, SPEAKER.carmela, list);
          } },
      ],
    },
    {
      id: 'b14_tobias', x: C.fisher.x, y: C.fisher.y, name: SPEAKER.tobias,
      pages: [{
        when: (s) => s.flag(F.caletaIntro) || s.zygardeAbility('dive'), sprite: SPRITE.tobias, dir: C.fisher.dir, move: 'look', trigger: 'action',
        script: async (ctx) => {
          // Si la escena de la playa no llegó a verse (se bajó al arrecife por el mar abierto), la moneda espera.
          if (!ctx.flag(F.coinsGift) && !restored(ctx.state)) {
            await ctx.say(CALETA_B14_TEXT.tobiasGift(ctx.state), { speaker: SPEAKER.tobias });
            await ctx.giveItem('RELICCOPPER', 1);
            ctx.setFlag(F.coinsGift);
            return;
          }
          await lines(ctx, SPEAKER.tobias, restored(ctx.state) ? CALETA_B14_TEXT.tobiasAfter : CALETA_B14_TEXT.tobiasBefore);
        },
      }],
    },
    {
      id: 'b14_fausto', x: C.faustoBeach.x, y: C.faustoBeach.y, name: SPEAKER.fausto,
      pages: [{
        when: (s) => s.flag(F.faustoAwake), sprite: SPRITE.fausto, dir: C.faustoBeach.dir, move: 'look', trigger: 'action',
        script: async (ctx) => {
          if (ctx.flag(F.faustoFreed) && !ctx.flag(F.silverGift)) {
            await lines(ctx, SPEAKER.fausto, CALETA_B14_TEXT.faustoGift);
            await ctx.giveItem('RELICSILVER', 1);
            ctx.setFlag(F.silverGift);
            return;
          }
          await lines(ctx, SPEAKER.fausto, restored(ctx.state) ? CALETA_B14_TEXT.faustoAfter : CALETA_B14_TEXT.faustoBefore);
        },
      }],
    },
  ];
}

export const needIntro = (s) => Boolean(s) && s.zygardeAbility('dive') && !s.flag(F.caletaIntro) && !s.flag(F.faustoAwake) && !restored(s);
export const needFinal = (s) => restored(s) && !s.flag(F.caletaFinal);

/**
 * Escenas automáticas de la playa: un vigilante en paralelo espera a que el jugador esté en tierra y quieto (si llega
 * nadando desde el arrecife, la escena empieza al pisar la orilla) y entonces lanza la escena bloqueante.
 */
function sceneEvents() {
  const guard = { running: false };
  return [{
    id: 'b14_escenas_playa', x: 0, y: 0,
    pages: [{
      when: (s) => needIntro(s) || needFinal(s), trigger: 'parallel',
      script: async (ctx) => {
        const st = ctx.state;
        if (!guard.running && !ctx.world.scriptBusy() && onLand({ world: ctx.world }) && !ctx.player.busy()) {
          const scene = needIntro(st) ? introScene : needFinal(st) ? finalScene : null;
          if (scene) {
            guard.running = true;
            try { await ctx.scene.runScript(scene, null, 'b14:playa'); } finally { guard.running = false; }
          }
        }
        await pause(ctx, 10);
      },
    }],
  }];
}

export function b14CaletaEvents() {
  const R = C.reefDive;
  const A = ARRECIFE.arrival;
  return [
    ...npcEvents(),
    ...sceneEvents(),
    { id: 'remolino_arrecife', type: 'diveSpot', x: R.x, y: R.y, to: 'arrecife_eco', tx: A.x, ty: A.y, dir: A.dir, blockedText: CALETA_B14_TEXT.whirl },
  ];
}
