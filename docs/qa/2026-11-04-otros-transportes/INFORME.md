# Otros transportes — 04/11/2026
- Un único botón Otros transportes en la barra inferior sustituye los dos accesos superiores.
- El inicio se identifica como Autobuses urbanos.
- Pantalla unificada Cercanías y tranvía: C1, C1a y T1, sin Todas. Selección inicial C1.
- Cada selector filtra las estaciones y trenes de esa línea. Una estación compartida se conserva al cambiar; en otro caso se elige una estación válida, por proximidad si hay una posición reciente.
- El plano oficial cambia según la línea elegida: Renfe para C1/C1a y Trambahía para T1.
- Se mantienen los horarios, estimaciones directas y sus límites de vigencia, el lector NFC y los cuatro idiomas.
- TypeScript y ESLint PASS; 105 pruebas Jest PASS en 28 suites, incluidos acceso único desde el inicio, identificación del autobús y cambio C1a/T1 sin Todas.
- testReleaseUnitTest y assembleRelease PASS. Se conservan las seis pruebas nativas NFC.
- Revisión visual Android pendiente por ausencia de /dev/kvm. No se instala automáticamente en el teléfono.
