# Simplificación del mapa de recargas

- Pantalla centrada en búsqueda y mapa; eliminados selector de red, Cerca de mí, listado de establecimientos y su desplegable, texto introductorio y enlaces generales.
- Ambas redes visibles al mismo tiempo: círculo azul urbano, rombo naranja Consorcio y símbolo combinado violeta cuando coinciden las coordenadas. Leyenda pequeña dentro del mapa.
- Pop-up nativo de Leaflet dentro del propio mapa con nombre, red, dirección, horario disponible, Cómo llegar y Cerrar detalle. Se cierra al tocar fuera o al abrir otro punto.
- Los puntos compartidos no se superponen ocultándose: un marcador permite consultar los registros de ambas redes. No se infiere compatibilidad adicional.
- La búsqueda filtra el mapa sin generar un listado externo. El mapa gana altura según la pantalla y encuadra los puntos disponibles.
- Se conserva la navegación externa mediante la aplicación de mapas elegida por el dispositivo, sin API de rutas de pago.
- Los puntos sin coordenadas verificadas no tienen marcador; se indica únicamente su número. Esta entrega no añade geocodificación ni posiciones aproximadas.
- TypeScript y ESLint PASS. 83 pruebas Jest PASS, incluyendo ejecución del script real del mapa para comprobar cierre por toque exterior, cierre por botón, agrupación de ambas redes y envío de la navegación del punto correcto.
- Se conservan seis pruebas nativas del lector NFC.
- Revisión visual Android pendiente: el entorno carece de /dev/kvm (véase informe anterior); no se instala en el teléfono físico.
