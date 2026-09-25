// Interiores de la Estación Talasa (docs/CAMPANA.md B13, puntos 2–3): el invernadero de Solosis cultivados (tanques de
// cultivo, la investigadora y la consola que abre la compuerta hacia la cubierta sur) y el despacho de dirección de la
// torre (la foto enmarcada del «Proyecto Laguna» con el rostro rascado y el cuaderno de tapas verdes; Alerce no se
// gira; la tarjeta de dirección que abre el laboratorio). Coordenadas propias de cada sala aquí (fuente única).
import { F, SPEAKER, SPRITE, OBJ, when, lines, zygardeSays, examine, objectPage } from './b13_common.js';

/** Invernadero: sala de laboratorio 20×15 (suelo y 4–13, felpudo x 9–10 en y 13). */
export const GREENHOUSE = Object.freeze({
  width: 20, height: 15, room: { x: 1, y: 1, w: 18, h: 13 }, door: { x: 9, y: 13 },
  vats: [[3, 5], [5, 5], [7, 5], [12, 5], [14, 5], [16, 5], [3, 9], [5, 9], [14, 9], [16, 9]],
  plants: [[1, 4], [18, 4], [1, 11], [18, 11], [10, 4]],
  console: { x: 9, y: 3 }, // el puesto del banco de ordenadores (su silla); se usa desde (9, 4)
  researcher: { x: 11, y: 8, dir: 4 },
  table: { x: 8, y: 9 },
  item: { x: 17, y: 12, item: 'LUXURYBALL' },
});

/**
 * Despacho de dirección: sala 15×11 (suelo y 4–9, felpudo x 6–7 en y 9). Los muebles de la pared del fondo (foto,
 * terminal, archivadores) tienen el cuerpo en las filas de pared y su evento en la fila 3: se miran desde la fila 4.
 */
export const OFFICE = Object.freeze({
  width: 15, height: 11, room: { x: 1, y: 1, w: 13, h: 9 }, door: { x: 6, y: 9 },
  photo: { x: 3, y: 2 }, // en la pared del fondo; se mira desde (3, 4)
  photoFrom: { x: 3, y: 4 },
  desk: { x: 7, y: 5 }, // mesa de dirección (stamp 3×2 desde x 6); la tarjeta encima
  deskFront: { x: 8, y: 7 }, // se mira la mesa desde aquí (la base sólida está en y 6)
  terminal: { x: 5, y: 3 }, // terminal de pie contra la pared (arte de Interior1), se mira desde (5, 4)
  cabinets: [[11, 3], [12, 3]], // archivadores metálicos contra la pared del fondo
  alerce: { x: 11, y: 4, dir: 8 }, // de espaldas a la sala, revolviendo los archivadores
  window: { x: 6, y: 2 },
});

/** Piezas de Interior1 sin stamp de catálogo (tileset 4): terminal de pantalla turquesa y taquillas metálicas. */
export const INTERIOR_PIECES = Object.freeze({
  terminal: Object.freeze({ src: [5, 35, 1, 3], layer: 2 }), // cuerpo 1×2 y sombra
  console: Object.freeze({ src: [5, 35, 1, 2], layer: 2 }), // la misma máquina, sin sombra (exenta en la sala)
  lockers: Object.freeze({ src: [3, 35, 2, 2], layer: 2 }), // dos taquillas/archivadores metálicos
});

export const INTERIOR_TEXT = Object.freeze({
  vat: 'Un tanque de cultivo. Dentro flotan decenas de Solosis pegados al cristal, girando despacio. La etiqueta dice: «Línea Z · resonancia inducida».',
  vatZygarde: 'Huelen a mí. Llevan un eco de lo que soy… pero no son yo.',
  table: 'Hojas de registro: «Cultivo estable. Crecimiento acelerado en presencia de la Muestra Z-4».',
  consoleAsk: 'CONSOLA DE SERVICIO\nCompuerta de seguridad de la cubierta sur: CERRADA.\n¿Abrirla?',
  consoleOpen: 'Un zumbido recorre la plataforma. Fuera, la compuerta de la cubierta sur se repliega.',
  consoleDone: 'CONSOLA DE SERVICIO\nCompuerta de seguridad de la cubierta sur: ABIERTA.',
  consoleBusy: 'La investigadora no te deja acercarte a la consola.',
  photo: [
    'Una foto enmarcada, algo descolorida. En el marco, una placa: «Proyecto Laguna — equipo de campo».',
    'Seis personas con botas de agua delante de una laguna clara. Uno de los rostros está rascado hasta el cartón.',
    'Las manos de esa figura sostienen un cuaderno de tapas verdes. Como el que Alerce lleva siempre en el bolsillo.',
  ],
  photoAlerce: 'Alerce no se gira.',
  photoAgain: 'La foto del «Proyecto Laguna». El rostro rascado. El cuaderno de tapas verdes.',
  desk: 'Sobre la mesa hay una tarjeta magnética con el emblema de los tubos cruzados: «Dirección · Acceso total».',
  cardGot: 'Has cogido la tarjeta de dirección.',
  deskAfter: 'La mesa de la dirección. Informes apilados con el sello de la Fundación Meridiano.',
  terminal: [
    'Un terminal encendido. El último informe:',
    '«Muestra Z-4: recuperada por la draga en el sector centro. Estable en el tanque de presión del laboratorio.»',
    '«Los cultivos de la Línea Z crecen más deprisa cerca de ella. Recomendación: no liberarla.»',
  ],
  cabinet: 'Archivadores metálicos. Carpetas con números en vez de nombres.',
  window: 'Por la ventana se ve el mar abierto y, muy al norte, la costa de Nexo.',
});

// ───────────────────────────── Invernadero ─────────────────────────────

async function vatScript(ctx) {
  await ctx.say(INTERIOR_TEXT.vat);
  if (!ctx.flag('b13_talasa_cultivos_vistos')) {
    ctx.setFlag('b13_talasa_cultivos_vistos');
    await zygardeSays(ctx, INTERIOR_TEXT.vatZygarde);
  }
}

async function consoleScript(ctx) {
  if (ctx.flag(F.talGreenhouse)) { await ctx.say(INTERIOR_TEXT.consoleDone); return; }
  const researcher = ctx.world.events.find((e) => e.id === 'investigadora_invernadero' && !e.erased);
  if (researcher && !ctx.selfSwitch('A', researcher)) { await ctx.say(INTERIOR_TEXT.consoleBusy); return; }
  if (!(await ctx.confirm(INTERIOR_TEXT.consoleAsk))) return;
  ctx.se('PRSFX- Shift Gear', { volume: 80 });
  ctx.shake(2, 6, 16);
  ctx.setFlag(F.talGreenhouse);
  await ctx.say(INTERIOR_TEXT.consoleOpen);
}

export function greenhouseEvents() {
  const G = GREENHOUSE;
  return [
    ...G.vats.map(([x, y], i) => ({
      id: `cultivo_${i + 1}`, x, y, name: 'Tanque de cultivo', ...objectPage(OBJ.vat, [2, 4, 6, 8][i % 4], { stepAnime: true }),
      solid: true, trigger: 'action', script: vatScript,
    })),
    // La mitad alta de cada tanque (el sprite ocupa dos filas): no se camina por detrás del cristal.
    ...G.vats.map(([x, y], i) => ({ id: `cultivo_alto_${i + 1}`, x, y: y - 1, solid: true, noOver: true, trigger: 'action', script: vatScript })),
    examine('registros_cultivo', G.table.x, G.table.y, INTERIOR_TEXT.table, { solid: true }),
    { id: 'consola_invernadero', x: G.console.x, y: G.console.y, name: 'Consola', solid: true, trigger: 'action', script: consoleScript },
    {
      id: 'investigadora_invernadero', type: 'trainer', trainer: 'b13_investigadora_invernadero', name: 'Investigadora Amaia',
      sprite: SPRITE.researcherF, x: G.researcher.x, y: G.researcher.y, dir: G.researcher.dir, sight: 4,
      intro: 'No toques los tanques. Cada Solosis de ahí dentro vale meses de trabajo.',
      after: 'Los alimentamos con resonancia, no con comida. Crecen alrededor de la muestra como limaduras alrededor de un imán.',
    },
    { id: 'objeto_invernadero', type: 'item', x: G.item.x, y: G.item.y, item: G.item.item },
  ];
}

// ───────────────────────────── Despacho de dirección ─────────────────────────────

/** Alerce se adelanta al despacho en cuanto la compuerta de la cubierta sur está abierta. */
const alerceHere = when({ all: [F.talArrival, F.talGreenhouse], none: [F.talBattle] });

async function photoScript(ctx) {
  if (ctx.flag(F.talPhoto)) { await ctx.say(INTERIOR_TEXT.photoAgain); return; }
  for (const t of INTERIOR_TEXT.photo) await ctx.say(t);
  ctx.setFlag(F.talPhoto);
  const alerce = ctx.world.events.find((e) => e.id === 'alerce_despacho' && !e.erased && e.page?.sprite);
  if (alerce) {
    await ctx.wait(30);
    await ctx.say(INTERIOR_TEXT.photoAlerce);
  }
}

async function deskScript(ctx) {
  if (ctx.flag(F.talCard)) { await ctx.say(INTERIOR_TEXT.deskAfter); return; }
  await ctx.say(INTERIOR_TEXT.desk);
  ctx.me('key_item_get');
  ctx.setFlag(F.talCard);
  await ctx.say(INTERIOR_TEXT.cardGot);
  const alerce = ctx.world.events.find((e) => e.id === 'alerce_despacho' && !e.erased && e.page?.sprite);
  if (alerce) {
    await ctx.say('Esa tarjeta abre el laboratorio. Ve delante. Te alcanzo en la puerta.', { speaker: SPEAKER.alerce });
  }
}

async function alerceOffice(ctx) {
  // Sigue de espaldas: habla sin girarse (lock: false en el evento).
  if (!ctx.flag(F.talCard)) {
    await lines(ctx, SPEAKER.alerce, [
      'Busca una tarjeta de acceso. En un sitio así, la tendrá quien manda.',
      'Yo reviso estos archivos.',
    ]);
    return;
  }
  await ctx.say('Ya la tienes. Ve delante; enseguida voy.', { speaker: SPEAKER.alerce });
}

export function officeEvents() {
  const O = OFFICE;
  return [
    {
      id: 'foto_laguna', x: O.photo.x, y: O.photo.y + 1, name: 'Foto enmarcada',
      ...objectPage(OBJ.photo, 2), through: true, trigger: 'action', script: photoScript,
    },
    // En la base de la mesa (fila y + 1): se examina desde la alfombra, de cara a la mesa.
    ...[O.desk.x - 1, O.desk.x, O.desk.x + 1].map((x, i) => ({ id: `mesa_direccion_${i}`, x, y: O.desk.y + 1, solid: true, trigger: 'action', noOver: true, script: deskScript })),
    { id: 'terminal_despacho', x: O.terminal.x, y: O.terminal.y, solid: true, trigger: 'action', noOver: true, script: async (ctx) => { for (const t of INTERIOR_TEXT.terminal) await ctx.say(t); } },
    ...O.cabinets.map(([x, y], i) => examine(`archivador_${i}`, x, y, INTERIOR_TEXT.cabinet, { solid: true })),
    examine('ventana_despacho', O.window.x, O.window.y + 1, INTERIOR_TEXT.window, { through: true }),
    {
      id: 'alerce_despacho', x: O.alerce.x, y: O.alerce.y, name: SPEAKER.alerce,
      pages: [
        { through: true },
        { when: alerceHere, sprite: SPRITE.alerce, dir: O.alerce.dir, move: 'still', directionFix: true, lock: false, solid: true, trigger: 'action', script: alerceOffice },
      ],
    },
  ];
}
