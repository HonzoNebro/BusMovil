# Revisión del comportamiento — 4 de noviembre de 2026

## Decisión confirmada

Mantener siempre la proximidad geográfica. La consulta desde Madrid puede elegir la misma parada en sentidos distintos y no justifica modificar el algoritmo. No se cambia la selección ni se introduce una regla de cabeceras.

## Observaciones de partida y resolución

| Tema | Estado observado | Resolución de esta entrega / pendiente |
| --- | --- | --- |
| Distancia | La consulta de un sentido muestra acceso a pie/geográfico; la localización inicial usa otro bloque condicionado al origen GPS y muestra metros. | Aplicado: unidades m/km según idioma en la tarjeta GPS y el acceso del sentido. Pendiente verificar visualmente en teléfono. |
| Hora «Desde tu ubicación…» | Es la hora de la lectura GPS, no la de las llegadas. | Aplicado: se elimina la hora GPS de la ubicación precisa; se conserva en la aproximada con su aviso. |
| Ruta a pie lejana | A más de 5 km se omite la consulta; el mensaje no distingue omisión de fallo. | Aplicado: texto separado para ruta no calculada por distancia y ruta no disponible. |
| Cómo llegar a una parada | Existe para recargas, pero no está implementado en la ficha común de parada. No se ha eliminado una función previamente terminada. | Aplicado: botón Cómo llegar en la ficha común, con aplicaciones de mapas del teléfono y alternativa web. |
| Destino y sentido | El adaptador combina llegadas del proveedor con metadatos locales de recorridos compartidos. | Contrastar respuestas reales antes de asegurar la atribución de sentido en terminales. No hay fallo confirmado solo por el ejemplo de Madrid. |
| Parada escolar 9905 | No hay calendario escolar específico en el catálogo. | Documentar la disponibilidad oficial antes de automatizar su exclusión. |

La simplificación del texto de ubicación no puede eliminar el aviso de antigüedad de una lectura aproximada: se acordó aceptar hasta 15 minutos precisamente mostrando su fecha. El usuario aprobó Cómo llegar y el texto de ubicación; no se cambia la regla de proximidad.

## Inventario técnico para una futura limpieza

El [inventario de importaciones](datos/inventario-importaciones.json) es una comprobación estática, no una autorización de borrado ni una auditoría de seguridad.

- `src/components/RailMap/` dejó de formar parte del flujo actual tras adoptar planos estáticos.
- `src/services/mockApi.ts` no se importa en la aplicación actual.
- Las imágenes históricas de tablas en `src/assets/timetables/` no se referencian desde las tablas nativas. Un archivo sin uso en disco no implica que Metro lo incluya en el APK.
- Quedan formas de recorridos ferroviarios y código opcional de posiciones de vehículos, aunque la pantalla consulta solo predicciones.
- Archivos de tipos, variantes web, herramientas de pruebas y el proyecto iOS no deben clasificarse como residuos solo por no ser alcanzables desde Android.

El APK universal examinado ocupa 55.739.438 bytes; unos 48,3 MB comprimidos corresponden a bibliotecas de cuatro arquitecturas. El mayor ahorro de distribución vendría de AAB o paquetes por arquitectura, no de borrar unas imágenes sin uso. Este dato es una instantánea, no una promesa para la siguiente compilación.

Antes de publicación deben revisarse firma de depuración en release, tráfico HTTP permitido globalmente, permisos y navegación de WebView, carga de dependencias del mapa desde CDN y cancelación de trabajo en segundo plano. El sondeo ferroviario se limita al primer plano; el de autobuses no tiene la misma restricción. Ninguno de estos hallazgos constituye por sí solo una vulnerabilidad explotada demostrada.

## Evidencia y límites

Referencia de pruebas registrada antes de esta documentación: 109 pruebas JavaScript en 30 suites y 6 pruebas JVM de NFC, con TypeScript y ESLint correctos. Tras aprobarse los cambios de interfaz se han vuelto a ejecutar las comprobaciones y generado un APK actualizado; consultar la entrega de cambios. La ausencia de `/dev/kvm` impide afirmar una nueva comprobación visual en emulador en este entorno.

Los anexos de datos conservan el estado local actual, incluidas las coordenadas editadas. Para reconstruir se necesitan además el catálogo ferroviario, planos, icono y traducciones del repositorio; sus rutas se documentan en la especificación. El catálogo ferroviario caduca y necesita mantenimiento. Esta documentación permite definir el producto, pero no garantiza que una reescritura elimine automáticamente defectos o riesgos.
