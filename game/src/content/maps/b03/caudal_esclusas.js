// Casa de las Esclusas (Ciudad Caudal; CAMPANA §1.3 y B03/B04): la casa de los Alcántara, Maestres de Esclusas.
// Leandro (X06: 38, orgullo) no acepta ayuda: «su casa lleva trescientos años llevando el río a mano» (CAMPANA
// B04). En B03 solo se le conoce en su casa; su prueba y su combate son de B04 (que puede añadir páginas aquí).
// Tileset 4 (Interior1). Salida delante de la puerta del Paseo del Albo.
import { BUILDINGS } from './caudal_layout.js';
import { exitWarps, exitArrowEvents, examineEvent } from '../../services/interior.js';
import { F, SPEAKER, SPRITE, say } from '../../events/b03_common.js';

const DOOR_X = 7;
const MAT_Y = 10;
const door = BUILDINGS.esclusas.door;
const L = SPEAKER.leandro;

const RECORDS = 'Libros de registro encuadernados en piel: «Nivel del Albo, año…». Cientos de años de mediciones con la misma letra cuidadosa, generación tras generación.';
const MAP = 'Un plano enorme de los canales de Caudal, lleno de flechas y anotaciones a lápiz. Las más recientes están tachadas y vueltas a escribir.';
const KEYS = 'Un tablero con decenas de llaves de hierro, cada una con una chapa: «Compuerta del Mercado», «Toma de los Molinos», «Esclusa mayor»…';

async function leandroTalk(ctx) {
  if (ctx.flag(F.p2)) {
    await say(ctx, L, 'El río vuelve a su cauce. Mis llaves vuelven a obedecer.');
    await say(ctx, L, 'No me hagas repetir lo que dije en la plaza. Una vez es suficiente.');
    return;
  }
  if (!ctx.flag('b03_leandro_visto')) {
    ctx.setFlag('b03_leandro_visto');
    await say(ctx, L, '¿Quién te ha dejado entrar? Ah, la puerta. Con tanto ir y venir a las esclusas ya ni la cierro.');
    await say(ctx, L, 'Soy Leandro Alcántara, Maestre de Esclusas. Mi casa lleva trescientos años llevando el río a mano.');
    await say(ctx, L, 'Si vienes a decirme que el Albo está loco, ya lo sé. Si vienes a ofrecerme ayuda, la puerta sigue ahí.');
    return;
  }
  await say(ctx, L, isDay(ctx.state)
    ? 'Por la mañana abro la Toma para que no rebose el Mercado. Por la noche la cierro para que no se seque. Y cada día hace falta más.'
    : 'De noche el río se va como si alguien tirara de él desde la Garganta. Pero yo sé llevarlo. Siempre lo hemos sabido.');
}

function isDay(s) {
  return typeof s?.isDay === 'function' ? s.isDay() : true;
}

export default {
  id: 'caudal_esclusas',
  name: 'Ciudad Caudal',
  tileset: 4,
  width: 15,
  height: 12,
  outdoor: false,
  bgm: 'CiudadCeleste',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_casa');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    b.stamp('estanteria_roja', 1, 3);
    b.stamp('estanteria_roja', 3, 3);
    b.stamp('ventana_cortinas', 6, 2);
    b.stamp('reloj_pared', 9, 2);
    b.stamp('vitrina', 10, 3);
    b.stamp('estanteria_naranja', 12, 3);
    b.stamp('estanteria_naranja', 13, 3);
    b.rect(null, 4, 6, 7, 3, 'alfombra_azul');
    b.stamp('mesa_comedor', 5, 6);
    b.stamp('planta', 1, 8);
    b.stamp('planta_alta', 13, 8);
    b.stamp('papelera', 12, 7);
  },

  warps: exitWarps(DOOR_X, MAT_Y, { map: 'ciudad_caudal', x: door.x, y: door.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(DOOR_X, MAT_Y + 1),
    {
      id: 'leandro', x: 7, y: 5, sprite: SPRITE.leandro, dir: 2, move: 'look', trigger: 'action', script: leandroTalk,
      // B04: desde que el jugador llega a la Garganta (Leandro está en la esclusa de cabecera y luego en el Pilar)
      // hasta las gracias en la plaza, está fuera de casa.
      when: (s) => !(s?.flag('b04_garganta_llegada') && !s.flag('b04_gracias')),
    },
    // Sobre los muebles (fila 4, no pisable): se leen desde el suelo de delante sin tapar el paso.
    examineEvent('registros_0', 1, 4, RECORDS), examineEvent('registros_1', 2, 4, RECORDS),
    examineEvent('registros_2', 3, 4, RECORDS), examineEvent('registros_3', 4, 4, RECORDS),
    examineEvent('plano_0', 6, 7, MAP), examineEvent('plano_1', 7, 7, MAP), examineEvent('plano_2', 8, 7, MAP),
    examineEvent('llaves_0', 10, 4, KEYS), examineEvent('llaves_1', 11, 4, KEYS),
    examineEvent('libros_n', 12, 4, 'Manuales de hidráulica, de antes y de ahora. Los de ahora tienen menos anotaciones.'),
    {
      id: 'aprendiz', x: 11, y: 8, sprite: 'anil:operario', dir: 4, move: 'look', trigger: 'action',
      script: async (ctx) => {
        if (ctx.flag('b04_garganta_llegada') && !ctx.flag('b04_gracias')) {
          await say(ctx, 'Aprendiz', ctx.flag('b04_choque')
            ? 'El Maestre se ha llevado la llave grande, la de la Garganta. Nunca le había visto descolgarla.'
            : 'El Maestre está en la esclusa de cabecera, en la Garganta. Dice que desde allí se le aprieta al río.');
          return;
        }
        await say(ctx, 'Aprendiz', 'El Maestre no duerme. Se pasa la noche girando tornos y la mañana escribiendo en esos libros.');
        await say(ctx, 'Aprendiz', 'Yo le digo que pida ayuda a la ciudad. Me mira como si le hubiera dicho que vendiera la casa.');
      },
    },
  ],
};
