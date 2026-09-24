// Escenas de la Cámara de los Contrapesos (docs/CAMPANA.md B08): la llegada, Fermín cuando la Gran Balanza cede y
// su combate (Graveler 32, Naclstack 32, Mudsdale 33, Onix 33, Rhydon 34; reintento sin pérdida, §2.6), y el núcleo:
// restorePillar(4) (Fragmento 4, verso IV leído por el Core y Fermín), el efecto local (se detiene el hundimiento), la
// inscripción de T05 y la despedida de Fermín.
import { SPOTS } from './b08_balance_logic.js';
import { F, SPEAKER, SPRITE, lines, zygardeSays, byGender, findEvent } from './b08_common.js';
import { setBalanceSolvedHandler, syncPieces } from './b08_camara.js';
import { bossBattle } from '../common/bossBattle.js';
import { pilarTone } from '../stamps/pilar.js';

export const NUCLEO_TEXT = Object.freeze({
  cold: 'Un pedestal hexagonal, frío. Del hueco sale un aire pesado, como en el fondo de una mina.',
  after: 'El pedestal guarda un calor leve. Ya no tiembla nada.',
  t05: 'Bajo el verso hay otra inscripción, más pequeña. La Pokédex la traduce: «La quinta tabla se gana con las manos.»',
  quake: 'El temblor que subía desde el fondo de la sima se apaga poco a poco.',
  city: 'Muy arriba, lejos, algo deja de crujir.',
});

// ───────────────────────────── Llegada ─────────────────────────────

export async function camaraOnEnter(ctx) {
  syncPieces(ctx); // parte síncrona: los contrapesos ya están en su sitio antes del fundido
  if (ctx.flag(F.chamberSeen)) return;
  ctx.setFlag(F.chamberSeen);
  await ctx.wait(10);
  await zygardeSays(ctx, 'Aquí todo pesa. Hasta el aire.');
  await zygardeSays(ctx, 'Esa balanza de ahí arriba… espera algo. Lee la piedra de la entrada.');
}

// ───────────────────────────── Fermín ─────────────────────────────

/** Fermín llega corriendo cuando la Balanza cede (lo engancha b08_camara.js). */
async function ferminArrives(ctx) {
  ctx.requestRefresh();
  await ctx.wait(2);
  const fermin = findEvent(ctx, 'fermin_camara');
  if (!fermin || !fermin.page) return;
  fermin.moveTo(18, 17);
  fermin.direction = 8;
  const route = [...Array(3).fill('up'), ...Array(18 - SPOTS.fermin.x).fill('left'), ...Array(14 - SPOTS.fermin.y).fill('up'), 'turn_down'];
  await ctx.move(fermin, route, { through: true, speed: 4.5 });
  await lines(ctx, SPEAKER.fermin, [
    '¡La Balanza! Cuarenta años…',
    'Mi padre bajaba a mirarla los domingos. Decía que no se movería nunca. Que no había peso en el mundo que la moviera.',
    (s) => `Y resulta que pesaba lo que pesáis ${byGender(s, 'el chaval', 'la chavala')} y ese bicho verde. Juntos.`,
    'Ven. Antes del núcleo tenemos que hablar tú y yo.',
  ]);
}

async function ferminChallenge(ctx) {
  const fermin = findEvent(ctx, 'fermin_camara');
  if (fermin) fermin.turnToward(ctx.player);
  if (!ctx.flag(F.ferminChallenged)) {
    await lines(ctx, SPEAKER.fermin, [
      'Mi padre me dejó dos cosas: la mina y esta puerta. Con la mina ya ves lo que ha pasado.',
      'Los Galena guardamos esta losa desde antes de que hubiera Estrato. Nadie pasa sin cargar con lo que pesa este sitio.',
      'Es lo único que los Galena hemos sabido hacer: cargar. Y no voy a ser el primero que se aparta.',
      'Si quieres llegar al núcleo, demuéstrame que aguantas el peso.',
    ]);
    ctx.setFlag(F.ferminChallenged);
  } else {
    await lines(ctx, SPEAKER.fermin, ['Otra vez. Sin prisa: la piedra no se va a ir a ninguna parte.']);
  }
  const outcome = await bossBattle(ctx, { trainer: 'b08_fermin' }, SPOTS.ferminRetry, {
    speaker: SPEAKER.fermin, loseText: 'Descansa. Cuando quieras, aquí estaré.',
  });
  if (outcome !== 'win') return;
  ctx.setFlag(F.fermin);
  await lines(ctx, SPEAKER.fermin, [
    '…Aguantas. Más de lo que aguantaba yo a tu edad.',
    'Pasa. Yo voy detrás. Hace cuarenta años que quiero ver qué hay ahí dentro.',
  ]);
  if (fermin) { fermin.direction = 6; ctx.requestRefresh(); }
}

async function ferminWaiting(ctx) {
  await ctx.say('El núcleo está ahí arriba. Tú primero.', { speaker: SPEAKER.fermin });
}

export function ferminEvents() {
  const f = SPOTS.fermin;
  const waiting = (s) => Boolean(s) && s.flag(F.balance) && !s.flag(F.fermin);
  return [
    {
      id: 'fermin_camara', x: f.x, y: f.y, name: SPEAKER.fermin,
      pages: [
        { when: waiting, sprite: SPRITE.fermin, dir: f.dir, trigger: 'action', script: ferminChallenge },
        { when: (s) => Boolean(s) && s.flag(F.fermin) && !s.flag(F.restored), sprite: SPRITE.fermin, dir: 6, trigger: 'action', script: ferminWaiting },
      ],
    },
    // Franja de la boca del paso: no se llega al núcleo sin el combate.
    ...[5, 6, 7, 8, 9].map((x) => ({
      id: `reto_fermin_${x}`, x, y: 12,
      pages: [{ when: waiting, through: true, trigger: 'touch', script: ferminChallenge }],
    })),
  ];
}

// ───────────────────────────── Núcleo ─────────────────────────────

async function readVerseTogether(ctx) {
  await zygardeSays(ctx, 'La tierra… su peso. Lo había perdido. Como yo.');
  const fermin = findEvent(ctx, 'fermin_camara');
  if (fermin) fermin.turnToward(ctx.player);
  await lines(ctx, SPEAKER.fermin, [
    '«…y la tierra, su peso.»',
    'Esto lo grabaron hace siglos. Y cuenta lo que nos pasa este año, como si nos hubieran visto venir.',
  ]);
  await zygardeSays(ctx, 'Las piedras van por delante. Siempre han ido por delante de nosotros.');
}

async function localEffect(ctx) {
  ctx.se('PRSFX- Earthquake', { volume: 60 });
  ctx.shake(2, 4, 50);
  await ctx.tone(pilarTone('P4', 0.25), 40);
  await ctx.say(NUCLEO_TEXT.quake);
  await ctx.say(NUCLEO_TEXT.city);
  await ctx.say('Estrato… Lo noto en las rodillas. Ha dejado de hundirse.', { speaker: SPEAKER.fermin });
}

async function ferminFarewell(ctx) {
  await lines(ctx, SPEAKER.fermin, [
    'Tengo que volver a Estrato. Sol tiene que saber esto antes que nadie. Y los del Consorcio también.',
    'Te espero allí. No tardes: esto hay que celebrarlo con toda la mina.',
  ]);
  ctx.setFlag(F.ferminLeft);
  const fermin = findEvent(ctx, 'fermin_camara');
  if (fermin) {
    await ctx.move(fermin, ['down', 'down', 'down', 'down', 'down'], { through: true, speed: 4.5 });
    ctx.erase(fermin);
  }
}

async function coreScene(ctx) {
  const fermin = findEvent(ctx, 'fermin_camara');
  if (fermin) {
    fermin.moveTo(6, 8);
    fermin.direction = 6;
  }
  await zygardeSays(ctx, 'Aquí. Esto es lo que sostiene la tierra de alrededor.');
  const ok = await ctx.story.restorePillar(4, {
    core: { x: SPOTS.pedestal.x, y: SPOTS.pedestal.y },
    onRestored: async (c) => {
      await readVerseTogether(c);
      await localEffect(c);
    },
  });
  if (!ok) return;
  await ctx.say(NUCLEO_TEXT.t05);
  await ctx.story.openClue('T05');
  await zygardeSays(ctx, 'La tierra ha recordado su peso. El cielo, todavía no.');
  await ferminFarewell(ctx);
}

export function pedestalEvent() {
  const { x, y } = SPOTS.pedestal;
  return {
    id: 'nucleo_masa', x, y, name: 'Núcleo',
    pages: [
      { solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(NUCLEO_TEXT.cold); } },
      {
        when: (s) => Boolean(s) && s.flag(F.fermin) && !s.flag(F.restored), solid: true, trigger: 'action',
        glow: { name: 'softLight', radius: 110, intensity: 0.6, pulse: 0.5, color: [170, 180, 196] },
        script: coreScene,
      },
      {
        when: (s) => Boolean(s) && s.flag(F.restored), solid: true, trigger: 'action',
        glow: { name: 'softLight', radius: 80, intensity: 0.3, pulse: 0.2, color: [170, 180, 196] },
        script: async (ctx) => { await ctx.say(NUCLEO_TEXT.after); },
      },
    ],
  };
}

setBalanceSolvedHandler(ferminArrives);
