import React, { useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import type { FavouriteStop } from '@/services/cadizApi';
import { cadizLines, stopMetadata } from '@/services/cadizApi';
import { theme } from '@/theme';

interface Props {
  lineId?: string;
  directionId?: string;
  focusStopId?: string;
}

interface StopMarker {
  stopId: string;
  label: string;
  latitude: number;
  longitude: number;
  line: string;
}

const DEFAULT_REGION = {
  latitude: 36.5297,
  longitude: -6.2926,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06
};

function hasCoordinates(stop: FavouriteStop | undefined): stop is FavouriteStop & {
  latitude: number;
  longitude: number;
} {
  return Boolean(stop && typeof stop.latitude === 'number' && typeof stop.longitude === 'number');
}

export function StopMap({ lineId, directionId, focusStopId }: Props): JSX.Element {
  const markers = useMemo<StopMarker[]>(() => {
    const lines = lineId ? cadizLines.filter((line) => line.line === lineId) : cadizLines;

    return lines.flatMap((line) =>
      line.directions
        .filter((direction) => (directionId ? direction.id === directionId : true))
        .flatMap((direction) =>
          direction.stops
            .map((stopConfig) => {
              const metadata = stopMetadata[stopConfig.stopId];
              if (hasCoordinates(metadata)) {
                return {
                  stopId: stopConfig.stopId,
                  label: metadata.label,
                  latitude: metadata.latitude,
                  longitude: metadata.longitude,
                  line: line.line
                } satisfies StopMarker;
              }
              return undefined;
            })
            .filter((value): value is StopMarker => Boolean(value))
        )
    );
  }, [directionId, lineId]);

  const highlightedMarker = markers.find((marker) => marker.stopId === focusStopId);

  const providerProps = Platform.OS === 'android' ? { provider: PROVIDER_GOOGLE } : {};

  const initialRegion = highlightedMarker
    ? {
        latitude: highlightedMarker.latitude,
        longitude: highlightedMarker.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }
    : markers.length
      ? {
          latitude: markers[0].latitude,
          longitude: markers[0].longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04
        }
      : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        {...providerProps}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.stopId}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={`Parada ${marker.stopId}`}
            description={`Línea ${marker.line} · ${marker.label}`}
            pinColor={marker.stopId === focusStopId ? theme.colors.primary : undefined}
          />
        ))}
      </MapView>
      {!markers.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No hay coordenadas disponibles</Text>
          <Text style={styles.emptySubtitle}>
            Aún no tenemos la localización GPS de estas paradas. Añádela para verlas en el mapa.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export type StopMapProps = Props;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Dimensions.get('window').height * 0.6,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden'
  },
  map: {
    flex: 1
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
