// Arte propio del Bloque 5 (PROVISIONAL, D30) generado con tools/pixel.mjs. Uso: node tools/b05_assets.mjs [--preview]
// Todo se dibuja a resolución nativa DS (1 px de arte = 2 px de pantalla) y se amplía ×2. Hojas 4×4 (charset):
// fila = dirección del evento (2, 4, 6, 8), columna = patrón (0..3).
//   objects/b05_molino_viento.png  96×160: molino de viento manchego (cal, cono de madera, aspas de celosía que
//        giran en las 4 columnas). Villa Brontia («meseta con molinos», CAMPANA §1.3).
//   objects/b05_campanario.png     96×224: torre de piedra de Sixto con chapitel rojo, veleta y campana grande en
//        el campanil (columnas = campana quieta y balanceo). Villa Brontia (T03).
//   objects/b05_rayo.png           96×384: rayo que cae sobre el chapitel del campanario (3 destellos + vacío).
//   objects/b05_engranajes_d.png / _i.png  96×96: ruedas dentadas de madera del Molino del Diezmo (T02). Filas:
//        0 pequeña, 1 mediana, 2 grande (4 fotogramas de giro: _d a derechas con el trinquete a la izquierda,
//        _i a izquierdas con el trinquete a la derecha; flecha de tiza con el sentido); fila 3: huecos vacíos
//        con el contorno de tiza del tamaño que admiten (pequeño, mediano, grande) y la corona de la rueda.
//   objects/b05_muela.png          96×96: fila 0 muela girando a derechas, 1 a izquierdas, 2 corona del eje de la
//        rueda girando a derechas, 3 muela con el eje abierto (col 0 con la Tablilla, col 1 vacío).
//   objects/b05_cuadro.png         32×32: cuadro de la subestación (T03). Fila 0 caja de empalme (apagada /
//        encendida), 1 caja quemada con chispas, 2 interruptor horizontal (abierto, cerrado, con corriente,
//        cable), 3 interruptor vertical (ídem).
//   objects/b05_hierba.png         32×32: mata de hierba alta que se agita (Audino en la Ruta 4), 4 fotogramas.
//   objects/b05_sacos.png          32×32: sacos de harina (col 0 montón, 1 saco, 2 caja) del Molino del Diezmo.
//   objects/b05_rueda.png          96×96: rueda hidráulica del Diezmo girando (fila 0 a derechas, 1 al revés) y la
//        corona de su eje (fila 2 a derechas, 3 al revés).
//   objects/b05_campana.png        64×64: campana grande del campanil con su yugo (fila 0 quieta/balanceo, fila 1
//        con chispas: la Tablilla dentro).
//   objects/b05_tablilla.png       32×32: losa de piedra que brilla (fila 0 Trueno, amarilla; fila 1 Linfa, azul).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, preview, sheet, outline } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

// ───────────────────────────── Primitivas ─────────────────────────────

const C = (c) => (Array.isArray(c) ? c : hex(c));
function px(img, x, y, color) { img.set(Math.round(x), Math.round(y), C(color)); }
function rect(img, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(img, x, y, color);
}
function line(img, x0, y0, x1, y1, color) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= n; i++) px(img, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, color);
}
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function poly(img, pts, colorAt) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      if (!inPoly(x + 0.5, y + 0.5, pts)) continue;
      const c = typeof colorAt === 'function' ? colorAt(x, y) : colorAt;
      if (c) px(img, x, y, c);
    }
  }
}
function disc(img, cx, cy, r, colorAt) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > r) continue;
      const c = typeof colorAt === 'function' ? colorAt(x, y, d) : colorAt;
      if (c) px(img, x, y, c);
    }
  }
}
/** Sombra suave (elipse translúcida). */
function shadow(img, cx, cy, rx, ry, alpha = 70) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 > 1) continue;
      if (img.alpha(x, y)) continue;
      img.set(x, y, [24, 32, 20, alpha]);
    }
  }
}
/** Contorno oscuro solo alrededor de los píxeles opacos (no de la sombra translúcida). */
function ink(img, color) {
  const solid = new Img(img.w, img.h);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y) === 255) solid.set(x, y, img.get(x, y));
  const out = outline(solid, color);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y) && img.alpha(x, y) < 255) out.set(x, y, img.get(x, y));
  return out;
}
const same4 = (frames) => [frames, frames, frames, frames];

// ───────────────────────────── Molino de viento ─────────────────────────────

const MILL = {
  wall: '#F4F1E8', wallMid: '#DEDACB', wallShade: '#BDB7A5', base: '#B8A07A', baseShade: '#8E7858',
  door: '#6B4A2C', doorShade: '#4A321E', win: '#2E3440', roof: '#6E5A48', roofShade: '#4D3E32', roofHi: '#8A7460',
  spar: '#5A3E26', lattice: '#7B5B39', canvas: '#E3D6B4', hub: '#3A2E24', ink: '#2A2420',
};

function millBody(img) {
  const H0 = 40; const H1 = 77; // cuerpo
  for (let y = H0; y <= H1; y++) {
    const t = (y - H0) / (H1 - H0);
    const x0 = Math.round(16 - 2 * t); const x1 = Math.round(31 + 2 * t);
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / (x1 - x0);
      px(img, x, y, u > 0.72 ? MILL.wallShade : (u > 0.5 ? MILL.wallMid : MILL.wall));
    }
  }
  rect(img, 14, 74, 33, 77, MILL.base);
  rect(img, 27, 74, 33, 77, MILL.baseShade);
  // Puerta con arco y ventanucos
  rect(img, 21, 65, 26, 76, MILL.door);
  rect(img, 22, 64, 25, 64, MILL.door);
  rect(img, 25, 65, 26, 76, MILL.doorShade);
  px(img, 22, 71, '#C9A15A');
  rect(img, 23, 50, 24, 52, MILL.win);
  rect(img, 18, 58, 18, 59, MILL.win);
}

function millRoof(img) {
  poly(img, [[12, 41], [24, 26], [35, 41]], (x) => (x > 27 ? MILL.roofShade : (x < 18 ? MILL.roofHi : MILL.roof)));
  line(img, 13, 41, 34, 41, MILL.roofShade);
  // palo de gobierno (detrás, bajando a la derecha)
  line(img, 30, 38, 40, 70, MILL.spar);
}

/** Aspas de celosía: 4 brazos en ángulo `a0` (grados) con la lona clara y el entramado. */
function millSails(img, a0) {
  const hx = 24; const hy = 33;
  for (let k = 0; k < 4; k++) {
    const a = ((a0 + k * 90) * Math.PI) / 180;
    const ux = Math.cos(a); const uy = Math.sin(a);
    const vx = -uy; const vy = ux; // perpendicular (lado de la lona)
    for (let y = hy - 26; y <= hy + 26; y++) {
      for (let x = hx - 26; x <= hx + 26; x++) {
        const dx = x + 0.5 - hx; const dy = y + 0.5 - hy;
        const r = dx * ux + dy * uy; const s = dx * vx + dy * vy;
        if (r < 5 || r > 24 || s < 0 || s > 5.2) continue;
        const grid = Math.abs(r % 3.2) < 1 || s < 1 || s > 4.3 || Math.abs(r - 24) < 1;
        px(img, x, y, grid ? MILL.lattice : MILL.canvas);
      }
    }
    line(img, hx, hy, hx + ux * 25, hy + uy * 25, MILL.spar);
  }
  disc(img, hx, hy, 2.2, MILL.hub);
}

function millFrame(f) {
  const img = new Img(48, 80);
  shadow(img, 30, 78, 13, 2.6);
  millBody(img);
  millRoof(img);
  millSails(img, 12 + f * 22.5);
  return ink(img, MILL.ink).scale(2);
}

// ───────────────────────────── Campanario ─────────────────────────────

const TOWER = {
  stone: '#D9C49A', stoneShade: '#BFA87C', stoneDark: '#A48E62', mortar: '#B39E74', light: '#E8DAB6',
  roof: '#B5523E', roofShade: '#8C3A2C', roofHi: '#D0705A', dark: '#3B2F2A', door: '#6B4424', doorLine: '#4E3018',
  bell: '#C8962E', bellHi: '#F0CF6A', bellShade: '#8A6420', bellLip: '#6E4E18', iron: '#3A3A3A', ink: '#3A2E22',
};

function stoneAt(x, y, x0, x1) {
  const row = Math.floor(y / 4);
  const off = row % 2 ? 3 : 0;
  if (y % 4 === 3 || (x + off) % 7 === 0) return TOWER.mortar;
  const u = (x - x0) / (x1 - x0);
  if (u > 0.78) return TOWER.stoneShade;
  if (u < 0.1) return TOWER.light;
  return ((x * 7 + y * 3) % 23 === 0) ? TOWER.stoneDark : TOWER.stone;
}

function bell(img, cx, top, tilt) {
  // Cuerpo acampanado: de 6 px arriba a 12 px en el labio; `tilt` desplaza la parte baja.
  for (let y = 0; y <= 9; y++) {
    const half = 3 + Math.round((y / 9) ** 1.6 * 3.5);
    const sh = Math.round((tilt * y) / 9);
    for (let x = -half; x <= half; x++) {
      const c = y === 9 ? TOWER.bellLip : (x > half - 3 ? TOWER.bellShade : (x < -half + 2 ? TOWER.bellHi : TOWER.bell));
      px(img, cx + x + sh, top + y, c);
    }
  }
  px(img, cx + tilt, top + 11, TOWER.iron); // badajo
  line(img, cx - 5, top - 2, cx + 5, top - 2, TOWER.iron); // yugo
  px(img, cx, top - 1, TOWER.iron);
}

function towerFrame(tilt) {
  const img = new Img(48, 112);
  shadow(img, 34, 108, 14, 3.4, 80);
  // Zócalo y cuerpo
  for (let y = 36; y <= 103; y++) for (let x = 10; x <= 37; x++) px(img, x, y, stoneAt(x, y, 10, 37));
  rect(img, 8, 100, 39, 106, TOWER.stoneShade);
  rect(img, 8, 100, 39, 100, TOWER.light);
  rect(img, 33, 101, 39, 106, TOWER.stoneDark);
  // Cornisa bajo el campanil
  rect(img, 8, 32, 39, 35, TOWER.light);
  rect(img, 8, 35, 39, 35, TOWER.stoneDark);
  // Campanil: muros con el vano en arco
  for (let y = 14; y <= 31; y++) for (let x = 11; x <= 36; x++) px(img, x, y, stoneAt(x, y, 11, 36));
  const archCx = 23.5; const archTop = 17;
  for (let y = archTop; y <= 31; y++) {
    for (let x = 15; x <= 32; x++) {
      const inArch = y >= archTop + 8 || Math.hypot(x + 0.5 - archCx, y + 0.5 - (archTop + 8.5)) <= 8.6;
      if (inArch) px(img, x, y, y > 29 ? TOWER.stoneDark : TOWER.dark);
    }
  }
  rect(img, 14, 31, 33, 31, TOWER.light); // antepecho
  bell(img, 24, 19, tilt);
  // Chapitel de teja con veleta
  poly(img, [[8, 15], [24, 1], [40, 15]], (x, y) => ((y % 3 === 0) ? TOWER.roofShade : (x > 27 ? TOWER.roofShade : (x < 17 ? TOWER.roofHi : TOWER.roof))));
  rect(img, 8, 14, 39, 15, TOWER.roofShade);
  line(img, 24, 0, 24, 3, TOWER.iron);
  line(img, 21, 1, 27, 1, TOWER.iron);
  px(img, 28, 1, TOWER.iron); px(img, 27, 0, TOWER.iron); px(img, 27, 2, TOWER.iron);
  // Saeteras
  for (const [x, y] of [[23, 50], [23, 70]]) { rect(img, x, y, x + 1, y + 6, TOWER.dark); rect(img, x - 1, y + 7, x + 2, y + 7, TOWER.light); }
  // Puerta en arco con dovelas
  for (let y = 86; y <= 103; y++) {
    for (let x = 17; x <= 30; x++) {
      const d = Math.hypot(x + 0.5 - 23.5, y + 0.5 - 92.5);
      if (y < 92 && d > 7.2) continue;
      const inner = y >= 92 ? (x >= 18 && x <= 29) : d <= 6.1;
      px(img, x, y, inner ? (x % 4 === 1 ? TOWER.doorLine : TOWER.door) : TOWER.light);
    }
  }
  for (const [x, y] of [[20, 96], [27, 96], [20, 100], [27, 100]]) px(img, x, y, TOWER.iron);
  return ink(img, TOWER.ink).scale(2);
}

function boltFrame(f) {
  const img = new Img(48, 192);
  if (f === 3) return img.scale(2);
  const pts = [[31, 0], [27, 14], [33, 24], [22, 40], [28, 50], [20, 64], [25, 72], [24, 82]];
  if (f === 1) pts.splice(3, 1, [20, 38]);
  const glow = f === 2 ? [158, 231, 255, 140] : [158, 231, 255, 220];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1];
    for (const o of [-1, 1]) line(img, x0 + o, y0, x1 + o, y1, glow);
    line(img, x0, y0, x1, y1, f === 2 ? '#DDF6FF' : '#FFFFFF');
  }
  // Ramita lateral
  line(img, 33, 24, 40, 34, glow);
  line(img, 22, 40, 14, 48, glow);
  return img.scale(2);
}

// ───────────────────────────── Engranajes y muela ─────────────────────────────

const WOOD = { body: '#9A6A3C', shade: '#6E4822', hi: '#C08A54', dark: '#4A2E16', hub: '#3A3834', iron: '#5E5C58', chalk: '#F2F2EE', ink: '#2E2014' };
const GEARS = [{ r: 11, teeth: 8 }, { r: 14, teeth: 10 }, { r: 17.5, teeth: 12 }];

function gearDisc(img, cx, cy, r, teeth, angle) {
  const pitch = (2 * Math.PI) / teeth;
  disc(img, cx, cy, r + 2.6, (x, y, d) => {
    const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx) - angle;
    const k = ((a % pitch) + pitch) % pitch;
    const tooth = k < pitch * 0.45;
    if (d > r && !tooth) return null;
    if (d > r) return WOOD.shade;
    if (d < 3.2) return WOOD.hub;
    if (d < 4.4) return WOOD.dark;
    if (Math.abs(d - r * 0.62) < 0.6) return WOOD.shade; // aro
    const lit = (x + 0.5 - cx) + (y + 0.5 - cy) < 0;
    return lit ? WOOD.hi : WOOD.body;
  });
  // Radios
  for (let s = 0; s < 4; s++) {
    const a = angle + (s * Math.PI) / 2;
    line(img, cx + Math.cos(a) * 4.5, cy + Math.sin(a) * 4.5, cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, WOOD.shade);
  }
}

/** Flecha de tiza alrededor del cubo: sentido +1 derechas (↻), −1 izquierdas (↺). */
function chalkArrow(img, cx, cy, sense) {
  const R = 6.5;
  for (let t = -0.2; t <= 1.35; t += 0.05) {
    const a = -Math.PI / 2 + sense * t * 1.6;
    px(img, cx + Math.cos(a) * R, cy + Math.sin(a) * R, WOOD.chalk);
  }
  const end = -Math.PI / 2 + sense * 1.35 * 1.6;
  const ex = cx + Math.cos(end) * R; const ey = cy + Math.sin(end) * R;
  const tx = -Math.sin(end) * sense; const ty = Math.cos(end) * sense; // tangente
  px(img, ex + tx * 1.5, ey + ty * 1.5, WOOD.chalk);
  px(img, ex + tx * 0.5 + Math.cos(end) * 1.4, ey + ty * 0.5 + Math.sin(end) * 1.4, WOOD.chalk);
  px(img, ex + tx * 0.5 - Math.cos(end) * 1.4, ey + ty * 0.5 - Math.sin(end) * 1.4, WOOD.chalk);
}

/** Trinquete: uña de hierro contra los dientes (izquierda = deja girar a derechas). */
function pawl(img, cx, cy, r, side) {
  const x = cx + side * (r + 4);
  line(img, x, cy - 6, x - side * 1, cy + 2, WOOD.iron);
  line(img, x + side, cy - 6, x, cy + 2, WOOD.iron);
  px(img, x, cy - 7, WOOD.hub);
}

function gearFrame(gi, sense, f) {
  const img = new Img(48, 48);
  const g = GEARS[gi];
  const pitch = (2 * Math.PI) / g.teeth;
  gearDisc(img, 24, 24, g.r, g.teeth, 0.2 + sense * f * (pitch / 4));
  chalkArrow(img, 24, 24, sense);
  pawl(img, 24, 24, g.r, sense > 0 ? -1 : 1);
  return ink(img, WOOD.ink).scale(2);
}

function socketFrame(gi) {
  const img = new Img(48, 48);
  const g = GEARS[gi];
  // Contorno de tiza discontinuo del tamaño que admite, soporte y eje
  for (let a = 0; a < Math.PI * 2; a += 0.09) if (Math.floor(a / 0.27) % 2 === 0) px(img, 24 + Math.cos(a) * (g.r + 1), 24 + Math.sin(a) * (g.r + 1), '#E8E6DC');
  rect(img, 20, 20, 27, 27, WOOD.iron);
  rect(img, 21, 21, 26, 26, '#46443F');
  rect(img, 23, 23, 24, 24, WOOD.hub);
  return img.scale(2);
}

function crownFrame(f) {
  const img = new Img(48, 48);
  gearDisc(img, 24, 24, 16, 14, 0.1 + f * ((2 * Math.PI) / 14 / 4));
  disc(img, 24, 24, 5, '#5E5C58');
  disc(img, 24, 24, 2.4, WOOD.hub);
  return ink(img, WOOD.ink).scale(2);
}

const STONE = { face: '#B9B3A6', shade: '#8F897C', hi: '#D8D2C4', groove: '#77716A', eye: '#2A2622', gold: '#FFE08A' };

function millstoneFrame(f, sense, open = null) {
  const img = new Img(48, 48);
  const rot = sense * f * (Math.PI / 8);
  disc(img, 24, 25, 21, (x, y, d) => {
    if (d > 20) return STONE.shade;
    const a = Math.atan2(y + 0.5 - 25, x + 0.5 - 24) - rot;
    const groove = d > 7 && Math.abs(Math.sin(a * 5 + d * 0.18)) < 0.12;
    if (groove) return STONE.groove;
    return (x + y) < 46 ? STONE.hi : STONE.face;
  });
  disc(img, 24, 25, 6, open ? '#1E1A17' : STONE.eye);
  if (open === 'tablet') {
    rect(img, 21, 22, 27, 28, '#6FB7E8');
    rect(img, 22, 23, 26, 27, '#A6DAF8');
    px(img, 23, 24, '#FFFFFF');
  }
  if (!open) rect(img, 23, 24, 25, 26, '#5A5550');
  return ink(img, '#3A3530').scale(2);
}

// ───────────────────────────── Cuadro de la subestación ─────────────────────────────

const ELEC = { cable: '#2F2F33', copper: '#C07A3A', lit: '#FFE066', box: '#8C949C', boxShade: '#5F666D', boxHi: '#B8C0C8', lampOff: '#3A3F44', lampOn: '#FFD84A', burnt: '#3A3530', scorch: '#241F1C', spark: '#FFF3A0', knob: '#C0392B', plate: '#6F767D' };

function cableH(img, x0, x1, lit = false) { rect(img, x0, 7, x1, 8, lit ? ELEC.lit : ELEC.cable); }
function cableV(img, y0, y1, lit = false) { rect(img, 7, y0, 8, y1, lit ? ELEC.lit : ELEC.cable); }

function nodeFrame(on) {
  const img = new Img(16, 16);
  cableH(img, 0, 15, on); cableV(img, 0, 15, on);
  rect(img, 3, 3, 12, 12, ELEC.box);
  rect(img, 11, 4, 12, 12, ELEC.boxShade);
  rect(img, 3, 3, 12, 3, ELEC.boxHi);
  rect(img, 6, 6, 9, 9, on ? ELEC.lampOn : ELEC.lampOff);
  if (on) { px(img, 6, 6, '#FFFFFF'); }
  for (const [x, y] of [[4, 4], [11, 4], [4, 11], [11, 11]]) px(img, x, y, ELEC.plate);
  return img.scale(2);
}

function burntFrame(f) {
  const img = new Img(16, 16);
  cableH(img, 0, 15); cableV(img, 0, 15);
  for (const [x, y] of [[1, 2], [13, 1], [2, 13], [14, 12], [0, 8], [15, 6], [7, 0], [9, 15]]) rect(img, x, y, x + 1, y + 1, ELEC.scorch);
  rect(img, 3, 3, 12, 12, ELEC.burnt);
  rect(img, 4, 4, 11, 11, ELEC.scorch);
  line(img, 5, 5, 10, 10, '#5A4A40'); line(img, 10, 5, 5, 10, '#5A4A40');
  const sparks = [[[2, 4], [12, 13], [13, 3]], [[4, 13], [13, 9], [1, 10]], [[12, 2], [3, 3], [14, 14]], []][f];
  for (const [x, y] of sparks) { px(img, x, y, ELEC.spark); px(img, x + 1, y, '#FFFFFF'); px(img, x, y - 1, ELEC.spark); }
  return img.scale(2);
}

function switchH(state) {
  const img = new Img(16, 16);
  const lit = state === 'lit';
  if (state === 'cable') { cableH(img, 0, 15); return img.scale(2); }
  cableH(img, 0, 4, lit); cableH(img, 11, 15, lit);
  rect(img, 3, 9, 5, 10, ELEC.plate); rect(img, 10, 9, 12, 10, ELEC.plate);
  if (state === 'open') {
    line(img, 5, 7, 10, 2, '#C9CDD2'); line(img, 5, 8, 10, 3, '#9AA0A6');
    rect(img, 10, 1, 11, 2, ELEC.knob);
  } else {
    rect(img, 5, 7, 10, 8, lit ? ELEC.lit : '#C9CDD2');
    rect(img, 10, 5, 11, 6, ELEC.knob);
  }
  return img.scale(2);
}

// ───────────────────────────── Molino del Diezmo: sacos, rueda hidráulica ─────────────────────────────

const SACK = { cloth: '#E8DCC0', shade: '#C4B48E', dark: '#9C8A64', tie: '#7A5A36', flour: '#FBF8EE', crate: '#A8743E', crateDark: '#7A5028' };

function sackShape(img, x0, y0, w, h) {
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const half = (w / 2) * (0.72 + 0.28 * Math.sin(Math.PI * Math.min(1, t * 1.2)));
    for (let x = -half; x <= half; x++) px(img, x0 + w / 2 + x, y0 + y, x > half * 0.45 ? SACK.shade : (y < 2 ? SACK.flour : SACK.cloth));
  }
  line(img, x0 + w / 2 - 2, y0 + 2, x0 + w / 2 + 2, y0 + 2, SACK.tie);
  px(img, x0 + w / 2, y0 + 1, SACK.tie);
}

function sacksFrame(v) {
  const img = new Img(16, 16);
  if (v === 2) { // caja de madera
    rect(img, 2, 5, 13, 15, SACK.crate); rect(img, 2, 5, 13, 6, '#C08A54'); rect(img, 11, 7, 13, 15, SACK.crateDark);
    line(img, 3, 8, 12, 14, SACK.crateDark); line(img, 3, 14, 12, 8, SACK.crateDark);
    return ink(img, '#3A2A1A').scale(2);
  }
  if (v === 0) { sackShape(img, 1, 6, 8, 10); sackShape(img, 7, 5, 8, 11); sackShape(img, 4, 1, 8, 9); }
  else { sackShape(img, 3, 4, 10, 12); }
  rect(img, 1, 15, 14, 15, SACK.dark);
  return ink(img, '#5A4A30').scale(2);
}

function waterwheelFrame(f) {
  const img = new Img(48, 48);
  const cx = 24; const cy = 24; const R = 21;
  const a0 = f * (Math.PI / 16);
  disc(img, cx, cy, R, (x, y, d) => (d > R - 2.2 ? WOOD.shade : (d < 4 ? WOOD.hub : null)));
  for (let k = 0; k < 8; k++) {
    const a = a0 + (k * Math.PI) / 4;
    line(img, cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1), WOOD.body);
    // Paletas
    const px0 = cx + Math.cos(a) * (R - 1); const py0 = cy + Math.sin(a) * (R - 1);
    line(img, px0, py0, px0 + Math.cos(a) * 3, py0 + Math.sin(a) * 3, WOOD.hi);
  }
  disc(img, cx, cy, R - 7, (x, y, d) => (Math.abs(d - (R - 7)) < 0.7 ? WOOD.shade : null));
  // Agua que cae por las paletas del lado derecho
  for (let y = 4 + (f % 2); y < 46; y += 3) { px(img, cx + R - 1, y, '#9FD8F8'); px(img, cx + R, y + 1, '#DDF4FF'); }
  return ink(img, WOOD.ink).scale(2);
}

// ───────────────────────────── Campana grande del campanil ─────────────────────────────

function bigBellFrame(tilt, glow) {
  const img = new Img(32, 32);
  rect(img, 4, 2, 27, 4, WOOD.body); rect(img, 4, 4, 27, 4, WOOD.shade); // yugo
  rect(img, 5, 4, 6, 29, WOOD.shade); rect(img, 25, 4, 26, 29, WOOD.shade); // soportes
  for (let y = 0; y <= 18; y++) {
    const half = 4 + Math.round((y / 18) ** 1.5 * 7);
    const sh = Math.round((tilt * y) / 18);
    for (let x = -half; x <= half; x++) {
      const c = y === 18 ? TOWER.bellLip : (x > half - 3 ? TOWER.bellShade : (x < -half + 3 ? TOWER.bellHi : TOWER.bell));
      px(img, 16 + x + sh, 6 + y, c);
    }
  }
  px(img, 16 + tilt, 26, TOWER.iron); px(img, 16 + tilt, 27, TOWER.iron);
  if (glow) for (const [x, y] of [[12, 12], [20, 15], [15, 20], [18, 9]]) { px(img, x, y, '#FFF3A0'); px(img, x + 1, y, '#FFFFFF'); }
  return ink(img, '#3A2A1A').scale(2);
}

// ───────────────────────────── Tablillas en el suelo ─────────────────────────────

/** Losa de piedra con el brillo de su tipo (T02 azul, T03 amarillo) que late en 4 fotogramas. */
function plateFrame(glow, f) {
  const img = new Img(16, 16);
  const a = [90, 150, 210, 150][f];
  for (let y = 2; y <= 14; y++) for (let x = 1; x <= 14; x++) {
    const d = Math.hypot(x - 7.5, y - 9);
    if (d < 8 && !(x >= 3 && x <= 12 && y >= 6 && y <= 12)) img.set(x, y, [...hex(glow).slice(0, 3), Math.round(a * (1 - d / 8))]);
  }
  rect(img, 3, 6, 12, 12, '#B8B2A4'); rect(img, 3, 6, 12, 6, '#DDD8CC'); rect(img, 11, 7, 12, 12, '#8E887C');
  for (const [x, y] of [[5, 8], [7, 9], [9, 8], [6, 10], [8, 11]]) px(img, x, y, glow);
  const out = new Img(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) out.set(x, y, img.get(x, y));
  return out.scale(2);
}

// ───────────────────────────── Hierba que se agita ─────────────────────────────

const ANIL_TILES = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Tilesets', 'Exterior1.png');

/** Mata de hierba alta (tile 388 de Exterior1) sacudida: la parte alta se desplaza y saltan hojas. */
function rustleFrame(tuft, f) {
  const img = new Img(32, 32);
  const shift = [0, -4, 0, 4][f];
  for (let y = 0; y < 32; y++) {
    const s = y < 12 ? shift : (y < 22 ? Math.round(shift / 2) : 0);
    for (let x = 0; x < 32; x++) {
      const c = tuft.get(x, y);
      if (c[3]) img.set(x + s, y, c);
    }
  }
  const leaves = [[[6, 3], [25, 6], [14, 1]], [[2, 1], [28, 2], [15, 0], [9, 4]], [[8, 2], [23, 1], [18, 3]], [[1, 4], [29, 1], [17, 0], [22, 5]]][f];
  for (const [x, y] of leaves) { px(img, x, y, '#58B030'); px(img, x + 1, y, '#A8F070'); px(img, x, y + 1, '#3C8A24'); }
  return img;
}

function rot90(img) {
  const out = new Img(img.h, img.w);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) out.set(img.h - 1 - y, x, img.get(x, y));
  return out;
}

// ───────────────────────────── Salida ─────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };

  const mill = [0, 1, 2, 3].map(millFrame);
  const millSheet = save(sheet(same4(mill), 96, 160), 'b05_molino_viento.png');

  const tower = [0, -1, 0, 1].map(towerFrame);
  const towerSheet = save(sheet(same4(tower), 96, 224), 'b05_campanario.png');

  const bolt = [0, 1, 2, 3].map(boltFrame);
  save(sheet(same4(bolt), 96, 384), 'b05_rayo.png');

  const sockets = [socketFrame(0), socketFrame(1), socketFrame(2), crownFrame(0)];
  for (const [sense, suffix] of [[1, 'd'], [-1, 'i']]) {
    const rows = [0, 1, 2].map((gi) => [0, 1, 2, 3].map((f) => gearFrame(gi, sense, f)));
    save(sheet([...rows, sockets], 96, 96), `b05_engranajes_${suffix}.png`);
  }
  const muela = [
    [0, 1, 2, 3].map((f) => millstoneFrame(f, 1)),
    [0, 1, 2, 3].map((f) => millstoneFrame(f, -1)),
    [0, 1, 2, 3].map(crownFrame),
    [millstoneFrame(0, 1, 'tablet'), millstoneFrame(0, 1, 'empty'), millstoneFrame(0, 1, 'empty'), millstoneFrame(0, 1, 'empty')],
  ];
  save(sheet(muela, 96, 96), 'b05_muela.png');

  const h = ['open', 'closed', 'lit', 'cable'].map(switchH);
  const v = ['open', 'closed', 'lit', 'cable'].map((s) => rot90(switchH(s).crop(0, 0, 32, 32)));
  const cuadro = [
    [nodeFrame(false), nodeFrame(true), nodeFrame(true), nodeFrame(false)],
    [0, 1, 2, 3].map(burntFrame),
    h,
    v,
  ];
  save(sheet(cuadro, 32, 32), 'b05_cuadro.png');

  const sacks = [0, 1, 2, 0].map(sacksFrame);
  save(sheet(same4(sacks), 32, 32), 'b05_sacos.png');
  // Rueda hidráulica: fila 2 a derechas, 4 al revés (el Diezmo gira contra el agua hasta T02); 6 y 8, la corona de
  // su eje dentro del molino (a derechas / al revés). Al revés = mismos fotogramas en orden inverso.
  const wheel = [0, 1, 2, 3].map(waterwheelFrame);
  const crown = [0, 1, 2, 3].map(crownFrame);
  const rev = (fr) => [fr[0], fr[3], fr[2], fr[1]];
  save(sheet([wheel, rev(wheel), crown, rev(crown)], 96, 96), 'b05_rueda.png');
  const bell = [
    [0, -1, 0, 1].map((t) => bigBellFrame(t, false)),
    [0, -1, 0, 1].map((t) => bigBellFrame(t, true)),
  ];
  save(sheet([...bell, ...bell], 64, 64), 'b05_campana.png');

  const plates = [
    [0, 1, 2, 3].map((f) => plateFrame('#FFE066', f)),
    [0, 1, 2, 3].map((f) => plateFrame('#6FC8F8', f)),
  ];
  save(sheet([...plates, ...plates], 32, 32), 'b05_tablilla.png');

  const tuft = Img.load(ANIL_TILES).crop(4 * 32, 0, 32, 32);
  const rustle = [0, 1, 2, 3].map((f) => rustleFrame(tuft, f));
  save(sheet(same4(rustle), 32, 32), 'b05_hierba.png');

  if (process.argv.includes('--preview')) {
    files.push(preview(millSheet.crop(0, 0, 96 * 4, 160), { scale: 2, bg: '#9CC870' }).save(path.join(PREVIEW, 'b05_molino_x2.png')));
    files.push(preview(towerSheet.crop(0, 0, 96 * 4, 224), { scale: 2, bg: '#9CC870' }).save(path.join(PREVIEW, 'b05_campanario_x2.png')));
    files.push(preview(Img.load(path.join(OUT, 'b05_engranajes_d.png')), { scale: 1, bg: '#7A5A40' }).save(path.join(PREVIEW, 'b05_engranajes_d.png')));
    files.push(preview(Img.load(path.join(OUT, 'b05_muela.png')), { scale: 1, bg: '#7A5A40' }).save(path.join(PREVIEW, 'b05_muela.png')));
    files.push(preview(Img.load(path.join(OUT, 'b05_cuadro.png')), { scale: 3, bg: '#50565C' }).save(path.join(PREVIEW, 'b05_cuadro_x3.png')));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

build();
