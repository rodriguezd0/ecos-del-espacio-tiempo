# Bloque 21 — Final: Salto de Convergencia, Columna Lanza, Arceus y epílogo

CAMPANA B21 (D21–D24). Entrada: `p10_restored` y `b20_flute` (Flauta Azur `AZUREFLUTE`; el flag sirve de respaldo).
Salida: `game_cleared` siempre y `arceus_caught` si se captura (si se debilita: `b21_arceus_debilitado`, Arceus se
queda en la cima, sobre el gran hexágono, para el postgame). Sin encuentros ni células en el bloque.

**Canon:** en los textos no se dice «altar» (DESCARTADO en la biblia; CAMPANA: «no reintroduce… altar»). Arceus duerme
«en lo alto de la Columna, sobre el gran hexágono grabado». La clave interna `COLUMNA.altar` de `layout.js` es solo
el nombre de la pieza.

## Mapas

| id | tileset | tamaño | qué es |
|---|---|---|---|
| `columna_lanza` | 8 (InteriorLiga, kit `pilar_*`) | 30×40 | Cima flotante sobre el panorama astral (`anil:Graphics/Panoramas/astral.png`; tras el final, `cielo.png`). Antecámara con el Nodo (llegada del Salto), manantial (cura), estela de la Crónica XIV, dintel, calzada, escalinata ancha y Cumbre con el gran hexágono de Arceus rodeado por los 18 zócalos de las Tablillas. `escapeRope: false`, `fly: false`, BGM `Final2`, battleback `ColumnaLanza`. |
| `carguero` | 1 (Exterior1) | 30×20 | Cubierta del carguero de Vértice, de noche y con lluvia (solo para la escena de la tele). `noFollower`, `noCore`, BGM `Barco`. |
| `dev_nodo_origen` | 8 | 19×15 | Maqueta de pruebas del Nodo del Origen (hexágono en (9,8)). No se enlaza desde el juego; la usan las pruebas y `--node=dev` del E2E. |

Coordenadas: `layout.js` (fuente única para mapa, eventos, pruebas y E2E). Construcción: `columna_build.js`. Arte
propio: `node tools/b21_assets.mjs` → `assets/objects/b21_roca.png` (cara inferior de la roca y goteo) y
`b21_objetos.png` (Honor Ball, nota de Gael, bola abierta con luz verde, destello dorado).

### Columna Lanza (casillas)

| qué | casilla |
|---|---|
| Nodo (llegada del Salto) | cámara 5×5 en (12,29); llegada (14,31) mirando arriba; el hexágono brilla pero no responde hasta el final |
| Retirada («Retirarse») | (11,28), junto al manantial, con el equipo curado |
| Manantial (cura) | (6,27) 3×3 |
| Estela (Crónica XIV, Unown) | (21,27) |
| Dintel · calzada · escalinata | (12,22) · x 12–16, y 18–24 · (12,15) 5×3 |
| Franja de la pregunta de Zygarde | y 14, x 12–16 (al pisarla la primera vez) |
| Gran hexágono / Arceus | cámara en (12,6); Arceus en (14,8); se toca la Flauta desde (14,9) mirando arriba |
| Zócalos | anillo de 18 alrededor de (14,8) (radio 6×5); las tres Tablas de Arceus en k 17, 0 y 1 |
| Objetos | `FULLRESTORE` (21,33) · `MAXREVIVE` oculto (6,11) · `MAXELIXIR` (16,19) (en suelo libre; lo comprueba `b21_reach`) |
| Aristas | (9,13) · (24,6) · (23,26): la base (y + 1) siempre sobre el enlosado |

El vacío se bloquea con eventos sólidos invisibles en el borde (con la cara de la roca pintada bajo los bordes sur).

## Entradas, salidas y vecinos

| desde | a | notas |
|---|---|---|
| `nucleo_origen` (B20), evento `nucleo_origen` (el sello del suelo) | `columna_lanza` (14,31) | B21 registra su guion con `registerOriginNode` (hook de `b20_nucleo.js`) al importarse `events/b21_salto.js` desde `maps/b20/nucleo_origen.js` (una línea aditiva). Aviso de no retorno canon → «Sí»/«Todavía no» («El nodo espera»). |
| `columna_lanza` (auto tras la resolución) | `laberinto_profundidad` (B01) (20,11) → `villa_alba` (22,9) | Salto de vuelta (se puede saltar con A: el Salto ya se vio), 18:00. Al llegar a la verja, la casa pasa a ser el punto de cura (`setHomeHealPoint` de B01): antes era el último manantial del Origen. |
| `columna_lanza` nodo (14,31), tras el epílogo | igual que arriba | **Salida de seguridad del postgame**: el mapa prohíbe Vuelo y Cuerda Huida, así que el hexágono ofrece «¿Saltar al nodo del Laberinto?» (`leaveColumna`). B22 puede sustituirlo por la Red de Convergencia. |
| `villa_alba` puerta de casa | `casa_prota_1f` | La tele salta al entrar tras leer la nota de Gael. |
| `casa_prota_1f` (escena) | `carguero` → créditos (varios mapas) → `casa_prota_2f` (8,6) | Todo encadenado; al despertar empieza el postgame. |

No hay salida a pie de Columna Lanza hasta terminar (sin Cuerda Huida ni Vuelo). «Retirarse» deja al jugador en la
antecámara con el manantial; el hexágono sigue sin responder.

## Secuencia y flags (`content/events/b21_common.js`, objeto `F`)

| paso | flags / vars |
|---|---|
| Nodo del Origen | `b21_nodo_aviso`, `b21_salto`, capacidad `jump` (la cinemática se puede saltar desde la 2.ª vez: `zyg_jump_seen`) |
| Llegada | `b21_llegada` |
| Pregunta de Zygarde (D21) | `b21_zygarde_pregunta`; «Sí» → `b21_zygarde_equipo` (Zygarde Completo Nv. 70, Honor Ball, Agrupamiento, Mil Flechas/Mil Temblores/Fuerza Telúrica/Danza Dragón; con equipo lleno, menú obligatorio del Arca) |
| Flauta | `b21_flauta` |
| Combate | var `b21_arceus_fase` (0 Tierra · 1 Fantasma · 2 Normal), var `b21_arceus_intentos`; `b21_arceus_superado` + `arceus_caught` o `b21_arceus_debilitado` |
| Resolución | `b21_tablillas` (18 Tablillas; `verse_confirmation`), `b21_eje_reparado` (según var `p9_choice`), `game_cleared`, crisis → fase 5, hito `anchor`, `b21_resolucion` |
| Epílogo | `b21_regreso`, `b21_olmedo`, `b21_mama`, `b21_llave` (`ALERCEKEY`), `b21_montaje`, `b21_mama_casa`, `b21_mama_aviso`, `b21_casa_gael_vista`, `b21_nota_gael`, `b21_huevo_espera`/`b21_huevo_gael`, `b21_tele`, `b21_creditos`, `b21_fin` |

Combate de Arceus (`b21_arceus_logic.js`): Nv. 75, `bossPhases` Tierra (Tabla Terrax) → Fantasma (Tabla Terror) →
Normal (sin objeto). En cada transición: sin debilitarse, cura total, fuera cambios de estadísticas y trampas, +25 % de
PS al equipo del jugador y la pregunta canon de la fase. Captura bloqueada en fases 1–2 sin gastar la Ball ni el turno;
en la 3.ª, bajo el 50 % suelta la Tabla Legendaria y la captura se abre (solo entonces sirve la Master Ball). Derrota →
«Reintentar fase» (equipo y Mochila como al empezar la fase) o «Retirarse» (fase guardada).

## Vecinos de otros bloques (cambios mínimos y aditivos)

- B01: una línea de import en `villa_alba.js`, `casa_gael.js`, `casa_prota_1f.js` y `casa_prota_2f.js`.
- B20: una línea de import en `maps/b20/nucleo_origen.js` (registro del Salto).
- B17: su escena de Mamá con los Clefairy ya se salta con `game_cleared`; el montaje incluye la toma del Círculo si
  `b17_circulo` está en pie.
- B11: el huevo de Gael usa `world/eggs.js` (`createEgg`, `addEggToParty`) y la var `gael_starter` de B01.

## Pendiente para B22 (postgame)

- Revancha de Arceus si se debilitó (`b21_arceus_debilitado`); la Tabla Legendaria ya se entrega al final.
- Sala que abre la `ALERCEKEY` en el laboratorio.
- Acceso a Columna Lanza en el postgame (Vuelo y Senda del Lazo, CAMPANA §1.4): `columna_lanza` tiene `fly: false` y
  `escapeRope: false` (el final no deja volver); la salida es el hexágono del Nodo (arriba). El Nodo del Origen de B20
  dice «no pasa nada» tras el Salto hasta que B22 abra la Red de Convergencia.

## Cambios compartidos (mínimos y aditivos)

- `world/mapScene.js#refreshFollower`: con Zygarde en el equipo (D21) el acompañante no lo duplica (Zygarde ya camina
  como compañero de campo); sigue el siguiente Pokémon capaz.
- `battle/core/bossPhases.js` (ganchos `before`/`onEnter`, `rules.onEndOfRound`), `battleEndOfRound.js`
  (`pbBossRoundHook`), `battle/scene/sceneUI.js` (Balls en gris, evento `bossPhase`), `battle/scene/gfx/field.js`
  (`swapBackdrop`), `ui/screens/bag.js` (`disabled`), `world/mapScene.js` (`cinematic`), `world/zygarde/field.js` y
  `actions.js` (capa `draw` del Salto), `content/services/zones.js` (`carguero`).

## Pruebas

- `node --test tests/b21_content.test.mjs tests/b21_reach.test.mjs`
- `node tools/e2e_b21.mjs` (todo) · `--from=cumbre` · `--only=retirada` · `--node=dev` · `--urls` (imprime las URL de
  arranque de cada tramo para probar a mano en http://localhost:8080).
- Rápidas: `http://localhost:8080/?scene=map&map=columna_lanza&x=14&y=31&dir=8&party=MEWTWO:100&zygarde=all&zform=complete&core=1&tablets=15&flags=p10_restored,b20_flute,b21_salto,b21_llegada`
  · `http://localhost:8080/?scene=map&map=carguero&x=14&y=12`
  · `http://localhost:8080/?scene=map&map=dev_nodo_origen&party=MEWTWO:100&zygarde=all&zform=complete&core=1&flags=p10_restored,b20_flute`
