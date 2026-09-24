// Transiciones de pantalla en GLSL (inspiradas en las de Essentials 022_Scenes/002_Transitions.rb y
// 039_Battle triggering/003: SnakeSquares, DiagonalBubble, RisingSplash, barras, espiral, mosaico,
// acercamiento, piezas que encogen, iris). t = 0 → imagen intacta, t = 1 → negro.
import { SCREEN_W, SCREEN_H } from '../core/engine.js';

export const TRANSITIONS = {
  fade: 1,
  snakeSquares: 2,
  diagonalBubbleTL: 3,
  diagonalBubbleBR: 4,
  risingSplash: 5,
  bars: 6,
  spinBall: 7,
  mosaic: 8,
  zoomIn: 9,
  shrinkingPieces: 10,
  iris: 11,
};
export const TRANSITION_NAMES = Object.keys(TRANSITIONS);

const W = `${SCREEN_W}.0`;
const H = `${SCREEN_H}.0`;

export const TRANSITION_GLSL = /* glsl */`
float hash21(vec2 q, float s) { return fract(sin(dot(q + s, vec2(12.9898, 78.233))) * 43758.5453); }
vec4 sampleAt(sampler2D tex, vec2 p) {
  vec2 uv = vec2((floor(p.x) + 0.5) / ${W}, 1.0 - (floor(p.y) + 0.5) / ${H});
  return texture2D(tex, uv);
}
vec4 transitionColor(sampler2D tex, vec2 p, int type, float t, vec2 center, float seed) {
  vec4 c = sampleAt(tex, p);
  vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
  if (type == 0) return c;
  if (type == 1) return mix(c, black, t);
  if (type == 2) { // SnakeSquares
    vec2 cell = floor(p / 32.0);
    float order = cell.y * 16.0 + (mod(cell.y, 2.0) < 0.5 ? cell.x : 15.0 - cell.x);
    float local = clamp((t - order / 192.0 * 0.7) / 0.3, 0.0, 1.0);
    vec2 d = abs(p - (cell * 32.0 + 16.0));
    return (max(d.x, d.y) < local * 16.5) ? black : c;
  }
  if (type == 3 || type == 4) { // DiagonalBubble
    vec2 cell = floor(p / 32.0);
    float diag = (cell.x + cell.y) / 26.0;
    if (type == 4) diag = 1.0 - diag;
    float r = clamp((t - diag * 0.6) / 0.4, 0.0, 1.0) * 23.0;
    return distance(p, cell * 32.0 + 16.0) < r ? black : c;
  }
  if (type == 5) { // RisingSplash
    float level = ${H} * (1.0 - t * 1.2) + sin(p.x * 0.045 + t * 18.0) * 10.0 + sin(p.x * 0.11 - t * 11.0) * 5.0;
    return p.y > level ? black : c;
  }
  if (type == 6) { // barras horizontales alternas
    float bar = floor(p.y / 32.0);
    float delay = hash21(vec2(bar, 3.0), seed) * 0.25;
    float x = mod(bar, 2.0) < 0.5 ? p.x : ${W} - p.x;
    return x < (t * 1.3 - delay) * ${W} ? black : c;
  }
  if (type == 7) { // espiral de dos aspas
    vec2 d = p - center;
    float a = (atan(d.y, d.x) + 3.14159265) / 6.2831853;
    float blades = fract(a * 2.0 + length(d) / 900.0);
    return blades < t * 1.05 ? black : c;
  }
  if (type == 8) { // mosaico
    float s = 1.0 + floor(t * t * 30.0);
    vec2 q = (floor(p / s) + 0.5) * s;
    return mix(sampleAt(tex, q), black, smoothstep(0.55, 1.0, t));
  }
  if (type == 9) { // acercamiento
    vec2 q = center + (p - center) / (1.0 + t * 3.0);
    return mix(sampleAt(tex, q), black, t * t);
  }
  if (type == 10) { // piezas que encogen (BreakingGlass/ShrinkingPieces)
    vec2 cell = floor(p / 64.0);
    vec2 cc = cell * 64.0 + 32.0;
    float delay = hash21(cell, seed) * 0.45;
    float s = 1.0 - clamp((t - delay) / 0.55, 0.0, 1.0);
    vec2 fall = vec2(0.0, (1.0 - s) * (1.0 - s) * 24.0);
    vec2 local = (p - cc - fall) / max(s, 0.001);
    if (s <= 0.0 || abs(local.x) > 32.0 || abs(local.y) > 32.0) return black;
    return sampleAt(tex, cc + local);
  }
  if (type == 11) { // iris sobre el centro
    return distance(p, center) > (1.0 - t) * 660.0 ? black : c;
  }
  return c;
}`;
