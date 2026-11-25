import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../i18n/Primitives';
import { RechargeMap } from './RechargeMap';
import { navigateToPoint } from '../services/mapNavigation';
import { nearbyRecharge } from '../services/rechargePoints';
import { isFreshPosition, type UserPosition } from '../services/walkingStops';
import { useAppTheme } from '../theme';

export function RechargePoints({
  userPosition
}: {
  userPosition?: UserPosition;
}) {
  const theme = useAppTheme();
  const [query, setQuery] = useState('');
  const [mapError, setMapError] = useState(false);
  const [navigationError, setNavigationError] = useState(false);
  const position = isFreshPosition(userPosition) ? userPosition : undefined;
  const points = useMemo(
    () => [
      ...nearbyRecharge('urban', query, position),
      ...nearbyRecharge('consortium', query, position)
    ],
    [query, position]
  );
  const mapped = useMemo(
    () =>
      points.filter(
        (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
      ),
    [points]
  );
  const missing = points.length - mapped.length;
  const styles = StyleSheet.create({
    stack: { gap: 10 },
    input: {
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12,
      color: theme.colors.textPrimary
    },
    note: { fontSize: 12, color: theme.colors.textSecondary }
  });
  return (
    <View style={styles.stack}>
      <TextInput
        accessibilityLabel="Buscar punto de recarga"
        placeholder="Buscar por calle o establecimiento…"
        placeholderTextColor={theme.colors.textSecondary}
        value={query}
        style={styles.input}
        onChangeText={(value) => {
          setQuery(value);
          setMapError(false);
        }}
      />
      <RechargeMap
        points={mapped}
        position={position}
        onError={() => setMapError(true)}
        onNavigate={(id) => {
          const point = mapped.find((p) => p.id === id);
          if (!point) return;
          setNavigationError(false);
          void navigateToPoint(point).catch(() => setNavigationError(true));
        }}
      />
      {mapError ? (
        <Text accessibilityRole="alert" style={styles.note}>
          No se pudo cargar el mapa completo. Comprueba la conexión.
        </Text>
      ) : null}
      {navigationError ? (
        <Text accessibilityRole="alert" style={styles.note}>
          No se pudo abrir la aplicación de mapas o el enlace.
        </Text>
      ) : null}
      {query.trim() && !mapped.length ? (
        <Text style={styles.note}>
          Sin puntos localizados para esta búsqueda.
        </Text>
      ) : null}
      {missing > 0 ? (
        <Text style={styles.note}>
          {missing} puntos sin ubicación disponible.
        </Text>
      ) : null}
    </View>
  );
}
