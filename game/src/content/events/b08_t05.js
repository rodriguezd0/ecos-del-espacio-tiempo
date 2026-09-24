// T05 «El Pulso de Estrato» (docs/TABLILLAS.md §4.5): la Maestra Herminia (70) quiere recuperar el Torneo del Pulso
// para que los jóvenes no se vayan; torneo de tres combates contra mineros (33–34) y final contra Sol Galena (Pangoro
// 34, Gurdurr 34, Tinkatuff 35) sobre la Losa del Pulso. Esa noche, restos del Consorcio intentan llevarse la Losa:
// combate doble con Sol de aliada contra dos técnicos. Al tocar la Losa, Zygarde revela que es una Tablilla (Tabla
// Fuerte, FISTPLATE). Recompensa: Medichamita. El torneo vuelve cada semana (revanchas tras descansar). Ningún fallo
// es permanente: perder reinicia el torneo o deja a los técnicos esperando.
import { F, V, SPEAKER, SPRITE, OBJ, lines, zygardeSays, byGender, isNight, findEvent } from './b08_common.js';
import { bossBattle } from '../common/bossBattle.js';
import { solAlly } from '../trainers/b08.js';
import { ESTRATO as E } from '../maps/b08/layout.js';

const T = E.tournament;
const ROUNDS = Object.freeze([
  { trainer: 'b08_t05_minero_1', name: 'Minero Tito', sprite: SPRITE.minero },
  { trainer: 'b08_t05_minera_2', name: 'Minera Lola', sprite: SPRITE.minera },
  { trainer: 'b08_t05_minero_3', name: 'Minero Quique', sprite: SPRITE.minero },
  { trainer: 'b08_t05_sol', name: SPEAKER.sol, sprite: SPRITE.sol, final: true },
]);

export const T05_TEXT = Object.freeze({
  losa: 'La Losa del Pulso: una losa de piedra con dos huecos gastados por siglos de codos.',
  losaHint: 'Esta piedra no pesa como las demás.',
  losaAfter: 'La Losa del Pulso. En el centro queda el hueco de la tabla, y los mineros siguen echando pulsos a su alrededor.',
});

const campeon = (s) => byGender(s, 'campeón', 'campeona');

// ───────────────────────────── Herminia ─────────────────────────────

/** Herminia en la Escuela del Pico (la usa el interior estrato_escuela). */
export async function herminiaSchool(ctx) {
  const say = (t) => ctx.say(typeof t === 'function' ? t(ctx.state) : t, { speaker: SPEAKER.herminia });
  if (!ctx.flag(F.restored)) {
    await say('Cincuenta años enseñando en esta escuela, y nunca había visto la clase tan vacía.');
    await say('Con el suelo moviéndose, las familias se van. Y los chicos detrás.');
    return;
  }
  if (!ctx.flag(F.tournamentOpen)) {
    if (!ctx.flag(F.herminia)) {
      await say('¡El suelo se ha quedado quieto! Ahora hay que conseguir que los jóvenes también se queden.');
      await say('Cuando yo era niña, cada domingo se echaba el Torneo del Pulso en la plaza, sobre la Losa. Toda la ciudad iba a verlo.');
      await say('Hace años que no se celebra. Pero si alguien de fuera se apuntara y ganara… los chicos querrían revancha. Y se quedarían.');
      ctx.setFlag(F.herminia);
    }
    const yes = await ctx.confirm('¿Te apuntas? Tres combates contra los mineros y la final contra la campeona de la mina: Sol Galena.');
    if (!yes) { await say('Piénsatelo. Aquí estaré, con la clase medio vacía.'); return; }
    ctx.setFlag(F.tournamentOpen);
    await ctx.story.openClue('T05', { direct: true, silent: true });
    await say('¡Estupendo! Voy a avisar a todo el mundo. Te espero en la plaza, junto a la Losa.');
    return;
  }
  await say('El torneo es en la plaza, junto a la Losa del Pulso. ¡Allí te espero!');
}

async function runTournament(ctx, { rematch = false } = {}) {
  const herminia = findEvent(ctx, 'herminia_plaza');
  const say = (t) => ctx.say(typeof t === 'function' ? t(ctx.state) : t, { speaker: SPEAKER.herminia });
  const start = ctx.var(V.round, 0);
  if (start === 0) await say(rematch ? '¡Revancha semanal del Torneo del Pulso! Las mismas reglas: tres rondas y la final.' : '¡Empieza el Torneo del Pulso! Tres rondas contra la mina y la final. ¡Sin prisa, que la Losa no se va a ir!');
  const sol = findEvent(ctx, 'sol_noche');
  const solHome = sol ? { x: sol.x, y: sol.y } : null;
  for (let r = start; r < ROUNDS.length; r++) {
    const round = ROUNDS[r];
    const rival = findEvent(ctx, 'rival_torneo');
    if (rival) {
      // El rival de cada ronda sube a la Losa (en la final, Sol en persona).
      rival.characterName = round.final ? '' : round.sprite;
      rival.direction = T.rival.dir;
    }
    if (round.final && sol) { sol.moveTo(T.rival.x, T.rival.y); sol.direction = T.rival.dir; }
    await say(round.final ? '¡Y ahora, la final! ¡Sol Galena, la mejor mano de la mina!' : `Ronda ${r + 1}: ¡${round.name}!`);
    if (round.final) {
      await lines(ctx, SPEAKER.sol, [
        rematch ? '¿Otra vez tú? Esta semana he entrenado.' : (s) => `¿Tú? ¿${byGender(s, 'El', 'La')} que bajó al Cerro con mi padre?`,
        'Aquí no hay Pilar que valga. Aquí se gana con las manos.',
      ]);
    }
    const outcome = await bossBattle(ctx, { trainer: round.trainer }, { x: T.player.x, y: T.player.y, dir: 8 }, {
      speaker: SPEAKER.herminia,
      loseText: `${byGender(ctx.state, 'Eliminado', 'Eliminada')} en esta ronda… ¡pero el torneo se puede repetir! Habla conmigo cuando quieras volver a empezar.`,
      onLose: (c) => c.setVar(V.round, 0),
    });
    if (outcome !== 'win') {
      if (sol && solHome) sol.moveTo(solHome.x, solHome.y);
      return false;
    }
    ctx.setVar(V.round, r + 1);
  }
  ctx.setVar(V.round, 0);
  if (sol && solHome) { sol.moveTo(solHome.x, solHome.y); sol.direction = 4; }
  if (herminia) herminia.turnToward(ctx.player);
  await say((s) => `¡Tenemos ${campeon(s)}! ¡${s.player.name} gana el Torneo del Pulso!`);
  ctx.se('Exclaim');
  await lines(ctx, SPEAKER.sol, [rematch ? 'Otra semana sin ganarte. La próxima no te libras.' : 'Mi abuelo habría querido ver esto. La plaza llena otra vez.']);
  return true;
}

async function herminiaPlaza(ctx) {
  const say = (t) => ctx.say(typeof t === 'function' ? t(ctx.state) : t, { speaker: SPEAKER.herminia });
  if (!ctx.flag(F.tournament)) {
    if (!(await ctx.confirm('¿Empezamos el Torneo del Pulso?'))) { await say('Cuando quieras. Los mineros no se van a ninguna parte.'); return; }
    if (!(await runTournament(ctx))) return;
    ctx.setFlag(F.tournament);
    ctx.setVar(V.rematch, ctx.var(V.restCount, 0)); // la primera revancha, tras descansar al menos una vez
    await say('Esta noche lo celebramos aquí mismo, en la plaza. ¡Toda la ciudad está invitada!');
    if (!isNight(ctx.state)) await say('Vuelve cuando caiga el sol. Puedes descansar en el Centro Pokémon hasta la noche.');
    ctx.requestRefresh();
    return;
  }
  if (!ctx.flag(F.tablet)) {
    await say(isNight(ctx.state) ? '¡Qué noche! ¿Has visto cómo brilla la Losa?' : 'Esta noche es la fiesta. Vuelve cuando caiga el sol.');
    return;
  }
  // Revanchas semanales (TABLILLAS T05: «el torneo vuelve a celebrarse cada semana»): tras descansar.
  const rest = ctx.var(V.restCount, 0);
  if (rest <= ctx.var(V.rematch, -1)) {
    await say('El torneo es cada semana. Descansa y vuelve: los mineros estarán entrenando.');
    return;
  }
  if (!(await ctx.confirm('¿Quieres la revancha del Torneo del Pulso?'))) return;
  if (await runTournament(ctx, { rematch: true })) {
    ctx.setVar(V.rematch, rest);
    await say('¡Otra semana, otro torneo! Toma, de parte de la cooperativa minera.');
    await ctx.giveItem('NUGGET');
  }
}

// ───────────────────────────── La noche: defensa de la Losa ─────────────────────────────

async function nightDefense(ctx) {
  if (ctx.flag(F.defended)) return;
  ctx.setFlag(F.defenseStarted);
  await ctx.say('Se oyen golpes secos en la plaza. Alguien intenta mover la Losa del Pulso.');
  await ctx.fade('out', 20);
  ctx.player.moveTo(T.player.x, T.player.y + 2);
  ctx.player.direction = 8;
  for (const f of ctx.world.followers || []) f.moveTo?.(T.player.x, T.player.y + 3);
  await ctx.wait(4);
  await ctx.fade('in', 20);
  ctx.bgm('EncuentroRocket');
  await lines(ctx, 'Técnico Rogelio', ['Con cuidado… Esta piedra pesa como diez. ¿Seguro que es la muestra que quiere el director?']);
  await lines(ctx, 'Técnica Susana', ['Las lecturas no mienten: resuena. Nos la llevamos entera.']);
  await lines(ctx, SPEAKER.sol, [
    '¡Eh! ¡Esa losa es de Estrato!',
    'Tú, conmigo. Dos contra dos, como en los pulsos por parejas.',
  ]);
  await defenseBattle(ctx);
}

/** El combate doble (también el reintento, hablando con Sol). */
async function defenseBattle(ctx) {
  const outcome = await bossBattle(ctx, {
    type: 'trainer', format: 'double', trainers: ['b08_t05_tecnico', 'b08_t05_tecnica'], ally: solAlly(), bgm: 'EncuentroRocket',
  }, { x: T.player.x, y: T.player.y + 2, dir: 8 }, {
    speaker: SPEAKER.sol, loseText: 'Siguen ahí, forcejeando con la Losa. ¡No se la van a llevar! Otra vez, venga.',
  });
  if (outcome !== 'win') return;
  await lines(ctx, 'Técnica Susana', ['Nos vamos. El director tendrá que conformarse con las lecturas.']);
  for (const id of ['tecnico_noche', 'tecnica_noche']) {
    const ev = findEvent(ctx, id);
    if (ev) { await ctx.move(ev, ['down', 'down', 'right', 'right', 'right', 'right'], { wait: false, through: true, speed: 5 }); }
  }
  await ctx.wait(30);
  ctx.setFlag(F.defended);
  ctx.requestRefresh();
  await lines(ctx, SPEAKER.sol, [
    'Querían llevarse la Losa. ¿Para qué quiere nadie una piedra de echar pulsos?',
  ]);
  await zygardeSays(ctx, 'No es solo una piedra. Tócala.');
}

async function losaScript(ctx) {
  if (ctx.flag(F.tablet)) { await ctx.say(T05_TEXT.losaAfter); return; }
  if (!ctx.flag(F.defended)) {
    await ctx.say(T05_TEXT.losa);
    const clue = (ctx.state.clues || []).find((c) => c.id === 'T05');
    if (clue && clue.status !== 'solved') await zygardeSays(ctx, T05_TEXT.losaHint);
    return;
  }
  await ctx.say('Pones la mano sobre la Losa. Está templada, como si alguien acabara de echar un pulso.');
  await zygardeSays(ctx, 'Esta piedra no es de aquí. Es una tabla.');
  ctx.se('Rock Smash');
  ctx.shake(3, 6, 20);
  await ctx.flash([255, 230, 200], 16, 160);
  await ctx.say('La costra de piedra se agrieta. Debajo, una tabla roja, fría y pesadísima.');
  await ctx.story.giveTablet('FISTPLATE');
  ctx.setFlag(F.tablet);
  const sol = findEvent(ctx, 'sol_noche');
  if (sol) sol.turnToward(ctx.player);
  await lines(ctx, SPEAKER.sol, ['Siglos echando pulsos encima de una… tabla. Mi abuelo no se lo creería.']);
  await lines(ctx, SPEAKER.herminia, [
    '¡La Losa sigue ahí! Con un hueco más, pero ahí. Y el torneo, también.',
    'A partir de ahora, cada semana. Y esto es para quien lo ha devuelto a la vida.',
  ]);
  await ctx.giveItem('MEDICHAMITE');
  ctx.setFlag(F.medichamite);
}

// ───────────────────────────── Eventos ─────────────────────────────

export function t05Events() {
  const L = E.losa;
  const open = (s) => Boolean(s) && s.flag(F.tournamentOpen);
  const night = (s) => Boolean(s) && s.flag(F.tournament) && !s.flag(F.defended) && isNight(s);
  const retry = (s) => night(s) && s.flag(F.defenseStarted);
  return [
    {
      id: 'losa_pulso', x: L.x, y: L.y, name: 'Losa del Pulso',
      pages: [
        { sprite: OBJ.losaPulso, dir: 2, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: losaScript },
        { when: (s) => Boolean(s) && s.flag(F.defended) && !s.flag(F.tablet), sprite: OBJ.losaPulso, dir: 4, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: losaScript, light: { radius: 60, intensity: 0.6 } },
        { when: (s) => Boolean(s?.flag(F.tablet)), sprite: OBJ.losaPulso, dir: 2, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: losaScript },
      ],
    },
    { id: 'losa_pulso_i', x: L.x - 1, y: L.y, solid: true, noOver: true, trigger: 'action', script: losaScript },
    { id: 'losa_pulso_d', x: L.x + 1, y: L.y, solid: true, noOver: true, trigger: 'action', script: losaScript },
    {
      id: 'herminia_plaza', x: T.herminia.x, y: T.herminia.y, name: SPEAKER.herminia,
      pages: [{ when: open, sprite: SPRITE.herminia, dir: T.herminia.dir, trigger: 'action', script: herminiaPlaza }],
    },
    {
      id: 'rival_torneo', x: T.rival.x, y: T.rival.y, name: 'Rival',
      pages: [{ when: (s) => open(s) && !night(s), sprite: SPRITE.minero, dir: T.rival.dir, trigger: 'action', script: herminiaPlaza }],
    },
    ...T.waiting.map(([x, y, dir], i) => ({
      id: `publico_torneo_${i}`, x, y, name: 'Público',
      pages: [{ when: open, sprite: [SPRITE.minera, SPRITE.nino, SPRITE.vecino, SPRITE.estudiante][i % 4], dir, move: 'look', trigger: 'action',
        script: async (ctx) => { await ctx.say(['¡Vamos, vamos!', '¡Yo de mayor también quiero echar pulsos!', 'Hacía años que no veía la plaza tan llena.', 'La maestra Herminia está contentísima.'][i % 4]); } }],
    })),
    // Sol en la plaza: finalista del torneo y aliada de noche.
    {
      id: 'sol_noche', x: T.solNight.x, y: T.solNight.y, name: SPEAKER.sol,
      pages: [
        { when: (s) => Boolean(s) && s.flag(F.coop) && !s.flag(F.tablet), sprite: SPRITE.sol, dir: T.solNight.dir, trigger: 'action',
          script: async (ctx) => { await ctx.say(ctx.flag(F.tournament) ? 'Buen pulso. Esta noche, fiesta.' : 'En la final te espero. No pienso dejarte ganar.', { speaker: SPEAKER.sol }); } },
        { when: retry, sprite: SPRITE.sol, dir: T.solNight.dir, trigger: 'action',
          script: async (ctx) => { await ctx.say('¡Siguen ahí! Venga, otra vez. Dos contra dos.', { speaker: SPEAKER.sol }); await defenseBattle(ctx); } },
        { when: (s) => Boolean(s?.flag(F.tablet)), sprite: SPRITE.sol, dir: 2, trigger: 'action',
          script: async (ctx) => { await ctx.say('La cooperativa se reúne los lunes, el torneo los domingos. Estrato vuelve a tener agenda.', { speaker: SPEAKER.sol }); } },
      ],
    },
    // Técnicos de noche junto a la Losa y el guion que lo dispara.
    ...T.thieves.map(([x, y, dir], i) => ({
      id: i ? 'tecnica_noche' : 'tecnico_noche', x, y, name: 'Técnico',
      pages: [{ when: night, sprite: i ? SPRITE.tecnica : SPRITE.tecnico, dir }],
    })),
    { id: 'escena_noche', x: 0, y: 3, pages: [{ when: (s) => night(s) && !s.flag(F.defenseStarted), trigger: 'auto', script: nightDefense }] },
  ];
}
