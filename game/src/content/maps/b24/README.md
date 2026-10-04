# B24 — Registro de Expediciones

Implementación de CAMPANA §8.3 / D27. La Aduana Vieja se abre desde la puerta existente de Nexo únicamente con `game_cleared` y `b21_fin`. Sabela Ferreiro, 34 años, cronista y cartógrafa que trabajó para la autoridad portuaria, presenta seis categorías y acepta errores de hipótesis sin coste.

`expeditions.json` contiene los 30 expedientes. `b24_registry.js` valida IDs, mantiene como máximo tres activos y conserva Rumor → Indicio → Hallazgo. El lugar de una hipótesis se marca en `ui.openRegionMap({ mode: 'select' })`; no requiere visita previa ni Vuelo. Pausar libera una plaza sin borrar avances.

Las cuatro oleadas se abren con 0, 3, 7 y 12 Hallazgos. Estos umbrales son **DECIDIDO-DEV**; no cambian la lista ni los requisitos canónicos. Sabela vende las provisiones necesarias, incluidas Ente Balls en la última oleada.

## Mapas y regresos

Todos los mapas nuevos tienen 27 × 25 casillas, llegada `(13,22)` y salida inferior `(13,23)`. El regreso permanece abierto aunque se pause el expediente o se debilite el viajero.

| Mapas | Acceso / regreso |
|---|---|
| `b24_aduana_vieja` | Puerta Nexo `(38,30)` / delante de ella `(38,31)` |
| `b24_isla_petalo`, `b24_isla_estandarte` | Ferri de Nexo tras confirmar la hipótesis / pantalán Nexo `(26,37)` |
| `b24_santuario_neblino` | Ruta 9 `(25,18)` / `(25,19)` |
| `b24_claro_justicia` | Ruta 9 `(41,24)` / `(41,23)` |
| `b24_cuna_coral` | Antea presente `(16,18)`, Buceo / `(16,19)` |
| `b24_canteria_justicia` | Cantería `(12,10)` / `(12,11)` |
| `b24_cueva_dunas` | Dunas `(32,24)` / `(32,25)` |
| `b24_mina_diamante` | Mina Galena `(8,18)` / `(8,19)` |
| `b24_termas_tizon` | Tizón `(25,19)` / `(25,20)` |
| `b24_dos_ideales` | Sima `(18,15)` / `(18,16)` |
| `b24_crater_lucero` | Cerro del Alba `(16,7)` / `(16,8)` |
| `b24_ultra_cristal`, `b24_ultra_selva`, `b24_ultra_tormenta`, `b24_ultra_cielo`, `b24_ultra_abismo`, `b24_ultra_fortaleza`, `b24_ultra_veneno` | Umbrales del Cráter con Solgaleo/Lunala despierto / Cráter `(13,18)` |

Los hooks de campaña son decoradores aditivos de `events`; no sustituyen páginas de NPC, flags ni accesos anteriores. Solo Ruta 5 y Ruta 11 reciben una pequeña charca en un claro existente para mostrar a Bidoof sobre agua real. Meloetta aparece en el camino de bambú de Mnemos `(8,24)`; no ocupa C045.

## Requisitos jugables

| Expedientes | Condición / acción |
|---|---|
| Mew | Tres informes distintos de Bidoof en rutas 1/2/4/5/11; encuentro Ruta 1 |
| Celebi / Jirachi | Ocho pasos sin correr ni montar y una baya / noche despejada y Trozo Estrella |
| Manaphy / Phione | Huevo real con Buceo y hueco / Manaphy eclosionado + Ditto en la Guardería real |
| Shaymin / Victini | Barcos desde Nexo; la florista entrega Gracídea tras Shaymin |
| Cobalion / Terrakion / Virizion / Keldeo | Tres rescates/apoyos; los NPC andan hasta el lugar seguro / los tres espadachines despiertos en el equipo |
| Reshiram / Zekrom / Kyurem | Elección consume Piedra Crisol; fragmentos en Forja Tizón después del primero / ambos en equipo; Punta ADN |
| Meloetta | Canto aprendido con PP al atardecer en Mnemos |
| Xerneas / Yveltal | 300 pasos de Reserva sin KO salvaje / 10 victorias salvajes consecutivas en Sima |
| Diancie / Volcanion | Tres Sableye reales durante la escolta de Carbink / movimiento Agua propio seguido de Fuego antes de 20 pasos |
| Cosmog / Solgaleo / Lunala | Rescate real de Cosmog; evoluciona al 43 y usa Piedra Día/Noche de Añil; el otro en Cumbre con el primero, a la hora correspondiente |
| Ultraentes | Viajero propio y regla local: prismas, dos claros, secuencia de conductores, dos plataformas, ecos, contrapesos físicos o refugios de niebla |
| Necrozma | Once especies Ultra capturadas, incluida Naganadel por evolución al 50; oscuridad local del Cráter que termina al capturarlo |
| Magearna / Zeraora | Cinco engranajes en Estrato/Talasa/Brontia/museo/astillero y reparación en Trastos / Danza Lluvia seguida de Trueno propios |

Todos los encuentros salvo los regalos de Huevo y el rescate de Cosmog son combates salvajes normales. Las Balls y objetos se consumen en la partida; no se simulan capturas por flags. Un KO guarda `dlc2_<especie>_descanso = rest_count` y reaparece al descansar. Perder cura el equipo, conserva el dinero y permite reintentar en el lugar; huir también permite volver. `noCoop: true` evita compartir requisitos de equipo y expediciones.

En Fortaleza, la palanca reinicia **todos** los contrapesos antes de resolver, por lo que también recupera posiciones atrapadas. Lo resuelto permanece. Un NPC rescatado cuyo destino está ocupado espera sin completar la etapa ni teletransportarse.

## Persistencia y observadores

- Fases: `dlc2_<expedición>_rumor`, `_indicio`, `_confirmada`, `_hallazgo`; lista normalizada `vars.dlc2_activas`.
- Capturas: `dlc2_<especie>_capturado`; no se reconstruyen Pokémon mediante flags.
- Avances: informes Mew, sigilo Celebi, pasos Xerneas, racha Yveltal, rescates, escolta, acciones de campo y posiciones de pesos son serializables.
- `observeStep(state, { mapId, x, y, running, mounted })`: paso real, sigilo, Reserva, plazo de Termas y Hallazgos por propiedad/evolución/cría.
- `observeBattle(state, { mapId, type, outcome, opponentSpecies, exhibition })`: resultado real aplicado a la partida; excluye exhibiciones y distingue captura/huida/derrota de victoria.
- Entradas inválidas, mapas desconocidos y IDs ajenos al catálogo no abren expediciones ni modifican recursos. Se normalizan arrays persistidos y coordenadas de contrapesos.

El motor conecta ambos observadores, el selector regional y las paradas del ferri. `items_axis.json` se mezcla con los datos base: se conservan IDs existentes de Piedra Crisol y Engranaje; los Fragmentos Crisol son una entrada aditiva. Los engranajes acumulan cantidad normal y están protegidos contra venta y descarte.

## Arte y comprobaciones

**PROVISIONAL (D30):** el sprite de Sabela reutiliza `anil:cientifica`; sus datos y diálogo sí identifican a Sabela. Los cuatro objetos propios (`b24_hitos`, `b24_umbral`, `b24_engranaje`, `b24_cuna`) los genera `tools/b24_assets.mjs` como hojas completas de 4 × 4, sin modificar atlas comunes. El autor puede sustituirlos sin cambiar geometría ni lógica.

Pruebas: `node --test tests/b24*.test.mjs`. La cobertura se mide con `--experimental-test-coverage --test-coverage-include='game/src/content/events/b24_*.js'`. Las pruebas construyen los 19 mapas con la biblioteca real, recorren páginas activas y retornos, empujan los pesos sobre pasabilidad real, resuelven los rescates andando y ejecutan capturas con el motor de combate.

Recorrido Chrome: `node tools/e2e_b24.mjs`. Se puede continuar mediante `--resume=tools/cache/screens/e2e_b24_checkpoint.json`; fases `--only=registro|wave1|phione|wave2|wave3|wave4`. `--only=finale` reanuda desde la evolución de Naganadel con una entrada real al Cráter. Las fixtures preparan historia, equipo, hora y recursos; las condiciones se cumplen mediante menús/teclas, pasos, combates y evoluciones reales. Capturas, logs y estado acumulado quedan en `tools/cache/`.

La selección de las dos islas se comprueba por separado con `node tools/e2e_b24.mjs --only=islandmap --prefix=e2e_b24_islandmap`, sin sustituir el checkpoint acumulado. Pétalo y Estandarte tienen sus propios lugares en el atlas; visitar Nexo sigue dando el Indicio antes del barco.

Verificación del 04-10-2026: 155/155 pruebas B24; cobertura de eventos 97.12 % líneas, 82.47 % ramas y 85.03 % funciones; regresión afectada 82/82. Chrome cerró los 30/30 Hallazgos con 47 combates reales (32 capturas, incluida la de Ditto para Phione), eclosión/cría, dos evoluciones de Cosmog, evolución de Poipole, KO/descanso, derrota y retornos. Informe y logs: `tools/cache/b24_entrega.md`.
