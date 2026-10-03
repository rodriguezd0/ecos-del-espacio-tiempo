// Escenas de cine del epílogo (docs/CAMPANA.md B21 §6, D24): el montaje de los Guardianes en sus Pilares (y los
// Clefairy del Círculo del Jardín si se levantó, B17), Vértice en la cubierta del carguero y los créditos sobre los
// lugares restaurados (BGM Creditos). El jugador «no está» en esas tomas: se le deja invisible en cada mapa, la escena
// va en modo cine (scene.cinematic: sin cartel de zona ni música del mapa) y la capa de b21_fx.js pone bandas y rótulos.
// Las tomas se saltan si su mapa no está registrado (bloques en obras). Módulo sin DOM salvo lo que se carga bajo demanda.
import { MAPS } from '../maps/index.js';
import { F, SPRITE, SPEAKER, MUSIC, GOLD, circleRaised, setActorsVisible, setClock, pause, lines } from './b21_common.js';
import { EPILOGUE_TEXT, MONTAGE_CAPTIONS } from './b21_texts.js';
import { CARGO } from '../maps/b21/layout.js';
import { NUCLEO as UMBRAL } from '../maps/b02/ruinas_dintel_floors.js';
import { CORE as CORRIENTE } from '../maps/b04/pilar_corriente_floors.js';
import { P3_VERTICAL as IMPULSO } from '../maps/b06/layout.js';
import { P4_VERTICAL as MASA } from '../maps/b08/layout.js';
import { NUCLEO as MEMORIA } from '../maps/b10/hondo_layout.js';

/** Tomas del montaje: Guardián de pie ante el núcleo de su Pilar, mirando arriba (casillas comprobadas en el mapa). */
export const MONTAGE_SHOTS = Object.freeze([
  Object.freeze({ key: 'casilda', map: 'ruinas_dintel_nucleo', x: UMBRAL.column.x, y: UMBRAL.column.y + 3, core: [UMBRAL.column.x, UMBRAL.column.y], player: [UMBRAL.column.x, UMBRAL.column.y + 5], sprite: SPRITE.casilda, emote: '…' }),
  Object.freeze({ key: 'leandro', map: 'pilar_corriente_nucleo', x: CORRIENTE.x, y: CORRIENTE.y + 3, core: [CORRIENTE.x, CORRIENTE.y], player: [CORRIENTE.x, CORRIENTE.y + 5], sprite: SPRITE.leandro, emote: '!' }),
  Object.freeze({ key: 'abril', map: 'anillo_vientos_nucleo', x: IMPULSO.pedestal.x, y: IMPULSO.pedestal.y + 3, core: [IMPULSO.pedestal.x, IMPULSO.pedestal.y], player: [IMPULSO.pedestal.x, IMPULSO.pedestal.y + 5], sprite: SPRITE.abril, emote: '♪' }),
  Object.freeze({ key: 'fermin', map: 'camara_contrapesos_nucleo', x: MASA.pedestal.x, y: MASA.pedestal.y + 3, core: [MASA.pedestal.x, MASA.pedestal.y], player: [MASA.pedestal.x, MASA.pedestal.y + 5], sprite: SPRITE.fermin, emote: '…' }),
  Object.freeze({ key: 'olvido', map: 'archivo_hondo_nucleo', x: MEMORIA.pedestal.x, y: MEMORIA.pedestal.y + 2, core: [MEMORIA.pedestal.x, MEMORIA.pedestal.y], player: [MEMORIA.pedestal.x, MEMORIA.pedestal.y + 4], sprite: SPRITE.olvido, emote: '♥' }),
]);

/** Toma de los Clefairy en el jardín central de Villa Alba (de noche), si se levantó el Círculo (B17). */
export const CLEFAIRY_SHOT = Object.freeze({
  map: 'villa_alba', center: [22, 17], player: [22, 21],
  dancers: Object.freeze([[20, 16], [24, 16], [19, 18], [25, 18], [22, 15], [22, 20]]),
});

/** Tomas de los créditos (lugares restaurados): mapa, casilla de partida y de llegada de la cámara. */
export const CREDIT_SHOTS = Object.freeze([
  Object.freeze({ map: 'villa_zaguan', from: [8, 18], to: [32, 18], caption: 'Villa Zaguán' }),
  Object.freeze({ map: 'garganta_albo', from: [13, 32], to: [13, 8], caption: 'Garganta del Albo' }),
  Object.freeze({ map: 'meseta_impulso', from: [10, 24], to: [38, 24], caption: 'Meseta del Impulso' }),
  Object.freeze({ map: 'dunas_ceniza', from: [12, 24], to: [46, 24], caption: 'Dunas de Ceniza' }),
  Object.freeze({ map: 'aldea_mnemos', from: [12, 22], to: [36, 22], caption: 'Aldea Mnemos' }),
  Object.freeze({ map: 'montana_portal', from: [22, 44], to: [22, 12], caption: 'Monte del Portal' }),
  Object.freeze({ map: 'caleta_sonda', from: [6, 16], to: [30, 16], caption: 'Caleta Sonda' }),
  Object.freeze({ map: 'lagos_alma', from: [14, 44], to: [44, 30], caption: 'Lagos del Alma' }),
  Object.freeze({ map: 'puente_convergencia', from: null, to: null, caption: 'Puente de la Convergencia' }),
  Object.freeze({ map: 'nucleo_origen', from: null, to: null, caption: 'Pilar del Origen' }),
  Object.freeze({ map: 'columna_lanza', from: [14, 33], to: [14, 8], caption: 'Columna Lanza' }),
  Object.freeze({ map: 'villa_alba', from: [22, 32], to: [22, 14], caption: 'Villa Alba' }),
]);

/** Bloques de créditos (se reparten entre las tomas). Textos a revisar por el autor. */
export const CREDITS = Object.freeze([
  Object.freeze(['POKÉMON: ECOS DEL ESPACIO-TIEMPO', 'La región de Axis']),
  Object.freeze(['Historia y mundo', 'Biblia narrativa de Axis']),
  Object.freeze(['Guion de la campaña', 'Documento maestro de Axis']),
  Object.freeze(['Motor', 'Three.js · 2D pixel art']),
  Object.freeze(['Recursos gráficos y sonoros', 'Pokémon Añil', 'Pokémon Essentials']),
  Object.freeze(['Los Guardianes', 'Casilda · Leandro · Abril · Fermín · Olvido']),
  Object.freeze(['Con la ayuda de', 'Alerce · Lía · Olmedo · Rosalía · Ramón']),
  Object.freeze(['Y de alguien que pidió permiso', 'Gael']),
  Object.freeze(['Pokémon es una marca de', 'Nintendo, Creatures Inc. y GAME FREAK inc.', 'Proyecto de fans sin ánimo de lucro']),
  Object.freeze(['Gracias por jugar']),
]);

/** Factor de velocidad de los créditos (1 = normal). El E2E lo sube con globalThis.__b21CreditsSpeed. */
const speed = () => Math.max(1, Number(globalThis.__b21CreditsSpeed) || 1);
const frames = (n) => Math.max(1, Math.round(n / speed()));

/** Capa de cine (solo navegador); en Node devuelve una capa muda. */
async function cinema() {
  if (typeof document === 'undefined') return { bars() {}, caption() {}, credit() {}, title() {}, clear() {}, close: async () => {} };
  try {
    const { openCinema } = await import('./b21_fx.js');
    return openCinema();
  } catch (err) {
    console.warn('[b21] capa de cine', err);
    return { bars() {}, caption() {}, credit() {}, title() {}, clear() {}, close: async () => {} };
  }
}

/** Entra en modo cine (sin carteles ni música de mapa) y lo deshace al final, pase lo que pase. */
async function inCinema(ctx, fn) {
  const scene = ctx.scene;
  const was = Boolean(scene?.cinematic);
  if (scene) scene.cinematic = true;
  const cine = await cinema();
  try {
    return await fn(cine);
  } finally {
    if (scene) scene.cinematic = was;
    await cine.close();
    setActorsVisible(ctx, true);
  }
}

/** Cambio de mapa en negro dejando al jugador invisible en (x, y). */
async function shotWarp(ctx, map, x, y, dir = 2) {
  await ctx.warp(map, x, y, dir, { fade: false });
  setActorsVisible(ctx, false);
}

const registered = (id) => Boolean(MAPS[id]);

// ─────────────────────────────── Montaje de los Guardianes ───────────────────────────────

async function guardianShot(ctx, shot, cine) {
  await shotWarp(ctx, shot.map, shot.player[0], shot.player[1], 8);
  const npc = ctx.world.spawnEvent?.({ id: `__montaje_${shot.key}`, x: shot.x, y: shot.y, sprite: shot.sprite, dir: 8, through: true });
  await ctx.camera.pan(shot.x, shot.y - 1, 1);
  const glow = ctx.effect?.('softLight', { x: shot.core[0], y: shot.core[1], radius: 90, intensity: 0.7, pulse: 0.35, color: [...GOLD], fadeIn: 30 });
  await ctx.fade('in', 30);
  cine.caption(MONTAGE_CAPTIONS[shot.key], 230);
  await pause(ctx, 80);
  if (npc) {
    ctx.face(npc, 'down');
    await ctx.emote(npc, shot.emote);
  }
  await pause(ctx, 90);
  await ctx.fade('out', 30);
  glow?.remove?.(1);
}

async function clefairyShot(ctx, cine) {
  const c = CLEFAIRY_SHOT;
  await shotWarp(ctx, c.map, c.player[0], c.player[1], 8);
  await ctx.tone([-70, -60, -10, 40], 1);
  const dancers = c.dancers.map(([x, y], i) => ctx.world.spawnEvent?.({
    id: `__clefairy_${i}`, x, y, sprite: SPRITE.clefairy, dir: 2, through: true, stepAnime: true, move: { wander: 1 },
  }));
  await ctx.camera.pan(c.center[0], c.center[1], 1);
  await ctx.fade('in', 30);
  cine.caption(MONTAGE_CAPTIONS.clefairy, 230);
  await pause(ctx, 60);
  for (const d of dancers) if (d) await ctx.emote(d, '♪');
  await pause(ctx, 80);
  await ctx.fade('out', 30);
  await ctx.tone([0, 0, 0, 0], 1);
}

/**
 * Montaje: «Mientras tanto, en los Pilares…». Vuelve a `home` ({ map, x, y, dir }) con el jugador visible.
 * Marca b21_montaje al terminar.
 */
export async function guardiansMontage(ctx, home) {
  ctx.bgm(MUSIC.montage, { fadeOutPrevious: 30 });
  await ctx.fade('out', 30);
  await inCinema(ctx, async (cine) => {
    cine.bars(true);
    cine.title([EPILOGUE_TEXT.montage], 150);
    await pause(ctx, 150);
    for (const shot of MONTAGE_SHOTS) if (registered(shot.map)) await guardianShot(ctx, shot, cine);
    if (circleRaised(ctx.state) && registered(CLEFAIRY_SHOT.map)) await clefairyShot(ctx, cine);
    cine.bars(false);
    await ctx.warp(home.map, home.x, home.y, home.dir, { fade: false });
  });
  ctx.bgm(MUSIC.village, { fadeOutPrevious: 30 });
  await ctx.camera.reset(1);
  await ctx.fade('in', 30);
  ctx.setFlag(F.montageDone);
}

// ─────────────────────────────── Vértice en el carguero ───────────────────────────────

/** Cubierta del carguero: Vértice busca un cuaderno que no encuentra. Vuelve a `home` al acabar. */
export async function shipScene(ctx, home) {
  await ctx.fade('out', 24);
  await inCinema(ctx, async (cine) => {
    ctx.bgm(MUSIC.ship, { fadeOutPrevious: 20 });
    await shotWarp(ctx, 'carguero', CARGO.hidden.x, CARGO.hidden.y, 8);
    await ctx.camera.pan(CARGO.camera.x, CARGO.camera.y, 1);
    cine.bars(true);
    await ctx.fade('in', 40);
    cine.caption(EPILOGUE_TEXT.shipCaption, 200);
    await pause(ctx, 60);
    const v = ctx.world.events.find((e) => e.id === 'b21_vertice');
    if (v) {
      await ctx.move(v, ['left', 'left', { wait: 16 }, 'turn_down'], { speed: 2.5 });
      await ctx.emote(v, '?');
      await ctx.move(v, ['right', 'right', 'right', { wait: 12 }, 'turn_up'], { speed: 2.5 });
      await ctx.emote(v, '…');
    }
    await lines(ctx, SPEAKER.vertice, [EPILOGUE_TEXT.vertice[0]]);
    if (v) ctx.face(v, 'right');
    await pause(ctx, 30);
    await lines(ctx, SPEAKER.vertice, [EPILOGUE_TEXT.vertice[1]]);
    await pause(ctx, 40);
    await ctx.fade('out', 40);
    cine.bars(false);
    await ctx.warp(home.map, home.x, home.y, home.dir, { fade: false });
  });
  ctx.bgm(MUSIC.village, { fadeOutPrevious: 20 });
  await ctx.camera.reset(1);
  await ctx.fade('in', 24);
}

// ─────────────────────────────── Créditos ───────────────────────────────

/** Tomas utilizables: mapas registrados; las que no fijan casillas usan el `start` del mapa. */
export async function creditShots() {
  const out = [];
  for (const s of CREDIT_SHOTS) {
    if (!registered(s.map)) continue;
    if (s.from && s.to) { out.push(s); continue; }
    try {
      const def = (await MAPS[s.map]()).default;
      const st = def.start || { x: Math.floor(def.width / 2), y: Math.floor(def.height / 2) };
      out.push({ ...s, from: [st.x, st.y], to: [st.x, Math.max(0, st.y - 10)] });
    } catch (err) {
      console.warn(`[b21] toma de créditos ${s.map}`, err);
    }
  }
  return out;
}

/** Créditos sobre los lugares restaurados (BGM Creditos). Termina en negro, en el mapa de la última toma. */
export async function creditsRoll(ctx) {
  ctx.bgm(MUSIC.credits, { fadeOutPrevious: 40, restart: true });
  await ctx.fade('out', 40);
  setClock(ctx.state, 16, 30);
  const shots = await creditShots();
  await inCinema(ctx, async (cine) => {
    cine.bars(true);
    const per = frames(420);
    let block = 0;
    for (const shot of shots) {
      await shotWarp(ctx, shot.map, shot.from[0], shot.from[1], 2);
      await ctx.camera.pan(shot.from[0], shot.from[1], 1);
      const pan = ctx.camera.pan(shot.to[0], shot.to[1], per);
      await ctx.fade('in', frames(30));
      cine.caption(shot.caption, per - 20);
      if (block < CREDITS.length) cine.credit(CREDITS[block++], per - 30);
      await pan;
      await ctx.fade('out', frames(30));
    }
    while (block < CREDITS.length) {
      cine.credit(CREDITS[block++], frames(240));
      await pause(ctx, frames(240));
    }
    cine.title(['Fin'], frames(200));
    await pause(ctx, frames(200));
  });
  ctx.setFlag(F.creditsDone);
}
