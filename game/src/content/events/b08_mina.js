// Mina Galena (docs/CAMPANA.md B08, paso 1): Fermín baja a ver qué hace el Consorcio en su mina; dos técnicos le
// cierran el paso del pozo lateral y, al fondo, Ulises Garrido espera junto a una perforadora parada: «El pozo no
// llega a nada: la cámara rechaza las perforadoras porque el peso crece». Combate (Gurdurr 31, Rhyhorn 31,
// Houndoom 32; reintento sin pérdida). Después Fermín cuenta que al Pilar se entra por el Cerro Plomo, cruzando las
// Dunas, y va a esperar a la verja de la familia. Montacargas a la galería honda: abierto tras el P4.
import { F, SPEAKER, SPRITE, OBJ, MUSIC, lines, zygardeSays, examine, findEvent } from './b08_common.js';
import { b08CellEvents } from './b08_cells.js';
import { bossBattle } from '../common/bossBattle.js';
import { MINA, HONDA } from '../maps/b08/layout.js';

const RUBBLE_TILE = 3576; // cascotes de Cueva1 (stamp `escombros`, ver docs/stamps.md)

export const MINA_TEXT = Object.freeze({
  sign: 'MINA GALENA\nFamilia Galena, desde hace cinco generaciones.\n«Casco, lámpara y cabeza.»',
  shaftSign: 'ZONA DE ESTUDIO DEL TERRENO\nConsorcio Meridiano de Estudios Geofísicos. Prohibido el paso.',
  liftBlocked: 'El pozo del montacargas está atascado de cascotes desde los temblores. Por aquí no baja nadie.',
  liftOpen: 'El montacargas vuelve a funcionar. Abajo, la galería honda.',
  liftAsk: '¿Bajar a la galería honda?',
  drill: 'Una perforadora del Consorcio, parada. La broca está doblada como si hubiera empujado una montaña.',
  drillAfter: 'La perforadora está desmontada a medias. Nadie ha vuelto a por ella.',
  crystals: 'Una veta de cristal que brilla con la luz de la lámpara. Los mineros la dejan intacta: «da suerte».',
});

// ───────────────────────────── Fermín en la galería ─────────────────────────────

async function ferminGallery(ctx) {
  if (!ctx.flag(F.techs)) {
    await lines(ctx, SPEAKER.fermin, [
      'Esos dos dicen que tienen un permiso del ayuntamiento para «estudiar el terreno». En MI mina.',
      'A mí no me dejan pasar. A lo mejor a ti sí te hacen caso. O a tus Pokémon.',
    ]);
    return;
  }
  await ctx.say('Tú delante. El pozo lateral baja hasta el fondo, al este.', { speaker: SPEAKER.fermin });
}

function ferminGalleryEvent() {
  const f = MINA.ferminTunnel;
  return {
    id: 'fermin_galeria', x: f.x, y: f.y, name: SPEAKER.fermin,
    pages: [{ when: (s) => Boolean(s) && s.flag(F.argument) && !s.flag(F.garrido), sprite: SPRITE.fermin, dir: f.dir, trigger: 'action', script: ferminGallery }],
  };
}

// ───────────────────────────── Técnicos del pozo lateral ─────────────────────────────

const TECHS = Object.freeze([
  {
    id: 'tecnico_pozo', trainer: 'b08_tecnico_pozo', sprite: SPRITE.tecnico, speaker: 'Técnico Íñigo',
    intro: ['Alto. Zona de estudio del terreno.', 'Tenemos un permiso municipal. Usted no tiene casco homologado.'],
    leave: 'Registraré la incidencia. Con todos sus detalles.',
  },
  {
    id: 'tecnica_pozo', trainer: 'b08_tecnica_pozo', sprite: SPRITE.tecnica, speaker: 'Técnica Mireia',
    intro: ['El director está al fondo. No quiere visitas.', 'Aunque, pensándolo bien… de ti sí querrá los datos.'],
    leave: 'Paso libre. De momento.',
  },
]);

async function techBattle(ctx, t) {
  const ev = ctx.event;
  ctx.bgm(MUSIC.grunt);
  await ctx.emote(ev, '!');
  ctx.turnToPlayer(ev);
  for (const text of t.intro) await ctx.say(text, { speaker: t.speaker });
  const retry = { x: MINA.ferminTunnel.x - 1, y: MINA.ferminTunnel.y, dir: 6 };
  const outcome = await bossBattle(ctx, { trainer: t.trainer }, retry, { speaker: t.speaker, loseText: 'Zona restringida. Vuelva cuando tenga permiso.' });
  if (outcome !== 'win') return;
  await ctx.say(t.leave, { speaker: t.speaker });
  // Primero se aparta (andando hacia el pozo) y después cambia de página: si no, el cambio de página cancela la ruta
  // y el técnico desaparece de golpe.
  await ctx.move(ev, ['right', 'right', 'right', 'right'], { through: true, speed: 4.5 });
  ctx.setSelfSwitch('A', true);
  if (TECHS.every((x) => x.id === ev.id || ctx.state.selfSwitch('mina_galena', x.id, 'A'))) ctx.setFlag(F.techs);
}

function techEvents() {
  return TECHS.map((t, i) => {
    const pos = MINA.techs[i];
    return {
      id: t.id, x: pos.x, y: pos.y, name: t.speaker,
      pages: [
        { when: (s, ev) => !ev.selfSwitch('A') && !s.flag(F.garrido), sprite: t.sprite, dir: pos.dir, trigger: 'eventTouch', sight: 3, script: (ctx) => techBattle(ctx, t) },
        { when: (s, ev) => ev.selfSwitch('A') || s.flag(F.garrido), through: true },
      ],
    };
  });
}

// ───────────────────────────── Garrido ─────────────────────────────

async function garridoScene(ctx) {
  const g = findEvent(ctx, 'garrido_mina');
  if (g) g.turnToward(ctx.player);
  ctx.bgm('CombateComandante');
  if (!ctx.flag(F.garridoMet)) {
    await lines(ctx, SPEAKER.garrido, [
      'Ulises Garrido. Operaciones.',
      '¿Ves esa perforadora? Lleva tres días parada.',
      'Cada metro que bajamos, la roca pesa más. Las brocas se doblan como si empujaran una montaña entera.',
      'El Pilar está ahí, a treinta metros. Y no nos deja llegar. Lo he visto en muchas obras: hay suelos que no quieren.',
      'Da igual. No hace falta llegar. Tú lo vas a abrir, y cuando lo abras… nosotros solo tenemos que escuchar.',
      'Pero antes quiero saber qué traes dentro de esas Poké Balls.',
    ]);
    ctx.setFlag(F.garridoMet);
  } else {
    await ctx.say('¿Otra vez? Bien. Mide dos veces y corta una.', { speaker: SPEAKER.garrido });
  }
  const outcome = await bossBattle(ctx, { trainer: 'b08_garrido' }, MINA.garridoRetry, {
    speaker: SPEAKER.garrido, loseText: 'Descansa. El pozo no se va a mover de aquí.',
  });
  if (outcome !== 'win') return;
  await lines(ctx, SPEAKER.garrido, ['¡Recoged! Aquí ya no hay nada que hacer.']);
  await ferminConfronts(ctx);
}

async function ferminConfronts(ctx) {
  const g = findEvent(ctx, 'garrido_mina');
  ctx.setFlag(F.garrido);
  ctx.requestRefresh();
  await ctx.wait(2);
  const who = findEvent(ctx, 'fermin_pozo');
  if (who) {
    who.moveTo(MINA.ferminShaft.x, MINA.ferminShaft.y + 4);
    await ctx.move(who, ['up', 'up', 'up', 'up', 'turn_right'], { through: true, speed: 4.5 });
  }
  await ctx.say('¡Fuera de mi mina!', { speaker: SPEAKER.fermin });
  if (g && who) g.turnToward(who);
  await lines(ctx, SPEAKER.garrido, [
    'Ya nos íbamos, señor Galena. Su roca no nos quiere.',
    'La oferta sigue en la oficina. Hasta que el suelo deje de moverse.',
  ]);
  if (g) {
    await ctx.fade('out', 16);
    ctx.erase(g);
    await ctx.fade('in', 16);
  }
  if (who) who.turnToward(ctx.player);
  await lines(ctx, SPEAKER.fermin, [
    'Ese pozo lo abrieron sin pedir permiso a nadie. Iban derechos al Cerro.',
    'Mi padre decía que al Pilar no se entra por abajo. Se entra por arriba: por el Cerro Plomo, cruzando las Dunas de Ceniza. Por la puerta de la familia.',
    'La verja tiene candado, y la llave la llevo yo. Te espero allí.',
    'Ah, y otra cosa. En las Dunas, al sureste, donde la ceniza es más honda, los mineros de mi padre veían una lucecita verde. Nadie se atrevió a ir a por ella.',
  ]);
  if (who) {
    await ctx.move(who, ['down', 'down', 'down', 'down', 'down'], { through: true, speed: 4.5 });
    ctx.erase(who);
  }
  ctx.setFlag(F.ferminCerro);
  await zygardeSays(ctx, 'Arriba. El Pilar está arriba, bajo ese cerro.');
}

function shaftEvents() {
  const { x: dx, y: dy } = MINA.drill;
  const g = MINA.garrido;
  const waiting = (s) => Boolean(s) && !s.flag(F.garrido);
  return [
    {
      id: 'perforadora', x: dx, y: dy, name: 'Perforadora',
      pages: [
        { sprite: OBJ.drill, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MINA_TEXT.drill); } },
        { when: (s) => Boolean(s?.flag(F.garrido)), sprite: OBJ.drill, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MINA_TEXT.drillAfter); } },
      ],
    },
    // La perforadora ocupa 3×3 casillas: bloqueos invisibles alrededor de su pie.
    ...[[dx - 1, dy], [dx + 1, dy], [dx - 1, dy - 1], [dx, dy - 1], [dx + 1, dy - 1]].map(([x, y]) => ({ id: `perforadora_${x}_${y}`, x, y, solid: true, noOver: true })),
    {
      id: 'garrido_mina', x: g.x, y: g.y, name: SPEAKER.garrido,
      pages: [{ when: waiting, sprite: SPRITE.garrido, dir: g.dir, trigger: 'action', script: garridoScene }],
    },
    ...MINA.garridoStrip.map(([x, y]) => ({
      id: `pozo_franja_${x}`, x, y,
      pages: [{ when: waiting, through: true, trigger: 'touch', script: garridoScene }],
    })),
    // Fermín aparece en el pozo al acabar el combate (su página se activa con b08_garrido y se borra al irse).
    {
      id: 'fermin_pozo', x: MINA.ferminShaft.x, y: MINA.ferminShaft.y, name: SPEAKER.fermin,
      pages: [{ when: (s) => Boolean(s) && s.flag(F.garrido) && !s.flag(F.ferminCerro), sprite: SPRITE.fermin, dir: 6 }],
    },
  ];
}

// ───────────────────────────── Montacargas y ambiente ─────────────────────────────

function liftEvent() {
  const { x, y } = MINA.lift;
  return {
    id: 'montacargas', x, y, name: 'Montacargas',
    pages: [
      { tileId: RUBBLE_TILE, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MINA_TEXT.liftBlocked); } },
      {
        when: (s) => Boolean(s?.flag(F.restored)), through: true, trigger: 'touch',
        script: async (ctx) => {
          await ctx.say(MINA_TEXT.liftOpen);
          if (!(await ctx.confirm(MINA_TEXT.liftAsk))) { await ctx.move('player', ['down'], { through: false }); return; }
          ctx.se('Door enter');
          await ctx.warp('mina_galena_honda', HONDA.arrive.x, HONDA.arrive.y, HONDA.arrive.dir);
        },
      },
    ],
  };
}

function minerEvents() {
  return [
    {
      id: 'minero_vestibulo', x: 16, y: 29, name: SPEAKER.minero, sprite: SPRITE.minero, dir: 6, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.restored)) { await ctx.say('Desde que el suelo se quedó quieto, hasta las vigas crujen menos. Y hemos vuelto a bajar al fondo.', { speaker: SPEAKER.minero }); return; }
        await ctx.say('Cada noche el techo baja un dedo. Hemos puesto vigas nuevas dos veces este mes.', { speaker: SPEAKER.minero });
        await ctx.say('Y encima el Consorcio ha abierto un pozo por su cuenta en la galería del este. Con permiso del ayuntamiento, dicen.', { speaker: SPEAKER.minero });
      },
    },
    {
      id: 'minera_vestibulo', x: 27, y: 30, name: SPEAKER.minera, sprite: SPRITE.minera, dir: 4, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.coop)) { await ctx.say('¿Te has enterado? Ahora la mina es de todos. Cooperativa, lo llaman. Suena bien, ¿eh?', { speaker: SPEAKER.minera }); return; }
        await ctx.say('Sol dice que si vendemos, al menos cobraremos este año. Fermín dice que antes muerto.', { speaker: SPEAKER.minera });
        await ctx.say('Yo solo quiero que el suelo deje de moverse.', { speaker: SPEAKER.minera });
      },
    },
    {
      id: 'minero_montacargas', x: 24, y: 8, name: SPEAKER.minero, sprite: SPRITE.minero, dir: 4, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.restored)) { await ctx.say('Hemos sacado todos los cascotes. ¡Y abajo han aparecido fósiles! Fermín se ha llevado los mejores.', { speaker: SPEAKER.minero }); return; }
        await ctx.say('La galería honda está ahí abajo. Con los temblores, el pozo se llenó de cascotes.', { speaker: SPEAKER.minero });
        await ctx.say('Mientras el suelo se mueva, nadie los va a sacar.', { speaker: SPEAKER.minero });
      },
    },
  ];
}

export async function minaOnEnter(ctx) {
  if (ctx.flag(F.mineSeen)) return;
  ctx.setFlag(F.mineSeen);
  await ctx.wait(8);
  await zygardeSays(ctx, 'La roca de aquí abajo pesa distinto. Como si algo tirase de ella hacia el centro.');
}

export function minaEvents() {
  const v = MINA.rooms.veta;
  return [
    ferminGalleryEvent(), ...techEvents(), ...shaftEvents(), liftEvent(), ...minerEvents(),
    ...b08CellEvents('mina_galena'),
    examine('cartel_mina', 25, 27, MINA_TEXT.sign, { solid: true }),
    examine('cartel_consorcio', 33, 16, MINA_TEXT.shaftSign, { solid: true }),
    examine('veta_cristal_0', v.x0 + 2, v.y0 + 1, MINA_TEXT.crystals, { solid: true }),
    {
      id: 'minero_rufo', type: 'trainer', trainer: 'b08_minero_veta', name: 'Minero Rufo', sprite: 'anil:minero',
      x: 8, y: 20, dir: 8, sight: 3,
      intro: '¡Eh! Esta veta la cuido yo. Si quieres verla de cerca, primero gánatela.',
      after: 'En la veta brilla a veces una lucecita verde. Yo no la toco: da suerte.',
    },
    { id: 'objeto_mina_1', type: 'item', x: 30, y: 28, item: 'SUPERPOTION', hidden: true },
    { id: 'objeto_mina_2', type: 'item', x: 17, y: 21, item: 'REVIVE' },
    { id: 'objeto_mina_3', type: 'item', x: 10, y: 17, item: 'NUGGET' },
    { id: 'objeto_mina_4', type: 'item', x: 39, y: 21, item: 'HYPERPOTION' },
    { id: 'objeto_mina_5', type: 'item', x: 33, y: 5, item: 'FULLHEAL' },
    { id: 'objeto_mina_6', type: 'item', x: 19, y: 9, item: 'ETHER', hidden: true },
  ];
}
