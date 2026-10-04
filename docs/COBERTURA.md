# Lista de cobertura — Ecos del Espacio-Tiempo

Todo lo previsto por la biblia debe aparecer aquí con su estado. Estados: ⬜ sin empezar · 🟨 en curso /
provisional · ✅ implementado y probado en juego · 🗄️ antecedente/descartado (no implementar).
Las decisiones abiertas de la biblia están cerradas (autor: D01–D08; resto DECIDIDO-DEV en `docs/DECISIONES.md`,
detalle en `docs/CAMPANA.md`). Lo marcado «provisional» es arte o balance revisable por el autor.

## Sistemas

| Sistema | Estado | Notas |
|---|---|---|
| Servidor de desarrollo + aviso de actualización | ✅ | `npm run serve` → http://localhost:8080 |
| Pipeline de datos Añil → JSON (especies, movimientos, habilidades, objetos, tipos, tilesets, audio) | ✅ | `npm run data` |
| Render Three.js pixel-perfect, escalado entero | ✅ | |
| Tilemap RMXP (3 capas, autotiles animados, prioridades) | ✅ | |
| Movimiento en rejilla, correr, colisiones, terrain tags, salientes | ✅ | |
| Eventos/NPC, disparadores, rutas de movimiento, condiciones | ✅ | |
| Guiones async (ctx), cinemáticas, cámara | ✅ | Director de cinemáticas del prólogo |
| Warps, puertas, conexiones entre mapas | ✅ | Animación de puertas pendiente |
| Pokémon acompañante + Core en cadena (D06) | ✅ | |
| Encuentros: modo clásico y visible (seleccionable) | ✅ | Biblia §15 |
| Ciclo día/noche, descansar/dormir/esperar tormenta, fases de crisis del cielo | ✅ | `world/rest.js`, `content/story/crisis*` |
| Clima, niebla, oscuridad con luces | ✅ | |
| UI: mensajes, elecciones, menú de pausa | ✅ | Estilo telepático del Core |
| Equipo, datos, mochila, Pokédex, opciones, guardar/cargar (3 ranuras + archivo) | ✅ | |
| Centro Pokémon, tienda por etapas, posada, tutor y recordador | ✅ | `content/services` |
| Pesca (Caña Vieja/Buena/Supercaña) | ✅ | |
| Mapa de Axis y Vuelo | ✅ | Atlas de CAMPANA §1; ilustración provisional |
| Tren regional y ferris | ✅ | Sistema; estaciones con cada bloque |
| Combate: motor (daño, tipos, estados, efectos, habilidades, objetos, IA) | ✅ | 463/463 códigos de función, 327/328 habilidades |
| Combate: escena estilo BW2 | ✅ | Animaciones de Añil; respaldo genérico por tipo/categoría |
| Captura, experiencia, subir nivel, aprender movimientos, evolución | ✅ | |
| Megaevolución | ✅ | Mega Aro en T04 (B07) |
| Alpha (raros, tamaño) y shiny | 🟨 | Tasas provisionales D29 (Alpha ×1.2) |
| Condiciones de captura legendaria comunicadas en UI | ✅ | Motor + escena |
| Fases de jefe (Arceus) | ✅ | Mecánica genérica; reglas de B21 |
| Zygarde: Core compañero de campo | ✅ | |
| Zygarde: 100 células y 5 núcleos, rótulo y registro | ✅ | `content/zygarde/cells.js`; sin latido, pitido ni flecha de proximidad |
| Zygarde 10%: montura, Embestida, Terreno complicado, Trepar | ✅ | |
| Zygarde 50%: Nadar, Buceo (burbuja con medidor) | ✅ | |
| Zygarde Completo: Vuelo, Reconstrucción persistente | ✅ | |
| Salto de Convergencia, Anclaje espacial | ✅ | Salto en B21; Red, caras y Senda de Anclaje en B22a, recorridos en Chrome |
| Arca de Zygarde (formas, sin coerción) | ✅ | |
| Libreta: pistas (2–3 abiertas), Profecía (Unown), Crónica, Tablillas, Diario y Células | ✅ | Modelo y seis pestañas implementados; `story_notebook_tabs.test.mjs` |
| Secuencia «Pilar restaurado» (Fragmento, verso, efecto local) | ✅ | `ctx.story.restorePillar` |
| Kit de Pilar con tinte por Pilar | ✅ | Arte provisional |
| Cordón Unión (evolución por intercambio en solitario) | ✅ | Venta en Lúmina (B09), evolución implementada |
| Huevos y eclosión | ✅ | `world/eggs.js` (B11: huevo de Togepi) |
| Guardería y crianza (Phione, Lazo Destino, movimientos huevo) | ✅ | `world/daycare.js` + `daycareEvent`; guardería de Lúmina abierta tras T06 (X29) |
| Validador de contenido y E2E por bloque | ✅ | `tools/validate_content.mjs`, `tools/e2e_*.mjs` |
| Cooperativo / intercambio / PvP | ✅ | Salas, historia en equipo, PvP, intercambios, chat y emotes; pruebas con dos motores y dos Chrome |

## Capítulos y escenas (juego base) — guion en `docs/CAMPANA.md`

| Bloque | Contenido | Estado |
|---|---|---|
| B01 | Prólogo P-01…P-04 + apertura (Villa Alba, laboratorio, iniciales, señal, sigilo, Core, Gael, Ruta 1) | ✅ E2E completo |
| B02 | P1 Umbral: Villa Zaguán, Ruinas del Dintel, Casilda, Geodude, 10% | ✅ E2E + verificación |
| B03 | Interludio 1: Ruta 2, Ciudad Caudal, T01 | ✅ E2E + verificación |
| B04 | P2 Corriente: Ruta 3, Garganta, Escalera de Estanques, Leandro | ✅ E2E + verificación |
| B05 | Interludio 2: Molino del Diezmo, Ruta 4, Villa Brontia | ✅ E2E + verificación |
| B06 | P3 Impulso: Ruta 5, Meseta, Parque Eólico (N2), Abril | ✅ E2E + verificación |
| B07–B08 | Ruta 6, Cantería (Mega Aro) / P4 Masa: Estrato, Mina, Dunas, Fermín | ✅ E2E + verificación |
| B09–B10 | Lúmina, museo, Reserva, Marisma, Nexo, Caleta / P5 Memoria: Mnemos, Olvido | ✅ E2E + verificación |
| B11–B12 | Neblino, Monte, regreso a casa / P6 Invertido (Mundo Distorsión, N3) | ✅ E2E + verificación |
| B13–B14 | Talasa (N4, combate con Alerce), Lumbre, Tizón / P7 Ecos (Bramaluna Alfa) | ✅ E2E + verificación |
| B15–B16 | Norte, Villa Boreal (N5, Gael) / P8 Alma (Uxie, Mesprit, Azelf, Cadena Roja, Completa) | ✅ E2E + verificación |
| B17–B18 | Axis en eclipse / P9 Convergencia (Dialga/Palkia) | ✅ E2E + verificación |
| B19–B20 | Calzada del Rey / P10 Origen (Trío de las Nubes, Gael, Flauta) | ✅ E2E + verificación |
| B21 | Columna Lanza: Salto, captura voluntaria de Zygarde, Arceus 3 fases, epílogo | ✅ E2E + verificación |
| Tablillas | 15 arcos T01–T15 (museo T06) repartidos en B03–B19 | ✅ con sus bloques |
| Partida continua | De «Nueva partida» a los créditos sin preajustes (curva de niveles, dinero, banderas) | 🟨 B01–B12 recorridos y guardados por UI con la misma partida; B13 en marcha. Guardado B12: 57 células, diez Tablillas, tres Núcleos, seis Fragmentos y Nadar |
| B22 | Postgame del juego base (búsquedas legendarias) | ✅ a–e recorridos en Chrome con capturas y retornos reales |
| B23 | DLC 1 «Almenara» (Gael, Hoopa, Mega Zygarde) | ✅ 13 hitos, 9 combates reales; derrota/reintento, sellado, captura opcional y final abierto |
| B24 | DLC 2 Registro de Expediciones | ✅ 30/30 Hallazgos, 47 combates reales, siete Ultrazonas, Naganadel/Necrozma y ambas hipótesis insulares |

## Personajes (arte provisional D30 en `game/assets/characters`)

| Personaje | Estado | Notas |
|---|---|---|
| Protagonista M (castaño cobrizo, sin gorra, chaqueta teal, #B9FF66, mochila) | ✅ provisional | Caminar, correr, monturas, buceo, trepar, pesca, combate |
| Protagonista F (pelo azul marino, mochila) | ✅ provisional | Ídem |
| Gael | ✅ provisional | Paleta histórica |
| Prof. Alerce | ✅ provisional | |
| Agente Olmedo, Mamá, Lía, vecinos, niños | ✅ provisional | |
| Guardianes: Casilda, Leandro, Abril, Fermín, Olvido | ✅ provisional | Charset + frontal |
| Genesis: Vértice, Casia, Garrido, técnicos/investigadores | ✅ provisional | Sin verde Zygarde |
| Curador/personal del museo, NPC del DLC 2 | ✅ provisional | Personal integrado; Sabela usa el charset científico de Añil, pendiente de aprobación D30 |
| Zygarde Core + 4 núcleos | ✅ | Core propio; núcleos por guion |

## Legendarios con función narrativa

Giratina (prólogo ✅, P6 sombra) · Dialga/Palkia (prólogo ✅, P9) · Zygarde (todo) · Uxie/Mesprit/Azelf (P8) ·
Bramaluna Alfa = ROARINGMOON (P7) · Tornadus/Thundurus/Landorus (P10) · Arceus (final) · Hoopa Desatado (DLC 1).

## Especies

Pokédex de Axis: 425 entradas (412 del inventario + 13 reconciliaciones, D28 DECIDIDO-DEV). Catálogo y generador
corregidos (e717e01), con numeración anterior conservada y las 13 especies visibles en la lista. Distribución por
zonas en `docs/POKEDEX_DISTRIBUCION.md`; auditoría de métodos en solitario cerrada: 425/425 y elecciones
compatibles. Alcance y evidencia en `docs/CIERRE_CONTENIDO.md`.

## Objetos clave

| Objeto | Estado |
|---|---|
| Pokédex (POKEDEXAXIS), Poké Balls | ✅ B01 |
| Fragmentos Azur ×10 → Flauta Azur | ✅ sistema; entrega por Pilar |
| Tablillas ×18 (17 de tipo + Legendaria; sin BLANKPLATE) | ✅ sistema; entrega por arco |
| Libreta de pistas, Arca de Zygarde | ✅ sistema; entrega en B02 |
| Clave Glífica, Hebras, Cadena Roja, Llave del fondo, Atrapasueños, Piedra Magma, Piedra Crisol, Engranajes | ✅ datos (`items_axis.json`) |
| Mega Aro + megapiedras | ✅ B07 y búsquedas del postgame; Zygardita en Almenara |
| Cordón Unión | ✅ B09 |

## Integración entre bloques (Bloque 1)

Los destinos de los enlaces preparados en `game/src/content/maps/b01/pending_links.js` ya están registrados.
El aviso neutro de ese módulo se conserva como respaldo para un destino ausente.

| Estado | Enlace | Bloque | Verificación actual |
|---|---|---|---|
| ✅ | Ruta 1 → **Ruta 10** (cruce oeste, tramo bajo; C007) | B11 | Conexión bidireccional implementada; definiciones y costura revisadas. |
| ✅ | Ruta 1 → **Villa Zaguán** (salida sur) | B02 | Conexión implementada, costura limpia y recorrida desde Nueva partida. |
| ✅ | Ruta 1 → **Cerro del Alba** (cornisa, Trepar) | B11/postgame | Raíces en el mirador (24,7) → `cerro_alba` (C054); encuentro de Ho-Oh implementado y capturado en B22c. |
| ✅ | Monte del Portal: C050, C051 y C076 | B12 | Hecho en B12: `montana_portal` ampliado en su sitio a 50×50 (se conserva la llegada (17,48) del campamento); C050 (26,46), C051 (17,21), C076 (39,41, Nadar). |
