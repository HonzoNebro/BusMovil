# Selección automática de parada por línea y sentido

- Inicio: se mantiene la localización automática de la parada física más próxima.
- Elegir línea y sentido selecciona una parada del recorrido desde la posición real del usuario. Se elimina el estado «no pasa por», la lista alternativa y cualquier confirmación de sugerencia.
- Se comparan las tres candidatas cercanas mediante matriz peatonal Valhalla/OSM. Se muestra la mejor por tiempo entre esas candidatas; ante fallo/timeout se elige la más cercana en línea recta, identificándolo.
- Las búsquedas se cancelan al navegar y al desmontar. Actualizar llegadas no repite el cálculo.

## Verificación

`npm run typecheck`, `npm run lint`: PASS. Jest: **61 pruebas, 14 suites PASS**.
Regresiones: 1101 → línea 3 → Puntales elige 1301; navegación durante petición; matriz peatonal y caché; errores/parcial; cancelación; antigüedad de posición aproximada/precisa.

APK release compilado correctamente. Instalado exclusivamente en emulator-5554.
Caso nativo confirmado: inicio 1101 → línea 3 → Puntales → **1301 Plaza España**, automáticamente, sin mensajes «no pasa por». Servicio peatonal real: **33 m, menos de un minuto**. Captura inspeccionada visualmente: ficha, sentido, origen de selección y barra inferior visibles.

Resultados adicionales en results.json. Se conserva la referencia previa en ../2026-10-29-barra-y-actualizacion/ y los demás informes anteriores. Esta entrega no repite los 25 escenarios históricos ni constituye validación GPS en teléfono físico.

## Servicio peatonal

Servidor público para el prototipo: https://valhalla1.openstreetmap.de. Se envían origen y tres destinos; caché en memoria 2 minutos, como máximo una petición por segundo y timeout de 8 segundos. Atribución y enlace a corrección de mapa en la ficha. Para distribución amplia, acordar uso o configurar un proveedor/servidor propio según https://routing.openstreetmap.de/about.html. No se ha contactado al proveedor ni publicado la aplicación.

Prueba nativa sin red: PASS. Tras obtener ubicación reciente, elegir línea 3 → Plaza España selecciona 1301 y muestra «26 m en línea recta · ruta a pie no disponible». Llegadas conservadas como datos anteriores, estado naranja. Primer intento interrumpido por el diálogo de Android sobre Wi-Fi scanning; cerrado con «No thanks» y prueba repetida con posición reciente. Red restaurada y proceso GPS periódico detenido para permitir Location → Set Location.

SHA-256 APK: `69a90795be8cd502123e94a36124f1bdf1376cb1c76600e6faf5efd21d6e72cc`.
