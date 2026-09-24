// Deriva la definición de una biblioteca a partir de otra de un tileset hermano (misma disposición de IDs).
// Las listas de piezas compartidas se obtienen con `node tools/stamps_compat.mjs <origen> <destino>` y se
// revisan con `node tools/preview_stamps.mjs <Imagen>` antes de darlas por buenas.

const pick = (obj, names) => Object.fromEntries(names.map((n) => {
  if (!obj[n]) throw new Error(`derive: "${n}" no existe en la biblioteca base`);
  return [n, obj[n]];
}));
const omit = (obj, names) => Object.fromEntries(Object.entries(obj).filter(([n]) => !names.includes(n)));

/**
 * @param {object} base definición origen
 * @param {{ tileset: number, image: string, preview?: object,
 *   stamps: { include?: string[], exclude?: string[], add?: object },
 *   brushes: { include?: string[], exclude?: string[], add?: object } }} spec
 *   `add` añade o sustituye entradas (p. ej. descripciones o IDs propios del tileset destino).
 */
export function deriveLibrary(base, spec) {
  const select = (entries, sel = {}) => ({
    ...(sel.include ? pick(entries, sel.include) : omit(entries, sel.exclude || [])),
    ...(sel.add || {}),
  });
  return {
    tileset: spec.tileset,
    image: spec.image,
    preview: spec.preview || base.preview,
    derivedFrom: base.image,
    stamps: select(base.stamps, spec.stamps),
    brushes: select(base.brushes, spec.brushes),
  };
}
