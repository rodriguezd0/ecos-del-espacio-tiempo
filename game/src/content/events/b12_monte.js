// Monte del Portal de día (docs/CAMPANA.md B12, secuencia 1–2): el mapa del prólogo (montana_portal, B01) con lo
// que dejaron aquellas noches y Genesis: piedras quemadas, zarpazos del combate, los pozos de sondeo de la
// perforación (tras b11_exp03), las estacas con las que midieron el aljibe desde fuera y las huellas de alguien que
// subió hasta el brocal y se dio la vuelta (Gael B4: «intentó escalar y el aljibe no le respondió»). Células C050
// (explanada quemada), C051 (mitad de la escalinata) y C076 (poza, Nadar); pared de raíces a la repisa de la cascada
// y su gruta; una montañera. El aljibe responde a Zygarde y abre el paso al Mundo Distorsión.
// Todo lo del B12 depende de b01_left_town: en el prólogo (partida provisional sin flags) no aparece nada.
import { F, EXT, OBJ, SPEAKER, SPRITE, MUSIC, VIOLET, when, lines, zygardeSays, zygardeLines, pause } from './b12_common.js';
import { MONTE, VESTIBULO, GRUTA } from '../maps/b12/layout.js';
import { b12CellEvents } from './b12_cells.js';

const real = (s) => Boolean(s?.flag(EXT.leftTown));
const realWhen = (extra = {}) => when({ ...extra, all: [EXT.leftTown, ...(extra.all || [])] });

export const MONTE_TEXT = Object.freeze({
  scorch: 'Tierra quemada. Aún huele a piedra caliente, aunque hace semanas de aquella noche.',
  charred: 'Una piedra ennegrecida y agrietada. Algo muy caliente la partió.',
  claws: 'Tres surcos hondos en la losa, con un brillo vidrioso. Como si algo enorme hubiera arañado el suelo.',
  hole: 'Un pozo de sondeo abierto en la explanada. La perforadora bajó muy hondo y se llevó lo que había debajo.',
  stake: 'Una estaca de medición con cinta magenta del Consorcio. Hay otras, en círculo, a diez pasos del aljibe. Ninguna más cerca.',
  sensor: 'Una caja de sensores apagada. En la tapa, a rotulador: «Lectura desde el perímetro. No se accede al brocal.»',
  boots: 'Huellas de botas que suben hasta el brocal… y se dan la vuelta.',
  aljibeCalm: 'El aljibe late despacio, sin prisa. Ya no se filtra nada por él: la puerta se sostiene sola.',
  descend: '¿Bajas al aljibe con Zygarde?',
  descendAgain: '¿Vuelves a bajar al otro lado?',
  ledge: 'Desde lo alto del macizo se ve caer la cascada hasta la poza, y más abajo, entre los árboles, el camino a casa.',
});

// ───────────────────────────── llegada y regreso ─────────────────────────────

async function arrivalScene(ctx) {
  ctx.setFlag(F.monteLlegadaP6);
  await pause(ctx, 20);
  await ctx.emote?.('player', '…');
  await zygardeLines(ctx, [
    'Aquí.',
    'Esta es la piedra donde me rompí.',
    'Arriba, en el aljibe, una parte de mí sigue al otro lado. La noto.',
  ]);
}

/** Primera vuelta del Mundo Distorsión tras restaurar el P6 (la puerta anclada, X16). */
async function returnScene(ctx) {
  ctx.setFlag(F.regresoMonteP6);
  ctx.bgm(MUSIC.monte, { fadeOutPrevious: 30 });
  await pause(ctx, 30);
  await ctx.say(MONTE_TEXT.aljibeCalm);
  await zygardeLines(ctx, ['La puerta ya no necesita a nadie dentro para cerrarse.', 'Podremos volver cuando haga falta.']);
}

// ───────────────────────────── el aljibe ─────────────────────────────

/** Paso al Mundo Distorsión: el portal se abre, la pantalla da media vuelta y se cae al otro lado. */
export async function descendAljibe(ctx) {
  const scene = ctx.scene;
  const aljibe = ctx.world?.events?.find((e) => e.id === 'aljibe');
  if (aljibe) { aljibe.direction = 6; aljibe.stepAnime = true; }
  ctx.se('PRSFX- Shadow Force1', { volume: 70 });
  await ctx.flash([...VIOLET], 24, 180);
  try {
    if (scene?.fx?.rotateTo) {
      ctx.fade('out', 44, [...VIOLET].map((c) => Math.round(c * 0.3)));
      await scene.fx.rotateTo(Math.PI, 44, 0.7);
    } else if (ctx.fade) await ctx.fade('out', 30);
    const a = VESTIBULO.arrival;
    await ctx.warp('pilar_invertido', a.x, a.y, a.dir, { fade: false });
  } finally {
    // Pase lo que pase (un fallo al cargar el mapa), la pantalla no se queda girada ni a oscuras.
    scene?.fx?.rotateTo?.(0, 0, 1);
    if (ctx.fade) await ctx.fade('in', 30);
  }
}

/**
 * Guion del aljibe en la partida real (B12). Devuelve false en el prólogo o sin partida (el mapa del B01 dice
 * entonces su texto de siempre). Antes del P6: la primera vez responde a Zygarde; después, se baja cuando se quiera.
 */
export async function b12Aljibe(ctx) {
  if (!real(ctx.state)) return false;
  const restored = ctx.flag(EXT.restored);
  const aljibe = ctx.world?.events?.find((e) => e.id === 'aljibe');
  if (!restored && !ctx.flag(F.aljibeResuena)) {
    ctx.setFlag(F.aljibeResuena);
    ctx.se('core_signal', { volume: 70 });
    await pause(ctx, 20);
    if (aljibe) { aljibe.direction = 4; aljibe.stepAnime = true; }
    ctx.se('PRSFX- Ominous Wind', { volume: 60 });
    await ctx.shake(2, 5, 30);
    await zygardeLines(ctx, [
      'Me reconoce.',
      'Al otro lado está la parte de mí que se quedó sujetando la puerta.',
      'Se abrirá. Solo por un tiempo.',
    ]);
  } else if (restored) {
    await ctx.say(MONTE_TEXT.aljibeCalm);
  }
  const i = await ctx.choice(['Sí', 'No'], { message: restored ? MONTE_TEXT.descendAgain : MONTE_TEXT.descend, cancel: 1 });
  if (i !== 0) {
    if (aljibe && !restored) { aljibe.direction = 2; aljibe.stepAnime = false; aljibe.pattern = 0; }
    return true;
  }
  await descendAljibe(ctx);
  return true;
}

// ───────────────────────────── explanada y alrededores ─────────────────────────────

/** Detalle con gráfico de hoja de objetos (fila = dir). solid: bloquea; text: lo describe al pulsar A. */
function decal(id, [x, y], { sprite, dir }, text = null, { solid = false, cond = {} } = {}) {
  const ev = {
    id, x, y, when: realWhen(cond), sprite, dir, directionFix: true, walkAnime: false, through: !solid, solid, shadow: false,
  };
  if (text) Object.assign(ev, { trigger: 'action', script: async (ctx) => { await ctx.say(text); } });
  return ev;
}

const ART = Object.freeze({
  scorch: { sprite: OBJ.monte, dir: 2 }, charred: { sprite: OBJ.monte, dir: 4 }, claws: { sprite: OBJ.monte, dir: 6 },
  boots: { sprite: OBJ.monte, dir: 8 }, hole: { sprite: OBJ.sondeo, dir: 2 }, stake: { sprite: OBJ.genesis, dir: 2 },
  sensor: { sprite: OBJ.genesis, dir: 4 },
});

function battleMarks() {
  return [
    ...MONTE.scorch.map((p, i) => decal(`b12_quemado_${i}`, p, ART.scorch, i % 3 === 0 ? MONTE_TEXT.scorch : null)),
    ...MONTE.charred.map((p, i) => decal(`b12_piedra_quemada_${i}`, p, ART.charred, MONTE_TEXT.charred, { solid: true })),
    ...MONTE.claws.map((p, i) => decal(`b12_zarpazo_${i}`, p, ART.claws, MONTE_TEXT.claws)),
    ...MONTE.drillHoles.map((p, i) => decal(`b12_sondeo_${i}`, p, ART.hole, MONTE_TEXT.hole, { solid: true, cond: { all: [EXT.exp03] } })),
  ];
}

async function sensorTalk(ctx) {
  await ctx.say(MONTE_TEXT.sensor);
  await zygardeSays(ctx, 'Midieron desde fuera. El aljibe no les dejó acercarse.');
}

function aljibeSurroundings() {
  return [
    ...MONTE.stakes.map((p, i) => decal(`b12_estaca_${i}`, p, ART.stake, MONTE_TEXT.stake, { solid: true })),
    { ...decal('b12_sensores', [MONTE.sensor.x, MONTE.sensor.y], ART.sensor, null, { solid: true }), trigger: 'action', script: sensorTalk },
    ...MONTE.boots.map((p, i) => decal(`b12_huellas_${i}`, p, ART.boots, MONTE_TEXT.boots)),
  ];
}

async function hikerTalk(ctx) {
  const sp = SPEAKER.hiker;
  if (ctx.flag(EXT.restored)) {
    // Sin «anoche»: se le puede hablar nada más volver del aljibe, el mismo día.
    await lines(ctx, sp, [
      'La montaña se ha quedado quieta. Ni un temblor, después de semanas sin dejarme dormir.',
      'Y los Absol ya no bajan a la explanada. Se han vuelto a sus riscos.',
    ]);
    return;
  }
  await lines(ctx, sp, [
    'Subo aquí desde niña. Nunca había visto la explanada así: quemada, llena de agujeros…',
    'Los del Consorcio acamparon abajo semanas. Midieron, perforaron y se fueron sin dar explicaciones.',
    'Y por las noches la montaña vuelve a temblar. Los Pokémon del Monte no paran quietos.',
  ]);
  await ctx.say(ctx.state.flag(F.aljibeResuena)
    ? '¿Tú también has notado cómo late ese aljibe? A mí me pone los pelos de punta.'
    : 'Si subes al aljibe, no te asomes. Dicen que no tiene fondo.', { speaker: sp });
}

function hiker() {
  const h = MONTE.hiker;
  return { id: 'b12_montanera', x: h.x, y: h.y, name: SPEAKER.hiker, when: realWhen(), sprite: SPRITE.hiker, dir: h.dir, move: 'look', trigger: 'action', script: hikerTalk };
}

// ───────────────────────────── repisa de la cascada (Trepar) ─────────────────────────────

function climbWalls() {
  const [fx, fy] = MONTE.climb.foot;
  const [tx, ty] = MONTE.climb.top;
  return [
    { id: 'b12_pared_repisa_sube', type: 'climbWall', x: fx, y: fy - 1, to: [tx, ty], h: 3, sprite: OBJ.veins, dir: 6, directionFix: true, stepAnime: true, when: real },
    { id: 'b12_pared_repisa_baja', type: 'climbWall', x: tx, y: ty + 1, to: [fx, fy], down: true, glow: false, when: real },
    {
      id: 'b12_repisa_vista', x: tx, y: ty - 1, trigger: 'touch', through: true, when: realWhen({ none: [F.repisaCascada] }),
      script: async (ctx) => { ctx.setFlag(F.repisaCascada); await ctx.say(MONTE_TEXT.ledge); },
    },
  ];
}

function items() {
  return MONTE.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, hidden: Boolean(it.hidden), when: real }));
}

/** Música del Monte en la partida real (el mapa del prólogo no fija BGM: la elige quien entra). */
function musicEvent() {
  return {
    id: 'b12_musica_monte', x: 0, y: 0, trigger: 'parallel', when: real,
    script: async (ctx) => {
      const scene = ctx.scene;
      if (!scene || scene.__b12MonteMusic === scene.world?.current) return;
      scene.__b12MonteMusic = scene.world?.current;
      ctx.bgm(MUSIC.monte, { fadeOutPrevious: 20 });
    },
  };
}

/** Eventos del B12 en montana_portal (se añaden a los del prólogo; nada aparece sin b01_left_town). */
export function monteEvents() {
  return [
    { id: 'b12_llegada', x: MONTE.arrival.x, y: MONTE.arrival.y, through: true, trigger: 'auto', when: realWhen({ all: [EXT.gaelB4], none: [F.monteLlegadaP6] }), script: arrivalScene },
    { id: 'b12_regreso', x: MONTE.returnSpot.x, y: MONTE.returnSpot.y, through: true, trigger: 'auto', when: realWhen({ all: [EXT.restored], none: [F.regresoMonteP6] }), script: returnScene },
    musicEvent(),
    ...battleMarks(),
    ...aljibeSurroundings(),
    hiker(),
    ...climbWalls(),
    ...items(),
    ...b12CellEvents('montana_portal', { when: real }),
  ];
}

/** Warps del B12 en montana_portal: la boca de la gruta en la repisa de la cascada. */
export function monteWarps() {
  const d = MONTE.grutaDoor;
  return [{ x: d.x, y: d.y, to: 'monte_gruta', tx: GRUTA.entry.x, ty: GRUTA.entry.y, dir: GRUTA.entry.dir }];
}
