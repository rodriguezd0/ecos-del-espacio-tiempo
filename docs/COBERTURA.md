# Lista de cobertura — Ecos del Espacio-Tiempo

Todo lo previsto por la biblia debe aparecer aquí con su estado. Estados: ⬜ sin empezar · 🟨 en curso /
provisional · ✅ implementado y probado en juego · ⛔ bloqueado por decisión (Dxx) · 🗄️ antecedente/descartado (no implementar).

## Sistemas

| Sistema | Estado | Notas |
|---|---|---|
| Servidor de desarrollo + aviso de actualización | ✅ | `npm run serve` → http://localhost:8080 |
| Pipeline de datos Añil → JSON (especies, movimientos, habilidades, objetos, tipos, tilesets) | ✅ | `npm run data` |
| Render Three.js pixel-perfect, escalado entero | ✅ | Fundación (24-09) |
| Tilemap RMXP (3 capas, autotiles animados, prioridades) | ✅ | |
| Movimiento en rejilla, correr, colisiones, terrain tags, salientes | ✅ | |
| Eventos/NPC, disparadores, rutas de movimiento, condiciones | ✅ | |
| Guiones async (ctx), cinemáticas, cámara | ✅ | |
| Warps, puertas, conexiones entre mapas | ✅ | Animación de puertas pendiente |
| Pokémon acompañante (seguidor) | ✅ | Cadena con el Core: fase 2 |
| Encuentros: modo clásico y visible (seleccionable) | ✅ | Biblia §15 |
| Ciclo día/noche (reloj de juego, descansar) + estados de crisis del cielo | 🟨 | Reloj y efectos aurora/luna/grietas hechos; "descansar" pendiente |
| Clima, niebla, oscuridad con luces | ✅ | |
| UI: mensajes, elecciones, menú de pausa | ✅ | Estilo telepático del Core incluido |
| Equipo, datos (resumen), mochila, Pokédex, opciones, guardar/cargar | ✅ | |
| Tienda, Centro Pokémon, PC de almacenamiento | 🟨 | Tienda y PC hechos; Centro Pokémon (evento de cura) con el contenido |
| Mapa de Axis / Vuelo (Complete) | 🟨 | Estructura hecha; datos del atlas pendientes (X02) |
| Combate: motor (daño, tipos, estados, efectos, habilidades, objetos, IA) | ✅ | 463/463 códigos de función, 327/328 habilidades |
| Combate: escena estilo BW2 (sprites animados, cajas, menús, animaciones) | 🟨 | Fase 2 en curso |
| Captura, experiencia, subir nivel, aprender movimientos, evolución | 🟨 | Motor ✅; presentación en fase 2 |
| Megaevolución (Mega Aro, piedras) | 🟨 | Motor ✅; obtención en campaña pendiente |
| Alpha (raros, tamaño) y shiny | ⬜ | ⛔ tasas D29 (provisional ~3% Alpha) |
| Condiciones de captura legendaria comunicadas en UI | ⬜ | Biblia §15 |
| Zygarde: Core compañero de campo (fuera del equipo) | ⬜ | |
| Zygarde: células (100) y núcleos (5), detector | ⬜ | ⛔ D10 ubicaciones |
| Zygarde 10%: Correr, Embestida, Terreno complicado, Trepar | ⬜ | |
| Zygarde 50%: Nadar, Detección mejorada, Buceo (burbuja) | ⬜ | |
| Zygarde Completo: Vuelo clásico, Reconstrucción de terreno | ⬜ | |
| Salto de Convergencia (10% → Columna Lanza) | ⬜ | |
| Arca de Zygarde (gestión de formas, sin coerción) | ⬜ | |
| Registro de pistas de Tablillas (2–3 abiertas) | ⬜ | ⛔ D11 |
| Guardado local (3 ranuras) + exportar/importar | ✅ | |
| Sonido: BGM con bucles, SE, ME, gritos | ✅ | 82/110 BGM con puntos de bucle; señal del Core procesada |
| Cordón Unión (evolución por intercambio en solitario) | ⬜ | Biblia §15 |
| Cooperativo / intercambio / PvP | ⬜ | Opcional; nunca requisito (biblia §15) |

## Capítulos y escenas (juego base)

| Bloque | Contenido | Estado |
|---|---|---|
| P-01…P-04 | Prólogo: Distorsión, montaña/cascada/portal, Zygarde Completo, dispersión (100 células, 5 núcleos) | ⬜ |
| Apertura | Pueblo inicial, hogar, laboratorio, iniciales (Turtwig/Litten/Sobble), señal, policía, sigilo, Core, regreso, Gael, salida | ⬜ ⛔ D01–D06 |
| P1 Umbral | Laberinto sencillo, mecanismos + Geodude, Guardián humano, Fragmento 1, primer 10% | ⬜ ⛔ D07–D08 |
| P2 Corriente | Guardián humano, Fragmento 2 (sin exigir Nadar) | ⬜ ⛔ D09 |
| P3 Impulso | Requiere Embestida; Guardián humano; Fragmento 3 | ⬜ |
| P4 Masa | Terreno complicado; Guardián humano; Fragmento 4 | ⬜ |
| P5 Memoria | Guardián humano; Fragmento 5; acceso por ratificar | ⬜ ⛔ D09 |
| P6 Invertido | Trepar a la montaña del prólogo; Mundo Distorsión; sombra de Giratina; Fragmento 6 | ⬜ |
| P7 Ecos | Buceo; eco del pasado; Bramaluna Alpha; Fragmento 7 | ⬜ |
| P8 Alma | Uxie/Mesprit/Azelf; Cadena Roja; Fragmento 8; hito Zygarde Completo | ⬜ ⛔ D17 |
| P9 Convergencia | Cadena Roja; Dialga/Palkia (elección); Fragmento 9 | ⬜ ⛔ D18 |
| P10 Origen | 9 fragmentos + 15 Tablillas; Trío de las Nubes; Gael; Fragmento 10; Flauta Azur | ⬜ ⛔ D20 |
| Final | Falsa calma; Salto de Convergencia; captura voluntaria de Zygarde; Arceus Tierra→Fantasma→Normal; 18 Tablillas; epílogo | ⬜ ⛔ D21–D24 |
| Tablillas | 15 arcos obligatorios (T01–T15) incl. museo | ⬜ ⛔ D11 |
| Genesis | Presencia desde el juego base, líder que huye, profesor ex-Genesis (revelación sutil), combate aliado con el profesor | ⬜ ⛔ D13–D15 |
| Postgame | Búsquedas legendarias (biblia §12) | ⬜ |
| DLC 1 / DLC 2 | Gael + Hoopa + Mega Zygarde / investigaciones legendarias | ⬜ ⛔ D25–D27 |

## Personajes

| Personaje | Estado | Notas |
|---|---|---|
| Protagonista masculino (castaño cobrizo, sin gorra, chaqueta teal oscuro, acento #B9FF66) | ⬜ | ⛔ D01, D30 (arte provisional) |
| Protagonista femenina (pelo azul marino) | ⬜ | ⛔ D01, D30 |
| Gael (rival; antecedente: rubio, chaqueta bordó) | ⬜ | ⛔ D16, diseño por ratificar |
| Profesor (ex-Genesis, revelación tardía) | ⬜ | ⛔ D03, D15 |
| Policía del acceso restringido | ⬜ | ⛔ D04 |
| Guardianes: Umbral, Corriente, Impulso, Masa, Memoria | ⬜ | ⛔ D07 y siguientes |
| Líder Supremo de Genesis | ⬜ | ⛔ D14 |
| Investigadores/mandos de Genesis | ⬜ | ⛔ D13 |
| Curador/personal del museo | ⬜ | ⛔ D11 |
| NPC de investigación legendaria (DLC 2) | ⬜ | ⛔ D27 |
| Zygarde: Core inicial + 4 núcleos | ⬜ | |
| Habitantes del pueblo inicial | ⬜ | |

## Legendarios con función narrativa

Giratina (prólogo, P6 sombra) · Dialga/Palkia (prólogo, P9) · Zygarde (todo) · Uxie/Mesprit/Azelf (P8) ·
Bramaluna Alpha = ROARINGMOON (P7, fuera del inventario de 412: pendiente D28) · Tornadus/Thundurus/Landorus (P10) ·
Arceus (final) · Hoopa Desatado (DLC 1) — todos ⬜.

## Especies

Inventario de 412 en `game/data/dex_axis.json` (336 generales, 7 Paradoja, 11 Ultraentes, 58 legendarios/singulares).
Todos los IDs verificados contra PBS de Añil ✅. Distribución por zonas/versiones ⛔ D28.
Pendientes de reconciliación: ROARINGMOON, DITTO, SABLEYE, LATIAS/LATIOS, fauna submarina.

## Objetos clave

| Objeto | Estado |
|---|---|
| Fragmentos Azur ×10 → Flauta Azur | ⬜ |
| Tablillas ×18 (15 + 3 de Arceus) | ⬜ ⛔ D11/D12 |
| Cadena Roja (componentes de Uxie/Mesprit/Azelf) | ⬜ ⛔ D17 |
| Arca de Zygarde (ZYGARDECUBE en PBS) | ⬜ |
| Pokédex, Poké Balls | ⬜ ⛔ D05 (mecanismo de entrega) |
| Mega Aro + megapiedras | ⬜ |
| Cordón Unión | ⬜ |
