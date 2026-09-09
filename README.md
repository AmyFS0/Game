# NEON RIFT

Shooter arcade futurista **endless** creado con HTML5 Canvas, CSS y JavaScript puro.

## Hangar principal

Antes de iniciar una partida puedes configurar:

- **Modo:** Solo Run o Local Co-op para 2 jugadores.
- **Piloto del jugador 1 y jugador 2.**
- **Dimensión inicial.**
- **Nivel inicial del 1 al 10.**
- **Dificultad:** Cadet, Normal o Rift.
- **Volumen de música y efectos.**
- Consulta de controles desde el mismo menú.

### Pilotos

- **Nova:** equilibrada.
- **Byte:** más vida y potencia.
- **Flux:** máxima velocidad.
- **Echo:** disparos de alto daño.

## Música galáctica

El juego incluye un **Galactic Synth Engine** hecho con Web Audio API. La banda sonora se genera de forma procedural en el navegador con drones espaciales, arpegios y sintetizadores, por lo que no necesita archivos de música externos.

Por las restricciones de autoplay de los navegadores, el audio comienza después de una interacción del usuario. La música se activa al pulsar **LAUNCH INTO THE RIFT** o el botón **MUSIC ON**.

## Combate automático

Las naves ahora tienen **AUTO FIRE permanente**. Mientras una nave esté viva, dispara continuamente y apunta automáticamente al alien más cercano que se encuentre delante de ella. Ya no es necesario mantener una tecla para disparar.

El daño del jugador también aumenta ligeramente conforme suben los niveles para que el combate siga siendo viable frente a enemigos cada vez más resistentes.

## Power Ups y Power Downs

Durante la carrera aparecen objetos flotantes:

- **BOOST verde:** aumenta la velocidad de movimiento de la nave un 58% durante 7 segundos.
- **SLOW rojo:** reduce la velocidad de movimiento un 42% durante 5 segundos.
- El efecto activo y su tiempo restante se muestran encima de la nave.
- Algunos aliens también pueden soltar objetos al ser eliminados.

## Dificultad progresiva

Cada vez que atraviesas un portal y subes de nivel, la amenaza aumenta automáticamente:

- Los aliens ganan más vida.
- Hacen más daño.
- Se mueven más rápido.
- Aparecen con mayor frecuencia.
- Sus disparos tienen menor tiempo de espera.
- A partir de niveles altos pueden aparecer varios aliens casi al mismo tiempo.
- Se desbloquean nuevas variantes de enemigos.
- Cada 3 niveles puede aparecer el jefe **Rift Behemoth**.
- La velocidad general del recorrido también aumenta poco a poco.

En la esquina inferior del juego aparece un indicador **THREAT LV.** con información sobre el escalado actual.

## Endless Multiverse

- El escenario avanza infinitamente hacia la derecha.
- Aparecen portales multidimensionales durante la carrera.
- Cada portal aumenta el nivel y cambia la dimensión.
- Dimensiones: Neon City, Crystal Void, Cyber Jungle, Solar Grave y The Rift.
- Las naves pueden ser destruidas.
- En cooperativo, una nave destruida puede reconstruirse al alcanzar el siguiente portal si el compañero sigue con vida.
- Los impactos alienígenas usan salpicaduras de plasma neón estilizadas y partículas.

## Controles

### Player 1

- `W A S D`: mover nave
- Disparo: **automático**
- `G`: Rift Pulse cuando está cargado

### Player 2

- `Flechas`: mover nave
- Disparo: **automático**
- `Shift`: Rift Pulse cuando está cargado

### General

- `P`: pausa

## Cómo ejecutar

1. Abre el repositorio en VS Code.
2. Abre `index.html` con Live Server o directamente en un navegador moderno.
3. Configura la expedición en el hangar.
4. Pulsa **LAUNCH INTO THE RIFT**.

## Tecnología

- HTML5 Canvas
- CSS
- JavaScript
- Web Audio API

No requiere motor de juego, librerías externas de gameplay ni archivos de audio.