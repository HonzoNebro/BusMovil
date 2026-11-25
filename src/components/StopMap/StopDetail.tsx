import { useLanguage } from '@/i18n/Language';
import { Text, Pressable } from '@/i18n/Primitives';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { navigateToPoint } from '../../services/mapNavigation';
import { buildMapRoutes } from '../../services/mapRoutes';
import type { BusDataSnapshot, BusStopArrival } from '../../types/bus';
import type { useFavoriteStops } from '../../hooks/useFavoriteStops';
import { lineColors, lineTextColor, Theme, useAppTheme } from '../../theme';

export type FavoriteState = ReturnType<typeof useFavoriteStops>;
export type MapStop = ReturnType<typeof buildMapRoutes>['markers'][number];
interface Props {
  stop: Omit<MapStop, 'latitude' | 'longitude'> & {
    latitude?: number;
    longitude?: number;
  };
  snapshot?: BusDataSnapshot | null;
  isLoading?: boolean;
  dataError?: string;
  onRefresh?: () => void;
  favorites?: FavoriteState;
}
export function stopArrivalLabel(
  arrival: BusStopArrival,
  stale: boolean,
  locale = 'es-ES'
) {
  const time = new Date(arrival.observedAt).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
  if (stale)
    return `Dato anterior: ${arrival.arrivalInMinutes} min · consulta ${time}`;
  if (arrival.arrivalInMinutes === 0) return 'Llegando';
  if (arrival.arrivalInMinutes > 30)
    return new Date(
      new Date(arrival.observedAt).getTime() + arrival.arrivalInMinutes * 60000
    ).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return `${arrival.arrivalInMinutes} min`;
}
export function StopDetail({
  stop,
  snapshot,
  isLoading,
  dataError,
  onRefresh,
  favorites
}: Props) {
  const { locale } = useLanguage();
  const [navigationError, setNavigationError] = useState(false);
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const arrivals = useMemo(() => {
    const seen = new Set<string>();
    return (snapshot?.arrivals ?? [])
      .filter((arrival) => {
        if (arrival.stopId !== stop.stopId) return false;
        const key = `${arrival.line}|${arrival.destination}|${arrival.arrivalInMinutes}|${arrival.observedAt}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.arrivalInMinutes - b.arrivalInMinutes);
  }, [snapshot, stop.stopId]);
  const stale = Boolean(snapshot?.failedStopIds.includes(stop.stopId));
  const failed = stale || Boolean(dataError && !snapshot);
  const favorite = favorites?.favoriteIds.includes(stop.stopId) ?? false;
  const html = useMemo(
    () =>
      `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const map=L.map('map',{zoomControl:false,dragging:false,touchZoom:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,zoomAnimation:false}).setView([${stop.latitude},${stop.longitude}],17);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);L.circleMarker([${stop.latitude},${stop.longitude}],{radius:10,color:'#fff',weight:3,fillColor:'#C21C34',fillOpacity:1}).addTo(map);</script></body></html>`,
    [stop.latitude, stop.longitude]
  );
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="stop-detail"
    >
      <Text accessibilityRole="header" style={styles.title}>
        {stop.label}
      </Text>
      <View style={styles.summary}>
        <Text style={styles.number}>Parada {stop.stopId}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'
          }
          accessibilityState={{
            selected: favorite,
            disabled: !favorites?.ready || favorites?.saving
          }}
          disabled={!favorites?.ready || favorites?.saving}
          onPress={() => void favorites?.toggleFavorite(stop.stopId)}
          style={({ pressed }) => [
            styles.action,
            {
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: favorite
                ? theme.colors.primary
                : theme.colors.border,
              backgroundColor: pressed
                ? theme.colors.mutedSurface
                : theme.colors.surface,
              opacity: !favorites?.ready || favorites?.saving ? 0.5 : 1
            }
          ]}
        >
          <Text style={styles.link}>
            {favorite ? '★ Guardada' : '☆ Guardar'}
          </Text>
        </Pressable>
        <View style={styles.badges}>
          {stop.lines.map((line) => (
            <View
              key={line}
              style={[styles.badge, { backgroundColor: lineColors[line] }]}
            >
              <Text style={{ color: lineTextColor(line), fontWeight: '700' }}>
                {line}
              </Text>
            </View>
          ))}
        </View>
      </View>
      {favorites?.error ? (
        <Text style={styles.warning}>{favorites.error}</Text>
      ) : null}
      {typeof stop.latitude === 'number' &&
      typeof stop.longitude === 'number' ? (
        <View
          style={styles.miniMap}
          pointerEvents="none"
          accessibilityLabel={`Ubicación de la parada ${stop.stopId}`}
        >
          <WebView
            source={{ html }}
            originWhitelist={['*']}
            scrollEnabled={false}
            style={styles.map}
          />
        </View>
      ) : null}
      {Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cómo llegar"
          style={styles.navigationButton}
          onPress={() => {
            setNavigationError(false);
            void navigateToPoint({
              name: stop.label,
              latitude: stop.latitude,
              longitude: stop.longitude
            }).catch(() => setNavigationError(true));
          }}
        >
          <Text style={styles.link}>Cómo llegar ↗</Text>
        </Pressable>
      ) : null}
      {navigationError ? (
        <Text accessibilityRole="alert" style={styles.warning}>
          No se pudo abrir la aplicación de mapas o el enlace.
        </Text>
      ) : null}
      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Próximas llegadas</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar llegadas"
          disabled={isLoading}
          onPress={onRefresh}
          style={styles.action}
        >
          <Text style={styles.link}>
            {isLoading ? 'Actualizando…' : '↻ Actualizar'}
          </Text>
        </Pressable>
      </View>
      {failed ? (
        <Text style={styles.warning}>
          No se pudo actualizar esta parada.{' '}
          {arrivals.length
            ? 'Los datos anteriores conservan su hora de consulta.'
            : 'Comprueba la conexión y vuelve a actualizar.'}
        </Text>
      ) : null}
      <View style={styles.card}>
        {arrivals.map((arrival, index) => (
          <View key={index} style={styles.arrival}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    lineColors[arrival.line] ?? theme.colors.primary
                }
              ]}
            >
              <Text
                style={{
                  color: lineTextColor(arrival.line),
                  fontWeight: '700'
                }}
              >
                {arrival.line}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.destination}>{arrival.destination}</Text>
              <Text style={stale ? styles.historical : styles.eta}>
                {stopArrivalLabel(arrival, stale, locale)}
              </Text>
            </View>
          </View>
        ))}
        {!arrivals.length ? (
          <Text style={styles.secondary}>
            {isLoading
              ? 'Consultando llegadas…'
              : failed
              ? 'Sin información actualizada'
              : 'Sin próximas llegadas para esta parada.'}
          </Text>
        ) : null}
      </View>
      {snapshot ? (
        <Text style={styles.secondary}>
          Consulta:{' '}
          {new Date(
            arrivals[0]?.observedAt ?? snapshot.generatedAt
          ).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
          . Tiempos estimados.
        </Text>
      ) : null}
    </ScrollView>
  );
}
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 24, gap: 14 },
    action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
    navigationButton: {
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14
    },
    link: { color: theme.colors.primary, fontWeight: '600', fontSize: 14 },
    title: { fontSize: 25, fontWeight: '700', color: theme.colors.textPrimary },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap'
    },
    number: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary
    },
    badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    badge: {
      minWidth: 34,
      minHeight: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 6
    },
    miniMap: { height: 170, borderRadius: 18, overflow: 'hidden' },
    map: { flex: 1 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    },
    heading: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      flexShrink: 1
    },
    card: {
      padding: 15,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      gap: 10
    },
    arrival: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 7
    },
    flex: { flex: 1, gap: 4 },
    destination: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary
    },
    eta: { fontSize: 21, fontWeight: '700', color: theme.colors.primary },
    historical: { fontSize: 13, color: theme.colors.textSecondary },
    secondary: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20
    },
    warning: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.warningSurface,
      color: theme.colors.warning,
      lineHeight: 20
    }
  });
}
