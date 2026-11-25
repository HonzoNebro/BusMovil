import { Text, Pressable } from '@/i18n/Primitives';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';

import { cadizLines } from '@/services/cadizApi';
import { CLUSTER_SCRIPT } from '@/services/mapClustering';
import { StopDetail, type FavoriteState } from './StopDetail';
import type { BusDataSnapshot } from '@/types/bus';
import { buildMapRoutes } from '@/services/mapRoutes';
import { lineColors, lineTextColor, Theme, useAppTheme } from '@/theme';

interface Props {
  onDetailChange?: (visible: boolean) => void;
  onBackHandlerChange?: (handler?: () => boolean) => void;
  favorites?: FavoriteState;
  snapshot?: BusDataSnapshot | null;
  isLoading?: boolean;
  dataError?: string;
  onRefresh?: () => void;
  visibleLineIds?: string[];
  onVisibleLinesChange?: (lines: string[]) => void;
  lineId?: string;
  directionId?: string;
  focusStopId?: string;
  onSelectStop?: (payload: {
    stopId: string;
    lineId: string;
    directionId?: string;
  }) => void;
}

const DEFAULT_VIEW = {
  latitude: 36.5297,
  longitude: -6.2926,
  zoom: 14
};

export function StopMap({
  lineId,
  directionId,
  focusStopId,
  onSelectStop,
  visibleLineIds,
  onVisibleLinesChange,
  favorites,
  snapshot,
  isLoading,
  dataError,
  onRefresh,
  onBackHandlerChange,
  onDetailChange
}: Props): JSX.Element {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [detailStopId, setDetailStopId] = useState<string>();
  const showMarkers = true;
  const userLocationRef = useRef<
    { latitude: number; longitude: number } | undefined
  >();
  const webViewRef = useRef<WebView | null>(null);

  const [localVisibleLines, setLocalVisibleLines] = useState<string[]>(
    cadizLines.map((line) => line.line)
  );
  const visibleLines = visibleLineIds ?? localVisibleLines;
  const setVisibleLines = (lines: string[]) => {
    setLocalVisibleLines(lines);
    onVisibleLinesChange?.(lines);
  };
  const { markers, shapes: lineShapes } = useMemo(
    () => buildMapRoutes(lineId, directionId),
    [lineId, directionId]
  );
  const detailStop = markers.find((stop) => stop.stopId === detailStopId);
  const visibilityRef = useRef({ lines: visibleLines, showMarkers });
  visibilityRef.current = { lines: visibleLines, showMarkers };
  const sendVisibility = useCallback(() => {
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'setVisibility', ...visibilityRef.current })
    );
    if (userLocationRef.current)
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'updateUserLocation',
          ...userLocationRef.current
        })
      );
  }, []);
  useEffect(sendVisibility, [visibleLines, showMarkers, sendVisibility]);

  useEffect(() => {
    onDetailChange?.(Boolean(detailStopId));
    return () => onDetailChange?.(false);
  }, [detailStopId, onDetailChange]);
  useEffect(() => {
    onBackHandlerChange?.(() => {
      if (detailStopId) {
        setDetailStopId(undefined);
        webViewRef.current?.postMessage(JSON.stringify({ type: 'resumeMap' }));
        return true;
      }
      return false;
    });
    return () => onBackHandlerChange?.(undefined);
  }, [detailStopId, onBackHandlerChange]);

  useEffect(() => {
    let isMounted = true;
    const updateLocation = (latitude: number, longitude: number) => {
      if (!isMounted) {
        return;
      }
      const previous = userLocationRef.current;
      if (
        previous &&
        Math.abs(previous.latitude - latitude) < 0.00005 &&
        Math.abs(previous.longitude - longitude) < 0.00005
      ) {
        return;
      }
      const nextLocation = { latitude, longitude };
      userLocationRef.current = nextLocation;
      if (webViewRef.current) {
        try {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'updateUserLocation',
              latitude,
              longitude
            })
          );
        } catch (err) {
          console.warn(
            'No se pudo enviar la ubicación actualizada al mapa',
            err
          );
        }
      }
    };

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          updateLocation(latitude, longitude);
        }
      },
      (error) => {
        console.warn(
          'No se pudo obtener la ubicación inicial del usuario para el mapa',
          error
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          updateLocation(latitude, longitude);
        }
      },
      (error) => {
        console.warn(
          'Error actualizando la ubicación del usuario en el mapa',
          error
        );
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000
      }
    );

    return () => {
      isMounted = false;
      if (typeof watchId === 'number') {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const mapHtml = useMemo(() => {
    const template = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background: #f8f5ef;
      }
      #map {
        height: 100%;
        width: 100%;
      }
      .leaflet-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .stop-cluster { border-radius:50%; background:#143B59; border:3px solid white; color:white;
        font-weight:700; font-size:14px; display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 6px #0004; box-sizing:border-box; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const markers = __MARKERS__;
      const lineShapes = __LINE_SHAPES__;
      let showMarkers = true;
      let selectedLines = __ALL_LINES__;
      const focusId = __FOCUS_ID__;
      const defaultView = __DEFAULT_VIEW__;
      let currentUserLocation = __USER_LOCATION__;
      let userLocationMarker = null;
      const map = L.map('map', { zoomControl: false });
      const linePolylines = new Map();
      const routeLayers = L.layerGroup().addTo(map);
      const stopLayers = L.layerGroup().addTo(map);
      const clusterStops = __CLUSTER_FUNCTION__;
      const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const defaultLineOpacity = 0.9;

      const setLineOpacity = (activeLineIds) => {
        linePolylines.forEach((polylines, lineId) => {
          const isActive = !activeLineIds || activeLineIds.includes(lineId);
          polylines.forEach((polyline) => {
            polyline.setStyle({ opacity: isActive ? defaultLineOpacity : 0.1 });
          });
        });
      };

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const renderRoutes = () => {
        routeLayers.clearLayers();
        linePolylines.clear();
        if (showMarkers) lineShapes.filter((shape) => selectedLines.includes(shape.lineId)).forEach((shape) => {
          const polyline = L.polyline(shape.coordinates, {
            color: shape.color, weight: 4, opacity: defaultLineOpacity,
            dashArray: shape.alternate ? '8 6' : undefined
          }).bindTooltip('Línea ' + esc(shape.lineId) + ' → ' + esc(shape.destination)).addTo(routeLayers);
          const items = linePolylines.get(shape.lineId) ?? [];
          items.push(polyline); linePolylines.set(shape.lineId, items);
        });

      };
      const visibleMarkers = markers;

      const renderUserLocation = () => {
        if (userLocationMarker) {
          userLocationMarker.remove();
          userLocationMarker = null;
        }
        if (!currentUserLocation) {
          return;
        }
        userLocationMarker = L.circleMarker(
          [currentUserLocation.latitude, currentUserLocation.longitude],
          {
            radius: 8,
            color: '#047857',
            weight: 3,
            fillColor: '#10b981',
            fillOpacity: 0.85
          }
        ).addTo(map);
        userLocationMarker.bindPopup('<strong>Estás aquí</strong>');
      };

      if (currentUserLocation && !showMarkers) {
        map.setView([currentUserLocation.latitude, currentUserLocation.longitude], 15);
      } else if (!markers.length) {
        if (currentUserLocation) {
          map.setView([currentUserLocation.latitude, currentUserLocation.longitude], 15);
        } else {
          map.setView([defaultView.latitude, defaultView.longitude], defaultView.zoom);
        }
      } else {
        const focusedMarker = focusId ? markers.find((marker) => marker.stopId === focusId) : null;
        const pointsForBounds = (visibleMarkers.length ? [...visibleMarkers] : [...markers]).map(
          (marker) => ({ latitude: marker.latitude, longitude: marker.longitude })
        );
        if (currentUserLocation) {
          pointsForBounds.push({
            latitude: currentUserLocation.latitude,
            longitude: currentUserLocation.longitude
          });
        }
        if (focusedMarker) {
          map.setView([focusedMarker.latitude, focusedMarker.longitude], 15);
        } else if (pointsForBounds.length === 1) {
          map.setView([pointsForBounds[0].latitude, pointsForBounds[0].longitude], 15);
        } else {
          const bounds = L.latLngBounds(
            pointsForBounds.map((point) => [point.latitude, point.longitude])
          );
          map.fitBounds(bounds.pad(0.2));
        }
      }

      const renderStops = () => {
        stopLayers.clearLayers();
        if (!showMarkers) return;
        const filtered = visibleMarkers.filter((marker) => marker.services.some((service) => selectedLines.includes(service.lineId)));
        const clusters = clusterStops(filtered, map.getZoom());
        clusters.forEach((cluster) => {
          const point = [cluster.latitude,cluster.longitude];
          if (cluster.stopIds.length > 1) {
            L.marker(point, { icon: L.divIcon({className:'stop-cluster',iconSize:[42,42],iconAnchor:[21,21],html:String(cluster.stopIds.length)}),
              title: cluster.stopIds.length + ' paradas; centrar zona' }).on('click', () => {
                map.panTo(point); // Group selection centers only: never zooms or opens a stop.
              }).addTo(stopLayers);
          } else {
            const marker = filtered.find((item) => item.stopId === cluster.stopIds[0]);
            const service = marker.services.find((item) => selectedLines.includes(item.lineId));
            L.circleMarker(point, { radius:8,color:'#fff',weight:3,fillOpacity:1,
              fillColor:lineShapes.find((shape)=>shape.lineId===service.lineId)?.color ?? marker.color
            }).bindTooltip('Parada ' + esc(marker.stopId) + ' · ' + esc(marker.label)).on('click', () => {
              window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'openStop',stopId:marker.stopId }));
            }).addTo(stopLayers);
          }
        });
      };
      map.on('zoomend', renderStops);
      renderRoutes();
      renderStops();

      renderUserLocation();

      const handleIncomingMessage = (rawEvent) => {
        try {
          const data = typeof rawEvent.data === 'string' ? rawEvent.data : rawEvent;
          const payload = typeof data === 'string' ? JSON.parse(data) : data;
          if (!payload || typeof payload !== 'object') {
            return;
          }
          if (payload.type === 'zoom' && (payload.step === 1 || payload.step === -1)) { map.setZoom(map.getZoom() + payload.step); }
          if (payload.type === 'resumeMap') { setTimeout(() => map.invalidateSize(), 0); }
          if (payload.type === 'focusStop') {
            const stop = markers.find((item) => item.stopId === payload.stopId);
            if (stop) map.setView([stop.latitude,stop.longitude],17);
          }
          if (payload.type === 'setVisibility' && Array.isArray(payload.lines)) {
            selectedLines = payload.lines; showMarkers = Boolean(payload.showMarkers);
            map.closePopup(); renderRoutes(); renderStops();
          }
          if (
            payload.type === 'updateUserLocation' &&
            typeof payload.latitude === 'number' &&
            typeof payload.longitude === 'number'
          ) {
            currentUserLocation = {
              latitude: payload.latitude,
              longitude: payload.longitude
            };
            renderUserLocation();

          }
        } catch (err) {
          // ignore malformed messages
        }
      };

      if (window && window.addEventListener) {
        window.addEventListener('message', handleIncomingMessage);
      }
      if (document && document.addEventListener) {
        document.addEventListener('message', handleIncomingMessage);
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 0);
      setLineOpacity();
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'mapReady' }));
    </script>
  </body>
</html>`;

    const payload = markers.map((marker) => ({
      latitude: marker.latitude,
      longitude: marker.longitude,
      stopId: marker.stopId,
      label: marker.label,
      services: marker.services,
      lines: marker.lines,
      color: marker.color
    }));

    const toSafeJson = (value: unknown) =>
      JSON.stringify(value).replace(/</g, '\\u003c');

    return template
      .replace('__CLUSTER_FUNCTION__', () => CLUSTER_SCRIPT)
      .replace('__MARKERS__', toSafeJson(payload))
      .replace('__LINE_SHAPES__', toSafeJson(lineShapes))
      .replace('__ALL_LINES__', toSafeJson(cadizLines.map((line) => line.line)))
      .replace('__FOCUS_ID__', toSafeJson(focusStopId ?? ''))
      .replace('__DEFAULT_VIEW__', toSafeJson(DEFAULT_VIEW))
      .replace('__USER_LOCATION__', toSafeJson(null));
  }, [focusStopId, lineShapes, markers]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data ?? '{}');
        if (
          payload?.type === 'openStop' &&
          markers.some((stop) => stop.stopId === payload.stopId)
        ) {
          setDetailStopId(payload.stopId);
          return;
        }
        if (payload?.type === 'mapReady') {
          sendVisibility();
          return;
        }
        if (
          payload &&
          payload.type === 'selectStopLine' &&
          typeof payload.stopId === 'string' &&
          typeof payload.lineId === 'string'
        ) {
          onSelectStop?.({
            stopId: payload.stopId,
            lineId: payload.lineId,
            directionId:
              typeof payload.directionId === 'string'
                ? payload.directionId
                : undefined
          });
        }
      } catch (err) {
        console.warn('No se pudo interpretar el mensaje del mapa', err);
      }
    },
    [onSelectStop, sendVisibility, markers]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.mapScreen, detailStop && styles.hidden]}>
        <View style={styles.filters}>
          <View style={styles.filterHeading}>
            <Text style={styles.filterTitle}>Líneas visibles</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                visibleLines.length === cadizLines.length
                  ? 'Ocultar todas las líneas'
                  : 'Mostrar todas las líneas'
              }
              onPress={() =>
                setVisibleLines(
                  visibleLines.length === cadizLines.length
                    ? []
                    : cadizLines.map((line) => line.line)
                )
              }
              style={({ pressed }) => [
                styles.allButton,
                pressed && { backgroundColor: theme.colors.mutedSurface }
              ]}
            >
              <Text style={styles.filterTitle}>
                {visibleLines.length === cadizLines.length
                  ? 'Ninguna'
                  : 'Todas'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.lineFilters}>
            {cadizLines
              .filter((line) => !lineId || line.line === lineId)
              .map((line) => {
                const selected = visibleLines.includes(line.line);
                return (
                  <Pressable
                    key={line.line}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Mostrar línea ${line.line}`}
                    accessibilityState={{ checked: selected }}
                    testID={`map-line-${line.line}`}
                    onPress={() =>
                      setVisibleLines(
                        selected
                          ? visibleLines.filter((id) => id !== line.line)
                          : [...visibleLines, line.line]
                      )
                    }
                    style={[
                      styles.lineFilter,
                      selected && {
                        backgroundColor: lineColors[line.line],
                        borderColor: lineColors[line.line]
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterNumber,
                        selected && { color: lineTextColor(line.line) }
                      ]}
                    >
                      {selected ? '✓ ' : ''}
                      {line.line}
                    </Text>
                  </Pressable>
                );
              })}
          </View>
        </View>
        <Text style={styles.legend}>
          {!visibleLines.length
            ? 'Selecciona alguna línea.'
            : 'Grupos: centra al tocar · Amplía para elegir una parada.'}
        </Text>
        <View style={styles.mapContainer}>
          <View style={styles.controls} pointerEvents="box-none">
            <View style={styles.zoomButtons}>
              {[1, -1].map((step) => (
                <Pressable
                  key={step}
                  accessibilityRole="button"
                  accessibilityLabel={
                    step === 1 ? 'Ampliar mapa' : 'Alejar mapa'
                  }
                  style={styles.zoomButton}
                  onPress={() =>
                    webViewRef.current?.postMessage(
                      JSON.stringify({ type: 'zoom', step })
                    )
                  }
                >
                  <Text style={styles.toggleButtonText}>
                    {step === 1 ? '+' : '−'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            style={styles.map}
            source={{ html: mapHtml }}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            geolocationEnabled
            onMessage={handleMessage}
            onLoadEnd={sendVisibility}
          />
          {!markers.length ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                No hay coordenadas disponibles
              </Text>
              <Text style={styles.emptySubtitle}>
                Aún no tenemos la localización GPS de estas paradas. Añádela
                para verlas en el mapa.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {detailStop ? (
        <StopDetail
          stop={detailStop}
          snapshot={snapshot}
          isLoading={isLoading}
          dataError={dataError}
          onRefresh={onRefresh}
          favorites={favorites}
        />
      ) : null}
    </View>
  );
}

export type StopMapProps = Props;

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,

      borderRadius: 0,
      overflow: 'hidden'
    },
    mapScreen: { flex: 1, gap: 8 },
    hidden: { display: 'none' },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    menu: {
      maxHeight: 280,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      paddingHorizontal: 12
    },
    mapContainer: {
      flex: 1,
      minHeight: 80,
      overflow: 'hidden',
      borderRadius: theme.borderRadius.md
    },
    filters: {
      backgroundColor: theme.colors.background,
      paddingBottom: 12,
      gap: 6
    },
    filterHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    filterTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary
    },
    allButton: {
      minHeight: 44,
      minWidth: 88,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface
    },
    lineFilters: { flexDirection: 'row', gap: 8 },
    lineFilter: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface
    },
    filterNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textSecondary
    },
    legend: { fontSize: 12, color: theme.colors.textSecondary },
    zoomButtons: { alignSelf: 'flex-end', gap: 4, marginTop: 8 },
    zoomButton: {
      backgroundColor: theme.colors.surface,
      minHeight: 44,
      minWidth: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2
    },
    controls: {
      position: 'absolute',
      top: theme.spacing(1),
      right: theme.spacing(1),
      zIndex: 10
    },
    map: {
      flex: 1
    },
    toggleButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: theme.spacing(0.75),
      paddingHorizontal: theme.spacing(1.5),
      elevation: 2,
      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 }
    },
    toggleButtonText: {
      fontSize: 14,
      fontFamily: theme.fonts.medium,
      color: theme.colors.textPrimary
    },
    emptyState: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFFCC',
      padding: theme.spacing(2)
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: theme.fonts.bold,
      color: theme.colors.textPrimary
    },
    emptySubtitle: {
      marginTop: theme.spacing(0.5),
      fontSize: 14,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center'
    }
  });
}
