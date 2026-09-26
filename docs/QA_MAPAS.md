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

Total: 209 mapas, 60 con avisos — 422 casillas de árbol cortado, 88
stamps sobre árboles, 92 stamps sólidos pisando otro, 16 eventos dentro de árboles,
621 casillas de copa sobre capa 1, 2 rocas de agua en tierra; 21/47 costuras con problemas.

## Resumen por mapa

| Mapa | Árboles cortados | Stamps sobre árboles | Sólidos pisándose | Eventos en árbol | Copa sobre capa 1 | Rocas de agua |
|---|---|---|---|---|---|---|
| laberinto_profundidad |  |  |  |  | 20 |  |
| ruta_1 | 4 | 1 |  |  | 4 |  |
| villa_alba | 4 | 2 |  |  | 3 |  |
| explanada_umbral | 30 | 5 | 1 |  |  |  |
| ruinas_dintel |  |  | 3 |  |  |  |
| villa_zaguan | 3 | 1 |  | 7 | 38 |  |
| ciudad_caudal | 7 | 1 | 6 |  | 7 |  |
| ruta_2 | 13 | 3 | 1 |  | 5 |  |
| garganta_albo | 14 | 5 | 2 |  | 22 |  |
| pilar_corriente |  |  | 1 |  |  |  |
| pozo_albo |  |  | 1 |  |  |  |
| ruta_3 | 45 | 2 | 1 |  | 62 |  |
| brontia_posada |  |  | 2 |  |  |  |
| ruta_4 | 2 | 3 | 2 | 1 | 14 |  |
| villa_brontia | 2 | 3 | 2 |  | 1 |  |
| meseta_impulso |  |  |  |  | 2 |  |
| ruta_5 | 3 | 3 | 1 |  | 3 |  |
| ruta_6 | 3 | 2 | 2 |  | 22 |  |
| cerro_plomo |  |  | 1 |  |  |  |
| ciudad_estrato | 7 | 4 | 3 |  | 54 |  |
| mina_galena |  |  | 1 |  |  |  |
| ciudad_lumina | 29 | 12 | 8 | 2 | 99 |  |
| ruta_14_reserva | 11 |  |  |  | 16 |  |
| ruta_7 | 13 | 2 | 1 | 1 | 28 |  |
| caleta_sonda |  |  |  |  | 2 |  |
| ciudad_nexo | 5 | 2 | 4 |  | 8 |  |
| palafitos_casa |  |  | 1 |  |  |  |
| ruta_15 |  | 1 |  |  | 2 |  |
| ruta_8_marisma | 46 | 1 |  |  | 11 |  |
| aldea_mnemos | 45 | 2 |  | 1 |  |  |
| archivo_hondo |  |  | 1 |  |  |  |
| mnemos_archivo |  |  | 1 |  |  |  |
| campamento_monte | 3 |  |  |  | 8 |  |
| cerro_alba |  |  |  |  | 9 |  |
| ruta_10 | 13 | 1 |  | 1 | 8 |  |
| monte_gruta |  |  | 1 |  |  |  |
| pilar_invertido |  |  | 1 |  |  |  |
| estacion_talasa |  |  | 1 |  |  |  |
| islote_lumbre | 5 | 4 | 2 |  | 45 |  |
| talasa_laboratorio |  |  | 2 |  |  |  |
| talasa_pilotes |  |  | 3 |  |  |  |
| antea_2_antea | 5 |  |  |  |  |  |
| antea_3_primigenia | 31 |  |  | 2 | 2 |  |
| antea_4_primigenia | 28 | 2 |  |  |  |  |
| boreal_casa |  |  | 1 |  |  |  |
| boreal_lago |  | 1 |  |  |  |  |
| boreal_posada |  |  | 2 |  |  |  |
| mar_boreal |  |  | 1 |  |  |  |
| ruta_11 |  |  |  |  | 5 |  |
| ruta_13 |  |  |  | 1 |  |  |
| villa_boreal |  | 4 | 1 |  |  |  |
| lagos_alma | 28 | 11 | 1 |  | 107 |  |
| santuario_alma |  |  | 13 |  |  |  |
| mesa_vientos_casa |  |  | 1 |  |  |  |
| mesa_vientos |  |  | 2 |  |  |  |
| mirador_sur | 8 | 3 | 6 |  | 4 |  |
| senda_mirador | 13 | 6 | 4 |  | 6 |  |
| puente_convergencia |  |  | 2 |  |  |  |
| calzada_rey | 2 | 1 | 2 |  | 4 |  |
| senda_origen_7_fondo |  |  |  |  |  | 2 |

## Costuras entre mapas conectados

- laberinto_profundidad —south→ villa_alba: 2 casilla(s) de suelo que cambia de golpe
- ruta_1 —north→ villa_alba: bien
- ruta_1 —south→ villa_zaguan: bien
- ruta_1 —west→ ruta_10: bien
- explanada_umbral —east→ villa_zaguan: bien
- villa_zaguan —south→ ruta_2: bien
- ciudad_caudal —north→ ruta_2: bien
- ciudad_caudal —west→ ruta_3: 7 casilla(s) de suelo que cambia de golpe
- ciudad_caudal —east→ ruta_4: 4 casilla(s) de suelo que cambia de golpe
- ciudad_caudal —south→ senda_mirador: 4 casilla(s) de suelo que cambia de golpe
- garganta_albo —south→ ruta_3: 7 casilla(s) de suelo que cambia de golpe
- ruta_4 —east→ villa_brontia: 9 casilla(s) de suelo que cambia de golpe
- villa_brontia —east→ ruta_5: 7 casilla(s) de suelo que cambia de golpe
- villa_brontia —south→ ruta_6: 2 árbol(es) partido(s); 1 objeto(s) cortado(s) (pino@ruta_6); 19 casilla(s) de suelo que cambia de golpe
- villa_brontia —north→ ruta_11: bien
- meseta_impulso —west→ ruta_5: bien
- ruta_6 —south→ ciudad_estrato: 1 objeto(s) cortado(s) (mansion_ladrillo@ciudad_estrato); 21 casilla(s) de suelo que cambia de golpe
- ciudad_estrato —east→ dunas_ceniza: bien
- ciudad_estrato —west→ ruta_7: 24 casilla(s) de suelo que cambia de golpe
- ciudad_lumina —east→ ruta_7: 6 casilla(s) de suelo que cambia de golpe
- ciudad_lumina —south→ ruta_14_reserva: 4 casilla(s) de suelo que cambia de golpe
- ciudad_lumina —west→ ruta_8_marisma: 2 casilla(s) de suelo que cambia de golpe
- ciudad_lumina —north→ mirador_sur: bien
- ruta_14_reserva —south→ ciudad_nexo: 4 casilla(s) de suelo que cambia de golpe
- ruta_7 —north→ calzada_rey: 25 casilla(s) de suelo que cambia de golpe
- caleta_sonda —east→ ruta_15: 6 casilla(s) de suelo que cambia de golpe
- caleta_sonda —south→ mar_del_sur: bien
- ciudad_nexo —west→ ruta_15: 7 casilla(s) de suelo que cambia de golpe
- ciudad_nexo —south→ mar_del_sur: bien
- ruta_15 —south→ mar_del_sur: bien
- ruta_8_marisma —north→ aldea_mnemos: bien
- aldea_mnemos —north→ ruta_9_neblino: bien
- campamento_monte —east→ ruta_10: 3 casilla(s) de suelo que cambia de golpe
- ruta_10 —south→ ruta_9_neblino: bien
- estacion_talasa —north→ mar_del_sur: bien
- islote_lumbre —north→ mar_del_sur: bien
- mar_del_sur —east→ volcan_tizon: bien
- arrecife_eco —east→ fondo_mar_sur: 4 casilla(s) de suelo que cambia de golpe
- mar_boreal —east→ villa_boreal: bien
- paso_del_norte —south→ ruta_11: bien
- paso_del_norte —north→ ruta_13: 1 casilla(s) de suelo que cambia de golpe
- paso_del_norte —west→ ruta_12_senda_lazo: bien
- ruta_13 —north→ villa_boreal: bien
- villa_boreal —north→ lagos_alma: 1 objeto(s) cortado(s) (casa_cupula@villa_boreal); 32 casilla(s) de suelo que cambia de golpe
- mirador_sur —north→ puente_convergencia: bien
- senda_mirador —south→ puente_convergencia: bien
- dev_test_este —west→ dev_test: bien

## Detalle por mapa

### laberinto_profundidad

`game/src/content/maps/b01/laberinto_profundidad.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 4–13, y 28 (10); x 26–35, y 28 (10)

### ruta_1

`game/src/content/maps/b01/ruta_1.js`

- **Árboles cortados** (2): x 18–20, y 44 (3); x 21, y 45 (1)
- **Stamps sobre árboles** (1): `macizo_flores` en (19,22)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 24–25, y 12 (2); x 19–20, y 22 (2)

### villa_alba

`game/src/content/maps/b01/villa_alba.js`

- **Árboles cortados** (2): x 37, y 30 (1); x 34–36, y 31 (3)
- **Stamps sobre árboles** (2): `casa_roja` en (6,18); `lupinos` en (34,29)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 6–7, y 26–27 (3)

### explanada_umbral

`game/src/content/maps/b02/explanada_umbral.js`

- **Árboles cortados** (2): x 8–22, y 2 (15); x 23–26, y 3–11 (15)
- **Stamps sobre árboles** (5): `roca_turquesa` en (24,9); `pilar_monolito` en (19,3); `lupinos` en (16,3); `pilar_placa_unown` en (24,11); `pilar_columna` en (22,10)
- **Stamps sólidos pisando otro** (1): `roca_turquesa` (24,9) sobre `pino`

### ruinas_dintel

`game/src/content/maps/b02/ruinas_dintel.js`

- **Stamps sólidos pisando otro** (3): `pilar_arista_grande` (31,15) sobre `pilar_dintel`; `pilar_columna` (32,16) sobre `pilar_arista_grande`; `pilar_columna` (38,16) sobre `pilar_arista`

### villa_zaguan

`game/src/content/maps/b02/villa_zaguan.js`

- **Árboles cortados** (3): x 17, y 1 (1); x 16, y 2 (1); x 17, y 3 (1)
- **Stamps sobre árboles** (1): `cartel_madera` en (17,2)
- **Eventos visibles dentro de un árbol** (7): `t01_hierba_15` (evento) en (16,9); `t01_hierba_16` (evento) en (15,9); `t01_hierba_17` (evento) en (14,9); `t01_hierba_18` (evento) en (13,9); `t01_hierba_19` (evento) en (12,9); `t01_hierba_21` (evento) en (12,11); `t01_hierba_22` (evento) en (13,11)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 9–16, y 7–13 (30); x 12–13, y 11–14 (8)

### ciudad_caudal

`game/src/content/maps/b03/ciudad_caudal.js`

- **Árboles cortados** (3): x 6–9, y 2 (4); x 16, y 45 (1); x 17, y 46–47 (2)
- **Stamps sobre árboles** (1): `jardinera_flores` en (14,46)
- **Stamps sólidos pisando otro** (6): `jardinera_flores` (25,27) sobre `farola`; `jardinera_flores` (34,27) sobre `farola`; `estatua` (26,21) sobre `farola`; `estatua_2` (35,21) sobre `farola`; `jardinera_flores` (14,46) sobre `arbol`; `farola` (12,43) sobre `estatuas_gemelas`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 0–1, y 14–15 (4); x 24, y 29–31 (3)

### ruta_2

`game/src/content/maps/b03/ruta_2.js`

- **Árboles cortados** (7): x 2–3, y 15 (2); x 24–27, y 15 (4); x 9, y 62 (1); x 8, y 63 (1); x 9, y 64 (1); x 18–19, y 64 (2); x 18–19, y 67 (2)
- **Stamps sobre árboles** (3): `tocon` en (9,63); `guijarros` en (17,50); `cartel_ruta` en (17,65)
- **Stamps sólidos pisando otro** (1): `cartel_ruta` (17,65) sobre `arbol`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 17, y 50 (1); x 2–3, y 52–53 (4)

### garganta_albo

`game/src/content/maps/b04/garganta_albo.js`

- **Árboles cortados** (10): x 30, y 10 (1); x 29, y 11–12 (2); x 30, y 16 (1); x 29, y 17 (1); x 9, y 18 (1); x 8, y 19 (1); x 31, y 19 (1); x 9, y 20 (1); x 30, y 20 (1); x 32, y 36–39 (4)
- **Stamps sobre árboles** (5): `roca_grande` en (30,11); `flores_blancas` en (21,29); `setas` en (31,20); `flores_blancas` en (18,11); `roca_peque` en (9,19)
- **Stamps sólidos pisando otro** (2): `roca_grande` (30,11) sobre `pino`; `roca_peque` (9,19) sobre `arbol`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (7): x 29, y 9–12 (4); x 18, y 11 (1); x 21–22, y 13 (2); x 20–21, y 29–30 (3); x 6, y 34–37 (4); x 3–4, y 38–39 (4); x 35–36, y 38–39 (4)

### pilar_corriente

`game/src/content/maps/b04/pilar_corriente.js`

- **Stamps sólidos pisando otro** (1): `cristales` (30,36) sobre `pilar_monolito`

### pozo_albo

`game/src/content/maps/b04/pozo_albo.js`

- **Stamps sólidos pisando otro** (1): `cristales` (13,10) sobre `roca_peque_gris`

### ruta_3

`game/src/content/maps/b04/ruta_3.js`

- **Árboles cortados** (6): x 37, y 19 (1); x 36, y 20–21 (2); x 37, y 22 (1); x 34, y 30–31 (2); x 35, y 32 (1); x 2–39, y 43 (38)
- **Stamps sobre árboles** (2): `arbustos` en (37,20); `cartel_ruta` en (35,30)
- **Stamps sólidos pisando otro** (1): `cartel_ruta` (35,30) sobre `arbol`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (7): x 0–1, y 1–8 (16); x 17–18, y 9 (2); x 0–1, y 12–25 (28); x 9–10, y 27–29 (6); x 16–17, y 27 (2); x 26–27, y 27–28 (4); x 34–35, y 32–33 (4)

### brontia_posada

`game/src/content/maps/b05/brontia_posada.js`

- **Stamps sólidos pisando otro** (2): `cama` (11,6) sobre `cama`; `estanteria_roja` (1,3) sobre `mesa_comedor`

### ruta_4

`game/src/content/maps/b05/ruta_4.js`

- **Árboles cortados** (2): x 41, y 12 (1); x 40, y 13 (1)
- **Stamps sobre árboles** (3): `flores_blancas` en (21,10); `tocon` en (41,13); `flores_rosas` en (67,3)
- **Stamps sólidos pisando otro** (2): `buzon_rojo` (32,16) sobre `jardinera_flores`; `tocon` (41,13) sobre `pino`
- **Eventos visibles dentro de un árbol** (1): `joven_dani` (trainer) en (71,3)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (5): x 58, y 1–4 (4); x 67, y 3 (1); x 74–75, y 4–5 (4); x 17–18, y 7–8 (4); x 21, y 10 (1)

### villa_brontia

`game/src/content/maps/b05/villa_brontia.js`

- **Árboles cortados** (1): x 42–43, y 34 (2)
- **Stamps sobre árboles** (3): `centro_pokemon` en (1,5); `central` en (32,25); `roca_gris` en (41,3)
- **Stamps sólidos pisando otro** (2): `farola_hierro` (28,22) sobre `papelera`; `poste_electrico` (30,22) sobre `central`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 7, y 6 (1)

### meseta_impulso

`game/src/content/maps/b06/meseta_impulso.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 11–12, y 25 (2)

### ruta_5

`game/src/content/maps/b06/ruta_5.js`

- **Árboles cortados** (2): x 44, y 2 (1); x 16–17, y 37 (2)
- **Stamps sobre árboles** (3): `poste_electrico` en (22,21); `roca_grande` en (16,35); `flores_rosas` en (12,35)
- **Stamps sólidos pisando otro** (1): `pino` (23,26) sobre `poste_electrico`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 23–24, y 26 (2); x 12, y 35 (1)

### ruta_6

`game/src/content/maps/b07/ruta_6.js`

- **Árboles cortados** (2): x 9, y 1 (1); x 8, y 2–3 (2)
- **Stamps sobre árboles** (2): `caravana` en (3,35); `cartel_ruta` en (9,2)
- **Stamps sólidos pisando otro** (2): `pino` (3,38) sobre `caravana`; `cartel_ruta` (9,2) sobre `pino`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (5): x 8–9, y 0–1 (4); x 24–25, y 0–1 (4); x 25–26, y 15–16 (4); x 3–4, y 38–41 (6); x 23–24, y 57–58 (4)

### cerro_plomo

`game/src/content/maps/b08/cerro_plomo.js`

- **Stamps sólidos pisando otro** (1): `cartel` (9,20) sobre `tronco_h_gris`

### ciudad_estrato

`game/src/content/maps/b08/ciudad_estrato.js`

- **Árboles cortados** (4): x 23–24, y 4 (2); x 37, y 44–45 (2); x 36, y 46 (1); x 50–51, y 46 (2)
- **Stamps sobre árboles** (4): `foso_tierra` en (31,41); `pozo_mina` en (50,42); `cartel_ruta` en (22,2); `arbustos` en (42,17)
- **Stamps sólidos pisando otro** (3): `maquinas_expendedoras` (15,20) sobre `bloque_amarillo`; `farola_hierro` (38,34) sobre `contenedores`; `cartel_ruta` (22,2) sobre `pino`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (13): x 0–3, y 0–1 (8); x 48, y 0–3 (4); x 54, y 0–3 (4); x 50, y 1–4 (4); x 48, y 5–8 (4); x 52, y 6–9 (4); x 54, y 10–13 (4); x 50, y 11–14 (4); x 48, y 14–17 (4); x 2, y 15–18 (4); x 54, y 15–18 (4); x 43, y 17–18 (2); x 50, y 17–20 (4)

### mina_galena

`game/src/content/maps/b08/mina_galena.js`

- **Stamps sólidos pisando otro** (1): `roca_peque` (13,29) sobre `matojo_cueva`

### ciudad_lumina

`game/src/content/maps/b09a/ciudad_lumina.js`

- **Árboles cortados** (15): x 48–49, y 5 (2); x 48–49, y 7 (2); x 41–42, y 16 (2); x 67–69, y 25 (3); x 66, y 26 (1); x 67–69, y 27 (3); x 14–15, y 35 (2); x 25, y 45 (1); x 28, y 45 (1); x 26, y 46–47 (2); x 29, y 46–47 (2); x 38, y 52 (1); x 39, y 53–55 (3); x 32–33, y 60 (2); x 38–39, y 60 (2)
- **Stamps sobre árboles** (12): `bloque_verde_alto` en (18,3); `seto_corto` en (27,46); `columpio` en (23,46); `jardinera_flores` en (47,4); `jardinera_flores` en (28,3); `flores_blancas` en (38,7); `lupinos` en (40,17); `farola_rosa` en (69,28); `cartel_ruta` en (67,26); `jardinera_flores` en (13,32); `arco_puente` en (32,55); `farola` en (38,53)
- **Stamps sólidos pisando otro** (8): `seto_corto` (27,46) sobre `arbol`; `columpio` (23,46) sobre `arbol`; `arbol` (30,3) sobre `jardinera_flores`; `arbol` (22,2) sobre `bloque_verde_alto`; `farola` (69,44) sobre `tienda_torre`; `jardinera_flores` (13,32) sobre `arbol`; `farola` (38,53) sobre `arbol`; `cartel_madera` (38,57) sobre `farola`
- **Eventos visibles dentro de un árbol** (2): `objeto_ciudad_1` (item) en (69,55); `cartel_ciudad` (sign) en (68,28)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (21): x 22, y 3–5 (3); x 68–69, y 3–6 (8); x 30, y 5 (1); x 38, y 7 (1); x 70, y 8 (1); x 44–45, y 13 (2); x 26, y 14–17 (4); x 45, y 17 (1); x 3–4, y 39–41 (6); x 9–10, y 39–41 (6); x 26–27, y 39–41 (6); x 29–30, y 41–44 (7); x 18–19, y 44–47 (8); x 25–26, y 44–47 (6); x 28–29, y 44–47 (5); x 70–71, y 48 (2); x 3–4, y 50–53 (8); x 70–71, y 50 (2); x 29–30, y 51–54 (8); x 6–7, y 53–56 (8); x 9–10, y 54–56 (6)

### ruta_14_reserva

`game/src/content/maps/b09a/ruta_14_reserva.js`

- **Árboles cortados** (8): x 2, y 54 (1); x 1, y 55–56 (2); x 57, y 55 (1); x 58, y 56 (1); x 2, y 57 (1); x 57, y 57 (1); x 1, y 58–59 (2); x 58, y 58–59 (2)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (6): x 40–41, y 35–36 (4); x 40–41, y 38 (2); x 43–44, y 38 (2); x 50–51, y 38 (2); x 54–55, y 38 (2); x 40, y 41–44 (4)

### ruta_7

`game/src/content/maps/b09a/ruta_7.js`

- **Árboles cortados** (7): x 26–31, y 11 (6); x 12, y 12 (1); x 13, y 13 (1); x 12, y 14 (1); x 54, y 24 (1); x 57, y 24 (1); x 55–56, y 25 (2)
- **Stamps sobre árboles** (2): `tocon` en (12,13); `troncos` en (55,23)
- **Stamps sólidos pisando otro** (1): `tocon` (12,13) sobre `pino`
- **Eventos visibles dentro de un árbol** (1): `veterana_ines` (trainer) en (55,21)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (4): x 84–85, y 9–12 (8); x 68–69, y 11–14 (8); x 87–88, y 11–14 (8); x 65–66, y 13–14 (4)

### caleta_sonda

`game/src/content/maps/b09b/caleta_sonda.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 20–21, y 0 (2)

### ciudad_nexo

`game/src/content/maps/b09b/ciudad_nexo.js`

- **Árboles cortados** (3): x 54, y 8 (1); x 55, y 9–10 (2); x 46–47, y 15 (2)
- **Stamps sobre árboles** (2): `lupinos` en (52,9); `parterre_octogonal` en (46,16)
- **Stamps sólidos pisando otro** (4): `maquinas_expendedoras` (43,12) sobre `farola_hierro`; `maquinas_expendedoras` (43,12) sobre `nexo_palmera`; `parterre_octogonal` (46,16) sobre `arbol`; `farola_hierro` (23,32) sobre `barriles`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 1–2, y 33–34 (4); x 9–10, y 34–35 (4)

### palafitos_casa

`game/src/content/maps/b09b/palafitos_casa.js`

- **Stamps sólidos pisando otro** (1): `planta` (11,5) sobre `cama_individual`

### ruta_15

`game/src/content/maps/b09b/ruta_15.js`

- **Stamps sobre árboles** (1): `setas` en (27,5)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 3, y 25–26 (2)

### ruta_8_marisma

`game/src/content/maps/b09b/ruta_8_marisma.js`

- **Árboles cortados** (1): x 4–49, y 68 (46)
- **Stamps sobre árboles** (1): `cartel_madera` en (46,67)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (4): x 9–11, y 40 (3); x 19–21, y 40 (3); x 27, y 51–53 (3); x 11–12, y 59 (2)

### aldea_mnemos

`game/src/content/maps/b10/aldea_mnemos.js`

- **Árboles cortados** (6): x 25, y 0–5 (6); x 28, y 0–5 (6); x 33, y 0–5 (6); x 35–39, y 38–43 (25); x 34, y 39 (1); x 34, y 41 (1)
- **Stamps sobre árboles** (2): `centro_pokemon` en (36,27); `cartel_madera` en (34,40)
- **Eventos visibles dentro de un árbol** (1): `fausta` (evento) en (29,39)

### archivo_hondo

`game/src/content/maps/b10/archivo_hondo.js`

- **Stamps sólidos pisando otro** (1): `pilar_arista_grande` (43,12) sobre `vitrina`

### mnemos_archivo

`game/src/content/maps/b10/mnemos_archivo.js`

- **Stamps sólidos pisando otro** (1): `lab_ordenadores` (9,2) sobre `estanteria_roja`

### campamento_monte

`game/src/content/maps/b11/campamento_monte.js`

- **Árboles cortados** (2): x 3, y 21 (1); x 2, y 22–23 (2)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 3, y 14–21 (8)

### cerro_alba

`game/src/content/maps/b11/cerro_alba.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (3): x 6, y 3–4 (2); x 14–15, y 16 (2); x 8–12, y 24 (5)

### ruta_10

`game/src/content/maps/b11/ruta_10.js`

- **Árboles cortados** (1): x 0–10, y 17–19 (13)
- **Stamps sobre árboles** (1): `cartel_ruta` en (55,18)
- **Eventos visibles dentro de un árbol** (1): `cartel_ruta10` (sign) en (56,19)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 50–51, y 0–2 (6); x 0–1, y 8 (2)

### monte_gruta

`game/src/content/maps/b12/monte_gruta.js`

- **Stamps sólidos pisando otro** (1): `cristales` (9,5) sobre `roca_musgo`

### pilar_invertido

`game/src/content/maps/b12/pilar_invertido.js`

- **Stamps sólidos pisando otro** (1): `pilar_arista` (8,13) sobre `pilar_monolito`

### estacion_talasa

`game/src/content/maps/b13/estacion_talasa.js`

- **Stamps sólidos pisando otro** (1): `farola_hierro` (16,7) sobre `barrera_obras`

### islote_lumbre

`game/src/content/maps/b13/islote_lumbre.js`

- **Árboles cortados** (5): x 4, y 17 (1); x 19, y 17 (1); x 5, y 18 (1); x 18, y 18 (1); x 20, y 18 (1)
- **Stamps sobre árboles** (4): `flores_rosas` en (7,11); `flores_blancas` en (7,10); `linterna_piedra` en (4,18); `linterna_piedra` en (19,18)
- **Stamps sólidos pisando otro** (2): `linterna_piedra` (4,18) sobre `cerezo`; `linterna_piedra` (19,18) sobre `cerezo`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (7): x 3–4, y 8–12 (8); x 19–21, y 8–12 (13); x 7, y 10–11 (2); x 3–4, y 14–17 (7); x 19–21, y 14–18 (12); x 5–6, y 18 (2); x 18, y 18 (1)

### talasa_laboratorio

`game/src/content/maps/b13/talasa_laboratorio.js`

- **Stamps sólidos pisando otro** (2): `estanteria_lab` (1,13) sobre `maquina_lab`; `estanteria_lab` (23,13) sobre `maquina_lab`

### talasa_pilotes

`game/src/content/maps/b13/talasa_pilotes.js`

- **Stamps sólidos pisando otro** (3): `matojo_cueva_gris` (6,20) sobre `roca_grande_gris`; `matojo_cueva_gris` (10,30) sobre `roca_grande_gris`; `matojo_cueva_gris` (26,12) sobre `roca_grande_gris`

### antea_2_antea

`game/src/content/maps/b14/antea_2_antea.js`

- **Árboles cortados** (1): x 10, y 0–4 (5)

### antea_3_primigenia

`game/src/content/maps/b14/antea_3_primigenia.js`

- **Árboles cortados** (3): x 14, y 0–1 (2); x 19, y 2 (1); x 2–29, y 24 (28)
- **Eventos visibles dentro de un árbol** (2): `helecho_s3_14` (evento) en (5,6); `mata_s3_5` (evento) en (19,7)
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 4–5, y 3 (2)

### antea_4_primigenia

`game/src/content/maps/b14/antea_4_primigenia.js`

- **Árboles cortados** (1): x 2–29, y 24 (28)
- **Stamps sobre árboles** (2): `cristales` en (3,22); `tronco_caido_v` en (12,21)

### boreal_casa

`game/src/content/maps/b15/boreal_casa.js`

- **Stamps sólidos pisando otro** (1): `planta` (10,8) sobre `sofa`

### boreal_lago

`game/src/content/maps/b15/boreal_lago.js`

- **Stamps sobre árboles** (1): `monton_nieve` en (1,9)

### boreal_posada

`game/src/content/maps/b15/boreal_posada.js`

- **Stamps sólidos pisando otro** (2): `cama` (11,6) sobre `cama`; `estanteria_roja` (1,3) sobre `mesa_comedor`

### mar_boreal

`game/src/content/maps/b15/mar_boreal.js`

- **Stamps sólidos pisando otro** (1): `contenedores` (5,2) sobre `cobertizo_azul`

### ruta_11

`game/src/content/maps/b15/ruta_11.js`

- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 0–1, y 64 (2); x 28–29, y 64–65 (3)

### ruta_13

`game/src/content/maps/b15/ruta_13.js`

- **Eventos visibles dentro de un árbol** (1): `montanera_yolanda` (trainer) en (22,51)

### villa_boreal

`game/src/content/maps/b15/villa_boreal.js`

- **Stamps sobre árboles** (4): `cueva_ladera` en (41,15); `roca_gris` en (42,14); `troncos` en (40,29); `empalizada` en (38,24)
- **Stamps sólidos pisando otro** (1): `maquinas_expendedoras` (13,19) sobre `farola_hierro`

### lagos_alma

`game/src/content/maps/b16/lagos_alma.js`

- **Árboles cortados** (19): x 47, y 0 (1); x 46, y 1 (1); x 54, y 1 (1); x 55, y 2 (1); x 2, y 40 (1); x 3, y 41 (1); x 2, y 42 (1); x 36, y 50–51 (2); x 16, y 52 (1); x 32, y 52 (1); x 37, y 52 (1); x 17, y 53 (1); x 31, y 53 (1); x 19–21, y 54 (3); x 48–50, y 54 (3); x 18, y 55 (1); x 51, y 55 (1); x 19–21, y 56 (3); x 48–50, y 56 (3)
- **Stamps sobre árboles** (11): `arbusto_nevado` en (50,42); `arbusto_nevado` en (18,54); `arbusto_nevado` en (44,0); `arbusto_nevado` en (52,2); `arbusto_nevado` en (32,53); `arbusto_nevado` en (19,55); `arbusto_nevado` en (48,55); `cartel_madera` en (17,52); `cabana_turquesa` en (37,43); `flores_blancas` en (2,49); `roca_peque` en (2,41)
- **Stamps sólidos pisando otro** (1): `cartel_madera` (17,52) sobre `pino_nevado_peque`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (30): x 9–10, y 8 (2); x 52–53, y 8 (2); x 56–57, y 8–9 (3); x 3, y 9 (1); x 1–2, y 12–13 (3); x 58, y 12–13 (2); x 1, y 16–17 (2); x 58, y 16–17 (2); x 1, y 20–21 (2); x 58, y 20–21 (2); x 1, y 24–25 (2); x 57, y 24–25 (2); x 1–3, y 28–29 (4); x 57, y 28–29 (2); x 1, y 32–33 (2); x 58, y 32–33 (2); x 1–2, y 36–37 (3); x 57–58, y 36–37 (3); x 3–5, y 39–41 (6); x 52–53, y 39 (2); x 52, y 42 (1); x 3, y 43–47 (5); x 1, y 44–45 (2); x 1–2, y 48–49 (3); x 1–2, y 52–53 (3); x 16, y 52–53 (2); x 4–11, y 54–55 (10); x 17, y 54 (1); x 18–28, y 54–56 (14); x 41–53, y 54–56 (17)

### santuario_alma

`game/src/content/maps/b16/santuario_alma.js`

- **Stamps sólidos pisando otro** (13): `pilar_columna_quebrada` (35,9) sobre `pilar_arista`; `estatua_busto` (30,6) sobre `pilar_columna`; `estatua_busto` (26,4) sobre `pilar_columna`; `estatua_busto` (29,4) sobre `pilar_columna`; `pilar_dintel` (27,0) sobre `pilar_columna`; `pilar_columna` (32,22) sobre `pilar_columna`; `estatua_busto` (32,21) sobre `pilar_columna`; `pilar_columna` (29,20) sobre `pilar_columna`; `pilar_columna` (28,18) sobre `pilar_columna`; `pilar_columna` (27,16) sobre `estatua_busto`; `pilar_dintel` (27,14) sobre `pilar_columna`; `estatua_busto` (28,30) sobre `pilar_columna`; `pilar_dintel` (27,28) sobre `pilar_columna`

### mesa_vientos_casa

`game/src/content/maps/b17/mesa_vientos_casa.js`

- **Stamps sólidos pisando otro** (1): `sofa` (10,4) sobre `planta`

### mesa_vientos

`game/src/content/maps/b17/mesa_vientos.js`

- **Stamps sólidos pisando otro** (2): `farola_hierro` (14,26) sobre `banco`; `farola_hierro` (21,28) sobre `cartel_madera`

### mirador_sur

`game/src/content/maps/b17/mirador_sur.js`

- **Árboles cortados** (6): x 37, y 19 (1); x 36, y 20 (1); x 37, y 21 (1); x 28–29, y 29 (2); x 13, y 30–31 (2); x 12, y 32 (1)
- **Stamps sobre árboles** (3): `lupinos` en (28,27); `roca_gris` en (37,20); `farola_hierro` en (12,27)
- **Stamps sólidos pisando otro** (6): `roca_gris` (37,20) sobre `pino`; `jardinera_flores` (6,24) sobre `farola_hierro`; `jardinera_flores` (22,24) sobre `farola_hierro`; `cartel_madera` (8,24) sobre `jardinera_flores`; `farola_hierro` (12,27) sobre `pino`; `farola_hierro` (17,27) sobre `cartel_madera`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 0–1, y 24–25 (4)

### senda_mirador

`game/src/content/maps/b17/senda_mirador.js`

- **Árboles cortados** (7): x 13, y 7 (1); x 12, y 8 (1); x 30–31, y 20 (2); x 1–3, y 22 (3); x 0, y 23 (1); x 1–3, y 24 (3); x 0–1, y 28 (2)
- **Stamps sobre árboles** (6): `tocon` en (13,8); `lupinos` en (1,23); `roca_gris` en (0,29); `roca_grande` en (30,21); `flores_blancas` en (36,27); `tocon` en (38,22)
- **Stamps sólidos pisando otro** (4): `tocon` (13,8) sobre `arbol`; `cartel_madera` (9,10) sobre `banco`; `roca_gris` (0,29) sobre `pino`; `roca_grande` (30,21) sobre `pino`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (2): x 22–23, y 15–18 (5); x 36, y 27 (1)

### puente_convergencia

`game/src/content/maps/b18/puente_convergencia.js`

- **Stamps sólidos pisando otro** (2): `pilar_columna` (13,5) sobre `tienda_campana`; `pilar_columna` (13,10) sobre `tienda_campana`

### calzada_rey

`game/src/content/maps/b19/calzada_rey.js`

- **Árboles cortados** (2): x 41, y 43 (1); x 40, y 44 (1)
- **Stamps sobre árboles** (1): `roca_gris` en (41,44)
- **Stamps sólidos pisando otro** (2): `tocon` (36,48) sobre `tienda_campana`; `roca_gris` (41,44) sobre `pino`
- **Copa de árbol sobre camino/hierba/pieza de la capa 1** (1): x 42–43, y 17–18 (4)

### senda_origen_7_fondo

`game/src/content/maps/b20/senda_origen_7_fondo.js`

- **Rocas de agua sin agua debajo** (2): `roca_agua_grande` en (17,8); `roca_agua` en (9,12)

