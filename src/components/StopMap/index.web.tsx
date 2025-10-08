import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

interface Props {
  lineId?: string;
  directionId?: string;
  focusStopId?: string;
}

export function StopMap(_: Props): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa no disponible en la vista web</Text>
      <Text style={styles.subtitle}>
        Usa la app móvil o un emulador nativo para ver el mapa interactivo de paradas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: '#E0E4EE',
    backgroundColor: theme.colors.surface,
    gap: theme.spacing(1),
    justifyContent: 'center'
  },
  title: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  subtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary
  }
});

export type StopMapProps = Props;
