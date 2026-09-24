// Arte propio del Bloque 8 — Pilar de la Masa (PROVISIONAL, D30) con tools/pixel.mjs.
// Uso: node tools/b08_assets.mjs [--preview]   (vistas ampliadas en tools/cache/pixel/prev_b08_*.png)
// Genera en game/assets/objects/ las hojas de la Cámara de los Contrapesos (tools/b08_assets_camara.mjs) y las de
// Estrato, la Mina Galena y el Cerro Plomo (tools/b08_assets_ciudad.mjs). Cada módulo documenta sus hojas.
import { buildCamara } from './b08_assets_camara.mjs';
import { buildCiudad } from './b08_assets_ciudad.mjs';

buildCamara();
buildCiudad();
