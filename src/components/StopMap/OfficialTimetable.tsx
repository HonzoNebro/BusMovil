import { Text, Pressable } from '@/i18n/Primitives';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native';
import { lineColors, lineTextColor, Theme, useAppTheme } from '../../theme';
import {
  departures,
  frequencyRows,
  HOUR_SCALE,
  OFFICIAL_TIMETABLE_URL
} from '../../services/officialTimetable';

export function OfficialTimetable({
  visible,
  onClose,
  returnLabel,
  initialSection = 'frequencies',
  singleSection = false
}: {
  visible: boolean;
  onClose: () => void;
  returnLabel: string;
  initialSection?: 'frequencies' | 'departures';
  singleSection?: boolean;
}) {
  const theme = useAppTheme();
  const { fontScale, width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [section, setSection] = useState<'frequencies' | 'departures'>(
    'frequencies'
  );
  const [zoom, setZoom] = useState(1);
  const [linkError, setLinkError] = useState(false);
  useEffect(() => {
    if (visible) {
      setSection(initialSection);
      setZoom(1);
    }
  }, [visible, initialSection]);
  if (!visible) return null;
  const departureWidth =
    Math.max(340, width - 36) * zoom * Math.max(1, fontScale);
  const chartWidth = 20 * 56 * zoom * Math.max(1, fontScale);
  const rowHeight = 46 * zoom * Math.max(1, fontScale);
  const labelWidth = 120 * zoom * Math.max(1, fontScale);
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={returnLabel}
            onPress={onClose}
            style={styles.button}
          >
            <Text style={styles.link}>‹ {returnLabel}</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            {singleSection
              ? section === 'frequencies'
                ? 'Frecuencias'
                : 'Primeras y últimas salidas'
              : 'Horarios y frecuencias'}
          </Text>
          <Text style={styles.note}>
            Ayuntamiento de Cádiz · documento vigente desde mayo de 2023.
            Incorporado el 29 de octubre de 2026.
          </Text>
          {!singleSection ? (
            <View style={styles.tabs}>
              {(['frequencies', 'departures'] as const).map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: section === item }}
                  onPress={() => {
                    setSection(item);
                    setZoom(1);
                  }}
                  style={[styles.tab, section === item && styles.activeTab]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      section === item && styles.activeLabel
                    ]}
                  >
                    {item === 'frequencies'
                      ? 'Frecuencias'
                      : 'Primeras y últimas salidas'}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Text style={styles.note}>
            {section === 'frequencies'
              ? 'Intervalos orientativos en minutos. La escala horaria conserva las franjas del gráfico oficial. * Solo julio y agosto.'
              : 'Salidas desde cada cabecera. Las últimas salidas después de medianoche corresponden al final de la jornada de servicio.'}
          </Text>
          <View style={styles.zoom}>
            <Text style={styles.note}>Desliza para consultar la tabla.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reducir tabla"
              disabled={zoom <= 1}
              onPress={() => setZoom(Math.max(1, zoom - 0.25))}
              style={styles.zoomButton}
            >
              <Text style={styles.link}>−</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ampliar tabla"
              disabled={zoom >= 2}
              onPress={() => setZoom(Math.min(2, zoom + 0.25))}
              style={styles.zoomButton}
            >
              <Text style={styles.link}>+</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            nestedScrollEnabled
            key={section}
            accessibilityLabel="Tabla de horarios oficial desplazable"
          >
            {section === 'frequencies' ? (
              <View
                testID="native-frequency-table"
                style={{ width: labelWidth + chartWidth }}
              >
                <View style={[styles.tableRow, { height: rowHeight }]}>
                  <Text
                    style={[
                      styles.cell,
                      { width: labelWidth, fontSize: 13 * zoom }
                    ]}
                  >
                    Línea · Día
                  </Text>
                  {Array.from({ length: 20 }, (_, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.cell,
                        {
                          width: 56 * zoom * Math.max(1, fontScale),
                          fontSize: 12 * zoom
                        }
                      ]}
                    >
                      {String((6 + i) % 24).padStart(2, '0')}:00
                    </Text>
                  ))}
                </View>
                {frequencyRows.map((row) => (
                  <View
                    key={row.line + row.day}
                    style={[styles.tableRow, { height: rowHeight }]}
                  >
                    <View style={[styles.rowLabel, { width: labelWidth }]}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: lineColors[row.line] }
                        ]}
                      >
                        <Text
                          style={{
                            fontWeight: '700',
                            color: lineTextColor(row.line),
                            fontSize: 13 * zoom
                          }}
                        >
                          {row.line}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.note,
                          { fontSize: 12 * zoom, lineHeight: 18 * zoom }
                        ]}
                      >
                        {row.day}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: chartWidth,
                        height: rowHeight,
                        position: 'relative'
                      }}
                    >
                      {row.bands.map(([start, end, value, seasonal], i) => (
                        <View
                          key={i}
                          style={[
                            styles.band,
                            {
                              left: Math.max(
                                0,
                                ((start - HOUR_SCALE.start) /
                                  (HOUR_SCALE.end - HOUR_SCALE.start)) *
                                  chartWidth
                              ),
                              width:
                                ((end - start) /
                                  (HOUR_SCALE.end - HOUR_SCALE.start)) *
                                chartWidth,
                              height: rowHeight,
                              borderLeftColor: lineColors[row.line]
                            }
                          ]}
                        >
                          <Text
                            accessibilityLabel={
                              'Línea ' +
                              row.line +
                              ', ' +
                              row.day +
                              ', ' +
                              value +
                              ' minutos' +
                              (seasonal ? ', solo julio y agosto' : '')
                            }
                            style={[styles.bandText, { fontSize: 13 * zoom }]}
                          >
                            {value}
                            {seasonal ? '*' : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View
                testID="native-departure-table"
                style={{ width: departureWidth }}
              >
                {departures.map((line) => (
                  <View key={line.line} style={styles.departureGroup}>
                    <Text
                      style={[
                        styles.lineHeading,
                        {
                          color: theme.colors.textPrimary,
                          borderLeftColor: lineColors[line.line],
                          borderLeftWidth: 4,
                          fontSize: 17 * zoom
                        }
                      ]}
                    >
                      Línea {line.line}
                    </Text>
                    <View style={styles.tableRow}>
                      {['Desde', 'Primera', 'Última'].map((label, i) => (
                        <Text
                          key={label}
                          style={[
                            styles.cell,
                            {
                              width: (i === 0 ? 0.5 : 0.25) * departureWidth,
                              fontSize: 13 * zoom,
                              fontWeight: '700'
                            }
                          ]}
                        >
                          {label}
                        </Text>
                      ))}
                    </View>
                    {line.rows.map((row, i) => (
                      <React.Fragment key={i}>
                        {i === 0 || line.rows[i - 1].days !== row.days ? (
                          <Text
                            style={[
                              styles.note,
                              {
                                padding: 10,
                                fontWeight: '700',
                                fontSize: 13 * zoom
                              }
                            ]}
                          >
                            {row.days}
                          </Text>
                        ) : null}
                        <View style={styles.tableRow}>
                          {[row.from, row.first, row.last].map((value, col) => (
                            <Text
                              key={col}
                              style={[
                                styles.cell,
                                {
                                  width:
                                    (col === 0 ? 0.5 : 0.25) * departureWidth,
                                  fontSize: 14 * zoom
                                }
                              ]}
                            >
                              {value}
                            </Text>
                          ))}
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
          {section === 'departures' ? (
            <Text style={styles.note}>
              Línea 7: en periodo estival, sábados y domingos, las últimas
              salidas son a las 22:40 de Paseo Marítimo y a las 23:05 de Simón
              Bolívar, según la nota del documento.
            </Text>
          ) : null}
          <Text style={styles.note}>
            Información de consulta. Las próximas llegadas de la app son
            estimaciones en tiempo real y se muestran por separado.
          </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Consultar documento original en la web (en español)"
            style={styles.button}
            onPress={() => {
              void Linking.openURL(OFFICIAL_TIMETABLE_URL).catch(() =>
                setLinkError(true)
              );
            }}
          >
            <Text style={styles.link}>
              Consultar documento original en la web (en español) ↗
            </Text>
          </Pressable>
          {linkError ? (
            <Text style={styles.note}>
              No se pudo abrir la página oficial. Comprueba la conexión.
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 18, gap: 14, paddingBottom: 28 },
    button: {
      minHeight: 44,
      justifyContent: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface
    },
    link: { fontSize: 15, fontWeight: '600', color: theme.colors.primary },
    title: { fontSize: 25, fontWeight: '700', color: theme.colors.textPrimary },
    note: {
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      flexShrink: 1
    },
    tabs: { flexDirection: 'row', gap: 8 },
    tab: {
      flex: 1,
      minHeight: 48,
      padding: 10,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface
    },
    activeTab: { backgroundColor: theme.colors.primary },
    tabLabel: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      color: theme.colors.textPrimary
    },
    activeLabel: { color: theme.colors.onPrimary },
    zoom: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    zoomButton: {
      minWidth: 44,
      minHeight: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface
    },
    cell: {
      padding: 10,
      minHeight: 46,
      color: theme.colors.textPrimary,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border
    },
    rowLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 5
    },
    badge: {
      minWidth: 24,
      minHeight: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 3
    },
    band: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderLeftWidth: 2,
      backgroundColor: theme.colors.mutedSurface
    },
    bandText: {
      color: theme.colors.textPrimary,
      fontVariant: ['tabular-nums']
    },
    departureGroup: { marginBottom: 18 },
    lineHeading: { fontWeight: '700', padding: 10 }
  });
}
