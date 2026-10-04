// Condiciones de campo con tiempo del juego: ningún encuentro usa probabilidades.
import { F, V, eventById, postgame } from './b22e_common.js';
import { paradoxPresent, cauceStep, mothRadius, tileDistance } from './b22e_grieta_logic.js';
import { CAUCE, ESCARCHA, HONDONADA, zoneOf } from '../maps/b22e/grieta_layout.js';
import { stormActive } from '../../world/rest.js';
import { paradoxBattle } from './b22e_grieta_battle.js';
import { syncBlocks } from './b22e_grieta_taller.js';

function startFight(ctx, ev, key, st) {
  if (!ev?.page || st.fighting || ctx.world.scriptBusy()) return;
  st.fighting = true;
  ctx.scene?.runScript?.(async (c) => {
    try { await paradoxBattle(c, key); }
    finally { st.fighting = false; st.approached = false; st.idleSince = c.state.playTimeFrames; }
  }, ev, `porvenir_${key}`);
}

function approach(ctx, key, st, active) {
  const ev = eventById(ctx, `b22e_${key}`);
  if (!active || !ev?.page || ev.busy() || ctx.world.scriptBusy()) return;
  if (tileDistance(ev, ctx.player) <= 1) { startFight(ctx, ev, key, st); return; }
  ev.moveTowardPlayer();
}

export async function grietaMonitor(ctx) {
  if (!postgame(ctx.state)) return;
  const p = ctx.player, monitor = ctx.event;
  if (!p || !monitor) return;
  const st = monitor.b22e || (monitor.b22e = { last: null, idleSince: ctx.state.playTimeFrames, approached: false, fighting: false });
  syncBlocks(ctx);
  const zone = zoneOf(p.x, p.y);
  if (!ctx.flag(F.ferrodadaAparecida)) {
    const old = ctx.var(V.cauce, '');
    const strip = zone === 'cauce' && p.y === CAUCE.south.y ? 'sur'
      : zone === 'cauce' && p.y === CAUCE.north.y ? 'norte' : null;
    const next = zone === 'cauce' ? cauceStep(old, { strip, riding: Boolean(ctx.world.zygMount?.form) }) : { next: '', done: false };
    if (next.next !== old) ctx.setVar(V.cauce, next.next);
    if (next.done) { ctx.setFlag(F.ferrodadaAparecida); ctx.cry?.('IRONTREADS'); ctx.requestRefresh?.(); }
  }
  const moved = !st.last || st.last[0] !== p.x || st.last[1] !== p.y || p.busy() || ctx.world.scriptBusy();
  if (moved || zone !== 'escarcha') { st.idleSince = ctx.state.playTimeFrames; st.approached = false; }
  st.last = [p.x, p.y];
  if (zone === 'escarcha' && paradoxPresent(ctx.state, 'ferrosaco') && ctx.state.playTimeFrames - st.idleSince >= ESCARCHA.frames) st.approached = true;
  approach(ctx, 'ferrosaco', st, st.approached && zone === 'escarcha');
  const moth = eventById(ctx, 'b22e_ferropolilla');
  const light = Boolean(ctx.state.data.zygarde?.form) && zone === 'hondonada'
    && moth && tileDistance(moth, p) <= mothRadius(ctx.state, HONDONADA.radius, HONDONADA.radiusFlash);
  approach(ctx, 'ferropolilla', st, light && paradoxPresent(ctx.state, 'ferropolilla'));
  // El clima cambia mientras se recorre el mapa; refrescar solo cuando cambia su estado.
  const storm = stormActive(ctx.state);
  if (st.storm !== storm) { st.storm = storm; ctx.requestRefresh?.(); }
}
