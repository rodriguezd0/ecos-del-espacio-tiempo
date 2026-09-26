# Bloque 15 — Interludio 7: el norte, Villa Boreal y el quinto núcleo

Mapas, eventos y pruebas del B15 (docs/CAMPANA.md B15; §1.3–1.4, §2.3, §6.3; TABLILLAS T13; POKEDEX_DISTRIBUCION
§7.3 y §7.7). Entrada: `p7_restored` (B14). Salida: `b15_n5` y `zyg_core_5`.

## Mapas

| Id | Nombre | Tamaño · tileset | Notas |
|---|---|---|---|
| `ruta_11` | Ruta 11 | 30×70 · 1 | Vertiente nevada. Escena de la desvinculación (franja y 63, x 8–25). C089 (nieve honda, Terreno) y C090 (repisa tras roca agrietada, Embestida). |
| `paso_del_norte` | Paso del Norte | 30×30 · 1 | Collado entre el pinar de la ladera oeste (con el mirador y los técnicos de Genesis) y la loma nevada del este (sobre el refugio); cruce a la Senda. Llegada: franja y 28, x 10–19 (y la fila 1, x 13–15, para quien baja de Boreal tras llegar en ferri). |
| `paso_refugio` | Refugio del Paso | 15×12 · 4 | Guarda (pista de la Senda: «tres garras»), literas para descansar. |
| `ruta_12_senda_lazo` | Senda del Lazo | 40×50 · 1 | Tramo bajo de la Ruta 12. Lazo de escaleras (pauta E-O-N-E), huellas, mirador con la Tyranitarita, tramo alto en bucle. Sin tabla de encuentros. |
| `ruta_13` | Ruta 13 | 30×60 · 1 | Nieve profunda: la franja y 43–46 (pared a pared) exige Terreno. C091, C092, Abomasnowita. Llegada en y 58 (desde el Paso) o en y 1 (desde Boreal). |
| `villa_boreal` | Villa Boreal | 44×40 · 1 | Centro, tienda, posada, casa, Observatorio (loma), Talleres del Hielo, muelle del ferri, Torre de Hielo (andamio → torre, `flyPoint`). |
| `boreal_centro` / `boreal_tienda` / `boreal_posada` / `boreal_casa` | Interiores | plantillas / 4 | Posada con `innkeeperEvent({ storm: true })`: la ventisca es `stormWeather` de los exteriores. |
| `boreal_observatorio` | Observatorio Boreal | 19×14 · 4 | Directora (Fundación Meridiano), astrónomo, telescopio; escalera a la azotea en (16,4). |
| `boreal_observatorio_terraza` | Observatorio Boreal | 16×12 · 1 | Gael B5 y N5 (escena automática). C093. |
| `boreal_talleres` | Talleres del Hielo | 19×14 · 4 | Rosendo y Nieves (T13). |
| `boreal_lago` | Lago Viejo | 24×18 · 1 | Puzle del T13 (plano en `events/b15_lago_logic.js`). |
| `gruta_escarcha` / `gruta_escarcha_2` | Gruta Escarcha | 40×40 · 12 | Recortes de la Cueva Glaciada de Añil. Sala 1: lago (Nadar), C094, Glalita, boca a la sala honda (12,19). Sala 2: pista de hielo del motor, Baxcaliburita al fondo (32,33), Fidel. El lago alto de la sala 1 (sobre la cascada) y las repisas laterales de la sala 2 no se alcanzan en la campaña: quedan para el «lago interior» del postgame (CAMPANA B22, Articuno con la pista de Rosendo). |
| `mar_boreal` / `mar_boreal_fondo` | Mar Boreal | 50×40 · 1 / 26×18 · 15 | Témpanos, C096, Teo, verja de la Instalación Cierzo (cerrada, postgame), remolino de Buceo. |

Layouts (fuente única de coordenadas para mapas, eventos, tests y E2E): `layout_ruta11.js`, `layout_paso.js`,
`layout_senda.js`, `layout_ruta13.js`, `layout_boreal.js`, `layout_lago.js`, `layout_escarcha.js`. Piezas nevadas
propias en `pieces.js` (terraza y pinar nevados, hierba nevada, losas, barandillas, mar de nubes, muro invisible).

Pintado (`paint.js`): `snowForest` rellena de pinar lo que no es claro (los tramos cortos llevan matas, rocas o
tocones, no nieve vacía); `sealEdges` cierra con el muro invisible del bosque las casillas de borde sin salida que los
árboles dejan libres (nunca se camina pegado al borde de la pantalla: lo comprueba `b15_reach`). La nieve de la Ruta 11
toca la pradera de Brontia con el borde suave de `nieve_parche` y los témpanos del Mar Boreal son `nieve_parche` sobre
el agua (sin cortes de casilla).

## Conexiones (para los bloques vecinos)

| Desde | Casillas | Hacia | Detalle |
|---|---|---|---|
| `ruta_11` sur | x 13–16, y 69 | `villa_brontia` norte (x 20–23) | `south`, offset −7. Brontia (B05) la activa sola con `linkIfReady` y la cierra con hielo-eco hasta `p7_restored`. |
| `ruta_11` norte | x 13–16, y 0 | `paso_del_norte` sur (x 13–15) | offset 0 |
| `paso_del_norte` oeste | x 0, y 12–14 | `ruta_12_senda_lazo` este (x 39, y 40–42) | offset −28 / +28 (el resto de los dos bordes está cerrado) |
| `paso_del_norte` norte | x 13–15, y 0 | `ruta_13` sur | offset 0 |
| `paso_del_norte` puerta | (21,14) | `paso_refugio` (7,10) | |
| `ruta_13` norte | x 13–15, y 0 | `villa_boreal` sur (x 20–22) | offset −7 / +7 |
| `villa_boreal` norte | x 20–23, y 0 | `lagos_alma` (B16) | `links.js#PENDING_LINKS`: `north`, offset 8 (Lagos: sur en x 12–15, offset −8). Activa (B16 registrado). Si faltara el mapa, eventos `sendero_lagos_*` cierran el paso con aviso neutro. |
| `villa_boreal` oeste | mar, x 0 | `mar_boreal` este | offset 0 |
| `villa_boreal` cueva | (42,17), llegada (41,17) | `gruta_escarcha` (24,34) | salida de la gruta: y 35, x 23–25 pulsando abajo |
| `villa_boreal` noreste | x 43, y 3–5 (pulsar derecha) | `boreal_lago` (1, 12–14) | vuelta: x 0 pulsando izquierda → (42, 3–5) |
| `villa_boreal` muelle | llegada del ferri (3,28) | Ciudad Nexo | parada `boreal` en `world/transport.js` |
| `gruta_escarcha` boca | (12,19) empujando desde (12,20) | `gruta_escarcha_2` (21,6) | vuelta: (21,5) empujando arriba |
| `mar_boreal` remolino | (40,30) | `mar_boreal_fondo` (5,8) | |

## Flags y variables (`events/b15_common.js`)

- `b15_desvinculacion`: **estado del mundo** (los Pokémon del norte no reconocen a sus entrenadores). Lo fija la primera
  llegada (Ruta 11, Paso, Senda o Villa Boreal). `isNorthUnbound(s)` = flag y sin `p8_restored`: **el B16 lo revierte al
  restaurar el P8** (o con `setFlag('b15_desvinculacion', false)`). Cambian: montañera y Snover (Ruta 11), niño y
  Swinub, vecina, madre (casa), Rosendo y su Frigibax.
- T13: `b15_t13_rosendo`, `b15_t13_nieves`, `b15_t13_lago_visto`, `b15_t13_bloque`, `b15_t13_tablilla` (ICICLEPLATE),
  `b15_torre` (Torre en pie), `b15_froslassita`. Variables `b15_lago` (pasadas por placa), `b15_lago_bloques`,
  `b15_lago_caidas`.
- Senda: `b15_senda_llegada`, `b15_senda_lazo_visto`, `b15_senda_mirador`, `b15_senda_alto`; vars `b15_senda_vueltas`,
  `b15_senda_rellano`.
- Gael: `b15_gael_visto`, `b15_gael_b5`, `b15_gael_b5_ganado`, **`b15_n5`** (salida), `zyg_core_5` (joinCore),
  `b15_alerce_aro` (llamada «Ese aro no es de ninguna tienda.» al salir del Observatorio).
- Otros: `b15_r11_llegada`, `b15_paso_llegada`, `b15_refugio_pista`, `b15_r13_llegada`, `b15_boreal_llegada`,
  `b15_escarcha_llegada`, `b15_cierzo_visto`.

## Células

C089 (25,51) y C090 (24,7) en `ruta_11`; C091 (24,10) y C092 (5,24) en `ruta_13`; C093 (2,8) en
`boreal_observatorio_terraza`; C094 (10,21) en `gruta_escarcha` (a nado); C096 (26,19) en `mar_boreal`. C095 es del B16.

## Probar

- Tests: `node --test tests/b15_*.test.mjs` (alcanzabilidad con BFS en `b15_reach`, reglas y guiones en `b15_content`).
- E2E: `node tools/e2e_b15.mjs` (tramos `ruta11 paso senda ruta13 boreal lago gael gruta`; `--from=` / `--only=`).
- URLs (base: `?scene=map&party=INFERNAPE:76,GARCHOMP:75&fragments=7&core=1&zygarde=run,ram,terrain,climb,swim,detect,dive&zcells=88&zcores=4&vars=gael_starter:LITTEN&noenc=1&debug&flags=p7_restored`):
  - Ruta 11 (desvinculación): `&map=ruta_11&x=14&y=67&dir=8`
  - Senda del Lazo: `&map=ruta_12_senda_lazo&x=39&y=41&dir=4`
  - Villa Boreal: `&map=villa_boreal&x=21&y=39&dir=8`
  - Lago Viejo con Nieves: `&map=boreal_lago&x=1&y=12&dir=6` + `,b15_t13_rosendo,b15_t13_nieves` en `flags`
  - Gael B5 (de noche): `&map=boreal_observatorio&x=15&y=4&dir=6&time=21` y un paso a la derecha
  - Gruta Escarcha, sala honda: `&map=gruta_escarcha_2&x=21&y=6&dir=2`

## Cambios en archivos compartidos

- `world/transport.js`: parada del ferri `boreal` con llegada `{ x: 3, y: 28, dir: 6 }`.
- `world/rest.js`: «descansar hasta tormenta» respeta `def.stormWeather` si el mapa lo define (aditivo).
- `content/zygarde/cells.js`: C093 en `boreal_observatorio_terraza` (tejado del Observatorio).
- Registros regenerados con `node tools/gen_registries.mjs`.
