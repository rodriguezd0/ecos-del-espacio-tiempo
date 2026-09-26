// T02 «El Molino del Diezmo» (docs/TABLILLAS.md T02; CAMPANA B05 y §5.4): el molinero Anselmo, las tres ruedas
// dentadas repartidas por el molino (sacos, desván y la compuerta del canal alto, que exige Correr), el tren de
// engranajes (colocar y girar: content/events/b05_gears.js), la muela que vuelve a moler a derechas, el eje que se
// abre y deja ver la Tabla Linfa, los técnicos del Consorcio que llegan a «tomar muestras» (combate 18–20; si se
// pierde, se vuelve a la puerta del molino) y Darío, que deja el Consorcio y avisa del Parque Eólico.
import { F, V, SPEAKER, SPRITE, say, byGender } from './b05_common.js';
import { GEAR_NAMES, SENSE_NAMES, SOCKET_SIZES, evaluateGears } from './b05_gears.js';
import { bossBattle } from '../common/bossBattle.js';

export const MILL_ID = 'molino_diezmo';

/** Coordenadas del interior (content/maps/b05/molino_diezmo.js). */
export const MILL = Object.freeze({
  width: 30, height: 12,
  roomA: { x: 1, y: 1, w: 15, h: 10 }, // sala de la muela: suelo y 4–10
  roomB: { x: 18, y: 1, w: 11, h: 8 }, // desván: suelo y 4–8
  door: { x: 8, y: 10 },
  crown: { x: 2, y: 4 }, // corona del eje de la rueda
  sockets: [{ x: 4, y: 4 }, { x: 6, y: 4 }, { x: 8, y: 4 }],
  lantern: { x: 10, y: 4 }, // linterna de la muela
  plaque: { x: 12, y: 4 },
  lever: { x: 12, y: 6 },
  millstone: { x: 8, y: 8 },
  anselmo: { x: 4, y: 7, dir: 6 },
  sacks: [{ x: 2, y: 9, v: 0 }, { x: 3, y: 9, v: 1 }, { x: 13, y: 9, v: 2 }, { x: 14, y: 9, v: 0 }],
  sackGear: { x: 2, y: 9 },
  stairsUp: { stamp: 'escalera_subir_der', x: 14, y: 3, warp: { x: 14, y: 4 }, arrive: { x: 13, y: 4, dir: 4 } },
  stairsDown: { stamp: 'escalera_bajar_der', x: 27, y: 3, warp: { x: 27, y: 4 }, arrive: { x: 26, y: 4, dir: 4 } },
  loftGear: { x: 20, y: 7 },
  backDoor: { x: 22, y: 1, warps: [{ x: 22, y: 4 }, { x: 23, y: 4 }], arrive: { x: 22, y: 5, dir: 2 } },
  techs: [{ x: 7, y: 9, dir: 8 }, { x: 9, y: 9, dir: 8 }],
  dario: { x: 11, y: 8, dir: 4 },
});

const GEAR_FLAGS = Object.freeze({ 1: F.gearSmall, 2: F.gearMedium, 3: F.gearLarge });
const S = SPEAKER;

// ───────────────────────────── Estado del tren ─────────────────────────────

/** Huecos según las variables: [{ gear, sense }] ×3. */
export function socketsOf(state) {
  return SOCKET_SIZES.map((_, i) => ({
    gear: Number(state.var(V.socket(i + 1), 0)) || 0,
    sense: Number(state.var(V.sense(i + 1), 1)) === -1 ? -1 : 1,
  }));
}
/** Ruedas encontradas que no están puestas en ningún hueco. */
export function gearsInHand(state) {
  const placed = socketsOf(state).map((s) => s.gear);
  return [1, 2, 3].filter((g) => state.flag(GEAR_FLAGS[g]) && !placed.includes(g));
}

const running = (s) => Boolean(s?.flag(F.shaftOpen));
/** La rueda de fuera gira al revés (tras el P2 y hasta arreglar el tren). */
const reversed = (s) => Boolean(s?.flag(F.p2)) && !running(s);

// ───────────────────────────── Guiones ─────────────────────────────

async function socketScript(ctx, n) {
  if (running(ctx.state)) { await ctx.say('La rueda dentada gira engranada con sus vecinas.'); return; }
  const st = ctx.state;
  const cur = socketsOf(st)[n - 1];
  const size = GEAR_NAMES[SOCKET_SIZES[n - 1]].replace('rueda dentada ', '');
  if (!cur.gear) {
    const hand = gearsInHand(st);
    await ctx.say(`Hueco ${n}. Alrededor del eje hay un círculo de tiza: marca una rueda dentada ${size}.`);
    if (!hand.length) return;
    const labels = [...hand.map((g) => `Poner la ${GEAR_NAMES[g]}`), 'Nada'];
    const i = await ctx.choice(labels, { message: '¿Qué rueda dentada colocas?', cancel: hand.length });
    const g = hand[i];
    if (!g) return;
    ctx.se('PRSFX- Shift Gear', { volume: 70 });
    ctx.setVar(V.sense(n), 1);
    ctx.setVar(V.socket(n), g);
    await ctx.say(`Has colocado la ${GEAR_NAMES[g]} en el hueco ${n}. Su trinquete deja girar ${SENSE_NAMES[1]}.`);
    return;
  }
  await ctx.say(`Hueco ${n}: la ${GEAR_NAMES[cur.gear]}. La flecha de tiza del trinquete marca que gira ${SENSE_NAMES[cur.sense]}.`);
  const i = await ctx.choice(['Darle la vuelta', 'Quitarla', 'Nada'], { message: '¿Qué haces?', cancel: 2 });
  if (i === 0) {
    ctx.se('PRSFX- Gear Grind', { volume: 60 });
    ctx.setVar(V.sense(n), -cur.sense);
    await ctx.say(`Le has dado la vuelta: ahora el trinquete la deja girar ${SENSE_NAMES[-cur.sense]}.`);
  } else if (i === 1) {
    ctx.setVar(V.socket(n), 0);
    await ctx.say(`Has quitado la ${GEAR_NAMES[cur.gear]}.`);
  }
}

// La rueda de fuera gira al revés desde el P2 (TABLILLAS T02, «estado del mundo»; la noria de B03 en Caudal): el
// embrague une su eje con el tren de engranajes. Con los trinquetes bien puestos, el tren no deja girar al revés y el
// agua empuja la rueda a derechas, como debe.
const FAIL = Object.freeze({
  missing: (n) => `El embrague engancha el eje… pero la fuerza no llega a la muela: falta una rueda dentada en el hueco ${n}.`,
  size: (n) => `Los dientes de la rueda del hueco ${n} patinan contra sus vecinas: no es su tamaño. El círculo de tiza lo marca.`,
  jam: (n) => `¡Clac! El trinquete de la rueda del hueco ${n} se traba y todo el tren se para en seco.`,
  reverse: () => 'La muela empieza a moler al revés, con un gemido de piedra.',
});

async function leverScript(ctx) {
  if (running(ctx.state)) { await ctx.say('El embrague está echado. El agua mueve la rueda y la rueda, la muela.'); return; }
  if (!ctx.flag(F.p2)) { await ctx.say('La palanca del embrague de la rueda. Con el río así, la rueda ni se mueve: no serviría de nada.'); return; }
  if (!(await ctx.confirm('La palanca del embrague: une el eje de la rueda con el tren de engranajes. ¿Echar el embrague?'))) return;
  ctx.se('PRSFX- Water Sport', { volume: 70 });
  await ctx.wait(20);
  ctx.se('PRSFX- Gear Grind', { volume: 80 });
  const r = evaluateGears(socketsOf(ctx.state));
  if (!r.ok) {
    ctx.shake(2, 6, 12);
    await ctx.say(FAIL[r.reason]((r.at ?? 0) + 1));
    if (ctx.world.events.some((e) => e.id === 'anselmo')) await say(ctx, S.anselmo, 'Suelta, suelta, que se parte algo. Prueba otra vez con calma.');
    return;
  }
  await millTurns(ctx);
}

/** Éxito: todo gira, la muela muele a derechas y el eje se abre. */
async function millTurns(ctx) {
  ctx.setFlag(F.shaftOpen);
  ctx.se('PRSFX- Gear Up1', { volume: 80 });
  ctx.shake(2, 4, 30);
  await ctx.wait(40);
  await ctx.say('El embrague engancha. Los trinquetes frenan el giro al revés… y el agua empuja por fin la rueda a derechas.');
  await ctx.say('Las tres ruedas dentadas engranan… ¡y la muela empieza a moler a derechas!');
  await ctx.wait(20);
  ctx.se('PRSFX- Rock Polish', { volume: 80 });
  await ctx.flash([160, 220, 255], 16, 150);
  await ctx.say('Con un crujido, el eje de la muela se abre por la mitad. Dentro brilla una losa azulada.');
  if (ctx.world.events.some((e) => e.id === 'anselmo')) {
    ctx.turnToPlayer('anselmo');
    await say(ctx, S.anselmo, '¡Muele! ¡Muele a derechas, como el sol! …¿Y eso? Setenta años en este molino y nunca vi ese eje abierto.');
  }
}

/** Llegada de los técnicos del Consorcio (y de Darío) cuando el eje queda abierto. */
async function techsArrive(ctx) {
  ctx.se('Door enter');
  ctx.setVar('b05_t02_visita', 1);
  await ctx.wait(20);
  await say(ctx, S.tech, 'Consorcio Meridiano de Estudios Geofísicos. Venimos a tomar muestras del eje.');
  await say(ctx, S.techF, 'La lectura de esta mañana era anómala. Y ahora el molino gira en el sentido correcto. Qué oportuno.');
  await say(ctx, S.anselmo, '¡Darío! ¿Tú también?');
  await say(ctx, S.dario, 'Papá… Solo son unas muestras. Para los estudios hidráulicos. Te lo dije.');
  await say(ctx, S.techF, 'Aparte, por favor. Protocolo de muestreo.');
  await fightTechs(ctx);
}

/**
 * Combates contra los técnicos (nv 18–20), combate de guion (content/common/bossBattle.js): sin pérdida de dinero ni
 * punto de cura. Derrota: de vuelta a la puerta del molino, curado (TABLILLAS T02, reintento).
 */
async function fightTechs(ctx) {
  for (const [i, id] of [[0, 't02_tecnico_a'], [1, 't02_tecnica_b']]) {
    if (Number(ctx.var(`b05_t02_tec_${i}`, 0)) === 1) continue;
    const out = await bossBattle(ctx, { trainer: id }, { map: MILL_ID, x: MILL.door.x, y: MILL.door.y, dir: 8 }, {
      onLose: (c) => c.setVar('b05_t02_reintento', 1),
      loseText: 'Has vuelto a la puerta del molino. Los técnicos siguen junto a la muela.',
    });
    if (out !== 'win') return false;
    ctx.setVar(`b05_t02_tec_${i}`, 1);
  }
  ctx.setVar('b05_t02_reintento', 0);
  await say(ctx, S.tech, 'Incidencia registrada. Nos retiramos.');
  await say(ctx, S.techF, 'El informe reflejará que un civil obstaculizó el muestreo. Buenos días.');
  ctx.setFlag(F.techs);
  ctx.se('Door exit');
  await darioQuits(ctx);
  return true;
}

async function darioQuits(ctx) {
  await say(ctx, S.dario, 'Me dijeron que era para estudios hidráulicos. Que te comprarían el molino para medir el río.');
  await say(ctx, S.dario, 'No venían a medir nada. Venían a por eso.');
  await say(ctx, S.anselmo, 'Hijo…');
  await say(ctx, S.dario, 'No pienso volver con ellos. Y escucha: en Brontia, el Parque Eólico. El Consorcio lleva meses con el «mantenimiento» y no ha producido ni un vatio.');
  await say(ctx, S.dario, 'Allí hay más gente suya que en ningún sitio. Si vas hacia la meseta, ten cuidado.');
  ctx.setFlag(F.dario);
}

/** Recoger la Tabla Linfa del eje de la muela. */
async function takeTablet(ctx) {
  await ctx.say('Dentro del eje abierto hay una losa fría y húmeda, como si guardara un río entero.');
  await ctx.story.giveTablet('SPLASHPLATE');
  ctx.setFlag(F.t02Done);
  await say(ctx, S.anselmo, 'El Diezmo muele otra vez. Y en el sentido de siempre.');
  await say(ctx, S.anselmo, `El gremio ya no tendrá excusa para tirarlo. Gracias, ${byGender(ctx.state, 'muchacho', 'muchacha')}. Mi padre y mi abuelo también te las darían.`);
}

// ───────────────────────────── Eventos ─────────────────────────────

/** Páginas de un hueco: vacío (contorno de tiza) o rueda con su sentido; girando cuando el molino funciona. */
function socketPages(n) {
  const base = { directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: (ctx) => socketScript(ctx, n), speed: 4 };
  const pages = [{ ...base, sprite: SPRITE.gearsR, dir: 8, pattern: n - 1 }];
  for (const g of [1, 2, 3]) {
    for (const sense of [1, -1]) {
      const when = (s) => Number(s?.var(V.socket(n), 0)) === g && (Number(s?.var(V.sense(n), 1)) === -1 ? -1 : 1) === sense;
      const sprite = sense === 1 ? SPRITE.gearsR : SPRITE.gearsL;
      const dir = [0, 2, 4, 6][g];
      pages.push({ ...base, when, sprite, dir, pattern: 0 });
      pages.push({ ...base, when: (s) => when(s) && running(s), sprite, dir, stepAnime: true });
    }
  }
  return pages;
}

function wallEvents() {
  const out = [];
  MILL.sockets.forEach((p, i) => out.push({ id: `hueco_${i + 1}`, x: p.x, y: p.y, pages: socketPages(i + 1) }));
  const turning = { stepAnime: true };
  out.push({
    id: 'corona_rueda', x: MILL.crown.x, y: MILL.crown.y, sprite: SPRITE.millstone, dir: 6, directionFix: true, walkAnime: false, shadow: false, solid: true, speed: 4,
    pages: [
      { trigger: 'action', script: async (ctx) => { await ctx.say('La corona del eje de la rueda hidráulica. Está quieta: el río ya no mueve la rueda.'); } },
      // Tras el P2 la rueda gira al revés, contra el agua, suelta (TABLILLAS T02; b05_rueda.png fila 8 = corona al revés).
      { when: reversed, sprite: SPRITE.wheel, dir: 8, ...turning, trigger: 'action', script: async (ctx) => { await ctx.say('La corona del eje de la rueda gira al revés, suelta: no engrana con nada. El agua tendría que moverla a derechas.'); } },
      { when: running, ...turning, trigger: 'action', script: async (ctx) => { await ctx.say('La corona gira a derechas, empujada por el agua.'); } },
    ],
  });
  out.push({
    id: 'linterna_muela', x: MILL.lantern.x, y: MILL.lantern.y, sprite: SPRITE.millstone, dir: 6, directionFix: true, walkAnime: false, shadow: false, solid: true, speed: 4,
    pages: [
      { trigger: 'action', script: async (ctx) => { await ctx.say('La linterna del eje de la muela. Lo que gire esta rueda, girará la muela.'); } },
      { when: running, ...turning, trigger: 'action', script: async (ctx) => { await ctx.say('La linterna gira y arrastra la muela a derechas.'); } },
    ],
  });
  out.push({
    id: 'placa', x: MILL.plaque.x, y: MILL.plaque.y, trigger: 'action', noOver: true, solid: true,
    script: async (ctx) => {
      await ctx.say('Un cuadro del Diezmo recién construido. En el marco, una placa de latón gastada: «EL AGUA MUEVE LA RUEDA A DERECHAS. CADA RUEDA GIRA AL REVÉS QUE LA QUE LA MUEVE.\fEL DIEZMO MUELE A DERECHAS, COMO EL SOL.»');
    },
  });
  out.push({
    id: 'palanca_compuerta', x: MILL.lever.x, y: MILL.lever.y, sprite: SPRITE.board, dir: 8, pattern: 0, directionFix: true, walkAnime: false, shadow: false, solid: true,
    pages: [
      { trigger: 'action', script: leverScript },
      { when: running, pattern: 1, trigger: 'action', script: leverScript },
    ],
  });
  return out;
}

/** Examinar la muela (desde cualquiera de sus casillas). */
async function millstoneScript(ctx) {
  const st = ctx.state;
  if (st.flag(F.t02Done)) { await ctx.say('La muela del Diezmo muele a derechas. Huele a harina recién hecha.'); return; }
  if (!running(st)) { await ctx.say('La muela del Diezmo. Quieta, con el eje sellado.'); return; }
  if (!st.flag(F.techs)) {
    if (Number(st.var('b05_t02_visita', 0)) === 1) { await fightTechs(ctx); return; }
    await ctx.say('En el eje abierto brilla una losa azulada.');
    return;
  }
  await takeTablet(ctx);
}

function millstoneEvents() {
  const m = MILL.millstone;
  const base = { sprite: SPRITE.millstone, directionFix: true, walkAnime: false, shadow: false, solid: true, speed: 3, trigger: 'action', script: millstoneScript };
  const border = (id, x, y) => ({ id, x, y, solid: true, noOver: true, trigger: 'action', script: millstoneScript });
  return [
    {
      id: 'muela', x: m.x, y: m.y,
      pages: [
        { ...base, dir: 2, pattern: 0 },
        { ...base, when: (s) => running(s) && !s.flag(F.t02Done), dir: 8, pattern: 0, light: { radius: 64, intensity: 0.8 } },
        { ...base, when: (s) => Boolean(s?.flag(F.t02Done)), dir: 2, stepAnime: true },
      ],
    },
    border('muela_borde_i', m.x - 1, m.y),
    border('muela_borde_d', m.x + 1, m.y),
    border('muela_borde_n', m.x, m.y - 1),
  ];
}

function peopleEvents() {
  const a = MILL.anselmo;
  const techPage = (i, sprite, name) => ({
    id: `tecnico_${i}`, x: MILL.techs[i].x, y: MILL.techs[i].y, name, sprite, dir: MILL.techs[i].dir, move: 'look',
    when: (s) => Number(s?.var('b05_t02_visita', 0)) === 1 && !s.flag(F.techs) && Number(s.var(`b05_t02_tec_${i}`, 0)) !== 1,
    script: async (ctx) => { await say(ctx, name, 'Protocolo de muestreo. Aparte, por favor.'); await fightTechs(ctx); },
  });
  return [
    {
      // Antes del P2 Anselmo está en la calle, frente al molino (B03, b03_caudal_npcs.js: da la pista T02); con el río
      // en su cauce entra al Diezmo y se queda (la calle lo oculta desde `b05_t02_anselmo`).
      id: 'anselmo', x: a.x, y: a.y, name: S.anselmo, sprite: SPRITE.anselmo, dir: a.dir, move: 'look',
      when: (s) => Boolean(s?.flag(F.p2)),
      script: async (ctx) => {
        if (ctx.flag(F.t02Done)) { await say(ctx, S.anselmo, 'Oye cómo muele. Setenta años y aún me emociona.'); return; }
        if (running(ctx.state)) { await say(ctx, S.anselmo, 'Ese eje… Llévatelo tú, sea lo que sea. Aquí solo trae visitas raras.'); return; }
        if (!ctx.flag(F.p2)) {
          await say(ctx, S.anselmo, 'Con el Albo así, un día crecido y otro seco, la rueda ni se mueve. El agua le pasa por debajo.');
          await say(ctx, S.anselmo, 'La muela del Diezmo pesa como un río. Cuando el río vuelva a su sitio, ya veremos.');
          return;
        }
        if (!ctx.flag(F.t02Met)) { await anselmoIntro(ctx); return; }
        await anselmoHints(ctx);
      },
    },
    techPage(0, SPRITE.tech, S.tech),
    techPage(1, SPRITE.techF, S.techF),
    {
      id: 'dario', x: MILL.dario.x, y: MILL.dario.y, name: S.dario, sprite: SPRITE.dario, dir: MILL.dario.dir, move: 'look',
      when: (s) => Number(s?.var('b05_t02_visita', 0)) === 1,
      script: async (ctx) => {
        if (ctx.flag(F.dario) && ctx.flag(F.p3)) { await say(ctx, S.dario, 'Ahora echo una mano a mi padre. Mientras yo esté aquí, el Diezmo no vuelve a pararse.'); return; }
        if (ctx.flag(F.dario)) { await say(ctx, S.dario, 'El Parque Eólico, en la meseta. Ve con cuidado.'); return; }
        await say(ctx, S.dario, 'No me mires así. Yo solo… firmé lo que me pusieron delante.');
      },
    },
    {
      id: 'escena_visita', x: 1, y: 11, through: true, trigger: 'auto',
      when: (s) => running(s) && !s.flag(F.techs) && Number(s.var('b05_t02_visita', 0)) !== 1,
      script: techsArrive,
    },
    {
      id: 'escena_entrada', x: 2, y: 11, through: true, trigger: 'auto',
      when: (s) => Boolean(s?.flag(F.p2)) && !s.flag(F.t02Met),
      script: anselmoIntro,
    },
  ];
}

async function anselmoIntro(ctx) {
  ctx.setFlag(F.t02Met);
  ctx.turnToPlayer('anselmo');
  await say(ctx, S.anselmo, `¿Quién anda ahí? Ah, ${byGender(ctx.state, 'un chaval', 'una chavala')}. Pasa, pasa, que aquí ya no entra ni el aire.`);
  await say(ctx, S.anselmo, 'La muela del Diezmo pesa como un río. Lo decía mi padre y lo digo yo.');
  await say(ctx, S.anselmo, 'Desde que el Albo volvió a su cauce, todos los molinos del barrio giran… menos este, que se empeñó en girar al revés. Contra el agua.');
  await say(ctx, S.anselmo, 'Mi hijo Darío desmontó las tres ruedas dentadas para que no se partiera la muela. Y las dejó donde le vino bien: una entre los sacos, otra en el desván y la grande junto a la compuerta del canal alto.');
  await say(ctx, S.anselmo, 'El gremio quiere tirarlo abajo. Y el Consorcio de mi hijo quiere comprarlo «para estudios hidráulicos». No se lo pienso vender a nadie.');
  await say(ctx, S.anselmo, 'Si me ayudas a montarlo, que sea como dice la placa. Yo ya no subo escaleras.');
  await ctx.story.openClue('T02', { direct: true });
}

async function anselmoHints(ctx) {
  const hand = gearsInHand(ctx.state).length;
  const placed = socketsOf(ctx.state).filter((s) => s.gear).length;
  if (placed + hand < 3) {
    await say(ctx, S.anselmo, 'Una entre los sacos, otra en el desván y la grande junto a la compuerta del canal alto. Al canal se sube por la cuesta de grava de detrás.');
    return;
  }
  await say(ctx, S.anselmo, 'Cada hueco tiene su círculo de tiza: ahí va la rueda de ese tamaño. Y el trinquete de cada una manda hacia dónde gira.');
  await say(ctx, S.anselmo, 'El agua empuja la rueda de fuera a derechas; si los trinquetes están bien puestos, no la dejarán girar al revés.');
  await say(ctx, S.anselmo, 'Cada rueda gira al revés que la que la mueve. Y el Diezmo muele a derechas. Echa la cuenta y luego echa el embrague.');
}

/** Sacos (la rueda pequeña está entre ellos) y la rueda mediana del desván. */
function gearPickupEvents() {
  const out = MILL.sacks.map((s, i) => ({
    id: `sacos_${i}`, x: s.x, y: s.y, sprite: 'asset:objects/b05_sacos.png', dir: 2, pattern: s.v, directionFix: true, walkAnime: false, shadow: false, solid: true,
    trigger: 'action',
    script: async (ctx) => {
      if (s.x === MILL.sackGear.x && s.y === MILL.sackGear.y && !ctx.flag(F.gearSmall)) {
        await ctx.say('Entre los sacos de harina asoma una rueda dentada de madera.');
        ctx.setFlag(F.gearSmall);
        ctx.me('item_get');
        await ctx.say(`Has recogido la ${GEAR_NAMES[1]}.`);
        return;
      }
      await ctx.say('Sacos de harina vieja. Huelen a humedad.');
    },
  }));
  out.push({
    id: 'rueda_desvan', x: MILL.loftGear.x, y: MILL.loftGear.y, when: (s) => !s?.flag(F.gearMedium),
    sprite: SPRITE.gearsR, dir: 4, pattern: 0, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action',
    script: async (ctx) => {
      ctx.setFlag(F.gearMedium);
      ctx.me('item_get');
      await ctx.say(`Has recogido la ${GEAR_NAMES[2]}.`);
    },
  });
  return out;
}

export function millEvents() {
  return [...wallEvents(), ...millstoneEvents(), ...peopleEvents(), ...gearPickupEvents()];
}

// ───────────────────────────── Canal alto (caudal_canal_alto) ─────────────────────────────

/** Coordenadas del patio del canal alto (content/maps/b05/caudal_canal_alto.js). */
export const CANAL = Object.freeze({
  width: 24, height: 16,
  terrace: { x: -3, y: -3, w: 30, h: 10 }, // cara en y 4–6
  channel: { x: 0, y: 1, w: 24, h: 2 },
  gravel: [{ x: 16, y: 4 }, { x: 17, y: 4 }, { x: 16, y: 5 }, { x: 17, y: 5 }, { x: 16, y: 6 }, { x: 17, y: 6 }],
  gate: { x: 19, y: 2 }, // compuerta (en el canal; se examina desde abajo)
  gear: { x: 21, y: 3 },
  mill: { stamp: 'casa_naranja_ancha', x: 2, y: 7, door: { x: 4, y: 11 } },
  arrive: { x: 4, y: 12, dir: 2 },
  wheel: { x: 9, y: 11 },
  stream: { x: 0, y: 14, w: 24, h: 2 },
});

/** Compuerta de las esclusas de Caudal (arte de B03, solo lectura). */
const GATE_SPRITE = 'asset:objects/compuerta.png';

export function canalEvents() {
  const c = CANAL;
  return [
    ...c.gravel.filter((g) => g.y === 6).map((g) => ({ id: `grava_${g.x}`, type: 'gravelSlope', x: g.x, y: g.y })),
    {
      id: 'rueda_grande', x: c.gear.x, y: c.gear.y, when: (s) => !s?.flag(F.gearLarge),
      sprite: SPRITE.gearsR, dir: 6, pattern: 0, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action',
      script: async (ctx) => {
        await ctx.say('Junto a la compuerta, medio hundida en el barro, está la rueda dentada grande.');
        ctx.setFlag(F.gearLarge);
        ctx.me('item_get');
        await ctx.say(`Has recogido la ${GEAR_NAMES[3]}.`);
      },
    },
    // Compuerta de madera sobre el canal (hoja compuerta.png de Caudal, B03: fila 2 tramo de arriba, 6 de abajo).
    {
      id: 'compuerta_alta', x: c.gate.x, y: c.gate.y - 1, sprite: GATE_SPRITE, dir: 2, directionFix: true, walkAnime: false,
      stepAnime: true, speed: 3, shadow: false, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('La compuerta del canal alto. Desde aquí baja el agua que mueve la rueda del Diezmo.'); },
    },
    {
      id: 'compuerta', x: c.gate.x, y: c.gate.y, sprite: GATE_SPRITE, dir: 6, directionFix: true, walkAnime: false,
      stepAnime: true, speed: 3, shadow: false, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('La compuerta del canal alto. Desde aquí baja el agua que mueve la rueda del Diezmo.'); },
    },
    {
      id: 'rueda_hidraulica', x: c.wheel.x, y: c.wheel.y, sprite: SPRITE.wheel, dir: 2, directionFix: true, walkAnime: false, shadow: false, solid: true, speed: 3,
      pages: [
        { trigger: 'action', script: async (ctx) => { await ctx.say('La rueda hidráulica del Diezmo, quieta. El agua le pasa por debajo y no consigue moverla.'); } },
        { when: reversed, dir: 4, stepAnime: true, trigger: 'action', script: async (ctx) => { await ctx.say('La rueda hidráulica del Diezmo gira al revés, contra la corriente. Dentro no mueve nada: le faltan las ruedas dentadas.'); } },
        { when: running, dir: 2, stepAnime: true, trigger: 'action', script: async (ctx) => { await ctx.say('La rueda hidráulica gira a derechas, como debe.'); } },
      ],
    },
    { id: 'rueda_borde_i', x: c.wheel.x - 1, y: c.wheel.y, solid: true, noOver: true },
    { id: 'rueda_borde_d', x: c.wheel.x + 1, y: c.wheel.y, solid: true, noOver: true },
    {
      id: 'cartel_canal', type: 'sign', x: 13, y: 8,
      text: 'CANAL ALTO DEL DIEZMO\nCuesta de grava. Solo para quien sepa subirla.',
    },
  ];
}
