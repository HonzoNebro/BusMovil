# BusMovil

Aplicación móvil multiplataforma (Android e iOS) para consultar en tiempo real la localización de
los autobuses urbanos y los tiempos de espera en cada parada.

## Características principales

- 📍 **Mapa interactivo** con la posición actual de las líneas de autobús.
- ⏱️ **Tiempos estimados de llegada** para las paradas favoritas.
- 🔄 **Actualización automática** de la información cada 15 segundos y recarga manual mediante
  gesto de arrastre.
- ⚙️ Arquitectura basada en React Native + Expo con TypeScript y navegación mediante
  `@react-navigation/native`.

> Los datos de ejemplo incluidos se generan a través de un servicio simulado en
> `src/services/mockApi.ts` hasta que se integren los datos oficiales en tiempo real.

## Requisitos previos

- Node.js >= 18
- `npm`, `yarn` o `pnpm`
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/) (se instala automáticamente al ejecutar los
  scripts de npm)

## Scripts disponibles

```bash
npm install      # Instala las dependencias
npm run start    # Inicia el servidor de desarrollo de Expo
npm run android  # Compila e instala la app en un emulador/dispositivo Android
npm run ios      # Compila e instala la app en un simulador/dispositivo iOS (macOS)
npm run web      # Ejecuta la versión web (experimental)
npm run lint     # Ejecuta ESLint sobre el proyecto
```

## Estructura del proyecto

```
.
├── App.tsx                  # Punto de entrada de la app
├── src
│   ├── components           # Componentes UI reutilizables (mapa, listados, etc.)
│   ├── hooks                # Hooks reutilizables (useBusData)
│   ├── screens              # Pantallas principales
│   ├── services             # Integraciones con APIs (mock incluida)
│   ├── theme                # Tokens de diseño reutilizables
│   └── types                # Definiciones TypeScript compartidas
└── assets                   # Recursos gráficos (iconos, splash, ...)
```

## Próximos pasos sugeridos

1. Sustituir el servicio simulado por la API oficial de datos en tiempo real.
2. Añadir gestión de favoritos para paradas y líneas.
3. Integrar notificaciones push para avisos de llegada o incidencias.
4. Añadir soporte offline y cacheado de rutas frecuentes.

---

Creado con ❤️ para facilitar el transporte público en la ciudad.
