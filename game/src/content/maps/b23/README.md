# B23 — Almenara

CAMPANA §8, D25/D26: península oriental accesible por el ferri de Nexo después del epílogo y de recibir la carta de Alerce. Ocho mapas, con regreso permanente: Puerto Almenara y Centro, Ruta A1, Ruta A2, Oasis del Vaso, Monte Candil, El Crisol y Torre del Crisol. Piezas de Añil en tilesets 1, 4, 9, 6 y 11; objetos nuevos reproducibles con `node tools/b23_assets.mjs` (arte provisional D30).

El nodo del Laberinto dispara el robo de Hoopa. Alerce entrega la carta; la Red omite el nodo mientras está ausente. En Almenara, detener la bomba permite reparar el faro; detener las salinas permite devolver el agua al Oasis y recoger la Vasija Castigo. Los técnicos del Crisol protegen la grabación de Vértice y los tres mandos de aislamiento. Las puertas comprueban estos hitos al entrar, y siempre permiten volver.

EXP-03 procede de la explanada del Monte del Portal, donde Zygarde Completo combatió tres noches. La piedra no responde a la fuerza de Gael: se agrieta. Responde a Zygarde y al jugador por voluntad propia. La Zygardita se entrega una vez y se puede equipar al Zygarde Completo de la partida; si está en el PC, Gael espera. Su equipo real tiene seis Pokémon de nivel 80–82, Mega Absol y el aro negro.

La resolución exige haber megaevolucionado a Zygarde durante el combate real con Hoopa. `ctx.battleResult()` devuelve el historial `megaEvolutions` incluso después de volver a la forma inicial. Una Ball intentada antes de cumplir la condición no se consume ni gasta un turno. Debilitar a Hoopa sin Mega deja el anillo abierto y permite reintentar tras descansar. Debilitarlo con Mega sella la abertura con la Vasija; la captura sigue siendo opcional después de descansar. Una captura desatada se convierte en Hoopa contenido al sellar. La Vasija permanece en la Mochila.

Gael y sus dos seguidores caminan hasta el último anillo y se marchan. El nodo vuelve a la Red, el faro permanece encendido y el Oasis conserva el agua. Las derrotas curan en el lugar sin quitar dinero ni cambiar el punto de cura.

Pruebas: `node --test tests/b23*.test.mjs`, `node tools/e2e_b23.mjs`. El recorrido Chrome usa un banco aislado para el equipo y la entrada al DLC, y recorre después sus ocho mapas mediante teclas, puertas y ferris, con daño, victorias, derrotas y capturas del motor real. La partida continua de campaña usa un conductor separado, sin preajustes: `tools/e2e_campaign.mjs`.
