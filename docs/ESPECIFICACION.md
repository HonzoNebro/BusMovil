# Transportes Cádiz — especificación funcional

Versión de referencia: 4 de noviembre de 2026. Plataforma de aceptación: Android. Este documento describe las decisiones vigentes; las propuestas pendientes se separan en [la revisión actual](especificacion/REVISION_ACTUAL.md). No certifica que el código esté libre de defectos ni sustituye una auditoría de seguridad.

## Identidad y alcance

Nombre visible: **Transportes Cádiz**. Identificador Android: `app.transportescadiz`. Aplicación React Native CLI, sin Expo ni servidor propio. Incluye autobuses urbanos, Cercanías C1/C1a y Trambahía T1, favoritos, información oficial, recargas y consulta NFC de saldo. No incluye noticias, meteorología, venta de billetes, recargas mediante pago ni escritura de tarjetas.

El registro interno `BusMovil` puede conservarse mientras coincida entre JavaScript y Android: no es el nombre público. Cambiar el identificador de paquete crea una aplicación distinta; no migra automáticamente los datos de la antigua.

## Selección de parada y ubicación

1. Al abrir la aplicación se intenta obtener la ubicación y sugerir la parada física más cercana.
2. La selección inicial respeta las líneas y sentidos que sirven esa parada. Una parada compartida presenta sus servicios; no se inventan servicios de otras paradas cercanas.
3. Al elegir manualmente una línea y un sentido se selecciona una parada de ese recorrido mediante proximidad a la ubicación disponible.
4. **Se mantiene la proximidad geográfica incluso fuera de Cádiz.** No se sustituye por la primera parada, una cabecera predeterminada o el extremo contrario. La prueba desde Madrid no constituye un fallo por seleccionar Plaza España.
5. Una actualización de llegadas conserva la selección. Localizarse otra vez o seleccionar una parada genera una solicitud explícita de enfoque, consumida una sola vez; navegar manualmente cancela las solicitudes pendientes.

Android distingue permisos preciso y aproximado. La lectura precisa debe ser nueva; la aproximada puede tener hasta 15 minutos, con su fecha y un aviso explícito de limitación. La espera máxima es de 15 segundos; los observadores se liberan al terminar, fallar, cancelar o desmontar. Denegación, bloqueo y GPS apagado tienen mensajes distintos. La aceptación del proveedor en dispositivos físicos requiere pruebas físicas.

Para seleccionar dentro de un sentido, la implementación actual compara las tres paradas más cercanas en línea recta y solicita una matriz de recorridos a pie. Más allá de 5 km no solicita esos recorridos y usa distancia geográfica. Una ruta no disponible conserva esa alternativa. No hay una regla aprobada para excluir terminales ni un calendario escolar específico para la parada 9905.

Una parada física se identifica por su número, no por su nombre. Una llamada de recorrido une parada, línea, sentido y posición en la secuencia. No debe asumirse que todos los identificadores tienen exactamente un sentido: hay cabeceras compartidas en el catálogo. El destino real de una llegada no debe confundirse con metadatos del recorrido local.

## Autobuses y actualizaciones

Líneas: 1, 2, 3, 5 y 7. Catálogo y coordenadas: [autobuses.json](especificacion/datos/autobuses.json). Conservar los ajustes locales de coordenadas. Las llegadas se obtienen de `http://77.224.241.76/urbanos/Presenter.aspx?query=lcdentries&busstop=ID&lang=es-ES`.

Cada consulta tiene un límite de 15 segundos y cancelación. Una respuesta válida vacía significa ausencia de llegadas. Un error no equivale a una respuesta vacía:

- Fallo total: conservar la última información válida y su fecha original.
- Fallo parcial: actualizar las paradas correctas y conservar las fallidas con sus fechas originales.
- Datos conservados: marcar desactualización y no mostrar una cuenta atrás como vigente.
- Actualización automática cada minuto, además de actualización manual y gesto de arrastre. El indicador interactivo pasa a naranja ante fallo y permite reintentar; el siguiente intento automático no exige intervención.

El proveedor utiliza `iMinHastaPaso`, `iIdLinea` y `sParadaDestino`; `>>` indica llegada inmediata. Rechazar HTML y respuestas inválidas. No presentar como nuevas las estimaciones antiguas. La prioridad estable de líneas es 1, 2, 3, 5, 7; los tiempos deben distinguirse de esta ordenación.

## Pantalla principal y paradas

La pantalla identifica claramente **Autobuses urbanos**. Contiene búsqueda por nombre o número en todas las líneas, **Tus paradas favoritas**, parada seleccionada con guardar y actualizar ubicación, selector de líneas, selector de sentido y llegadas. El encabezado de las llegadas expresa «Sentido …» sin repetir innecesariamente la insignia de línea.

La ruta reducida muestra la parada seleccionada. Al expandir, mantenerla visible mediante desplazamiento tras el cálculo del layout. Un solo contenedor principal de desplazamiento y una sola parada expandida evitan selecciones ocultas. Una flecha larga y estrecha a la izquierda recorre verticalmente la lista. No desplazar de nuevo en cada actualización.

La barra principal ofrece Saldo, Mapa, Otros transportes e Información y opciones. No duplicar «Cambiar línea» ni un segundo botón de ubicación en el encabezado.

Los favoritos persisten identificadores válidos y únicos en el teléfono, sin guardar ubicación ni saldo. La búsqueda, el mapa y los favoritos abren el mismo detalle de parada: nombre, número, líneas, botón de guardar, minimapa fijo y llegadas con actualización. El detalle permite volver al mapa sin cerrar toda la consulta e incluye Cómo llegar cuando hay coordenadas, delegando en mapas del teléfono con alternativa web. La ubicación precisa no muestra una hora GPS redundante; la aproximada conserva fecha y aviso. Distancias en metros o kilómetros según magnitud e idioma.

## Mapa de autobuses

Filtros visibles permanentemente: «Líneas visibles», botón Todas/Ninguna y botones de líneas. Todos tienen apariencia interactiva y esquinas redondeadas coherentes. No incluir en ese filtro horarios ni favoritos.

Recorridos sólidos hacia Plaza España y discontinuos de vuelta; en la línea 7 se distinguen Glorieta Ana Orantes y Simón Bolívar. Sin flechas de sentido ni leyenda adicional. Los marcadores agrupan paradas físicas por nivel de zoom: lejos, grupos numerados; cerca, paradas individuales. Pulsar un grupo centra el mapa, sin hacer zoom ni mostrar un detalle de parada. Pulsar una parada individual abre su ficha. No contar varias veces una parada por servir distintas líneas.

## Información y recargas

Información y opciones contiene tarifas, puntos de recarga, frecuencias, primeras y últimas salidas e idioma. Horarios en tablas nativas, manteniendo la estética de la aplicación; se indica vigencia documental, fecha de incorporación y enlace al original, advirtiendo que está en español. Las frecuencias no ocupan permanentemente la pantalla de llegadas. Datos de referencia: [horarios-autobus.json](especificacion/datos/horarios-autobus.json).

Recargas: mapa principal con establecimientos urbanos y del Consorcio simultáneamente, símbolos distintos, búsqueda por calle o establecimiento. Sin selector de red, botón Cerca de mí ni listado alternativo. No suponer que un comercio admite ambas tarjetas. La ficha es un popup dentro del mapa con nombre, dirección, horario conocido, Cómo llegar y cerrar; tocar fuera lo cierra. No inventar horarios ni coordenadas: informar de registros sin localizar. Datos: [recargas.json](especificacion/datos/recargas.json).

Cómo llegar delega en aplicaciones de mapas del teléfono mediante enlaces, con alternativa web. No requiere una API comercial de rutas de esta aplicación.

## Cercanías y tranvía

Una única entrada «Otros transportes» abre Cercanías y tranvía. Selectores C1, C1a y T1; sin Todas. La selección filtra estaciones y conserva la estación si pertenece a la nueva línea. No asumir que todos los servicios recorren el trayecto completo.

Horarios estáticos: GTFS oficial Renfe, importado con `scripts/import-rail.py`; catálogo en `src/assets/rail/catalog.json`. Interpretar calendario, excepciones, horas posteriores a medianoche y zona Europe/Madrid. El catálogo actual cubre del 4 de noviembre al 3 de diciembre de 2026: necesita renovación y no debe presentar horarios caducados como válidos.

Predicciones: `https://gtfsrt.renfe.com/trip_updates.json`, consulta cada 20 segundos en primer plano, límite de 15 segundos. Solo tratar como directo una actualización reciente de la estación concreta; no propagar retrasos a estaciones sin predicción. Umbral de frescura: 90 segundos. Excluir servicios cancelados, paradas omitidas y servicios que terminan en la estación consultada. Distinguir previsto de directo y conservar fechas reales. La interfaz actual no muestra posiciones de vehículos.

Planos oficiales estáticos en `src/assets/rail/plans/`, con créditos y enlace al documento. Se amplían mediante dos dedos y se desplazan con uno; ajustar restaura el encuadre, también tras cambiar orientación. Sin botones obligatorios de más/menos.

## Saldo NFC

Lectura únicamente con aplicación activa y teléfono desbloqueado; sin disparadores automáticos desde bloqueo o segundo plano. Lectura sin escritura, sin envío de bloques, UID, claves o saldo a servidores. El usuario debe descubrir la función mediante el botón Saldo; una lectura válida abre su resultado. Instrucciones breves, precio de referencia y vigencia claramente diferenciados del saldo leído.

Perfiles y validaciones: [perfiles-nfc.json](especificacion/datos/perfiles-nfc.json). Bonobús urbano: identidad en sector 0 y saldo en sector 4; Consorcio: perfil separado. Confirmar lecturas consistentes, limitar la espera a 8 segundos y liberar recursos al salir. Un fallo de autenticación del saldo urbano no debe interpretarse como otro tipo de tarjeta. Diagnóstico compartido solo por acción explícita, sin contenido de tarjeta ni claves. El UID puede utilizarse transitoriamente para evitar repeticiones, nunca persistirse.

Dos tarjetas urbanas han sido confirmadas como legibles por el usuario. No extender esa validación a todas las tarjetas ni al perfil Consorcio sin prueba específica.

## Diseño, idiomas y accesibilidad

Estilo Urbano, claro/oscuro según sistema. Colores de líneas: 1 `#C21C34`, 2 `#D69638`, 3 `#2D4491`, 5 `#8C481D`, 7 `#0F766E`. Botones reconocibles, radio habitual 12 y objetivos táctiles de al menos 44–48 puntos. Etiquetas accesibles y estados que no dependan solo del color. Comprobar horizontal y fuente al 150 %.

Idiomas: español, inglés, francés y portugués; preferencia persistente y selección inicial según teléfono. Traducir tablas, días, estados, fechas y mensajes dinámicos. Nombres oficiales de calles, paradas y destinos se conservan. No afirmar que un documento externo está traducido.

## Reconstrucción y requisitos técnicos

Separar catálogo, acceso a proveedores, estado de selección, reglas de dominio y presentación. Conservar datos y decisiones, no copiar componentes obsoletos como requisito. Las dependencias pueden sustituirse por equivalentes mantenidos si preservan el comportamiento verificable.

No hay servidor propio ni suscripción de API necesaria en el diseño actual; esto no garantiza disponibilidad perpetua ni uso ilimitado de servicios ajenos. Respetar atribución y condiciones de mapas, GTFS y documentos. Las coordenadas enviadas al proveedor de rutas a pie deben describirse en privacidad.

Antes de publicar: firma de producción privada, permisos mínimos, restricciones de navegación/mensajes de WebView, revisar uso de HTTP del proveedor de autobuses y limitar excepciones de tráfico sin cifrar. Nunca convertir una clave fija de compatibilidad NFC en un supuesto secreto protegido dentro del APK. No incluir diagnósticos privados en registros.

La entrega Android debe poder compilarse reproduciblemente. No conservar firma de depuración como configuración de producción. Preferir AAB o APK por arquitectura para distribución; distinguir tamaño del repositorio y tamaño realmente empaquetado. iOS y web requieren validación propia y no se consideran cubiertos por la aceptación Android.

## Criterios de aceptación

- Ubicación nueva precisa y aproximada con fecha; permisos denegados/bloqueados y observadores liberados.
- Selección por proximidad inicial y por sentido, incluyendo consulta lejana; refrescar no cambia la elección manual.
- Cinco ciclos GPS Plaza España → hospital → Plaza España, sin repetir el botón para estabilizar.
- Red correcta, vacía, parcialmente fallida, totalmente fallida y timeout; marcas temporales y avisos correctos.
- Expandir recorrido conserva visible la parada, también la última, en horizontal y con fuente al 150 %.
- Filtros, agrupación, favoritos, búsqueda, navegación de fichas y cierre exterior de popup.
- Tablas e idiomas completos; GTFS caducado, medianoche, cancelaciones y predicciones antiguas.
- Zoom con dedos y cambio de orientación en ambos planos.
- NFC físico: lectura consistente y aislamiento al pasar a segundo plano; diagnóstico sin datos de tarjeta.

Mantener REVIEW cuando una herramienta no pueda verificar un WebView; resolver mediante captura, sin contarlo automáticamente como defecto. No declarar pruebas físicas o visuales que no se hayan ejecutado.
