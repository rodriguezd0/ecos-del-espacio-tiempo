// T07 «La colmena de la Reserva» (docs/TABLILLAS.md §4.5; CAMPANA B09 punto 2): Iván quiere quemar la colmena
// gigante, construida alrededor de «una losa que zumba». Se siguen las obreras (Cutiefly y Ribombee) hasta las tres
// flores de las que comen (pradera, orilla de la laguna y huerto), se colocan ante la colmena y sale la reina:
// Vespiquen Alfa nv 36 (captura opcional). La colmena se traslada, aparece la Tabla Bicho (Crónica VII), Iván da la
// Scolipedita y la Reserva reabre entera. Reintento sin pérdida: derrota → curación ante la colmena; huida → la reina
// vuelve a esconderse; vencida sin capturar → reaparece al descansar (§2.6, TABLILLAS §4.8).
import { F, V, SPEAKER, SPRITE, MUSIC, say, lines, core, byGender, pause, restCount } from './b09a_common.js';
import { ZONES, zoneByKey, workerFlown, withWorker, flowersHeld, allFlowers, t07Phase, alphaReturns, flightPath } from './b09a_t07_logic.js';
import { VESPIQUEN_ALPHA } from '../encounters/b09a.js';
import { RESERVE, FLOWERS, WORKERS } from '../maps/b09a/ruta_14_layout.js';

const I = SPEAKER.ivan;
const HIVE = RESERVE.hive;
const MOVED = RESERVE.movedHive;

export const T07_TEXT = Object.freeze({
  hive: 'Una colmena enorme, más alta que una persona. El panal está pegado a una losa de piedra gris. Toda la colmena zumba… y la losa también.',
  plain: 'Flores silvestres. Ninguna tiene rastro de polen.',
  noPollenYet: 'Hay muchas flores iguales. Sin saber de cuál comen las obreras, no hay forma de elegir.',
  pollen: (z) => `¡Esta flor está cubierta de polen ${z.pollen}! Es la misma que visitaba la obrera.`,
  picked: (z, n) => `Has cogido ${z.name}. (${n}/3)`,
  missing: (n) => `Las obreras entran y salen sin parar. Faltan flores: llevas ${n} de 3.`,
  place: 'Colocas las tres flores al pie de la colmena.',
  queen: '¡La reina sale de la colmena!',
  queenAgain: 'Las flores siguen al pie de la colmena. Dentro, algo grande zumba.',
  queenHides: 'La reina se ha vuelto a meter en la colmena.',
  moved: 'Las obreras levantan el panal entre todas y se lo llevan, poco a poco, hacia el fondo de la Reserva.',
  empty: 'Aquí estuvo la colmena. Solo quedan unas marcas en el suelo.',
});

// ------------------------------------------------------------ escena de la colmena
async function firstLook(ctx) {
  // Llegada sin pasar por la puerta (p. ej. nadando por el brazo norte): el arco empieza igual (TABLILLAS §4.2).
  if (!ctx.flag(F.gatePass)) ctx.setFlag(F.gatePass);
  ctx.setFlag(F.hiveSeen);
  await ctx.say(T07_TEXT.hive);
  await ctx.story.advanceClue('T07', 2);
  await core(ctx, 'Esa piedra está escrita. Lo noto desde aquí.');
  // Iván se acerca desde la puerta para explicar.
  const ivan = ctx.world.events.find((e) => e.id === 'ivan_reserva');
  if (ivan && !ivan.erased) { await ctx.approach(ivan); ctx.face('player', ctx.directionTo(ctx.player, ivan)); }
  await lines(ctx, I, [
    'Se ha construido alrededor de esa losa. Llevan semanas trayendo cera sin parar, fuera de temporada.',
    'Si no se va, tendré que quemarla. No quiero. Pero la Reserva no puede seguir cerrada.',
    'Aunque… una reina así solo sale cuando le traen las flores de las que comen. Y las obreras de esta colmena comen de tres flores distintas.',
    'Las Cutiefly y las Ribombee que ves alrededor llevan polen en las patas. Síguelas: van y vuelven de su flor.',
  ]);
}

async function queenBattle(ctx) {
  await ctx.say(T07_TEXT.queen);
  ctx.cry?.(VESPIQUEN_ALPHA.species);
  await ctx.shake?.(3, 6, 20);
  const outcome = await ctx.battle({
    type: 'wild', wild: { ...VESPIQUEN_ALPHA }, bgm: MUSIC.boss, canLose: true,
    rules: { canLose: true, noMoneyLoss: true },
  });
  if (outcome === 'lose') {
    ctx.heal();
    await ctx.warp(ctx.map.id, RESERVE.hiveFront.x, RESERVE.hiveFront.y, 8);
    await say(ctx, I, '¿Estás bien? Tus Pokémon están agotados, pero ya los he atendido. La reina no se ha movido de ahí.');
    return;
  }
  if (outcome !== 'win' && outcome !== 'caught') {
    await ctx.say(T07_TEXT.queenHides);
    return;
  }
  ctx.setFlag(F.alpha);
  if (outcome === 'caught') ctx.setFlag(F.alphaCaught);
  else ctx.setVar(V.vespiquenRest, restCount(ctx.state));
  await resolve(ctx, outcome === 'caught');
}

async function resolve(ctx, caught) {
  await ctx.say(T07_TEXT.moved);
  await ctx.fade('out', 24);
  ctx.setFlag(F.reserveOpen); // el enjambre que cerraba la Reserva interior se va con la colmena
  ctx.requestRefresh();
  await pause(ctx, 20);
  await ctx.fade('in', 24);
  ctx.se?.('Anim/Saint3');
  await ctx.say('Donde estaba la colmena queda la losa, y sigue zumbando. Al tocarla, el zumbido se apaga.');
  await core(ctx, 'Es una de ellas. La guardaban los pequeños.');
  await ctx.story.giveTablet('INSECTPLATE');
  ctx.setFlag(F.t07Done);
  await lines(ctx, I, [
    caught ? 'Te has llevado a la reina… y la colmena se ha mudado igual. Las obreras saben cuidarse solas.' : 'La reina ha cedido. Y se han mudado al fondo de la Reserva, donde no molestan a nadie.',
    'No habrá que quemar nada. Mañana abrimos la Reserva a los visitantes.',
    'Los pequeños saben antes que nadie cuándo va a cambiar la tierra. Tendríamos que escucharlos más.',
    `Toma. Lo encontramos en la muda de un Scolipede viejo. Seguro que le sacas más partido que yo, ${byGender(ctx.state, 'chaval', 'chavala')}.`,
  ]);
  await ctx.giveItem('SCOLIPITE', 1);
  ctx.setFlag(F.scolipite);
}

async function hiveScript(ctx) {
  const phase = t07Phase(ctx.state);
  if (phase === 'done') { await ctx.say(T07_TEXT.empty); return; }
  if (phase === 'closed' || phase === 'open') { await firstLook(ctx); return; }
  if (phase === 'gather') { await ctx.say(T07_TEXT.missing(flowersHeld(ctx.state))); return; }
  if (phase === 'ready') {
    await ctx.say(T07_TEXT.place);
    ctx.setFlag(F.flowersSet);
    await pause(ctx, 20);
    await queenBattle(ctx);
    return;
  }
  await ctx.say(T07_TEXT.queenAgain);
  await queenBattle(ctx);
}

/** La colmena (96×96, anclada abajo en el centro) y sus bloqueos. */
function hiveEvents() {
  const [hx, hy, hw, hh] = HIVE.tiles;
  const blocks = [];
  for (let y = hy; y < hy + hh; y++) for (let x = hx; x < hx + hw; x++) if (!(x === HIVE.x && y === HIVE.y)) blocks.push({ id: `colmena_bloqueo_${x}_${y}`, x, y, solid: true, noOver: true });
  const [mx, my, mw, mh] = MOVED.tiles;
  const movedBlocks = [];
  for (let y = my; y < my + mh; y++) {
    for (let x = mx; x < mx + mw; x++) {
      if (x === MOVED.x && y === MOVED.y) continue;
      movedBlocks.push({ id: `colmena_mudada_bloqueo_${x}_${y}`, x, y, pages: [{ when: (s) => Boolean(s) && s.flag(F.t07Done), solid: true, noOver: true }] });
    }
  }
  const base = { sprite: SPRITE.hive, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: hiveScript };
  return [
    {
      id: 'colmena', x: HIVE.x, y: HIVE.y, name: 'Colmena',
      pages: [
        { ...base, dir: 2, stepAnime: true, speed: 3 },
        { ...base, dir: 4, stepAnime: true, speed: 3, when: (s) => Boolean(s) && s.flag(F.flowersSet) },
        { ...base, dir: 8, stepAnime: false, when: (s) => Boolean(s) && s.flag(F.t07Done) },
      ],
    },
    ...blocks,
    // Franja delante de la colmena: la primera vez que se acerca el jugador, Iván explica (segunda pista).
    ...[HIVE.x - 1, HIVE.x, HIVE.x + 1].map((x) => ({
      id: `colmena_llegada_${x}`, x, y: HIVE.y + 2, trigger: 'touch', through: true,
      when: (s) => Boolean(s) && !s.flag(F.hiveSeen) && (s.flag(F.gatePass) || s.flag(F.ivan)),
      script: async (ctx) => { if (!ctx.flag(F.hiveSeen)) await firstLook(ctx); },
    })),
    // Colmena mudada al fondo de la Reserva interior (decorado) y el Alfa que reaparece al descansar.
    {
      id: 'colmena_mudada', x: MOVED.x, y: MOVED.y, name: 'Colmena',
      pages: [{ ...base, dir: 2, stepAnime: true, speed: 3, when: (s) => Boolean(s) && s.flag(F.t07Done),
        script: async (ctx) => { await ctx.say('La colmena gigante, en su sitio nuevo. Las obreras zumban tranquilas.'); } }],
    },
    ...movedBlocks,
    {
      id: 'vespiquen_alfa', x: MOVED.x - 3, y: MOVED.y - 1, name: 'Vespiquen',
      pages: [{
        when: (s) => Boolean(s) && alphaReturns(s), sprite: SPRITE.vespiquen, dir: 2, move: { wander: 1 }, stepAnime: true, trigger: 'action',
        script: async (ctx) => {
          ctx.cry?.(VESPIQUEN_ALPHA.species);
          await ctx.say('¡La reina de la colmena vigila su nuevo hogar!');
          const outcome = await ctx.battle({ type: 'wild', wild: { ...VESPIQUEN_ALPHA }, bgm: MUSIC.boss });
          if (outcome === 'caught') ctx.setFlag(F.alphaCaught);
          else if (outcome === 'win') ctx.setVar(V.vespiquenRest, restCount(ctx.state));
        },
      }],
    },
  ];
}

// ------------------------------------------------------------ obreras y flores
async function workerFlies(ctx, key) {
  const z = zoneByKey(key);
  const w = WORKERS[key];
  const bee = ctx.world.events.find((e) => e.id === `obrera_${key}`);
  await ctx.say(`Una ${z.worker === 'RIBOMBEE' ? 'Ribombee' : 'Cutiefly'} con las patas cubiertas de polen ${z.pollen}. Echa a volar hacia ${z.place}.`);
  if (bee) {
    ctx.cry?.(z.worker);
    await ctx.move(bee, flightPath(w.from, w.to), { through: true, speed: 4 });
    ctx.erase(bee);
  }
  ctx.setVar(V.bees, withWorker(ctx.var(V.bees, 0), key));
}

function workerEvents() {
  return ZONES.flatMap((z) => {
    const w = WORKERS[z.key];
    const sprite = z.worker === 'RIBOMBEE' ? SPRITE.ribombee : SPRITE.cutiefly;
    const active = (s) => Boolean(s) && !s.flag(F.t07Done) && s.flag(F.hiveSeen);
    return [
      {
        id: `obrera_${z.key}`, x: w.from.x, y: w.from.y, name: z.worker,
        pages: [{ when: (s) => active(s) && !workerFlown(s, z.key) && !s.flag(z.flag), sprite, dir: 2, move: 'still', stepAnime: true, trigger: 'action',
          script: (ctx) => workerFlies(ctx, z.key) }],
      },
      {
        id: `obrera_${z.key}_flor`, x: w.to.x, y: w.to.y, name: z.worker,
        pages: [{ when: (s) => active(s) && workerFlown(s, z.key) && !s.flag(z.flag), sprite, dir: 2, move: 'still', stepAnime: true, through: true, trigger: 'action',
          script: async (ctx) => { await ctx.say(`La obrera revolotea sobre ${z.name}.`); } }],
      },
    ];
  });
}

async function pickFlower(ctx, key) {
  const z = zoneByKey(key);
  if (!workerFlown(ctx.state, key) && !ctx.flag(F.hiveSeen)) { await ctx.say(T07_TEXT.plain); return; }
  if (!workerFlown(ctx.state, key)) { await ctx.say(T07_TEXT.noPollenYet); return; }
  await ctx.say(T07_TEXT.pollen(z));
  ctx.se?.('Mining item get');
  ctx.setFlag(z.flag);
  await ctx.say(T07_TEXT.picked(z, flowersHeld(ctx.state)));
  if (allFlowers(ctx.state)) await ctx.say('Ya tienes las tres. Hay que llevarlas a la colmena.');
}

function flowerEvents() {
  const out = [];
  for (const z of ZONES) {
    const spot = FLOWERS[z.key];
    const plainPattern = ZONES.indexOf(z);
    const base = { sprite: SPRITE.flowers, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action' };
    out.push({
      id: `flor_${z.key}`, x: spot.good.x, y: spot.good.y, name: 'Flor',
      pages: [
        { ...base, dir: 8, pattern: plainPattern, stepAnime: false, script: (ctx) => pickFlower(ctx, z.key) },
        { ...base, dir: z.row, stepAnime: true, speed: 3, when: (s) => Boolean(s) && workerFlown(s, z.key) && !s.flag(z.flag) && !s.flag(F.t07Done), script: (ctx) => pickFlower(ctx, z.key) },
        { ...base, dir: 8, pattern: plainPattern, stepAnime: false, when: (s) => Boolean(s) && (s.flag(z.flag) || s.flag(F.t07Done)),
          script: async (ctx) => { await ctx.say('Flores silvestres. A una le falta una rama.'); } },
      ],
    });
    spot.decoys.forEach(([x, y], i) => out.push({
      id: `flor_${z.key}_senuelo_${i}`, x, y, name: 'Flor',
      pages: [{ ...base, dir: 8, pattern: (plainPattern + i) % 4, stepAnime: false, script: async (ctx) => { await ctx.say(T07_TEXT.plain); } }],
    }));
  }
  return out;
}

export function t07Events() {
  return [...hiveEvents(), ...workerEvents(), ...flowerEvents()];
}

export { t07Phase };
