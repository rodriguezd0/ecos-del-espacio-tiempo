// Núcleo PURO del reproductor de animaciones de combate de Añil (Essentials 21.1: 008_BattleAnimationPlayer.rb y
// 005_Scene_PlayAnimations.rb). Sin DOM ni Three.js: elección de la animación de un movimiento, cels, focos,
// transformación usuario→objetivo y fondos/frentes de las animaciones. Datos: game/data/anims (tools/extract_anims.mjs).

export const FOCUSUSER_X = 128;
export const FOCUSUSER_Y = 224;
export const FOCUSTARGET_X = 384;
export const FOCUSTARGET_Y = 96;
/** Las animaciones de Essentials avanzan a 20 fotogramas por segundo: 3 pasos lógicos (60 Hz) por fotograma. */
export const TICKS_PER_FRAME = 3;
/** Lado de una celda de las hojas de Graphics/Animations (5 por fila). */
export const CELL = 192;
export const CELLS_PER_ROW = 5;

/** Premonición de Añil conserva un nombre de fondo antiguo que no está en sus gráficos. */
export function animationSheetFile(file) {
  const name = /\.[a-z]+$/i.test(file) ? file : `${file}.png`;
  return name === 'PRAS- Darkness BG.png' ? 'PRAS- Dark Void BG.png' : name;
}

// Movimiento por defecto por tipo y clase (pbFindMoveAnimation): [físico 1 objetivo, especial 1 objetivo, estado
// propio, físico varios, especial varios, estado a otros].
export const TYPE_DEFAULT_ANIM = Object.freeze({
  NORMAL: ['TACKLE', 'SONICBOOM', 'DEFENSECURL', 'EXPLOSION', 'SWIFT', 'TAILWHIP'],
  FIGHTING: ['MACHPUNCH', 'AURASPHERE', 'DETECT', null, null, null],
  FLYING: ['WINGATTACK', 'GUST', 'ROOST', null, 'AIRCUTTER', 'FEATHERDANCE'],
  POISON: ['POISONSTING', 'SLUDGE', 'ACIDARMOR', null, 'ACID', 'POISONPOWDER'],
  GROUND: ['SANDTOMB', 'MUDSLAP', null, 'EARTHQUAKE', 'EARTHPOWER', 'MUDSPORT'],
  ROCK: ['ROCKTHROW', 'POWERGEM', 'ROCKPOLISH', 'ROCKSLIDE', null, 'SANDSTORM'],
  BUG: ['TWINEEDLE', 'BUGBUZZ', 'QUIVERDANCE', null, 'STRUGGLEBUG', 'STRINGSHOT'],
  GHOST: ['LICK', 'SHADOWBALL', 'GRUDGE', null, null, 'CONFUSERAY'],
  STEEL: ['IRONHEAD', 'MIRRORSHOT', 'IRONDEFENSE', null, null, 'METALSOUND'],
  FIRE: ['FIREPUNCH', 'EMBER', 'SUNNYDAY', null, 'INCINERATE', 'WILLOWISP'],
  WATER: ['CRABHAMMER', 'WATERGUN', 'AQUARING', null, 'SURF', 'WATERSPORT'],
  GRASS: ['VINEWHIP', 'MEGADRAIN', 'COTTONGUARD', 'RAZORLEAF', null, 'SPORE'],
  ELECTRIC: ['THUNDERPUNCH', 'THUNDERSHOCK', 'CHARGE', null, 'DISCHARGE', 'THUNDERWAVE'],
  PSYCHIC: ['ZENHEADBUTT', 'CONFUSION', 'CALMMIND', null, 'SYNCHRONOISE', 'MIRACLEEYE'],
  ICE: ['ICEPUNCH', 'ICEBEAM', 'MIST', null, 'POWDERSNOW', 'HAIL'],
  DRAGON: ['DRAGONCLAW', 'DRAGONRAGE', 'DRAGONDANCE', null, 'TWISTER', null],
  DARK: ['PURSUIT', 'DARKPULSE', 'HONECLAWS', null, 'SNARL', 'EMBARGO'],
  FAIRY: ['TACKLE', 'FAIRYWIND', 'MOONLIGHT', null, 'SWIFT', 'SWEETKISS'],
});

// Objetivos (GameData::Target): nº de objetivos > 1 o que afectan al bando rival (affects_foe_side).
const MULTI_TARGETS = ['AllNearFoes', 'AllNearOthers', 'AllFoes', 'AllBattlers', 'BothSides', 'FoeSide', 'UserAndAllies', 'AllAllies'];
const NO_TARGETS = ['User', 'UserSide', 'BothSides', 'FoeSide', 'None'];

/**
 * Animación de un movimiento (pbFindMoveAnimDetails): el rival busca primero la versión "OppMove" (que se reproduce
 * sin voltear, con los papeles de usuario y objetivo intercambiados). `hitNum` elige la variante siguiente ("hit 2",
 * "charging"), pero solo si esa animación no pertenece a otro movimiento (en Essentials se tomaría sin comprobar).
 * @returns {{ index: number, oppMove: boolean } | null}
 */
export function findMoveAnimDetails(index, moveId, userIndex, hitNum = 0) {
  if (!index || !moveId) return null;
  let anim = null;
  let oppMove = false;
  if ((userIndex & 1) === 0) {
    anim = index.moves?.[moveId];
  } else {
    anim = index.oppMoves?.[moveId];
    oppMove = anim !== undefined;
    if (anim === undefined) anim = index.moves?.[moveId];
  }
  if (anim === undefined || anim === null) return null;
  if (hitNum > 0) {
    const name = index.names?.[anim + hitNum];
    const foreign = name === undefined || /^(Opp)?Move:|^Common:/.test(name);
    if (!foreign) return { index: anim + hitNum, oppMove };
  }
  return { index: anim, oppMove };
}

/**
 * pbFindMoveAnimation: la del movimiento; si no hay, la por defecto de su tipo y clase; si no, la de Placaje.
 * `move` = datos de moves.json ({ id, type, category, target }).
 */
export function findMoveAnimation(index, move, userIndex, hitNum = 0) {
  if (!move) return null;
  const own = findMoveAnimDetails(index, move.id, userIndex, hitNum);
  if (own) return own;
  const defaults = TYPE_DEFAULT_ANIM[move.type];
  if (defaults) {
    let kind = { Physical: 0, Special: 1, Status: 2 }[move.category] ?? 0;
    if (MULTI_TARGETS.includes(move.target)) kind += 3;
    if (move.category === 'Status' && !NO_TARGETS.includes(move.target)) kind += 3;
    kind = Math.min(kind, 5);
    const tries = [defaults[kind], kind >= 3 ? defaults[kind - 3] : null, defaults[2]];
    for (const id of tries) {
      const found = id ? findMoveAnimDetails(index, id, userIndex) : null;
      if (found) return found;
    }
  }
  return findMoveAnimDetails(index, 'TACKLE', userIndex);
}

/** Cel compacto (tools/lib/anilAnims.mjs) → objeto con todos los campos. */
export function expandCel(c) {
  if (!Array.isArray(c)) return null;
  const zoomX = c[5] ?? 100;
  return {
    pattern: c[0], x: c[1], y: c[2], focus: c[3] ?? 4, priority: c[4] ?? 1, zoomX, zoomY: c[6] ?? zoomX,
    angle: c[7] ?? 0, mirror: Boolean(c[8]), blend: c[9] ?? 0, opacity: c[10] ?? 255, visible: (c[11] ?? 1) === 1,
    color: c[12] || null, tone: c[13] || null,
  };
}

/** Fotograma lógico → fotograma de la animación (o -1 al terminar). */
export function animFrameAt(tick, length) {
  const f = Math.floor(tick / TICKS_PER_FRAME);
  return f >= length ? -1 : f;
}

/** Rectángulo de la celda `pattern` en una hoja de ancho×alto (pbSpriteSetAnimFrame: filas de 5 celdas de 192). */
export function cellRect(pattern, width, height) {
  const x = (pattern % CELLS_PER_ROW) * CELL;
  const y = Math.floor(pattern / CELLS_PER_ROW) * CELL;
  return { x, y, w: CELL, h: CELL, inside: x + CELL <= width + 0.5 && y + CELL <= height + 0.5 };
}

// transformPoint de Essentials: proyecta un punto de la línea origen (usuario→objetivo del editor) sobre la real.
function yaxisIntersect(x1, y1, x2, y2, px, py) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return [dx === 0 ? 0 : (px - x1) / dx, dy === 0 ? 0 : (py - y1) / dy];
}

export function transformPoint(src, dst, px, py) {
  const [tx, ty] = yaxisIntersect(src[0], src[1], src[2], src[3], px, py);
  return [dst[0] + tx * (dst[2] - dst[0]), dst[1] + ty * (dst[3] - dst[1])];
}

export function isReversed(src0, src1, dst0, dst1) {
  if (src0 === src1) return false;
  return src0 < src1 ? dst0 > dst1 : dst0 < dst1;
}

/**
 * Posición en pantalla de un cel (PBAnimationPlayerX#update): foco 1 = objetivo, 2 = usuario (desplazados según su
 * centro real), 3 = usuario y objetivo (línea transformada; voltea el dibujo si la dirección se invierte), 4 = pantalla.
 * ctx: { userOrig: [x, y], targetOrig: [x, y], srcLine: [x1, y1, x2, y2], dstLine: [...] }.
 * @returns {{ x: number, y: number, mirror: boolean } | null}  null si el foco 3 no tiene líneas
 */
export function placeCel(cel, ctx) {
  let { x, y } = cel;
  let mirror = cel.mirror;
  if (cel.focus === 1) {
    x += ctx.targetOrig[0] - FOCUSTARGET_X;
    y += ctx.targetOrig[1] - FOCUSTARGET_Y;
  } else if (cel.focus === 2) {
    x += ctx.userOrig[0] - FOCUSUSER_X;
    y += ctx.userOrig[1] - FOCUSUSER_Y;
  } else if (cel.focus === 3) {
    if (!ctx.srcLine || !ctx.dstLine) return null;
    [x, y] = transformPoint(ctx.srcLine, ctx.dstLine, x, y);
    if (isReversed(ctx.srcLine[0], ctx.srcLine[2], ctx.dstLine[0], ctx.dstLine[2]) && cel.pattern >= 0) mirror = !mirror;
  }
  return { x, y, mirror };
}

/** Líneas de pbAnimationCore: del editor (usuario 128,224 → objetivo 384,96) a los centros reales. */
export function lineTransform(userPos, userHeight, targetPos, targetHeight) {
  return {
    srcLine: [FOCUSUSER_X, FOCUSUSER_Y, FOCUSTARGET_X, FOCUSTARGET_Y],
    dstLine: [userPos[0], userPos[1] - userHeight / 2, targetPos[0], targetPos[1] - targetHeight / 2],
  };
}

/** Orden de dibujo de un cel de efecto según su prioridad (pbSpriteSetAnimFrame; z de Essentials → renderOrder). */
export function celOrder(cel, userOrder, targetOrder) {
  switch (cel.priority) {
    case 0: return 14; // detrás de todo (z 10: sobre fondo, bases y sombras; bajo los Pokémon)
    case 2:
      if (cel.focus === 1) return targetOrder !== null && targetOrder !== undefined ? targetOrder - 0.5 : 20;
      if (cel.focus === 2) return userOrder !== null && userOrder !== undefined ? userOrder - 0.5 : 20;
      return 20;
    case 3:
      if (cel.focus === 1) return targetOrder !== null && targetOrder !== undefined ? targetOrder + 0.5 : 80;
      if (cel.focus === 2) return userOrder !== null && userOrder !== undefined ? userOrder + 0.5 : 80;
      return 80;
    default: return 80; // delante de todo
  }
}

/** Estado inicial de una capa de fondo o frente de la animación (bgGraphic/bgColor o foGraphic/foColor). */
export function emptyLayer() {
  return {
    graphic: null, ox: 0, oy: 0, opacity: 0, color: [0, 0, 0, 0], // AnimatedPlane
    plainColor: [0, 0, 0, 0], plainOpacity: 0, // ColoredPlane
    old: [],
  };
}

const lerpNum = (a, b, f) => a + (b - a) * f;

/**
 * Temporizaciones de un fotograma (PBAnimation#playTiming), en orden: primero las interpolaciones (tipos 2 y 4,
 * fotogramas (frame, frame + duración]), después las del fotograma (0 = SE, 1/3 = fijar fondo/frente, 2/4 = guardar el
 * estado de partida). Devuelve nuevos estados { bg, fg } y la lista de SE a reproducir [{ name, volume, pitch }]
 * (name vacío = grito del usuario). No muta los estados recibidos.
 */
export function applyTimings(timing, frame, state) {
  const bg = { ...state.bg, color: [...state.bg.color], plainColor: [...state.bg.plainColor] };
  const fg = { ...state.fg, color: [...state.fg.color], plainColor: [...state.fg.plainColor] };
  const layerOf = (type) => (type === 1 || type === 2 ? bg : fg);
  const sounds = [];
  for (const t of timing) {
    const dur = t.duration ?? 5;
    if (dur <= 0 || t.frame + dur < frame || t.frame >= frame) continue;
    if (t.type !== 2 && t.type !== 4) continue;
    const L = layerOf(t.type);
    const f = (frame - t.frame) / dur;
    const [ox0 = 0, oy0 = 0, op0 = 0, col0 = [0, 0, 0, 0]] = L.old;
    const col = [t.colorRed, t.colorGreen, t.colorBlue, t.colorAlpha].map((v, i) => (typeof v === 'number' ? lerpNum(col0[i], v, f) : col0[i]));
    if (!L.graphic) {
      if (typeof t.opacity === 'number') L.plainOpacity = lerpNum(op0, t.opacity, f);
      L.plainColor = col;
    } else {
      // Fórmulas literales de Essentials (ox = viejo − (bgX − viejo)·f)
      if (typeof t.bgX === 'number') L.ox = ox0 - (t.bgX - ox0) * f;
      if (typeof t.bgY === 'number') L.oy = oy0 - (t.bgY - oy0) * f;
      if (typeof t.opacity === 'number') L.opacity = lerpNum(op0, t.opacity, f);
      L.color = col;
    }
  }
  for (const t of timing) {
    if (t.frame !== frame) continue;
    if (t.type === 0) {
      sounds.push({ name: t.name || '', volume: t.volume ?? 80, pitch: t.pitch ?? 100 });
    } else if (t.type === 1 || t.type === 3) {
      const L = layerOf(t.type);
      const color = [t.colorRed || 0, t.colorGreen || 0, t.colorBlue || 0, t.colorAlpha || 0];
      if (t.name) {
        Object.assign(L, { graphic: t.name, ox: -(t.bgX || 0), oy: -(t.bgY || 0), color, opacity: t.opacity || 0, plainOpacity: 0 });
      } else {
        Object.assign(L, { graphic: null, opacity: 0, plainColor: color, plainOpacity: t.opacity || 0 });
      }
    } else if (t.type === 2 || t.type === 4) {
      const L = layerOf(t.type);
      L.old = L.graphic ? [L.ox, L.oy, L.opacity, [...L.color]] : [0, 0, L.plainOpacity, [...L.plainColor]];
    }
  }
  return { bg, fg, sounds };
}
