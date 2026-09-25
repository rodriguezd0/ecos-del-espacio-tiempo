// Campana de dragado de Genesis (docs/CAMPANA.md §5.4 «P7 (B14) · Extracción · Dragado de Antea (reliquias y planos de
// la corona) · Base de su Resonador»). Dos técnicos vigilan la cámara; la jefa de dragado, Adela (investigadora,
// cortés y precisa), combate (combate de guion sin pérdida) y, vencida, aparta el cabezal de la draga de la Puerta de
// Antea (flag b14_draga_apartada): los planos de la corona ya han subido. Tras el P7 la campana está abandonada.
// Módulo puro salvo los guiones.
import { CAMPANA_INT } from '../maps/b14/layout.js';
import { F, SPEAKER, SPRITE, OBJ, lines, zygardeSays, byGender, onlyWhen } from './b14_common.js';
import { bossBattle } from '../common/bossBattle.js';
import { crateEvents } from '../maps/b14/paint.js';

const C = CAMPANA_INT;
const active = (s) => Boolean(s) && !s.flag(F.restored);

export const CAMPANA_TEXT = Object.freeze({
  jefaIntro: (s) => [
    `Una visita. ${byGender(s, 'Un entrenador', 'Una entrenadora')} con un Zygarde en forma de serpiente, si no me fallan los datos.`,
    'Soy Adela, responsable de esta campana. Estamos catalogando restos de Antea. Nada que usted vaya a echar de menos.',
    'Si viene por el cabezal de la puerta: lo apartaré cuando termine la jornada. O antes, si me convence.',
  ],
  jefaAgain: ['¿Otra vez? Muy bien. Repitamos la medición.'],
  jefaLost: 'Resultado inconcluso. Vuelva cuando quiera: la campana no se mueve.',
  jefaWon: [
    'Correcto. No tiene sentido retenerle. Apartaremos el cabezal.',
    'De todos modos, lo que buscábamos ya ha subido esta mañana: los planos de la corona del rey de Antea. Una corona que imitaba la voz de una flauta.',
    'Al doctor le interesa mucho saber cómo lo hacía.',
    'Una cosa más. Hace tres días vimos a un chico bajar a las ruinas, siguiendo nuestras luces de trabajo. La marea del eco se lo llevó.',
    'Nosotros no podemos entrar ahí. Usted, por lo visto, sí.',
  ],
  jefaCore: 'Los planos de una corona que quería obedecer al Eje. No me gusta que los tengan ellos.',
  moved: 'Adela teclea en la consola. Afuera, algo pesado se desplaza sobre el lecho con un zumbido.',
  jefaAfter: ['El cabezal ya no le estorba. Suerte ahí dentro: los registros de sonar de esas ruinas no tienen ningún sentido.'],
  console: 'La consola de la draga. En la pantalla, el sonar dibuja la muralla de Antea… y algo que late bajo ella.',
  consoleAfter: 'La consola parpadea: «CABEZAL EN POSICIÓN DE ESPERA».',
  note: [
    'Un parte sujeto con cinta a la consola:',
    '«Orden de retirada. La draga no responde: el casco amaneció cubierto de coral y óxido, como si llevara siglos en el fondo. Abandonar el equipo.»',
  ],
  crates: ['Cajas de reliquias con la etiqueta «ANTEA — Catalogado». Las del fondo ya están vacías.'],
});

async function jefaTalk(ctx) {
  const sp = SPEAKER.jefa;
  if (ctx.flag(F.jefaBeaten)) { await lines(ctx, sp, CAMPANA_TEXT.jefaAfter); return; }
  const first = !ctx.flag('b14_jefa_hablada');
  ctx.setFlag('b14_jefa_hablada');
  await lines(ctx, sp, first ? CAMPANA_TEXT.jefaIntro(ctx.state) : CAMPANA_TEXT.jefaAgain);
  const outcome = await bossBattle(ctx, { trainer: 'b14_jefa_adela' }, null, { loseText: CAMPANA_TEXT.jefaLost, speaker: sp });
  if (outcome !== 'win') return;
  ctx.setFlag(F.jefaBeaten);
  await lines(ctx, sp, CAMPANA_TEXT.jefaWon);
  ctx.se('PRSFX- Metal Sound', { volume: 70 });
  ctx.shake(2, 4, 30);
  await ctx.say(CAMPANA_TEXT.moved);
  ctx.setFlag(F.dredgeAside);
  await zygardeSays(ctx, CAMPANA_TEXT.jefaCore);
}

export function campanaEvents() {
  return [
    {
      id: 'jefa_adela', x: C.jefa.x, y: C.jefa.y, name: SPEAKER.jefa,
      pages: [{ when: active, sprite: SPRITE.jefa, dir: C.jefa.dir, move: 'still', trigger: 'action', script: jefaTalk }],
    },
    onlyWhen({
      id: 'tecnico_rufino', type: 'trainer', trainer: 'b14_tecnico_rufino', name: 'Técnico Rufino', sprite: SPRITE.tecnico,
      x: 3, y: 6, dir: 6, sight: 4,
      intro: 'Alto. Esta campana es zona de trabajo de Genesis. No se admiten visitas sin autorización.',
      after: 'La jefa está al fondo, en la consola. No le gusta que la interrumpan.',
    }, active),
    onlyWhen({
      id: 'tecnica_eulalia', type: 'trainer', trainer: 'b14_tecnica_eulalia', name: 'Técnica Eulalia', sprite: SPRITE.tecnica,
      x: 13, y: 8, dir: 4, sight: 4,
      intro: 'Identifíquese. …¿No? Entonces, procedimiento estándar.',
      after: 'Llevamos tres semanas sacando piedras con glifos. Yo solo veo piedras.',
    }, active),
    {
      id: 'consola_draga', x: C.console.x, y: C.console.y, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => {
        if (ctx.flag(F.restored)) { ctx.setFlag(F.bellAbandoned); await lines(ctx, null, CAMPANA_TEXT.note); return; }
        await ctx.say(ctx.flag(F.dredgeAside) ? CAMPANA_TEXT.consoleAfter : CAMPANA_TEXT.console);
      },
    },
    ...crateEvents('caja_campana', [[3, 9], [4, 9, true], [11, 5]], CAMPANA_TEXT.crates),
  ];
}

export { OBJ };
