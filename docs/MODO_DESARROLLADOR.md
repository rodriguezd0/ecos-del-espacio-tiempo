# Modo desarrollador

Menú para moverte por el juego sin jugarlo entero: viajar a cualquier mapa, darte Pokémon y objetos, saltar al
inicio de cualquier bloque, tocar flags y variables, y cambiar la hora y el clima. En esta versión está siempre
activo.

## Cómo se abre

- **F9** cuando el mapa está libre (vuelve a pulsar F9 para cerrarlo). Durante un guion, una cinemática,
  una transición o un paso todavía en movimiento, espera a que termine antes de abrir el menú.
- O desde el menú de pausa (**C** o **Tab**) → **Desarrollador**. Debajo de la hora verás el recordatorio
  «F9: modo desarrollador».

## Controles

| Tecla | Qué hace |
|---|---|
| ↑ ↓ | moverse por la lista |
| RePág / AvPág, Inicio / Fin | saltar por la lista |
| Intro (o Z / Espacio donde no hay buscador) | elegir |
| Esc (o X donde no hay buscador) | volver atrás |
| Escribir | filtra las listas que tienen «Buscar:» (sin tildes, por nombre o id) |
| Retroceso | borra una letra de la búsqueda |
| F9 | cerrar el menú |

Abajo del menú hay una línea que explica la opción seleccionada y muestra el resultado de lo que acabas de hacer.

## Qué puedes hacer

- **Teletransporte a un mapa**:
  - Los mapas salen agrupados por bloque (B01, B02… y «Pruebas» al final).
  - Puedes buscar por nombre, por id o por bloque: «zaguan», «ruinas_dintel», «B05».
  - Al elegir un mapa, *Llegada automática* te deja en una casilla por la que se puede andar y de la que se puede
    salir. Busca, por este orden: el inicio del mapa, el punto de Vuelo, delante de una puerta, el borde de una
    conexión o la casilla más cercana al centro.
  - *Escribir casilla x,y* te lleva a la casilla que digas, por ejemplo `21,34`. Si esa no vale, a la válida más
    cercana.
  - «Mapa actual» sirve para moverte dentro del mapa en el que estás.
- **Saltar al inicio de un bloque** (B01–B21, con B09a y B09b por separado): deja la partida como estaría al empezar
  ese bloque y te lleva a su casilla de inicio. Pone:
  - los flags y las variables;
  - las capacidades, la forma, las células y los núcleos de Zygarde;
  - los Fragmentos Azur, las Tablillas y los objetos clave;
  - los destinos de Vuelo;
  - un equipo del nivel del tramo. El equipo que tenías pasa al PC, no se pierde nada. Si prefieres conservar tu
    equipo, elige *sin cambiar el equipo*.
- **Dar Pokémon**:
  - Cualquier especie y forma, por ejemplo «zygarde completa» o «mega».
  - Nivel de 1 a 100, normal o variocolor.
  - Va al equipo y, si el equipo está lleno, al PC.
- **Pokémon, objetos, dinero, curar**:
  - Cambiar el nivel de un miembro del equipo o hacerlo variocolor.
  - Curar el equipo.
  - Dar objetos, incluidos los propios de Axis (Fragmentos, Tablillas, Arca…), con la cantidad que quieras.
  - Sumar o restar dinero.
  - Abrir el PC.
- **Interruptores, hora y clima**:
  - *Atravesar paredes*, *Sin encuentros salvajes* y *Carrera ×2* (con Mayús corres el doble de rápido). Duran hasta
    que cierres el juego y se mantienen al cambiar de mapa.
  - Hora del día: horas rápidas o escribirla, por ejemplo `22` o `06:30`.
  - Clima: forzar lluvia, nieve, niebla… o *Automático* para volver al del mapa.
- **Progreso**:
  - *Flags*: ver, buscar, activar o desactivar. Si buscas un flag que no existe, se ofrece crearlo.
  - *Variables*: ver, cambiar o borrar (dejar el valor vacío la borra).
  - *Zygarde*: células, núcleos, forma, capacidades, «Todo Zygarde», Fragmentos, Tablillas, todos los destinos de
    Vuelo y registrar la Pokédex entera (vistos o capturados).
  - *Refrescar eventos del mapa*: si cambias flags a mano, vuelve a calcular los personajes y objetos del mapa en el
    que estás.
- **Guardar partida aquí**: abre el menú de guardado normal en cualquier sitio.

## Consejos

- Los cambios de flags se notan en los eventos del mapa en cuanto cierras el menú. Si algo no cambia, usa
  *Refrescar eventos del mapa* o entra y sal del mapa.
- El salto de bloque deja los flags **exactamente** como al empezar ese bloque, así que también sirve para volver
  atrás. Los objetos ya recogidos siguen recogidos.
- Si te atascas en un sitio, *Atravesar paredes* o *Teletransporte → Mapa actual* te sacan de ahí.
- Para una versión pública del juego basta con poner `DEV_MODE = false` en `game/src/dev/devConfig.js`.
