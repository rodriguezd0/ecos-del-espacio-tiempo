// Salas 3 y 4 de las Ruinas de Antea (docs/CAMPANA.md B14): «plantar un helecho en la era primigenia hace crecer una
// raíz por la que se trepa en Antea» (salas 3 y 4) y, en la sala 4, «cerrar una compuerta seca una sala del
// presente» (el aliviadero de Antea deja sin corriente la boca de la Fosa). La Bramaluna Alfa patrulla la era
// primigenia de ambas salas (b14_bramaluna.js). Módulo puro salvo los guiones.
import { ROOMS, ROOM3, ROOM4 } from '../maps/b14/layout.js';
import { F, SPRITE, OBJ, lines, zygardeSays } from './b14_common.js';
import { ventEvents, echoCitizen, itemEvents, outflowCurrent, springEvent } from './b14_antea_common.js';
import { caracolaEvents } from './b14_caracolas.js';
import { bramalunaPatrolEvents } from './b14_bramaluna.js';
import { bigFernEvents, smallFernEvents } from '../maps/b14/paint.js';
import { cellEvent } from './b01_cells.js';

/** Salas con helecho: flags del brote y del helecho plantado, casillas de la tierra, el brote y la raíz. */
export const FERN_ROOMS = Object.freeze({
  3: Object.freeze({ sprout: F.sprout3, fern: F.fern3, R: ROOM3 }),
  4: Object.freeze({ sprout: F.sprout4, fern: F.fern4, R: ROOM4 }),
});

export const SALA34_TEXT = Object.freeze({
  soil: 'Tierra húmeda y blanda al pie del risco. Aquí agarraría cualquier cosa que se plantara.',
  soilAsk: '¿Plantar el brote de helecho?',
  plant: 'Hundes las raíces del brote en la tierra húmeda y la aprietas con las manos.',
  plantCore: 'Crecerá. Mucho. Durante más tiempo del que puedes imaginar.',
  planted: 'El brote que plantaste. Parece que ya ha echado raíz.',
  sprout: 'Entre los helechos gigantes asoma un brote joven, con su raíz entera.',
  sproutTake: 'Arrancas con cuidado el brote de helecho, con su raíz.',
  sproutHave: 'Llevas el brote de helecho. Hay que plantarlo en tierra blanda.',
  wall: 'Un muro alto y liso. No hay nada a lo que agarrarse.',
  rootAlive: 'Una raíz gruesa como un tronco trepa por el muro. Por ella se puede subir.',
  rootPetrified: 'Una raíz petrificada sube por el muro y se parte a media altura. En el eco estaba entera.',
  rootCore: 'La raíz del helecho que plantaste. Ha tenido siglos para crecer.',
  lever: 'Una palanca de bronce con una inscripción: «ALIVIADERO». Abre o cierra el paso del mar hacia la Fosa.',
  leverAsk: '¿Bajar la palanca?',
  leverDone: 'La palanca baja con un chasquido. Abajo, el rumor del agua que corría hacia la Fosa se apaga.',
  leverCore: 'El mar ya no entra en la Fosa. En el presente, su boca quedará en calma.',
  leverClosed: 'La palanca está bajada. El aliviadero, cerrado.',
  fosaCurrent: 'De la boca de la Fosa sale una corriente que te arrastra hacia atrás.',
  fosaCore: 'El mar entra y sale de la Fosa por algún conducto. En el eco del templo lo controlaban.',
  fosaGate: 'La Puerta de la Fosa: bronce macizo, sellado con plomo. En esta época nadie baja ahí.',
  pit: 'Una sima inundada, oscura y fría. Del fondo sube un rumor, como una respiración.',
  pitCore: 'Ahí abajo está su nido. Y el núcleo. Lo siento.',
});

// ───────────────────────────── helecho y raíz ─────────────────────────────

function soilEvent(room) {
  const { sprout, fern, R } = FERN_ROOMS[room];
  const s = R.soil;
  return {
    id: `tierra_s${room}`, x: s.x, y: s.y, name: 'Tierra húmeda',
    pages: [
      {
        sprite: OBJ.fern, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action',
        script: async (ctx) => {
          await ctx.say(SALA34_TEXT.soil);
          if (!ctx.flag(sprout)) return;
          if ((await ctx.choice(['Sí', 'No'], { message: SALA34_TEXT.soilAsk, cancel: 1 })) !== 0) return;
          ctx.se('Water berry plant', { volume: 90 });
          await ctx.say(SALA34_TEXT.plant);
          ctx.setFlag(fern);
          ctx.setFlag(sprout, false);
          ctx.requestRefresh();
          await zygardeSays(ctx, SALA34_TEXT.plantCore);
        },
      },
      {
        when: (st) => st.flag(fern), sprite: OBJ.fern, dir: 6, directionFix: true, walkAnime: false, stepAnime: true, speed: 1,
        solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(SALA34_TEXT.planted); },
      },
    ],
  };
}

function sproutEvent(room) {
  const { sprout, fern, R } = FERN_ROOMS[room];
  const p = R.sprout;
  return {
    id: `brote_s${room}`, x: p.x, y: p.y, name: 'Brote de helecho',
    pages: [{
      when: (st) => !st.flag(sprout) && !st.flag(fern), sprite: OBJ.fern, dir: 2, directionFix: true, walkAnime: false,
      stepAnime: true, speed: 2, solid: true, trigger: 'action',
      script: async (ctx) => {
        await ctx.say(SALA34_TEXT.sprout);
        ctx.se('Water berry plant', { volume: 70 });
        ctx.setFlag(sprout);
        ctx.requestRefresh();
        await ctx.say(SALA34_TEXT.sproutTake);
      },
    }],
  };
}

/** Raíz en Antea: sin helecho, muro liso; con helecho, se trepa (subida y bajada). */
function rootEvents(room) {
  const { fern, R } = FERN_ROOMS[room];
  const r = R.root;
  const grown = (st) => Boolean(st?.flag(fern));
  return [
    {
      id: `raiz_s${room}`, x: r.up.x, y: r.up.y, name: 'Raíz',
      pages: [
        { when: (st) => !grown(st), solid: true, noOver: true, trigger: 'action', script: async (ctx) => { await ctx.say(SALA34_TEXT.wall); } },
      ],
    },
    {
      // La raíz trepable (misma casilla, página propia del tipo climbWall).
      id: `raiz_trepar_s${room}`, type: 'climbWall', x: r.up.x, y: r.up.y, to: [r.top.x, r.top.y], h: 3,
      when: grown, sprite: OBJ.root, dir: 2, directionFix: true, walkAnime: false, glow: false,
      askText: '¿Trepar por la raíz?',
    },
    { id: `raiz_bajar_s${room}`, type: 'climbWall', x: r.down.x, y: r.down.y, to: [r.from.x, r.from.y], down: true, glow: false, when: grown },
    {
      id: `raiz_aviso_s${room}`, x: r.from.x, y: r.from.y,
      pages: [{
        when: (st) => grown(st) && !st.flag(`b14_raiz_vista_${room}`), through: true, trigger: 'touch', lock: false,
        script: async (ctx) => { ctx.setFlag(`b14_raiz_vista_${room}`); await ctx.say(SALA34_TEXT.rootAlive); await zygardeSays(ctx, SALA34_TEXT.rootCore); },
      }],
    },
  ];
}

/** Raíz petrificada en el presente (no sirve para subir). */
function petrifiedRoot(room) {
  const { fern, R } = FERN_ROOMS[room];
  return {
    id: `raiz_petrificada_s${room}`, x: R.root.up.x, y: R.root.up.y,
    pages: [{
      when: (st) => st.flag(fern), sprite: OBJ.root, dir: 4, directionFix: true, walkAnime: false, solid: true, noOver: true,
      trigger: 'action', script: async (ctx) => { await ctx.say(SALA34_TEXT.rootPetrified); },
    }],
  };
}

// ───────────────────────────── sala 3 ─────────────────────────────

const ECHO3 = Object.freeze({
  keeper: ['Para subir al barrio alto hay que dar la vuelta por la escalera del templo, y hoy la tienen cerrada.', 'Ojalá esa muralla tuviera algo a lo que agarrarse.'],
  old: ['Mi abuelo contaba que antes de la ciudad esto era un valle de helechos, tan altos como casas.', 'Decía que sus raíces se agarraban a cualquier roca.'],
  gossip: ['Dicen que el rey ha pedido que los Pilares le obedezcan. ¡Como si fueran soldados!'],
});

export function sala3Events(era) {
  if (era === 'presente') {
    return [
      ...caracolaEvents(3, 'presente'),
      petrifiedRoot(3),
      cellEvent({ id: 'cell_ecos_2', x: ROOM3.cell.x, y: ROOM3.cell.y }),
      ...ventEvents('respiradero_s3', ROOM3.vents),
      ...itemEvents([
        { id: 'objeto_s3_buceo', x: 27, y: 21, item: 'DIVEBALL', count: 2 },
        { id: 'objeto_s3_estrella', x: 4, y: 7, item: 'STARPIECE', hidden: true },
      ]),
    ];
  }
  if (era === 'antea') {
    return [
      ...caracolaEvents(3, 'antea'),
      ...rootEvents(3),
      echoCitizen('eco_guarda_s3', 20, 16, SPRITE.echoOld, 2, ECHO3.keeper, { name: 'Guarda del templo' }),
      echoCitizen('eco_anciano_s3', 8, 20, SPRITE.echoFisher, 6, ECHO3.old, { name: 'Anciano' }),
      echoCitizen('eco_vecina_s3', 11, 7, SPRITE.echoWoman, 2, ECHO3.gossip, { name: 'Vecina' }),
      ...itemEvents([{ id: 'objeto_s3a_hueso', x: 27, y: 22, item: 'RAREBONE' }]),
    ];
  }
  return [
    ...caracolaEvents(3, 'primigenia'),
    soilEvent(3),
    sproutEvent(3),
    ...bramalunaPatrolEvents('antea_3_primigenia'),
    ...bigFernEvents('helecho_s3', [
      [25, 17, 2], [28, 18, 4], [24, 20, 6], [28, 21, 2], [26, 22, 8], [23, 16, 4], [4, 13, 6], [11, 13, 2],
      [20, 13, 8], [4, 21, 4], [13, 23, 6], [8, 17, 2], [21, 22, 4], [27, 14, 6],
      [5, 6, 2], [9, 7, 4], [13, 8, 6], [27, 8, 2],
    ]),
    ...smallFernEvents('mata_s3', [[10, 16], [18, 20], [22, 18], [6, 15], [14, 20], [19, 7], [7, 5]]),
    ...itemEvents([
      { id: 'objeto_s3x_seta', x: 3, y: 18, item: 'BIGMUSHROOM' },
      { id: 'objeto_s3x_escama', x: 28, y: 5, item: 'DRAGONSCALE' },
    ]),
  ];
}

// ───────────────────────────── sala 4 ─────────────────────────────

const spillwayOpen = (s) => !s.flag(F.spillway);

function leverEvent() {
  const l = ROOM4.lever;
  return {
    id: 'palanca_aliviadero', x: l.x, y: l.y, name: 'Aliviadero',
    pages: [
      {
        sprite: OBJ.wheel, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action',
        script: async (ctx) => {
          await ctx.say(SALA34_TEXT.lever);
          if ((await ctx.choice(['Sí', 'No'], { message: SALA34_TEXT.leverAsk, cancel: 1 })) !== 0) return;
          ctx.se('PRSFX- Heavy Slam1', { volume: 80 });
          ctx.shake(4, 6, 36);
          ctx.setFlag(F.spillway);
          ctx.requestRefresh();
          await ctx.say(SALA34_TEXT.leverDone);
          await zygardeSays(ctx, SALA34_TEXT.leverCore);
        },
      },
      { when: (s) => s.flag(F.spillway), sprite: OBJ.wheel, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(SALA34_TEXT.leverClosed); } },
    ],
  };
}

const ECHO4 = Object.freeze({
  priest: ['El aliviadero lleva el agua del mar hasta la Fosa. Si se cierra, la escalera queda seca…', '…pero nadie baja ahí. Nadie. Lo que duerme abajo no es asunto nuestro.'],
  acolyte: ['El balcón del aliviadero solo tiene escalera por dentro del templo. Y la llave la guarda el sacerdote.'],
});

export function sala4Events(era) {
  const sp = ROOM4.springEvent;
  if (era === 'presente') {
    return [
      ...caracolaEvents(4, 'presente'),
      petrifiedRoot(4),
      springEvent('manantial_s4', sp.x, sp.y, era),
      ...ROOM4.currents.map((c, i) => outflowCurrent(`corriente_fosa_${i}`, c.x, c.y, {
        dir: 2, length: c.length, open: spillwayOpen, seenFlag: F.spillwaySeen, firstText: SALA34_TEXT.fosaCurrent, coreText: SALA34_TEXT.fosaCore,
      })),
      { id: 'bolsa_boca_fosa', x: 17, y: 6, when: (s) => s.flag(F.spillway), type: 'diveVent', kind: 'bolsa' },
      cellEvent({ id: 'cell_ecos_3', x: ROOM4.cell.x, y: ROOM4.cell.y }),
      ...ventEvents('respiradero_s4', ROOM4.vents),
      ...itemEvents([
        { id: 'objeto_s4_total', x: 26, y: 6, item: 'FULLRESTORE' },
        { id: 'objeto_s4_perla', x: 5, y: 22, item: 'BIGPEARL', hidden: true },
      ]),
    ];
  }
  if (era === 'antea') {
    return [
      ...caracolaEvents(4, 'antea'),
      ...rootEvents(4),
      leverEvent(),
      springEvent('manantial_s4', sp.x, sp.y, era),
      {
        id: 'puerta_fosa', x: 16, y: 4, name: 'Puerta de la Fosa', sprite: OBJ.gate, dir: 2, directionFix: true, walkAnime: false,
        solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(SALA34_TEXT.fosaGate); },
      },
      echoCitizen('eco_sacerdote_s4', 22, 15, SPRITE.echoOld, 4, ECHO4.priest, { name: 'Sacerdote' }),
      echoCitizen('eco_acolito_s4', 9, 16, SPRITE.echoKid, 6, ECHO4.acolyte, { name: 'Acólito' }),
      ...itemEvents([{ id: 'objeto_s4a_revivir', x: 8, y: 5, item: 'MAXREVIVE' }]),
    ];
  }
  return [
    ...caracolaEvents(4, 'primigenia'),
    soilEvent(4),
    sproutEvent(4),
    springEvent('manantial_s4', sp.x, sp.y, era),
    ...bramalunaPatrolEvents('antea_4_primigenia'),
    {
      id: 'sima_primigenia', x: 16, y: 8, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(SALA34_TEXT.pit); await zygardeSays(ctx, SALA34_TEXT.pitCore); },
    },
    ...bigFernEvents('helecho_s4', [
      [24, 12, 2], [27, 12, 4], [28, 15, 6], [23, 14, 8], [3, 14, 2], [10, 13, 4], [21, 21, 6], [4, 20, 2],
      [26, 22, 4], [9, 22, 8], [8, 18, 6], [25, 18, 2], [24, 9, 4], [26, 7, 6], [13, 12, 2], [18, 12, 8],
    ]),
    ...smallFernEvents('mata_s4', [[14, 13], [19, 20], [6, 16], [24, 20], [11, 18], [27, 10]]),
    ...itemEvents([{ id: 'objeto_s4x_seta', x: 28, y: 21, item: 'TINYMUSHROOM', count: 2 }]),
  ];
}

export { lines, ROOMS };
