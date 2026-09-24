// Eventos de Ciudad Nexo (docs/CAMPANA.md B09 paso 4 y §1.3): el pescador del pantalán da la Caña Buena (GOODROD); los
// ferris están parados por el «mar revuelto» (hasta p7_restored); mar adentro se ve una plataforma del Consorcio
// (Talasa, B13); en el mercado, los herreros de Tizón «ya no mandan picos» (pista T12, en cola hasta Nadar); la Aduana
// Vieja está cerrada (DLC 2); estación de tren (tras P4), Correos de Don Evaristo, astillero y faro. C075 en la
// desembocadura del Albo (Nadar). Coordenadas: content/maps/b09b/nexo_layout.js.
import { takeFerry } from '../../world/transport.js';
import { clerkEvent } from '../services/shop.js';
import { cellEvent } from './b01_cells.js';
import { F, SPEAKER, SPRITE, OBJ, lines, zygardeSays, examine, blockedLink, rectCells } from './b09b_common.js';
import { W, H, BUILDINGS, PLAZA, PORT, CELLS, SPOTS, ITEMS, EXITS } from '../maps/b09b/nexo_layout.js';
import { linkOpen, blockedText } from '../maps/b09b/links.js';
import { ZYGARDE_LINES } from '../story/clues.js';

export const NEXO_TEXT = Object.freeze({
  signN: 'CIUDAD NEXO\nEl puerto de Axis: tren, ferris y el correo de toda la región.',
  signW: 'CIUDAD NEXO\n← Ruta 15 · Sendero de los Acantilados · Caleta Sonda',
  ferrySign: 'ESTACIÓN MARÍTIMA DE NEXO\nFerris a Caleta Sonda y a Villa Boreal.\nAVISO: servicio suspendido por el estado de la mar.',
  shipyardSign: 'ASTILLERO DE NEXO\nCarpintería de ribera y reparación de embarcaciones.',
  aduana: 'ADUANA VIEJA\nUna cadena gruesa cierra la puerta. En un cartel desvaído: «Cerrado hasta nueva orden».',
  aduanaLook: 'Por los cristales polvorientos se ven mapas enrollados y cajas con sellos antiguos.',
  closedHouse: 'La puerta está cerrada. No parece haber nadie en casa.',
  goodRodIntro: [
    '¿Tú también vienes a mirar el agua? Aquí en el pantalán se ve pasar media vida.',
    'Con esa cara de no haber pescado nunca en el mar… Toma, anda. Yo ya tengo otra.',
  ],
  goodRodAfter: [
    'Con la Caña Buena pican Remoraid, Clauncher y hasta algún Corsola. Prueba desde el final del pantalán.',
    'Y en el barro de la Marisma, Barboach. Allí el agua es otra cosa.',
  ],
  ferryBefore: [
    'Hace semanas que las mareas vienen raras. Suben y bajan cuando les da la gana, y algunas noches el agua suena a campanas.',
    'Con la mar así, no sale ni un ferri.',
  ],
  ferryAfter: 'La mar ha vuelto a su sitio. ¡Todos a bordo!',
  ferryHull: 'El ferri de pasajeros está amarrado al pantalán. Con la mar así, no zarpa.',
  ferryHullAfter: 'El ferri está listo para zarpar. Para embarcar, hay que hablar con el marinero del pantalán.',
  binoculars: 'Unos prismáticos del muelle. Apuntan mar adentro.',
  platform: [
    'Muy lejos, sobre el agua, se distingue una plataforma con grúas y una torre de perforación.',
    'Parpadean luces de color magenta. En un costado se lee, a duras penas: «Consorcio Meridiano».',
  ],
  zygardePlatform: 'Allí… algo me llama. Muy lejos. Todavía no.',
  t12: [
    'En este puesto vendíamos los picos y las azadas de los herreros de Tizón. Los mejores de Axis.',
    'Pero hace semanas que no mandan ni uno. Ni una carta. Nadie sabe qué pasa allí arriba.',
    'Para ir hasta allí hay que cruzar el mar, y con estas mareas, ni los pescadores se atreven.',
  ],
  t12After: 'Si algún día llegas al Volcán Tizón, pregunta por la Maestra Brasa. Y dile que aquí la esperamos.',
});

const say = (ctx, speaker, text) => ctx.say(text, { speaker });

// ───────────────────────────── edificios ─────────────────────────────

function doorEvents() {
  return [
    examine('puerta_aduana', BUILDINGS.aduana.door.x, BUILDINGS.aduana.door.y, NEXO_TEXT.aduana, { solid: true }),
    examine('ventana_aduana', BUILDINGS.aduana.door.x + 2, BUILDINGS.aduana.door.y, NEXO_TEXT.aduanaLook, { solid: true }),
    examine('puerta_casa_rio', BUILDINGS.casaRio.door.x, BUILDINGS.casaRio.door.y, NEXO_TEXT.closedHouse, { solid: true }),
    examine('puerta_casa_oeste', BUILDINGS.casaOeste.door.x, BUILDINGS.casaOeste.door.y, NEXO_TEXT.closedHouse, { solid: true }),
  ];
}

function signEvents() {
  return [
    { id: 'cartel_nexo_n', type: 'sign', x: SPOTS.townSignN.x, y: SPOTS.townSignN.y, text: NEXO_TEXT.signN },
    { id: 'cartel_nexo_o', type: 'sign', x: SPOTS.townSignW.x, y: SPOTS.townSignW.y, text: NEXO_TEXT.signW, skin: 'sign hgss dir' },
    { id: 'cartel_ferri', type: 'sign', x: SPOTS.ferrySign.x, y: SPOTS.ferrySign.y, text: NEXO_TEXT.ferrySign },
    { id: 'cartel_astillero', type: 'sign', x: SPOTS.shipyardSign.x, y: SPOTS.shipyardSign.y, text: NEXO_TEXT.shipyardSign },
  ];
}

// ───────────────────────────── mercado ─────────────────────────────

async function t12Stall(ctx) {
  if (ctx.flag(F.t12)) { await say(ctx, 'Mercader', NEXO_TEXT.t12After); return; }
  await lines(ctx, 'Mercader', NEXO_TEXT.t12);
  const status = await ctx.story.openClue('T12');
  ctx.setFlag(F.t12);
  if (status === 'queued' && !ctx.state.zygardeAbility('swim')) await zygardeSays(ctx, ZYGARDE_LINES.swim);
}

function marketEvents() {
  const at = (role) => {
    const s = PLAZA.stalls.find((st) => st.role === role);
    return { x: s.x + 1, y: s.y + 3 };
  };
  const pes = at('pescado');
  const mar = at('mar');
  const her = at('herreros');
  const fru = at('fruta');
  return [
    examine('puesto_pescado', pes.x, pes.y, (s) => (s.flag(F.p7)
      ? 'Pescadera: ¡Pescado del día! Desde que la mar se calmó, los barcos vuelven cargados.'
      : 'Pescadera: Poco pescado hoy. Con estas mareas, los barcos no se alejan de la costa.'), { solid: true }),
    clerkEvent({
      id: 'puesto_mar', x: mar.x, y: mar.y, dir: 2, sprite: '',
      items: ['DEEPSEATOOTH', 'DEEPSEASCALE', 'PRISMSCALE', 'MYSTICWATER', 'SEAINCENSE', 'WAVEINCENSE'],
      greeting: 'Cosas del mar para entrenadores. Dicen que algunas hacen cambiar a ciertos Pokémon.',
    }),
    { id: 'puesto_herreros', x: her.x, y: her.y, solid: true, noOver: true, trigger: 'action', script: t12Stall },
    examine('puesto_fruta', fru.x, fru.y, 'Frutero: Bayas de la Reserva del Delta, recién bajadas por el río. ¡Las más dulces de Axis!', { solid: true }),
  ];
}

// ───────────────────────────── puerto ─────────────────────────────

async function fisherTalk(ctx) {
  if (ctx.flag(F.goodRod)) { await lines(ctx, SPEAKER.fisher, NEXO_TEXT.goodRodAfter); return; }
  await lines(ctx, SPEAKER.fisher, NEXO_TEXT.goodRodIntro);
  await ctx.giveItem('GOODROD', 1);
  ctx.setFlag(F.goodRod);
  await lines(ctx, SPEAKER.fisher, NEXO_TEXT.goodRodAfter);
}

async function ferryTalk(ctx) {
  // Antes de P7 basta su explicación (takeFerry repetiría «los ferris no salen»).
  if (!ctx.flag(F.p7)) { await lines(ctx, SPEAKER.sailor, NEXO_TEXT.ferryBefore); return; }
  await say(ctx, SPEAKER.sailor, NEXO_TEXT.ferryAfter);
  await takeFerry(ctx, 'nexo', { speaker: SPEAKER.sailor });
}

async function binocularsLook(ctx) {
  await ctx.say(NEXO_TEXT.binoculars);
  if ((await ctx.choice(['Mirar', 'Dejarlo'], { cancel: 1 })) !== 0) return;
  ctx.se('PC access', { volume: 50 });
  await ctx.camera.pan(PORT.platform.x, PORT.platform.y - 1, 70);
  await ctx.wait(30);
  for (const line of NEXO_TEXT.platform) await ctx.say(line);
  ctx.setFlag(F.talasaSeen);
  await ctx.camera.reset(50);
  await zygardeSays(ctx, NEXO_TEXT.zygardePlatform);
}

/**
 * Casco del ferri amarrado (filas 1–4 del yate): sólido y examinable, para que nunca se ofrezca nadar «dentro» del
 * barco desde el pantalán (quedaría atrapado entre tiles no pasables sobre agua).
 */
function ferryHullEvents() {
  const f = PORT.ferry;
  const text = (s) => (s.flag(F.p7) ? NEXO_TEXT.ferryHullAfter : NEXO_TEXT.ferryHull);
  return rectCells(f.x, f.y + 1, f.w, f.h - 1).map(([x, y]) => examine(`casco_ferri_${x}_${y}`, x, y, text, { solid: true }));
}

function portEvents() {
  const P = PORT;
  return [
    ...ferryHullEvents(),
    { id: 'pescador_cana_buena', x: P.fisher.x, y: P.fisher.y, name: SPEAKER.fisher, sprite: SPRITE.fisher, dir: P.fisher.dir, move: 'still', trigger: 'action', script: fisherTalk },
    { id: 'marinero_ferri', x: P.ferrySailor.x, y: P.ferrySailor.y, name: SPEAKER.sailor, sprite: SPRITE.sailor, dir: P.ferrySailor.dir, move: 'still', trigger: 'action', script: ferryTalk },
    { id: 'prismaticos', x: P.binoculars.x, y: P.binoculars.y, sprite: OBJ.binoculars, dir: 2, directionFix: true, solid: true, trigger: 'action', script: binocularsLook },
    { id: 'plataforma_talasa', x: P.platform.x, y: P.platform.y, sprite: OBJ.platform, dir: 2, directionFix: true, stepAnime: true, speed: 2, solid: true, trigger: 'action', script: async (ctx) => { for (const line of NEXO_TEXT.platform) await ctx.say(line); } },
    ...P.buoys.map(([x, y], i) => ({ id: `boya_${i}`, x, y, sprite: OBJ.buoy, dir: 2, directionFix: true, stepAnime: true, speed: 1 + (i % 2), solid: true })),
  ];
}

// ───────────────────────────── vecinos, entrenadores, objetos ─────────────────────────────

function npcEvents() {
  const S = SPOTS;
  return [
    {
      id: 'marinero_muelle', x: S.sailorQuay.x, y: S.sailorQuay.y, name: SPEAKER.sailor, sprite: SPRITE.sailor, dir: S.sailorQuay.dir, move: 'look', trigger: 'action',
      script: (ctx) => lines(ctx, SPEAKER.sailor, ['Mar adentro han montado una plataforma nueva. Dicen que es del Consorcio, para estudiar el fondo.', 'Estudiar, estudiar… De noche se oyen máquinas hasta aquí.']),
    },
    {
      id: 'vecina_fuente', x: S.fountainLady.x, y: S.fountainLady.y, name: 'Vecina', sprite: SPRITE.neighbor, dir: S.fountainLady.dir, move: 'look', trigger: 'action',
      script: (ctx) => lines(ctx, 'Vecina', ['Nexo es el nudo de Axis: el tren al norte, los ferris al sur y el correo para todos.', 'Bueno. Cuando funcionan.']),
    },
    {
      id: 'anciano_plaza', x: S.benchOld.x, y: S.benchOld.y, name: 'Anciano', sprite: SPRITE.elder, dir: S.benchOld.dir, move: 'look', trigger: 'action',
      script: (ctx) => lines(ctx, 'Anciano', ['Don Evaristo, el de Correos, lleva sesenta años detrás del mostrador.', 'Dicen que se sabe de memoria todas las direcciones de Axis. Hasta las que ya no existen.']),
    },
    {
      id: 'nino_brillos', x: S.kid.x, y: S.kid.y, name: 'Niño', sprite: SPRITE.kid, dir: S.kid.dir, move: { wander: 2 }, trigger: 'action',
      script: (ctx) => lines(ctx, 'Niño', ['¡En la desembocadura del río, bajo el agua, a veces se ve un brillo verde!', 'Mi madre dice que son algas. Pero las algas no brillan.']),
    },
    {
      id: 'pescador_rio', x: S.riverFisher.x, y: S.riverFisher.y, name: SPEAKER.fisher, sprite: SPRITE.fisher, dir: S.riverFisher.dir, move: 'still', trigger: 'action',
      script: (ctx) => lines(ctx, SPEAKER.fisher, ['Este es el Albo. Nace en la cascada del Monte del Portal y llega aquí después de cruzar medio Axis.', 'Por eso el agua de la desembocadura sabe a todo un poco.']),
    },
    {
      id: 'marinero_rogelio', type: 'trainer', trainer: 'b09b_marinero_rogelio', name: 'Marinero Rogelio', sprite: SPRITE.sailor,
      x: S.rogelio.x, y: S.rogelio.y, dir: S.rogelio.dir, sight: 3,
      intro: '¡Eh, tú! Sin ferris no hay trabajo, y sin trabajo me aburro. ¡Combate!',
      after: 'Cuando vuelvan a salir los ferris, subo el primero. Aunque sea para ir a Caleta y volver.',
    },
  ];
}

function itemEvents() {
  return ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) }));
}

// ───────────────────────────── bordes ─────────────────────────────

function edgeEvents() {
  const out = [];
  if (!linkOpen('ciudad_nexo', 'ruta_14_reserva')) {
    const n = EXITS.north;
    const cells = [];
    for (let x = n.x0; x <= n.x1; x++) cells.push([x, n.y]);
    out.push(...blockedLink('borde_ruta14', cells, blockedText('ciudad_nexo', 'ruta_14_reserva'), 'down', 'up'));
  }
  if (!linkOpen('ciudad_nexo', 'mar_del_sur')) {
    // Mar abierto (sur y este): aviso neutro hasta que el Mar del Sur (B13) conecte.
    const cells = [];
    for (let x = 0; x < W; x++) cells.push([x, H - 1]);
    const south = blockedLink('mar_sur', cells, blockedText('ciudad_nexo', 'mar_del_sur'), 'up', 'down');
    const east = [];
    for (let y = 38; y < H - 1; y++) east.push([W - 1, y]);
    out.push(...south, ...blockedLink('mar_este', east, blockedText('ciudad_nexo', 'mar_del_sur'), 'left', 'right'));
  }
  return out;
}

export function nexoEvents() {
  return [
    ...doorEvents(),
    ...signEvents(),
    ...marketEvents(),
    ...portEvents(),
    ...npcEvents(),
    ...itemEvents(),
    cellEvent({ id: 'cell_nexo_1', x: CELLS.c075.x, y: CELLS.c075.y }),
    ...edgeEvents(),
  ];
}
