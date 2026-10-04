// Sprite frontal de combate de la Guardiana del Umbral (D07), estilo BW (nativo 80×80 → 160×160).
// PROVISIONAL (D30). Veterana escéptica de ~60 años: brazos cruzados, pelo cano recogido, cejas
// rectas y arrugas; chaqueta de campo oliva abierta, pañuelo teja, correa de zurrón cruzada,
// pantalón de trabajo y botas altas. Sin emblemas.
import { Img, hex } from '../pixel.mjs';
import { ellipse, poly, capsule, rect, paint, silhouette, stamp, lineIn } from './raster.mjs';
import { FACE, FRONT_SIZE, drawHead } from './battle_front.mjs';
import { finishFront } from './front_layout.mjs';

const W = FRONT_SIZE;
const H = FRONT_SIZE;
const P = (pts) => poly(W, H, pts);
const everywhere = () => rect(W, H, 0, 0, W, H);

const C = {
  outline: '#1A1612',
  skin: { light: '#F4CCA4', base: '#DDA070', shadow: '#AE6E46', line: '#6A3E26' },
  hair: { light: '#F2F2F4', base: '#C6C6CE', shadow: '#9494A0', line: '#606070' },
  jacket: { light: '#A09A68', base: '#7A7442', shadow: '#56522C', line: '#36341A' },
  shirt: { light: '#5E6874', base: '#4A5260', shadow: '#363C48', line: '#22262E' },
  scarf: { light: '#C8664C', base: '#B0503A', shadow: '#80342A', line: '#4E1E18' },
  strap: { light: '#8A6444', base: '#6A4A30', shadow: '#4A3220', line: '#2A1C12' },
  pants: { light: '#6E5C48', base: '#5A4A3A', shadow: '#3E3228', line: '#221A12' },
  boots: { light: '#5E4C3E', base: '#3E2E22', shadow: '#2A1E16', line: '#140E0A' },
};

/** Cara de veterana: ojos estrechos, cejas rectas gruesas, patas de gallo y surcos junto a la boca. */
function drawOldFace(img) {
  const { cx, eyeY } = FACE;
  const all = everywhere();
  const pal = { k: C.outline, w: '#F4F0EC', I: '#4E4A40' };
  stamp(img, ['kkkk', 'wIIk'], pal, cx - 6, eyeY);
  stamp(img, ['kkkk', 'kIIw'], pal, cx + 2, eyeY);
  lineIn(img, all, cx - 7, eyeY - 2, cx - 3, eyeY - 2, C.hair.shadow); // cejas rectas
  lineIn(img, all, cx + 2, eyeY - 2, cx + 6, eyeY - 2, C.hair.shadow);
  lineIn(img, all, cx - 6, eyeY - 3, cx - 4, eyeY - 3, C.hair.line);
  lineIn(img, all, cx + 3, eyeY - 3, cx + 5, eyeY - 3, C.hair.line);
  img.set(cx - 7, eyeY + 1, hex(C.skin.shadow)); // patas de gallo
  img.set(cx + 6, eyeY + 1, hex(C.skin.shadow));
  img.set(cx, eyeY + 3, hex(C.skin.shadow)); // nariz
  lineIn(img, all, cx - 3, eyeY + 4, cx - 3, eyeY + 6, C.skin.shadow); // surcos
  lineIn(img, all, cx + 3, eyeY + 4, cx + 3, eyeY + 6, C.skin.shadow);
  lineIn(img, all, cx - 2, eyeY + 7, cx + 2, eyeY + 7, C.skin.line); // boca firme
}

/** Pelo cano peinado hacia atrás con raya al medio; el moño asoma por detrás a un lado. */
function drawHair(img) {
  const bun = ellipse(W, H, 51, 12, 4.5, 4);
  paint(img, bun, C.hair, { lightW: 1, shadowW: 2 });
  const hair = ellipse(W, H, 40, 12, 10.5, 8).and(rect(W, H, 0, 0, W, 14))
    .union(P([[29, 10], [32, 10], [32, 18], [29, 17]]), P([[48, 10], [51, 10], [51, 17], [48, 18]]))
    .minus(P([[33, 14], [47, 14], [47, 20], [33, 20]]));
  paint(img, hair, C.hair, { lightW: 2, shadowW: 2 });
  lineIn(img, hair, 40, 4, 40, 12, C.hair.shadow); // raya
  lineIn(img, hair, 36, 6, 32, 12, C.hair.shadow);
  lineIn(img, hair, 44, 6, 48, 12, C.hair.shadow);
}

export function buildGuardianaFront() {
  let img = new Img(W, H);
  paint(img, rect(W, H, 37, 25, 6, 6), C.skin, { lightW: 0 }); // cuello
  // Piernas y botas altas.
  paint(img, P([[32, 52], [48, 52], [46, 59], [38, 60], [33, 57]])
    .union(capsule(W, H, 35, 55, 32, 66, 3.5), capsule(W, H, 44, 55, 47, 64, 3.5)), C.pants);
  paint(img, P([[29, 62], [36, 63], [34, 74], [27, 75]]).union(ellipse(W, H, 30, 75, 5.5, 2.5)), C.boots, { lightW: 1 });
  paint(img, P([[43, 62], [50, 62], [53, 72], [46, 73]]).union(ellipse(W, H, 50, 73, 5.5, 2.5)), C.boots, { lightW: 1 });
  // Chaqueta de campo abierta sobre camisa oscura, con pañuelo al cuello.
  const torso = P([[30, 31], [38, 29], [49, 30], [53, 36], [48, 46], [51, 54], [44, 57], [29, 54], [32, 45], [27, 36]]);
  paint(img, torso, C.jacket, { shadowW: 4 });
  paint(img, P([[35, 29], [45, 29], [44, 55], [36, 55]]), C.shirt, { lightW: 1 });
  lineIn(img, torso, 35, 30, 34, 55, C.jacket.line);
  lineIn(img, torso, 45, 30, 46, 55, C.jacket.line);
  lineIn(img, torso, 33, 31, 29, 38, C.jacket.shadow); // solapas
  lineIn(img, torso, 47, 31, 51, 38, C.jacket.shadow);
  paint(img, P([[34, 28], [46, 28], [40, 36]]), C.scarf, { lightW: 1, shadowW: 1 });
  // Correa del zurrón cruzada (hombro derecho → cadera izquierda) y bolsillos de la chaqueta.
  paint(img, capsule(W, H, 50, 31, 29, 53, 1.6), C.strap, { lightW: 0, shadowW: 1 });
  paint(img, P([[25, 50], [31, 53], [30, 62], [23, 61], [20, 57], [22, 51]]), C.strap, { lightW: 1, shadowW: 2 });
  paint(img, rect(W, H, 27, 47, 7, 6), C.jacket, { lightW: 1, shadowW: 1 });
  paint(img, rect(W, H, 46, 47, 7, 6), C.jacket, { lightW: 1, shadowW: 1 });
  // Brazos cruzados: brazos junto al cuerpo y antebrazos en horizontal sobre el pecho.
  paint(img, capsule(W, H, 26, 33, 24, 44, 4.2), C.jacket);
  paint(img, capsule(W, H, 54, 33, 56, 44, 4.2), C.jacket);
  paint(img, capsule(W, H, 25, 44, 47, 40, 3.8), C.jacket, { shadowW: 2 });
  paint(img, ellipse(W, H, 50, 40, 3, 2.5), C.skin, { lightW: 1, shadowW: 1 });
  paint(img, capsule(W, H, 55, 44, 33, 43, 3.8), C.jacket, { shadowW: 2 });
  paint(img, ellipse(W, H, 30, 43, 3, 2.5), C.skin, { lightW: 1, shadowW: 1 });
  const body = img;
  img = new Img(W, H);
  drawHead(img, C.skin);
  drawHair(img);
  drawOldFace(img);
  return finishFront(body, C.outline, { head: img, height: 61 });
}
