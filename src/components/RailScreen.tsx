import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { Text, Pressable, TextInput } from '../i18n/Primitives';
import { useLanguage } from '../i18n/Language';
import { useAppTheme } from '../theme';
import { useRailData } from '../hooks/useRailData';
import {
  railCatalog,
  railArrivals,
  railFresh,
  stopsForLines,
  catalogValid,
  type RailLine
} from '../services/rail';
import type { UserPosition } from '../services/walkingStops';
import { isFreshPosition, straightDistance } from '../services/walkingStops';
import { RailPlan } from './RailPlan';
import { normalizeSearch } from '../services/stopSearch';
export function RailScreen({
  onClose,
  position
}: {
  onClose: () => void;
  position?: UserPosition;
}) {
  const theme = useAppTheme(),
    { locale } = useLanguage();
  const [filter, setFilter] = useState<RailLine>('C1'),
    [picker, setPicker] = useState(false),
    [query, setQuery] = useState('');
  const mode = filter === 'T1' ? 'tram' : 'commuter';
  const lines = useMemo<RailLine[]>(() => [filter], [filter]);
  const selectLine = (line: RailLine) => {
    const available = stopsForLines([line]);
    setFilter(line);
    setChosen((previous) => {
      if (available.some((stop) => stop.id === previous)) return previous;
      if (isFreshPosition(position))
        return [...available].sort(
          (a, b) =>
            straightDistance(position, { latitude: a.lat, longitude: a.lon }) -
            straightDistance(position, { latitude: b.lat, longitude: b.lon })
        )[0]?.id;
      return (
        available.find((stop) => stop.id === '51405')?.id ?? available[0]?.id
      );
    });
  };
  const stops = useMemo(() => stopsForLines(lines), [lines]);
  const [chosen, setChosen] = useState(() => {
    if (isFreshPosition(position)) {
      return [...stops].sort(
        (a, b) =>
          straightDistance(position, { latitude: a.lat, longitude: a.lon }) -
          straightDistance(position, { latitude: b.lat, longitude: b.lon })
      )[0]?.id;
    }
    return '51405';
  });
  const station = stops.find((s) => s.id === chosen) ?? stops[0];
  const { snapshot, loading, refresh, now } = useRailData(false);
  const arrivals = useMemo(
    () => (station ? railArrivals(station.id, lines, snapshot, now) : []),
    [station, lines, snapshot, now]
  );
  const stale =
    !railFresh(snapshot.updates?.observedAt, now) || snapshot.failed.length > 0;
  const formatDate = (key: string) =>
    new Date(
      key.slice(0, 4) +
        '-' +
        key.slice(4, 6) +
        '-' +
        key.slice(6, 8) +
        'T00:00:00Z'
    ).toLocaleDateString(locale, { timeZone: 'UTC' });
  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 20, gap: 14, paddingBottom: 32 },
    row: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    title: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary },
    text: { color: theme.colors.textPrimary, fontSize: 16 },
    note: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
    button: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12,
      minHeight: 44,
      justifyContent: 'center',
      backgroundColor: theme.colors.surface
    },
    link: { color: theme.colors.primary, fontWeight: '700', fontSize: 14 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 14,
      gap: 6
    },
    time: { fontWeight: '800', fontSize: 24, color: theme.colors.primary }
  });
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Transportes Cádiz"
            onPress={onClose}
            style={styles.button}
          >
            <Text style={styles.link}>‹ Transportes Cádiz</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            Cercanías y tranvía
          </Text>
          <View style={styles.row}>
            {(['C1', 'C1a', 'T1'] as const).map((line) => (
              <Pressable
                key={line}
                accessibilityRole="button"
                accessibilityState={{
                  selected: line === filter
                }}
                style={[
                  styles.button,
                  line === filter && {
                    backgroundColor: line === 'T1' ? '#608500' : '#c91736',
                    borderColor: line === 'T1' ? '#608500' : '#c91736'
                  }
                ]}
                onPress={() => selectLine(line)}
              >
                <Text
                  style={[styles.link, line === filter && { color: '#fff' }]}
                >
                  {line}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Elegir estación"
            testID="rail-station-selector"
            style={styles.button}
            onPress={() => {
              setPicker(true);
              setQuery('');
            }}
          >
            <Text style={styles.note}>Estación</Text>
            <Text style={styles.text}>{station?.name ?? '—'} ⌄</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar información ferroviaria"
            onPress={refresh}
            style={[
              styles.button,
              stale && { borderColor: theme.colors.warning }
            ]}
          >
            <Text
              style={[styles.link, stale && { color: theme.colors.warning }]}
            >
              {loading
                ? 'Actualizando…'
                : stale
                ? 'Sin actualizar ↻'
                : 'En directo ↻'}
            </Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.text}>
            Próximos trenes
          </Text>
          {arrivals.map((arrival) => (
            <View
              testID="rail-arrival"
              key={arrival.tripId}
              style={styles.card}
            >
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.link}>{arrival.line}</Text>
                <Text style={styles.time}>
                  {new Date(arrival.time).toLocaleTimeString(locale, {
                    timeZone: 'Europe/Madrid',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <Text style={styles.text}>
                {arrival.destination
                  ? 'A ' + arrival.destination
                  : 'Destino por confirmar'}
              </Text>
              <Text style={styles.note}>
                {arrival.live ? 'En directo' : 'Horario programado'}
                {arrival.live
                  ? ' · ' +
                    Math.max(0, Math.ceil((arrival.time - now) / 60000)) +
                    ' min'
                  : ''}
              </Text>
            </View>
          ))}
          {!arrivals.length ? (
            <Text style={styles.note}>
              {loading
                ? 'Consultando llegadas…'
                : 'Sin próximas llegadas en las próximas 3 horas.'}
            </Text>
          ) : null}
          {!catalogValid(now) ? (
            <Text accessibilityRole="alert" style={styles.note}>
              El catálogo de horarios ha caducado. Solo se muestran llegadas
              directas en tiempo real.
            </Text>
          ) : null}
          {stale && !loading ? (
            <Text style={styles.note}>
              Sin datos recientes de llegadas. Se muestran horarios programados
              cuando están disponibles.
            </Text>
          ) : null}
          <Text accessibilityRole="header" style={styles.text}>
            {mode === 'tram'
              ? 'Plano oficial de Trambahía'
              : 'Plano oficial de Cercanías'}
          </Text>
          <RailPlan mode={mode} />
          {snapshot.updates ? (
            <Text style={styles.note}>
              Última actualización:{' '}
              {new Date(snapshot.updates.observedAt).toLocaleTimeString(
                locale,
                { hour: '2-digit', minute: '2-digit' }
              )}
            </Text>
          ) : null}
          <Text style={styles.note}>
            Origen de los datos: Renfe Operadora · CC BY 4.0
          </Text>
          <Text style={styles.note}>
            Vigencia del catálogo: {formatDate(railCatalog.validFrom)} –{' '}
            {formatDate(railCatalog.validUntil)}
          </Text>
        </ScrollView>
        {picker ? (
          <Modal
            visible
            animationType="slide"
            onRequestClose={() => setPicker(false)}
          >
            <SafeAreaView style={styles.screen}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}
              >
                <Pressable
                  accessibilityRole="button"
                  style={styles.button}
                  onPress={() => setPicker(false)}
                >
                  <Text style={styles.link}>Cerrar búsqueda</Text>
                </Pressable>
                <TextInput
                  accessibilityLabel="Buscar estación"
                  placeholder="Buscar estación"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.button, styles.text]}
                  value={query}
                  onChangeText={setQuery}
                />
                {stops
                  .filter((s) =>
                    normalizeSearch(s.name).includes(normalizeSearch(query))
                  )
                  .map((stop) => (
                    <Pressable
                      key={stop.id}
                      accessibilityRole="button"
                      style={styles.button}
                      onPress={() => {
                        setChosen(stop.id);
                        setPicker(false);
                      }}
                    >
                      <Text style={styles.text}>{stop.name}</Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
