// Tipos de evento de campo de Zygarde (se registran en world/eventTypes.js y sustituyen a los básicos).
// Lectura en el mapa (CAMPANA §1.1): ninguna barrera muestra cifras.
//   zygardeCell   { cell, text?, onFound? }                      célula (brillo); comprueba la progresión
//   ramRock       { kind: 'rock'|'log', group?, sprite?, tileId? } Embestida: fisura blanca con brillo verde
//   roughTerrain  { kind: 'mud'|'sand'|'snow', mounted? }       Terreno complicado (mounted: solo montado)
//   gravelSlope   {}                                            cuesta de grava: solo montado en el 10 %
//   climbWall     { to: [x, y], down?, h? }                     Trepar: pared con vetas verdes
//   diveSpot      { to, tx, ty, dir, surface? }                 Buceo: remolino (surface: salida al subir)
//   diveVent      { kind?: 'vent'|'bolsa' }                     respiradero/bolsa de aire (recarga la burbuja)
//   diveCurrent   { dir, length }                               corriente submarina (empuja)
//   rebuildGap    { tiles: [[x, y, capa, id]…] }                Reconstrucción en zócalo hexagonal (persiste)
// Áreas: zygardeArea(type, prefijo, x, y, w, h, extra) crea un evento por casilla (barro, grava…).
import { FIELD_TEXT } from '../../content/zygarde/texts.js';
import { TOTAL_CELLS } from '../../content/zygarde/thresholds.js';
import { isRiding, canRide, setRiding } from './mount.js';
import { checkZygardeProgress } from './scenes.js';
import { ramBreak, climbWall, rebuildStones, diveDown, surfaceUp } from './actions.js';

const notA = (_s, ev) => !ev.selfSwitch('A');
const isA = (_s, ev) => ev.selfSwitch('A');
const YES_NO = ['Sí', 'No'];
const DIR_NAME = { 2: 'down', 4: 'left', 6: 'right', 8: 'up' };

async function ask(ctx, message) {
  return (await ctx.choice(YES_NO, { message, cancel: 1 })) === 0;
}

/** Texto por defecto al recoger una célula: «Has encontrado una Célula de Zygarde. (n/100)». */
export function cellFoundDefault(state) {
  const n = state?.data?.zygarde?.cells?.length ?? 0;
  return `${FIELD_TEXT.cellFound} (${n}/${TOTAL_CELLS})`;
}

/** Ofrece montar en el 10 % (cuestas de grava, arena honda montado). Devuelve true si montó. */
async function offerRide(ctx) {
  if (!ctx.zygarde('run') || !canRide(ctx.world)) return false;
  if (!(await ask(ctx, FIELD_TEXT.gravelAsk))) return false;
  setRiding(ctx.world, true);
  ctx.se('core_signal', { volume: 40 });
  ctx.requestRefresh();
  return true;
}

const ROUGH_TEXT = { mud: FIELD_TEXT.roughMud, sand: FIELD_TEXT.roughSand, snow: FIELD_TEXT.roughSnow };

export const ZYGARDE_EVENT_TYPES = {
  // ---- Célula en el suelo: brillo verde hexagonal; al pisarla se recoge y se comprueba la progresión.
  // `when(state, ev)` opcional: condición extra de aparición (célula que aparece tras un hito de historia).
  zygardeCell(d) {
    if (!d.cell) throw new Error(`zygardeCell ${d.id}: falta "cell"`);
    const extra = typeof d.when === 'function' ? d.when : null;
    return {
      ...d,
      pages: [{
        when: (s, ev) => !s?.hasCell(d.cell) && (!extra || Boolean(extra(s, ev))),
        glow: d.glow ?? 'zygardeCell',
        through: true,
        trigger: 'touch',
        script: async (ctx) => {
          ctx.state.addCell(d.cell);
          ctx.se('Mining item get');
          ctx.requestRefresh();
          const text = typeof d.text === 'function' ? d.text(ctx.state) : (d.text ?? cellFoundDefault(ctx.state));
          await ctx.say(text);
          if (typeof d.onFound === 'function') await d.onFound(ctx);
          await checkZygardeProgress(ctx);
        },
      }],
    };
  },

  // ---- Embestida: roca agrietada o troncos (lectura distinta de una barrera común). `group` rompe varios.
  ramRock(d) {
    const kind = d.kind === 'log' ? 'log' : 'rock';
    const sprite = d.sprite ?? (d.tileId ? '' : (kind === 'log' ? 'Object tree 1' : 'Object rock'));
    return {
      ...d,
      pages: [{
        when: notA,
        sprite,
        tileId: d.tileId || 0,
        solid: true,
        noOver: true,
        directionFix: true,
        walkAnime: false,
        trigger: 'action',
        glow: d.glow === false ? null : { name: 'zygardeFissure', kind },
        script: async (ctx) => {
          if (!ctx.zygarde('ram')) { await ctx.say(d.blockedText ?? (kind === 'log' ? FIELD_TEXT.ramLog : FIELD_TEXT.ramRock)); return; }
          if (!(await ask(ctx, d.askText ?? FIELD_TEXT.ramAsk))) return;
          const ev = ctx.event;
          const targets = d.group ? ctx.world.events.filter((e) => e.def?.group === d.group && e.page && !e.erased) : [ev];
          await ramBreak(ctx, ev, targets);
        },
      }],
    };
  },

  // ---- Terreno complicado: barro, arena honda o nieve profunda. Con `mounted`, además hay que ir montado.
  roughTerrain(d) {
    const kind = ROUGH_TEXT[d.kind] ? d.kind : 'mud';
    const open = (s, ev) => Boolean(s?.zygardeAbility('terrain')) && (!d.mounted || isRiding(ev?.world));
    return {
      ...d,
      pages: [
        {
          when: (s, ev) => !open(s, ev),
          solid: true,
          noOver: true,
          trigger: 'action',
          script: async (ctx) => {
            await ctx.say(d.blockedText ?? ROUGH_TEXT[kind]);
            if (ctx.zygarde('terrain') && d.mounted && !isRiding(ctx.world)) {
              await ctx.say(FIELD_TEXT.roughMounted);
              await offerRide(ctx);
            }
          },
        },
        { when: open, through: true },
      ],
    };
  },

  // ---- Cuesta de grava (G1): a pie resbala; montado en el 10 % se sube.
  gravelSlope(d) {
    return {
      ...d,
      pages: [
        {
          when: (_s, ev) => !isRiding(ev?.world),
          solid: true,
          noOver: true,
          trigger: 'action',
          script: async (ctx) => {
            await ctx.say(d.blockedText ?? FIELD_TEXT.gravel);
            await offerRide(ctx);
          },
        },
        { when: (_s, ev) => isRiding(ev?.world), through: true },
      ],
    };
  },

  // ---- Trepar: pared con vetas verdes; `to: [x, y]` destino (arriba o abajo con `down`).
  climbWall(d) {
    if (!d.to) throw new Error(`climbWall ${d.id}: falta "to"`);
    return {
      ...d,
      solid: true,
      trigger: 'action',
      noOver: true,
      glow: d.glow === false ? null : { name: 'zygardeVeins', h: d.h ?? 1 },
      script: async (ctx) => {
        if (!ctx.zygarde('climb')) { await ctx.say(d.blockedText ?? (d.down ? FIELD_TEXT.climbWallDown : FIELD_TEXT.climbWall)); return; }
        if (!(await ask(ctx, d.askText ?? (d.down ? FIELD_TEXT.climbDownAsk : FIELD_TEXT.climbAsk)))) return;
        await climbWall(ctx, d.to);
      },
    };
  },

  // ---- Buceo: remolino en el agua profunda (nadando) o salida a la superficie (`surface: true`).
  diveSpot(d) {
    if (!d.to) throw new Error(`diveSpot ${d.id}: falta "to"`);
    const up = Boolean(d.surface);
    return {
      ...d,
      through: true,
      trigger: 'action',
      glow: d.glow === false ? null : { name: 'zygardeWhirl', up },
      script: async (ctx) => {
        if (up) {
          if (!(await ask(ctx, d.askText ?? FIELD_TEXT.surfaceAsk))) return;
          await surfaceUp(ctx, d);
          return;
        }
        if (!ctx.player.surfing) return;
        if (!ctx.zygarde('dive')) { await ctx.say(d.blockedText ?? FIELD_TEXT.diveBlocked); return; }
        if (!(await ask(ctx, d.askText ?? FIELD_TEXT.diveAsk))) return;
        await diveDown(ctx, d);
      },
    };
  },

  // ---- Respiradero verde o bolsa de aire: recarga la burbuja y pasa a ser el punto de regreso.
  diveVent(d) {
    return {
      ...d,
      through: true,
      trigger: 'touch',
      lock: false,
      glow: d.glow === false ? null : { name: 'zygardeVent', kind: d.kind === 'bolsa' ? 'bolsa' : 'vent' },
      script: async (ctx) => {
        // Sin mensaje por defecto (el medidor se rellena a la vista); `text` añade un aviso breve.
        const refilled = ctx.scene?.zygarde?.refillDive?.(ctx.event.x, ctx.event.y);
        ctx.se('PRSFX- Bubble', { volume: refilled ? 80 : 40 });
        if (refilled && d.text) ctx.ui?.toast?.(d.text === true ? FIELD_TEXT.ventRefill : d.text);
      },
    };
  },

  // ---- Corriente submarina: empuja `length` casillas hacia `dir` (flechas de burbujas).
  diveCurrent(d) {
    const dir = DIR_NAME[d.dir] ? d.dir : 6;
    const length = Math.max(1, d.length ?? 3);
    return {
      ...d,
      through: true,
      trigger: 'touch',
      glow: d.glow === false ? null : { name: 'zygardeCurrent', dir },
      script: async (ctx) => {
        ctx.se('PRSFX- Water Sport', { volume: 50 });
        ctx.face('player', dir);
        await ctx.move('player', ['direction_fix_on', ...Array(length).fill(DIR_NAME[dir]), 'direction_fix_off'], { through: false, speed: 5 });
      },
    };
  },

  // ---- Reconstrucción: zócalo hexagonal señalizado junto a un vacío; las piedras quedan (self switch A + patch).
  rebuildGap(d) {
    if (!Array.isArray(d.tiles) || !d.tiles.length) throw new Error(`rebuildGap ${d.id}: falta "tiles"`);
    return {
      ...d,
      pages: [
        {
          when: notA,
          solid: true,
          noOver: true,
          trigger: 'action',
          glow: d.glow === false ? null : { name: 'zygardeSocket' },
          script: async (ctx) => {
            if (!ctx.zygarde('rebuild')) { await ctx.say(d.blockedText ?? FIELD_TEXT.rebuildBlocked); return; }
            if (!(await ask(ctx, d.askText ?? FIELD_TEXT.rebuildAsk))) return;
            await rebuildStones(ctx, d.tiles);
            ctx.setSelfSwitch('A', true);
            await ctx.say(d.doneText ?? FIELD_TEXT.rebuildDone);
          },
        },
        { when: isA, through: true, patch: d.tiles },
      ],
    };
  },
};

/**
 * Un evento por casilla de un rectángulo (barro, arena, nieve, grava…): ids `<prefijo>_<x>_<y>`.
 * type: 'roughTerrain' | 'gravelSlope' | …; extra: propiedades comunes (kind, mounted…).
 */
export function zygardeArea(type, prefix, x, y, w, h, extra = {}) {
  const out = [];
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) out.push({ ...extra, id: `${prefix}_${x + i}_${y + j}`, type, x: x + i, y: y + j });
  }
  return out;
}
