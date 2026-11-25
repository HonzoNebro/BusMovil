# Filtros del mapa y botones — 04/11/2026
- Inicio: «Tus paradas favoritas», con traducción al inglés.
- Mapa: filtros visibles permanentemente con título «Líneas visibles», botón Todas/Ninguna y selector numérico de líneas. Eliminado el desplegable Opciones y sus accesos a favoritos y horarios.
- Todas/Ninguna conserva la actualización de capas sin recargar el mapa ni mover su encuadre.
- Guardar en favoritos tiene fondo, borde, estado seleccionado/deshabilitado y respuesta al pulsar tanto en la ficha como en la parada del inicio.
- TypeScript y ESLint PASS. Jest: 87 pruebas PASS, incluida visibilidad directa de filtros, ausencia de accesos retirados y conmutación de líneas sin recarga.
- Gradle testReleaseUnitTest y assembleRelease PASS. Se conservan las seis pruebas NFC.
- Revisión visual Android pendiente por ausencia de /dev/kvm. No se instala automáticamente en dispositivos físicos.
