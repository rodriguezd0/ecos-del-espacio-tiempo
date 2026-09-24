// Galerías de la Cantería Solano: el rescate estratigráfico (docs/TABLILLAS.md T04; CAMPANA B07). Tres salas
// (content/events/b07_strata_rooms.js) con rocas del derrumbe por estratos que se rompen con Embestida de arriba
// abajo («Nunca rompas la capa que sostiene a otra»); romper una que sostiene otra provoca un pequeño derrumbe y la
// sala se reinicia (la primera vez llama Alerce por la Pokédex). Bajo las capas, la cuadrilla de Timburr y Quino;
// bajo la última capa de pizarra, la Tabla Pétrea y la veta de piedra activadora. Reglas puras: b07_strata_logic.js.
import { room } from './b07_strata_rooms.js';
import { stratumOf, canBreak, remainingRocks } from './b07_strata_logic.js';
import {
  F, V, SPEAKER, SPRITE, OBJ, TIMBURR_FLAGS, lines, zygardeSays, alerceCall, byGender, kid, eventById, routeTo,
} from './b07_common.js';
import { FIELD_TEXT } from '../zygarde/texts.js';
import { GALERIAS, CANTERIA } from '../maps/b07/layout.js';

export const MAP_ID = 'canteria_solano';
const G = GALERIAS;
const Q = { speaker: SPEAKER.quino };
const WHITE_GREEN = [228, 255, 214];

export const GALERIAS_TEXT = Object.freeze({
  rock: (name) => `Un bloque de ${name} caído del techo. Tiene una fisura blanca.`,
  rubble: 'Escombros del derrumbe, bien encajados. No hay forma de moverlos.',
  collapse: '¡Crac! Esa roca sostenía la capa de encima. Las piedras de arriba se vienen abajo…',
  reset: 'Cuando se asienta el polvo, la galería está como antes de empezar. Habrá que volver a hacerlo, de arriba abajo.',
  panel: 'Una tabla de madera con letra de tiza, la de Quino:\n«OCRE · GRIS · ROJA · NEGRA»\n«De arriba abajo. La de abajo aguanta a la de arriba.»',
  shaftClosed: 'Unos tablones tapan la boca de un pozo. De abajo sube el ruido de alguien picando piedra.',
  shaftAsk: 'Una escala de cuerda baja por el pozo. ¿Bajar a la galería siguiente?',
  ropeAsk: '¿Subir por la cuerda a la galería de arriba?',
  vein: 'Una veta de piedras de todos los colores atraviesa la pizarra. Brilla como si tuviera algo dentro.',
  veinNoTools: 'Sin herramientas de cantero no hay forma de sacarla sin romperla.',
  veinTaken: 'Donde estaba la veta queda un hueco que todavía brilla un poco.',
});

// ───────────────────────────── Estado de las salas ─────────────────────────────

/** Máscara de rocas rotas de la sala n. */
export const brokenMask = (s, n) => Number(s?.var(V.sala(n), 0)) || 0;

/** ¿Está resuelta la sala? (sus atrapados fuera; la última, además, con la Tablilla). */
export function roomSolved(s, n) {
  if (!s) return false;
  if (n === 1) return s.flag(F.timburr1);
  if (n === 2) return s.flag(F.timburr2) && s.flag(F.timburr3);
  return s.flag(F.quino) && s.flag(F.tablilla);
}

/** Reinicia las rocas de una sala sin resolver (al entrar desde arriba o tras un derrumbe). */
export function resetRoomIfUnsolved(state, n) {
  if (!roomSolved(state, n)) state.setVar(V.sala(n), 0);
}

/** Casilla del mapa de la casilla (x, y) de la sala n. */
export const inMap = (n, x, y) => [x + G.rooms[n].ox, y + G.rooms[n].oy];
/** Llegada a la sala n (su marca S). */
export function roomStart(n) {
  const [x, y] = room(n).marks.S[0];
  return inMap(n, x, y);
}
/** Casilla junto al pozo de la sala n (llegada al subir por la cuerda de la sala n+1). */
export function shaftSide(n) {
  const [x, y] = room(n).marks.E[0];
  return inMap(n, x + 1, y);
}

function fx(ctx, name, opts) {
  try {
    return ctx.effect?.(name, opts) || null;
  } catch (err) {
    console.warn(`[b07] efecto ${name}`, err);
    return null;
  }
}

// ───────────────────────────── Romper rocas ─────────────────────────────

/** Embestida sobre una roca de estrato: retroceso, golpe, hexágonos y la roca que se deshace. */
async function breakRock(ctx, ev) {
  ctx.face('player', ctx.directionTo(ctx.player, ev));
  await ctx.wait(4);
  await ctx.move('player', ['backward', { wait: 4 }, 'forward'], { through: false, speed: 4.5 });
  ctx.se('PRSFX- Head Smash');
  const burst = fx(ctx, 'zygardeHexBurst', { x: ev.x, y: ev.y, mode: 'out', count: 14, color: WHITE_GREEN });
  await ctx.flash([255, 255, 255], 6, 110);
  ctx.shake(5, 9, 14);
  ctx.se('Rock Smash');
  for (let f = 1; f <= 10; f++) {
    ev.opacity = Math.round(255 * (1 - f / 10));
    await ctx.wait(1);
  }
  burst?.remove?.(20);
}

/** Pequeño derrumbe: polvo, temblor, la sala vuelve a su estado inicial y el jugador a la entrada de la sala. */
async function collapse(ctx, n, rock) {
  ctx.se('Mining collapse');
  ctx.shake(8, 8, 50);
  const [cx, cy] = inMap(n, rock.x, rock.y);
  [[0, 0], [-1, -1], [1, -1], [0, -2]].forEach(([dx, dy], k) => {
    ctx.world.spawnEvent({
      id: `__polvo_${k}`, x: cx + dx, y: cy + dy, sprite: SPRITE.smoke, dir: 2, stepAnime: true, speed: 4,
      directionFix: true, walkAnime: false, through: true, alwaysOnTop: true,
    });
  });
  await ctx.flash([210, 190, 160], 16, 160);
  await ctx.say(GALERIAS_TEXT.collapse);
  await ctx.fade('out', 24);
  ctx.setVar(V.sala(n), 0);
  ctx.setVar(V.derrumbes, (Number(ctx.var(V.derrumbes, 0)) || 0) + 1);
  const [sx, sy] = roomStart(n);
  await ctx.warp(MAP_ID, sx, sy, 8, { fade: false });
  await ctx.fade('in', 24);
  await ctx.say(GALERIAS_TEXT.reset);
  if (!ctx.flag(F.llamada)) {
    ctx.setFlag(F.llamada);
    await alerceCall(ctx, [
      '\\PN, ¿estás bien? Aquí fuera ha retumbado todo.',
      'Esa roca sostenía otra. Si dos rocas se tocan, la de la capa de abajo aguanta a la de arriba.',
      'Mira los colores antes de embestir: ocre, gris, roja, negra. Siempre de arriba abajo, aunque haya que dar la vuelta.',
    ]);
  } else {
    await zygardeSays(ctx, 'Arriba primero.');
  }
}

async function rockScript(ctx, n, i) {
  const r = room(n);
  const rock = r.rocks[i];
  const st = stratumOf(rock.key);
  await ctx.say(GALERIAS_TEXT.rock(st.name));
  if (!ctx.zygarde('ram')) { await ctx.say(FIELD_TEXT.ramRock); return; }
  if ((await ctx.choice(['Sí', 'No'], { message: FIELD_TEXT.ramAsk, cancel: 1 })) !== 0) return;
  const before = brokenMask(ctx.state, n);
  const legal = canBreak(remainingRocks(r, before), rock);
  await breakRock(ctx, ctx.event);
  ctx.setVar(V.sala(n), before | (1 << i));
  if (!legal) { await collapse(ctx, n, rock); return; }
  await afterBreak(ctx, n);
}

/** Tras una rotura correcta: en la última sala, con toda la pizarra rota, aparecen la Tablilla y la veta. */
async function afterBreak(ctx, n) {
  if (n !== 3 || ctx.flag(F.tablilla)) return;
  const r = room(3);
  const mask = brokenMask(ctx.state, 3);
  const deepest = r.rocks.filter((k) => k.key === 'd');
  if (deepest.every((k) => mask & (1 << k.i))) await tabletScene(ctx);
}

// ───────────────────────────── Tablilla, veta y salida ─────────────────────────────

async function tabletScene(ctx) {
  const [vx, vy] = inMap(3, ...room(3).marks.V[0]);
  const last = room(3).rocks.filter((k) => k.key === 'd').map((k) => inMap(3, k.x, k.y));
  const [tx, ty] = last[0];
  ctx.se('Anim/Earth4');
  ctx.shake(3, 6, 20);
  const tab = ctx.world.spawnEvent({
    id: '__tabla_petrea', x: tx, y: ty, sprite: OBJ.tablet, dir: 2, stepAnime: true, speed: 3, through: true,
    directionFix: true, walkAnime: false, light: { radius: 48, intensity: 0.8 },
  });
  await ctx.wait(20);
  await ctx.say('Bajo la última capa de pizarra asoma una losa de piedra tallada. Brilla con luz propia.');
  await zygardeSays(ctx, 'Las capas la guardaban. Por eso nadie la encontró.');
  ctx.world.removeEvent?.(tab);
  await ctx.story.giveTablet('STONEPLATE');
  ctx.setFlag(F.tablilla);
  ctx.se('PRSFX- Rock Polish');
  const glow = fx(ctx, 'softLight', { x: vx, y: vy, radius: 72, color: [255, 220, 150], intensity: 0.8, pulse: 0.4, fadeIn: 20 });
  await ctx.flash([255, 240, 200], 12, 120);
  await ctx.say('En la pared de al lado se enciende una veta de piedras de todos los colores.');
  glow?.remove?.(60);
  if (ctx.flag(F.quino)) await stoneAndExit(ctx);
  else await zygardeSays(ctx, 'Queda alguien bajo las capas del oeste.');
}

/** Quino arranca un trozo de la veta y saca al jugador por el pozo de ventilación (con Quino y la Tablilla). */
export async function stoneAndExit(ctx) {
  if (!ctx.flag(F.quino) || !ctx.flag(F.tablilla) || ctx.flag(F.piedra)) return;
  await lines(ctx, SPEAKER.quino, [
    '¿Y eso que brilla en la pared? …No puede ser.',
    'Toda la vida picando esta cantera y nunca había visto una veta así. Piedras con un remolino de colores dentro.',
    'Aparta, que esto se saca con cuidado.',
  ]);
  for (let k = 0; k < 3; k++) { ctx.se('Mining hammer'); ctx.shake(1, 8, 6); await ctx.wait(14); }
  ctx.setFlag(F.piedra);
  ctx.me('item_get');
  await ctx.say('Quino ha arrancado un trozo de la veta: una piedra redonda que tiene dentro un remolino de colores.');
  await ctx.say(`Toma, ${kid(ctx.state)}. Sin ti seguiría ahí dentro, y yo con ella. Guárdala hasta que la vea Bea.`, Q);
  await ctx.say('Por el pozo de ventilación se vuelve a la boca de la galería. Vamos, que mi hermana estará subiéndose por las paredes.', Q);
  await ctx.fade('out', 30);
  const m = CANTERIA.mineFront;
  await ctx.warp('ruta_6', m.x, m.y, m.dir, { fade: false });
  await ctx.fade('in', 30);
}

// ───────────────────────────── Rescates ─────────────────────────────

/** Dirección desde un atrapado hacia la casilla por la que se le libera (la de su roca de abajo). */
function openingDir(r, x, y) {
  for (const [d, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) {
    if (r.rocks.some((k) => k.x === x + dx && k.y === y + dy)) return d;
  }
  return 2;
}

async function rescueTimburr(ctx, n, k) {
  const flag = TIMBURR_FLAGS[n][k];
  if (ctx.flag(flag)) return;
  const ev = ctx.event;
  ctx.cry('TIMBURR');
  await ctx.say('¡Timbuuurr!');
  await ctx.jump(ev, 0, 0);
  await ctx.say('El Timburr se sacude el polvo, se echa su viga al hombro y te mira con cara de alivio.');
  ctx.setFlag(flag);
  for (let f = 1; f <= 12; f++) { ev.opacity = Math.round(255 * (1 - f / 12)); await ctx.wait(1); }
  const all = TIMBURR_FLAGS[n].every((fl) => ctx.flag(fl));
  if (n === 1) {
    await ctx.say('Con la viga, el Timburr aparta los tablones que tapaban un pozo junto a la entrada. Luego sale corriendo hacia la luz.');
    await zygardeSays(ctx, 'Abajo hay más. Los oigo.');
  } else if (all) {
    await ctx.say('Los dos Timburr apartan juntos los tablones del pozo que baja a la última galería y se van hacia la salida.');
  } else {
    await ctx.say('El Timburr sale corriendo hacia la salida. Aún se oye a otro golpear la roca.');
  }
}

async function rescueQuino(ctx) {
  if (ctx.flag(F.quino)) return;
  const ev = ctx.event;
  ctx.turnToPlayer(ev);
  await lines(ctx, SPEAKER.quino, [
    (s) => `¡Eh! ¿Quién anda…? ¿${byGender(s, 'Un chaval', 'Una chavala')}? ¿Te manda Bea?`,
    'Ja. Tenía que ser ella. Llevo toda la mañana aquí metido, contando capas para no pensar.',
    'Estoy entero, que es lo que importa. ¿Y los Timburr? ¿Has sacado a los tres?',
  ]);
  const crew = [F.timburr1, F.timburr2, F.timburr3].every((f) => ctx.flag(f));
  await ctx.say(crew ? 'Menos mal. Son lo mejor de esta cantera.' : 'Pues vamos a por ellos en cuanto salga de aquí.', Q);
  await ctx.say('Quino se escurre por el hueco de la roca roja, tosiendo polvo, y sale a la galería.');
  for (let f = 1; f <= 10; f++) { ev.opacity = Math.round(255 * (1 - f / 10)); await ctx.wait(1); }
  ctx.setFlag(F.quino);
  if (ctx.flag(F.tablilla)) { await stoneAndExit(ctx); return; }
  await lines(ctx, SPEAKER.quino, [
    'Cuando cayó el techo vi algo en la pizarra negra, ahí al fondo, en la pila grande. Brillaba.',
    'Esa pizarra aguanta todo lo que tiene encima. Quita primero lo de arriba, o nos cae la montaña.',
  ]);
}

async function quinoHints(ctx) {
  if (ctx.flag(F.tablilla)) { await stoneAndExit(ctx); return; }
  await ctx.say('La pila grande: ocre arriba, luego gris, roja y la pizarra al fondo. Mira qué toca a qué antes de embestir.', Q);
}

// ───────────────────────────── Eventos ─────────────────────────────

function rockEvents(n) {
  const r = room(n);
  return r.rocks.map((rock) => {
    const st = stratumOf(rock.key);
    const [x, y] = inMap(n, rock.x, rock.y);
    return {
      id: `roca_s${n}_${rock.i}`, x, y, name: `Roca de ${st.name}`, strataRock: { room: n, i: rock.i, key: rock.key },
      pages: [{
        when: (s) => !(brokenMask(s, n) & (1 << rock.i)),
        sprite: OBJ.strata, dir: st.row, directionFix: true, walkAnime: false, stepAnime: true, speed: 2,
        solid: true, noOver: true, trigger: 'action', glow: { name: 'zygardeFissure', kind: 'rock' },
        script: (ctx) => rockScript(ctx, n, rock.i),
      }],
    };
  });
}

/** Fila de la hoja de escombros según el suelo de la sala (tierra, arcilla, pizarra). */
const RUBBLE_ROW = Object.freeze({ 1: 2, 2: 4, 3: 6 });

/** Escombros macizos ('#' dentro de la sala, sin las columnas del borde, que ya son pared de cueva). */
function rubbleEvents(n) {
  const r = room(n);
  const out = [];
  r.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '#' || x === 0 || x === r.w - 1) return;
    const [mx, my] = inMap(n, x, y);
    out.push({
      id: `escombro_s${n}_${x}_${y}`, x: mx, y: my, sprite: OBJ.rubble, dir: RUBBLE_ROW[n], pattern: (x * 7 + y * 3) % 4,
      directionFix: true, walkAnime: false, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(GALERIAS_TEXT.rubble); },
    });
  }));
  return out;
}

function peopleEvents() {
  const out = [];
  for (const n of [1, 2]) {
    const r = room(n);
    r.marks.T.forEach(([x, y], k) => {
      const flag = TIMBURR_FLAGS[n][k];
      const [mx, my] = inMap(n, x, y);
      out.push({
        id: `timburr_s${n}_${k}`, x: mx, y: my, name: 'Timburr',
        pages: [{
          when: (s) => !s?.flag(flag), sprite: SPRITE.timburr, dir: openingDir(r, x, y), stepAnime: true, speed: 2,
          solid: true, trigger: 'action', script: (ctx) => rescueTimburr(ctx, n, k),
        }],
      });
    });
  }
  const [qx, qy] = room(3).marks.Q[0];
  const [mx, my] = inMap(3, qx, qy);
  out.push({
    id: 'quino_atrapado', x: mx, y: my, name: SPEAKER.quino,
    pages: [{ when: (s) => !s?.flag(F.quino), sprite: SPRITE.quino, dir: 6, solid: true, trigger: 'action', script: rescueQuino }],
  });
  // Ya fuera, Quino espera al pie de su pila (no en el pasillo central, para no cerrar el paso hacia el este).
  out.push({
    id: 'quino_libre', x: mx, y: my + 2, name: SPEAKER.quino,
    pages: [{ when: (s) => Boolean(s?.flag(F.quino)) && !s.flag(F.piedra), sprite: SPRITE.quino, dir: 6, move: 'look', solid: true, trigger: 'action', script: quinoHints }],
  });
  return out;
}

/** Pozos entre salas (tapados hasta liberar a los Timburr de la sala) y cuerdas para volver arriba. */
function passageEvents() {
  const out = [];
  for (const n of [1, 2]) {
    const [ex, ey] = inMap(n, ...room(n).marks.E[0]);
    const open = (s) => roomSolved(s, n);
    out.push({
      id: `pozo_s${n}`, x: ex, y: ey, name: 'Pozo',
      pages: [
        { sprite: OBJ.shaft, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(GALERIAS_TEXT.shaftClosed); } },
        {
          when: open, sprite: OBJ.shaft, dir: 4, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, through: true,
          trigger: 'touch', script: (ctx) => descend(ctx, n + 1),
        },
      ],
    });
  }
  for (const n of [2, 3]) {
    const [ux, uy] = inMap(n, ...room(n).marks.U[0]);
    out.push({
      id: `cuerda_s${n}`, x: ux, y: uy, name: 'Cuerda', sprite: OBJ.shaft, dir: 6, directionFix: true, walkAnime: false,
      solid: true, trigger: 'action',
      script: async (ctx) => {
        if (!(await ctx.confirm(GALERIAS_TEXT.ropeAsk))) return;
        ctx.se('PRSFX- Rock Climb');
        const [tx, ty] = shaftSide(n - 1);
        await ctx.warp(MAP_ID, tx, ty, 2);
      },
    });
  }
  return out;
}

async function descend(ctx, n) {
  if (!(await ctx.confirm(GALERIAS_TEXT.shaftAsk))) { await ctx.move('player', ['right'], { through: false }); return; }
  resetRoomIfUnsolved(ctx.state, n);
  ctx.se('PRSFX- Rock Climb');
  const [sx, sy] = roomStart(n);
  await ctx.warp(MAP_ID, sx, sy, 8);
  if (n === 3 && !ctx.flag(F.sala3)) {
    ctx.setFlag(F.sala3);
    ctx.shake(1, 6, 10);
    await ctx.say('Tac… tac… Alguien golpea la roca al oeste de la galería.');
    await ctx.say('¡¿Hay alguien?! ¡Aquí, detrás de la roca roja! ¡Estoy bien, pero no puedo salir!', Q);
    await zygardeSays(ctx, 'Ahí. Y al fondo, bajo la piedra negra, algo más viejo que la cantera.');
  }
}

function veinEvent() {
  const [vx, vy] = inMap(3, ...room(3).marks.V[0]);
  const base = { directionFix: true, walkAnime: false, solid: true, noOver: true, trigger: 'action' };
  return {
    id: 'veta_activadora', x: vx, y: vy, name: 'Veta',
    pages: [
      { ...base, sprite: OBJ.rubble, dir: 6, pattern: 1, script: async (ctx) => { await ctx.say(GALERIAS_TEXT.rubble); } },
      {
        ...base, when: (s) => Boolean(s?.flag(F.tablilla)), sprite: OBJ.vein, dir: 4, stepAnime: true, speed: 3, light: { radius: 40, intensity: 0.7 },
        script: async (ctx) => {
          await ctx.say(GALERIAS_TEXT.vein);
          if (ctx.flag(F.quino)) await stoneAndExit(ctx);
          else await ctx.say(GALERIAS_TEXT.veinNoTools);
        },
      },
      { ...base, when: (s) => Boolean(s?.flag(F.piedra)), sprite: OBJ.vein, dir: 6, stepAnime: true, speed: 2, script: async (ctx) => { await ctx.say(GALERIAS_TEXT.veinTaken); } },
    ],
  };
}

function detailEvents() {
  const [px, py] = inMap(1, ...room(1).marks.P[0]);
  // Objetos a la vista en las marcas 'o' de las salas (rincones sin salida); los ocultos no estorban el paso.
  return [
    { id: 'tabla_tiza', type: 'sign', x: px, y: py, solid: true, text: GALERIAS_TEXT.panel },
    { id: 'objeto_galeria_1', type: 'item', ...xy(inMap(2, ...room(2).marks.o[0])), item: 'HARDSTONE' },
    { id: 'objeto_galeria_2', type: 'item', ...xy(inMap(3, ...room(3).marks.o[0])), item: 'HYPERPOTION' },
    { id: 'objeto_galeria_3', type: 'item', ...xy(inMap(1, 9, 5)), item: 'STARDUST', hidden: true },
    { id: 'objeto_galeria_4', type: 'item', ...xy(inMap(3, 1, 8)), item: 'REVIVE', hidden: true },
  ];
}

const xy = ([x, y]) => ({ x, y });

/** Primera vez en las galerías: el polvo reciente y la voz de Zygarde. */
export async function galeriasOnEnter(ctx) {
  if (ctx.flag(F.galerias)) return;
  ctx.setFlag(F.galerias);
  await ctx.say('La galería huele a polvo reciente. Más abajo se oye picar la roca, muy despacio.');
  await zygardeSays(ctx, 'Yo empujo. Tú eliges dónde.');
}

export function galeriasEvents() {
  return [
    ...[1, 2, 3].flatMap((n) => [...rockEvents(n), ...rubbleEvents(n)]),
    ...peopleEvents(),
    ...passageEvents(),
    veinEvent(),
    ...detailEvents(),
  ];
}

export { routeTo, eventById };
