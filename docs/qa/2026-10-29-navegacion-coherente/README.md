# Navegación simplificada y consulta interna — 29 de octubre de 2026

## Pantalla principal: Líneas y llegadas

Se eliminaron «Cambiar línea» y «Cambiar sentido»: los botones superiores seleccionan línea y reabren su selector de sentidos. Encima aparece «Líneas», sin repetir una cabecera con el número. El pie conserva solo la última actualización.

Hay un único botón de ubicación, con icono y texto, junto al acceso al mapa con formato equivalente y un icono de mapa. La tarjeta distingue selección inicial, sugerencia automática por proximidad, elección manual y elección en el mapa. Los avisos de ubicación aproximada conservan su fecha.

La vista reducida conserva sus tres paradas al abrir otra. Solo un acordeón permanece abierto. Al volver del recorrido completo, una parada seleccionada fuera de la ventana reducida queda visible. Otras líneas usan distintivos de color. La tarjeta principal indica «Llegadas a esta parada».

## Mapa y ficha

El menú conmuta «Todas/Ninguna»; se retiró el botón flotante de ocultar/mostrar. Se conserva el encuadre al filtrar.

La navegación superior usa destinos explícitos: desde el mapa «Líneas y llegadas» vuelve a la pantalla principal; desde la ficha «Mapa de paradas» vuelve al mapa. No hay un segundo botón de mapa dentro de la ficha ni un «Cerrar» ambiguo. Se retiró la sección «Líneas y sentidos» que sacaba de la ficha.

El minimapa de la ficha es fijo y no captura gestos. «Guardar» está junto al número y los distintivos de líneas. «Actualizar» incorpora un icono.

## Horarios y frecuencias

Ambos accesos abren una ventana interna con pestañas de frecuencias y primeras/últimas salidas, ampliación y desplazamiento de tablas. Vuelve a la ficha o al mapa de origen. Se incorporaron las tablas como imágenes locales del documento, sin su plano y sin abrir el navegador. La consulta no reemplaza las llegadas en vivo. No se añadió comprobación automática de nuevas ediciones.

Fuente: [Ayuntamiento de Cádiz, plano de líneas](https://institucional.cadiz.es/area/documento/plano-de-lineas). El PDF muestra vigencia desde mayo de 2023; la app indica esa fecha y la incorporación del 29 de octubre de 2026. Recortes y procedencia reproducible en `src/assets/timetables/README.md` desde la raíz del proyecto.

## Verificación

- TypeScript, ESLint y `git diff --check`: correctos.
- Jest: 46 pruebas en 12 suites, PASS. Incluye navegación manual mientras llega GPS, procedencia de selección, ventana reducida estable, acordeón único, retorno desde recorrido completo, Todas/Ninguna sin recarga, navegación jerárquica y consulta interna ampliable.
- APK release instalado en emulator-5554 sin Metro.
- Revisión nativa: Todas/Ninguna, consulta de las dos tablas desde el mapa y regreso al mapa; ficha 1118 → consulta → ficha → mapa → pantalla principal. PASS.
- Deslizamiento sobre el minimapa: desplaza la ficha y mantiene la posición del mapa. PASS visual en las capturas.
- Caso Marconi 1311 → Guadalete 1312: orden reducido conservado y acordeón anterior cerrado. Regresión automatizada y capturas en `../2026-10-29-navegacion-simple/`.

No se repitió la batería histórica completa de 25 escenarios nativos. Se conservan sus informes. La validación de esta entrega es Android emulado.

APK SHA-256: `91336608085daf5eb77fa2760c31f0d016124aa4f4a307a487bbbfd1ad6cc305`.
GPS periódico detenido al terminar. Favoritos existentes preservados.
