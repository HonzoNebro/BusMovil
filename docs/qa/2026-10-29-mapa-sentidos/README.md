# Mapa: sentidos y filtros — 29 de octubre de 2026

## Resultado

- Flechas orientadas según el orden de las paradas de cada sentido. Se separan las flechas opuestas cuando comparten tramo.
- Al tocar un recorrido o una flecha se identifica su línea y destino.
- La ficha de una parada detalla destino y siguiente parada por línea y sentido; identifica el final de recorrido.
- «Ver llegadas» conserva el sentido elegido, también en paradas compartidas por ambos sentidos.
- Filtros de selección múltiple y «Todas». Todas visibles por defecto; la selección se conserva al cerrar y reabrir el mapa durante la sesión.
- Filtrar actualiza recorridos, flechas y paradas sin recargar el WebView ni alterar el encuadre. Las actualizaciones de GPS tampoco recargan el mapa.

Los trazos siguen enlazando las coordenadas de las paradas configuradas. No se han modificado rutas ni horarios.

## Uso

Abrir «Ver mapa de paradas». Tocar los números para activar o desactivar líneas; «Todas» las restaura. Ampliar el mapa para distinguir tramos próximos y tocar una parada para consultar su destino y siguiente parada. «Ocultar paradas» conserva el filtro al volver a mostrarlas.

## Validación

- TypeScript, ESLint y `git diff --check`: correctos.
- Jest: 30 pruebas, 8 suites, PASS. Nuevas regresiones para orden y destino de la línea 1, filtrado combinado sin recarga, ejecución del JavaScript del WebView, eliminación de las capas al ocultar todas las líneas y selección de sentido desde la ficha.
- APK release compilado e instalado en emulator-5554 sin Metro.
- Seis comprobaciones nativas PASS: todas por defecto, solo línea 1, conservar filtro al reabrir, ninguna línea, restaurar todas y ocultar/mostrar.
- WebView inicialmente REVIEW en el automatismo. Resuelto por inspección de `zoom-1.png`: flechas y ficha «Línea 1 → Cortadura», siguiente «San José». No se contabilizó REVIEW como bug.

`results.json` conserva ambas capas de verificación. Repetir los controles nativos con `python3 scripts/map-qa.py`; después revisar visualmente las flechas y fichas con zoom cercano.

## Evidencias

- `todas.png`: todas las líneas y selector, tema oscuro.
- `solo-linea-1.png`: filtro de línea 1.
- `filtros-conservados.png`: filtro al volver a abrir.
- `sin-lineas.png`: estado sin selección.
- `paradas-ocultas.png`: ocultar paradas.
- `zoom-1.png`: flechas y destino de una parada.

## Entrega

APK SHA-256: `87e229139d78c7cf2b35059b8933eec2143e58e62eba5ef63c2a783497bb4c07`.
El APK está instalado en el emulador. Se detuvo el proceso de envío continuo de GPS para permitir usar Location → Set Location.

Validado en Android emulado. Se conservan los informes previos de Urbano y de las correcciones.
