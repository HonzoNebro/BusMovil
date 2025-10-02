import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { BusStopArrival } from '@/types/bus';
import { theme } from '@/theme';

interface Props {
  arrivals: BusStopArrival[];
}

export function ArrivalList({ arrivals }: Props): JSX.Element {
  if (!arrivals.length) {
    return (
      <View style={[styles.card, styles.emptyState]}>
        <Text style={styles.emptyTitle}>Sin datos de llegada</Text>
        <Text style={styles.emptySubtitle}>
          Aún no tenemos información de espera. Actualiza en unos segundos.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Próximas llegadas</Text>
      <FlatList
        data={arrivals}
        keyExtractor={(item) => `${item.stopId}-${item.line}`}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.line}>{item.line}</Text>
              <Text style={styles.destination}>{item.destination}</Text>
            </View>
            <View style={styles.itemFooter}>
              <Text style={styles.stopName}>{item.stopName}</Text>
              <Text style={styles.minutes}>{item.arrivalInMinutes} min</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing(2),
    gap: theme.spacing(1)
  },
  header: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  item: {
    gap: theme.spacing(0.5)
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  line: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary
  },
  destination: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stopName: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textPrimary
  },
  minutes: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.success
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E4EA',
    marginVertical: theme.spacing(1)
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center'
  }
});
