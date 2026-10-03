// Sala de las Campanas y núcleo del Pilar del Impulso (docs/CAMPANA.md B06, sección c de la mazmorra, «Respuesta»,
// «Cambio en el mundo» y «Recompensas»): las tres campanas del piso 2 (ritmo largo–corto–corto: Norte, Este, Oeste)
// abren el tercero, donde esperan Abril y el núcleo (Fragmento 3, verso III, p3_restored). La inscripción abre la
// pista T04 y Abril se despide («Vale. Esto no es aburrido.»). La fase 1 de la crisis sale sola de los flags.
import { CAMPANAS, strikeBell, BELL_SEQUENCE } from './b06_wind_rooms.js';
import { F, V, SPEAKER, SPRITE, OBJ, TELEPATHY, lines, zygardeSays, scriptedBattle } from './b06_common.js';
import { ANILLO, P3_VERTICAL as P } from '../maps/b06/layout.js';
import { pilarTone } from '../stamps/pilar.js';
import { walkEventTo } from './b01_town_path.js';

const S = ANILLO.sala;
const at = ([x, y]) => ({ x: S.ox + x, y: S.oy + y });
const WHITE = [240, 248, 255];
/** Fotogramas manteniendo A para que el golpe cuente como «largo». */
export const LONG_FRAMES = 30;
const BELL_NAMES = Object.freeze({ N: 'del norte', E: 'del este', W: 'del oeste' });
const BELL_SE = 'PRSFX- Heal Bell';

/** Dónde espera Abril en la Sala tras las campanas (junto a la escalera del estrado). */
export const ABRIL_SALA = P.guardian;

export const NUCLEO_TEXT = Object.freeze({
  coldPedestal: 'Un pedestal hexagonal, frío. El viento pasa por las rendijas de la columna.',
  afterPedestal: 'El pedestal guarda un calor leve. El viento sopla limpio alrededor del anillo.',
  bellsLong: (n) => `La campana ${n} da un tañido largo que se queda vibrando en el aire.`,
  bellsShort: (n) => `La campana ${n} da un golpe corto y seco.`,
  bellHolds: 'El sonido no se apaga: la campana sigue vibrando.',
  bellsWrong: 'El viento arrecia un instante y todas las campanas enmudecen. El ritmo no era ese.',
  bellHint: 'El golpe ha sido demasiado breve. El surco de la primera piedra era largo: quizá haya que sostener el golpe.',
  bellsDone: 'Las tres campanas suenan a la vez. El viento del anillo cambia de voz.',
  bellsCalm: 'En el hueco del sur, el vendaval se deshace en una brisa.',
  bellsSolvedBefore: 'Las tres campanas siguen vibrando, muy bajo.',
  bellAfter: 'La campana suena limpia. El viento responde en calma.',
  t04: 'Bajo el verso hay otra inscripción, más pequeña. La Pokédex la traduce: «La cuarta tabla duerme entre capas de piedra.»',
  windCalm: 'El viento del Anillo se aquieta y empieza a soplar en una sola dirección.',
  parque: 'A lo lejos, sobre la Meseta, las aspas del Parque Eólico empiezan a girar.',
});

// ------------------------------------------------------------ campanas

/** Cuenta los fotogramas que el jugador mantiene A tras pulsar (hasta `max`). */
async function heldFrames(ctx, max = 60) {
  const input = ctx.world?.input;
  let n = 0;
  while (n < max && input?.held?.('A')) {
    await ctx.wait(1);
    n += 1;
  }
  return n;
}

/** Balanceo de la campana (fila 4 de la hoja) mientras suena. */
async function swing(ctx, long) {
  const ev = ctx.event;
  const dir = ev.direction;
  const anim = ev.stepAnime;
  ev.direction = 4;
  ev.stepAnime = true;
  ctx.se(BELL_SE, { volume: long ? 100 : 85, pitch: long ? 70 : 118 });
  if (long) {
    await ctx.wait(22);
    ctx.se(BELL_SE, { volume: 70, pitch: 64 });
    await ctx.wait(42);
  } else {
    await ctx.wait(22);
  }
  ev.direction = dir;
  ev.stepAnime = anim;
}

async function strike(ctx, key) {
  if (ctx.flag(F.restored)) {
    await swing(ctx, false);
    await ctx.say(NUCLEO_TEXT.bellAfter);
    return;
  }
  if (ctx.flag(F.bells)) {
    await ctx.say(NUCLEO_TEXT.bellsSolvedBefore);
    return;
  }
  const long = (await heldFrames(ctx)) >= LONG_FRAMES;
  await swing(ctx, long);
  await ctx.say(long ? NUCLEO_TEXT.bellsLong(BELL_NAMES[key]) : NUCLEO_TEXT.bellsShort(BELL_NAMES[key]));
  const r = strikeBell(ctx.var(V.bellStep, 0), key, long);
  ctx.setVar(V.bellStep, r.step);
  if (r.done) {
    await bellsSolved(ctx);
  } else if (r.ok) {
    ctx.se('PRSFX- Tailwind', { volume: 50 });
    await ctx.say(NUCLEO_TEXT.bellHolds);
  } else {
    ctx.se('PRSFX- Gust', { volume: 90, pitch: 80 });
    await ctx.flash(WHITE, 10, 90);
    await ctx.say(NUCLEO_TEXT.bellsWrong);
    // Pista: la primera piedra pide un surco largo (mantener A al golpear).
    if (key === 'N' && !long) await ctx.say(NUCLEO_TEXT.bellHint);
  }
}

/** Eventos de las tres campanas (en el borde de la terraza; se golpean desde su casilla de enfrente). */
export function bellEvents() {
  return BELL_SEQUENCE.map(({ bell }, idx) => {
    const b = CAMPANAS.bells[bell];
    const pos = at(b.at);
    const base = { sprite: OBJ.bell, directionFix: true, solid: true, trigger: 'action', speed: 3, lock: false, script: (ctx) => strike(ctx, bell) };
    return {
      id: `campana_${bell.toLowerCase()}`, x: pos.x, y: pos.y, bell,
      pages: [
        { ...base, dir: 2, stepAnime: false },
        // tañido acertado de la secuencia en curso: sigue vibrando
        { ...base, dir: 6, stepAnime: true, when: (s) => Boolean(s) && !s.flag(F.bells) && s.var(V.bellStep, 0) > idx },
        // secuencia completa
        { ...base, dir: 6, stepAnime: true, speed: 2, when: (s) => Boolean(s) && s.flag(F.bells) && !s.flag(F.restored) },
        { ...base, dir: 2, stepAnime: false, when: (s) => Boolean(s) && s.flag(F.restored) },
      ],
    };
  });
}

/** Secuencia correcta: el vendaval se calma, el núcleo brilla y Abril sube a la Sala. */
async function bellsSolved(ctx) {
  ctx.setFlag(F.bells);
  ctx.se(BELL_SE, { volume: 100, pitch: 90 });
  ctx.shake(3, 5, 30);
  await ctx.flash(WHITE, 30, 160);
  await ctx.say(NUCLEO_TEXT.bellsDone);
  ctx.se('PRSFX- Tailwind', { volume: 80 });
  await ctx.say(NUCLEO_TEXT.bellsCalm);
}

/** Abril escucha el puzzle resuelto desde la sala del Guardián, en el tercer piso. */
export async function nucleoOnEnter(ctx) {
  if (ctx.flag(F.restored) || ctx.flag(F.abrilSala)) return;
  if (!ctx.flag(F.bells)) {
    await ctx.warp('anillo_vientos_base', P.entry.x, P.entry.y, 8);
    return;
  }
  ctx.setFlag(F.abrilSala);
  await lines(ctx, SPEAKER.abril, [
    '¿Has sido tú? Cinco años aquí arriba y nunca las había oído sonar.',
    'Te espero junto al núcleo. A ver si al menos me entretienes.',
  ]);
}

async function abrilT03(ctx) {
  const clue = (ctx.state.clues || []).find((c) => c.id === 'T03');
  if (!clue || clue.solved || clue.status === 'solved' || (clue.step || 1) >= 2 || ctx.flag(F.t03Abril)) return;
  ctx.setFlag(F.t03Abril);
  await ctx.say('¿Lo del rayo de Brontia? Allí ya ni se asustan. Cae siempre en la campana grande.', { speaker: SPEAKER.abril });
  await ctx.story.advanceClue('T03', 2);
}

export async function abrilChallenge(ctx) {
  if (ctx.flag(F.abril) || ctx.flag(F.restored)) return;
  const abril = ctx.world.events.find((e) => e.id === 'abril_sala');
  if (abril) abril.turnToward(ctx.player);
  if (!ctx.flag(F.abrilMet)) {
    ctx.setFlag(F.abrilMet);
    await ctx.say('Soy Abril. La guarda del Anillo, dicen. Cinco años vigilando una piedra que no hace nada.', { speaker: SPEAKER.abril });
  }
  if (!ctx.flag(F.abrilChallenged)) {
    await lines(ctx, SPEAKER.abril, [
      '¿Has sido tú, lo del Parque? Pues mira qué bien. Ya que estás, a ver si al menos me entretienes.',
      'Termina rápido, que se me enfría la comida.',
    ]);
    ctx.setFlag(F.abrilChallenged);
  } else {
    await ctx.say('¿Otra vez tú? Bueno, la comida ya se ha enfriado. Venga.', { speaker: SPEAKER.abril });
  }
  await abrilT03(ctx);
  const outcome = await scriptedBattle(ctx, { trainer: 'b06_abril' }, P.retry);
  if (outcome !== 'win') return;
  ctx.setFlag(F.abril);
  await lines(ctx, SPEAKER.abril, [
    'Vaya. Pues sí que sabes. Venga. Lo que sea que haya en el centro, quiero verlo.',
    'Ah, y en la Ruta 5, detrás de unos troncos rajados, a veces brilla algo verde. Yo no pienso ir a mirar.',
  ]);
  if (abril) await ctx.move(abril, ['right', 'right'], { through: false, speed: 4.5 });
  ctx.requestRefresh();
}

/**
 * Abril en la Sala desde que suenan las campanas hasta su despedida (`b06_abril_despedida`, justo después de restaurar
 * el Pilar): así sigue visible mientras lee el verso y se va andando. Después está en Brontia (b05_brontia.js).
 */
export function abrilSalaEvent() {
  return {
    id: 'abril_sala', x: ABRIL_SALA.x, y: ABRIL_SALA.y, name: SPEAKER.abril,
    pages: [{
      when: (s) => Boolean(s) && !s.flag(F.abril) && !s.flag(F.restored),
      sprite: SPRITE.abril, dir: 2, move: 'still', trigger: 'action', script: abrilChallenge,
    }, {
      when: (s) => Boolean(s) && s.flag(F.abrilSala) && (s.flag(F.abril) || s.flag(F.restored)) && !s.flag(F.abrilAfter),
      sprite: SPRITE.abril, dir: 8, move: 'still', trigger: 'action',
      script: async (ctx) => { await ctx.say('El centro. El pedestal. Tú primero, que a mí no me hace caso.', { speaker: SPEAKER.abril }); },
    }],
  };
}

// ------------------------------------------------------------ núcleo

/** Efecto local del P3 (CAMPANA «Cambio en el mundo»): lo narra y deja el mundo cambiado por flags. */
async function localEffect(ctx) {
  ctx.se('PRSFX- Tailwind', { volume: 90 });
  await ctx.tone(pilarTone('P3', 0.15), 40);
  await ctx.say(NUCLEO_TEXT.windCalm);
  await ctx.say(NUCLEO_TEXT.parque);
  ctx.setFlag(F.parqueLight);
}

async function readVerseTogether(ctx) {
  // Zygarde habla muy poco (autor, 25-09-2026): solo la lectura del verso III (CAMPANA: «Core y Abril»).
  await zygardeSays(ctx, 'El viento… su camino. Lo había perdido. Como yo.');
  const abril = ctx.world.events.find((e) => e.id === 'abril_sala' && e.page);
  if (abril) abril.turnToward(ctx.player);
  if (ctx.flag(F.abrilSala)) {
    await lines(ctx, SPEAKER.abril, [
      '«…el viento, su camino.» ¿Eso pone?',
      'Aquí arriba el viento nunca ha tenido camino. Hasta hoy.',
    ]);
  }
}

async function abrilFarewell(ctx) {
  if (!ctx.flag(F.abrilSala)) return;
  const abril = ctx.world.events.find((e) => e.id === 'abril_sala');
  await lines(ctx, SPEAKER.abril, [
    'Vale. Esto no es aburrido.',
    'Si el viento del cañón también se ha calmado, en la Ruta 6 ya se podrá pasar. Al sur de Brontia.',
    'Yo me quedo en Brontia una temporada. Por fin pasa algo.',
  ]);
  if (abril) {
    await walkEventTo(ctx, 'abril_sala', P.down.x, P.down.y, { speed: 4.5, fallback: false });
    ctx.erase(abril);
  }
  // Después de irse andando: el flag oculta su página de la Sala (cambiar de página cortaría la ruta).
  ctx.setFlag(F.abrilAfter);
}

/** Escena del núcleo: Fragmento 3, verso III, efecto local, pista T04 y despedida de Abril. */
async function coreScene(ctx) {
  const pos = P.pedestal;
  const ok = await ctx.story.restorePillar(3, {
    core: pos,
    onRestored: async (c) => {
      await readVerseTogether(c);
      await localEffect(c);
    },
  });
  if (!ok) return;
  await ctx.say(NUCLEO_TEXT.t04);
  await ctx.story.openClue('T04');
  await abrilFarewell(ctx);
}

/** Pedestal del núcleo (base del stamp `pilar_pedestal`). */
export function pedestalEvent() {
  const pos = P.pedestal;
  return {
    id: 'nucleo_impulso', x: pos.x, y: pos.y, name: 'Núcleo',
    pages: [
      { solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(NUCLEO_TEXT.coldPedestal); } },
      {
        when: (s) => Boolean(s) && s.flag(F.bells) && s.flag(F.abril) && !s.flag(F.restored), solid: true, trigger: 'action',
        glow: { name: 'softLight', radius: 110, intensity: 0.6, pulse: 0.5, color: [236, 244, 255] },
        script: coreScene,
      },
      {
        when: (s) => Boolean(s) && s.flag(F.restored), solid: true, trigger: 'action',
        glow: { name: 'softLight', radius: 80, intensity: 0.3, pulse: 0.2, color: [236, 244, 255] },
        script: async (ctx) => { await ctx.say(NUCLEO_TEXT.afterPedestal); },
      },
    ],
  };
}

export { TELEPATHY };
