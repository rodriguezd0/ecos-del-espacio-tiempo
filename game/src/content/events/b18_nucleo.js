// Núcleo del Cruce (docs/CAMPANA.md B18 «Elección (verso IX)»; D18; §3.0 verso IX): Dialga y Palkia, furiosos, tiran
// cada uno hacia su lado. El núcleo pide atar a uno: el jugador elige con confirmación explícita (var p9_choice
// 'DIALGA' | 'PALKIA'; la elección queda fijada) y combate contra el elegido a nivel 65. La captura solo se permite por
// debajo del 50 % de sus PS («la Cadena lo retiene»: rules.catchCondition y aviso antes del combate); capturarlo es
// opcional (var p9_chosen_caught). Con la victoria (captura o derrota del legendario) el eje queda atado y el Pilar se
// restaura con la API de historia (Fragmento 9; el verso IX se lee antes de elegir). El no elegido regresa a su
// dimensión y deja su orbe (Dialga elegido → Lustresfera; Palkia elegido → Diamansfera); la Cadena Roja queda
// templada (se conserva). La inscripción del núcleo abre la pista T15. Si se debilitó sin capturarse, el elegido
// reaparece tras descansar (var rest_count), tantas veces como haga falta. Si el jugador pierde, vuelve a la entrada de
// la Cámara con el equipo curado (helper común bossBattle) y la elección se conserva.
import {
  F, V, SPEAKER, SPRITE, OBJ, MUSIC, CHOICES, ORB_OF_UNCHOSEN, OTHER, SILVER, when, lines, eventById, pause,
  objectPage, chosenWaiting, walkTo,
} from './b18_common.js';
import { NUCLEO, ENTRY } from '../maps/b18/cruce_layout.js';
import { P9_LEGENDS } from '../encounters/b18.js';
import { bossBattle } from '../common/bossBattle.js';

const NAMES = Object.freeze({ DIALGA: 'Dialga', PALKIA: 'Palkia' });
const AXIS_NAMES = Object.freeze({ DIALGA: 'el tiempo', PALKIA: 'el espacio' });
const COLORS = Object.freeze({ DIALGA: [118, 172, 255], PALKIA: [222, 128, 255] });
const ORB_NAMES = Object.freeze({ LUSTROUSORB: 'Lustresfera', ADAMANTORB: 'Diamansfera' });
const ORB_FRAME = Object.freeze({ ADAMANTORB: 4, LUSTROUSORB: 6 }); // fila de b18_objetos.png

export const NUCLEO_TEXT = Object.freeze({
  arrive: 'Una sala blanca partida en dos: una mitad azul y quieta, otra lila y temblorosa. En el cruce, un hexágono tallado late con luz plata.',
  standoff: 'Dialga y Palkia se miran desde cada lado del núcleo. Cada vez que uno ruge, la sala entera se inclina hacia él.',
  shortcut: 'Muy arriba, en el vestíbulo, una puerta de piedra se abre con un chasquido.',
  core: 'El núcleo del Pilar. Sus hexágonos tiemblan como una cuerda tensada desde dos lados.',
  coreAfter: 'El núcleo late en calma. Las dos mitades de la sala se han quedado quietas.',
  choose: '¿A quién atarás con la Cadena Roja?',
  options: Object.freeze(['Atar a Dialga (el tiempo)', 'Atar a Palkia (el espacio)', 'Todavía no']),
  confirm: (n, a) => `Atarás a ${n}, ${a}. El otro regresará a su dimensión. La elección no se podrá cambiar. ¿Estás seguro de tu elección?`,
  confirmF: (n, a) => `Atarás a ${n}, ${a}. El otro regresará a su dimensión. La elección no se podrá cambiar. ¿Estás segura de tu elección?`,
  chainRule: (n) => `La Cadena Roja solo retendrá a ${n} cuando sus PS bajen de la mitad. Hasta entonces, no podrás capturarlo.`,
  catchReason: 'La Cadena Roja aún no lo retiene. Baja sus PS de la mitad antes de lanzar una Poké Ball.',
  optional: 'Capturarlo no es obligatorio: basta con vencerlo para atar el eje.',
  ready: (n) => `¿Te enfrentas a ${n}?`,
  retry: (n) => `${n} te espera junto al núcleo. La elección sigue en pie.`,
  lose: 'El eco de la Cadena te devuelve a la entrada de la Cámara. Tu equipo se ha recuperado.',
  fainted: (n) => `${n} se repliega junto al núcleo, sin fuerzas. Cuando descanses, volverá a estar aquí.`,
  caught: (n) => `${n} se queda contigo. El eje ya no tira hacia ningún lado.`,
  bound: (n) => `La Cadena Roja se tensa una última vez entre ${n} y el núcleo… y el eje queda atado.`,
  leaves: (n) => `${n} alza la cabeza, ruge una vez y se desvanece en un pliegue del aire.`,
  promise: (n, orb) => `Donde estaba ${n} queda algo brillante sobre el suelo: la ${orb}. Una promesa.`,
  tempered: 'La Cadena Roja se enfría en tu mano. Queda templada, como el metal recién forjado.',
  inscription: 'Bajo el hexágono del núcleo aparece una línea que antes no estaba. La Clave Glífica traduce:',
  t15: '«La última tabla está donde el rey trabajó.»',
  reappear: (n) => `${n} ha vuelto junto al núcleo. Te observa.`,
  plaque: 'Una placa Unown en la pared del núcleo.',
});

/** ¿Captura permitida? (rules.catchCondition del combate: PS del elegido por debajo del 50 %). Pura. */
export function chainCatchCondition(battle) {
  const foe = (battle?.battlers || []).find((b, i) => i % 2 === 1 && b && !b.isFainted?.()) || battle?.battlers?.[1] || null;
  if (!foe || !(foe.totalhp > 0)) return { allowed: false, reason: NUCLEO_TEXT.catchReason };
  if (foe.hp * 2 < foe.totalhp) return { allowed: true, reason: null };
  return { allowed: false, reason: NUCLEO_TEXT.catchReason };
}

/** Petición del combate contra el elegido (pura: la prueban los tests). */
export function boundRequest(choice) {
  const spec = P9_LEGENDS[choice];
  if (!spec) throw new Error(`boundRequest: elección inválida "${choice}" (DIALGA | PALKIA)`);
  return {
    type: 'wild',
    wild: { ...spec, moves: [...spec.moves], shiny: false },
    bgm: MUSIC.legendary,
    rules: { canRun: false, catchCondition: chainCatchCondition },
  };
}

const choiceOf = (s) => (s?.var(V.choice, null) === CHOICES.DIALGA || s?.var(V.choice, null) === CHOICES.PALKIA ? s.var(V.choice, null) : null);

// ─────────────────────────────── llegada ───────────────────────────────

async function arrivalScene(ctx) {
  ctx.setFlag(F.nucleus);
  ctx.bgm(MUSIC.crisis, { fadeOutPrevious: 20 });
  await ctx.camera.pan(NUCLEO.core.x, NUCLEO.core.y, 40);
  await ctx.say(NUCLEO_TEXT.arrive);
  for (const [sp, se, color] of [['DIALGA', 'PRSFX- Roar of Time', COLORS.DIALGA], ['PALKIA', 'PRSFX- Spacial Rend', COLORS.PALKIA]]) {
    ctx.cry(sp);
    ctx.se(se, { volume: 70 });
    ctx.shake(5, 7, 24);
    await ctx.flash(color, 14, 140);
    await pause(ctx, 16);
  }
  await ctx.say(NUCLEO_TEXT.standoff);
  // Zygarde habla muy poco (autor, 25-09-2026): el atajo lo cuenta la narración.
  await ctx.say(NUCLEO_TEXT.shortcut);
  await ctx.camera.reset(30);
}

// ─────────────────────────────── elección y combate ───────────────────────────────

async function chooseAxis(ctx) {
  if (!ctx.flag(F.verse)) await ctx.story.revealVerse(9);
  const i = await ctx.choice([...NUCLEO_TEXT.options], { message: NUCLEO_TEXT.choose, cancel: 2 });
  const choice = i === 0 ? CHOICES.DIALGA : i === 1 ? CHOICES.PALKIA : null;
  if (!choice) return null;
  const confirmText = ctx.state.player.gender === 'F' ? NUCLEO_TEXT.confirmF : NUCLEO_TEXT.confirm;
  const ok = (await ctx.choice(['Sí', 'No'], { message: confirmText(NAMES[choice], AXIS_NAMES[choice]), cancel: 1 })) === 0;
  if (!ok) return null;
  ctx.setVar(V.choice, choice);
  ctx.setVar(V.caught, false);
  ctx.setVar(V.chosenRest, -1);
  ctx.cry(choice);
  await ctx.flash(COLORS[choice], 18, 170);
  await ctx.say(`La Cadena Roja se tensa hacia ${NAMES[choice]}. ${NAMES[OTHER[choice]]} ruge, pero no puede acercarse.`);
  return choice;
}

/** El elegido baja delante del núcleo (escena) y empieza el combate. → resultado de bossBattle */
async function fightChosen(ctx, choice) {
  // El que está a la vista: el del núcleo antes de atar el eje; después, el que reaparece al descansar.
  const ev = [choice === CHOICES.DIALGA ? 'dialga_nucleo' : 'palkia_nucleo', 'elegido_reaparece']
    .map((id) => eventById(ctx, id)).find((e) => e?.page) || null;
  if (ev && (ev.x !== NUCLEO.bound.x || ev.y !== NUCLEO.bound.y)) {
    await walkTo(ctx, ev, NUCLEO.bound.x, NUCLEO.bound.y, { speed: 4 });
    ctx.face(ev, 'down');
  }
  await ctx.say(NUCLEO_TEXT.chainRule(NAMES[choice]));
  if (!ctx.flag(F.bound)) await ctx.say(NUCLEO_TEXT.optional);
  ctx.cry(choice);
  return bossBattle(ctx, boundRequest(choice), { map: 'camara_cruce', x: ENTRY.x, y: ENTRY.y, dir: ENTRY.dir }, {
    loseText: NUCLEO_TEXT.lose,
    onLose: (c) => c.setVar(V.defeats, Number(c.var(V.defeats, 0)) + 1),
  });
}

/** Resultado del combate (victoria por captura o por derrota del legendario). */
async function afterFight(ctx, choice, outcome) {
  // El elegido deja la plataforma (en la Poké Ball o replegado): se oculta en esta visita; al volver mandan las páginas.
  for (const id of [choice === CHOICES.DIALGA ? 'dialga_nucleo' : 'palkia_nucleo', 'elegido_reaparece']) {
    const ev = eventById(ctx, id);
    if (ev?.page && ev.x === NUCLEO.bound.x && ev.y === NUCLEO.bound.y) ctx.erase(ev);
  }
  if (outcome === 'caught') {
    ctx.setVar(V.caught, true);
    ctx.setVar(V.chosenRest, -1);
    await ctx.say(NUCLEO_TEXT.caught(NAMES[choice]));
  } else {
    ctx.setVar(V.chosenRest, Number(ctx.var(V.restCount, 0)));
    await ctx.say(NUCLEO_TEXT.fainted(NAMES[choice]));
  }
  ctx.requestRefresh();
}

/** Primera victoria: el eje queda atado y el Pilar se restaura. */
async function bindAndRestore(ctx, choice) {
  await ctx.say(NUCLEO_TEXT.bound(NAMES[choice]));
  const ok = await ctx.story.restorePillar(9, {
    core: { x: NUCLEO.core.x, y: NUCLEO.core.y },
    showVerse: false, // el verso IX ya se leyó antes de elegir (content/story: la bandera verse_9 queda puesta)
    onRestored: (c) => onRestored(c, choice),
  });
  if (!ok) { await ctx.say('El núcleo tiembla, pero todavía no responde del todo.'); return; }
  ctx.setFlag(F.bound); // el eje queda atado: el no elegido ya no está y su orbe espera en el suelo
}

async function onRestored(ctx, choice) {
  const other = OTHER[choice];
  const orb = ORB_OF_UNCHOSEN[choice];
  // El no elegido regresa a su dimensión y deja su orbe
  const ev = eventById(ctx, other === CHOICES.DIALGA ? 'dialga_nucleo' : 'palkia_nucleo');
  ctx.cry(other);
  await ctx.flash(COLORS[other], 16, 160);
  await ctx.say(NUCLEO_TEXT.leaves(NAMES[other]));
  if (ev) { for (let f = 16; f >= 0; f--) { ev.opacity = Math.round((255 * f) / 16); await pause(ctx, 1); } }
  ctx.se('PRSFX- Heal Bell', { volume: 60 });
  await ctx.say(NUCLEO_TEXT.promise(NAMES[other], ORB_NAMES[orb]));
  // La Cadena Roja queda templada (objeto clave conservado)
  ctx.setFlag(F.tempered);
  await ctx.flash([224, 48, 72], 14, 120);
  await ctx.say(NUCLEO_TEXT.tempered);
  // Cambio en el mundo (CAMPANA B18): los relojes se sincronizan y la Sima deja de ensancharse
  await ctx.flash([...SILVER], 20, 150);
  // Inscripción del núcleo: pista T15
  await ctx.say(NUCLEO_TEXT.inscription);
  await ctx.say(NUCLEO_TEXT.t15);
  ctx.setFlag(F.inscription);
  await ctx.story.openClue('T15');
  ctx.requestRefresh();
}

async function coreScene(ctx) {
  if (ctx.flag(F.restored)) {
    await ctx.say(NUCLEO_TEXT.coreAfter);
    if (chosenWaiting(ctx.state)) await ctx.say(NUCLEO_TEXT.reappear(NAMES[choiceOf(ctx.state)]));
    return;
  }
  await ctx.say(NUCLEO_TEXT.core);
  let choice = choiceOf(ctx.state);
  if (!choice) {
    choice = await chooseAxis(ctx);
    if (!choice) return;
  } else {
    await ctx.say(NUCLEO_TEXT.retry(NAMES[choice]));
    if (!(await ctx.confirm(NUCLEO_TEXT.ready(NAMES[choice])))) return;
  }
  const outcome = await fightChosen(ctx, choice);
  if (outcome !== 'win' && outcome !== 'caught') return;
  await afterFight(ctx, choice, outcome);
  if (!ctx.flag(F.bound)) await bindAndRestore(ctx, choice);
  ctx.bgm(MUSIC.after, { fadeOutPrevious: 20 });
}

/** El elegido, debilitado sin capturar, vuelve tras descansar: se le habla para combatir otra vez. */
async function rematch(ctx) {
  const choice = choiceOf(ctx.state);
  if (!choice) return;
  ctx.cry(choice);
  if (!(await ctx.confirm(NUCLEO_TEXT.ready(NAMES[choice])))) return;
  const outcome = await fightChosen(ctx, choice);
  if (outcome === 'win' || outcome === 'caught') await afterFight(ctx, choice, outcome);
}

// ─────────────────────────────── eventos ───────────────────────────────

function legendaryEvent(id, species, pos) {
  return {
    id, x: pos.x, y: pos.y, name: NAMES[species],
    pages: [{
      when: when({ none: [F.bound] }), sprite: species === CHOICES.DIALGA ? SPRITE.dialga : SPRITE.palkia, dir: pos.dir,
      stepAnime: true, speed: 2, solid: true, directionFix: true, trigger: 'action',
      light: { radius: 80, intensity: 0.8 },
      script: async (ctx) => {
        ctx.cry(species);
        await ctx.flash(COLORS[species], 12, 110);
        await ctx.say(`${NAMES[species]} ruge. Todo lo que hay a su lado de la sala ${species === CHOICES.DIALGA ? 'se detiene' : 'se estira'} un instante.`);
      },
    }],
  };
}

function reappearEvent() {
  const page = (species) => ({
    when: (s) => chosenWaiting(s) && choiceOf(s) === species, sprite: species === CHOICES.DIALGA ? SPRITE.dialga : SPRITE.palkia, dir: 2,
    stepAnime: true, speed: 2, solid: true, directionFix: true, trigger: 'action', light: { radius: 80, intensity: 0.8 }, script: rematch,
  });
  return { id: 'elegido_reaparece', x: NUCLEO.bound.x, y: NUCLEO.bound.y, name: 'Elegido', pages: [page(CHOICES.DIALGA), page(CHOICES.PALKIA)] };
}

function orbEvent() {
  const page = (choice) => {
    const orb = ORB_OF_UNCHOSEN[choice];
    return {
      when: (s) => s.flag(F.bound) && choiceOf(s) === choice && !s.flag(F.orb), ...objectPage(OBJ.items, ORB_FRAME[orb], { stepAnime: true, speed: 2 }),
      solid: true, trigger: 'action', light: { radius: 40, intensity: 0.7 },
      script: async (ctx) => {
        await ctx.giveItem(orb, 1, { found: true });
        ctx.setFlag(F.orb);
      },
    };
  };
  return { id: 'orbe_no_elegido', x: NUCLEO.orb.x, y: NUCLEO.orb.y, name: 'Orbe', pages: [page(CHOICES.DIALGA), page(CHOICES.PALKIA)] };
}

export function nucleoEvents() {
  const arrivalStrip = [];
  for (let x = NUCLEO.room.x + 1; x < NUCLEO.room.x + NUCLEO.room.w - 1; x++) {
    arrivalStrip.push({ id: `nucleo_llegada_${x}`, x, y: NUCLEO.arrival.y, through: true, pages: [{ when: when({ none: [F.nucleus] }), trigger: 'touch', through: true, script: arrivalScene }] });
  }
  return [
    ...arrivalStrip,
    legendaryEvent('dialga_nucleo', CHOICES.DIALGA, NUCLEO.dialga),
    legendaryEvent('palkia_nucleo', CHOICES.PALKIA, NUCLEO.palkia),
    reappearEvent(),
    orbEvent(),
    {
      id: 'nucleo_p9', x: NUCLEO.core.x, y: NUCLEO.core.y, name: 'Núcleo',
      pages: [{ solid: true, trigger: 'action', glow: { name: 'softLight', radius: 60, intensity: 0.7, pulse: 0.5, color: [...SILVER] }, script: coreScene }],
    },
    {
      id: 'placa_nucleo', x: NUCLEO.inscription.x, y: NUCLEO.inscription.y, solid: true, trigger: 'action', noOver: true,
      script: async (ctx) => {
        await ctx.say(NUCLEO_TEXT.plaque);
        if (ctx.flag(F.restored)) {
          await ctx.say(NUCLEO_TEXT.t15);
          if (!ctx.flag(F.inscription)) { ctx.setFlag(F.inscription); await ctx.story.openClue('T15'); }
        } else {
          await ctx.say('Los glifos están desordenados, como si la sala no dejara de moverlos.');
        }
      },
    },
    ...[NUCLEO.inscription.x + 1].map((x) => ({ id: `placa_nucleo_${x}`, x, y: NUCLEO.inscription.y, solid: true, noOver: true })),
  ];
}

export { NAMES, lines, SPEAKER };
