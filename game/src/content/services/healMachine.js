// Máquina de curación del Centro Pokémon: Poké Balls que aparecen una a una sobre la máquina, parpadean
// mientras suena la fanfarria 'heal' y desaparecen (como el evento "Healing balls" de Essentials).
// Gráficos de Añil: Graphics/Characters/Healing balls 1.png (1–3 balls) y Healing balls 2.png (4–6 balls);
// hoja 4×4 de 64×48 donde la fila (dirección 4/6/8) es el número de balls y la columna el destello.

export const MAX_BALLS = 6;
const BALL_EVENT_ID = '__svc_bolas_curacion';
const PLACE_FRAMES = 12; // pausa entre una ball y la siguiente
const FLASH_FRAMES = 8; // duración de cada fase del destello
const MIN_FLASH_FRAMES = 100; // las balls parpadean al menos esto aunque la fanfarria no suene
const MAX_JINGLE_FRAMES = 240; // tope por si el audio no avisa del final
const ROW_DIRS = [4, 6, 8];

/** Gráfico y dirección (fila) que muestran `count` balls (1..6). Puro. */
export function ballsFrame(count) {
  const n = Math.max(1, Math.min(MAX_BALLS, Math.floor(count)));
  const sheet = n <= 3 ? 'anil:Healing balls 1' : 'anil:Healing balls 2';
  return { sprite: sheet, dir: ROW_DIRS[(n - 1) % 3] };
}

/** Número de balls que se colocan en la máquina (una por Pokémon del equipo, máx. 6). Puro. */
export function ballCount(party) {
  return Math.max(0, Math.min(MAX_BALLS, (party || []).length));
}

function setBalls(ev, count) {
  const { sprite, dir } = ballsFrame(count);
  ev.characterName = sprite;
  ev.direction = dir;
  ev.pattern = 0;
}

/**
 * Anima la máquina en la casilla (x, y) del mapa actual y cura al equipo a mitad de la fanfarria.
 * La casilla es la del evento de las balls: las balls se dibujan centradas 16 px a la derecha de la
 * casilla y a la altura de su borde superior (convención de la hoja de Añil).
 * @param {object} ctx contexto de guion
 * @param {{ x: number, y: number, offsetX?: number, count?: number, onHeal?: () => void }} opts
 *   offsetX: ajuste horizontal fino en px (la máquina no siempre cae en el borde de una casilla)
 */
export async function playHealMachine(ctx, { x, y, offsetX = 0, count = ballCount(ctx.state.party), onHeal = null }) {
  const n = Math.max(0, Math.min(MAX_BALLS, count));
  const world = ctx.world;
  let ev = null;
  try {
    if (n > 0 && world?.spawnEvent) {
      ev = world.spawnEvent({
        id: BALL_EVENT_ID, x, y, sprite: '', dir: 4, through: true, alwaysOnTop: true, shadow: false,
        directionFix: true, walkAnime: false,
      });
      ev.xOffset = offsetX;
      for (let i = 1; i <= n; i++) {
        setBalls(ev, i);
        ctx.se('ball_drop', { volume: 60 });
        await ctx.wait(PLACE_FRAMES);
      }
    }
    const jingle = Promise.resolve(ctx.me('heal')).catch(() => {});
    if (onHeal) onHeal();
    let frames = 0;
    let done = false;
    jingle.then(() => { done = true; });
    await ctx.scene.runner.until(() => {
      frames += 1;
      if (ev) ev.pattern = Math.floor(frames / FLASH_FRAMES) % 4;
      return (done && frames >= MIN_FLASH_FRAMES) || frames >= MAX_JINGLE_FRAMES;
    });
  } finally {
    if (ev) world.removeEvent(ev);
  }
}
