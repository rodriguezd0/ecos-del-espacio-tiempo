// Refugio de los observadores de los Lagos del Alma (B16): la cabaña del Observatorio Boreal para las noches de aurora.
// Literas para descansar (curan: world/rest.js) antes de cruzar al santuario, la radio con la que la observadora oirá a
// los Guardianes y cuadernos de aurora. Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { restSpotEvent } from '../../services/inn.js';
import { REFUGIO } from './lagos_layout.js';
import { F, examine } from '../../events/b16_common.js';

/** Llegada desde los Lagos (felpudo). */
export const REFUGIO_ENTRY = Object.freeze({ x: 6, y: 9 });

export const REFUGIO_TEXT = Object.freeze({
  radio: (s) => (s.flag(F.radio)
    ? 'La radio del Observatorio. Sigue abierta en la frecuencia de los Guardianes: de vez en cuando se oye a alguien pedir calma.'
    : 'Una radio de onda corta del Observatorio Boreal. Una etiqueta dice: «Frecuencia de los Guardianes: solo emergencias».'),
  cuadernos: 'Cuadernos de observación: fechas, colores y duración de cada aurora. Las últimas páginas dicen «color imposible» tres veces.',
  estufa: 'Una estufa de hierro. Todavía está caliente.',
  mapa: 'Un mapa del norte clavado en la pared: Villa Boreal, la Gruta Escarcha, los tres lagos. Alguien ha rodeado el islote en rojo.',
});

export default {
  id: 'lagos_refugio',
  name: 'Lagos del Alma',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'VinculoSupremo',
  battleback: 'indoor',
  showLocation: false,
  start: { x: REFUGIO_ENTRY.x, y: REFUGIO_ENTRY.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', REFUGIO_ENTRY.x - 2, REFUGIO_ENTRY.y);
    b.stamp('cama_individual', 1, 3);
    b.stamp('cama_individual', 1, 6);
    b.stamp('estanteria_naranja', 5, 2);
    b.stamp('fotocopiadora', 8, 3); // el aparato de radio del Observatorio (evento `radio_refugio`)
    b.stamp('mesa_comedor', 6, 5);
    b.stamp('taza', 7, 6);
    b.stamp('reloj_pared', 4, 2);
    b.stamp('cuadro', 11, 2);
    b.stamp('planta', 11, 7);
    b.rect(null, 4, 8, 5, 1, 'alfombra_verde');
  },

  warps: exitWarps(REFUGIO_ENTRY.x, REFUGIO_ENTRY.y, { map: 'lagos_alma', x: REFUGIO.door.x, y: REFUGIO.door.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(REFUGIO_ENTRY.x, REFUGIO_ENTRY.y + 1),
    { ...restSpotEvent('litera_1', 3, 4, { kind: 'bed', message: '¿Quieres descansar en la litera?' }) },
    { ...restSpotEvent('litera_2', 3, 7, { kind: 'bed', message: '¿Quieres descansar en la litera?' }) },
    examine('radio_refugio', 9, 4, REFUGIO_TEXT.radio),
    examine('cuadernos_refugio', 5, 3, REFUGIO_TEXT.cuadernos),
    examine('mapa_refugio', 11, 3, REFUGIO_TEXT.mapa),
    {
      id: 'observador_refugio', x: 10, y: 7, name: 'Observador', sprite: 'anil:cientifico', dir: 4, move: 'look',
      script: async (ctx) => {
        const said = ctx.flag(F.milestone)
          ? ['Esta noche el cielo tiene un color que no está en ningún cuaderno.', 'Lo he apuntado igual. Alguien tendrá que acordarse.']
          : ['Si vas a cruzar al islote, descansa antes en una litera. Ahí dentro no hay estufa.', 'Y no te fíes del hielo del puente: el tramo del islote ya no existe.'];
        for (const t of said) await ctx.say(t, { speaker: 'Observador' });
      },
    },
  ],
};
