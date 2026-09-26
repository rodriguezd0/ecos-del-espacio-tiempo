// Regreso al laboratorio con el Core y duelo con Gael (B01 §4.7; D05, D05b). Se dispara solo al entrar en
// laboratorio_alerce con b01_escorted (el agente del norte hace el fundido y el warp a LAB.escort).
import { F, SPEAKER, SPRITE, AUDIO, when, playerPronoun } from './b01_town_common.js';
import { LAB } from './b01_town_lab.js';
import { getTrainer } from '../trainers/index.js';

const A = SPEAKER.alerce;
const G = SPEAKER.gael;
const P = SPEAKER.police;
const say = (ctx, speaker, text) => ctx.say(text, { speaker });
const core = (ctx, text) => ctx.say(text, { telepathy: true });

/**
 * Configuración del combate contra Gael: el entrenador se resuelve por id (content/trainers/b01_town.js →
 * gael_1, con el inicial de ventaja según el estado). Sin game over: canLose (guion §4.7).
 */
export function gaelBattleConfig(state) {
  const t = getTrainer('gael_1', state); // valida que exista y que su equipo se pueda formar
  if (!t.party?.length) throw new Error('gael_1 sin Pokémon');
  return {
    type: 'trainer',
    trainer: 'gael_1',
    bgm: t.bgm,
    canLose: true,
    rules: { canLose: true, noMoneyLoss: true, canRun: false, canCatch: false },
  };
}

async function walk(ctx, id, route, speed) {
  await ctx.move(id, route, speed ? { speed } : {});
}

async function returnScene(ctx) {
  ctx.bgm(AUDIO.lab);
  ctx.face('player', 'up');
  await ctx.wait(20);
  ctx.face('policia', 'up');
  await say(ctx, P, 'Profesor, lo encontré en el centro del laberinto. Con… eso.');
  // Alerce se acerca despacio (pausa)
  await walk(ctx, 'alerce', ['left', 'down'], 2);
  ctx.face('alerce', 'down');
  await ctx.wait(50);
  await say(ctx, A, '…Un núcleo.');
  await ctx.wait(20);
  await say(ctx, A, 'Quiero decir… una criatura así no debería estar en Villa Alba. Ni en ninguna parte, sola.');
  ctx.face('alerce', 'right');
  await say(ctx, A, 'Gracias, agente. Yo me hago cargo.');
  ctx.face('policia', 'up');
  await say(ctx, P, 'Más le vale.');
  ctx.face('policia', 'left');
  await say(ctx, P, 'Y tú: la próxima vez que te diga que te quedes quieto, te quedas quieto.');
  await walk(ctx, 'policia', ['down', 'down']);
  ctx.se('door_exit');
  ctx.erase('policia');
  await ctx.wait(20);
  await core(ctx, 'Este humano sabe qué soy.');
  ctx.face('alerce', 'down');
  await say(ctx, A, 'Parece que ha decidido quedarse contigo, \\PN. Eso… no es algo que se pueda ordenar.');
  await gaelChallenge(ctx);
  await duel(ctx);
  await deliverDex(ctx);
}

async function gaelChallenge(ctx) {
  await ctx.emote('gael', '!');
  await walk(ctx, 'gael', ['left', 'left', 'left', 'left', 'left', 'left', 'down', 'down']);
  ctx.face('gael', 'left');
  ctx.face('player', 'right');
  await say(ctx, G, `¿Decidido? ¿Por qué ${playerPronoun(ctx.state)}?`);
  ctx.face('gael', 'up');
  await say(ctx, G, 'Llevo años aquí, profesor. Leyendo cada informe que me dejaba leer. Y aparece esa cosa y se va con quien menos lo buscaba.');
  ctx.face('gael', 'left');
  await say(ctx, G, 'Muy bien. Quiero ver qué es lo que ha visto en ti. \\PN, combate conmigo.');
}

async function duel(ctx) {
  let outcome = 'win';
  try {
    outcome = await ctx.battle(gaelBattleConfig(ctx.state));
  } catch (err) {
    console.error('Combate con Gael', err);
  }
  ctx.setFlag(F.duel);
  ctx.bgm(AUDIO.lab);
  if (outcome !== 'win') {
    // Sin game over (§4.7): se cura y la historia continúa igual.
    ctx.heal();
    await say(ctx, G, 'Ya está. Sigo sin entenderlo.');
  }
}

async function deliverDex(ctx) {
  ctx.face('alerce', 'down');
  await say(ctx, A, 'Tomad esto. Los dos.');
  ctx.state.obtainPokedex(); // dex.obtained = true + objeto clave POKEDEXAXIS
  ctx.me(AUDIO.keyItem);
  await ctx.say('¡\\PN ha recibido la \\c[1]Pokédex\\c[0]!');
  await ctx.giveItem('POKEBALL', 5);
  await say(ctx, A, 'La Pokédex registra a cada Pokémon que veáis o capturéis. Y también me enviará lecturas del terreno.');
  await say(ctx, A, 'Anoche mis instrumentos marcaron una lectura extraña al sur, en las ruinas del \\c[1]Pilar del Umbral\\c[0], pasada la Ruta 1. Nunca había reaccionado así.');
  // B01 §4.7 recortado (autor, 25-09-2026): sin «Y hay partes de mí por el camino» (mecánicas más ocultas).
  await core(ctx, 'Allí. Algo antiguo se ha movido.');
  await say(ctx, A, 'Id con cuidado. Y \\PN… cuida de él. Creo que él también cuidará de ti.');
  ctx.face('gael', 'left');
  await say(ctx, G, 'Nos vemos allí. Llegaré antes.');
  const g = ctx.world.events.find((e) => e.id === 'gael');
  if (g) {
    const route = ['down'];
    for (let y = g.y + 1; y < LAB.entry.y; y++) route.push('down');
    await walk(ctx, 'gael', route);
  }
  ctx.se('door_exit');
  ctx.erase('gael');
  ctx.setFlag(F.dex);
}

/**
 * Eventos del regreso: director (auto) y el policía que acompaña al jugador. Si la partida se corta tras el
 * duelo, la segunda página del director entrega la Pokédex al volver a entrar (recompensa única).
 */
export function labReturnEvents() {
  const active = when({ all: [F.escorted], none: [F.duel] });
  return [
    {
      id: 'escena_regreso', x: 0, y: 1, trigger: 'auto',
      pages: [
        { when: active, script: returnScene },
        { when: when({ all: [F.escorted, F.duel], none: [F.dex] }), script: deliverDex },
      ],
    },
    {
      id: 'policia', x: LAB.police.x, y: LAB.police.y, sprite: SPRITE.police, dir: LAB.police.dir, when: active, trigger: 'action',
      script: async (ctx) => { await say(ctx, P, 'Habla con el profesor.'); },
    },
  ];
}
