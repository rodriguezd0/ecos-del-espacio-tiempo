// El Sumidero (docs/CAMPANA.md B12 «(c) El Sumidero», C053, Gengarita): islas a distintas alturas unidas por
// cascadas invertidas —ascensores de agua de un solo sentido— que se abren con pulsadores. Desde la isla alta del
// oeste no hay bajada: hay que dejarse caer (sin daño) para volver al último poste. En el vacío mayor cruza UNA vez la
// sombra de Giratina, al fondo y en paralaje, unos 4 s: el sonido ambiente cae y Zygarde se queda inmóvil.
// «No mires. No nos busca. Aún.» Sin combate ni cartel.
import { F, OBJ, ANCHOR_ART, when, zygardeSays, zygardeLines, pause } from './b12_common.js';
import { SUMIDERO, NUCLEO } from '../maps/b12/layout.js';
import { IMPOSSIBLE_ART } from '../../world/impossible/eventTypes.js';
import { isVoidCell } from '../../world/impossible/logic.js';
import { b12CellEvents } from './b12_cells.js';
import { DIST_TEXT, portalEvent } from './b12_distorsion.js';

export const SUMIDERO_TEXT = Object.freeze({
  closed: 'Una boca de piedra cerrada con una losa grabada. Detrás se oye agua que corre hacia arriba.',
  button: 'La losa se hunde con un chasquido. Lejos, una boca de piedra se abre y el agua empieza a subir.',
  gengar: 'En el rincón, entre dos piedras que flotan del revés, algo brilla con un morado muy oscuro.',
});

const fallById = Object.fromEntries(SUMIDERO.falls.map((f) => [f.id, f]));

async function sumideroArrival(ctx) {
  ctx.setFlag(F.sumideroVisto);
  await pause(ctx, 16);
  await zygardeLines(ctx, ['Aquí el agua cae hacia arriba.', 'Busca con qué se abren las bocas.']);
}

/** Tras abrir la cascada del este desde la isla alta: la única bajada es dejarse caer. */
async function afterThirdButton(ctx) {
  if (ctx.flag(F.caerParaBajar)) return;
  ctx.setFlag(F.caerParaBajar);
  await pause(ctx, 20);
  await zygardeLines(ctx, ['Desde aquí no hay bajada.', '…Salvo caer. El poste de abajo nos recogerá.']);
}

/** La sombra de Giratina cruza el vacío mayor (una vez). */
async function giratinaShadow(ctx) {
  // Una casilla de la franja que haya quedado en el vacío (borde irregular de la isla): primero se cae.
  if (ctx.map && ctx.player && isVoidCell(ctx.map, ctx.player.x, ctx.player.y)) return;
  ctx.setFlag(F.sombraGiratina);
  const scene = ctx.scene;
  const core = ctx.world?.core;
  const keep = core ? { stepAnime: core.stepAnime, walkAnime: core.walkAnime } : null;
  if (core) { core.stepAnime = false; core.walkAnime = false; core.pattern = 0; }
  // «El sonido ambiente cae» (CAMPANA B12): solo baja la música; ningún efecto de sonido encima.
  const now = ctx.audio?.nowPlaying?.();
  if (now?.name) ctx.bgm(now.name, { volume: 22 });
  try {
    const url = ctx.scene?.panorama ? (await import('../../core/engine.js')).engine.assets.anil('Graphics/Pokemon/Front/GIRATINA_1.png') : null;
    // Masa negra que tapa las nebulosas, con un contorno violeta tenue: una sombra casi negra que se lee sobre el
    // vacío (biblia §6.6), sin identificarla. Con el negro anterior (0.85 y contorno muy oscuro) no se veía.
    const pass = scene?.panorama?.silhouette?.({
      url, scale: 3, from: [-240, 190], to: [760, 150], frames: 240, alpha: 0.95, color: [0.0, 0.0, 0.004], rim: [0.40, 0.22, 0.56], flip: true,
    });
    await pause(ctx, 250);
    if (pass) await Promise.race([pass, pause(ctx, 30)]);
  } catch (err) {
    console.warn('[b12] sombra de Giratina', err);
    await pause(ctx, 240);
  } finally {
    if (now?.name) ctx.bgm(now.name, { volume: 100 });
    if (core && keep) { core.stepAnime = keep.stepAnime; core.walkAnime = keep.walkAnime; }
  }
  await pause(ctx, 20);
  await zygardeSays(ctx, 'No mires. No nos busca. Aún.');
}

function fallEvents() {
  const out = [];
  for (const f of SUMIDERO.falls) {
    const open = when({ all: [f.flag] });
    out.push({
      id: `b12_boca_${f.id}`, type: 'cascadaInvertida', x: f.base.x, y: f.base.y, top: [f.top.x, f.top.y], open, closedText: SUMIDERO_TEXT.closed,
    });
    for (let y = f.top.y + 1; y < f.base.y; y++) {
      out.push({
        id: `b12_columna_${f.id}_${y}`, x: f.base.x, y, when: open, sprite: IMPOSSIBLE_ART.fall, dir: 2, directionFix: true, walkAnime: false,
        stepAnime: true, through: true, shadow: false,
      });
    }
    out.push({
      id: `b12_cima_${f.id}`, x: f.top.x, y: f.top.y, when: open, sprite: IMPOSSIBLE_ART.fall, dir: 8, directionFix: true, walkAnime: false,
      stepAnime: true, through: true, shadow: false,
    });
  }
  return out;
}

function buttonEvents() {
  return SUMIDERO.buttons.map((b) => ({
    id: `b12_${b.id}`, type: 'pulsador', x: b.x, y: b.y, flag: fallById[b.opens].flag, text: SUMIDERO_TEXT.button,
    onPress: b.opens === 'W3' ? afterThirdButton : undefined,
  }));
}

/**
 * Casillas que disparan la sombra: la mitad este de la isla alta (SUMIDERO.shadowStrip), salvo las que ya tienen
 * evento (C053) para no pisar dos guiones a la vez. Las que caen en el vacío no hacen daño: allí se cae antes.
 */
function shadowCells() {
  const S = SUMIDERO;
  const busy = new Set([`${S.cell.x},${S.cell.y}`, ...S.buttons.map((b) => `${b.x},${b.y}`)]);
  const out = [];
  for (let y = S.shadowStrip.y0; y <= S.shadowStrip.y1; y++) {
    for (let x = S.shadowStrip.x0; x <= S.shadowStrip.x; x++) if (!busy.has(`${x},${y}`)) out.push([x, y]);
  }
  return out;
}

export function sumideroEvents() {
  const S = SUMIDERO;
  const nucleo = { map: 'pilar_invertido_nucleo', ...NUCLEO.arrival };
  const strip = shadowCells().map(([x, y]) => ({
    id: `b12_sombra_${x}_${y}`, x, y, through: true, trigger: 'touch', when: when({ none: [F.sombraGiratina] }), script: giratinaShadow,
  }));
  return [
    { id: 'b12_llegada_sumidero', x: S.start.x, y: S.start.y, through: true, trigger: 'auto', when: when({ none: [F.sumideroVisto] }), script: sumideroArrival },
    ...fallEvents(),
    ...buttonEvents(),
    ...S.anchors.map((a) => ({ id: `b12_${a.id}`, type: 'ancla', x: a.x, y: a.y, sprite: a.symbol ? ANCHOR_ART[a.symbol] : undefined, text: DIST_TEXT.anchor, firstFlag: F.primeraAnclaP6 })),
    ...strip,
    ...b12CellEvents('pilar_invertido_sumidero'),
    { id: 'b12_gengarita', type: 'item', x: S.gengarita.x, y: S.gengarita.y, item: 'GENGARITEX' },
    { id: 'b12_gengarita_brillo', x: S.gengarita.x + 1, y: S.gengarita.y, through: true, trigger: 'touch', when: when({ none: ['b12_gengarita_vista'] }), script: async (ctx) => { ctx.setFlag('b12_gengarita_vista'); await ctx.say(SUMIDERO_TEXT.gengar); } },
    ...S.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1 })),
    portalEvent('b12_portal_nucleo', S.exit.x, S.exit.y, nucleo, { flag: F.sumideroHecho }),
  ];
}
