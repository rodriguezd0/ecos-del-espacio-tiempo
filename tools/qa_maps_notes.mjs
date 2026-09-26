// Avisos de tools/qa_maps.mjs revisados a mano y descartados como falsos positivos (con su porqué). qa_maps.mjs los
// sigue listando, pero los marca como revisados en docs/QA_MAPAS.md. Una nota solo vale mientras el recuento no cambie:
// si el mapa gana o pierde casillas en esa categoría, la nota deja de aplicarse y el aviso vuelve a salir sin marcar.
//   REVIEWED[mapa][categoría] = { n: recuento revisado, why: 'motivo' }
//   categorías: cut, onTree, solid, events, under, rocks (las de la tabla de docs/QA_MAPAS.md)

const GROUND = 'el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta)';

export const REVIEWED = Object.freeze({
  // ── B04–B21 (revisión de costuras y solapes, 26-09-2026) ──
  garganta_albo: { under: { n: 14, why: `pinos agarrados a las repisas de la roca: ${GROUND} (cima de la terraza)` } },
  caleta_sonda: { under: { n: 2, why: `pinar del borde norte sobre el remate de la terraza: ${GROUND}` } },
  ruta_10: { under: { n: 6, why: `pinar del este sobre el borde de la terraza del tramo alto: ${GROUND}` } },
  ciudad_estrato: { under: { n: 48, why: `pinos sobre la cima del macizo de roca de la mina y del cañón: ${GROUND} (acantilado)` } },
  ciudad_lumina: { under: { n: 72, why: `árboles del parque, del patio de la guardería y de la terraza del museo sobre el césped claro: ${GROUND}` } },
  ruta_14_reserva: { under: { n: 14, why: `frutales del huerto de la Reserva sobre el césped claro: ${GROUND}` } },
  ruta_7: { under: { n: 28, why: `árboles del valle sobre las calvas de césped claro: ${GROUND}` } },
  calzada_rey: { under: { n: 4, why: `pino del islote del cañón sobre su césped claro: ${GROUND}` } },
  ciudad_nexo: { under: { n: 8, why: `palmeras de la playa sobre el borde de la arena: ${GROUND}` } },
  islote_lumbre: { under: { n: 40, why: `cerezos del prado sobre el césped claro y el borde de la playa: ${GROUND}` } },
  ruta_11: { under: { n: 5, why: `pinos del borde de la pradera sobre la franja de nieve: ${GROUND} (nieve)` } },
  lagos_alma: { under: { n: 81, why: `pinar nevado sobre la nieve (capa 1): ${GROUND}` } },
  santuario_alma: {
    solid: {
      n: 13,
      why: 'salas del espejo: obstáculos de una casilla con pieza alta (columnas, bustos, aristas) en casillas vecinas; la '
        + 'parte alta de cada pieza se dibuja sobre la de encima a propósito y las bases se reescriben al final '
        + '(santuario_build.js#obstacles), así cada casilla bloquea donde se ve su base',
    },
  },
});

/** Constancia del progreso de las revisiones (líneas de Markdown; se copian tal cual en docs/QA_MAPAS.md). */
export const PROGRESS = Object.freeze([
  '## Progreso de la revisión',
  '',
  '- **B04–B21 (sin la Ruta 3), 26-09-2026**: 0 árboles cortados, 0 stamps sobre árboles, 0 eventos en árbol y 0 rocas',
  '  de agua en tierra (antes: 316 casillas, 73, 9 y 2); sólidos pisándose 13 (antes 80: quedan los del Santuario del',
  '  Alma, revisados); copas sobre la capa 1: 322 casillas (antes 482), todas árboles sobre suelo de la capa 1 (césped',
  '  claro, nieve, cima de terraza o roca, borde de playa), revisadas. Costuras: de las 21 con problemas, 19 tocaban',
  '  estos bloques; ahora todas las de B04–B21 salen «bien».',
  '  Herramientas: `check_seams` ya no cuenta como suelo que salta las paredes que no se pisan (caras de acantilado,',
  '  muros) ni las casillas tapadas por una copa entera, y no da por cortado un objeto que el mapa vecino sigue',
  '  dibujando; `game/src/content/maps/pathBlend.js` (`blendPath`: transición entre dos caminos de material distinto;',
  '  `edgeMask`: camino que sigue por la costura sin borde de hierba).',
  '',
]);

/** Nota vigente para (mapa, categoría, recuento actual) o null. */
export function reviewedNote(id, cat, n) {
  const note = REVIEWED[id]?.[cat];
  return note && note.n === n ? note.why : null;
}
