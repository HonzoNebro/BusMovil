# Zoom táctil en planos — 04/11/2026

- Visor de imágenes locales con pellizco de dos dedos y desplazamiento de uno.
- Se mantiene el punto bajo el centro del gesto al ampliar y se limita el desplazamiento a los bordes de la imagen.
- Reajuste de la referencia del gesto al añadir o retirar dedos, sin saltar al cambiar entre pellizco y arrastre.
- Escala entre encajado y seis aumentos. Ajustar y cambios de tamaño/orientación restablecen el encuadre.
- Eliminados los botones +/−. Se conserva Ajustar y acciones accesibles de incrementar/reducir.
- Sin dependencias nuevas, teselas ni peticiones de red. Ambos planos utilizan el mismo visor.
- Texto de ayuda en español, inglés, francés y portugués.
- TypeScript, ESLint y 109 pruebas Jest PASS. Pruebas nuevas de foco del pellizco, límites, arrastre, transición de dedos y restablecimiento, incluyendo callbacks del visor.
- Se conservan seis pruebas nativas NFC. assembleRelease y testReleaseUnitTest.
- Comprobación física de la fluidez y los gestos PENDIENTE: entorno sin /dev/kvm, sin instalación automática en teléfono.
