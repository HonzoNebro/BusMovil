import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ArrivalList } from '@/components/ArrivalList';
import { BusMap } from '@/components/BusMap';
import { useBusDataContext } from '@/services/BusDataContext';
import { theme } from '@/theme';

export default function HomeScreen(): JSX.Element {
  const { snapshot, isLoading, error, refresh } = useBusDataContext();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      <Text style={styles.title}>Rastreo en tiempo real</Text>
      <Text style={styles.subtitle}>
        Consulta la posición actual de las líneas urbanas y el tiempo estimado de llegada a tus
        paradas favoritas.
      </Text>

      <View style={styles.mapWrapper}>
        <BusMap buses={snapshot?.buses ?? []} isLoading={isLoading} />
      </View>

      <ArrivalList arrivals={snapshot?.arrivals ?? []} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {snapshot ? (
        <Text style={styles.timestamp}>
          Última actualización: {new Date(snapshot.generatedAt).toLocaleTimeString()}
        </Text>
      ) : null}
    </ScrollView>
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
  mapWrapper: {
    height: 320,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  error: {
    fontSize: 14,
    color: theme.colors.warning
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right'
  }
});
