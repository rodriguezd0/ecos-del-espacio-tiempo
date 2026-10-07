# Instrucciones para continuar Ecos

## Contexto antes de editar

- Leer `README.md`, `docs/CONTINUIDAD_CODEX.md`, las decisiones del alcance en `docs/DECISIONES.md` y el README del bloque afectado.
- Campaña B01–B21, postgame B22 y DLC B23/B24 están implementados. La antigua pausa de septiembre es historia; partir de las nuevas revisiones del autor.
- Precedencia narrativa: instrucciones actuales del autor → decisiones posteriores fechadas → biblia → guion de bloque. No recuperar decisiones descartadas por tener una expectativa antigua en un test.
- Localizar los archivos con `rg --files` y buscar con `rg`. Respetar los contratos y las APIs existentes.

## Preferencias permanentes de Rodrigo

- No crear UI sobreexplicativa. Usar etiquetas, botones y estados breves.
- No agregar párrafos que repitan el botón, expliquen lo obvio o describan el funcionamiento interno.
- No agregar aclaraciones preventivas o tranquilizadoras no solicitadas.
- Un estado necesario se expresa con una etiqueta breve, sin una explicación adicional.
- Conservar los mensajes que el usuario solicite expresamente. No inventar microcopy de acompañamiento.
- Revisar también éxito, error, carga y vacío para eliminar repeticiones y texto sobrante. Los diálogos canónicos mantienen su intención narrativa.
- Dar avances breves, concretos y frecuentes. Resolver las decisiones rutinarias dentro del encargo autorizado; registrar cambios de criterio de desarrollo como DECIDIDO-DEV.

## Trabajo compartido

- Delegar tareas independientes cuando ayude; usar como máximo dos agentes de trabajo simultáneos además del principal, salvo instrucción del autor.
- Asignar propiedad explícita de archivos. Recordar a cada agente que no está solo, que debe respetar cambios ajenos y que no debe revertirlos.
- Coordinar índices generados, hooks compartidos y Git. Solo el responsable de integración prepara commits y publica.
- Leer el estado y diff antes de editar o integrar. No usar reset, limpieza o sobrescritura para descartar trabajo ajeno.

## Reglas de implementación

- `GameState` y sus datos persistentes se modifican mediante sus APIs. Conservar UID, huecos del PC, flags y recompensas pendientes.
- Añadir o cambiar persistencia exige revisar creación, migraciones, versión y regresión de carga. Una reorganización de mapa mantiene IDs o define una llegada migrada válida.
- Preservar decoradores, páginas y eventos existentes al añadir postgame a un mapa antiguo. Revisar el orden de los hooks.
- `game/src/content/maps/index.js` y `trainers/index.js` se generan con `tools/gen_registries.mjs`; comprobar `--check` y regenerar cuando cambien registros.
- No alterar los PNG humanos ni el atlas aprobados el 04-10-2026 como efecto secundario de otro arreglo. Propuestas nuevas llevan revisión del arte pertinente.
- Zygarde conserva el tono serio y breve de X34. Células quietas y sin señales de proximidad. Tamaños X37 y separación global de seguidores X38 se conservan.
- Mantener la excepción de pasabilidad de las rocas de cueva usadas por Cámara, Tizón y Gruta Escarcha.
- Para evitar el parpadeo idle/correr, conservar el contrato de caché síncrona y la hoja previa del jugador mientras carga la siguiente. No aplicarlo indiscriminadamente a NPC.
- El código del juego es ESM sin bundler. No regenerar todos los datos como reparación genérica: las salidas procesadas ya están versionadas y el pipeline requiere Añil.

## Verificación

- Para bugs y funcionalidades, escribir primero una regresión que falle; implementar el cambio, ejecutar el foco y revisar el diff. Objetivo de cobertura: al menos 80 % del alcance cambiado, declarando qué se midió.
- Pedir revisión independiente de cambios de código. No añadir tests que repitan la implementación ni pruebas innecesarias para ajustes documentales reversibles.
- Ejecutar la suite completa cuando cambie lógica compartida o la integración lo requiera. Última base del juego `fb5cae3`: 2484/2484; ese número no reemplaza la ejecución pertinente de un cambio nuevo.
- En contenido/mapas, validar destinos, registros, pasabilidad, costuras y progresión. Contrastar expectativas del arnés con el canon antes de cambiar producción.
- Un banco de bloque declara sus fixtures. La QA continua no concede progreso, recursos, Pokémon ni flags: avanza por UI y conserva su identidad.
- Comparar una recarga con el payload escrito, no con un reloj vivo que ya avanzó al cerrar el menú.
- Usar almacenamiento aislado para QA; no sobrescribir partidas del autor. Evidencia y perfiles en `tools/cache/` están ignorados.

## Git y entrega

- Usar commits convencionales y revisar archivos staged. No incluir secretos, partidas, perfiles, dependencias instaladas ni runtimes portátiles.
- `.gitignore` excluye Añil. Una entrega jugable necesita además los recursos externos; consultar `docs/RECURSOS_EXTERNOS.md` y el empaquetador.
- No fusionar completa `wip-pausa-25-09`: conserva material anterior a los Pilares verticales y su contenido útil ya fue integrado selectivamente.
- Respetar los permisos reales de la sesión. Si `.git` está en solo lectura, no sortearlo con otro shell, otro directorio Git o una copia del repositorio.
- Documentar el resultado real del commit, remoto, push y recursos publicados. No afirmar una publicación o una prueba que no se haya comprobado.
