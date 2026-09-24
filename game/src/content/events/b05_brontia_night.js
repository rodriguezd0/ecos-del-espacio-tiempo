// Villa Brontia de noche (docs/CAMPANA.md B05: «Brontia está a oscuras»; TABLILLAS T03 «cada noche cae un rayo en
// el campanario, sin tormenta» y «Brontia recupera la luz a medias antes de P3»; B06: «el Parque da luz a Brontia»):
//   · apagón: de noche el pueblo queda en penumbra (oscuridad del compositor con la luz del jugador y velas en las
//     ventanas); con la luz a medias (b05_brontia_luz) se encienden las farolas; tras P3, todo normal;
//   · el rayo de cada noche sobre el campanario (destello, trueno y el sprite del rayo) hasta que se desvía (T03).
// La oscuridad la ajusta un evento paralelo del propio mapa (y onEnter al entrar) mediante scene.darkness, la misma
// que usa MapScene para los mapas `dark`; al salir del mapa, applyEnvironment la restablece.
import { F, SPRITE, isNight } from './b05_common.js';
import { LAMPS, TOWER, BUILDINGS } from '../maps/b05/villa_brontia_layout.js';

export const MAP_ID = 'villa_brontia';
/** Variable que muestra el rayo (1) durante unos fotogramas. */
export const BOLT_VAR = 'b05_rayo_fx';
const STRIKE_EVERY = 60 * 22; // fotogramas entre rayos (reloj de juego acelerado: ≈ cada 22 minutos)

/** Oscuridad deseada: { amount, radius } o null. Pura (tests). */
export function blackoutDarkness(state) {
  if (!state || state.flag(F.p3) || !isNight(state)) return null;
  return state.flag(F.light) ? { amount: 0.42, radius: 96 } : { amount: 0.7, radius: 80 };
}

/** Aplica la oscuridad del apagón si el mapa actual es Brontia. */
export function applyBlackout(ctx) {
  const scene = ctx.scene;
  if (!scene || ctx.world?.map?.id !== MAP_ID) return;
  const want = blackoutDarkness(ctx.state);
  const cur = scene.darkness;
  if (!want) { if (cur?.b05) scene.darkness = null; return; }
  if (!cur || cur.amount !== want.amount) scene.darkness = { ...want, b05: true };
}

/** onEnter del mapa: oscuridad inmediata (sin esperar al evento paralelo). */
export async function brontiaOnEnter(ctx) {
  // Un guardado hecho justo durante el destello dejaría el sprite del rayo fijo en el chapitel.
  if (Number(ctx.state.var(BOLT_VAR, 0)) !== 0) ctx.setVar(BOLT_VAR, 0);
  applyBlackout(ctx);
}

/** ¿Cae esta noche el rayo sobre la torre? (hasta que el circuito lo desvía y el rayo carga la subestación). */
export const nightlyStrike = (s) => Boolean(s) && isNight(s) && !s.flag(F.circuit) && !s.flag(F.strike);

/** Destello, trueno y rayo sobre el campanario (breve; sin bloquear al jugador). */
export async function strikeFx(ctx, { power = 1 } = {}) {
  ctx.setVar(BOLT_VAR, 1);
  ctx.se('Thunder4', { volume: 70 + 20 * power });
  await ctx.flash([255, 255, 255], 8, 150 + 60 * power);
  ctx.shake(2 + 2 * power, 8, 10);
  await ctx.wait(10);
  ctx.setVar(BOLT_VAR, 0);
}

export function nightEvents() {
  const lamps = LAMPS.map(([x, y], i) => ({
    id: `farola_luz_${i}`, x, y: y + 1, through: true,
    when: (s) => isNight(s) && (s.flag(F.light) || s.flag(F.p3)), light: { radius: 76, intensity: 1 },
  }));
  // Velas tras las ventanas durante el apagón (y luz normal después).
  const windows = [BUILDINGS.posada, BUILDINGS.abril, BUILDINGS.tienda].map((b, i) => ({
    id: `ventana_luz_${i}`, x: b.door.x + 1, y: b.door.y, through: true,
    when: (s) => isNight(s), light: { radius: 40, intensity: 0.7 },
  }));
  const center = { id: 'centro_luz', x: BUILDINGS.centro.door.x, y: BUILDINGS.centro.door.y, through: true, when: (s) => isNight(s), light: { radius: 64, intensity: 0.9 } };
  return [
    ...lamps,
    ...windows,
    center,
    // Rayo sobre el chapitel (se muestra con la variable BOLT_VAR).
    {
      id: 'rayo', x: TOWER.x, y: TOWER.y, through: true, alwaysOnTop: true,
      pages: [{}, { when: (s) => Number(s?.var(BOLT_VAR, 0)) === 1, sprite: SPRITE.bolt, dir: 2, stepAnime: true, directionFix: true, walkAnime: false, speed: 6, shadow: false, light: { radius: 120, intensity: 1 } }],
    },
    // Apagón y rayo nocturno: un evento paralelo que revisa la hora.
    {
      id: 'noche_brontia', x: 0, y: 0, through: true, trigger: 'parallel',
      script: async (ctx) => {
        if (ctx.world?.map?.id !== MAP_ID) { await ctx.wait(30); return; }
        applyBlackout(ctx);
        const ev = ctx.event;
        const now = ctx.scene?.frame ?? 0;
        if (nightlyStrike(ctx.state)) {
          if (!ev.b05NextStrike) ev.b05NextStrike = now + 150;
          if (now >= ev.b05NextStrike && !ctx.world.scriptBusy?.()) {
            ev.b05NextStrike = now + STRIKE_EVERY;
            await strikeFx(ctx);
          }
        }
        await ctx.wait(30);
      },
    },
  ];
}
