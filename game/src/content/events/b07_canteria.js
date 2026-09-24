// La Cantería Solano en la Ruta 6 (docs/CAMPANA.md B07; TABLILLAS T04 «La cantera cerrada»): la voladura del
// Consorcio y Bea Solano (segunda pista), los técnicos que guardan la boca de las galerías, Ulises Garrido (sin
// combate: se retira cuando los canteros lo señalan en público), Alerce en persona con la regla de los estratos,
// y, tras el rescate, la fiesta de los canteros, su denuncia pública y la piedra activadora que Bea monta en un
// anillo (la escena del Mega Aro está en b07_megaring.js). Coordenadas en maps/b07/layout.js (CANTERIA).
import {
  F, V, SPEAKER, SPRITE, OBJ, MUSIC, when, say, lines, zygardeSays, byGender, kid, bossBattle, eventById, examine,
} from './b07_common.js';
import { resetRoomIfUnsolved, roomStart } from './b07_galerias.js';
import { stageRoute } from './b07_path.js';
import { RUTA6, CANTERIA } from '../maps/b07/layout.js';

const C = CANTERIA;
const B = { speaker: SPEAKER.bea };
const A = { speaker: SPEAKER.alerce };
const GA = { speaker: SPEAKER.garrido };
const Q = { speaker: SPEAKER.quino };

export const CANTERIA_TEXT = Object.freeze({
  blast: '¡BUUUM! Una explosión sacude el cañón. De los bancales de la cantera sube una columna de polvo.',
  charge: 'Una caja del Consorcio con una luz magenta que parpadea. Salen cables hacia el frente de la cantera. Mejor no tocarla.',
  truck: 'Un camión del Consorcio Meridiano. Dentro hay cajas de instrumental y rollos de cable.',
  truckNotice: 'En el camión hay pegado un cartel escrito a mano:\n«EL CONSORCIO MERIDIANO VOLÓ LA CANTERÍA SOLANO CON QUINO SOLANO Y SU CUADRILLA DENTRO. QUE LO SEPA TODO EL CAÑÓN.»\nDebajo, las firmas de todos los canteros.',
  board: 'Tablón de la Cantería Solano. Turnos de los canteros, un pedido de sillares para Estrato y una nota: «Quino: arregla la escala del pozo».',
  boardNotice: 'En el tablón han clavado el mismo aviso que en el camión del Consorcio, con las firmas de los canteros. Alguien ha añadido: «Y una copia para la plaza de Estrato».',
  corte: 'El corte de la cantera. Arriba, la arenisca ocre; debajo, la caliza gris; luego, la arcilla roja; al fondo, la pizarra negra.',
  blocks: 'Sillares recién cortados, apilados para llevarlos a Estrato.',
  mineBlocked: 'Los técnicos del Consorcio no dejan que nadie se acerque a la boca de la galería.',
  beaWait: '¡Espera! Ahí dentro no sabemos qué aguanta y qué no. Deja que alguien que sepa lo mire primero.',
});

// ───────────────────────────── Actores de escena ─────────────────────────────

/** Crea un personaje temporal (se borra al acabar la escena o al salir del mapa). */
function actor(ctx, id, x, y, sprite, dir = 2) {
  return ctx.world.spawnEvent({ id: `__${id}`, x, y, sprite, dir, through: true, name: id });
}

/** Lleva a `ev` hasta (x, y) caminando por el suelo (b07_path.js: sin cruzar caras de roca, barreras ni gente). */
async function walk(ctx, ev, x, y, speed = 4) {
  if (!ev || (ev.x === x && ev.y === y)) return;
  await ctx.move(ev, stageRoute(ctx, ev, x, y), { through: true, speed });
}

/** Coloca a un personaje fijo en su casilla de siempre (con la pantalla en negro, al acabar una escena). */
function place(ev, x, y, dir) {
  if (!ev || String(ev.id).startsWith('__')) return;
  ev.moveTo(x, y);
  if (dir) ev.direction = dir;
}

function remove(ctx, ...evs) {
  for (const ev of evs) if (ev && String(ev.id).startsWith('__')) ctx.world.removeEvent?.(ev);
  ctx.requestRefresh();
}

/**
 * Personaje fijo del mapa si está visible (para moverlo en la escena y devolverlo a su sitio) o, si su página no
 * está activa todavía, uno temporal en su casilla.
 */
function castOr(ctx, id, x, y, sprite, dir) {
  const ev = eventById(ctx, id);
  if (ev && ev.page && !ev.erased) return ev;
  return actor(ctx, id, x, y, sprite, dir);
}

/** Devuelve a un personaje fijo a su casilla de partida (los temporales se borran). */
async function sendBack(ctx, ev, x, y, dir) {
  if (!ev) return;
  if (String(ev.id).startsWith('__')) { remove(ctx, ev); return; }
  await walk(ctx, ev, x, y, 4);
  ctx.face(ev, dir);
}

// ───────────────────────────── 1 · La voladura y Bea ─────────────────────────────

async function arrivalScene(ctx) {
  if (ctx.flag(F.llegada)) return;
  const p = ctx.player;
  ctx.face('player', 'down');
  await ctx.wait(10);
  await ctx.camera.pan(21, 28, 30);
  ctx.se('Anim/Explosion1');
  ctx.shake(9, 9, 40);
  const dust = [[21, 27], [23, 25], [19, 29], [25, 28]].map(([x, y], k) => actor(ctx, `polvo_${k}`, x, y, SPRITE.smoke));
  for (const d of dust) { d.stepAnime = true; d.directionFix = true; d.walkAnime = false; d.alwaysOnTop = true; }
  await ctx.flash([255, 250, 230], 14, 200);
  await ctx.say(CANTERIA_TEXT.blast);
  await ctx.camera.reset(30);
  await zygardeSays(ctx, 'La piedra se ha quejado. Debajo hay alguien.');
  remove(ctx, ...dust);
  const bea = actor(ctx, 'bea', C.forgeFront.x, C.forgeFront.y, SPRITE.bea, 2);
  await walk(ctx, bea, p.x, p.y + 1, 4.5);
  bea.turnToward(p);
  ctx.face('player', bea);
  await lines(ctx, SPEAKER.bea, [
    '¡Eh, tú! ¡No te quedes ahí plantado, que pueden volar otra!',
    '…Perdona. Soy Bea, Bea Solano. La herrería de la cantería es mía.',
    'Esta mañana los del Consorcio han vuelto a volar el frente de arriba. Se ha venido abajo media galería.',
    'Mi hermano Quino estaba dentro, con su cuadrilla de Timburr. Los oigo picar la roca, pero no llego hasta ellos.',
    'Y el derrumbe ha tapado también el camino de Estrato. Nadie baja ni sube.',
  ]);
  if (!ctx.story.clueStatus('T04')) await ctx.story.openClue('T04', { direct: true, silent: true });
  await ctx.story.advanceClue('T04', 2);
  await zygardeSays(ctx, 'Entre capas de piedra. Como decía el Pilar.');
  await lines(ctx, SPEAKER.bea, [
    'Los del Consorcio están delante de la galería, con su camión. Dicen que la zona es suya, que tienen «permiso de estudio».',
    `A mí no me dejan ni acercarme. Pero a lo mejor a ti… Ten cuidado, ${kid(ctx.state)}.`,
  ]);
  await walk(ctx, bea, C.bea.x, C.bea.y, 4);
  remove(ctx, bea);
  ctx.setFlag(F.llegada);
}

// ───────────────────────────── 2 · Técnicos, Garrido y los canteros ─────────────────────────────

const techIds = ['b07_tecnico_voladura', 'b07_tecnica_voladura'];

async function techScene(ctx) {
  if (ctx.flag(F.tecnicos)) return;
  const s = C.techSpot;
  await ctx.movePlayerTo(s.x, s.y, { through: false, speed: 3 });
  ctx.face('player', 'up');
  const beaten = (i) => Number(ctx.var(V.tecnico(i), 0)) === 1;
  ctx.bgm(MUSIC.grunt, { fadeOutPrevious: 20 });
  if (!Number(ctx.var(V.perimetro, 0))) {
    ctx.setVar(V.perimetro, 1);
    await say(ctx, SPEAKER.tecnico, 'Alto. Zona de voladura del Consorcio Meridiano. No se puede pasar.');
    await say(ctx, SPEAKER.tecnica, 'La próxima carga está programada. Por su seguridad, retírese.');
    await ctx.say('Les dices que dentro de la galería hay gente atrapada.');
    await say(ctx, SPEAKER.tecnico, 'Nos consta. Se procederá según el protocolo.');
    await say(ctx, SPEAKER.tecnica, '¿No se retira? Entonces, procedimiento de contención.');
  } else {
    await say(ctx, beaten(0) ? SPEAKER.tecnica : SPEAKER.tecnico, 'Otra vez usted. El perímetro sigue cerrado.');
  }
  for (let i = 0; i < techIds.length; i++) {
    if (beaten(i)) continue;
    const out = await bossBattle(ctx, { trainer: techIds[i], bgm: MUSIC.grunt }, s, {
      speaker: i === 0 ? SPEAKER.tecnico : SPEAKER.tecnica, loseText: 'Perímetro asegurado. Retírese, por favor.',
    });
    if (out !== 'win' && out !== 'caught') return;
    ctx.setVar(V.tecnico(i), 1);
  }
  ctx.setFlag(F.tecnicos);
  await garridoScene(ctx);
}

async function garridoScene(ctx) {
  if (ctx.flag(F.garrido)) return;
  const p = ctx.player;
  ctx.bgm(MUSIC.tension, { fadeOutPrevious: 20 });
  const techs = ['tecnico_voladura_0', 'tecnico_voladura_1'].map((id) => eventById(ctx, id));
  const garrido = actor(ctx, 'garrido', C.garrido.x, C.garrido.y, SPRITE.garrido, 6);
  await say(ctx, SPEAKER.garrido, '¿Qué está pasando aquí?');
  await walk(ctx, garrido, p.x - 3, p.y, 3.5);
  garrido.turnToward(p);
  ctx.face('player', garrido);
  await say(ctx, SPEAKER.tecnica, 'Director, un civil ha entrado en el perímetro de voladura.');
  await ctx.emote(garrido, '…');
  await lines(ctx, SPEAKER.garrido, [
    'Ulises Garrido. Dirijo las operaciones de campo del Consorcio.',
    'Tú estuviste en el Parque Eólico. La doctora Varela me dijo que acabaría encontrándote.',
  ]);
  const bea = castOr(ctx, 'bea_patio', C.bea.x, C.bea.y, SPRITE.bea, 2);
  await say(ctx, SPEAKER.bea, '¡Parad ya! ¡Mi hermano está ahí dentro!');
  await walk(ctx, bea, p.x - 2, p.y + 1, 4.5);
  bea.turnToward(garrido);
  await lines(ctx, SPEAKER.garrido, [
    'Lo sabemos. Y lo lamento. Pero la carga de las doce ya está colocada en el frente.',
    'Si no se detona, el techo queda colgado y es peor para todos. Después entraremos con maquinaria.',
  ]);
  await say(ctx, SPEAKER.bea, '¡Con maquinaria! ¡Lo vais a enterrar del todo!');
  // Llegan los canteros desde el patio y señalan a Garrido delante de todos (a la vista, junto al perímetro).
  const crew = C.crowd.map(([, y], k) => actor(ctx, `cantero_${k}`, C.crowdFrom, y, k === 1 ? SPRITE.cantera : SPRITE.cantero, 6));
  await Promise.all(crew.map((ev, k) => walk(ctx, ev, C.crowd[k][0], C.crowd[k][1], 4.5)));
  for (const ev of crew) ev.turnToward(garrido);
  await say(ctx, SPEAKER.cantero, '¡Ese! ¡Ese es el que manda volar la montaña!');
  await ctx.emote(crew[1], '!');
  await say(ctx, SPEAKER.cantera, 'Treinta años sacando piedra de este cañón sin perder a nadie, y llegáis vosotros con vuestras cajas.');
  await say(ctx, SPEAKER.cantero, '¡Que se entere todo el cañón! ¡El Consorcio ha enterrado a Quino Solano!');
  await say(ctx, SPEAKER.canteros, '¡Fuera! ¡Fuera de la Cantería!');
  garrido.turnToward(crew[0]);
  await ctx.wait(30);
  garrido.turnToward(p);
  await ctx.wait(20);
  await say(ctx, SPEAKER.garrido, '…');
  await say(ctx, SPEAKER.garrido, 'Retirad las cargas. Hoy no se vuela nada más.');
  await say(ctx, SPEAKER.tecnico, 'Pero, director, el calendario de la operación…');
  await say(ctx, SPEAKER.garrido, 'He dicho que las retiréis.');
  // Las cargas desaparecen ya (el flag, al final: así los canteros fijos del patio no aparecen dos veces).
  for (const ev of ctx.world.events.filter((e) => /^carga_\d+$/.test(String(e.id)))) ctx.erase(ev);
  ctx.se('PRSFX- Metal Sound', { volume: 60 });
  await lines(ctx, SPEAKER.garrido, [
    'No te confundas. No lo hago por ti.',
    'Ninguna obra se sostiene con todo un pueblo en contra. Eso lo aprende cualquier capataz.',
  ]);
  const leaving = [garrido, ...techs.filter(Boolean)];
  await Promise.all(leaving.map((ev, k) => walk(ctx, ev, C.leave.x, C.leave.y + k, 4)));
  remove(ctx, garrido);
  for (const ev of techs) if (ev) ctx.erase(ev);
  await ctx.say('Los del Consorcio se marchan cañón arriba. El camión se queda donde está.');
  await say(ctx, SPEAKER.cantero, '¡Y que no vuelvan!');
  // Los canteros vuelven a sus puestos del patio (donde los esperan sus eventos fijos).
  await Promise.all(crew.map((ev, k) => walk(ctx, ev, C.canteros[k].x, C.canteros[k].y, 4.5)));
  remove(ctx, ...crew);
  ctx.setFlag(F.garrido);
  await sendBack(ctx, bea, C.bea.x, C.bea.y, C.bea.dir);
  ctx.bgm(MUSIC.route, { fadeOutPrevious: 30 });
  await alerceArrives(ctx);
}

// ───────────────────────────── 3 · Alerce y la regla de los estratos ─────────────────────────────

async function alerceArrives(ctx) {
  if (ctx.flag(F.alerce)) return;
  const p = ctx.player;
  await ctx.wait(30);
  await say(ctx, SPEAKER.alerce, '¡\\PN!');
  const alerce = actor(ctx, 'alerce', C.alerceFrom.x, C.alerceFrom.y, SPRITE.alerce, 6);
  await walk(ctx, alerce, C.alerceSpot.x, p.y, 4.5);
  alerce.turnToward(p);
  ctx.face('player', alerce);
  await lines(ctx, SPEAKER.alerce, [
    'Me han avisado en Brontia: un derrumbe en la Cantería, con gente dentro. He venido en cuanto he podido.',
    'Un derrumbe así no se abre a golpes. Hay que leerlo. Ven.',
  ]);
  await walk(ctx, alerce, C.alerceSpot.x, C.alerceSpot.y, 3.5);
  const f = C.corteFront;
  await ctx.movePlayerTo(f.x, f.y, { through: true, speed: 3.5 });
  ctx.face('player', 'up');
  alerce.turnToward({ x: C.corte.x, y: C.corte.y });
  const corte = eventById(ctx, 'corte_estratos');
  await lines(ctx, SPEAKER.alerce, [
    'Mira la pared de la cantera. Cada franja es una capa de piedra que se depositó encima de la anterior.',
  ]);
  if (corte) { corte.direction = 4; ctx.se('PRSFX- Rock Polish', { volume: 60 }); }
  await lines(ctx, SPEAKER.alerce, [
    'Arriba, la arenisca ocre. Debajo, la caliza gris. Luego, la arcilla roja. Y al fondo, la pizarra negra.',
    'Lo que se ha caído dentro es esta misma pared. Cada roca tiene el color de su capa… y siguen apoyadas unas en otras, como estaban.',
    'Solo hay una regla, y no tiene excepciones: nunca rompas la capa que sostiene a otra.',
    'Si una roca toca a otra de una capa más alta, la está sosteniendo. Rompe siempre de arriba abajo, aunque tengas que dar la vuelta para llegar arriba.',
    'Si te equivocas, se vendrá abajo un trozo y tendrás que empezar esa galería otra vez. Sin prisa: la roca no la tiene.',
  ]);
  if (corte) corte.direction = 2;
  alerce.turnToward(p);
  await say(ctx, SPEAKER.alerce, 'Yo me quedo aquí fuera, con la Pokédex encendida.');
  const bea = castOr(ctx, 'bea_patio', C.bea.x, C.bea.y, SPRITE.bea, 2);
  await walk(ctx, bea, p.x - 1, p.y + 1, 4.5);
  bea.turnToward(p);
  await say(ctx, SPEAKER.bea, 'Son tres Timburr y mi hermano. Sácalos a todos, por favor.');
  await sendBack(ctx, bea, C.bea.x, C.bea.y, C.bea.dir);
  remove(ctx, alerce);
  ctx.setFlag(F.alerce);
}

// ───────────────────────────── 4 · Tras el rescate ─────────────────────────────

async function rescueScene(ctx) {
  if (ctx.flag(F.rescate) || !ctx.flag(F.piedra)) return;
  const p = ctx.player;
  const quino = actor(ctx, 'quino', p.x - 1, p.y, SPRITE.quino, 2);
  // La cuadrilla de Timburr ya ha salido por el pozo y da saltos delante de la boca de la galería.
  const timburr = C.party.timburr.map(([x, y], k) => actor(ctx, `timburr_${k}`, x, y, SPRITE.timburr, 8));
  for (const t of timburr) { t.stepAnime = true; }
  await ctx.wait(20);
  const bea = castOr(ctx, 'bea_patio', C.bea.x, C.bea.y, SPRITE.bea, 2);
  await say(ctx, SPEAKER.bea, '¡Quino!');
  await walk(ctx, bea, quino.x - 1, quino.y + 1, 5);
  bea.turnToward(quino);
  quino.turnToward(bea);
  await say(ctx, SPEAKER.quino, `Tranquila, tranquila, que estoy entero. Gracias a ${byGender(ctx.state, 'este chaval', 'esta chavala')}.`);
  await ctx.emote(bea, '♥');
  await say(ctx, SPEAKER.bea, '¡Tonto! ¡Toda la mañana oyéndote picar sin poder hacer nada!');
  // Los canteros del patio acuden a la boca de la galería, donde la cuadrilla de Timburr ya da saltos.
  const crew = C.canteros.map((c, k) => castOr(ctx, `cantero_patio_${k}`, c.x, c.y, k === 1 ? SPRITE.cantera : SPRITE.cantero, 6));
  await Promise.all(crew.map((ev, k) => walk(ctx, ev, C.party.canteros[k][0], C.party.canteros[k][1], 4.5)));
  for (const ev of crew) ev.turnToward(quino);
  ctx.se('Anim/Applause');
  ctx.cry('TIMBURR');
  await say(ctx, SPEAKER.canteros, '¡Bien! ¡La cuadrilla entera fuera!');
  quino.turnToward(p);
  await lines(ctx, SPEAKER.quino, [
    'Esto lo va a saber todo Estrato. Que el Consorcio voló la cantera con gente dentro y luego quería entrar con máquinas.',
  ]);
  await say(ctx, SPEAKER.cantera, 'Ya estamos escribiendo el aviso. Uno para su camión y otro para la plaza de Estrato, con nuestros nombres debajo.');
  ctx.setFlag(F.denuncia);
  const alerce = castOr(ctx, 'alerce_canteria', C.alerceSpot.x, C.alerceSpot.y, SPRITE.alerce, 6);
  await walk(ctx, alerce, p.x + 1, p.y + 1, 3.5);
  alerce.turnToward(p);
  await lines(ctx, SPEAKER.alerce, ['Buen trabajo, \\PN. Has leído bien la roca.', 'Y has encontrado otra Tablilla. …Guárdala bien.']);
  bea.turnToward(p);
  await say(ctx, SPEAKER.bea, '¿Y eso que te brilla en la mano?');
  await say(ctx, SPEAKER.quino, 'Enséñasela, anda, que es tuya.');
  await ctx.say('Le enseñas a Bea la piedra redonda con el remolino de colores.');
  await ctx.emote(bea, '!');
  await lines(ctx, SPEAKER.bea, [
    'Una piedra con un remolino dentro… Mi abuelo contaba que en esta cantera salían, muy de tarde en tarde. Yo nunca había visto una.',
    'En Solano, al que saca a alguien de la roca le damos un anillo de la roca.',
    'Dame un rato en la herrería. Esto lo monto yo.',
  ]);
  await walk(ctx, bea, C.forgeFront.x, C.forgeFront.y, 4.5);
  ctx.se('Door enter');
  remove(ctx, bea);
  ctx.setFlag(F.rescate);
  await say(ctx, SPEAKER.quino, 'Ve con ella, que no te lo va a dar aquí fuera. Nosotros vamos a quitar el derrumbe del camino de Estrato.');
  await ctx.fade('out', 20);
  // Con la pantalla en negro, cada uno vuelve a su sitio del patio (los fijos) o se va (los de la escena).
  crew.forEach((ev, k) => place(ev, C.canteros[k].x, C.canteros[k].y, C.canteros[k].dir));
  place(alerce, C.alerceSpot.x, C.alerceSpot.y, C.alerceSpot.dir);
  place(bea, C.bea.x, C.bea.y, C.bea.dir);
  remove(ctx, quino, alerce, ...crew, ...timburr);
  await ctx.fade('in', 20);
}

// ───────────────────────────── Eventos ─────────────────────────────

function sceneEvents() {
  const arrival = [];
  for (let x = 3; x <= 26; x++) {
    arrival.push({ id: `llegada_${x}`, x, y: RUTA6.arrivalY, trigger: 'touch', through: true, when: when({ none: [F.llegada] }), script: arrivalScene });
  }
  const techStrip = [];
  for (let x = C.techStrip.x0; x <= C.techStrip.x1; x++) {
    techStrip.push({ id: `perimetro_${x}`, x, y: C.techStrip.y, trigger: 'touch', through: true, when: when({ all: [F.llegada], none: [F.tecnicos] }), script: techScene });
  }
  // Si la partida se cortó a mitad de la cadena (técnicos → Garrido → Alerce), se retoma al volver al patio.
  const resume = {
    id: 'reanudar_canteria', x: C.techSpot.x, y: C.techSpot.y + 1, through: true, trigger: 'touch',
    when: (s) => Boolean(s?.flag(F.tecnicos)) && !s.flag(F.alerce),
    script: async (ctx) => { if (!ctx.flag(F.garrido)) await garridoScene(ctx); else await alerceArrives(ctx); },
  };
  const rescue = { id: 'fiesta_canteros', x: 0, y: 0, through: true, trigger: 'auto', when: when({ all: [F.piedra], none: [F.rescate] }), script: rescueScene };
  return [...arrival, ...techStrip, resume, rescue];
}

function techEvents() {
  return C.techs.map((t, i) => ({
    id: `tecnico_voladura_${i}`, x: t.x, y: t.y, name: i === 0 ? SPEAKER.tecnico : SPEAKER.tecnica,
    pages: [{
      when: when({ none: [F.garrido] }),
      sprite: i === 0 ? SPRITE.tecnico : SPRITE.tecnica, dir: t.dir, solid: true, trigger: 'action',
      script: async (ctx) => {
        if (!ctx.flag(F.llegada)) { await say(ctx, i === 0 ? SPEAKER.tecnico : SPEAKER.tecnica, 'Zona de voladura. Circule, por favor.'); return; }
        await techScene(ctx);
      },
    }],
  }));
}

function mineEvents() {
  const d = C.mine.door;
  return [{
    id: 'boca_galeria', x: d.x, y: d.y, trigger: 'touch', name: 'Galería',
    script: async (ctx) => {
      if (!ctx.flag(F.tecnicos)) { await ctx.say(CANTERIA_TEXT.mineBlocked); return; }
      if (!ctx.flag(F.alerce)) { await say(ctx, SPEAKER.bea, CANTERIA_TEXT.beaWait); return; }
      resetRoomIfUnsolved(ctx.state, 1);
      const [sx, sy] = roomStart(1);
      await ctx.warp('canteria_solano', sx, sy, 8, { door: true });
    },
  }];
}

function propEvents() {
  const out = [];
  C.charges.forEach(([x, y], i) => out.push({
    id: `carga_${i}`, x, y, name: 'Carga',
    pages: [{ when: when({ none: [F.garrido] }), sprite: OBJ.charge, dir: 2, stepAnime: true, speed: 3, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CANTERIA_TEXT.charge); } }],
  }));
  out.push({
    id: 'corte_estratos', x: C.corte.x, y: C.corte.y, name: 'Corte', sprite: OBJ.corte, dir: 2, directionFix: true, walkAnime: false,
    solid: true, trigger: 'action', shadow: false, script: async (ctx) => { await ctx.say(CANTERIA_TEXT.corte); },
  });
  for (const [x, y, v] of [[21, 24, 2], [19, 27, 4], [16, 35, 6], [13, 33, 8], [26, 26, 4], [8, 41, 2]]) {
    out.push({ id: `sillares_${x}_${y}`, x, y, sprite: OBJ.blocks, dir: v, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CANTERIA_TEXT.blocks); } });
  }
  // Camión del Consorcio (stamp caravana 6×5): se examina por su lado sur.
  for (let x = C.truck.x; x < C.truck.x + 6; x += 2) {
    out.push(examine(`camion_${x}`, x, C.truck.y + 3, (s) => (s.flag(F.denuncia) ? CANTERIA_TEXT.truckNotice : CANTERIA_TEXT.truck), { solid: true }));
  }
  out.push(examine('tablon_canteria', C.board.x, C.board.y, (s) => (s.flag(F.denuncia) ? CANTERIA_TEXT.boardNotice : CANTERIA_TEXT.board), { solid: true }));
  return out;
}

/** Bea, Alerce, Quino, los canteros y la cuadrilla según el momento de la historia. */
function peopleEvents() {
  const waiting = when({ all: [F.llegada], none: [F.rescate] });
  const out = [
    {
      id: 'bea_patio', x: C.bea.x, y: C.bea.y, name: SPEAKER.bea,
      pages: [{
        when: waiting, sprite: SPRITE.bea, dir: C.bea.dir, move: 'look', trigger: 'action',
        script: async (ctx) => {
          if (!ctx.flag(F.tecnicos)) { await say(ctx, SPEAKER.bea, 'Los del Consorcio siguen delante de la galería. ¿Vas a hablar con ellos?'); return; }
          if (!ctx.flag(F.alerce)) { await say(ctx, SPEAKER.bea, 'Ese hombre del Consorcio… ¿Se van o no se van?'); return; }
          await say(ctx, SPEAKER.bea, 'Tres Timburr y mi hermano. Si necesitas descansar, en la herrería hay un catre.');
        },
      }],
    },
    {
      id: 'alerce_canteria', x: C.alerceSpot.x, y: C.alerceSpot.y, name: SPEAKER.alerce,
      pages: [{
        when: when({ all: [F.alerce], none: [F.rescate] }), sprite: SPRITE.alerce, dir: 2, move: 'look', trigger: 'action',
        script: async (ctx) => {
          await say(ctx, SPEAKER.alerce, 'De arriba abajo. Antes de embestir, mira qué roca toca a cuál.');
          if (Number(ctx.var(V.derrumbes, 0)) > 0) await say(ctx, SPEAKER.alerce, 'Si una pila te cierra el paso por abajo, busca por dónde llegar a su parte de arriba.');
        },
      }],
    },
    {
      id: 'quino_patio', x: C.quinoAfter.x, y: C.quinoAfter.y, name: SPEAKER.quino,
      pages: [{
        when: when({ all: [F.rescate] }), sprite: SPRITE.quino, dir: 2, move: 'look', trigger: 'action',
        script: async (ctx) => {
          if (!ctx.flag(F.megaring)) { await say(ctx, SPEAKER.quino, 'Bea está en la herrería con tu piedra. No la hagas esperar.'); return; }
          if (!ctx.flag(F.ruta)) { await say(ctx, SPEAKER.quino, 'En un rato los Timburr tienen despejado el camino.'); return; }
          await lines(ctx, SPEAKER.quino, [
            'El camino de Estrato ya está libre. Mis Timburr han sacado la última piedra.',
            'Si vuelves por aquí, las galerías siguen abiertas. Y la herrería de Bea, también.',
          ]);
        },
      }],
    },
  ];
  C.canteros.forEach((c, k) => out.push({
    id: `cantero_patio_${k}`, x: c.x, y: c.y, name: k === 1 ? SPEAKER.cantera : SPEAKER.cantero,
    pages: [
      {
        when: when({ all: [F.garrido], none: [F.rescate] }), sprite: k === 1 ? SPRITE.cantera : SPRITE.cantero, dir: c.dir, move: 'look', trigger: 'action',
        script: async (ctx) => {
          const t = ['Si alguien puede sacarlos, eres tú. Nosotros no tenemos fuerza para mover esa roca sin que se venga todo.', 'Quino conoce cada capa de esta cantera. Seguro que está contándolas ahí dentro.', 'Esos del Consorcio llevaban semanas con sus cajas. Ahora sabemos para qué.'][k];
          await say(ctx, k === 1 ? SPEAKER.cantera : SPEAKER.cantero, t);
        },
      },
      {
        when: when({ all: [F.rescate] }), sprite: k === 1 ? SPRITE.cantera : SPRITE.cantero, dir: c.dir, move: 'look', trigger: 'action',
        script: async (ctx) => {
          const t = ['El aviso ya va camino de Estrato. Que se sepa quién vuela las montañas.', 'Treinta años aquí y nunca habíamos celebrado tanto un rescate.', 'Hoy no se corta ni un sillar. Hoy se despeja el camino.'][k];
          await say(ctx, k === 1 ? SPEAKER.cantera : SPEAKER.cantero, t);
        },
      },
    ],
  }));
  C.timburrAfter.forEach(([x, y], k) => out.push({
    id: `timburr_patio_${k}`, x, y, name: 'Timburr',
    pages: [{
      when: when({ all: [F.rescate] }), sprite: SPRITE.timburr, dir: [4, 6, 2][k], stepAnime: true, move: { wander: 2 }, freq: 2, trigger: 'action',
      script: async (ctx) => { ctx.cry('TIMBURR'); await ctx.say('Timburr: ¡Tim, timburr! (Se echa la viga al hombro, orgulloso.)'); },
    }],
  }));
  return out;
}

export function canteriaEvents() {
  return [...sceneEvents(), ...techEvents(), ...mineEvents(), ...propEvents(), ...peopleEvents()];
}

export { arrivalScene, techScene, garridoScene, alerceArrives, rescueScene };
