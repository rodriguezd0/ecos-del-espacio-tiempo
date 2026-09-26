// Torres del Anillo de Captación (docs/CAMPANA.md B17 «Torres del Anillo (opcional)»: «cada torre se apaga con un puzzle
// breve de Reconstrucción y un combate de técnicos (nv 58–60). Recompensa: objetos (Restauración Total, Caramelo Raro).
// Apagarlas no es obligatorio; cambia una línea del Trío en P10»). Tres torres en el borde de la Sima que drenan viento,
// tormenta y temblor para el Resonador de Genesis del Mirador Sur (§5.4 «Operación Convergencia»).
//   · Puzzle «piedras sin apoyo» (reglas puras en b17_torres_logic.js): con la torre encendida una piedra solo aguanta a
//     tres zócalos de la roca firme; hay que llegar a la plataforma por las peñas. Las piedras alzadas se quedan.
//   · Al pisar la plataforma, dos técnicos de Genesis: combate doble de guion (bossBattle; perder = curado y de vuelta a
//     la entrada del espolón, sin pérdida).
//   · La consola apaga la torre: flag b17_torre_<id>, var b17_torres_apagadas (0–3, la consulta B20), la ruta queda
//     alzada para siempre y en la caja de suministros hay una Restauración Total y un Caramelo Raro.
// Las torres solo existen mientras Genesis ocupa el Mirador (del P8 al P9). Módulo puro salvo los guiones.
import {
  F, V, SPEAKER, SPRITE, OBJ, MUSIC, MAGENTA, occupied, towersOff, eventById, pause, frame,
} from './b17_common.js';
import { parseRoom, decodeRaised, encodeRaised, raise as raiseRule, solutionSockets } from './b17_torres_logic.js';
import { bossBattle } from '../common/bossBattle.js';
import { FIELD_TEXT } from '../zygarde/texts.js';

const FLAG_OF = Object.freeze({ viento: F.towerViento, tormenta: F.towerTormenta, temblor: F.towerTemblor });
const RULE_FLAG = 'b17_torres_regla'; // la regla de las piedras ya se ha contado
const techFlag = (id) => `b17_torre_${id}_tecnicos`;
/** Caja de suministros de cada torre (una vez): se abre al apagarla o, si el P9 llega antes, con la torre abandonada. */
export const crateFlag = (id) => `b17_torre_${id}_caja`;

async function lootCrate(ctx, id) {
  if (ctx.flag(crateFlag(id))) return false;
  ctx.setFlag(crateFlag(id));
  await ctx.giveItem('FULLRESTORE', 1);
  await ctx.giveItem('RARECANDY', 1);
  return true;
}

export const TOWER_TEXT = Object.freeze({
  names: Object.freeze({ viento: 'viento', tormenta: 'tormenta', temblor: 'temblor' }),
  towerOn: Object.freeze({
    viento: 'Una torre de celosía con un rotor que gira sin viento. De la Sima sube un soplo que la torre se traga.',
    tormenta: 'Una torre de celosía coronada por una bobina. Chisporrotea aunque el cielo esté seco.',
    temblor: 'Una torre de celosía con un pistón que golpea la roca. Cada golpe se nota en los pies.',
  }),
  towerOff: 'La torre está apagada. Solo se oye el viento de la Sima.',
  towerIdle: 'Una torre de celosía abandonada. Ya no zumba.',
  // Zygarde habla muy poco (autor, 25-09-2026): la regla del puzle y el aviso son narración neutra.
  rule: [
    'La torre tira de la tierra hacia sí. Los zócalos del espolón vibran.',
    'Con la torre encendida, una piedra alzada solo aguantaría cerca de la roca firme: tres piedras, no más.',
  ],
  loose: 'Esa piedra quedaría demasiado lejos de la roca firme. Con la torre tirando, no aguantaría.',
  standing: 'Esa piedra está bajo tus pies.',
  consoleOn: (active) => `Una consola de Genesis. En la pantalla parpadea: «OPERACIÓN CONVERGENCIA — CAPTACIÓN ACTIVA — ANILLO ${active}/3 — DESTINO: RESONADOR».`,
  consoleAsk: '¿Apagar la torre?',
  consoleOff: 'La pantalla está negra.',
  consoleGuarded: 'Los técnicos no te dejan acercarte a la consola.',
  shutdown: 'La torre chisporrotea, el emisor se apaga y el zumbido muere poco a poco.',
  crate: 'Junto a la consola hay una caja de suministros de Genesis.',
  crateLeft: 'Genesis se ha marchado. Junto a la consola se ha quedado una caja de suministros.',
});

/** Lo que devuelve cada torre al apagarse (efecto local, tono sobrio). */
const RELEASE = Object.freeze({
  viento: { text: 'Del fondo de la Sima sube una corriente de aire que llevaba días sin soplar.' },
  tormenta: { text: 'Un trueno lejano retumba sobre la Sima. Por fin suena como una tormenta de verdad.' },
  temblor: { text: 'La roca deja de vibrar bajo los pies. Muy abajo, algo se asienta.' },
});

const TECH_TEXT = Object.freeze({
  viento: {
    intro: ['¿Cómo ha llegado hasta aquí? La plataforma está aislada.', 'Esta torre alimenta un proyecto de interés general. No podemos permitir interferencias.'],
    after: 'Nos retiramos. Informaremos de que la captación del viento se ha interrumpido.',
  },
  tormenta: {
    intro: ['Lectura de campo estable. Hasta que ha aparecido usted.', 'La bobina no se toca. Si insiste, procederemos.'],
    after: 'Incidencia registrada. El Resonador tendrá que conformarse con dos torres. O con una.',
  },
  temblor: {
    intro: ['Zona de perforación. Por su seguridad, dé la vuelta.', '¿No? Entonces por la nuestra.'],
    after: 'Retirada. El pistón es suyo. Que le aproveche.',
  },
});

/** ¿Drena la torre? (Genesis ocupa el Mirador y no se ha apagado) */
export const draining = (s, id) => occupied(s) && !s.flag(FLAG_OF[id]);

const raisedOf = (s, id) => decodeRaised(s?.var(V.towerStones(id), ''));

/** Casillas del mapa de una torre colocada en (ox, oy). */
const at = (t, p) => ({ x: t.ox + p.x, y: t.oy + p.y });

/**
 * Eventos de una torre. `t` = { id, ox, oy, room } (content/maps/b17/*_layout.js); `tiles` = socketTiles(atlas).
 * `retry` = casilla de reintento del combate (la entrada del espolón).
 */
export function towerEvents(t, tiles) {
  const room = parseRoom(t.room);
  const id = t.id;
  const events = [];
  // Zócalos sobre el vacío
  for (const s of room.sockets) {
    const pos = at(t, s);
    const isRaised = (st) => raisedOf(st, id).includes(s.i);
    events.push({
      id: `torre_${id}_zocalo_${s.i}`, x: pos.x, y: pos.y, name: 'Zócalo',
      pages: [
        {
          tileId: tiles.worn, solid: true, noOver: true, trigger: 'action', glow: { name: 'zygardeSocket' },
          script: (ctx) => raiseSocket(ctx, t, room, s.i, tiles),
        },
        { when: (st) => isRaised(st), through: true, patch: [[pos.x, pos.y, 2, tiles.stone]] },
      ],
    });
  }
  events.push(...towerStructure(t, room));
  events.push(...technicianEvents(t, room));
  // Primera vez en el borde del espolón con la torre encendida: la narración describe la regla.
  const e = at(t, room.entry);
  events.push({
    id: `torre_${id}_regla`, x: e.x, y: e.y, through: true, trigger: 'touch',
    when: (st) => draining(st, id) && !st.flag(RULE_FLAG) && Boolean(st.zygardeAbility('rebuild')),
    script: async (ctx) => {
      ctx.setFlag(RULE_FLAG);
      for (const line of TOWER_TEXT.rule) await ctx.say(line);
    },
  });
  return events;
}

async function raiseSocket(ctx, t, room, i, tiles) {
  if (!ctx.zygarde('rebuild')) { await ctx.say(FIELD_TEXT.rebuildBlocked); return; }
  const p = ctx.player;
  const raised = raisedOf(ctx.state, t.id);
  const r = raiseRule(room, raised, i, p.x - t.ox, p.y - t.oy, { unlimited: !draining(ctx.state, t.id) });
  if (!r.ok) {
    if (r.reason === 'loose') await ctx.say(TOWER_TEXT.loose);
    return;
  }
  if ((await ctx.choice(['Sí', 'No'], { message: FIELD_TEXT.rebuildAsk, cancel: 1 })) !== 0) return;
  const s = room.sockets[i];
  const { rebuildStones } = await import('../../world/zygarde/actions.js');
  await rebuildStones(ctx, [[t.ox + s.x, t.oy + s.y, 2, tiles.stone]]);
  ctx.setVar(V.towerStones(t.id), encodeRaised(r.raised));
  ctx.requestRefresh();
}

// ───────────────────────────── torre y consola ─────────────────────────────

function towerStructure(t, room) {
  const id = t.id;
  const tw = at(t, t.room.tower);
  const cs = at(t, t.room.console);
  const off = (s) => Boolean(s?.flag(FLAG_OF[id]));
  const idle = (s) => Boolean(s?.flag(F.p9)) && !off(s);
  return [
    {
      id: `torre_${id}`, x: tw.x, y: tw.y, name: 'Torre de captación',
      pages: [
        { when: (s) => occupied(s) && !off(s), sprite: OBJ.tower(id), ...frame(0), stepAnime: true, speed: 2, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(TOWER_TEXT.towerOn[id]); } },
        { when: (s) => off(s), sprite: OBJ.tower(id), ...frame(4), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(TOWER_TEXT.towerOff); } },
        { when: (s) => idle(s), sprite: OBJ.tower(id), ...frame(4), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(TOWER_TEXT.towerIdle); } },
      ],
    },
    {
      id: `torre_${id}_consola`, x: cs.x, y: cs.y, name: 'Consola',
      pages: [
        { when: (s) => occupied(s) && !off(s), sprite: OBJ.console, ...frame(0), stepAnime: true, speed: 3, solid: true, trigger: 'action', script: (ctx) => useConsole(ctx, t) },
        {
          when: (s) => off(s) || idle(s), sprite: OBJ.console, ...frame(4), solid: true, trigger: 'action',
          script: async (ctx) => {
            await ctx.say(TOWER_TEXT.consoleOff);
            if (ctx.flag(crateFlag(id))) return;
            await ctx.say(TOWER_TEXT.crateLeft); // P9 sin apagarla: la recompensa no se pierde (CAMPANA §2.6)
            await lootCrate(ctx, id);
          },
        },
      ],
    },
  ];
}

async function useConsole(ctx, t) {
  const id = t.id;
  if (!ctx.flag(techFlag(id))) { await ctx.say(TOWER_TEXT.consoleGuarded); return; }
  await ctx.say(TOWER_TEXT.consoleOn(3 - towersOff(ctx.state)));
  if (!(await ctx.confirm(TOWER_TEXT.consoleAsk))) return;
  await shutdownTower(ctx, t);
}

/** Apaga la torre: chispas, fin del zumbido, efecto local, ruta alzada para siempre y recompensas. */
export async function shutdownTower(ctx, t) {
  const id = t.id;
  const tower = eventById(ctx, `torre_${id}`);
  const cons = eventById(ctx, `torre_${id}_consola`);
  ctx.se('PRSFX- Discharge', { volume: 60 });
  for (const ev of [tower, cons]) if (ev) { ev.direction = 6; ev.pattern = 0; }
  await ctx.flash([...MAGENTA], 12, 150);
  ctx.shake(4, 6, 30);
  await pause(ctx, 40);
  ctx.se('Anim/Paralyze3', { volume: 70 });
  await pause(ctx, 30);
  ctx.setFlag(FLAG_OF[id]);
  ctx.setVar(V.towersOff, towersOff(ctx.state));
  // la ruta de la solución queda alzada (sin la torre, la tierra sostiene las piedras)
  const room = parseRoom(t.room);
  const keep = new Set([...raisedOf(ctx.state, id), ...solutionSockets(room)]);
  ctx.setVar(V.towerStones(id), encodeRaised([...keep]));
  ctx.requestRefresh();
  await ctx.say(TOWER_TEXT.shutdown);
  ctx.se('PRSFX- Gust', { volume: 70 });
  await ctx.say(RELEASE[id].text);
  await ctx.say(TOWER_TEXT.crate);
  await lootCrate(ctx, id);
}

// ───────────────────────────── técnicos ─────────────────────────────

function technicianEvents(t, room) {
  const id = t.id;
  const guarded = (s) => draining(s, id) && !s.flag(techFlag(id));
  const [a, b] = t.room.techs.map((p) => ({ ...at(t, p), dir: p.dir }));
  const events = [
    { id: `torre_${id}_tecnico`, x: a.x, y: a.y, name: SPEAKER.tecnico, pages: [{ when: guarded, sprite: SPRITE.tecnico, dir: a.dir, move: 'still', trigger: 'action', script: (ctx) => techBattle(ctx, t) }] },
    { id: `torre_${id}_tecnica`, x: b.x, y: b.y, name: SPEAKER.tecnica, pages: [{ when: guarded, sprite: SPRITE.tecnica, dir: b.dir, move: 'still', trigger: 'action', script: (ctx) => techBattle(ctx, t) }] },
  ];
  // Al pisar la plataforma (cualquier casilla libre) saltan los técnicos.
  const blocked = new Set([t.room.tower, t.room.console, ...t.room.techs].map((p) => `${p.x},${p.y}`));
  room.cells.forEach((row, y) => row.forEach((c, x) => {
    if (c !== 'P' || blocked.has(`${x},${y}`)) return;
    const pos = at(t, { x, y });
    events.push({ id: `torre_${id}_aviso_${x}_${y}`, x: pos.x, y: pos.y, through: true, trigger: 'touch', when: guarded, script: (ctx) => techBattle(ctx, t) });
  }));
  return events;
}

async function techBattle(ctx, t) {
  const id = t.id;
  const tech = eventById(ctx, `torre_${id}_tecnico`);
  const tecnica = eventById(ctx, `torre_${id}_tecnica`);
  for (const ev of [tech, tecnica]) if (ev) { ctx.turnToPlayer(ev); await ctx.emote(ev, '!'); }
  const T = TECH_TEXT[id];
  await ctx.say(T.intro[0], { speaker: SPEAKER.tecnico });
  await ctx.say(T.intro[1], { speaker: SPEAKER.tecnica });
  const e = at(t, parseRoom(t.room).entry);
  const outcome = await bossBattle(ctx, {
    type: 'trainer', format: 'double', trainers: [`b17_tecnico_${id}`, `b17_tecnica_${id}`], bgm: MUSIC.grunt,
  }, { x: e.x, y: e.y, dir: t.oy + t.room.stand.y > e.y ? 2 : 8 }, {
    loseText: 'Has tenido que retirarte al borde. Tu equipo ha recuperado fuerzas.',
  });
  if (outcome !== 'win') return;
  ctx.setFlag(techFlag(id));
  await ctx.say(T.after, { speaker: SPEAKER.tecnica });
  await ctx.say('Los técnicos se marchan por una escalerilla de servicio que baja por la pared del espolón.');
  await ctx.fade?.('out', 12);
  for (const ev of [tech, tecnica]) if (ev) ctx.erase(ev);
  ctx.requestRefresh();
  await ctx.fade?.('in', 12);
}

/** Casilla de reintento y de llegada de cada torre (entrada del espolón), para pruebas y E2E. */
export function towerEntry(t) {
  return at(t, parseRoom(t.room).entry);
}
