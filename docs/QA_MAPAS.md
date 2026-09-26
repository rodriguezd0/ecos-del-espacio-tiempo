# QA de mapas: árboles, solapes y costuras

**Generado** con `node tools/qa_maps.mjs` (no editar a mano; vuelve a generarlo tras arreglar un mapa). Reglas en
`docs/stamps.md` («Bosques», «Pasabilidad de la decoración», «Herramientas de QA»). Coordenadas en casillas del mapa.

- **Árboles cortados**: unidades de árbol a las que les falta una parte (copa sin punta, medio árbol, tronco tapado
  por otro stamp o un camino). El pincel de bosque ya no los crea; quedan los que un stamp/camino pinta encima, los
  claros del trazo y los árboles que no se pudieron completar porque encima había algo (evento, camino, stamp).
- **Stamps sobre árboles** / **eventos dentro de un árbol**: carteles, plantas, rocas o NPC que atraviesan un árbol.
- **Copa sobre capa 1**: la copa de un árbol tapa un camino, hierba alta u otra pieza (caminos que se cortan de golpe).
- **Costuras**: `tools/check_seams.mjs` (PNG en `tools/cache/seams/<A>__<dir>__<B>.png`: rojo = árbol partido,
  naranja = suelo que cambia de golpe, magenta = objeto cortado por el borde).

Total: 209 mapas, 13 con avisos — 0 casillas de árbol cortado, 0
stamps sobre árboles, 13 stamps sólidos pisando otro, 0 eventos dentro de árboles,
322 casillas de copa sobre capa 1, 0 rocas de agua en tierra; 0/47 costuras con problemas.
De los mapas con avisos, 13 solo tienen falsos positivos ya revisados (`tools/qa_maps_notes.mjs`; «(rev.)» en la tabla).

## Progreso de la revisión

- **B04–B21 (sin la Ruta 3), 26-09-2026**: 0 árboles cortados, 0 stamps sobre árboles, 0 eventos en árbol y 0 rocas
  de agua en tierra (antes: 316 casillas, 73, 9 y 2); sólidos pisándose 13 (antes 80: quedan los del Santuario del
  Alma, revisados); copas sobre la capa 1: 322 casillas (antes 482), todas árboles sobre suelo de la capa 1 (césped
  claro, nieve, cima de terraza o roca, borde de playa), revisadas. Costuras: de las 21 con problemas, 19 tocaban
  estos bloques; ahora todas las de B04–B21 salen «bien».
  Herramientas: `check_seams` ya no cuenta como suelo que salta las paredes que no se pisan (caras de acantilado,
  muros) ni las casillas tapadas por una copa entera, y no da por cortado un objeto que el mapa vecino sigue
  dibujando; `game/src/content/maps/pathBlend.js` (`blendPath`: transición entre dos caminos de material distinto;
  `edgeMask`: camino que sigue por la costura sin borde de hierba).

## Resumen por mapa

| Mapa | Árboles cortados | Stamps sobre árboles | Sólidos pisándose | Eventos en árbol | Copa sobre capa 1 | Rocas de agua |
|---|---|---|---|---|---|---|
| garganta_albo |  |  |  |  | 14 (rev.) |  |
| ciudad_estrato |  |  |  |  | 48 (rev.) |  |
| ciudad_lumina |  |  |  |  | 72 (rev.) |  |
| ruta_14_reserva |  |  |  |  | 14 (rev.) |  |
| ruta_7 |  |  |  |  | 28 (rev.) |  |
| caleta_sonda |  |  |  |  | 2 (rev.) |  |
| ciudad_nexo |  |  |  |  | 8 (rev.) |  |
| ruta_10 |  |  |  |  | 6 (rev.) |  |
| islote_lumbre |  |  |  |  | 40 (rev.) |  |
| ruta_11 |  |  |  |  | 5 (rev.) |  |
| lagos_alma |  |  |  |  | 81 (rev.) |  |
| santuario_alma |  |  | 13 (rev.) |  |  |  |
| calzada_rey |  |  |  |  | 4 (rev.) |  |

## Costuras entre mapas conectados

- laberinto_profundidad —south→ villa_alba: bien
- ruta_1 —north→ villa_alba: bien
- ruta_1 —south→ villa_zaguan: bien
- ruta_1 —west→ ruta_10: bien
- explanada_umbral —east→ villa_zaguan: bien
- villa_zaguan —south→ ruta_2: bien
- ciudad_caudal —north→ ruta_2: bien
- ciudad_caudal —west→ ruta_3: bien
- ciudad_caudal —east→ ruta_4: bien
- ciudad_caudal —south→ senda_mirador: bien
- garganta_albo —south→ ruta_3: bien
- ruta_4 —east→ villa_brontia: bien
- villa_brontia —east→ ruta_5: bien
- villa_brontia —south→ ruta_6: bien
- villa_brontia —north→ ruta_11: bien
- meseta_impulso —west→ ruta_5: bien
- ruta_6 —south→ ciudad_estrato: bien
- ciudad_estrato —east→ dunas_ceniza: bien
- ciudad_estrato —west→ ruta_7: bien
- ciudad_lumina —east→ ruta_7: bien
- ciudad_lumina —south→ ruta_14_reserva: bien
- ciudad_lumina —west→ ruta_8_marisma: bien
- ciudad_lumina —north→ mirador_sur: bien
- ruta_14_reserva —south→ ciudad_nexo: bien
- ruta_7 —north→ calzada_rey: bien
- caleta_sonda —east→ ruta_15: bien
- caleta_sonda —south→ mar_del_sur: bien
- ciudad_nexo —west→ ruta_15: bien
- ciudad_nexo —south→ mar_del_sur: bien
- ruta_15 —south→ mar_del_sur: bien
- ruta_8_marisma —north→ aldea_mnemos: bien
- aldea_mnemos —north→ ruta_9_neblino: bien
- campamento_monte —east→ ruta_10: bien
- ruta_10 —south→ ruta_9_neblino: bien
- estacion_talasa —north→ mar_del_sur: bien
- islote_lumbre —north→ mar_del_sur: bien
- mar_del_sur —east→ volcan_tizon: bien
- arrecife_eco —east→ fondo_mar_sur: bien
- mar_boreal —east→ villa_boreal: bien
- paso_del_norte —south→ ruta_11: bien
- paso_del_norte —north→ ruta_13: bien
- paso_del_norte —west→ ruta_12_senda_lazo: bien
- ruta_13 —north→ villa_boreal: bien
- villa_boreal —north→ lagos_alma: bien
- mirador_sur —north→ puente_convergencia: bien
- senda_mirador —south→ puente_convergencia: bien
- dev_test_este —west→ dev_test: bien

## Detalle por mapa

### garganta_albo

`game/src/content/maps/b04/garganta_albo.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (4): x 6, y 34–37 (4); x 33, y 36–37 (2); x 3–4, y 38–39 (4); x 35–36, y 38–39 (4)
  - *Revisado, falso positivo*: pinos agarrados a las repisas de la roca: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta) (cima de la terraza).

### ciudad_estrato

`game/src/content/maps/b08/ciudad_estrato.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (11): x 0–3, y 0–1 (8); x 48, y 0–3 (4); x 54, y 0–3 (4); x 50, y 1–4 (4); x 48, y 5–8 (4); x 52, y 6–9 (4); x 54, y 10–13 (4); x 50, y 11–14 (4); x 48, y 14–17 (4); x 54, y 15–18 (4); x 50, y 17–20 (4)
  - *Revisado, falso positivo*: pinos sobre la cima del macizo de roca de la mina y del cañón: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta) (acantilado).

### ciudad_lumina

`game/src/content/maps/b09a/ciudad_lumina.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (10): x 68–69, y 3–6 (8); x 3–4, y 39–41 (6); x 9–10, y 39–41 (6); x 26–27, y 39–41 (6); x 17–18, y 41–44 (8); x 29–30, y 41–44 (8); x 3–4, y 50–53 (8); x 29–30, y 51–54 (8); x 6–7, y 53–56 (8); x 9–10, y 54–56 (6)
  - *Revisado, falso positivo*: árboles del parque, del patio de la guardería y de la terraza del museo sobre el césped claro: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta).

### ruta_14_reserva

`game/src/content/maps/b09a/ruta_14_reserva.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (4): x 40–41, y 38–44 (8); x 43–44, y 38 (2); x 50–51, y 38 (2); x 54–55, y 38 (2)
  - *Revisado, falso positivo*: frutales del huerto de la Reserva sobre el césped claro: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta).

### ruta_7

`game/src/content/maps/b09a/ruta_7.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (4): x 84–85, y 9–12 (8); x 68–69, y 11–14 (8); x 87–88, y 11–14 (8); x 65–66, y 13–14 (4)
  - *Revisado, falso positivo*: árboles del valle sobre las calvas de césped claro: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta).

### caleta_sonda

`game/src/content/maps/b09b/caleta_sonda.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 20–21, y 0 (2)
  - *Revisado, falso positivo*: pinar del borde norte sobre el remate de la terraza: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta).

### ciudad_nexo

`game/src/content/maps/b09b/ciudad_nexo.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 1–2, y 33–34 (4); x 9–10, y 34–35 (4)
  - *Revisado, falso positivo*: palmeras de la playa sobre el borde de la arena: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta).

### ruta_10

`game/src/content/maps/b11/ruta_10.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 50–51, y 0–2 (6)
  - *Revisado, falso positivo*: pinar del este sobre el borde de la terraza del tramo alto: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta).

### islote_lumbre

`game/src/content/maps/b13/islote_lumbre.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 3–6, y 7–18 (20); x 17–20, y 7–18 (20)
  - *Revisado, falso positivo*: cerezos del prado sobre el césped claro y el borde de la playa: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta).

### ruta_11

`game/src/content/maps/b15/ruta_11.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 0–1, y 64 (2); x 28–29, y 64–65 (3)
  - *Revisado, falso positivo*: pinos del borde de la pradera sobre la franja de nieve: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta) (nieve).

### lagos_alma

`game/src/content/maps/b16/lagos_alma.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (26): x 9–10, y 8 (2); x 52–53, y 8 (2); x 56–57, y 8–9 (3); x 3, y 9 (1); x 1–2, y 12–13 (3); x 58, y 12–13 (2); x 1, y 16–17 (2); x 58, y 16–17 (2); x 1, y 20–21 (2); x 58, y 20–21 (2); x 1, y 24–25 (2); x 57, y 24–25 (2); x 1–3, y 28–29 (4); x 57, y 28–29 (2); x 1, y 32–33 (2); x 58, y 32–33 (2); x 1–2, y 36–37 (3); x 57–58, y 36–37 (3); x 2–5, y 39–41 (7); x 52–53, y 39 (2); x 1, y 44–45 (2); x 1, y 48–49 (2); x 2–3, y 52–53 (3); x 4–9, y 54 (6); x 18–26, y 54 (9); x 43–51, y 54 (9)
  - *Revisado, falso positivo*: pinar nevado sobre la nieve (capa 1): el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta).

### santuario_alma

`game/src/content/maps/b16/santuario_alma.js`

- **Stamps sólidos pisando otro** (13): `pilar_columna_quebrada` (35,9) sobre `pilar_arista`; `estatua_busto` (30,6) sobre `pilar_columna`; `estatua_busto` (26,4) sobre `pilar_columna`; `estatua_busto` (29,4) sobre `pilar_columna`; `pilar_dintel` (27,0) sobre `pilar_columna`; `pilar_columna` (32,22) sobre `pilar_columna`; `estatua_busto` (32,21) sobre `pilar_columna`; `pilar_columna` (29,20) sobre `pilar_columna`; `pilar_columna` (28,18) sobre `pilar_columna`; `pilar_columna` (27,16) sobre `estatua_busto`; `pilar_dintel` (27,14) sobre `pilar_columna`; `estatua_busto` (28,30) sobre `pilar_columna`; `pilar_dintel` (27,28) sobre `pilar_columna`
  - *Revisado, falso positivo*: salas del espejo: obstáculos de una casilla con pieza alta (columnas, bustos, aristas) en casillas vecinas; la parte alta de cada pieza se dibuja sobre la de encima a propósito y las bases se reescriben al final (santuario_build.js#obstacles), así cada casilla bloquea donde se ve su base.

### calzada_rey

`game/src/content/maps/b19/calzada_rey.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 42–43, y 17–18 (4)
  - *Revisado, falso positivo*: pino del islote del cañón sobre su césped claro: el árbol está plantado sobre suelo pintado en la capa 1 (no es camino ni hierba alta).

