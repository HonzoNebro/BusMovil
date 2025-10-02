import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import type { BusLocation } from '@/types/bus';
import { theme } from '@/theme';

interface Props {
  buses: BusLocation[];
  isLoading: boolean;
}

const INITIAL_REGION = {
  latitude: 36.5299,
  longitude: -6.2926,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05
};

export function BusMap({ buses, isLoading }: Props): JSX.Element {
  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={INITIAL_REGION}
        showsUserLocation
      >
        {buses.map((bus) => (
          <Marker
            key={bus.id}
            coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
            title={`Línea ${bus.line}`}
            description={`Actualizado: ${new Date(bus.lastUpdated).toLocaleTimeString()}`}
            rotation={bus.heading}
            anchor={{ x: 0.5, y: 0.5 }}
          />
        ))}
      </MapView>
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface
  },
  loader: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(242, 244, 248, 0.65)'
  }
});
