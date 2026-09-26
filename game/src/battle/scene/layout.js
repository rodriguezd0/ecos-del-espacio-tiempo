// Geometría de la escena de combate (módulo PURO, sin DOM ni Three.js).
// Portada de Battle::Scene de Añil (031_Scene/002 y 007) + plugin "Pokémon Animados para DBK" ([004] Game Data,
// [006] Battler Sprites, [008] Deluxe Bitmap): sprites frontales ×2, traseros ×3 (o la escala de la métrica),
// sombra = silueta aplastada centrada H/4 por encima de la base, métricas × 2, métricas de hembra.
// Coordenadas en píxeles de pantalla (512×384, y hacia abajo) con la cámara en su vista por defecto.

export const SCREEN_W = 512;
export const SCREEN_H = 384;
export const MESSAGE_Y = SCREEN_H - 96; // barra de mensajes / menús

export const PLAYER_BASE = Object.freeze({ x: 128, y: SCREEN_H - 80 + 100 }); // centro inferior de la base propia
export const FOE_BASE = Object.freeze({ x: SCREEN_W - 128, y: (SCREEN_H * 3) / 4 - 112 - 18 });

export const FRONT_SCALE = 2;
export const BACK_SCALE = 3;
export const SHADOW_OPACITY = 100 / 255;

/**
 * Escala del sprite de un combatiente según su bando (0 jugador → espalda ×3). El tercer valor de
 * BackSprite/FrontSprite de la métrica la sustituye (SpeciesMetrics#back_sprite_scale / front_sprite_scale).
 */
export function spriteScale(index, metrics = null) {
  const back = (index & 1) === 0;
  const custom = Number((back ? metrics?.back : metrics?.front)?.[2]);
  if (custom > 0) return custom;
  return back ? BACK_SCALE : FRONT_SCALE;
}

/** Centro inferior del sprite de un combatiente (sin métricas), como pbBattlerPosition. */
export function battlerPosition(index, sideSize = 1) {
  const ret = (index & 1) === 0 ? [PLAYER_BASE.x, PLAYER_BASE.y - 100] : [FOE_BASE.x, FOE_BASE.y + 18];
  if (sideSize === 2) {
    ret[0] += [-48, 48, 32, -32][index] ?? 0;
    ret[1] += [0, 0, 16, -16][index] ?? 0;
  } else if (sideSize === 3) {
    ret[0] += [-80, 80, 0, 0, 80, -80][index] ?? 0;
    ret[1] += [0, 0, 8, -8, 16, -16][index] ?? 0;
  }
  return { x: ret[0], y: ret[1] };
}

/** Centro inferior del sprite de un entrenador (pbTrainerPosition). */
export function trainerPosition(side, index = 0, count = 1) {
  const ret = side === 0 ? [PLAYER_BASE.x, PLAYER_BASE.y - 16] : [FOE_BASE.x, FOE_BASE.y + 6];
  if (count === 2) {
    ret[0] += [-48, 48, 32, -32][2 * index + side] ?? 0;
    ret[1] += [0, 0, 0, -16][2 * index + side] ?? 0;
  }
  return { x: ret[0], y: ret[1] };
}

/**
 * Métricas de especie + forma + sexo, como GameData::SpeciesMetrics.get_species_form del plugin de Añil:
 * una entrada propia de la forma ([ESPECIE,forma]) o de la hembra ([ESPECIE,,female], solo si la especie tiene
 * la marca HasGenderedSprites) es COMPLETA (lo que no define toma el valor por defecto, no el de la especie);
 * si no existe, se usan las de la especie base.
 */
export function speciesMetrics(db, species, form = 0, female = false) {
  const sp = db?.species?.[species];
  if (!sp) return {};
  const gendered = Boolean(female) && (sp.flags || []).includes('HasGenderedSprites');
  if (form) {
    const fm = sp.forms?.[form];
    if (gendered && fm?.metricsFemale) return fm.metricsFemale;
    if (fm?.metrics) return fm.metrics;
  } else if (gendered && sp.metricsFemale) {
    return sp.metricsFemale;
  }
  return sp.metrics || {};
}

/** Desplazamiento del sprite por métricas (apply_metrics_to_sprite): la altitud solo si la métrica la define. */
export function spriteOffset(metrics, index) {
  const m = metrics || {};
  if ((index & 1) === 0) {
    const [x = 0, y = 0] = m.back || [];
    return { dx: x * 2, dy: y * 2 };
  }
  const [x = 0, y = 0] = m.front || [];
  return { dx: x * 2, dy: y * 2 - (m.altitude || 0) * 2 };
}

/**
 * Colocación de la sombra (BattlerShadowSprite de DBK): silueta negra del frame actual con origen en su centro,
 * en battlerPosition − H/4 (división entera de Ruby) + (métrica del sprite + ShadowSprite) × 2, con
 * zoom_x = 1 + t·0,1 y zoom_y = 0,25 + t·0,025, donde t = ShadowSize − 1 si es positivo (1 por defecto → t = 0).
 * `height` = alto del bitmap escalado (lado del frame × escala). ShadowSize 0 → sin sombra.
 * Devuelve el centro relativo a battlerPosition.
 */
export function shadowPlacement(metrics, index, height) {
  const m = metrics || {};
  const size0 = m.shadowSize ?? 1;
  if (size0 === 0) return { visible: false, dx: 0, dy: 0, zoomX: 0, zoomY: 0 };
  const size = size0 > 0 ? size0 - 1 : size0;
  const [sx = 0, syBack = 0, syFront = 0] = m.shadow || [];
  const player = (index & 1) === 0;
  const [bx = 0, by = 0] = (player ? m.back : m.front) || [];
  return {
    visible: true,
    dx: bx * 2 + sx * 2,
    dy: by * 2 + (player ? syBack : syFront) * 2 - Math.floor(Math.round(height) / 4),
    zoomX: 1 + size * 0.1,
    zoomY: 0.25 + size * 0.025,
  };
}

/**
 * Pasos lógicos (60 Hz) por frame de la animación del sprite. DeluxeBitmapWrapper#update avanza cuando han
 * pasado (speed/2 × ANIMATION_FRAME_DELAY 60) ms, comprobándolo en cada fotograma: ceil(retardo × 60).
 * AnimationSpeed = espalda[,frente]: `animSpeedFront` solo para el frente.
 */
export function spriteFrameTicks(metrics, back = true) {
  const raw = back ? metrics?.animSpeed : (metrics?.animSpeedFront ?? metrics?.animSpeed);
  const s = Number(raw ?? 2);
  if (!(s > 0)) return 0;
  const delayMs = Math.round((s / 2) * 60);
  return Math.max(1, Math.ceil((delayMs / 1000) * 60 - 1e-9));
}

/**
 * Frames de una hoja de Pokémon (DeluxeBitmapWrapper#refresh): si el ancho supera el doble del alto es una tira de
 * ceil(ancho/alto) frames cuadrados; si no, un único frame del tamaño de la imagen.
 */
export function stripFrames(width, height) {
  if (width > height * 2) return { frames: Math.ceil(width / height), fw: height, fh: height };
  return { frames: 1, fw: width, fh: height };
}

/**
 * Rutas candidatas del sprite de un Pokémon en el orden de GameData::Species.check_graphic_file de Essentials:
 * se prueban todas las combinaciones de factores (variocolor, hembra, forma) descartando primero el de menor
 * prioridad (variocolor → hembra → forma). `folder` = 'Front' | 'Back'.
 */
export function spriteFileCandidates({ species, form = 0, female = false, shiny = false }, folder) {
  const factors = [];
  if (shiny) factors.push(['shiny', true]);
  if (female) factors.push(['female', true]);
  if (form) factors.push(['form', true]);
  const out = [];
  for (let i = 0; i < 2 ** factors.length; i++) {
    const on = Object.fromEntries(factors.map(([k], j) => [k, (i & (2 ** j)) === 0]));
    const dir = on.shiny ? `${folder} shiny` : folder;
    const name = `${species}${on.form ? `_${form}` : ''}${on.female ? '_female' : ''}`;
    out.push(`Graphics/Pokemon/${dir}/${name}.png`);
  }
  return out;
}

/**
 * Caja de datos: posición en pantalla y qué muestra (PokemonDataBox#initializeDataBoxGraphic).
 * @returns {{ x, y, baseX, thin, showNumbers, showPercent, showExp, w, h }}
 */
export function dataBoxLayout(index, sideSize = 1) {
  const player = (index & 1) === 0;
  const thin = sideSize > 1;
  let x = player ? SCREEN_W - 244 : -16;
  let y = player ? SCREEN_H - 192 : 36;
  if (sideSize === 2) {
    x += [-12, 12, 0, 0][index] ?? 0;
    y += [-20, -39, 34, 25][index] ?? 0;
  }
  const h = thin ? (player ? 66 : 70) : (player ? 84 : 70);
  return {
    x, y, w: 260, h, thin,
    baseX: player ? 34 : 16,
    showNumbers: player && !thin,
    showExp: player && !thin,
    showPercent: !player,
  };
}

/** Elipses de las bases del suelo (dibujadas; los fondos de Añil no traen bases). */
export const BASE_ELLIPSES = Object.freeze({
  0: Object.freeze({ cx: PLAYER_BASE.x, cy: PLAYER_BASE.y - 76, rx: 150, ry: 40 }),
  1: Object.freeze({ cx: FOE_BASE.x, cy: FOE_BASE.y + 12, rx: 116, ry: 28 }),
});

/** Barras de "alineación" del equipo (LineupAppear). */
export const LINEUP_BAR_W = 248;
export function lineupLayout(side) {
  if (side === 0) {
    const barX = SCREEN_W - LINEUP_BAR_W;
    const barY = SCREEN_H - 142;
    return { barX, barY, ballX: barX + 44, ballY: barY - 30, step: 32, mirror: true };
  }
  const barX = LINEUP_BAR_W;
  const barY = 114;
  return { barX: barX - 440, barY, ballX: barX - 44 - 30, ballY: barY - 30, step: -32, mirror: false };
}

/**
 * Botones del menú de objetivo (TargetMenu). Devuelve [{ index, x, y, w }] para cada posición
 * existente; los rivales (índices impares) van en la fila superior.
 */
export function targetButtons(sideSizes) {
  const [s0, s1] = sideSizes;
  const maxIndex = s0 > s1 ? (s0 - 1) * 2 : s1 * 2 - 1;
  const small = Math.max(s0, s1) > 2;
  const w = small ? 170 : 236;
  const out = [];
  for (let i = 0; i <= maxIndex; i++) {
    const n = sideSizes[i % 2];
    if (n <= Math.floor(i / 2)) continue;
    const inc = i % 2 === 0 ? Math.floor(i / 2) : n - 1 - Math.floor(i / 2);
    const x0 = small ? 170 - [0, 82, 166][n - 1] : 138 - [0, 116][n - 1];
    out.push({ index: i, x: x0 + (w - 4) * inc, y: MESSAGE_Y + 6 + 42 * ((i + 1) % 2), w, small });
  }
  return out;
}

/** Posición de los 4 botones de comando/movimiento (i par izquierda, fila 0 arriba). */
export function commandButton(i) {
  return { x: SCREEN_W - 260 + (i % 2 === 0 ? 0 : 126), y: MESSAGE_Y + 6 + (i < 2 ? 0 : 42), w: 130, h: 46 };
}
export function moveButton(i) {
  return { x: 4 + (i % 2 === 0 ? 0 : 188), y: MESSAGE_Y + 6 + (i < 2 ? 0 : 42), w: 192, h: 46 };
}

/** Siguiente índice de una rejilla 2×2 (0 1 / 2 3) al pulsar una dirección; `valid(i)` filtra. */
export function gridMove(index, dir, valid = () => true) {
  const col = index % 2;
  const row = index < 2 ? 0 : 1;
  let next = index;
  if (dir === 'LEFT' && col === 1) next = index - 1;
  else if (dir === 'RIGHT' && col === 0) next = index + 1;
  else if (dir === 'UP' && row === 1) next = index - 2;
  else if (dir === 'DOWN' && row === 0) next = index + 2;
  return valid(next) ? next : index;
}

/** Punto de impacto (centro visual aproximado) de un combatiente para las animaciones. */
export function focusPoint(index, sideSize, spriteH = 0) {
  const p = battlerPosition(index, sideSize);
  const h = spriteH || ((index & 1) === 0 ? 150 : 100);
  return { x: p.x, y: p.y - Math.round(h * 0.45) };
}
