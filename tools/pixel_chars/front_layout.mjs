// Composición de retratos de entrenador en la rejilla nativa. El PNG se exporta después a ×2,
// sin interpolación ni cambios de escala en el juego. La figura deja aire por encima de la cabeza.
import { Img, strayPixels } from '../pixel.mjs';
import { silhouette } from './raster.mjs';

export function finishFront(drawing, outline, { height = 62, head = null } = {}) {
  if (head) {
    drawing = drawing.clone();
    // Cabeza independiente del cuerpo y del atrezo: cuatro cabezas por figura, barbilla en el cuello.
    for (let y = 6; y < 80; y++) for (let x = 18; x < 64; x++) {
      const sx = Math.floor(40 + (x + 0.5 - 40) / 0.8);
      const sy = Math.floor(27 + (y + 0.5 - 27) / 0.74);
      if (sx < 0 || sx >= head.w || sy < 0 || sy >= head.h) continue;
      const c = head.get(sx, sy);
      if (c[3]) drawing.set(x, y, c);
    }
  }
  const b = drawing.bbox();
  const scale = height / b.h;
  const w = Math.round(b.w * scale);
  const out = new Img(80, 80);
  const ox = Math.floor((80 - w) / 2);
  const oy = 77 - height;
  for (let y = 0; y < height; y++) for (let x = 0; x < w; x++) {
    const sx = b.x + Math.min(b.w - 1, Math.floor((x + 0.5) * b.w / w));
    const sy = b.y + Math.min(b.h - 1, Math.floor((y + 0.5) * b.h / height));
    out.set(ox + x, oy + y, drawing.get(sx, sy));
  }
  for (const [x, y] of strayPixels(out)) out.set(x, y, [0, 0, 0, 0]);
  const feet = out.bbox();
  const aligned = new Img(80, 80).blit(out, 0, 77 - feet.y - feet.h);
  return silhouette(aligned, outline);
}
