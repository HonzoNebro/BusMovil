# BusMovil

Aplicación móvil multiplataforma (Android e iOS) para consultar en tiempo real los tiempos de
espera de los autobuses urbanos en Cádiz.

## Características principales

- ⏱️ **Tiempos estimados de llegada** para paradas representativas de las líneas urbanas.
- 📍 **Sugerencia de parada cercana** empleando la ubicación del dispositivo (permisos opcionales).
- 🔄 **Actualización automática** de la información cada 15 segundos y recarga manual mediante
  gesto de arrastre.
- ⚙️ Arquitectura basada en React Native + Expo con TypeScript.

La app consume datos en tiempo real publicados por el Ayuntamiento de Cádiz a través del portal
[`urbanos`](http://77.224.241.76/urbanos/) (servicios `Presenter.aspx` y `PresenterService.asmx`).
En `src/services/cadizApi.ts` se encapsula la obtención de estimaciones de llegada para las líneas
1, 2, 3, 5 y 7, junto con un pequeño conjunto de paradas representativas.

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
│   ├── components           # Componentes UI reutilizables (listas, tarjetas, ...)
│   ├── hooks                # Hooks reutilizables (useBusData, useNearestStop)
│   ├── screens              # Pantallas principales
│   ├── services             # Integraciones con APIs (datos reales de Cádiz)
│   ├── theme                # Tokens de diseño reutilizables
│   └── types                # Definiciones TypeScript compartidas
└── assets                   # Recursos gráficos (iconos, splash, ...)
```

## Próximos pasos sugeridos

1. Permitir al usuario seleccionar paradas y líneas favoritas dinámicamente.
2. Integrar notificaciones push para avisos de llegada o incidencias.
3. Añadir soporte offline y cacheado de rutas frecuentes.

---

Creado con ❤️ para facilitar el transporte público en la ciudad.
