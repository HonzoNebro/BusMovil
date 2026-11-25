# Primera integración ferroviaria — 04/11/2026

## Entrega
- Accesos de Cercanías y Trambahía en el inicio, manteniendo la selección del autobús.
- Cercanías C1 y C1a, Trambahía T1. 30 estaciones del núcleo y 3.772 viajes incluidos en el catálogo.
- Selector y búsqueda de estación; selección inicial por proximidad si existe una posición reciente. Se respeta la selección manual.
- Próximos trenes de la estación con destino real de cada viaje; se incluyen servicios parciales. Se excluyen los trenes que terminan en la estación consultada.
- Estimaciones directas de Renfe marcadas «En directo», resto de horarios «Horario programado». No se propagan retrasos a otras estaciones.
- Mapa Leaflet con recorridos reales, estaciones seleccionables y trenes; mantiene la instancia del mapa durante actualizaciones. Pop-ups con destino conocido y hora de la posición.
- Renovación de posiciones y actualizaciones cada 20 segundos, timeout de 15 segundos y cancelación al cerrar o pasar a segundo plano.
- Fallos parciales conservan la otra fuente y su fecha original. Los datos de llegadas fallidos o de más de 90 segundos no se presentan como estimaciones vigentes; las posiciones anteriores se atenúan.
- Textos incorporados en español, inglés, francés y portugués.
- Sin servidor propio ni API comercial de rutas.

## Validación
- TypeScript y ESLint PASS.
- Jest: 102 pruebas, 27 suites PASS.
- Cobertura nueva: calendario Madrid y caducidad, recorridos parciales, campus C1a, cancelaciones, paradas omitidas, ausencia de propagación de retrasos, IDs nuevos, validación de feeds, fallos parciales/totales, conservación de fecha, cancelación, segundo plano, selección de rama y vuelta al inicio.
- Seis pruebas JVM del lector NFC conservadas; testReleaseUnitTest y assembleRelease PASS.
- Contraste directo de los parsers con los feeds oficiales: 9 vehículos C1, 2 C1a y 4 T1, 15 actualizaciones; ambas fuentes recientes. Evidencia en LIVE.json.
- Revisión visual Android PENDIENTE por ausencia de /dev/kvm. No se ha instalado automáticamente en el teléfono ni se ha confirmado el comportamiento visual del WebView en Android.

## Límites de esta fase
El catálogo de horarios incorporado tiene vigencia del 04/11/2026 al 03/12/2026. Su actualización automática en el teléfono está pendiente; se incluye un generador reproducible para renovar el extracto antes de compilar. Al caducar se ocultan los horarios programados, conservando solo las estimaciones directas recientes disponibles.
Renfe informa de la posición publicada; no se inventa movimiento entre actualizaciones ni se garantiza que sea un GPS continuo. El feed de llegadas puede informar solo una próxima estación por tren. La integración no calcula conexiones ni tarifas ferroviarias y no añade favoritos de estaciones.

Fuentes:
- https://data.renfe.com/dataset/ubicacion-vehiculos
- https://data.renfe.com/dataset/horarios-cercanias
- https://gtfsrt.renfe.com/vehicle_positions.json
- https://gtfsrt.renfe.com/trip_updates.json
Licencia: Renfe Operadora, CC BY 4.0.
