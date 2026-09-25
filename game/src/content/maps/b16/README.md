# Bloque 16 — Pilar del Alma (P8)

CAMPANA B16 (D17). Entrada: `b15_n5`, `zyg_core_5`, Nadar y `p7_restored` (nivel ~57). Salida: `p8_restored`,
`zyg_complete` (con 100 células), Fragmento 8, verso VIII, Cadena Roja (`REDCHAIN`), pista T14.

## Mapas

| id | tileset | tamaño | qué es |
|---|---|---|---|
| `lagos_alma` | 1 (Exterior1 + nieve + kit exterior de Pilar) | 60×60 | Tres lagos glaciares (Saber O, Querer N con cascada, Sentir E con islote) bajo un acantilado nevado (`terraza_nevada`), islote del santuario, puente de bloques de hielo con bordillo (`hielo_losas` + `hielo_borde`, losas de Ciudad Añil), mirador de las auroras, refugio, campamento de Genesis. El sendero sur acaba nevado para enlazar con la calle de Boreal. Tono y música `VinculoSupremo`. |
| `lagos_refugio` | 4 (Interior1) | 13×11 | Refugio de los observadores: literas (descanso con cura, `restSpotEvent`), aparato de radio, cuadernos, observador. |
| `santuario_alma` | 11 (InteriorTorre + kit de Pilar, `pilarTone('P8')` rosa pálido) | 77×62 | Patio central (alfombra en cruz hacia los tres dinteles) + Ala del Saber (4 salas de enlosado antiguo) + Ala del Sentir (5 salas) + Ala del Querer (2 salas) + Telar; cámaras del trío con alfombra de su color. Salas sobre la oscuridad enlazadas por dinteles (warps al empujar) y escalinatas (warps por dirección). `escapeRope: false`. |
| `santuario_alma_recuerdo` | 11 | 58×18 | El último espejo: tres estampas del día de Gael (laboratorio, explanada del Umbral, aljibe). `mirrorControls: true`, `noCore`, `noFollower`. |

Coordenadas: `lagos_layout.js`, `santuario_layout.js`, `recuerdo_layout.js` (fuente única del mapa, los eventos, las
pruebas y el E2E). Construcción: `*_build.js`. Eventos: `content/events/b16_*.js`. Arte propio: `node tools/b16_assets.mjs
[--preview]` (glifos, relieves, puertas, espejo, telar, hebras, sello, Zygarde Completo del puente).

## Entradas, salidas y vecinos

| desde | casilla | a | notas |
|---|---|---|---|
| `lagos_alma` sur | x 12–15, y 59 | `villa_boreal` (B15) norte x 20–23 | Conexión `south`, offset −8 (Boreal: `north`, offset 8, `b15/links.js`). Activa: ambos mapas registrados. Si faltara Boreal, `pending_links.js` la quita y los eventos `borde_sur_*` cierran con aviso neutro. |
| `lagos_alma` boca del santuario | empujar arriba en (28,19)/(29,19) | `santuario_alma` (40,57) | Solo se llega al islote nadando (G12) hasta reconstruir el puente. |
| `santuario_alma` escalinata del patio | (39–41,58) pulsando abajo | `lagos_alma` (28,24) | Al salir tras el P8 se dispara el hito. |
| `lagos_alma` puerta del refugio | (39,49) | `lagos_refugio` (6,9) | Vuelta a (39,50). |
| `santuario_alma` ↔ `santuario_alma_recuerdo` | gran espejo (50–52,3) | laboratorio (9,12) | Se vuelve al tocar el aljibe → cámara de Mesprit (51,22). |

## Secuencia y flags (`content/events/b16_common.js`)

| paso | flags / vars |
|---|---|
| Llegada al mirador | `b16_llegada` |
| Bienvenida del trío en el patio | `b16_santuario_visto` |
| Saber: 7 glifos · 3 puertas · 4 puertas · Uxie | var `b16_saber_glifo` (glifo en la mano), `b16_saber_relieves` (máscara), `b16_saber_variante_3/4` (olvidos), flags `b16_saber_glifos`, `b16_saber_tres`, `b16_saber_cuatro`, `b16_hebra_saber` + `KNOWLEDGETHREAD` |
| Sentir: 3 espejos · recuerdo · Mesprit | `b16_sentir_espejo_1..3`, var `b16_recuerdo_fase` (0–5), `b16_recuerdo_gael`, **var `b16_mesprit_respuesta`** (`'culpa'` · `'lejos'` · `'permiso'`, **la usa B20** para la línea de Gael), `b16_hebra_sentir` + `EMOTIONTHREAD` |
| Querer: viento · Azelf | `b16_querer_viento`, `b16_azelf_sello`, `b16_azelf_vencido`, var `b16_azelf_intentos`, `b16_hebra_querer` + `WILLTHREAD` |
| Telar | `b16_telar_abierto`, `b16_telar` (ritual; var `b16_telar_hebras`), `REDCHAIN`, `p8_restored`, `verse_8`, `F08` |
| Hito (salida) | `b16_hito_escena`, `b16_puente_roto`, `b16_puente_a`, `b16_puente_b`, `b16_hito` (+ `b16_hito_parcial` si faltaban células), `b16_radio`, `b16_genesis_registro` (**B17**: Genesis se va con lo que registró desde fuera), `b16_vinculo`, `b16_vuelo_aviso`, `zyg_complete`, `zyg_rebuild_tutorial` |
| T14 (Correos de Nexo, B09b) | `b16_t14_carta` + `openClue('T14')`. Tras el hito, la observadora de los lagos da el recado de Don Evaristo (llegó con el ferri de Nexo) mientras no se haya abierto la pista |

Las tres alas se hacen en cualquier orden; el hexágono del patio abre el Telar con las tres Hebras (flags). El ritual
retira las Hebras y da la Cadena Roja. El cielo se rompe al salir (fase 3 forzada durante la escena y luego derivada de
`p8_restored`). Al último espejo se entra desmontado del 10 % (`dismountForMemory`, también en el `onEnter` del
recuerdo): montado, la sincronización de la montura devolvía al jugador su aspecto y no el de Gael.

## Células y objetos

| célula | clave | casilla | |
|---|---|---|---|
| C095 | `cell_lagos_1` | `lagos_alma` (51,23), islote del Sentir | Nadar |
| C097 | `cell_alma_1` | `santuario_alma` (11,4) | paso obligado hacia las puertas |
| C098 | `cell_alma_2` | (29,32) | paso obligado hacia el último espejo |
| C099 | `cell_alma_3` | (67,4) | repisa de arriba del viento |
| C100 | `cell_alma_4` | (51,37) | única casilla desde la que se usa el Telar (antes del núcleo) |

Objetos: Lagos `ULTRABALL`×3 (5,52), `FULLRESTORE` oculto (54,52), `MAXREVIVE` (24,29), `PPUP` (36,6), `NEVERMELTICE`
(8,23), `DUSKBALL`×2 (34,51); santuario `MAXELIXIR` (20,12), `RARECANDY` (14,52), `MAXREVIVE` (56,24), `FULLRESTORE`
(73,34), `PPUP` oculto (51,57). Encuentros (`content/encounters/b16.js`, POKEDEX_DISTRIBUCION): hierba y agua de los
lagos, Supercaña en el Lago del Sentir, **Feebas** con la Caña Buena en 6 casillas del Lago del Sentir que cambian cada
día de juego o al descansar (`b16_feebas.js`), y el patio del santuario. Sin entrenadores en el bloque.

## Piezas reutilizables (ver `docs/ARCHITECTURE.md` §17)

- **Reconstrucción** (`rebuildGap` ampliado): `flag`, `when`, `tutorial`, `onRebuilt`; primer tutorial con
  `REBUILD_TUTORIAL_FLAG` (B17, B18 y B20 lo reutilizan con `tutorial: true`).
- `rules.sealedBag` (combate sin Mochila), `fishingAt` + `fishingSystem` (pesca por casilla), `mirrorControls`.

## Pruebas rápidas

Base `B` = `party=GARCHOMP:80,LUCARIO:76&fragments=7&noenc=1&core=1&zygarde=run,ram,terrain,climb,swim,detect,dive&zcells=96&zcores=5&flags=b01_dex_received,b02_libreta,p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,p6_restored,p7_restored,zyg_10,zyg_50,zyg_core_2,zyg_core_3,zyg_core_4,zyg_core_5,b15_n5&debug`

- Llegada: `/?scene=map&map=lagos_alma&x=13&y=57&dir=8&` + `B`
- Patio: `/?scene=map&map=santuario_alma&x=40&y=57&dir=8&` + `B` (añadir `,b16_llegada` a `flags`)
- Saber / Sentir / Querer: `x=32` / `x=40` / `x=48`, `y=49`, `dir=8` en `santuario_alma`
- Recuerdo de Gael: `/?scene=map&map=santuario_alma_recuerdo&x=9&y=12&dir=8&` + `B`
- Telar: `x=40&y=54` en el patio con `b16_hebra_saber,b16_hebra_sentir,b16_hebra_querer` en `flags`
- Hito (Forma Completa): `x=40&y=57&dir=2` en el patio con `zcells=100` y `p8_restored,b16_telar,b16_telar_abierto` en `flags` (bajar la escalinata); variante sin células: `zcells=94`
- T14: `/?scene=map&map=nexo_correos&x=4&y=8&dir=8&` + `B` con `p8_restored` (hablar desde (7,8) mirando a la derecha)

Comprobaciones: `node --test tests/b16_content.test.mjs tests/b16_reach.test.mjs`, `node tools/validate_content.mjs`,
`node tools/preview_map.mjs santuario_alma --pass`. Recorrido completo: `node tools/e2e_b16.mjs [--from=<tramo>]
[--only=<tramo>] [--to=<tramo>] [--no-retry]` con tramos `lagos saber sentir querer telar hito vuelo variante evaristo`
(capturas `tools/cache/screens/e2e_b16_*`, transcripción `e2e_b16_dialogos.txt`).

## Coordinación

- Cambios mínimos y aditivos fuera del bloque: `world/zygarde/eventTypes.js` (`rebuildGap`), `content/zygarde/texts.js`
  (`MEMORY_LINES.complete` = línea de CAMPANA; `FIELD_TEXT.rebuildTutorial`), `battle/core/battleItems.js`
  (`rules.sealedBag`), `world/fishing.js` (`fishingSystem`), `content/services/zones.js` (prefijos `lagos_`,
  `santuario_alma_`), `content/maps/b09b/nexo_correos.js` (página T14 del evento `evaristo`).
- Textos DECIDIDO-DEV a revisar por el autor: diálogos de vecinos, observadores y Genesis; relieves e inscripciones del
  Saber; escenas de las emociones (Leandro, Fermín, Fausto); frases del trío; la radio de los Guardianes; la carta de
  Don Evaristo. Líneas de canon literal: «Esperaremos a la policía», «Si no me sostengo ahora…», «Nada me obliga…»,
  «Me faltan [n] partes. Las siento todas encendidas.», las tres respuestas a Mesprit y el verso VIII.
