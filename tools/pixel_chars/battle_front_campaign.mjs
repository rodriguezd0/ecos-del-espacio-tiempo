// Sprites frontales de combate del elenco de la campaña (nativo 80×80 → 160×160). PROVISIONALES (D30).
// Guardianes (CAMPANA §3, X06), Sol Galena (TABLILLAS T05) y Genesis (CAMPANA §5, D14; sin el verde
// de Zygarde). Cada función devuelve la imagen nativa con contorno de silueta.
import { Img } from '../pixel.mjs';
import { finishFront } from './front_layout.mjs';
import {
  W, H, P, E, R, CAP, paint, lineIn, drawHead, tones, neck, legs, longSkirt, jacket, longCoat, arm,
  face, glasses, beard, wrinkles, genesisEmblem,
} from './front_kit.mjs';

const SKIN = {
  light: tones('#FCE0C4', '#F2BC8E', '#C8845A', '#7A4A30'),
  mid: tones('#F4CCA4', '#DDA070', '#AE6E46', '#6A3E26'),
  tan: tones('#E8B888', '#C98E5E', '#99603A', '#5A3420'),
};
const GEN = {
  bata: tones('#FFFFFF', '#F2F4F5', '#C8CED4', '#8A9098'),
  carbon: tones('#44474F', '#2B2D31', '#1E1F23', '#101114'),
  petroleo: tones('#2E6878', '#1F4E5A', '#163A44', '#0B2026'),
  magenta: '#B03A8C',
};

/** Pelo: casquete (elipse recortada arriba) + patillas + piezas extra, menos la frente. */
function hairCap(extra = [], { forehead = null, top = 14, rx = 11, ry = 8, cy = 12 } = {}) {
  let m = E(40, cy, rx, ry).and(R(0, 0, W, top)).union(P([[29, 10], [32, 10], [32, 18], [29, 17]]), P([[48, 10], [51, 10], [51, 17], [48, 18]]), ...extra);
  if (forehead) m = m.minus(forehead);
  return m;
}

// ─────────────────────────── Guardianes ───────────────────────────

/** Leandro Alcántara (38, orgullo): mano en la cadera y la gran llave de esclusa al hombro. */
export function buildLeandroFront() {
  const skin = SKIN.tan;
  const coat = tones('#5A8CC4', '#3A6AA4', '#28507E', '#183456');
  const brass = tones('#FFE488', '#E8C050', '#B08A28', '#6A4E10');
  let img = new Img(W, H);
  neck(img, skin);
  legs(img, tones('#4E4E5E', '#3A3A48', '#26262F', '#141418'), tones('#4E6E70', '#2E4E50', '#1E3436', '#0E1C1E'), { boots: true });
  longCoat(img, coat, { inner: tones('#FFFFFF', '#F4F4EE', '#C8C8C0', '#8A8A84'), pants: tones('#4E4E5E', '#3A3A48', '#26262F', '#141418') });
  for (const y of [36, 42, 48]) { img.set(34, y, [232, 192, 80, 255]); img.set(46, y, [232, 192, 80, 255]); } // botones de latón
  arm(img, 'R', 'hips', coat, skin);
  // Llave de esclusa al hombro: caña, anillo y paletón.
  paint(img, CAP(50, 44, 61, 22, 1.4), brass, { lightW: 0, shadowW: 1 });
  paint(img, E(62, 19, 4, 4).minus(E(62, 19, 2, 2)), brass, { lightW: 1, shadowW: 1 });
  paint(img, R(47, 43, 4, 5), brass, { lightW: 1, shadowW: 1 });
  paint(img, CAP(54, 33, 58, 42, 4).union(CAP(58, 42, 53, 39, 3.5)), coat);
  paint(img, E(52, 39, 3, 2.5), skin, { lightW: 1, shadowW: 1 });
  const body = img;
  img = new Img(W, H);
  drawHead(img, skin);
  const hair = tones('#6A5448', '#4A382E', '#32241C', '#1E1410');
  const mask = hairCap([P([[31, 8], [42, 0], [49, 6], [44, 9]])], { forehead: E(40, 18, 7, 4.5) });
  paint(img, mask, hair, { lightW: 2, shadowW: 2 });
  lineIn(img, mask, 35, 8, 44, 3, hair.shadow);
  lineIn(img, mask, 38, 11, 47, 6, hair.shadow);
  face(img, { lash: '#1E1410', iris: '#3A2A20', brow: 'raised', browColor: hair.base, mouth: 'smirk', mouthColor: skin.line, skinTone: skin.base });
  beard(img, tones('#8A6450', '#6A4C3A', '#4A3428', '#2A1E16'), { full: false });
  return finishFront(body, '#161A22', { head: img, height: 63 });
}

/** Abril Céspedes (19, tedio): manos en los bolsillos del cortavientos, auriculares al cuello. */
export function buildAbrilFront() {
  const skin = SKIN.light;
  const wind = tones('#F2C850', '#D8A830', '#A87C1C', '#6E500E');
  let img = new Img(W, H);
  neck(img, skin);
  // Mallas oscuras, pantalón corto gris y zapatillas blancas.
  legs(img, tones('#3E3C4A', '#2E2C3A', '#1E1C28', '#100E16'), tones('#FFFFFF', '#F0F0F0', '#B8B8C0', '#6A6A74'));
  paint(img, R(28, 50, 24, 9), tones('#8A9098', '#6A7078', '#4A5058', '#2A2E34'), { lightW: 1 });
  // Capucha gris detrás del cuello y cortavientos cerrado.
  paint(img, E(40, 30, 11, 4), tones('#E8ECEE', '#D8DCE0', '#A8AEB4', '#6A7078'), { lightW: 1 });
  const torso = jacket(img, wind, { zip: wind.line });
  lineIn(img, torso, 26, 45, 54, 45, wind.shadow); // bolsillos
  arm(img, 'R', 'pockets', wind, skin);
  arm(img, 'L', 'pockets', wind, skin);
  // Auriculares cian al cuello.
  const cyan = tones('#98ECF4', '#58D0E0', '#2898A8', '#105860');
  paint(img, E(33, 30, 3, 2.5).union(E(47, 30, 3, 2.5)), cyan, { lightW: 1, shadowW: 1 });
  lineIn(img, R(0, 0, W, H), 35, 32, 45, 32, cyan.shadow);
  const body = img;
  img = new Img(W, H);
  drawHead(img, skin);
  const hair = tones('#F4ECD0', '#E6D8B0', '#C4B080', '#8A7850');
  const locks = [P([[28, 12], [33, 10], [30, 24], [27, 21]]), P([[46, 8], [58, 6], [52, 14]]), P([[34, 10], [44, 9], [38, 17], [33, 16]])];
  const mask = hairCap(locks, { forehead: E(43, 20, 6, 4) });
  paint(img, mask, hair, { lightW: 2, shadowW: 2 });
  lineIn(img, mask, 36, 5, 50, 9, hair.shadow);
  lineIn(img, mask, 32, 9, 30, 20, hair.shadow);
  face(img, { lash: '#2A2420', iris: '#6A8A60', brow: 'flat', browColor: hair.shadow, lids: true, mouth: 'flat', mouthColor: skin.line, skinTone: skin.base });
  return finishFront(body, '#1C1820', { head: img, height: 60 });
}

/** Fermín Galena (51, carga familiar): casco con lámpara, barba canosa y el pico al hombro. */
export function buildFerminFront() {
  const skin = SKIN.tan;
  const jkt = tones('#8A9098', '#6A7078', '#4E545C', '#34383E');
  let img = new Img(W, H);
  neck(img, skin);
  legs(img, tones('#5A6A88', '#4A5A78', '#34405A', '#1E2638'), tones('#8A6A50', '#6A4A30', '#44301E', '#241810'), { boots: true });
  const torso = jacket(img, jkt, { width: 1, zip: jkt.line });
  paint(img, R(24, 44, 32, 3).and(torso), tones('#FFB070', '#F08030', '#C06020', '#803A10'), { lightW: 0, shadowW: 0, line: false });
  arm(img, 'R', 'down', jkt, skin, { dx: 1 });
  // Pico al hombro: mango de madera desde la mano hasta detrás del hombro y cabeza de hierro.
  const wood = tones('#C89868', '#A07448', '#74502C', '#4A3018');
  paint(img, CAP(51, 46, 63, 14, 1.6), wood, { lightW: 0, shadowW: 1 });
  paint(img, P([[54, 9], [70, 14], [72, 18], [66, 16], [56, 13]]), tones('#B8C0C8', '#8A929C', '#5E666E', '#343A40'), { lightW: 1 });
  paint(img, CAP(54, 33, 57, 42, 4.2).union(CAP(57, 42, 52, 45, 3.6)), jkt);
  paint(img, E(51, 45, 3, 2.5), skin, { lightW: 1, shadowW: 1 });
  const body = img;
  img = new Img(W, H);
  drawHead(img, skin);
  paint(img, E(40, 15, 6, 2).union(R(30, 13, 20, 4)), tones('#8A8480', '#6A625C', '#4A4440', '#2E2A28'), { lightW: 0 }); // pelo bajo el casco
  // Casco ocre con ala y lámpara.
  const helm = tones('#F0C860', '#E0B040', '#B88A20', '#7A5A10');
  paint(img, E(40, 10, 12, 8).and(R(0, 0, W, 12)).union(R(27, 11, 26, 3)), helm, { lightW: 2, shadowW: 2 });
  paint(img, E(40, 6, 3, 2.5), tones('#FFFFFF', '#FFF4B0', '#C8B878', '#6A5E30'), { lightW: 1, shadowW: 0 });
  face(img, { lash: '#2E2A28', iris: '#4A4038', brow: 'tired', browColor: '#6A625C', mouth: 'firm', mouthColor: skin.line, skinTone: skin.base });
  beard(img, tones('#D0CAC4', '#B8B2AC', '#7E7872', '#4E4A46'));
  wrinkles(img, skin.shadow);
  return finishFront(body, '#1A1816', { head: img, height: 64 });
}

/** Olvido Arrieta (78, fascinación): sostiene su libreta abierta, gafas redondas y sonrisa. */
export function buildOlvidoFront() {
  const skin = SKIN.light;
  const card = tones('#E8BC78', '#D8A860', '#B88840', '#7A5820');
  let img = new Img(W, H);
  neck(img, skin);
  longSkirt(img, tones('#A84A5A', '#8A3A48', '#6A2A36', '#3A121C'), tones('#5A4A48', '#4A3A38', '#2E2422', '#1A1412'), tones('#7A5A48', '#5A3A28', '#3A2418', '#1E120A'));
  jacket(img, card, { open: true, inner: tones('#FFF8E8', '#F4ECD8', '#D0C4A8', '#8A806A') });
  arm(img, 'R', 'hold', card, skin);
  arm(img, 'L', 'hold', card, skin);
  // Libreta abierta: dos páginas con renglones y lomo.
  const page = tones('#FFFFFF', '#F4F0E4', '#D4CCB8', '#8A806A');
  paint(img, P([[29, 36], [40, 38], [51, 36], [51, 46], [40, 48], [29, 46]]), page, { lightW: 1, shadowW: 1 });
  lineIn(img, R(0, 0, W, H), 40, 38, 40, 47, page.line);
  for (const y of [40, 43]) { lineIn(img, R(30, 0, 9, H), 31, y, 38, y + 1, page.shadow); lineIn(img, R(41, 0, 9, H), 42, y + 1, 49, y, page.shadow); }
  paint(img, E(34, 45, 3, 2.5).union(E(46, 45, 3, 2.5)), skin, { lightW: 1, shadowW: 1 });
  const body = img;
  img = new Img(W, H);
  drawHead(img, skin);
  const hair = tones('#FFFFFF', '#F4F4F8', '#C8C8D4', '#8A8A9A');
  const mask = hairCap([E(40, 6, 5, 3)], { forehead: E(40, 18, 7, 4) });
  paint(img, mask, hair, { lightW: 2, shadowW: 2 });
  lineIn(img, mask, 40, 5, 40, 13, hair.shadow); // raya al medio
  paint(img, CAP(43, 6, 50, 2, 1), tones('#FFE080', '#F0C040', '#C09020', '#6A5010'), { lightW: 0 }); // lápiz en el moño
  face(img, { lash: '#3A2A20', iris: '#6A5040', brow: 'raised', browColor: hair.shadow, mouth: 'smile', mouthColor: skin.line, skinTone: skin.base });
  glasses(img, '#6A4A30', '#E0F0F8');
  wrinkles(img, skin.shadow);
  return finishFront(body, '#1C1614', { head: img, height: 60 });
}

/** Sol Galena (hija de Fermín): casco blanco, trenza al hombro y manos en la cadera. */
export function buildSolFront() {
  const skin = SKIN.mid;
  const jkt = tones('#E88A4C', '#C86A30', '#984C20', '#603014');
  let img = new Img(W, H);
  neck(img, skin);
  legs(img, tones('#6E727C', '#5A5E68', '#3E424A', '#22252A'), tones('#8A6A50', '#6A4A30', '#44301E', '#241810'), { boots: true });
  const torso = jacket(img, jkt, { zip: jkt.line });
  paint(img, R(24, 44, 32, 3).and(torso), tones('#FFF8A0', '#F8E048', '#C8A820', '#806A10'), { line: false, lightW: 0, shadowW: 0 });
  arm(img, 'R', 'hips', jkt, skin);
  arm(img, 'L', 'present', jkt, skin);
  const body = img;
  img = new Img(W, H);
  drawHead(img, skin);
  const hair = tones('#8A5A40', '#6A4430', '#4A2E20', '#2A1810');
  paint(img, E(40, 15, 7, 2).union(R(30, 13, 20, 4)), hair, { lightW: 0 });
  paint(img, CAP(31, 21, 29, 33, 2.6).union(E(29, 35, 2.5, 2.5)), hair, { lightW: 1, shadowW: 1 }); // trenza al hombro
  const helm = tones('#FFFFFF', '#F4F4F0', '#CACAC4', '#8C8C88');
  paint(img, E(40, 10, 12, 8).and(R(0, 0, W, 12)).union(R(27, 11, 26, 3)), helm, { lightW: 2, shadowW: 2 });
  paint(img, E(40, 6, 3, 2.5), tones('#FFFFFF', '#FFF4B0', '#C8B878', '#6A5E30'), { lightW: 1, shadowW: 0 });
  face(img, { lash: '#2A1810', iris: '#5A3A28', brow: 'flat', browColor: hair.base, mouth: 'smirk', mouthColor: skin.line, skinTone: skin.base });
  return finishFront(body, '#1C1614', { head: img, height: 60 });
}

// ─────────────────────────── Genesis ───────────────────────────

/** Dr. Aurelio Vértice como Líder Supremo: bata blanca, capa corta carbón, manos a la espalda. */
export function buildVerticeFront() {
  const skin = SKIN.light;
  let img = new Img(W, H);
  neck(img, skin);
  legs(img, GEN.carbon, tones('#3A3A44', '#1A1A1E', '#0E0E12', '#050508'), { gap: 9 });
  longCoat(img, GEN.bata, { inner: GEN.carbon, pants: GEN.carbon, width: -1, lapel: GEN.carbon.base });
  arm(img, 'R', 'behind', GEN.bata, skin, { dx: -1 });
  arm(img, 'L', 'behind', GEN.bata, skin, { dx: -1 });
  // Capa corta carbón sobre los hombros, abierta por delante.
  const cape = P([[31, 30], [48, 28], [53, 33], [58, 45], [49, 43], [41, 34], [33, 39], [25, 44], [27, 34]]);
  paint(img, cape, GEN.carbon, { shadowW: 3 });
  img.set(36, 36, [176, 58, 140, 255]); // alfiler magenta
  img.set(36, 37, [176, 58, 140, 255]);
  const body = img;
  img = new Img(W, H);
  drawHead(img, skin);
  const hair = tones('#FFFFFF', '#F4F4F8', '#C8CAD2', '#9A9CA8');
  const mask = hairCap([], { forehead: E(40, 18, 7, 5) });
  paint(img, mask, hair, { lightW: 2, shadowW: 2 });
  for (const x of [34, 38, 42, 46]) lineIn(img, mask, x, 12, x + 2, 4, hair.shadow); // peinado hacia atrás
  face(img, { lash: '#2A2A34', iris: '#4A4058', brow: 'flat', browColor: hair.shadow, mouth: 'firm', mouthColor: skin.line, skinTone: skin.base });
  beard(img, tones('#FFFFFF', '#F0F0F4', '#C4C6D0', '#8A8C98'), { full: false });
  glasses(img, '#3A2A4A', '#A078C8');
  wrinkles(img, skin.shadow);
  return finishFront(body, '#16161C', { head: img, height: 64 });
}

/** Dra. Casia Varela (41): bata larga con solapas carbón y ribete magenta; tableta en el brazo. */
export function buildCasiaFront() {
  const skin = SKIN.light;
  let img = new Img(W, H);
  neck(img, skin);
  legs(img, GEN.carbon, tones('#5A4A5A', '#3A2A3A', '#22181E', '#100A0E'), { gap: 9 });
  const coat = longCoat(img, GEN.bata, { inner: GEN.carbon, pants: GEN.carbon, lapel: GEN.carbon.base });
  lineIn(img, coat, 22, 63, 58, 63, GEN.magenta); // ribete
  genesisEmblem(img, 45, 38);
  arm(img, 'R', 'down', GEN.bata, skin);
  // Brazo izquierdo sujetando una tableta carbón contra el pecho.
  paint(img, P([[42, 34], [54, 32], [56, 48], [44, 50]]), GEN.carbon, { lightW: 1 });
  paint(img, P([[44, 36], [53, 34.5], [54.5, 46], [45.5, 47.5]]), tones('#E070C0', '#B03A8C', '#802468', '#4A1038'), { lightW: 1, shadowW: 1 });
  paint(img, CAP(54, 33, 58, 44, 4.2).union(CAP(58, 44, 52, 47, 3.6)), GEN.bata);
  paint(img, E(51, 47, 3, 2.5), skin, { lightW: 1, shadowW: 1 });
  const body = img;
  img = new Img(W, H);
  drawHead(img, skin);
  const hair = tones('#6A5A7A', '#4A3A5A', '#30243E', '#120C18');
  const bob = E(40, 14, 12.5, 11).and(R(0, 0, W, 27)).minus(P([[34, 11], [44, 14], [47, 28], [33, 28]]));
  paint(img, bob, hair, { lightW: 2, shadowW: 3 });
  lineIn(img, bob, 44, 4, 36, 12, hair.shadow); // raya a un lado
  face(img, { lash: '#120C18', iris: '#4A3A5A', brow: 'flat', browColor: hair.base, mouth: 'firm', mouthColor: skin.line, skinTone: skin.base });
  return finishFront(body, '#18141C', { head: img, height: 62 });
}

/** Ulises Garrido (47): excapataz con bata de director, casco de obra bajo el brazo. */
export function buildGarridoFront() {
  const skin = SKIN.tan;
  let img = new Img(W, H);
  neck(img, skin);
  legs(img, tones('#4A4C52', '#34363C', '#22242A', '#101114'), tones('#4A4C52', '#2B2D31', '#18191C', '#08090A'), { boots: true, gap: 11 });
  const coat = longCoat(img, GEN.bata, { inner: GEN.carbon, pants: GEN.carbon, width: 2, lapel: GEN.carbon.base });
  lineIn(img, coat, 21, 63, 59, 63, GEN.magenta);
  arm(img, 'R', 'down', GEN.bata, skin, { dx: 2 });
  // Casco de obra carbón con franja magenta bajo el brazo izquierdo.
  paint(img, E(58, 50, 8, 6).and(R(0, 0, W, 53)).union(R(49, 51, 18, 3)), GEN.carbon, { lightW: 2 });
  lineIn(img, R(0, 0, W, H), 51, 48, 65, 48, GEN.magenta);
  paint(img, CAP(56, 33, 59, 44, 4.4).union(CAP(59, 44, 55, 48, 3.8)), GEN.bata);
  const body = img;
  img = new Img(W, H);
  drawHead(img, skin);
  const hair = tones('#D0D0D8', '#B4B4BC', '#8E8E98', '#5A5A64');
  paint(img, E(40, 12, 10, 6).and(R(0, 0, W, 14)), hair, { lightW: 1, shadowW: 2 });
  face(img, { lash: '#18181A', iris: '#3A3A40', brow: 'thick', browColor: '#6A6A74', mouth: 'firm', mouthColor: skin.line, skinTone: skin.base });
  beard(img, tones('#8A8A90', '#6A6A70', '#4A4A50', '#2A2A30'), { full: false });
  return finishFront(body, '#18181A', { head: img, height: 64 });
}

/** Técnico/técnica de campo: gorra con visor, mono petróleo con peto blanco y emblema, maletín. */
function buildTecnicoFront(female) {
  const skin = female ? SKIN.light : SKIN.mid;
  let img = new Img(W, H);
  neck(img, skin);
  legs(img, GEN.petroleo, GEN.carbon, { boots: true, stance: female ? 'stride' : 'wide' });
  jacket(img, GEN.petroleo, { width: female ? -1 : 0 });
  paint(img, P([[34, 33], [46, 34], [45, 45], [47, 52], [33, 51], [35, 43]]), GEN.bata, { lightW: 1, shadowW: 2 }); // peto
  lineIn(img, R(0, 0, W, H), 34, 30, 34, 34, GEN.bata.shadow);
  lineIn(img, R(0, 0, W, H), 46, 30, 46, 34, GEN.bata.shadow);
  genesisEmblem(img, 37, 38);
  arm(img, 'R', 'down', GEN.petroleo, GEN.carbon);
  arm(img, 'L', female ? 'present' : 'hips', GEN.petroleo, GEN.carbon);
  // Maletín de instrumentos en la mano derecha (izquierda de la pantalla).
  paint(img, P([[16, 57], [28, 55], [30, 64], [18, 67]]), tones('#C8D0D8', '#A8B0B8', '#6A727C', '#3A4048'), { lightW: 1, shadowW: 2 });
  paint(img, CAP(21, 55, 26, 54, 1).union(R(20, 54, 2, 4), R(26, 53, 2, 4)), GEN.carbon, { lightW: 0, shadowW: 0 });
  lineIn(img, R(0, 0, W, H), 17, 60, 28, 60, '#6A727C');
  const hair = female ? tones('#9A4A38', '#7A3A2A', '#5A2A1E', '#26100A') : tones('#5A4A40', '#4A3A30', '#32261E', '#140E0A');
  if (female) paint(img, CAP(49, 14, 53, 28, 2.8), hair, { lightW: 1, shadowW: 1 }); // coleta por detrás
  const body = img;
  img = new Img(W, H);
  drawHead(img, skin);
  paint(img, R(30, 13, 20, 5).union(P([[29, 12], [32, 12], [32, 19], [29, 18]]), P([[48, 12], [51, 12], [51, 18], [48, 19]])), hair, { lightW: 0 });
  // Gorra petróleo con el emblema y visor magenta sobre la frente.
  paint(img, E(40, 9, 11.5, 7).and(R(0, 0, W, 12)), GEN.petroleo, { lightW: 2, shadowW: 2 });
  paint(img, R(28, 11, 24, 3), tones('#E070C0', '#B03A8C', '#802468', '#4A1038'), { lightW: 1, shadowW: 1 });
  genesisEmblem(img, 37, 3);
  face(img, { lash: '#140E0A', iris: '#3A3028', brow: 'flat', browColor: hair.shadow, mouth: 'flat', mouthColor: skin.line, skinTone: skin.base });
  return finishFront(body, '#121A1E', { head: img, height: female ? 60 : 62 });
}

export const buildTecnicoFrontM = () => buildTecnicoFront(false);
export const buildTecnicoFrontF = () => buildTecnicoFront(true);
