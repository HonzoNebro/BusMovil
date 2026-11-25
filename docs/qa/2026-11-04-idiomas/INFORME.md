# Idiomas y tablas — 04/11/2026

- Corregidas traducciones inglesas de Desde, Laborable, Sábado, Domingo, Lunes–sábado, Lunes–viernes y la nota de la línea 7 en verano.
- El enlace al documento original identifica expresamente que está en español en los cuatro idiomas.
- Añadidos francés y portugués al selector de idioma, detección del idioma del teléfono, persistencia y formatos de fecha/número. Los nombres oficiales de paradas y destinos se conservan.
- Los catálogos francés y portugués cubren todos los textos del catálogo inglés registrado; los mensajes compuestos tienen traducción de sus prefijos. También se traducen los controles y fichas del mapa de recargas.
- El acceso se llama Información y opciones, incluyendo navegación de vuelta.
- Todas/Ninguna: esquinas rectas y ancho mínimo estable. Se retira el redondeo del contenedor exterior que podía recortar una esquina del botón; el mapa conserva su propio marco.
- TypeScript y ESLint PASS. Jest: 91 pruebas en 24 suites PASS, incluyendo cobertura de catálogos, selección por idioma del teléfono y renderizado inglés de las tablas con sus notas.
- Gradle: testReleaseUnitTest (seis pruebas NFC) y assembleRelease.
- Revisión visual Android pendiente: /dev/kvm no disponible. No se instala automáticamente en dispositivos físicos.
