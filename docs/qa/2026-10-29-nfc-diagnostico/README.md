# Diagnóstico NFC para fallo de autenticación en POCO F3

Se añade diagnóstico por fase y código, visible/compartible por el usuario, con lista de campos permitidos. No incluye UID, saldo, claves ni bloques de memoria. Se diferencian timeout y pérdida de tarjeta de un rechazo de autenticación y de errores del decodificador. La aplicación principal no abre un modal hasta que termina la comunicación NFC.

Validación: typecheck y ESLint PASS; **71 pruebas / 19 suites PASS**. Nuevas regresiones: sanitización de informe, integridad de bloque expresada solo como indicadores, visualización y acción de compartir. Compilación release PASS. Se mantiene desactivación del lector en segundo plano y cierre de conexiones.

El mensaje exacto aportado por el usuario permite localizar el fallo anterior en authenticateSectorWithKeyA devolviendo false, después de connect(). No se ha recibido todavía el informe del teléfono real; la compatibilidad con esa tarjeta sigue pendiente. No se ha cambiado la clave ni supuesto que la tarjeta requiera actualización.
