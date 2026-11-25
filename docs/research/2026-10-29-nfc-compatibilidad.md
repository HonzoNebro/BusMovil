# Investigación de compatibilidad NFC de BusMovil

Fecha de consulta: 29 de octubre de 2026. Investigación de documentación y código público; no implica validación de las tarjetas físicas del usuario.

## Resultado vigente

La búsqueda ampliada solicitada por el usuario **sí encontró una referencia utilizable**: una candidata publicada expresamente para Bonobus, Cadiz, cuya huella coincide con la identificación de Metrodroid. Se ha implementado el perfil urbano y generado un APK nfc-diag-2. Pasan 74 pruebas Jest y seis pruebas JVM. La prueba física posterior valida la autenticación de identidad del sector 0, pero rechaza el acceso al sector 4 del saldo en ambos teléfonos. El importe sigue sin poder leerse; véase la última sección. El detalle del hallazgo y las fuentes están en la última sección; la consulta al operador sigue sin enviar.

## Resultado inicial (superado por la ampliación descrita al final)

No se ha encontrado una corrección documentada de la autenticación CTAN actual. Sí se ha confirmado una distinción relevante: hay un parser CTAN de ámbito andaluz y otro formato para el bonobús urbano de Cádiz. Los dos pueden presentarse como MIFARE Classic, por lo que los informes de tecnología NFC no identifican el emisor ni el abono.

La clave CTAN de lectura del sector 9 que utiliza BusMovil coincide byte a byte con las dos referencias públicas consultadas. Cambiar la dirección del bloque de saldo o su escala monetaria no resolvería AUTH_REJECTED: la app aún no ha conseguido leer ese bloque.

## Evidencia aportada por el usuario

- POCO F3 / Android 13: Classic 1 KB, 16 sectores, NfcA y MifareClassic; conexión correcta; autenticación rechazada en 26 ms.
- Mi MIX 2 / ROM personalizada Android 15, con otra tarjeta: la misma tecnología y resultado; 19 ms.
- Dos tarjetas fallan también con otras aplicaciones, según pruebas del usuario.

Conclusiones: hay detección y establecimiento de conexión; no es un timeout ni un error al calcular el saldo. AUTH_REJECTED significa que authenticateSectorWithKeyA devolvió false. No prueba tarjeta averiada, caducada, falta de actualización, pertenencia a CTAN, generación concreta del chip o claves diversificadas. Un fallo de intercambio durante la autenticación tampoco queda descartado solamente con ese booleano. La lectura de otras tarjetas de Madrid no valida todos los protocolos de transporte.

## Fuentes de código contrastadas

| Fuente original | Perfil observado | Comparación con BusMovil |
| --- | --- | --- |
| SAND, NfcManager.kt | authenticateSectorWithKeyA(9), clave pública CTAN de lectura, readBlock(37); saldo /200 | Misma secuencia básica y parámetros; no se detecta error de orden de bytes de la clave |
| RogueMaster, andalucia.c | Verifica sector 9 con clave A; saldo en 9*4+1 y escala /200 | Confirma sector, tipo de autenticación y posición del saldo CTAN |
| Metrodroid, BonobusTransitFactory.kt | Perfil «Bonobús», Cádiz; keyBundle cadiz; keysRequired=true | Es un perfil diferente; no se debe identificar a partir de tamaño/SAK/ATQA |
| Metrodroid, BonobusTransitData.kt | Saldo urbano en sector 4, bloque relativo 0 (absoluto 16); balance expresado en céntimos | No equivale al perfil CTAN sector 9, bloque 37 |
| Metrodroid, documentación de claves | No incluye claves específicas de operadores, incluso cuando conoce el formato | Tener el parser no proporciona la autenticación necesaria |

Referencias:
- https://github.com/CrIsTiAnPvP/SaldoAndalucia-app/blob/master/app/src/main/java/com/jpm/transporttool/nfc/NfcManager.kt
- https://github.com/RogueMaster/flipperzero-firmware-wPlugins/blob/420/applications/main/nfc/plugins/supported_cards/andalucia.c
- https://github.com/metrodroid/metrodroid/blob/master/src/commonMain/kotlin/au/id/micolous/metrodroid/transit/bonobus/BonobusTransitFactory.kt
- https://github.com/metrodroid/metrodroid/blob/master/src/commonMain/kotlin/au/id/micolous/metrodroid/transit/bonobus/BonobusTransitData.kt
- https://github.com/metrodroid/metrodroid/wiki/Cracking-keys

Se ha leído la descripción y comparado parámetros; no se ha incorporado código ajeno, material de escritura o mecanismos de extracción de claves. La ficha README de FareBot también enumera Bonobus/Cadiz como Classic con claves requeridas: https://github.com/codebutler/farebot.

El repositorio público alberto05su/buscadiz encontrado por nombre solo contiene un index.html. No aporta un lector verificable ni prueba que pertenezca a la aplicación instalada por el usuario. No se ha atribuido a su autor ni se ha utilizado como evidencia de implementación.

## Migración de tarjetas: lo confirmado y lo que no

La Junta anunció el 28-08-2017 una migración desde MIFARE Classic 1 KB a DESFire EV2 4 KB, con coexistencia de tarjetas y sustitución progresiva al recargar. Esto confirma que existió un proyecto de renovación, pero no que la tarjeta concreta necesite actualizarse ni el estado de despliegue en 2026:
https://www.juntadeandalucia.es/fomentoyvivienda/portal-web/web/servicios/proyectosIDi/noticias/1d37b573-8bde-11e7-aeab-4d2f42dacbec

Los informes recibidos anuncian la interfaz Classic 1 KB y no IsoDep. No identifican directamente el modelo físico del chip, pero tampoco proporcionan evidencia para seleccionar un lector DESFire. Implementar ese protocolo solo por el anuncio histórico no sería una corrección justificada.

Se revisó además una presentación de la Red de Consorcios (diapositiva 12: estructura y tecnología Classic 1 KB, migración en proyecto) y el TFG de Álvaro Galdón Rus, Universidad de Sevilla, fechado en 2020. Son referencias históricas; las fechas recientes del índice web no son fechas de especificaciones nuevas. El TFG contiene una auditoría, no una especificación oficial del saldo de las tarjetas del usuario. Ninguna de estas fuentes confirma sus claves actuales.

Presentación: https://observatoriomovilidad.es/wp-content/uploads/2021/09/XIV_21_tarjeta_cta.pdf
TFG: https://ereding.etsi.us.es/bibing/proyectos/abreproy/93309/fichero/TFG-3309+GALD%C3%93N+RUS,+%C3%81LVARO.pdf

El operador urbano publica por separado el bonobús ordinario y las tarifas de la tarjeta del Consorcio. Esto respalda la distinción comercial, no identifica automáticamente qué tarjeta posee el usuario:
- https://tranviadecadizasanfernandoycarraca.es/tarifas
- https://tranviadecadizasanfernandoycarraca.es/tarifas-3

## Decisión de implementación

No cambiar claves, tipo de autenticación, sector o escala sin una referencia verificable del perfil. No implementar un parser del bonobús urbano que intente interpretar bytes CTAN. No ampliar acceso o pedir volcados de tarjeta para averiguar el saldo a partir de datos no autenticados.

Mantener NFC como prototipo pendiente de compatibilidad. Los diagnósticos ya permiten contrastar una futura corrección; no hace falta repetir las mismas pruebas con los mismos parámetros ni compilar un APK idéntico.

## Siguiente dependencia concreta

Identificar el título/emisor real por la denominación impresa o documentación de adquisición, sin número ni UID, y obtener del emisor la vía documentada de consulta local de saldo (SDK, acceso de lectura para terceros, condiciones de integración o servicio oficial). El usuario lo ha descrito como tarjeta del Consorcio; no se sustituye ese dato por una suposición basada en el color, el lugar donde se usa o su chip.

Está preparada una consulta técnica en 2026-10-29-consulta-nfc-operador.md. No se ha enviado: la petición actual autoriza investigación, no mensajes a terceros. Si se confirma un acceso público/autorizado compatible, implementar un perfil explícito, conservar validación estructural y comparar el importe con un saldo conocido. Si la especificación o credencial es privada y no se proporciona, no puede garantizarse una lectura local universal.

## Actualización: identificación impresa aportada por el usuario

El usuario confirma logo de Tranvía de Cádiz a San Fernando y Carraca, S.A., Ayuntamiento de Cádiz y referencia http://77.224.241.76/urbanos/. Esa web se ha leído y enlaza al sitio del operador urbano; su texto la presenta como portal de tiempos de llegada de los autobuses urbanos de Cádiz. Esta evidencia sitúa la investigación en el bonobús urbano, no justifica seguir suponiendo el perfil CTAN solamente por el chip.

Se ha verificado el canal oficial del operador: administracion@tranviacadiz.com, publicado en https://tranviadecadizasanfernandoycarraca.es/puntos-de-informacion-y-atencion-al-usuario. Consulta específica preparada en 2026-10-29-consulta-nfc-bonobus-urbano.md, sin envío. El borrador anterior al Consorcio se conserva como referencia del estado previo de la investigación, pero no es el destinatario propuesto con esta nueva evidencia.

No se ha localizado un acceso de lectura publicado y verificable para implementar el perfil urbano del usuario. Metrodroid documenta su estructura y requiere claves que no distribuye; conocer el sector del saldo no resuelve por sí solo la autenticación. La modificación funcional sigue pendiente de disponer de un acceso compatible. No se ha cambiado el algoritmo ni generado otro APK con la misma limitación.

## Búsqueda ampliada solicitada por el usuario: resultado que desbloquea el código

Esta fase reemplaza la conclusión anterior de que no se había localizado material de acceso público para el perfil urbano.

Se revisaron el portal http://77.224.241.76/urbanos/, sus referencias a scripts públicos, la búsqueda de la web del operador y sus sitemaps (10 noticias y 34 páginas publicadas), las páginas de uso/reglamentación, BusCádiz/Google Play y el sitio de su desarrollador; además del código, incidencias y propuestas originales de Metrodroid/FareBot y búsqueda global de código en GitHub. No se enviaron formularios ni mensajes a terceros, no se probaron rutas privadas y no se instalaron herramientas de extracción de claves.

La búsqueda de código enlazó el diccionario original de Proxmark3. Contiene una entrada explícita para Bonobus, Cadiz. Se contrastó esa única candidata publicada con el algoritmo de huella y el identificador de Metrodroid y **coincide exactamente**. Esto aporta una referencia verificable que la primera búsqueda en los parsers no proporcionó: Metrodroid no distribuye claves, pero otra fuente pública sí documenta una candidata para ese mismo perfil.

- Entrada: https://github.com/RfidResearchGroup/proxmark3/blob/master/client/dictionaries/mfc_default_keys.dic
- Identificación: https://github.com/metrodroid/metrodroid/blob/master/src/commonMain/kotlin/au/id/micolous/metrodroid/transit/bonobus/BonobusTransitFactory.kt
- Verificación: https://github.com/metrodroid/metrodroid/blob/master/src/commonMain/kotlin/au/id/micolous/metrodroid/util/HashUtils.kt
- Huella contrastada: `cc2f0d405a4968f95100f776161929f6`.

Se implementó un perfil urbano independiente con autenticación de identidad en sector 0, autenticación de saldo en sector 4 y bloque absoluto 16, escala en céntimos. Su verificación matemática identifica la candidata del perfil, no el saldo o el estado de una tarjeta del usuario. La aceptación del sector de saldo debe verificarse y puede fallar por variantes de tarjeta; en tal caso se muestra un código específico sin fingir un resultado.

El portal del operador contiene un aviso **de 29-01-2024** sobre caducidad y reactivación de bonobuses para permitir recargas. Indica que una tarjeta caducada puede seguir viajando mientras conserve saldo. Es una referencia más pertinente al recuerdo del usuario que la migración DESFire del Consorcio. No prueba que la caducidad bloquee la autenticación NFC ni que sus tarjetas necesiten reactivación:
https://tranviadecadizasanfernandoycarraca.es/caducidad-de-bonobus

La web pública actual de BusCádiz y su sitio de desarrollador no aportaron una especificación NFC/SDK en los recursos consultados. La noticia histórica sobre lectura NFC es una pista, no una especificación ni garantía de que todas las versiones de esa app o tarjeta funcionen.

Resultado de implementación y verificación en ../qa/2026-10-29-nfc-bonobus-urbano/README.md. La consulta al operador queda sin enviar; antes corresponde probar este perfil documentado en la tarjeta física.

## Prueba física posterior de nfc-diag-2 — acceso al saldo pendiente

El usuario probó el perfil urbano en Mi MIX 2 (Android 15) y POCO F3 (Android 13). Ambos informes muestran `urbanIdentityAuthenticated: true`, `urbanBalanceAuthenticated: false`, fase `authenticate-urban-balance` y `URBAN_BALANCE_AUTH_REJECTED`, en 27 y 40 ms respectivamente. No se leyeron bytes del saldo, y `consistentReads: false` refleja que no llegó a esa fase, no dos lecturas diferentes.

Esto valida en esas pruebas la candidata pública de identidad del sector 0, pero **no valida un acceso al sector 4**. Corrige cualquier interpretación de la coincidencia de huellas como garantía de lectura del saldo. El rechazo no prueba por sí solo claves diversificadas, caducidad, avería o un problema de ROM. No hay evidencia para dar por resuelta la consulta del importe.

Búsqueda adicional centrada en el sector 4: consultas web sobre Bonobus/Cadiz/sector 4 y clave publicada; búsqueda global de código GitHub `Bonobus sector4` (solo parser FareBot), `cadiz authenticateSectorWithKeyA` (sin resultados) y la candidata publicada (225 resultados indexados, primeros 20 listados: principalmente copias de diccionarios). No se ha encontrado una clave de saldo o procedimiento alternativo documentados para estas tarjetas. Los índices son una muestra, no prueba de ausencia absoluta de documentación.

La consulta al operador se ha actualizado con los resultados físicos y la petición precisa de acceso de solo lectura al saldo. No se ha cambiado de nuevo el código ni se han añadido intentos de claves sin una referencia verificable. Consulta local preparada y pendiente de autorización para su envío.

## Envío autorizado y seguimiento diario

El usuario autorizó expresamente el envío y pidió un aviso diario. Gmail confirmó el envío a administracion@tranviacadiz.com el 29-10-2026, mensaje/hilo 1a188bab0903885d, etiqueta SENT. Esto confirma envío, no recepción ni respuesta del operador. Se creó la automatización heartbeat activa seguimiento-diario-del-saldo-nfc-de-busmovil, diariamente a las 09:00 en este chat, para revisar el hilo y comunicar el estado. No autoriza nuevos correos automáticos al operador ni cambios de código derivados de mensajes sin revisión.
