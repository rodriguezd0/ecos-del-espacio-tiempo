// Eventos de la Garganta del Albo (docs/CAMPANA.md B04): tres técnicos del
// Consorcio Meridiano (nv 15–17) con sus balizas de resonancia (se retiran: objeto de historia RESONANCEBEACON),
// Leandro en la esclusa de cabecera, el choque con Gael a la puerta del Pilar («Nadie te ha pedido nada, chaval.» /
// «Por eso lo hago yo.»), la puerta del Pilar (la abre Leandro), el molino abandonado, células C019, C020, C055
// (Trepar) y C069 (Nadar), el remolino del Pozo del Albo (Buceo), charcos del desbordamiento y objetos.
import {
  BEACONS, LEANDRO, CLASH, PILAR_DOOR, MILL, SLUICE, CELL_SPOTS, CLIMB, WHIRLPOOL, FLOOD, SLOPES, rect,
} from '../maps/b04/garganta_albo_layout.js';
import { POZO_ARRIVAL } from '../maps/b04/pozo_albo.js';
import { floodEvent, riverFishingEvent } from './b04_flood.js';
import { F, V, SPEAKER, SPRITE, kid } from './b04_common.js';

const GREEN = [185, 255, 102];
const MAGENTA = [176, 58, 140];
export const BEACON_ITEM = 'RESONANCEBEACON';
const beaconFlag = (i) => `b04_baliza_${i + 1}`;

/** Técnicos del Consorcio (uno por baliza). Genesis aún no dice su nombre en público (CAMPANA §5.1). */
export const TECHS = Object.freeze([
  {
    id: 'tecnico_ribas', trainer: 'ga_tecnico_ribas', name: 'Técnico Ribas', sprite: SPRITE.tecnico,
    intro: 'Estudio de caudales del Consorcio Meridiano. Zona de medición: no se toca el equipo, por favor.',
    after: 'Las balizas solo escuchan el agua. Eso dice el protocolo.',
  },
  {
    id: 'tecnica_noa', trainer: 'ga_tecnica_noa', name: 'Técnica Noa', sprite: SPRITE.tecnica,
    intro: 'Las lecturas de la Garganta son de interés público. Apártate, por favor: estás alterando la señal.',
    after: 'Curioso. Cuando te acercas, la baliza marca el doble.',
  },
  {
    id: 'tecnico_salcedo', trainer: 'ga_tecnico_salcedo', name: 'Técnico Salcedo', sprite: SPRITE.tecnico,
    intro: 'Esa puerta de piedra resuena más que todo el río junto. Queremos saber por qué. ¿Tú no?',
    after: 'El señor de las esclusas nos ha echado dos veces. Es muy… vehemente.',
  },
]);

// ───────────────────────────── Balizas ─────────────────────────────

async function removeBeacon(ctx, i) {
  const tech = TECHS[i];
  if (!ctx.selfSwitch('A', tech.id)) {
    const ev = ctx.world.events.find((e) => e.id === tech.id);
    if (ev) { await ctx.emote(ev, '!'); ctx.face(ev, ctx.player); }
    await ctx.say('¡Eh! Ese equipo es del Consorcio. No se toca.', { speaker: tech.name });
    const outcome = await ctx.battle({ trainer: tech.trainer });
    if (outcome !== 'win') return;
    ctx.setSelfSwitch('A', true, tech.id);
  }
  await ctx.say('Una baliza de tres patas clavada en la roca. Zumba de una forma que se nota en los dientes.');
  if (!(await ctx.confirm('¿Arrancarla?'))) return;
  ctx.se('Battle damage weak');
  await ctx.flash(MAGENTA, 10, 120);
  ctx.setFlag(beaconFlag(i));
  ctx.state.addItem(BEACON_ITEM, 1);
  const n = Math.min(3, ctx.var(V.beacons, 0) + 1);
  ctx.setVar(V.beacons, n);
  ctx.me('key_item_get');
  await ctx.say('Has retirado la baliza de resonancia.');
  if (n < 3) return;
  ctx.setFlag(F.beacons);
  if (onTerrace(ctx.player)) await clashScene(ctx);
}

function beaconEvents() {
  return BEACONS.map((b, i) => ({
    id: b.id, x: b.x, y: b.y,
    pages: [{
      when: (s) => !s.flag(beaconFlag(i)), sprite: SPRITE.beacon, directionFix: true, walkAnime: false, stepAnime: true,
      speed: 2, solid: true, trigger: 'action', script: (ctx) => removeBeacon(ctx, i),
    }],
  }));
}

function techEvents() {
  return TECHS.map((t, i) => ({
    ...t, x: BEACONS[i].tech.x, y: BEACONS[i].tech.y, dir: BEACONS[i].tech.dir, type: 'trainer', sight: 4, eyeBgm: 'EncuentroRocket',
  }));
}

// ───────────────────────────── Leandro y Gael ─────────────────────────────

async function leandroSluice(ctx) {
  const n = ctx.var(V.beacons, 0);
  if (!ctx.var('b04_leandro_esclusa', 0)) {
    // Si ya se conocieron en la Casa de las Esclusas (B03), la recibe como a alguien que vuelve a molestar.
    const first = ctx.flag('b03_leandro_visto') ? '¿Otra vez tú? ¿Ahora me sigues hasta la Garganta?' : '¿Y tú quién eres? …Da igual.';
    await ctx.say(`${first} Vuelve a Caudal, ${kid(ctx.state)}: aquí se trabaja.`, { speaker: SPEAKER.leandro });
    await ctx.say('Esta esclusa la puso mi tatarabuelo. Si el Albo se desmanda, se le aprieta aquí y se le afloja allá. Así se ha hecho siempre.', { speaker: SPEAKER.leandro });
    ctx.setVar('b04_leandro_esclusa', 1);
  }
  await ctx.say(n
    ? '¿Esos cacharros de tres patas? Llevan semanas ahí. Si los quitas tú, allá tú. Yo tengo un río que domar.'
    : 'Y no toques nada. Ni la esclusa ni esos cacharros de tres patas del Consorcio.', { speaker: SPEAKER.leandro });
}

function onTerrace(p) {
  return p.y <= 5 && p.x >= 19 && p.x <= 32;
}

/** Choque de Gael y Leandro a la puerta del Pilar (CAMPANA B04 §3; Gael: «Ayuda»). Leandro abre la puerta. */
export async function clashScene(ctx) {
  if (ctx.flag(F.clash)) return;
  await ctx.say('¡Eh! ¡Espere!', { speaker: SPEAKER.gael });
  await ctx.fade('out', 20);
  const p = ctx.player;
  p.moveTo(CLASH.player.x, CLASH.player.y);
  p.direction = CLASH.player.dir;
  for (const f of ctx.world.followers || []) f.moveTo?.(CLASH.player.x - 1, CLASH.player.y);
  const leandro = ctx.world.spawnEvent({ id: 'leandro_puerta', x: LEANDRO.door.x, y: LEANDRO.door.y, sprite: SPRITE.leandro, dir: 2, through: true });
  const gael = ctx.world.spawnEvent({ id: 'gael_puerta', x: CLASH.gael.x, y: CLASH.gael.y, sprite: SPRITE.gael, dir: CLASH.gael.dir, through: true });
  await ctx.fade('in', 20);
  const LS = { speaker: SPEAKER.leandro };
  const GS = { speaker: SPEAKER.gael };
  await ctx.say('¡Espere! No puede meterse ahí usted solo.', GS);
  await ctx.say('¿Y tú qué sabes de lo que puedo o no puedo hacer?', LS);
  await ctx.say('Sé que el barrio bajo tenía el agua por las rodillas. He sacado a los vecinos con mis Pokémon mientras usted giraba llaves.', GS);
  await ctx.say('Nadie te ha pedido nada, chaval.', LS);
  await ctx.say('Por eso lo hago yo.', GS);
  await ctx.wait(30);
  ctx.face(leandro, p);
  await ctx.say(`Y tú, ${ctx.state.player?.gender === 'F' ? 'la' : 'el'} de las balizas. ¿También vienes a salvarme el río?`, LS);
  await ctx.say('Mi familia lleva trescientos años llevando el Albo a mano. Si ahí dentro hay algo que arreglar, lo arreglo yo.', LS);
  ctx.face(leandro, 'up');
  await ctx.wait(20);
  ctx.se('Door slide');
  await ctx.shake(3, 5, 24);
  await ctx.say('Leandro encaja una gran llave de esclusa en la cerradura de piedra. La puerta cede con un gruñido.');
  ctx.setFlag(F.clash);
  await ctx.move(leandro, ['up'], { through: true });
  ctx.se('Door exit');
  ctx.erase(leandro);
  await ctx.wait(20);
  ctx.face(gael, p);
  ctx.face('player', gael);
  await ctx.say('…No me mires así. Alguien tenía que sacar a la gente.', GS);
  await ctx.say('Entra tú. A mí no me va a escuchar. Yo vuelvo al barrio: el agua sigue subiendo.', GS);
  await ctx.move(gael, ['down', 'right', 'down', 'down', 'down', 'down'], { through: true, speed: 4.5 });
  ctx.erase(gael);
}

function leandroEvents() {
  const atSluice = (s) => !s.flag(F.beacons) && !s.flag(F.clash);
  return [
    {
      id: 'leandro_esclusa', x: LEANDRO.sluice.x, y: LEANDRO.sluice.y,
      pages: [{ when: atSluice, sprite: SPRITE.leandro, dir: LEANDRO.sluice.dir, trigger: 'action', script: leandroSluice }],
    },
    ...CLASH.trigger.map(([x, y]) => ({
      id: `choque_${x}`, x, y, trigger: 'touch',
      when: (s) => s.flag(F.beacons) && !s.flag(F.clash), script: clashScene,
    })),
  ];
}

// ───────────────────────────── Puerta, molino, esclusa ─────────────────────────────

function doorEvents() {
  return [{
    id: 'puerta_pilar', x: PILAR_DOOR.warp.x, y: PILAR_DOOR.warp.y,
    pages: [{
      when: (s) => !s.flag(F.clash), solid: true, trigger: 'touch',
      script: async (ctx) => {
        await ctx.say('Una puerta de piedra bajo el dintel, con una cerradura en forma de rueda de esclusa. Está cerrada.');
      },
    }],
  }];
}

function millEvents() {
  const wheelText = async (ctx) => { await ctx.say('Una rueda de molino medio hundida en el barro de la orilla. No gira desde hace años.'); };
  return [
    {
      id: 'rueda_molino', x: MILL.wheel.x, y: MILL.wheel.y,
      pages: [{ sprite: SPRITE.noria, dir: 8, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: wheelText }],
    },
    ...[[MILL.wheel.x - 1, MILL.wheel.y], [MILL.wheel.x - 1, MILL.wheel.y - 1], [MILL.wheel.x, MILL.wheel.y - 1]].map(([x, y]) => ({
      id: `rueda_molino_${x}_${y}`, x, y, solid: true, trigger: 'action', script: wheelText,
    })),
    {
      id: 'puerta_molino', x: MILL.door.x, y: MILL.door.y, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('La puerta del molino está atrancada con tablones. Dentro solo se oye gotear el agua.'); },
    },
  ];
}

function sluiceEvents() {
  const text = async (ctx) => {
    if (ctx.flag(F.restored)) { await ctx.say('La esclusa de cabecera está abierta de par en par. El agua pasa tranquila.'); return; }
    await ctx.say(ctx.flag(F.clash)
      ? 'La rueda de la esclusa está atrancada. Leandro la ha dejado bien apretada.'
      : 'La rueda de la esclusa de cabecera. Está muy apretada: alguien la ha girado hasta el tope.');
  };
  return [
    {
      id: 'esclusa_compuerta', x: SLUICE.gate.x, y: SLUICE.gate.y,
      pages: [
        { when: (s) => !s.flag(F.restored), sprite: SPRITE.gate, dir: 6, directionFix: true, walkAnime: false, trigger: 'action', script: text },
        { when: (s) => s.flag(F.restored), sprite: SPRITE.gate, dir: 8, directionFix: true, walkAnime: false, stepAnime: true, trigger: 'action', script: text },
      ],
    },
    {
      id: 'esclusa_rueda', x: SLUICE.wheel.x, y: SLUICE.wheel.y,
      pages: [{ sprite: SPRITE.lever, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: text }],
    },
  ];
}

// ───────────────────────────── Llegada, células, objetos, carteles ─────────────────────────────

// Zygarde habla muy poco (autor, 25-09-2026): la llegada ya no lleva comentario del Core.
async function arrivalScene(ctx) {
  ctx.setFlag(F.gargantaArrival);
}

async function afterCell(ctx) {
  await ctx.flash(GREEN, 12, 90);
}

function cellEvents() {
  return Object.entries(CELL_SPOTS).map(([cell, { x, y }]) => ({ id: cell, type: 'zygardeCell', x, y, cell, onFound: afterCell }));
}

function fieldEvents() {
  return [
    { id: 'pared_trepar', type: 'climbWall', x: CLIMB.up.x, y: CLIMB.up.y, to: CLIMB.up.to, h: 3, sprite: 'asset:objects/barreras.png', dir: 6, directionFix: true, stepAnime: true },
    { id: 'pared_bajar', type: 'climbWall', x: CLIMB.down.x, y: CLIMB.down.y, to: CLIMB.down.to, down: true, glow: false },
    { id: 'remolino_pozo', type: 'diveSpot', x: WHIRLPOOL.x, y: WHIRLPOOL.y, to: 'pozo_albo', tx: POZO_ARRIVAL.x, ty: POZO_ARRIVAL.y, dir: POZO_ARRIVAL.dir },
    ...['g1', 'repisa'].flatMap((k) => slopeCells(k).map(([x, y]) => ({ id: `grava_${k}_${x}_${y}`, type: 'gravelSlope', x, y }))),
  ];
}

function slopeCells(k) { return rect(...SLOPES[k]); }

function itemEvents() {
  return [
    { id: 'agua_fresca_garganta', type: 'item', x: 9, y: 29, item: 'FRESHWATER' },
    { id: 'superball_garganta', type: 'item', x: 17, y: 8, item: 'GREATBALL' },
    { id: 'pocion_oculta_garganta', type: 'item', x: 26, y: 33, item: 'POTION', hidden: true },
    { id: 'revivir_repisa', type: 'item', x: 9, y: 15, item: 'REVIVE' },
    { id: 'perla_cornisa', type: 'item', x: 14, y: 1, item: 'BIGPEARL' },
    { id: 'eter_molino', type: 'item', x: 22, y: 14, item: 'ETHER', hidden: true },
  ];
}

function signEvents() {
  return [
    { id: 'cartel_garganta', type: 'sign', x: 21, y: 38, text: 'GARGANTA DEL ALBO\nEl río nace más arriba, en el Monte del Portal.' },
    {
      id: 'montanera_nieves', x: 28, y: 35, sprite: 'anil:excursionista_f', dir: 4, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.restored)
          ? 'El río vuelve a sonar como siempre. Hasta los Psyduck han vuelto a la orilla.'
          : 'El Albo crece y mengua como si respirara. Y esos del Consorcio no paran de medir.', { speaker: 'Montañera' });
      },
    },
  ];
}

/** Todos los eventos del mapa garganta_albo. */
export function gargantaEvents() {
  return [
    { id: 'llegada_garganta', x: 17, y: 38, pages: [{ when: (s) => !s.flag(F.gargantaArrival), trigger: 'auto', script: arrivalScene }] },
    ...techEvents(), ...beaconEvents(), ...leandroEvents(), ...doorEvents(),
    ...millEvents(), ...sluiceEvents(), ...cellEvents(), ...fieldEvents(), ...itemEvents(), ...signEvents(),
    floodEvent('desborde_garganta', FLOOD), riverFishingEvent('rio_garganta', 12, 38),
  ];
}
