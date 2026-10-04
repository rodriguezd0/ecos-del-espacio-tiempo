// Registro de sprites de personajes de Axis.
// Las trece poses frontales tienen aprobación del autor (D30, 04-10-2026); el resto sigue provisional.
// Ver docs/arte.md para el alcance de cada revisión.
// Los PNG se generan con `node tools/pixel_build.mjs` (fuentes en tools/pixel_chars/).
//
// Tipos de hoja (`kind`):
//   charset       4×4 al estilo Essentials: filas abajo, izquierda, derecha, arriba; columnas = patrón 0..3
//                 (0 y 2 de pie, 1 y 3 pasos). Frames 64×64 (arte nativo 32×32 ampliado ×2 exacto).
//   battle_back   tira horizontal de 5 frames (0 = estático, 1..4 = lanzamiento), como Essentials.
//   battle_front  sprite frontal de entrenador (1 frame).
//   effect        tira de efecto (cols × rows frames), p. ej. la disgregación en hexágonos del Vuelo.
// Los charsets pueden tener frames mayores (monturas, buceo y pesca: 96×96): frameW/frameH de la entrada.
//
// Variantes de campo de los protagonistas (CAMPANA §2.7–2.8; docs/arte.md §8):
//   getCharacter('protagonista_m').variants → { run, ride10, ride50, dive, climb, fish, vuelo }
//   playerVariant('F', 'ride50') → 'protagonista_f_ride50' (id de charset) o null.
// Alias de personajes con nombre (content/characters_campaign.js): getCharacter('casilda') → Guardiana;
//   getBattleSprite('casilda_front'); listAliases().
//
// Uso:
//   import { getCharacter, frameRect } from '../content/characters.js';
//   const ch = getCharacter('protagonista_m');
//   const r = frameRect(ch, 2, pattern);          // dirección RMXP (2/4/6/8) y patrón 0..3
//   ch.variants?.run → id de la hoja de correr; ch.battle?.back / ch.battle?.front → sprites de combate.
//   Charsets de Añil sin registrar: getCharacter('anil:chaval1') (frame = ancho/4 × alto/4).
//   Clases genéricas de entrenador con arte de Añil (content/anilClasses.js):
//     getCharacter('anil:bichero') → charset; getBattleSprite('anil:bichero') → Trainers/CAZABICHOS.png.
//   Sprites de combate: getBattleSprite('gael_front' | 'anil:<alias>' | 'anil:<ARCHIVO de Graphics/Trainers>').
import { ANIL_CLASSES } from './anilClasses.js';
import { campaignEntries, fieldVariants, CHARACTER_ALIASES } from './characters_campaign.js';

export const DIR_ROW = Object.freeze({ 2: 0, 4: 1, 6: 2, 8: 3 });

const ASSET_DIR = 'assets/characters/';
const FRAME = 64;
const BATTLE_FRAME = 160;
const APPROVED_FRONTS = new Set(['gael_front.png', 'profesor_front.png', 'guardiana_front.png', 'leandro_front.png',
  'abril_front.png', 'fermin_front.png', 'olvido_front.png', 'sol_front.png', 'vertice_front.png', 'casia_front.png',
  'garrido_front.png', 'genesis_tecnico_front.png', 'genesis_tecnica_front.png']);

const base = (kind, file, extra) => Object.freeze({
  kind, file: ASSET_DIR + file, provisional: true, decision: 'D30', ...extra,
  ...(APPROVED_FRONTS.has(file) ? { provisional: false, approvedOn: '2026-10-04', approvedBy: 'autor' } : {}),
});
const charset = (file, extra) => base('charset', file, { frameW: FRAME, frameH: FRAME, cols: 4, rows: 4, ...extra });
const battleBack = (file, extra) => base('battle_back', file, { frameW: BATTLE_FRAME, frameH: BATTLE_FRAME, cols: 5, rows: 1, ...extra });
const battleFront = (file, extra) => base('battle_front', file, { frameW: BATTLE_FRAME, frameH: BATTLE_FRAME, cols: 1, rows: 1, ...extra });
const effect = (file, extra) => base('effect', file, { frameW: FRAME, frameH: FRAME, cols: 1, rows: 1, ...extra });

export const CHARACTERS = Object.freeze({
  protagonista_m: charset('protagonista_m.png', {
    name: 'Protagonista (masculino)',
    note: 'Castaño cobrizo sin gorra, chaqueta azul petróleo cerrada, camiseta clara, pantalón y calzado oscuros, tirador verde #B9FF66 (biblia §13.1) y mochila arena (D06).',
    variants: { run: 'protagonista_m_run', ...fieldVariants('protagonista_m') },
    battle: { back: 'protagonista_m_back' },
  }),
  protagonista_m_run: charset('protagonista_m_run.png', {
    name: 'Protagonista (masculino) — correr', variantOf: 'protagonista_m',
    note: 'Ciclo de carrera (0/2 paso cruzado, 1/3 zancada), con mochila.',
  }),
  protagonista_f: charset('protagonista_f.png', {
    name: 'Protagonista (femenina)',
    note: 'Azul marino casi nocturno (biblia §13.2): media melena con las puntas hacia fuera y trenza con goma verde #B9FF66, chaqueta crema, pantalón corto marino, mallas y botines teja; mochila teja (D06). Propuesta X32 recuperada del WIP, provisional (D30).',
    variants: { run: 'protagonista_f_run', ...fieldVariants('protagonista_f') },
    battle: { back: 'protagonista_f_back' },
  }),
  protagonista_f_run: charset('protagonista_f_run.png', {
    name: 'Protagonista (femenina) — correr', variantOf: 'protagonista_f',
    note: 'Ciclo de carrera (0/2 paso cruzado, 1/3 zancada), con mochila.',
  }),
  gael: charset('gael.png', {
    name: 'Gael (rival)',
    note: 'Antecedente del autor a ratificar: rubio, chaqueta bordó, ropa inferior gris, botas azul oscuro, ojos claros; serio sin cejas furiosas (§13.3).',
    battle: { front: 'gael_front' },
  }),
  profesor: charset('profesor.png', {
    name: 'Profesor (diseño abierto, D03)',
    note: 'Propuesta neutral: investigador local con abrigo claro de campo, sin emblemas ni rasgos que revelen su pasado (§13.4).',
    battle: { front: 'profesor_front' },
  }),
  policia: charset('policia.png', {
    name: 'Policía del acceso restringido',
    note: 'Genérico (§13.8): uniforme azul marino, gorra de plato. Nombre, rango y rostro sin fijar.',
  }),
  vecino: charset('vecino.png', { name: 'Vecino del pueblo', note: 'NPC genérico: chaqueta ocre y vaqueros.' }),
  vecina: charset('vecina.png', { name: 'Vecina del pueblo', note: 'NPC genérica: rebeca coral, falda larga, moño.' }),
  anciano: charset('anciano.png', { name: 'Anciano del pueblo', note: 'NPC genérico: pelo cano, rebeca marrón.' }),
  madre: charset('madre.png', {
    name: 'Madre del protagonista',
    note: 'D01: adulta cálida con ropa de casa: jersey color miel, delantal crema, coleta baja castaña, zapatillas de casa.',
  }),
  ayudante: charset('ayudante.png', {
    name: 'Ayudante del laboratorio',
    note: 'NPC genérico (PROPUESTA): joven con melena corta negra y horquilla, bata clara sobre jersey coral.',
  }),
  guardiana: charset('guardiana.png', {
    name: 'Casilda Roquer, Guardiana del Umbral',
    note: 'D07/X06: Casilda Roquer (64, escepticismo), pelo cano con moño, chaqueta de campo oliva, pañuelo teja, botas altas. Alias "casilda".',
    battle: { front: 'guardiana_front' },
  }),
  nino: charset('nino.png', {
    name: 'Niño del pueblo',
    note: 'NPC genérico infantil: camiseta celeste, pantalón corto caqui. (El charset de Añil sigue en "anil:nino".)',
  }),
  nina: charset('nina.png', {
    name: 'Niña del pueblo',
    note: 'NPC genérica infantil: vestido amarillo, coletas. (El charset de Añil sigue en "anil:nina".)',
  }),
  zygarde_core: charset('zygarde_core.png', {
    name: 'Zygarde — Core (acompañante)',
    note: 'Referencia del autor: cabeza redondeada verde con un ojo, aro oscuro y cuerpo oliva en punta (flota); de espaldas, mancha rojiza. Rebote suave.',
  }),
  protagonista_m_back: battleBack('protagonista_m_back.png', {
    name: 'Protagonista (masculino) — combate, espalda',
    note: 'Estilo BW, 5 frames: estático, preparar, brazo arriba, lanzar, seguimiento. Se recorta por abajo.',
  }),
  protagonista_f_back: battleBack('protagonista_f_back.png', {
    name: 'Protagonista (femenina) — combate, espalda',
    note: 'Estilo BW, 5 frames como la masculina: melena con anillo de brillo, trenza con goma verde y mochila teja (X32). Se recorta por abajo.',
  }),
  gael_front: battleFront('gael_front.png', {
    name: 'Gael — combate, frontal',
    note: 'Pose seria (mano en la cadera), sin cejas fruncidas; paleta histórica a ratificar.',
  }),
  profesor_front: battleFront('profesor_front.png', {
    name: 'Profesor — combate, frontal',
    note: 'Propuesta neutral: abrigo claro abierto, jersey pizarra; nada que revele su pasado (D03).',
  }),
  guardiana_front: battleFront('guardiana_front.png', {
    name: 'Casilda Roquer — combate, frontal',
    note: 'Brazos cruzados (escéptica, sin hostilidad), correa de zurrón cruzada, botas altas (D07).',
  }),
  zygarde_celula: charset('zygarde_celula.png', {
    name: 'Célula de Zygarde',
    note: 'Referencia del autor: haba alargada verde lima con centro luminoso, flota con pulso de brillo; las 4 filas son iguales (sprite por defecto de los eventos zygardeCell).',
  }),
  ...campaignEntries({ charset, battleFront, effect }),
});

/** Id registrado o de Añil ('anil:…') al que apunta un alias, siguiendo cadenas; null si no es alias. */
function aliasTarget(id) {
  let target = null;
  let cur = id;
  for (let i = 0; i < 4 && Object.hasOwn(CHARACTER_ALIASES, cur); i++) {
    target = CHARACTER_ALIASES[cur];
    cur = target;
  }
  return target;
}

/** Entrada de un alias: la de su destino con `alias` y `aliasOf` añadidos (objeto nuevo, congelado). */
function aliasEntry(id, resolve) {
  const target = aliasTarget(id);
  if (!target) return undefined;
  const entry = resolve(target);
  return entry ? Object.freeze({ ...entry, alias: id, aliasOf: target }) : null;
}

/** Alias de personajes con nombre ({ alias: destino }). */
export function listAliases() {
  return { ...CHARACTER_ALIASES };
}

/**
 * Charset de una variante del protagonista: gender 'M' | 'F' y variante 'run' | 'ride10' | 'ride50' |
 * 'dive' | 'climb' | 'fish' | 'vuelo'. Devuelve el id registrado o null si no existe.
 */
export function playerVariant(gender, variant) {
  const base = gender === 'F' ? 'protagonista_f' : 'protagonista_m';
  const id = CHARACTERS[base]?.variants?.[variant];
  return id && Object.hasOwn(CHARACTERS, id) ? id : null;
}

/** Hoja original de Añil (tamaño de frame deducido de la imagen). */
function anilSheet(kind, dir, name, extra = {}) {
  const grid = kind === 'charset' ? { cols: 4, rows: 4 } : { cols: 1, rows: 1 };
  return {
    kind, name, file: `/anil/Graphics/${dir}/${encodeURIComponent(name)}.png`,
    frameW: null, frameH: null, ...grid, provisional: false, note: 'Original de Añil (referencia).', ...extra,
  };
}

/**
 * Entrada del registro o null. Acepta 'anil:<alias de clase>' (content/anilClasses.js) y
 * 'anil:<archivo>' para charsets originales de Añil.
 */
export function getCharacter(id) {
  if (typeof id !== 'string' || !id) return null;
  const aliased = aliasEntry(id, getCharacter);
  if (aliased !== undefined) return aliased;
  if (id.startsWith('anil:')) {
    const name = id.slice(5);
    const cls = Object.hasOwn(ANIL_CLASSES, name) ? ANIL_CLASSES[name] : null;
    if (!cls) return anilSheet('charset', 'Characters', name);
    return anilSheet('charset', 'Characters', cls.charset, {
      alias: name, trainerClass: cls.trainerClass, gender: cls.gender,
      battle: { front: `anil:${cls.front}` },
      note: `Clase genérica "${cls.trainerClass}" con arte original de Añil.`,
    });
  }
  return Object.hasOwn(CHARACTERS, id) ? CHARACTERS[id] : null;
}

/**
 * Sprite de combate: id registrado de tipo battle_front/battle_back, 'anil:<alias de clase>' o
 * 'anil:<ARCHIVO>' de Graphics/Trainers de Añil (frame único cuadrado). null si no aplica.
 */
export function getBattleSprite(id) {
  if (typeof id !== 'string' || !id) return null;
  const aliased = aliasEntry(id, getBattleSprite);
  if (aliased !== undefined) return aliased;
  if (id.startsWith('anil:')) {
    const name = id.slice(5);
    const front = Object.hasOwn(ANIL_CLASSES, name) ? ANIL_CLASSES[name].front : name;
    return anilSheet('battle_front', 'Trainers', front);
  }
  const entry = Object.hasOwn(CHARACTERS, id) ? CHARACTERS[id] : null;
  return entry && entry.kind !== 'charset' ? entry : null;
}

/**
 * Rectángulo fuente de un frame. `imgW/imgH` solo hacen falta si la entrada no fija frameW/frameH
 * (charsets de Añil de 240×256 o 256×256).
 */
export function frameRect(entry, dir = 2, pattern = 0, imgW = 0, imgH = 0) {
  if (!entry) throw new Error('frameRect: entrada de personaje vacía');
  const fw = entry.frameW || Math.floor(imgW / entry.cols);
  const fh = entry.frameH || Math.floor(imgH / entry.rows);
  if (!fw || !fh) throw new Error(`frameRect: tamaño de frame desconocido para ${entry.name || entry.file}`);
  const row = entry.kind === 'charset' ? (DIR_ROW[dir] ?? 0) : 0;
  const col = ((pattern % entry.cols) + entry.cols) % entry.cols;
  return { x: col * fw, y: row * fh, w: fw, h: fh };
}

/** Ids de las hojas de un tipo ('charset', 'battle_back', 'battle_front'), o todas. */
export function listCharacters(kind = null) {
  return Object.keys(CHARACTERS).filter((id) => !kind || CHARACTERS[id].kind === kind);
}
