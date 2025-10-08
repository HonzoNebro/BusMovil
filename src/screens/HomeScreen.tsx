import React, { useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ArrivalList } from '@/components/ArrivalList';
import { StopMap } from '@/components/StopMap';
import { useBusDataContext } from '@/services/BusDataContext';
import { useNearestStop } from '@/hooks/useNearestStop';
import { theme } from '@/theme';

export default function HomeScreen(): JSX.Element {
  const { snapshot, isLoading, error, refresh } = useBusDataContext();
  const { nearestStop, isRequesting, error: locationError, requestLocation, status } =
    useNearestStop();
  const [isMapVisible, setIsMapVisible] = useState(false);

  const handleRequestLocation = () => {
    void requestLocation();
  };

  const locationStatusLabel = (() => {
    if (status === 'denied') {
      return 'Activa los permisos de ubicación para detectar tu parada cercana.';
    }
    if (status === 'unavailable') {
      return 'No se pudo obtener tu ubicación. Inténtalo de nuevo más tarde.';
    }
    if (nearestStop) {
      const distance = nearestStop.distanceMeters;
      const formattedDistance =
        distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;

      return `Tu parada más cercana es ${nearestStop.label} (${formattedDistance}).`;
    }
    return 'Permite el acceso a la ubicación para sugerirte la parada más cercana.';
  })();

  return (
    <>
      <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      <Text style={styles.title}>Rastreo en tiempo real</Text>
      <Text style={styles.subtitle}>
        Consulta cuántos minutos faltan para tus líneas de autobús favoritas y recibe sugerencias
        sobre la parada más cercana.
      </Text>

      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>Parada cercana</Text>
        <Text style={styles.locationDescription}>{locationStatusLabel}</Text>
        {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={handleRequestLocation}
          disabled={isRequesting}
          style={({ pressed }) => [
            styles.locationButton,
            isRequesting ? styles.locationButtonDisabled : null,
            pressed && !isRequesting ? styles.locationButtonPressed : null
          ]}
        >
          <Text style={styles.locationButtonText}>
            {isRequesting ? 'Buscando ubicación…' : 'Usar mi ubicación'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsMapVisible(true)}
          style={({ pressed }) => [
            styles.mapButton,
            pressed ? styles.mapButtonPressed : null
          ]}
        >
          <Text style={styles.mapButtonText}>Ver mapa de paradas</Text>
        </Pressable>
      </View>

      <ArrivalList
        arrivals={snapshot?.arrivals ?? []}
        focusStopId={nearestStop?.stopId}
        linePriority={['1', '2', '3', '5', '7']}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {snapshot ? (
        <Text style={styles.timestamp}>
          Última actualización: {new Date(snapshot.generatedAt).toLocaleTimeString()}
        </Text>
      ) : null}
      </ScrollView>

      <Modal
        visible={isMapVisible}
        animationType="slide"
        onRequestClose={() => setIsMapVisible(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsMapVisible(false)}
              style={({ pressed }) => [
                styles.closeMapButton,
                pressed ? styles.mapButtonPressed : null
              ]}
            >
              <Text style={styles.mapButtonText}>Cerrar</Text>
            </Pressable>
            <Text style={styles.mapModalTitle}>Mapa de paradas</Text>
          </View>
          <StopMap focusStopId={nearestStop?.stopId} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing(3),
    gap: theme.spacing(3)
  },
  title: {
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  subtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary
  },
  locationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing(2),
    gap: theme.spacing(1)
  },
  locationTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  locationDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary
  },
  locationError: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.warning
  },
  locationButton: {
    marginTop: theme.spacing(1),
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(2),
    borderRadius: theme.borderRadius.sm
  },
  locationButtonDisabled: {
    opacity: 0.5
  },
  locationButtonPressed: {
    opacity: 0.8
  },
  locationButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.colors.onPrimary
  },
  mapButton: {
    marginTop: theme.spacing(1),
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(2),
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  mapButtonPressed: {
    opacity: 0.7
  },
  mapButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary
  },
  error: {
    fontSize: 14,
    color: theme.colors.warning
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right'
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing(5),
    paddingHorizontal: theme.spacing(3),
    gap: theme.spacing(3)
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  mapModalTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  closeMapButton: {
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(2),
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary
  }
});
