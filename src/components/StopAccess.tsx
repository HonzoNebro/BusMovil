import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { Text, TextInput, Pressable } from '../i18n/Primitives';
import { useAppTheme } from '../theme';
import {
  searchStops,
  stopIndex,
  type SearchStop
} from '../services/stopSearch';
import { stopArrivalLabel, type FavoriteState } from './StopMap/StopDetail';
import type { BusDataSnapshot } from '../types/bus';
import { useLanguage } from '../i18n/Language';
export function StopAccess({
  favorites,
  snapshot,
  onSelect,
  onBeginSearch
}: {
  favorites: FavoriteState;
  snapshot?: BusDataSnapshot | null;
  onSelect: (stop: SearchStop) => void;
  onBeginSearch: () => void;
}) {
  const theme = useAppTheme();
  const { locale } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchStops(query), [query]);
  const styles = StyleSheet.create({
    stack: { gap: 9 },
    heading: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary
    },
    text: { fontSize: 12, color: theme.colors.textSecondary },
    link: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
    button: {
      minHeight: 48,
      justifyContent: 'center',
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.colors.surface
    },
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 80,
      minWidth: 155,
      maxWidth: 240,
      padding: 12,
      gap: 6,
      borderRadius: 14,
      backgroundColor: theme.colors.surface
    },
    name: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 20, gap: 14 },
    input: {
      minHeight: 48,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      color: theme.colors.textPrimary
    },
    item: {
      padding: 15,
      gap: 7,
      borderRadius: 14,
      backgroundColor: theme.colors.surface
    }
  });
  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Buscar paradas"
        style={styles.button}
        onPress={() => {
          onBeginSearch();
          setQuery('');
          setVisible(true);
        }}
      >
        <Text style={styles.link}>⌕ Buscar parada, número o lugar</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.heading}>
        Tus paradas favoritas
      </Text>
      {!favorites.ready ? (
        <Text style={styles.text}>Cargando favoritos…</Text>
      ) : favorites.favoriteIds.length === 0 ? (
        <Text style={styles.text}>
          Guarda una parada con la estrella para tenerla aquí.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {favorites.favoriteIds.map((id) => {
            const stop = stopIndex.find((s) => s.stopId === id);
            if (!stop) return null;
            const arrivals = (snapshot?.arrivals ?? [])
              .filter((a) => a.stopId === id)
              .sort((a, b) => a.arrivalInMinutes - b.arrivalInMinutes);
            const first = arrivals[0];
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`Favorita ${stop.label}`}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { backgroundColor: theme.colors.mutedSurface }
                ]}
                onPress={() => onSelect(stop)}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <Text style={[styles.name, { flex: 1 }]}>★ {stop.label}</Text>
                  <Text
                    accessible={false}
                    style={[styles.link, { fontSize: 24 }]}
                  >
                    ›
                  </Text>
                </View>
                <Text style={styles.text}>
                  Parada {id} · {stop.lines.join(' · ')}
                </Text>
                <Text style={styles.link}>
                  {first
                    ? `${first.line} · ${stopArrivalLabel(
                        first,
                        Boolean(snapshot?.failedStopIds.includes(id)),
                        locale
                      )}`
                    : 'Sin próximas llegadas para esta parada.'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {favorites.error ? (
        <Text style={styles.text}>{favorites.error}</Text>
      ) : null}
      {visible ? (
        <Modal
          visible={visible}
          animationType="slide"
          onRequestClose={() => setVisible(false)}
        >
          <SafeAreaView style={styles.screen}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar búsqueda"
                onPress={() => setVisible(false)}
                style={styles.button}
              >
                <Text style={styles.link}>‹ Líneas y llegadas</Text>
              </Pressable>
              <TextInput
                autoFocus
                accessibilityLabel="Buscar parada, número o lugar"
                placeholder="Buscar parada, número o lugar"
                placeholderTextColor={theme.colors.textSecondary}
                value={query}
                onChangeText={setQuery}
                style={styles.input}
              />
              <Text style={styles.text}>
                Busca por nombre, número, línea o referencia de la parada.
              </Text>
              {query.trim() && !results.length ? (
                <Text style={styles.text}>Sin coincidencias</Text>
              ) : null}
              {results.map((stop) => (
                <Pressable
                  key={stop.stopId}
                  testID={`search-stop-${stop.stopId}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${stop.stopId} · ${stop.label}`}
                  style={styles.item}
                  onPress={() => {
                    setVisible(false);
                    onSelect(stop);
                  }}
                >
                  <Text style={styles.name}>{stop.label}</Text>
                  <Text style={styles.link}>
                    Parada {stop.stopId} · {stop.lines.join(' · ')}
                  </Text>
                  {stop.services.map((service) => (
                    <Text
                      key={service.lineId + service.directionId}
                      style={styles.text}
                    >
                      {service.lineId} · {service.destination}
                    </Text>
                  ))}
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
}
