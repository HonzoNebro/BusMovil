## Especificación del producto

La documentación funcional consolidada está en [docs/ESPECIFICACION.md](docs/ESPECIFICACION.md), con decisiones vigentes, datos y propuestas pendientes separadas.

# BusMovil

Aplicación móvil multiplataforma (Android e iOS) para consultar en tiempo real los tiempos de
espera de los autobuses urbanos en Cádiz.

## Características principales

- ⏱️ **Tiempos estimados de llegada** para paradas representativas de las líneas urbanas.
- 📍 **Sugerencia de parada cercana** empleando la ubicación del dispositivo (permisos opcionales).
- 🔄 **Actualización automática** de la información cada 60 segundos y recarga manual mediante
  gesto de arrastre.
- ⚙️ Arquitectura basada en React Native CLI con TypeScript.

La app consume datos en tiempo real publicados por el Ayuntamiento de Cádiz a través del portal
[`urbanos`](http://77.224.241.76/urbanos/) (servicios `Presenter.aspx` y `PresenterService.asmx`).
En `src/services/cadizApi.ts` se encapsula la obtención de estimaciones de llegada para las líneas
1, 2, 3, 5 y 7, junto con un pequeño conjunto de paradas representativas.

## Requisitos previos

- Node.js >= 18
- JDK 17 (`JAVA_HOME` debe apuntar a esa instalación)
- Android Studio con Android SDK 34 y Build Tools 34.0.0 (`ANDROID_HOME` configurado)
- Xcode + CocoaPods (`sudo gem install cocoapods`) para generar builds iOS
- `npm`, `yarn` o `pnpm`

## Scripts disponibles

```bash
npm ci             # Instala las versiones fijadas en package-lock.json
npm run start      # Inicia Metro (bundler de React Native)
npm run android    # Compila e instala la app en un emulador/dispositivo Android
npm run ios        # Compila e instala la app en un simulador/dispositivo iOS (requiere macOS)
npm run lint       # Ejecuta ESLint sobre el proyecto
npm run typecheck  # Comprueba TypeScript
npm test -- --runInBand # Pruebas de arranque, pantalla y actualización
npm run build:android # Genera android/app/build/outputs/apk/debug/app-debug.apk
```

Después de instalar las dependencias ejecuta `npx pod-install ios` para preparar las dependencias
nativas de iOS.

## Compilación y migración

El proyecto usa React Native CLI 0.74.5 y React 18.2, sin Expo. Conserva las llegadas,
la selección de líneas y sentidos, la ubicación y el mapa de paradas en WebView.
El identificador Android es `app.transportescadiz`.

El APK debug usa Metro: ejecuta `npm start` y, con un dispositivo conectado,
`adb reverse tcp:8081 tcp:8081`. Para generar un APK con JavaScript incorporado:

```bash
cd android
./gradlew assembleRelease
```

El resultado está en `android/app/build/outputs/apk/release/app-release.apk`.
La configuración actual firma ese APK con la clave de desarrollo; una publicación
requiere configurar una clave propia. Los bundles los genera Gradle: no copies
un `index.android.bundle` manualmente a `src/main/assets`.

En macOS, instala los pods antes de ejecutar `npm run ios`. El destino Xcode se
llama `BusMovilNative`, pero el componente registrado en ambas plataformas es `BusMovil`.
La API municipal usa HTTP; Android permite ese tráfico y iOS tiene una excepción ATS
para poder consultarla. El mapa necesita conexión para cargar Leaflet y las teselas.

## Probar en el ordenador con GPS simulado

```bash
npm run emulator
```

Arranca el AVD disponible (en este equipo, `Medium_Phone_API_36.1`), compila el APK,
lo instala **solo en `emulator-5554`**, concede ubicación y abre BusMovil con el GPS
en Plaza España. No necesita Metro ni un teléfono. Los siguientes arranques pueden
usar `npm run emulator -- --no-build` si no has cambiado el código.

Pulsa **Usar mi ubicación** en la app. Para cambiar de lugar desde otra terminal:

```bash
npm run emulator:gps -- 1101          # Plaza España
npm run emulator:gps -- 1109          # Hospital Puerta del Mar
npm run emulator:gps -- 1516          # Zona Franca
npm run emulator:gps -- 36.520 -6.280 # Latitud y longitud libres
npm run emulator:stops               # IDs, nombres y coordenadas del catálogo
npm run emulator:stop                # Cierra únicamente el emulador configurado
```

El comando mantiene la coordenada mediante un único proceso de envío por emulador,
cada segundo. Los comandos posteriores actualizan esa coordenada; al cerrar o perder
el emulador se detiene el proceso. Después de cada cambio vuelve a pulsar
**Usar mi ubicación**: con permiso preciso, la app exige una lectura tomada después
de iniciar la solicitud. Con permiso aproximado, admite la última estimación de hasta
15 minutos y muestra su fecha y un aviso de precisión. La observación se cancela al
obtener una posición válida o tras 15 segundos. Con permiso preciso, en las coordenadas
exactas de una parada la distancia debe ser aproximadamente 0 m. Prueba dos paradas distintas para comprobar el cambio de sugerencia.
Si varias comparten coordenadas, se muestra la primera del catálogo.

Para cambiar el GPS desde los controles gráficos, detén primero el envío continuo con
`npm run emulator:gps:stop`. Después puedes usar **⋮ > Location** en los controles del emulador y enviar un punto
(o reproducir una ruta). Para un punto fijo con permiso preciso, pulsa primero
«Usar mi ubicación» y envía el punto mientras la app busca; una ruta en reproducción
ya proporciona lecturas continuas. La simulación afecta al GPS de Android y al mapa, sin añadir
posiciones ficticias al código de producción. La consulta de llegadas sigue usando la API real.

El script toma las coordenadas del catálogo de la app. Rechaza coordenadas fuera de rango
y destinos que no sean emuladores. Puedes elegir otro AVD con `BUSMOVIL_AVD` y otro
emulador con `BUSMOVIL_EMULATOR_SERIAL=emulator-5556`; nunca usa un teléfono conectado.
Configura `JAVA_HOME` con JDK 17; en este equipo detecta automáticamente la instalación
Corretto 17 existente. El SDK se busca en `ANDROID_HOME`, `ANDROID_SDK_ROOT` o `~/Android/Sdk`.

Para CI o pruebas sin ventana: `npm run emulator -- --headless`. El emulador requiere
virtualización KVM disponible. Usa SwiftShader para evitar depender del controlador gráfico;
los errores de arranque quedan en `work/emulator.log`.

## Comportamiento ante fallos de consulta

La actualización distingue una respuesta válida sin llegadas de un fallo de consulta.
Si fallan todas las paradas, mantiene los datos y la fecha de la última consulta válida,
con un aviso y la opción de reintentar. Si falla solo una parte, actualiza las paradas
correctas y conserva las estimaciones anteriores de las afectadas con la etiqueta
«Dato anterior» y su hora original. Esos valores no representan una cuenta atrás vigente.
El catálogo de líneas y paradas sigue disponible aunque no haya estimaciones.

## Batería de pruebas en el emulador

Con BusMovil instalado en `emulator-5554` (`npm run emulator`):

```bash
npm run test:emulator
# O ejecutar un bloque concreto:
python3 scripts/emulator-qa.py navigation
python3 scripts/emulator-qa.py location
python3 scripts/emulator-qa.py resilience
python3 scripts/emulator-qa.py permissions
# Comprobaciones adicionales del plan (15 solicitudes GPS, layout y datos sin red):
python3 scripts/emulator-qa.py acceptance
```

Requiere Python 3, Android SDK y acceso a ADB. Ejecuta 25 escenarios de navegación,
mapa, GPS, permisos, pérdida de conexión, giro de pantalla y fuente grande. Cambia
solo el emulador; al finalizar cada bloque restaura ubicación y permisos, habilita
Wi-Fi/datos y recupera la orientación/tamaño de fuente previos. No usa teléfonos.
Guarda XML, capturas, logs y resultados JSON en `work/qa/` (ignorado por Git).
Devuelve código 1 si hay casos fallidos, errores o capturas que requieren revisión manual (`REVIEW`). El contenido del WebView puede no aparecer en UIAutomator; eso por sí solo no es un bug. Para repetir
un caso: `python3 scripts/emulator-qa.py location --only 11-navigation-after-gps`.

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

## Informes de verificación

- [Diagnóstico inicial del 28/10/2026](docs/qa/2026-10-28/README.md).
- [Correcciones y verificación del 29/10/2026](docs/qa/2026-10-29-correcciones/README.md).

## Próximos pasos sugeridos

1. Permitir al usuario seleccionar paradas y líneas favoritas dinámicamente.
2. Integrar notificaciones push para avisos de llegada o incidencias.
3. Añadir soporte offline y cacheado de rutas frecuentes.

---

Creado con ❤️ para facilitar el transporte público en la ciudad.

## Diseño Urbano

La pantalla utiliza la parada seleccionada, una tarjeta con la próxima llegada real,
colores por línea y un recorrido desplegable. El tema sigue el modo claro/oscuro del
sistema. Los datos antiguos conservan su fecha y no se presentan como cuenta atrás.

Con el APK instalado en `emulator-5554`, ejecutar `python3 scripts/urban-qa.py` para
verificar navegación, mapa, GPS, temas, fuente al 150 %, horizontal y pérdida de red.
El script restaura red, escala y orientación y detiene el envío continuo de GPS.
Evidencias y alcance: `docs/qa/2026-10-29-urbano/README.md`.

El mapa distingue los sentidos con trazos continuos (hacia Plaza España en las
líneas 1, 2, 3 y 5) y discontinuos (vuelta); la línea 7 también utiliza ambos tipos de trazo. Las paradas se agrupan por zoom con recuentos de paradas distintas.
Tocar un grupo solo centra esa zona. Al ampliar se pueden abrir las fichas
individuales con minimapa, número, líneas, próximas llegadas y favoritos.

El menú «Opciones» reúne filtros de líneas, favoritos y la consulta interna
de horarios y frecuencias. La acción «Todas/Ninguna» sustituye al botón flotante
de ocultar/mostrar. Las dos tablas oficiales están incluidas en el APK, sin su
plano y sin abrir el navegador. Los favoritos se guardan en el
teléfono; no se almacenan llegadas para uso offline persistente. Los filtros se
conservan al reabrir el mapa durante la sesión y mantienen el encuadre.
Verificación nativa: `python3 scripts/map-qa.py` y `python3 scripts/cluster-qa.py`.
Informe actual: `docs/qa/2026-10-29-mapa-agrupado/README.md`.

Tarifas y puntos de recarga del Consorcio se incluyen en Información. La consulta
NFC de saldo está implementada como prototipo de solo lectura, pendiente de
validación con tarjeta y teléfono físicos. Noticias y tiempo quedan fuera del
alcance de la aplicación. No se muestran saldos simulados.

La pantalla principal se llama «Líneas y llegadas». Los botones de línea también
reabren el selector de sentidos; no hay acciones duplicadas de cambiar línea ni
de ubicación. La vista reducida de paradas mantiene el orden y solo abre un
acordeón cada vez. La ficha del mapa tiene minimapa fijo, retorno explícito al
mapa y favoritos junto al número de parada. Informe de esta revisión:
`docs/qa/2026-10-29-navegacion-coherente/README.md`.

## Barra inferior y estado de actualización

Ubicación, Mapa y Horarios permanecen accesibles en una barra fija. Se solicita
ubicación una vez al abrir la pantalla; la selección prioriza la parada física
y después las líneas en orden 1, 2, 3, 5, 7. Las demás líneas se ordenan por
próxima llegada sin cambiar automáticamente la selección. Un sentido que no
sirve a la parada se explica antes de elegir otra parada explícitamente.

El recorrido reducido muestra solo la parada seleccionada. Al desplegarlo se
mantiene visible mediante un desplazamiento mínimo. El estado de llegadas
permite actualizar, queda naranja tras un fallo y conserva los datos y su fecha;
se reintenta automáticamente cada 60 segundos. También se puede tirar hacia abajo.

Horarios usa ahora tablas nativas, tema claro/oscuro, zoom y enlace opcional al
documento original. Datos en `src/services/officialTimetable.ts`; acceso principal
en la barra, retirado de la ficha. Informe y prueba nativa:
`docs/qa/2026-10-29-barra-y-actualizacion/README.md`,
`python3 scripts/live-status-qa.py`.

### Parada cercana al elegir sentido

Al abrir la aplicación se localiza la parada física más cercana. Al elegir una línea
y un sentido se selecciona automáticamente una parada de ese recorrido desde la
posición del usuario; no se exige aceptar una sugerencia ni se presenta un estado
«no pasa por» para la parada anterior.

Se comparan las tres paradas más cercanas en línea recta mediante una matriz
peatonal de Valhalla (datos OpenStreetMap), eligiendo el menor tiempo estimado a pie.
Se indica distancia/tiempo y fecha de la ubicación. Si el servicio falla o tarda más
de ocho segundos, se utiliza la distancia en línea recta y se informa de ello.
La selección no se recalcula en cada actualización de llegadas. Cambiar de línea
cancela una búsqueda pendiente. Sin ubicación disponible se permite reintentar.

El prototipo consulta `valhalla1.openstreetmap.de`, enviando coordenadas de origen
y hasta tres destinos, sin identificadores personales; una consulta como máximo
por segundo, caché en memoria de dos minutos. No calcula un itinerario dibujado.
Es la mejor opción entre esas tres candidatas, no una garantía de ruta accesible.
Antes de distribuir ampliamente debe contratarse/alojarse un servicio apropiado
o acordar el uso con el proveedor del servidor público:
https://routing.openstreetmap.de/about.html.

### Información y tarjeta de transporte

La barra principal ofrece **Saldo · Mapa · Información**. **Actualizar ubicación**
está junto a la parada seleccionada. Información agrupa tarifas, puntos de recarga
del Consorcio en Cádiz, frecuencias y primeras/últimas salidas. Tarifas y puntos se
incorporaron desde sus fuentes oficiales el 29-10-2026, con enlaces para consultar
actualizaciones, sin servidor propio. Los datos locales no se sincronizan solos.
El bonobús urbano y la tarjeta del Consorcio se distinguen expresamente.

Saldo utiliza NFC de Android solo en primer plano y sin conexión a Internet.
El lector es de solo lectura y no guarda ni envía datos de la tarjeta. Su
compatibilidad con la tarjeta real y el teléfono del usuario está pendiente de
prueba física. Ver [formato, límites y aceptación NFC](docs/nfc.md).

### Accesos y preferencias
El inicio permite buscar paradas por número, nombre o línea y acceder a las paradas favoritas, compartidas con el mapa. En **Información** se puede elegir español, inglés o el idioma del teléfono; la preferencia se conserva.
Las tablas de frecuencias y salidas se abren directamente. **Puntos de recarga** separa bonobús urbano y Consorcio y permite ordenar por ubicación. Las posiciones y horarios no publicados se señalan como desconocidos; las distancias son en línea recta. Detalles y evidencias en `docs/qa/2026-10-29-accesos/INFORME.md`.

### Cercanías y Trambahía — primera integración
El botón Otros transportes de la barra inferior abre Cercanías y tranvía, con selección individual C1, C1a o T1, y permite elegir estación y consultar próximos trenes y planos oficiales locales. La consulta de llegadas utiliza trip_updates.json de Renfe, cada 20 segundos con la pantalla ferroviaria abierta y la aplicación activa. Se detiene en segundo plano o al cerrar la pantalla.

Las estimaciones directas están identificadas como «En directo» y los restantes horarios como «Horario programado». No se propaga un retraso a estaciones sin estimación directa. Los trenes que terminan en la estación consultada no se ofrecen como servicios que puedan tomarse desde ella.

El catálogo estático incorporado vence el 03/12/2026; su renovación automática queda pendiente. Para actualizarlo, descarga el ZIP oficial indicado en src/assets/rail/README.md y ejecuta npm run rail:catalog -- /ruta/al/zip antes de compilar. El catálogo incorpora recorridos parciales y la rama Universidad. Los datos ferroviarios se atribuyen a Renfe Operadora, CC BY 4.0.
