# Mapa agrupado, ficha y favoritos — 29 de octubre de 2026

## Comportamiento entregado

Se retiraron las flechas. En las líneas 1, 2, 3 y 5, el sentido hacia Plaza España usa trazo continuo y la vuelta trazo discontinuo. La leyenda del menú identifica expresamente los dos destinos de cada línea, incluida la línea 7.

Las paradas se agrupan en celdas geográficas según el zoom. Cada número cuenta identificadores de parada distintos, no líneas ni servicios. La configuración actual contiene 124 paradas con coordenadas; no se ha forzado el 127 de la aplicación de referencia. A gran distancia se dibuja un grupo; al acercarse se subdivide y finalmente se muestran paradas individuales. Tocar un grupo centra su posición sin cambiar el zoom ni abrir información de una parada. Hay controles explícitos +/− además de los gestos del mapa.

Al tocar una parada individual se abre una ficha nativa desplazable: nombre, número, líneas, minimapa con marcador, próximas llegadas reales, actualización manual y acceso al recorrido por sentido. Al volver se conserva el encuadre. Atrás de Android vuelve primero al mapa y luego permite cerrar el modal.

Los favoritos se guardan localmente mediante AsyncStorage y se recuperan tras cerrar la app. Se pueden quitar desde la ficha y abrir desde el menú. Los fallos de lectura/escritura se indican; no se afirma que un favorito se guardó si falló la persistencia. No se guardan llegadas offline persistentes.

El menú reúne filtros, leyenda, favoritos y «Plano y frecuencias oficiales». El plano se abre como consulta secundaria. Las frecuencias no se muestran permanentemente ni se convierten en estimaciones en vivo.

Fuente revisada: [Plano de líneas del Ayuntamiento de Cádiz](https://institucional.cadiz.es/area/documento/plano-de-lineas). El documento enlazado está rotulado como vigente desde 1 de mayo de 2023; se revisó la página completa y su tabla, sin sustituir horarios ni rutas de la app.

## Validación

- TypeScript, ESLint y `git diff --check`: correctos.
- Jest: 40 pruebas, 11 suites, PASS. Incluye agrupación, recuentos, sentidos, filtrado sin recarga, ficha histórica y respuesta vacía, favoritos persistentes/errores y Atrás de Android.
- APK release compilado e instalado en emulator-5554 sin Metro.
- `python3 scripts/map-qa.py`: seis controles nativos PASS (filtros, persistencia durante sesión, ninguna/todas las líneas y ocultar/mostrar).
- `python3 scripts/cluster-qa.py`: grupo lejano de 124, selección del grupo sin abrir ficha y subdivisión al ampliar: PASS.
- Prueba nativa de ficha, guardar favorito, reiniciar app, abrir favorito desde menú y volver con Atrás: PASS. Favorito de prueba: parada 1106; se elimina al finalizar.
- Los REVIEW del contenido WebView se resolvieron mediante las capturas citadas en los JSON. No se contaron automáticamente como bugs.

Se detectó y corrigió durante la revisión un fallo de serialización del agrupador: Hermes no conserva el código fuente de una función en `toString()`. El WebView recibe ahora una función literal, ejecutada también en los tests. Se repitió la comprobación sobre el APK corregido.

La comparación de capturas comprueba la reducción de marcadores dibujados a distancia. No se ha medido una mejora de FPS o consumo de batería. Validación limitada a Android emulado.

## Evidencias principales

- `grupos-iniciales.png`: vista general agrupada.
- `grupo-ciudad.png`, `grupo-centrado.png`: grupo único y centrado sin zoom.
- `subdivision-grupos.png`, `paradas-cercanas.png`: subdivisión y paradas individuales.
- `ficha-cargada.png`: minimapa y llegadas reales.
- `favorita-guardada.png`, `favorito-tras-reiniciar.png`: guardado y recuperación.
- `menu-favoritos.png`: favorito y plano oficial como consulta secundaria.
- `volver-al-mapa.png`: encuadre conservado.

## Entrega y siguiente fase

APK SHA-256: `cbe46dcc881c19ede24f9b139afe47ec9090f71a610b382c521109b89ed8aa57`.
GPS periódico detenido; se puede utilizar Location → Set Location. Se conservan los informes anteriores.

Quedan para la segunda fase acordada: puntos de recarga, tarifas, saldo de la tarjeta física (requiere investigar tecnología/acceso del operador y comprobar hardware), noticias y tiempo de Cádiz. No se añadieron pantallas con datos simulados de estas funciones.
