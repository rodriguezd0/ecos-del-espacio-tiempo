// Enlaces del Bloque 17 con mapas de otros bloques (docs/CAMPANA.md §1.3–1.4). Módulo puro (Node y navegador).
//   · Activos (los dos lados existen): Senda del Mirador ↔ Ciudad Caudal (B03) y Mirador Sur ↔ Ciudad Lúmina (B09a);
//     Caudal y Lúmina los tienen preparados y se abren solos al registrar estos mapas.
//   · Puente de la Convergencia (B18, `puente_convergencia`): conecta su borde norte con el sur de la Senda (x 18–22) y
//     su borde sur con el norte del Mirador Sur (x 19–21), offset 0 en los dos sentidos. Se activa si está registrado.
//   · Sima del Eje (`sima_eje`, B19): los bordes de la Sima los ocupa el Puente, así que la Sima entra por las bajadas
//     (Senda: final de la bajada en x 11–12, y 49 · Mirador Sur: x 3–4, y 0) con los warps de B19
//     (`b19/links.js#descentWarps`, ya en las dos definiciones). Si `sima_eje` no estuviera registrada, cada bajada se
//     cierra con un aviso neutro.
import { MAPS } from '../index.js';

export function mapRegistered(id) {
  return Object.hasOwn(MAPS, id);
}

export const PENDING_LINKS = Object.freeze({
  senda_mirador: Object.freeze({
    sima_eje: Object.freeze({
      block: 'B19', kind: 'warp', from: Object.freeze({ x0: 11, x1: 12, y: 49 }),
      expect: 'B19 añade en senda_mirador un warp al final de la bajada (x 11–12, y 49, pulsando abajo) hacia sima_eje y la vuelta a (11, 48) ↑.',
      blocked: 'Un sendero estrecho baja por la pared hacia el fondo de la Sima. Más abajo, un desprendimiento lo corta.',
    }),
  }),
  mirador_sur: Object.freeze({
    sima_eje: Object.freeze({
      block: 'B19', kind: 'warp', from: Object.freeze({ x0: 3, x1: 4, y: 0 }),
      expect: 'B19 añade en mirador_sur un warp al final de la bajada (x 3–4, y 0, pulsando arriba) hacia sima_eje y la vuelta a (3, 1) ↓.',
      blocked: 'BAJADA DE LA SIMA\nCerrada por desprendimientos. No se permite el paso.',
    }),
  }),
});

/** Texto del aviso de un enlace cerrado. */
export function blockedText(from, to) {
  return PENDING_LINKS[from]?.[to]?.blocked || 'Por ahora no puedes continuar.';
}
