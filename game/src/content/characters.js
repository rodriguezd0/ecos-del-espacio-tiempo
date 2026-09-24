// Registro de sprites de personajes de Axis.
// TODO el arte propio es PROVISIONAL (decisión D30 pendiente del autor): ver docs/arte.md.
// Los PNG se generan con `node tools/pixel_build.mjs` (fuentes en tools/pixel_chars/).
//
// Tipos de hoja (`kind`):
//   charset       4×4 al estilo Essentials: filas abajo, izquierda, derecha, arriba; columnas = patrón 0..3
//                 (0 y 2 de pie, 1 y 3 pasos). Frames 64×64 (arte nativo 32×32 ampliado ×2 exacto).
//   battle_back   tira horizontal de 5 frames (0 = estático, 1..4 = lanzamiento), como Essentials.
//   battle_front  sprite frontal de entrenador (1 frame).
//
// Uso:
//   import { getCharacter, frameRect } from '../content/characters.js';
//   const ch = getCharacter('protagonista_m');
//   const r = frameRect(ch, 2, pattern);          // dirección RMXP (2/4/6/8) y patrón 0..3
//   ch.variants?.run → id de la hoja de correr; ch.battle?.back / ch.battle?.front → sprites de combate.
//   Charsets de Añil sin registrar: getCharacter('anil:chaval1') (frame = ancho/4 × alto/4).

export const DIR_ROW = Object.freeze({ 2: 0, 4: 1, 6: 2, 8: 3 });

const ASSET_DIR = 'assets/characters/';
const FRAME = 64;
const BATTLE_FRAME = 160;

const base = (kind, file, extra) => Object.freeze({
  kind, file: ASSET_DIR + file, provisional: true, decision: 'D30', ...extra,
});
const charset = (file, extra) => base('charset', file, { frameW: FRAME, frameH: FRAME, cols: 4, rows: 4, ...extra });
const battleBack = (file, extra) => base('battle_back', file, { frameW: BATTLE_FRAME, frameH: BATTLE_FRAME, cols: 5, rows: 1, ...extra });
const battleFront = (file, extra) => base('battle_front', file, { frameW: BATTLE_FRAME, frameH: BATTLE_FRAME, cols: 1, rows: 1, ...extra });

export const CHARACTERS = Object.freeze({
  protagonista_m: charset('protagonista_m.png', {
    name: 'Protagonista (masculino)',
    note: 'Castaño cobrizo sin gorra, chaqueta azul petróleo cerrada, camiseta clara, pantalón y calzado oscuros, tirador verde #B9FF66, sin mochila (biblia §13.1).',
    variants: { run: 'protagonista_m_run' },
    battle: { back: 'protagonista_m_back' },
  }),
  protagonista_m_run: charset('protagonista_m_run.png', {
    name: 'Protagonista (masculino) — correr', variantOf: 'protagonista_m',
    note: 'Ciclo de carrera (0/2 paso cruzado, 1/3 zancada).',
  }),
  protagonista_f: charset('protagonista_f.png', {
    name: 'Protagonista (femenina)',
    note: 'Azul marino casi nocturno y acento verde (biblia §13.2). Melena, chaqueta clara y pantalón corto con mallas: PROPUESTA pendiente de D30.',
    variants: { run: 'protagonista_f_run' },
    battle: { back: 'protagonista_f_back' },
  }),
  protagonista_f_run: charset('protagonista_f_run.png', {
    name: 'Protagonista (femenina) — correr', variantOf: 'protagonista_f',
    note: 'Ciclo de carrera (0/2 paso cruzado, 1/3 zancada).',
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
  zygarde_core: charset('zygarde_core.png', {
    name: 'Zygarde — Core (acompañante)',
    note: 'Forma pequeña de núcleo: cuerpo gelatinoso verde, dos antenas, placa hexagonal y núcleo luminoso. Rebote blando al andar.',
  }),
  protagonista_m_back: battleBack('protagonista_m_back.png', {
    name: 'Protagonista (masculino) — combate, espalda',
    note: 'Estilo BW, 5 frames: estático, preparar, brazo arriba, lanzar, seguimiento. Se recorta por abajo.',
  }),
  protagonista_f_back: battleBack('protagonista_f_back.png', {
    name: 'Protagonista (femenina) — combate, espalda',
    note: 'Estilo BW, 5 frames como la masculina. Diseño femenino pendiente (D30).',
  }),
  gael_front: battleFront('gael_front.png', {
    name: 'Gael — combate, frontal',
    note: 'Pose seria (mano en la cadera), sin cejas fruncidas; paleta histórica a ratificar.',
  }),
  profesor_front: battleFront('profesor_front.png', {
    name: 'Profesor — combate, frontal',
    note: 'Propuesta neutral: abrigo claro abierto, jersey pizarra; nada que revele su pasado (D03).',
  }),
  zygarde_celula: charset('zygarde_celula.png', {
    name: 'Célula de Zygarde',
    note: 'Gota verde flotante con destellos; las 4 filas son iguales (sirve con cualquier dirección y con "animación en parada").',
  }),
});

/** Entrada del registro o null. Acepta 'anil:<archivo>' para charsets originales de Añil. */
export function getCharacter(id) {
  if (typeof id !== 'string' || !id) return null;
  if (id.startsWith('anil:')) {
    const name = id.slice(5);
    return {
      kind: 'charset', name, file: `/anil/Graphics/Characters/${encodeURIComponent(name)}.png`,
      frameW: null, frameH: null, cols: 4, rows: 4, provisional: false, note: 'Charset original de Añil (referencia).',
    };
  }
  return CHARACTERS[id] || null;
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
