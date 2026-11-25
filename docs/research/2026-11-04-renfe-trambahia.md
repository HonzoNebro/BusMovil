# Viabilidad de Cercanías y Trambahía — 04/11/2026

Se han consultado directamente, sin autenticación:
- https://gtfsrt.renfe.com/vehicle_positions.json
- https://gtfsrt.renfe.com/trip_updates.json
- https://ssl.renfe.com/ftransit/Fichero_CER_FOMENTO/fomento_transit.zip

Documentación primaria:
- https://data.renfe.com/dataset/ubicacion-vehiculos (licencia CC BY 4.0; actualización cada 20 segundos).
- https://data.renfe.com/dataset/horarios-cercanias
- https://www.trambahia.es/es/Programacion_horarios_conexion_cercanias_Trambahia

## Prueba directa
Instantánea 04/11/2026 13:23:57 UTC (14:23:57 Europe/Madrid), timestamp de vehículos 13:23:51 UTC.
Se encontraron registros de vehículos de C1, C1a y T1 en la Bahía. Ejemplos:
- VP_T1-23437 / viaje 3107X23437T1: latitud 36.456284, longitud -6.2160234, parada 51464 (La Ardila); actualización hacia 51463 con demora 60 segundos.
- VP_T1-23440: ubicación en Pelagatos.
- VP_T1-23439: ubicación en Cádiz.
- VP_C1-35227: latitud 36.52884, longitud -6.288062, parada 51405 (Cádiz).
La existencia de T1 se comprobó en el propio feed; no se dedujo de una mención genérica de Cercanías.

Hay información operativa real, no solo horarios. Debe presentarse como posición publicada por Renfe con su timestamp; no prometer GPS continuo ni inventar movimiento entre actualizaciones. En la muestra de trip_updates se comunica una parada próxima por viaje: no asumir que todas las estaciones tienen una predicción directa.

## Recorridos
La lectura de trips/stop_times del GTFS confirma:
- C1: Cádiz ↔ Jerez de la Frontera, con algunos servicios hasta Aeropuerto de Jerez.
- C1: también circulaciones parciales Jerez ↔ Las Aletas.
- C1a: Las Aletas ↔ Universidad de Cádiz.
- T1: Cádiz ↔ Pelagatos y servicios parciales Río Arillo ↔ Pelagatos.
No basta con una única pareja de cabeceras por modo. Deben utilizarse los extremos reales de cada viaje.
El fichero contiene espacios sobrantes en cabeceras y algunos identificadores: se requiere normalizar espacios para enlazar correctamente tablas estáticas y tiempo real.

## Integración propuesta, aún no realizada
Extraer catálogo/recorridos del núcleo de Cádiz del GTFS oficial, consultar posiciones y actualizaciones directamente desde el móvil mientras la pantalla esté activa, atribuir a Renfe y distinguir datos actuales, desactualizados y horarios programados. Puede mantenerse la arquitectura sin servidor propio ni API comercial de mapas.
El prototipo debe verificar correspondencia de IDs, frescura, viajes parciales, calendario, disponibilidad de feeds, cache y comportamiento de batería/datos antes de incorporarlo a la app.
