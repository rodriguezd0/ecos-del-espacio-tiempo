// Gráficos de Pokémon para la UI: iconos animados (Icons/<ID>.png, 2 frames 64×64) y sprites de
// frente/espalda animados (tiras horizontales de frames cuadrados, dibujados a ×2 como en Añil).
import { engine } from '../../core/engine.js';
import { anil, img, failed, preload } from './images.js';

function candidates(folder, species, form, shiny) {
  const dirs = shiny ? [`${folder} shiny`, folder] : [folder];
  const out = [];
  for (const d of dirs) {
    if (form) out.push(anil(`Graphics/Pokemon/${d}/${species}_${form}.png`));
    out.push(anil(`Graphics/Pokemon/${d}/${species}.png`));
  }
  return out;
}

/** Primera imagen disponible de la lista (lanza la carga de las pendientes en orden). */
function firstAvailable(urls) {
  for (const u of urls) {
    const im = img(u);
    if (im) return im;
    if (!failed(u)) return null; // todavía cargando: esperar antes de probar la siguiente
  }
  return null;
}

export function iconUrls(p) {
  if (p?.egg) return [anil('Graphics/Pokemon/Eggs/000_icon.png')];
  return candidates('Icons', p.species, p.form || 0, p.shiny);
}

export function spriteUrls(p, back = false) {
  return candidates(back ? 'Back' : 'Front', p.species, p.form || 0, p.shiny);
}

/** Precarga icono y (opcional) sprite de una lista de Pokémon. */
export function preloadPokemon(list, { sprites = false } = {}) {
  const urls = [];
  for (const p of list) {
    if (!p) continue;
    urls.push(...iconUrls(p));
    if (sprites) urls.push(...spriteUrls(p));
  }
  return preload(urls);
}

/**
 * Frames por paso de animación del icono según PS (PokemonIconSprite#counterLimit de Essentials):
 * verde 0,25 s por ciclo, amarillo ×2, rojo ×4, debilitado sin animación.
 */
export function iconFrameTicks(p) {
  if (!p || p.hp <= 0) return 0;
  let ticks = 15;
  const max = p.maxHp || p.hpMax || p._maxHp;
  if (max) {
    if (p.hp <= max / 4) ticks *= 4;
    else if (p.hp <= max / 2) ticks *= 2;
  }
  return Math.max(1, Math.floor(ticks / 2));
}

/**
 * Dibuja el icono animado centrado en (cx, cy).
 * opts: { t, selected, maxHp, scale }
 */
export function drawPokemonIcon(g, p, cx, cy, opts = {}) {
  if (!p) return;
  const im = firstAvailable(iconUrls(p));
  if (!im) return;
  const scale = opts.scale || 1;
  const fw = im.height; // frames cuadrados
  const frames = Math.max(1, Math.floor(im.width / fw));
  const ticks = iconFrameTicks({ ...p, maxHp: opts.maxHp });
  const t = opts.t || 0;
  const frame = ticks > 0 ? Math.floor(t / ticks) % frames : 0;
  let y = cy;
  if (opts.selected && ticks > 0) y -= frame === 1 ? 4 : 0; // pequeño salto del seleccionado
  const w = fw * scale;
  g.drawImage(im, frame * fw, 0, fw, im.height, Math.round(cx - w / 2), Math.round(y - w / 2), w, w);
}

/** Ticks por frame del sprite animado (metrics.animSpeed de la especie; 2 por defecto). */
export function spriteTicks(p) {
  const sp = engine.data?.species?.[p.species];
  const form = sp?.forms?.[p.form || 0];
  const s = form?.metrics?.animSpeed ?? sp?.metrics?.animSpeed;
  return Math.max(1, Number(s) || 2);
}

/**
 * Dibuja el sprite animado de un Pokémon centrado en (cx, cy).
 * opts: { t, back, scale (2 por defecto), frame (fijo), silhouette: color }
 * @returns {{ w: number, h: number } | null}
 */
export function drawPokemonSprite(g, p, cx, cy, opts = {}) {
  if (!p) return null;
  const im = firstAvailable(spriteUrls(p, opts.back));
  if (!im) return null;
  const scale = opts.scale ?? 2;
  const fs = im.height;
  const frames = Math.max(1, Math.floor(im.width / fs));
  const frame = opts.frame !== undefined ? opts.frame % frames : Math.floor((opts.t || 0) / spriteTicks(p)) % frames;
  const w = fs * scale;
  const dx = Math.round(cx - w / 2);
  const dy = Math.round(cy - w / 2);
  if (opts.silhouette) {
    const c = silhouetteCanvas(im, frame, fs, opts.silhouette);
    g.drawImage(c, 0, 0, fs, fs, dx, dy, w, w);
  } else {
    g.drawImage(im, frame * fs, 0, fs, fs, dx, dy, w, w);
  }
  return { w, h: w };
}

let silCanvas = null;
function silhouetteCanvas(im, frame, fs, color) {
  if (!silCanvas) silCanvas = document.createElement('canvas');
  silCanvas.width = fs;
  silCanvas.height = fs;
  const g = silCanvas.getContext('2d');
  g.clearRect(0, 0, fs, fs);
  g.drawImage(im, frame * fs, 0, fs, fs, 0, 0, fs, fs);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, fs, fs);
  g.globalCompositeOperation = 'source-over';
  return silCanvas;
}
