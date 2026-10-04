// Archivos del Proyecto Laguna y mantenimiento de Talasa: se abren después del epílogo.
import { F, OBJ, SPEAKER, postgame, bossBattle, restCount } from './b22e_common.js';
import { ROOMS as R } from '../maps/b22e/rooms_layout.js';

export async function backRoomDoor(ctx) {
  if (!postgame(ctx.state) || !ctx.state.itemCount('ALERCEKEY')) {
    await ctx.say('Una puerta al fondo del laboratorio. Está cerrada con llave.');
    return;
  }
  if (!await ctx.confirm('¿Abrir el cuarto del fondo con la llave de Alerce?')) return;
  ctx.setFlag(F.cuartoAbierto);
  ctx.se?.('door_exit');
  await ctx.warp(R.archive.id, R.archive.entry.x, R.archive.entry.y, 8, { fade: true });
}

const ARCHIVE = Object.freeze({
  foto: [
    'Una foto de la Laguna Clara. El agua llega hasta las casas del caserío. Dos personas trabajan junto a una baliza de tres patas.',
    'El rostro de una de ellas está rascado. El borde conserva una fecha de hace dieciséis años.',
  ],
  calibracion: [
    'Proyecto Laguna. Hoja de calibración. Las mediciones están corregidas a mano; cada corrección lleva las mismas iniciales.',
    '«La respuesta persiste después de cortar la inducción. No repetir con el nivel actual de agua». Debajo, el nombre del responsable está tachado.',
  ],
  fechas: [
    'Un parte registra que el agua empezó a bajar la mañana siguiente. Siete fechas seguidas; la última medición termina en cero.',
    'En la carpeta de resultados solo queda una etiqueta: «No publicados». El sobre de la declaración sigue vacío.',
  ],
  cuaderno: [
    'Al cuaderno le faltan páginas. En los lomos quedan trozos de papel arrancado.',
    'Las últimas hojas contienen observaciones del bosque de Villa Alba. La primera tiene una fecha apenas posterior a la última medición de la Laguna Clara.',
  ],
});

export async function readArchive(ctx, id) {
  const texts = ARCHIVE[id];
  if (!postgame(ctx.state) || !texts) return;
  for (const text of texts) await ctx.say(text);
  ctx.setFlag(`b22e_archivo_${id}`);
  if (Object.keys(ARCHIVE).every((key) => ctx.flag(`b22e_archivo_${key}`))) ctx.setFlag(F.cuartoVisto);
}

export function withAlerceBackRoom(events) {
  return events.map((event) => {
    if (event.id.startsWith('puerta_fondo_')) return { ...event, script: backRoomDoor };
    if (event.id !== 'alerce') return event;
    return { ...event, script: async (ctx) => {
      if (postgame(ctx.state) && ctx.flag(F.cuartoVisto)) {
        await ctx.say(ctx.flag(F.alerceCuarto) ? 'Las fechas están en los cuadernos.' : 'No voy a cambiar ninguna fecha.', { speaker: SPEAKER.alerce });
        ctx.setFlag(F.alerceCuarto);
      } else await event.script(ctx);
    } };
  });
}

export function archiveEvents() {
  return Object.entries(R.archive.papers).map(([id, at]) => ({
    id: `archivo_${id}`, ...at, sprite: OBJ.notebook,
    dir: { foto: 4, calibracion: 6, fechas: 8, cuaderno: 2 }[id],
    directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action',
    script: (ctx) => readArchive(ctx, id),
  }));
}

export async function talasaHatch(ctx) {
  if (!postgame(ctx.state)) { await ctx.say('Una trampilla de mantenimiento sellada.'); return; }
  await ctx.say('El cierre de mantenimiento está abierto. Una escalera baja a los antiguos cultivos de Talasa.');
  if (!await ctx.confirm('¿Bajar a las ruinas?')) return;
  ctx.setFlag(F.talasaTrampilla); ctx.setFlag(F.talasaRuinas);
  await ctx.warp(R.talasa.id, R.talasa.entry.x, R.talasa.entry.y, 8, { fade: true });
}

export function talasaRuinsEvents() {
  return [{ id: 'b22e_trampilla_talasa', ...R.hatch,
    pages: [{ when: postgame, sprite: 'asset:objects/b22d_trampilla.png', dir: 2,
      directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action', script: talasaHatch }],
  }];
}

async function dittoBattle(ctx) {
  if (ctx.flag(F.talasaDitto)) return;
  const rest = Number(ctx.var('b22e_talasa_ditto_descanso', -1));
  if (rest >= restCount(ctx.state)) { await ctx.say('Ditto se esconde entre los depósitos. Volverá cuando descanses.'); return; }
  ctx.cry?.('DITTO');
  const result = await bossBattle(ctx, { type: 'wild', noCoop: true, wild: { species: 'DITTO', level: 65 }, battleback: 'Laboratorio' }, null,
    { loseText: 'Ditto se recoge junto al tanque. Puedes volver a intentarlo.' });
  if (result === 'caught') ctx.setFlag(F.talasaDitto);
  else if (result === 'win') { ctx.setVar('b22e_talasa_ditto_descanso', restCount(ctx.state)); await ctx.say('Ditto se aleja hacia los depósitos. Volverá cuando descanses.'); }
  ctx.requestRefresh?.();
}

export function talasaRoomEvents() {
  return [
    { id: 'ditto_talasa', ...R.talasa.ditto, pages: [{
      when: (s) => postgame(s) && !s.flag(F.talasaDitto) && Number(s.var('b22e_talasa_ditto_descanso', -1)) < restCount(s),
      sprite: 'follower:DITTO:0:0', dir: 2, stepAnime: true, solid: true, trigger: 'action', script: dittoBattle,
    }] },
    { id: 'alakazamita_talasa', ...R.talasa.stone, sprite: 'Object ball', dir: 2, solid: true, trigger: 'action',
      script: async (ctx) => {
        if (ctx.flag(F.talasaAlakazamita)) { await ctx.say('El cajón está vacío.'); return; }
        await ctx.giveItem('ALAKAZITE', 1); ctx.setFlag(F.talasaAlakazamita);
      } },
    { id: 'cultivos_talasa', ...R.talasa.tank, sprite: OBJ.tank, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('El tanque perdió la presión hace meses. Algunas colonias blandas sobreviven en el agua de los depósitos; toman la forma de cualquier cosa que se acerca.'); } },
    { id: 'registro_talasa', ...R.talasa.notes, sprite: OBJ.notebook, dir: 8, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Cultivos celulares. El último registro termina con un sello de evacuación. Nadie volvió a retirar las muestras.'); } },
  ];
}

export function roomGuard(kind) {
  return async (ctx) => {
    if (postgame(ctx.state) && (kind !== 'archive' || ctx.state.itemCount('ALERCEKEY'))) return;
    const out = kind === 'archive' ? R.archive.return : R.talasa.return;
    await ctx.warp(out.map, out.x, out.y, out.dir, { fade: true });
  };
}
