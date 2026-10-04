// Sprites frontales de entrenador (estilo BW, nativo 80×80 → 160×160): Gael y el profesor.
// PROVISIONALES (D30). Gael: antecedente del autor (rubio, bordó, gris, botas azul oscuro, ojos claros,
// expresión seria sin cejas furiosas). Profesor: propuesta neutral sin emblemas (D03 abierto).
import { Img, hex } from '../pixel.mjs';
import { ellipse, poly, capsule, rect, paint, silhouette, stamp, lineIn } from './raster.mjs';
import { finishFront } from './front_layout.mjs';

export const FRONT_SIZE = 80;
const W = FRONT_SIZE;
const H = FRONT_SIZE;
export const FACE = { cx: 40, cy: 18, rx: 8, ry: 9, eyeY: 17 };

const P = (pts) => poly(W, H, pts);
const everywhere = () => rect(W, H, 0, 0, W, H);

/** Ojos 4×3 (pestaña, blanco exterior, iris y pupila), cejas rectas neutras, nariz y boca. */
function drawFace(img, { iris, pupil, brow, mouth, lash }) {
  const { cx, eyeY } = FACE;
  const pal = { k: lash, w: '#FFFFFF', I: iris, i: pupil };
  stamp(img, ['kkkk', 'wIIk', 'wiIk'], pal, cx - 6, eyeY);
  stamp(img, ['kkkk', 'kIIw', 'kIiw'], pal, cx + 2, eyeY);
  const all = everywhere();
  lineIn(img, all, cx - 6, eyeY - 2, cx - 3, eyeY - 2, brow);
  lineIn(img, all, cx + 2, eyeY - 2, cx + 5, eyeY - 2, brow);
  img.set(cx, eyeY + 4, hex(mouth));
  lineIn(img, all, cx - 1, eyeY + 7, cx + 1, eyeY + 7, mouth);
}

/** Cabeza: orejas + cara. */
export function drawHead(img, skin) {
  const { cx, cy, rx, ry } = FACE;
  paint(img, ellipse(W, H, cx - rx - 0.5, cy + 1, 2, 3).union(ellipse(W, H, cx + rx + 0.5, cy + 1, 2, 3)), skin, { lightW: 0, shadowW: 1 });
  paint(img, ellipse(W, H, cx, cy, rx, ry), skin, { lightW: 2, shadowW: 3 });
}

const GAEL = {
  outline: '#281810',
  skin: { light: '#FCE0C4', base: '#F2BC8E', shadow: '#C8845A', line: '#7A4A30' },
  hair: { light: '#F8F8C8', base: '#E0C870', shadow: '#A08840', line: '#604820' },
  jacket: { light: '#A03848', base: '#782030', shadow: '#481018', line: '#30080C' },
  shirt: { base: '#404040', shadow: '#303030', line: '#202020' },
  pants: { light: '#7A7A7A', base: '#606060', shadow: '#404040', line: '#282828' },
  boots: { light: '#5A7AB0', base: '#406090', shadow: '#203050', line: '#101828' },
};

export function buildGaelFront() {
  const c = GAEL;
  let img = new Img(W, H);
  paint(img, rect(W, H, 37, 25, 6, 6), c.skin, { lightW: 0 }); // cuello
  // Piernas y botas.
  const pants = P([[33, 50], [48, 51], [47, 56], [42, 60], [34, 56]])
    .union(capsule(W, H, 35, 54, 31, 65, 3.7), capsule(W, H, 44, 55, 46, 63, 3.5));
  paint(img, pants, c.pants, { lightW: 1, shadowW: 3 });
  lineIn(img, pants, 32, 61, 36, 60, c.pants.shadow);
  paint(img, P([[28, 64], [34, 63], [31, 74], [24, 75]]).union(ellipse(W, H, 27, 75, 5.5, 2.5)), c.boots, { lightW: 1 });
  paint(img, P([[43, 61], [49, 62], [53, 72], [46, 73]]).union(ellipse(W, H, 51, 73, 5.5, 2.5)), c.boots, { lightW: 1 });
  // Chaqueta bordó abierta en V sobre camiseta oscura, cremallera metálica.
  const torso = P([[31, 31], [38, 28], [49, 30], [52, 36], [48, 46], [50, 52], [44, 55], [31, 52], [33, 44], [28, 36]]);
  paint(img, torso, c.jacket, { shadowW: 4 });
  paint(img, P([[37, 29], [43, 29], [40, 39]]), c.shirt, { lightW: 0 });
  lineIn(img, torso, 40, 39, 40, 53, '#A8A8B0');
  lineIn(img, torso, 36, 30, 39, 40, c.jacket.line);
  lineIn(img, torso, 44, 30, 41, 40, c.jacket.line);
  lineIn(img, torso, 32, 51, 49, 53, c.jacket.shadow); // bajo y pliegues al cargar el peso
  lineIn(img, torso, 32, 36, 37, 39, c.jacket.light);
  lineIn(img, torso, 45, 47, 49, 49, c.jacket.line);
  // Un brazo presenta la Ball; el contrario descansa en la cadera, con el codo separado.
  paint(img, capsule(W, H, 30, 33, 20, 43, 3.5).union(capsule(W, H, 20, 43, 17, 33, 3)), c.jacket);
  paint(img, capsule(W, H, 50, 33, 62, 42, 3.5).union(capsule(W, H, 62, 42, 53, 49, 3)), c.jacket);
  paint(img, ellipse(W, H, 17, 31, 3, 3), c.skin, { lightW: 1, shadowW: 1 });
  stamp(img, ['.kkk.', 'kRRRk', 'kkWkk', 'kWWWk', '.kkk.'], { k: c.outline, R: '#D84C48', W: '#F4ECE4' }, 14, 26);
  paint(img, ellipse(W, H, 52, 50, 3, 2.5), c.skin, { lightW: 1, shadowW: 1 });
  const body = img;
  img = new Img(W, H);
  drawHead(img, c.skin);
  // Pelo rubio en puntas barridas hacia atrás y a su izquierda; frente despejada con dos mechones.
  const spikes = [
    [[29, 13], [33, 8], [23, 3]], [[33, 8], [39, 6], [34, 0]], [[39, 6], [46, 7], [46, 0]],
    [[45, 7], [50, 11], [56, 3]], [[49, 11], [51, 17], [59, 12]],
  ].map(P);
  const hair = ellipse(W, H, 40, 12, 11, 8).and(rect(W, H, 0, 0, W, 14))
    .union(...spikes, P([[29, 11], [32, 11], [32, 19], [29, 18]]), P([[48, 11], [51, 11], [51, 18], [48, 19]]))
    .minus(ellipse(W, H, 40, 19, 6, 5))
    .union(P([[37, 12], [41, 12], [36, 17]]), P([[42, 12], [45, 12], [44, 16]]));
  paint(img, hair, c.hair, { lightW: 2, shadowW: 2 });
  lineIn(img, hair, 36, 6, 33, 12, c.hair.shadow);
  lineIn(img, hair, 44, 6, 46, 11, c.hair.shadow);
  drawFace(img, { iris: '#58A0D8', pupil: '#28507A', brow: c.hair.shadow, mouth: c.skin.line, lash: c.outline });
  return finishFront(body, c.outline, { head: img, height: 60 });
}

const PROF = {
  outline: '#1E1A18',
  skin: { light: '#F4CCA4', base: '#DDA070', shadow: '#AE6E46', line: '#6A3E26' },
  hair: { light: '#8A6A4C', base: '#5E4432', shadow: '#422E22', line: '#2A1C14' },
  coat: { light: '#F2EEE2', base: '#D6D0BC', shadow: '#A8A08A', line: '#746C5A' },
  sweater: { light: '#5A6A84', base: '#4A5870', shadow: '#34405A', line: '#222A3C' },
  pants: { light: '#6E5A48', base: '#5A4838', shadow: '#3E3226', line: '#241A12' },
  shoes: { light: '#5A4A3E', base: '#3A2A20', shadow: '#241A14', line: '#140E0A' },
};

export function buildProfesorFront() {
  const c = PROF;
  let img = new Img(W, H);
  paint(img, rect(W, H, 37, 25, 6, 6), c.skin, { lightW: 0 });
  // Piernas y zapatos bajo el abrigo.
  paint(img, capsule(W, H, 35, 58, 33, 73, 3.5).union(capsule(W, H, 44, 58, 48, 71, 3.3)), c.pants);
  paint(img, ellipse(W, H, 31, 75, 5, 2.5).union(ellipse(W, H, 50, 73, 5, 2.5)), c.shoes, { lightW: 1 });
  // Abrigo largo de campo, abierto: jersey pizarra y pantalón en la abertura.
  const coat = P([[31, 31], [38, 28], [49, 30], [52, 36], [48, 45], [54, 62],
    [43, 64], [39, 61], [33, 64], [25, 62], [31, 44], [28, 36]]);
  paint(img, coat, c.coat, { shadowW: 4 });
  paint(img, P([[37, 29], [43, 29], [44, 48], [36, 48]]), c.sweater, { lightW: 1 });
  paint(img, P([[36, 48], [44, 48], [45, 64], [35, 64]]), c.pants, { lightW: 0 });
  lineIn(img, coat, 36, 30, 35, 63, c.coat.line);
  lineIn(img, coat, 44, 30, 45, 63, c.coat.line);
  lineIn(img, coat, 34, 31, 31, 40, c.coat.shadow); // solapas
  lineIn(img, coat, 46, 31, 49, 40, c.coat.shadow);
  // Mangas y manos.
  paint(img, capsule(W, H, 30, 34, 23, 46, 3.5).union(capsule(W, H, 23, 46, 26, 53, 3)), c.coat);
  paint(img, capsule(W, H, 50, 33, 58, 44, 3.5).union(capsule(W, H, 58, 44, 65, 37, 3)), c.coat);
  paint(img, ellipse(W, H, 26, 55, 3, 2.5), c.skin, { lightW: 1, shadowW: 1 });
  paint(img, ellipse(W, H, 67, 36, 3, 2.5), c.skin, { lightW: 1, shadowW: 1 });
  paint(img, P([[61, 28], [72, 30], [71, 38], [60, 36]]), c.sweater, { lightW: 1 });
  paint(img, P([[62, 29], [70, 30], [70, 35], [62, 34]]), c.coat, { lightW: 1 });
  const body = img;
  img = new Img(W, H);
  drawHead(img, c.skin);
  // Pelo corto y ordenado con raya y flequillo peinado hacia un lado.
  const hair = ellipse(W, H, 40, 11, 11, 7).and(rect(W, H, 0, 0, W, 12))
    .union(P([[29, 9], [32, 9], [32, 17], [29, 16]]), P([[48, 9], [51, 9], [51, 16], [48, 17]]))
    .union(P([[30, 10], [46, 10], [41, 12], [35, 14], [30, 14]]));
  paint(img, hair, c.hair, { lightW: 2, shadowW: 2 });
  lineIn(img, hair, 45, 4, 44, 10, c.hair.shadow); // raya
  lineIn(img, hair, 43, 11, 37, 13, c.hair.shadow);
  drawFace(img, { iris: '#5A4030', pupil: '#2A1C14', brow: c.hair.base, mouth: c.skin.line, lash: c.outline });
  return finishFront(body, c.outline, { head: img, height: 63 });
}
