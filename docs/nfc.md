# Consulta NFC de transporte de Cádiz — Android

Implementación propia de solo lectura. No depende de servidores ni de paquetes NFC externos. NFC es opcional para instalar/usar las demás funciones.

## Corrección de autenticación urbana (nfc-diag-3, 03/11/2026)

El análisis local del APK de BusCádiz 1.0.59 facilitado por el usuario identifica un perfil distinto para el saldo: sector 4, **Key B** con una candidata específica, y bloque absoluto 16. BusMovil ahora distingue explícitamente tipos A/B en el adaptador; mantiene identidad sector 0 con Key A y utiliza la candidata de saldo solo para sector 4 con Key B. CTAN continúa con sector 9, Key A y bloque 37. No se copia código de BusCádiz ni se leen los otros bloques del sector.

La documentación histórica de nfc-diag-2 situada debajo describe la implementación anterior; su reutilización de candidata/tipo A para saldo queda sustituida por esta corrección. Se conservan las dos lecturas idénticas, validación de formato, cancelación, timeout y diagnóstico sin claves, UID, memoria ni saldo. No hay escrituras ni acceso al saldo en red.

Ver análisis en [BusCádiz APK](research/2026-11-03-buscadiz-apk-nfc.md). La aceptación física sigue pendiente: instalar este APK, comprobar que el diagnóstico indica nfc-diag-3 y contrastar el saldo con uno conocido. Si falla, compartir el diagnóstico. La consulta al operador se envió el 29/10/2026 y sigue monitorizada; no se han enviado nuevos correos.

## Perfil urbano añadido tras ampliar la investigación (nfc-diag-2)

Se ha localizado una clave pública etiquetada expresamente «also Bonobus, Cadiz» en el diccionario original de Proxmark3. La comprobación independiente `MD5(ASCII("cadiz") + bytesClave + ASCII("cadiz"))` produce `cc2f0d405a4968f95100f776161929f6`, exactamente la huella publicada por Metrodroid para identificar este bonobús. Se implementa solo esa candidata documentada, no un recorrido del diccionario ni búsqueda de claves.

Fuentes:
- https://github.com/RfidResearchGroup/proxmark3/blob/master/client/dictionaries/mfc_default_keys.dic
- https://github.com/metrodroid/metrodroid/blob/master/src/commonMain/kotlin/au/id/micolous/metrodroid/transit/bonobus/BonobusTransitFactory.kt
- https://github.com/metrodroid/metrodroid/blob/master/src/commonMain/kotlin/au/id/micolous/metrodroid/transit/bonobus/BonobusTransitData.kt
- https://github.com/metrodroid/metrodroid/blob/master/src/commonMain/kotlin/au/id/micolous/metrodroid/util/HashUtils.kt

Secuencia urbana: autenticar identidad en sector 0 con la candidata publicada; si acepta, autenticar sector 4 y leer su bloque 0 (absoluto 16). Saldo: entero little endian en céntimos (/100), separado de CTAN (/200). La huella demuestra la asociación de la candidata al perfil de identidad, **no garantiza que dé acceso al sector 4 de todas las versiones**: se autentica ese sector por separado y un rechazo produce URBAN_BALANCE_AUTH_REJECTED, sin intentar interpretar otro formato como saldo urbano.

Si la identidad urbana no autentica, se reinicia la conexión antes de intentar el perfil CTAN previamente implementado. Un éxito urbano no se deduce del tamaño/SAK/ATQA. Ambos perfiles hacen dos lecturas consecutivas idénticas antes de devolver un bloque al decodificador. Se mantienen timeout, cierre al pausar, solo lectura y ausencia de persistencia/red. No se leen número de serie ni historial de viajes. El formato urbano documentado no impone la redundancia de value block CTAN: se valida su tamaño, perfil autenticado, consistencia de lecturas y entero no negativo.

El diagnóstico añade `profile`, `urbanIdentityAuthenticated`, `urbanBalanceAuthenticated`, `ctanAuthenticated` y `consistentReads`. Conserva la lista explícita de campos permitidos y nunca comparte bloques, claves o saldo.

Validación: seis pruebas JVM de selección de perfiles, identidad verificada con la huella pública, fallo de acceso al saldo, alternativa CTAN, inconsistencia y cancelación; 74 pruebas Jest; typecheck y ESLint PASS. APK release compilado. **Pendiente: lectura de una tarjeta real del usuario y contraste con saldo conocido.** La validación matemática de la candidata y las pruebas con un lector simulado no sustituyen esa aceptación física.

## Perfil CTAN conservado

Prototipo para la familia CTAN MIFARE Classic descrita públicamente en https://github.com/CrIsTiAnPvP/SaldoAndalucia-app (README, consulta 29-10-2026): sector 9, clave pública de lectura A, bloque 37, entero little endian en formato value block, 200 unidades por euro. Se ha utilizado la descripción del formato; no se ha incorporado código de ese proyecto ni funciones de escritura.

El decodificador independiente verifica tamaño, bytes, las tres copias/complementos del valor y redundancia de dirección. Rechaza valores negativos y datos incompletos. No usa el UID para deducir saldo. La clave y la autenticación específicas limitan la lectura a tarjetas con ese formato. Si otro formato no autentica o el valor no es válido, muestra error; no inventa un saldo ni aplica otra escala por heurística.

La compatibilidad del formato y su equivalencia con el saldo real **no están verificadas con la tarjeta del usuario**. No hay especificación oficial del operador incorporada. El teléfono debe soportar MIFARE Classic, además de disponer de NFC: https://developer.android.com/reference/android/nfc/tech/MifareClassic.

## Activación y limpieza

- Reader mode solo con la actividad reanudada y Keyguard desbloqueado. Sin intent filters NFC, servicios o tareas de lectura en segundo plano.
- La pantalla principal y Saldo permiten leer. Mapa e Información desactivan el lector. Abrir Saldo no exige pulsar «leer»: basta acercar la tarjeta.
- Lifecycle Android desactiva/cierra la conexión al pausar. AppState de React Native refuerza la desactivación, evita resultados en segundo plano y actualiza el estado del hardware al volver.
- Generación de sesión descarta resultados tardíos. Timeout de ocho segundos y cierre en finally. Supresión breve de lecturas duplicadas.
- No escribe en la tarjeta, no usa claves de escritura, no persiste UID ni saldo ni los envía por red. El saldo mostrado conserva fecha/hora y existe solo en memoria de la sesión.

Documentación de reader mode: https://developer.android.com/reference/android/nfc/NfcAdapter#enableReaderMode(android.app.Activity,%20android.nfc.NfcAdapter.ReaderCallback,%20int,%20android.os.Bundle)

## Aceptación física pendiente

1. Instalar el APK en Android con NFC y abrir BusMovil. Acercar tarjeta y contrastar saldo con lector/consulta conocida. Anotar teléfono y resultado, sin publicar UID ni volcado de la tarjeta.
2. Repetir desde Saldo y sin Internet. Probar retirada prematura y tarjeta no compatible: error comprensible, nunca saldo falso.
3. Volver al escritorio, cambiar a otra app y bloquear teléfono. Acercar tarjeta: BusMovil no se abre ni captura la lectura. Reabrir: vuelve a leer.
4. Desactivar NFC: guía para activarlo; volver tras activarlo: recupera la lectura. Teléfono sin MIFARE Classic: explicación de incompatibilidad.

El emulador permite verificar navegación/estados sin hardware, no esta lectura física. No se ha instalado nada en dispositivos físicos conectados automáticamente.

## Diagnóstico NFC (nfc-diag-1)

Caso comunicado: POCO F3, lectura de tarjetas de Madrid funcional, mensaje de BusMovil «No se ha podido leer esta tarjeta del Consorcio. Puede utilizar otro formato.». En la versión anterior ese texto corresponde únicamente a authenticateSectorWithKeyA(9) devolviendo false después de connect(). Por tanto hubo detección y conexión: falla la autenticación del único formato implementado. No demuestra avería, caducidad o necesidad de actualizar la tarjeta; tampoco descarta un problema de comunicación puntual. No requiere estar en Cádiz ni tener datos móviles.

La nueva versión distingue CLASSIC_UNAVAILABLE, AUTH_REJECTED, TAG_LOST, TIMEOUT, IO_ERROR e INVALID_VALUE_BLOCK. Adjunta exclusivamente modelo/fabricante/versión Android, tecnología anunciada, SAK/ATQA, tamaño Classic, fase, tiempo y resultado de conexión/autenticación. Al interpretar un bloque se añaden solo indicadores booleanos de integridad, no bytes ni saldo.

En Saldo: «Ver diagnóstico NFC» permite seleccionar el texto y «Compartir diagnóstico» abre el selector del sistema solo por acción del usuario. No hay envío automático, fichero persistente ni logcat con UID o contenido de tarjeta. Lista explícita de campos permitidos en JavaScript excluye datos de la tarjeta al preparar el informe.

Desde la pantalla principal, el modal de Saldo ahora se abre al finalizar la lectura, no al recibir «reading», para evitar transiciones de ventanas durante la comunicación. No se afirma que esta transición fuese la causa del fallo comunicado. Se mantiene lector en primer plano, solo lectura y la misma clave documentada; no se ensayan claves ni se amplía el acceso a sectores.

Para contrastar: instalar el APK de diagnóstico, abrir Saldo, sacar la tarjeta de la cartera y mantenerla junto a la antena NFC. Si falla, expandir diagnóstico y copiarlo. Repetir una vez retirando la tarjeta unos segundos. La prueba en otra app de saldo CTAN permite distinguir incompatibilidad de nuestra implementación de una dificultad compartida, sin necesitar estar en Cádiz. Sigue pendiente de realizar por el usuario.

## Investigación del 29-10-2026

Ver [contraste de perfiles y documentación](research/2026-10-29-nfc-compatibilidad.md). Se confirma la coincidencia del perfil CTAN actual con dos referencias públicas y se identifica un perfil diferente para bonobús urbano de Cádiz. No se ha encontrado una clave o secuencia alternativa verificable que corrija las tarjetas del usuario. La autenticación rechazada no permite identificar emisor, caducidad o necesidad de actualización. Hay una consulta técnica preparada para el operador, sin envío a terceros.
