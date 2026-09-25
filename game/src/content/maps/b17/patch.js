// Parches de tiles del Bloque 17: piezas de la biblioteca horneada (content/stamps/baked/<Imagen>.js) convertidas en
// listas [x, y, capa, id] para la propiedad `patch` de una página de evento (world/mapEvent.js). Así la ocupación de
// Genesis en el Mirador Sur (valla, caravana, contenedores, andamios) solo aparece del P8 al P9 sin tocar la
// construcción base del mapa. Módulo puro.

/** Tiles de un stamp horneado colocado en (x, y): [[x, y, capa, id]…] (solo casillas no vacías). */
export function stampPatch(baked, name, x, y) {
  const s = baked?.stamps?.[name];
  if (!s) throw new Error(`b17 patch: no existe el stamp horneado «${name}»`);
  const out = [];
  s.layers.forEach((layer, l) => {
    if (!layer) return;
    for (let j = 0; j < s.h; j++) {
      for (let i = 0; i < s.w; i++) {
        const id = layer[j * s.w + i];
        if (id) out.push([x + i, y + j, l, id]);
      }
    }
  });
  return out;
}

/** Tamaño de un stamp horneado ({ w, h }). */
export function stampSize(baked, name) {
  const s = baked?.stamps?.[name];
  return s ? { w: s.w, h: s.h } : { w: 0, h: 0 };
}

/**
 * Línea de valla de obra (stamp de 2×1 repetido) por las casillas `cells` (en orden): [[x, y, capa, id]…]. Las dos
 * mitades se alternan para que el tramo se lea continuo.
 */
export function barrierLine(baked, cells, name = 'barrera_obras') {
  const s = baked?.stamps?.[name];
  if (!s) throw new Error(`b17 patch: no existe el stamp horneado «${name}»`);
  const layer = s.layers.findIndex((l) => l && l.some(Boolean));
  const ids = s.layers[layer];
  return cells.map(([x, y], i) => [x, y, layer, ids[i % ids.length] || ids[0]]);
}
