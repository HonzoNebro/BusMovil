# Preferencias del proyecto

- Cada vez que se genere y entregue un APK, incluir en la respuesta final el comando completo para instalar esa última versión mediante ADB en `192.168.1.128:5555`.
- Usar `adb -s 192.168.1.128:5555 install -r "RUTA_ABSOLUTA_DEL_APK_GENERADO"`, sustituyendo la ruta por el archivo realmente generado. `-r` conserva los datos de la aplicación.
- Esta preferencia pide proporcionar el comando; no implica instalar automáticamente en el teléfono.
