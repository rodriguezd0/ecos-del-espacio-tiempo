// B22: instalación extranjera abandonada; tres prototipos fallidos y Mewtwo original.
import { F, V, SPRITE, OBJ, postgame, legendPresent } from './b22d_common.js';
import { CIERZO_SEEN, cierzoEligible, PROTOTYPES } from './b22d_logic.js';
import { prototypeRequest, legendBattle } from './b22d_battle.js';
import { bossBattle } from '../common/bossBattle.js';
import { HOOKS, CIERZO as C } from '../maps/b22d/layout.js';

export const MEWTWO_SPEC = Object.freeze({ species: 'MEWTWO', level: 80, moves: ['PSYSTRIKE', 'AURASPHERE', 'ICEBEAM', 'RECOVER'] });
const protoFlag = (room) => `b22d_prototipo_${room}_vencido`;
export const prototypesComplete = (s) => PROTOTYPES.every((p) => s.flag(protoFlag(p.room)));

export async function prototypeBattle(ctx, room) {
  const proto = PROTOTYPES.find((p) => p.room === room);
  if (!proto) throw new Error(`B22d: prototipo desconocido ${room}`);
  if (ctx.flag(protoFlag(room))) { await ctx.say('La sala de pruebas permanece vacía.'); return; }
  const profile = { ataque: 'ataque extremo', defensa: 'defensa extrema', tipo: 'tipo cambiante' }[proto.profile];
  await ctx.say(`${proto.label}: ${profile}. No es el original. Este prototipo fallido no puede capturarse.`);
  const result = await bossBattle(ctx, prototypeRequest(proto.spec, 'Los prototipos fallidos no pueden capturarse.'), C.lab.battles[room],
    { loseText: 'El protocolo se detiene. Tu equipo se ha recuperado; puedes repetir la prueba.' });
  if (result !== 'win') return;
  ctx.setFlag(protoFlag(room));
  ctx.setVar(V.protoBeaten, PROTOTYPES.filter((p) => ctx.flag(protoFlag(p.room))).length);
  ctx.requestRefresh?.();
  await ctx.say('Prueba finalizada. Se ha liberado uno de los tres seguros del ascensor.');
}

async function openCierzoGate(ctx) {
  const n = Object.values(ctx.state.data.dex.seen).filter(Boolean).length;
  await ctx.say(`INSTALACIÓN CIERZO\nProyecto extranjero abandonado. Acceso: registro de ${CIERZO_SEEN} especies vistas. Tu registro: ${n}.`);
  if (!cierzoEligible(ctx.state)) return false;
  ctx.setFlag(F.cierzoOpen);
  ctx.requestRefresh?.();
  return true;
}

/** La verja exterior es la de B15; la puerta del edificio está dos filas más arriba. */
export function withCierzoGate(events) {
  return events.map((e) => e.id !== 'verja_cierzo' ? e : { ...e, pages: [
    { solid: true, trigger: 'action', script: e.script },
    { when: postgame, solid: true, trigger: 'action', script: openCierzoGate },
    { when: (s) => postgame(s) && s.flag(F.cierzoOpen), through: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('La verja está abierta. La puerta del edificio queda al norte.'); } },
  ] });
}

export function marCierzoEvents() {
  const d = HOOKS.mar.door;
  return [{ id: 'b22d_cierzo_verja', ...d, pages: [{ when: postgame, through: true, trigger: 'action',
    script: async (ctx) => {
      if (!(await openCierzoGate(ctx))) return;
      await ctx.warp(C.hall.id, C.hall.entry.x, C.hall.entry.y, C.hall.entry.dir);
    } }] }];
}

export function cierzoHallEvents() {
  const text = 'Cierzo fue un proyecto extranjero. Genesis no construyó esta instalación. Tres prototipos fallidos quedaron en las salas de pruebas: ataque extremo, defensa extrema y tipo cambiante. El original permanece debajo.';
  return [
    ...Object.entries(C.hall.doors).filter(([room]) => room !== 'lift').map(([room, a]) => ({ id: `b22d_cierzo_puerta_${room}`, ...a,
      trigger: 'action', through: true, sprite: OBJ.lab, dir: 4,
      script: async (ctx) => { const p = C.lab.entries[room]; await ctx.warp(C.lab.id, p.x, p.y, p.dir); } })),
    { id: 'b22d_cierzo_ascensor', ...C.hall.doors.lift, sprite: OBJ.lab, dir: 2, trigger: 'action', through: true,
      script: async (ctx) => {
        if (!prototypesComplete(ctx.state)) { await ctx.say('Tres seguros bloquean el ascensor. Hay que finalizar las tres pruebas distintas. Los prototipos no se pueden capturar.'); return; }
        const a = C.core.entry; await ctx.warp(C.core.id, a.x, a.y, a.dir);
      } },
    ...C.hall.terminals.map((a, i) => ({ id: `b22d_cierzo_informe_${i}`, ...a, sprite: OBJ.lab, dir: 8, trigger: 'action', solid: true,
      script: async (ctx) => { await ctx.say(text); } })),
  ];
}

export function cierzoLabEvents() {
  return [
    ...PROTOTYPES.map((p) => ({ id: `b22d_prototipo_${p.room}`, ...C.lab.protos[p.room], pages: [{
      when: (s) => postgame(s) && !s.flag(protoFlag(p.room)), sprite: SPRITE.mewtwo, solid: true, trigger: 'action', script: (ctx) => prototypeBattle(ctx, p.room),
    }] })),
    ...Object.entries(C.lab.logs).map(([room, a]) => ({ id: `b22d_cierzo_log_${room}`, ...a, sprite: OBJ.lab, dir: 8, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(`Informe ${room.toUpperCase()}: el prototipo falló. El original no pertenece a este programa de pruebas. Capturar los prototipos está prohibido.`); } })),
    ...C.lab.items.map((it) => ({ ...it, type: 'item' })),
  ];
}

export function cierzoCoreEvents() {
  return [
    { id: 'mewtwo', ...C.core.mewtwo, pages: [{ when: (s) => prototypesComplete(s) && legendPresent(s, 'mewtwo'),
      sprite: SPRITE.mewtwo, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Los informes lo llaman «el original». Mewtwo abre los ojos por voluntad propia.');
        ctx.cry('MEWTWO'); await legendBattle(ctx, 'mewtwo', MEWTWO_SPEC, { retry: C.core.battle, bgm: 'CombateMewtwo', battleback: 'Laboratorio' }); } }] },
    ...C.core.logs.map((a, i) => ({ id: `b22d_cierzo_original_${i}`, ...a, sprite: OBJ.lab, dir: 8, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Proyecto extranjero cancelado. Instalación evacuada. El original sigue vivo; ninguno de los prototipos lo reemplazó.'); } })),
  ];
}
