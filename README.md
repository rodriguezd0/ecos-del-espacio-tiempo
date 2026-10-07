# Pokémon: Ecos del Espacio-Tiempo

Fangame 2D de navegador ambientado en la región Axis, desarrollado con JavaScript, Three.js y Node.js. Incluye la campaña de diez Pilares, postgame, Almenara, Expediciones y multijugador.

La campaña B01–B21 está terminada y se recorrió desde Nueva partida hasta los créditos y la recarga del final. B22–B24 tienen recorridos de bloque con sus fixtures declarados. Base del juego `fb5cae3`: 2484/2484 pruebas, 272 mapas sin errores y 45 conexiones limpias. **Verificación de esta entrega, 07-10-2026: 2518/2518 pruebas**, incluidos 34 casos nuevos del empaquetador y publicador. El alcance del juego está en [CIERRE_CONTENIDO.md](docs/CIERRE_CONTENIDO.md).

## Continuar el proyecto

Leer [AGENTS.md](AGENTS.md) y [CONTINUIDAD_CODEX.md](docs/CONTINUIDAD_CODEX.md). La guía conserva arquitectura, decisiones aprobadas, comandos de QA, migraciones, incidentes resueltos y límites de las comprobaciones. Las nuevas revisiones del autor son el siguiente trabajo; la antigua lista de pausa ya está cerrada.

## Instalación

Requisitos: Node.js y npm; el desarrollo anterior usó Node 24.21.0 y el entorno de entrega tiene Node 26.10.0. Para las pruebas de navegador hace falta Chrome o Edge instalado: `playwright-core` no descarga un navegador.

1. Clonar o copiar el proyecto.
2. Colocar los recursos originales en **`Pokemon Anil V4.13/`**, junto a `package.json`. Esa carpeta debe contener `Graphics/`, `Audio/` y `Fonts/`; no está incluida en Git. Ver [RECURSOS_EXTERNOS.md](docs/RECURSOS_EXTERNOS.md).
3. Ejecutar desde la raíz:

```powershell
npm.cmd ci
npm.cmd run serve
```

En Linux/macOS, usar `npm` en lugar de `npm.cmd`. En PowerShell, `npm.cmd` evita que la política de scripts de Windows bloquee el lanzador `npm.ps1`.

Abrir **http://localhost:8080/**. Los módulos de Three.js y los datos procesados ya están versionados; no hace falta regenerarlos para jugar. `npm run vendor` actualiza los módulos vendorizados desde la dependencia instalada.

Si se entrega `ecos-anil-resources.zip`, extraerlo en la raíz del clon. El resultado debe ser `Pokemon Anil V4.13/Graphics/…`, sin una carpeta adicional entre el proyecto y Añil. El manifiesto adjunto permite comprobar integridad.

El servidor sirve `game/`, los recursos de Añil bajo `/anil/`, salas WebSocket y partidas en disco. Puede configurarse con `PORT`, `HOST` y `SAVES_DIR`. GitHub aloja el proyecto; para jugar hace falta ejecutar el servidor Node. La carpeta de Añil tiene una ruta fija en `server.mjs`.

## Comandos

| Comando | Uso |
|---|---|
| `npm run serve` | Servidor de juego, por defecto puerto 8080 |
| `npm test` | Suite Node completa |
| `npm run vendor` | Copiar ambos módulos de Three.js y su licencia |
| `node tools/validate_content.mjs --quiet --json` | Validar contenido y destinos |
| `node tools/check_seams.mjs` | Revisar conexiones entre mapas |
| `node tools/gen_registries.mjs --check` | Comprobar índices generados |
| `node tools/e2e_player_sprite_transition.mjs` | Regresión de visibilidad al correr, M/F |
| `node tools/package_handoff_assets.mjs` | Preparar y verificar el ZIP de recursos para otra máquina |

La [guía del recorrido continuo](tools/e2e_campaign_README.md) explica su ejecución y reanudación. Muchos conductores fijan rutas de Chrome en Windows y el puerto 8080; revisar su cabecera antes de ejecutarlos en otro sistema. `npm run data` regenera datos y arte procesado desde las fuentes de Añil y modifica archivos versionados: usarlo solo cuando corresponda a un cambio.

## Controles

| Acción | Tecla |
|---|---|
| Mover | Flechas o WASD |
| Confirmar / interactuar | Z, Espacio o Enter |
| Cancelar | X o Escape |
| Pausa | C o Tab |
| Correr | Shift |
| Acciones de campo | Q / E |
| Herramientas de desarrollo | F9 |

## Documentación

| Documento | Contenido |
|---|---|
| [CONTINUIDAD_CODEX.md](docs/CONTINUIDAD_CODEX.md) | Entrega al siguiente desarrollador |
| [DECISIONES.md](docs/DECISIONES.md) | Decisiones del autor y resoluciones de desarrollo |
| [CAMPANA.md](docs/CAMPANA.md) | Historia, mapas, progresión y bloques |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Contratos técnicos |
| [arte.md](docs/arte.md) | Fuentes y aprobaciones de arte |
| [REVISION_REQUISITOS.md](docs/REVISION_REQUISITOS.md) | Auditoría de requisitos y evidencia |
| [PENDIENTES.md](docs/PENDIENTES.md) | Trabajo cerrado y revisiones del autor |
| [RECURSOS_EXTERNOS.md](docs/RECURSOS_EXTERNOS.md) | Recursos necesarios, paquete y atribuciones |

## Partidas y evidencia

`saves/`, `tools/cache/`, `.tools/` y `node_modules/` están ignorados. Publicar el código no transfiere partidas personales, perfiles de navegador ni resultados históricos de QA. Para mover una partida, usar Exportar/Importar del juego o acordar una copia de sus archivos. Los scripts y resúmenes de las pruebas sí están versionados.

## Entrega a GitHub

Destino solicitado por el autor: **`rodriguezd0/ecos-del-espacio-tiempo`**. Al preparar estos archivos, la creación del repositorio y la subida siguen pendientes: GitHub requiere iniciar sesión y esta sesión administrada permite leer `.git`, pero no escribirlo. El código previo está guardado hasta `fb5cae3`; la documentación y el empaquetador de esta entrega deben incluirse en el siguiente commit.

Desde una terminal con acceso de escritura al repositorio y GitHub autenticado, revisar `git status` y el diff, añadir los archivos de entrega, hacer un commit convencional y crear el repositorio sin inicializarlo. Publicar `master`; la rama `wip-pausa-25-09` es histórica y no debe fusionarse automáticamente. Adjuntar el ZIP y su manifiesto a una Release si se va a distribuir ese conjunto de recursos. No dar por publicado un repositorio hasta verificar la rama remota y los archivos de la Release.

La entrega preparada puede publicarse con un comando desde esa terminal:

```powershell
node tools/publish_handoff.mjs
```

Hace falta GitHub CLI instalado o la copia portátil local de `.tools/`. Si falta iniciar sesión, ejecutar `gh auth login --hostname github.com --git-protocol https --web`; la copia portátil de esta máquina es `.\.tools\gh-2.102.0\bin\gh.exe`.

El script exige la cuenta `rodriguezd0`, comprueba los destinos HTTPS de fetch/push y los cambios pendientes del índice y del disco, verifica los recursos, configura el acceso Git de GitHub CLI, crea el commit y el repositorio público, publica ambas ramas sin fusionarlas y adjunta el paquete a una Release. Confirma el hash remoto, el tag y los tamaños/digests de los archivos subidos. Puede completar una Release parcial sin reemplazar recursos existentes; se detiene ante cambios ajenos, un destino diferente o contenido remoto incompatible.

La preparación local también conserva `tools/cache/publicacion/ecos-history.bundle` (historial completo verificado) y `ecos-continuidad-source.zip` con el árbol de código/documentación de esta entrega, acompañado por su manifiesto. Son copias para transferir el trabajo mientras la publicación esté pendiente; no equivalen a un commit nuevo ni a un push.

## Créditos

Pokémon pertenece a Nintendo, Game Freak y Creatures. Los recursos originales de Pokémon Añil conservan sus créditos y condiciones originales. Three.js se distribuye bajo MIT; se incluye su [licencia](game/vendor/LICENSE.three.txt). Este repositorio no asigna una licencia propia a esos recursos de terceros.
