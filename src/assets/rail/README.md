# Catálogo ferroviario de Cádiz
Origen: Renfe Operadora, https://data.renfe.com/dataset/horarios-cercanias
Recurso: https://ssl.renfe.com/ftransit/Fichero_CER_FOMENTO/fomento_transit.zip
Licencia: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/

catalog.json es un extracto transformado del núcleo de Cádiz (C1, C1a, T1), con espacios normalizados, horas expresadas en minutos y coordenadas redondeadas a seis decimales para los trazados. Conserva identificadores, calendarios, estaciones y extremos reales de los viajes.

Contiene fecha de importación, hash del ZIP original y vigencia. Se genera con:
npm run rail:catalog -- /ruta/fomento_transit.zip

La primera versión incluye el catálogo 04/11/2026–03/12/2026. No hay actualización automática del GTFS estático en el teléfono en esta fase. Si caduca, la aplicación deja de presentar horarios programados y mantiene únicamente estimaciones directas recientes, indicando cuando no conoce el destino. No se reinterpretan horarios caducados como actuales.
