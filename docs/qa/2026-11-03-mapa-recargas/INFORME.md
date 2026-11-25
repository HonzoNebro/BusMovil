# Mapa de recargas — 03/11/2026

## Comportamiento
- Sustituido el listado inicial por un mapa Leaflet con teselas OpenStreetMap, la misma tecnología del mapa de paradas.
- Redes urbana y Consorcio separadas. Buscar por nombre/calle filtra los puntos del mapa.
- Al tocar un marcador se abre una ficha superpuesta: establecimiento, dirección, horario si está publicado, distancia si hay ubicación disponible, Cómo llegar y cerrar.
- Cómo llegar entrega el destino al sistema mediante geo: en Android y maps: en iOS. Utiliza la aplicación instalada/preferida del usuario; si no existe manejador, intenta un enlace web normal a Maps. No se incorpora SDK de Google, API key ni servicio de rutas de pago.
- Se conservan la ubicación y la alternativa accesible «Elegir punto por nombre», útil también si falla la carga del mapa.
- De los 43 puntos urbanos, 14 tienen coordenadas verificadas y 29 solo dirección. Esos 29 no se dibujan en una posición inventada: se pueden localizar por nombre y abrir la dirección en la aplicación externa. Los 69 puntos del Consorcio conservan sus coordenadas.
- Las fichas de las paradas no se modifican en esta entrega.

## Validación
- TypeScript y ESLint PASS.
- Jest: 82 pruebas en 22 suites PASS. Incluye selección de marcador, rechazo de IDs desconocidos, apertura de aplicación externa, alternativa web, serialización HTML y conservación de puntos sin coordenadas fuera del mapa.
- testReleaseUnitTest: seis pruebas del lector NFC.
- assembleRelease: compilación release.
- Revisión visual Android: PENDIENTE. Se intentó abrir Medium_Phone_API_36.1 pero el emulador termina por ausencia de /dev/kvm. No se instaló ni manipuló el teléfono físico.
- La lectura NFC nfc-diag-3 permanece incluida. El usuario confirmó el funcionamiento con sus dos tarjetas; el importe aún no se ha contrastado con un saldo independiente conocido.

## Datos
Se conserva la procedencia de los listados y horarios descrita en docs/qa/2026-10-29-accesos/INFORME.md. No se añaden ubicaciones ni horarios por inferencia.
