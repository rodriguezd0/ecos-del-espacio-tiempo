// Resolución y carga de hojas de personaje (charsets 4×4 de cualquier tamaño).
// Claves admitidas:
//   ''                         sin gráfico
//   'follower:ESPECIE:forma:shiny'  seguidor de Añil (Graphics/Characters/Followers[ shiny]/ESPECIE[_forma].png)
//   'anil:nombre' o 'nombre'   Graphics/Characters/nombre.png de Añil
//   id del registro            content/characters.js (arte propio de Axis)
//   'asset:ruta.png'           game/assets/ruta.png
import { engine } from '../core/engine.js';
import { loadRawTexture } from './textures.js';
import { followerScale, sheetContentExtent, parseFollowerKey } from './followerSize.js';
import { measureCharsetFootprint, registerCharsetFootprint } from '../world/followerSpacing.js';

const cache = new Map();
const loaded = new Map();
let registryPromise = null;

function registry() {
  if (!registryPromise) {
    registryPromise = import('../content/characters.js')
      .then((m) => m.getCharacter || ((id) => m.CHARACTERS?.[id] || null))
      .catch(() => () => null);
  }
  return registryPromise;
}

/** URLs candidatas (en orden) para una clave de gráfico. */
export async function charsetUrls(key) {
  if (!key) return [];
  const a = engine.assets;
  if (key.startsWith('follower:')) {
    const [, species, form = '0', shiny = '0'] = key.split(':');
    const base = shiny === '1' ? 'Graphics/Characters/Followers shiny/' : 'Graphics/Characters/Followers/';
    const plain = 'Graphics/Characters/Followers/';
    const urls = [];
    if (form !== '0') urls.push(a.anil(`${base}${species}_${form}.png`));
    urls.push(a.anil(`${base}${species}.png`));
    if (shiny === '1') urls.push(a.anil(`${plain}${species}.png`));
    return urls;
  }
  if (key.startsWith('asset:')) return [`assets/${key.slice(6)}`];
  if (key.startsWith('anil:')) {
    // Alias de clase de entrenador ('anil:bichero' → cazabichos.png, content/anilClasses.js).
    const alias = (await registry())(key);
    const direct = a.anil(`Graphics/Characters/${key.slice(5)}.png`);
    return alias?.alias && alias.file ? [alias.file, direct] : [direct];
  }
  const get = await registry();
  const entry = get(key);
  if (entry?.file) return [entry.file];
  return [a.anil(`Graphics/Characters/${key}.png`)];
}

/**
 * Carga una hoja → { tex, width, height, frameW, frameH, offset } o null si no existe.
 * `offset` = true si el nombre contiene "offset" (Essentials lo dibuja 16 px más abajo).
 * `scale` = escala de dibujo (1; < 1 para los seguidores de Añil demasiado grandes, ver followerSize.js).
 */
export function loadCharset(key) {
  if (!key) return Promise.resolve(null);
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      for (const url of await charsetUrls(key)) {
        try {
          const tex = await loadRawTexture(url);
          const img = tex.image;
          const sheet = {
            key, url, tex, width: img.width, height: img.height, frameW: img.width / 4, frameH: img.height / 4,
            offset: /offset/i.test(key), scale: charsetGeometry(key, img),
          };
          loaded.set(key, sheet);
          return sheet;
        } catch { /* probar la siguiente */ }
      }
      console.warn(`Gráfico de personaje no encontrado: "${key}"`);
      return null;
    })());
  }
  return cache.get(key);
}

/** Hoja ya disponible, sin esperar otra microtarea de su promesa cacheada. */
export function loadedCharset(key) { return loaded.get(key) || null; }

/** Medición única al cargar: conserva la escala existente y publica los límites opacos del dibujo. */
function charsetGeometry(key, img) {
  const f = parseFollowerKey(key);
  try {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const rgba = g.getImageData(0, 0, img.width, img.height).data;
    const extent = f ? sheetContentExtent(rgba, img.width, img.height) : 0;
    const sp = f && engine.data?.species?.[f.species];
    const height = (f?.form ? sp?.forms?.[f.form]?.height : null) ?? sp?.height;
    const scale = f ? followerScale(extent, height, f.species) : 1;
    registerCharsetFootprint(key, measureCharsetFootprint(rgba, img.width, img.height, { scale, offset: /offset/i.test(key) }));
    return scale;
  } catch (err) {
    console.warn(`[charsets] No se pudo medir ${key}`, err);
    return 1;
  }
}

/** Charsets del jugador (andar/correr/surf) según género, con arte provisional de Axis si existe. */
export async function playerCharsets(gender = 'M') {
  const base = gender === 'F' ? 'protagonista_f' : 'protagonista_m';
  const get = await registry();
  const entry = get(base);
  const fallbackWalk = gender === 'F' ? 'trchar001' : 'trchar000';
  if (!entry) {
    const direct = `asset:characters/${base}.png`;
    const ok = await loadCharset(direct);
    if (ok) return { walk: direct, run: (await loadCharset(`asset:characters/${base}_run.png`)) ? `asset:characters/${base}_run.png` : direct, surf: direct };
    return { walk: fallbackWalk, run: fallbackWalk, surf: fallbackWalk };
  }
  const runEntry = get(`${base}_run`);
  let run = runEntry ? `${base}_run` : base;
  if (!runEntry && entry.file?.endsWith('.png')) {
    const guess = `asset:${entry.file.replace(/^assets\//, '').replace(/\.png$/, '_run.png')}`;
    if (await loadCharset(guess)) run = guess;
  }
  return { walk: base, run, surf: base };
}
