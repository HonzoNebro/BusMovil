import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BusStopArrival } from '@/types/bus';
import { cadizLines } from '@/services/cadizApi';
import { theme } from '@/theme';

interface Props {
  arrivals: BusStopArrival[];
  focusStopId?: string;
  linePriority?: string[];
}

interface StopLineArrivals {
  line: string;
  arrivals: BusStopArrival[];
}

interface StopSection {
  stopId: string;
  stopName: string;
  primaryArrivals: BusStopArrival[];
  otherLineArrivals: StopLineArrivals[];
}

interface DirectionSection {
  directionId: string;
  directionName: string;
  stops: StopSection[];
}

interface LineSection {
  line: string;
  directions: DirectionSection[];
}

interface NextArrivalSummary {
  arrival: BusStopArrival;
  stopId: string;
  stopName: string;
}

const arrivalsKey = (line: string, directionId: string, stopId: string) =>
  `${line}:${directionId}:${stopId}`;

const directionSchedules: Record<string, { start: string; end: string }> = {
  '1-plaza-espana': { start: '06:20', end: '01:10' },
  '1-cortadura': { start: '06:40', end: '01:30' },
  '2-plaza-espana': { start: '06:00', end: '23:30' },
  '2-barriada-loreto': { start: '06:00', end: '00:00' },
  '3-plaza-espana': { start: '06:00', end: '00:00' },
  '3-puntales': { start: '06:20', end: '00:20' },
  '5-plaza-espana': { start: '06:00', end: '00:10' },
  '5-zona-franca': { start: '06:00', end: '00:30' },
  '7-glorieta-ana-orantes': { start: '07:25', end: '22:05' },
  '7-simon-bolivar': { start: '07:00', end: '21:40' }
};

const limitedOperationStops = new Set(['9905', '1901']);

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return NaN;
  }
  return hours * 60 + minutes;
}

function isWithinSchedule(nowMinutes: number, schedule?: { start: string; end: string }): boolean {
  if (!schedule) {
    return true;
  }
  const startMinutes = parseTimeToMinutes(schedule.start);
  const endMinutes = parseTimeToMinutes(schedule.end);
  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
    return true;
  }
  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }
  return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
}

function formatAbsoluteTime(minutesFromNow: number, now: Date): string {
  const arrivalDate = new Date(now.getTime() + minutesFromNow * 60_000);
  return arrivalDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function formatArrivalLabel(
  arrival: BusStopArrival,
  schedule: { start: string; end: string } | undefined,
  now: Date,
  nowMinutes: number
): string {
  if (schedule && !isWithinSchedule(nowMinutes, schedule)) {
    return schedule.start;
  }

  if (arrival.arrivalInMinutes >= 31) {
    return formatAbsoluteTime(arrival.arrivalInMinutes, now);
  }

  return `${arrival.arrivalInMinutes} min`;
}

function formatDirectionSummary(
  nextArrival: NextArrivalSummary | undefined,
  schedule: { start: string; end: string } | undefined,
  now: Date,
  nowMinutes: number
): string {
  if (schedule && !isWithinSchedule(nowMinutes, schedule)) {
    return `Primer servicio ${schedule.start}`;
  }

  if (!nextArrival) {
    return 'No hay autobuses planificados';
  }

  const { arrival, stopName } = nextArrival;

  if (arrival.arrivalInMinutes >= 31) {
    return `${formatAbsoluteTime(arrival.arrivalInMinutes, now)} · ${stopName}`;
  }

  return `${arrival.arrivalInMinutes} min · ${stopName}`;
}

function groupArrivals(arrivals: BusStopArrival[]): LineSection[] {
  const arrivalsByConfigKey = arrivals.reduce<Map<string, BusStopArrival[]>>((acc, arrival) => {
    const key = arrivalsKey(arrival.configuredLine, arrival.directionId, arrival.stopId);
    if (!acc.has(key)) {
      acc.set(key, []);
    }
    acc.get(key)?.push(arrival);
    return acc;
  }, new Map());

  return cadizLines
    .map((lineConfig) => {
      const directions = lineConfig.directions.map((directionConfig) => {
        const stops = directionConfig.stops.map((stopConfig) => {
          const key = arrivalsKey(lineConfig.line, directionConfig.id, stopConfig.stopId);
          const rawArrivals = (arrivalsByConfigKey.get(key) ?? [])
            .slice()
            .sort((a, b) => a.arrivalInMinutes - b.arrivalInMinutes);

          const seenArrivals = new Set<string>();
          const stopArrivals = rawArrivals.filter((arrival) => {
            const dedupeKey = [
              arrival.line,
              arrival.directionId,
              arrival.directionName,
              arrival.configuredLine,
              arrival.stopId,
              arrival.stopName,
              arrival.destination,
              arrival.arrivalInMinutes
            ].join('|');

            if (seenArrivals.has(dedupeKey)) {
              return false;
            }

            seenArrivals.add(dedupeKey);
            return true;
          });

          const arrivalsByActualLine = stopArrivals.reduce<Map<string, BusStopArrival[]>>(
            (acc, arrival) => {
              if (!acc.has(arrival.line)) {
                acc.set(arrival.line, []);
              }
              acc.get(arrival.line)?.push(arrival);
              return acc;
            },
            new Map()
          );

          const primaryArrivals = (arrivalsByActualLine.get(lineConfig.line) ?? []).slice(0, 3);

          const otherLineArrivals = Array.from(arrivalsByActualLine.entries())
            .filter(([actualLine]) => actualLine !== lineConfig.line)
            .map(([actualLine, items]) => ({
              line: actualLine,
              arrivals: items.slice(0, 3)
            }))
            .sort((a, b) => a.line.localeCompare(b.line, 'es', { numeric: true }));

          return {
            stopId: stopConfig.stopId,
            stopName: stopConfig.label,
            primaryArrivals,
            otherLineArrivals
          };
        });

        return {
          directionId: directionConfig.id,
          directionName: directionConfig.name,
          stops
        };
      });

      return {
        line: lineConfig.line,
        directions
      };
    })
    .filter((section) =>
      section.directions.some((direction) =>
        direction.stops.some(
          (stop) => stop.primaryArrivals.length || stop.otherLineArrivals.length
        )
      )
    );
}

function pickNextArrival(
  direction: DirectionSection,
  schedule: { start: string; end: string } | undefined,
  nowMinutes: number
): NextArrivalSummary | undefined {
  if (schedule && !isWithinSchedule(nowMinutes, schedule)) {
    return undefined;
  }

  const pickBestArrival = (
    arrivals: BusStopArrival[] | undefined,
    stopId: string
  ): BusStopArrival | undefined => {
    if (!arrivals?.length) {
      return undefined;
    }

    for (const arrival of arrivals) {
      if (limitedOperationStops.has(stopId) && arrival.arrivalInMinutes > 30) {
        continue;
      }

      return arrival;
    }

    return undefined;
  };

  for (const stop of direction.stops) {
    const bestArrival = pickBestArrival(stop.primaryArrivals, stop.stopId);
    if (!bestArrival) {
      continue;
    }

    return {
      arrival: bestArrival,
      stopId: stop.stopId,
      stopName: stop.stopName
    };
  }

  return undefined;
}

export function ArrivalList({ arrivals, focusStopId, linePriority }: Props): JSX.Element {
  const sections = useMemo(() => groupArrivals(arrivals), [arrivals]);
  const [selectedLine, setSelectedLine] = useState<string | undefined>();
  const [selectedDirection, setSelectedDirection] = useState<string | undefined>();
  const [expandedStops, setExpandedStops] = useState<Record<string, boolean>>({});
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const linePriorityOrder = useMemo(
    () => (linePriority && linePriority.length ? [...linePriority] : ['1', '2', '3', '5', '7']),
    [linePriority]
  );
  const autoFocusRef = useRef<string | undefined>();

  const selectedLineSection = selectedLine
    ? sections.find((section) => section.line === selectedLine)
    : undefined;
  const selectedDirectionSection = selectedLineSection && selectedDirection
    ? selectedLineSection.directions.find((direction) => direction.directionId === selectedDirection)
    : undefined;

  useEffect(() => {
    if (!focusStopId || !sections.length) {
      return;
    }

    if (
      autoFocusRef.current === focusStopId &&
      selectedLineSection &&
      selectedDirectionSection &&
      selectedDirectionSection.stops.some((stop) => stop.stopId === focusStopId)
    ) {
      return;
    }

    const findSectionForLine = (line: string) =>
      sections.find(
        (section) =>
          section.line === line &&
          section.directions.some((direction) =>
            direction.stops.some((stop) => stop.stopId === focusStopId)
          )
      );

    const lineCandidate =
      linePriorityOrder
        .map((line) => findSectionForLine(line))
        .find((section): section is LineSection => Boolean(section)) ??
      sections.find((section) =>
        section.directions.some((direction) =>
          direction.stops.some((stop) => stop.stopId === focusStopId)
        )
      );

    if (!lineCandidate) {
      return;
    }

    const directionCandidate = lineCandidate.directions.find((direction) =>
      direction.stops.some((stop) => stop.stopId === focusStopId)
    );

    if (!directionCandidate) {
      return;
    }

    setSelectedLine(lineCandidate.line);
    setSelectedDirection(directionCandidate.directionId);
    setExpandedStops({
      [`${lineCandidate.line}:${directionCandidate.directionId}:${focusStopId}`]: true
    });
    autoFocusRef.current = focusStopId;
  }, [focusStopId, linePriorityOrder, sections, selectedDirectionSection, selectedLineSection]);

  if (!sections.length) {
    return (
      <View style={[styles.card, styles.emptyState]}>
        <Text style={styles.emptyTitle}>Sin datos de llegada</Text>
        <Text style={styles.emptySubtitle}>
          Aún no tenemos información de espera. Actualiza en unos segundos.
        </Text>
      </View>
    );
  }

  const renderLineSelection = () => (
    <View style={styles.card}>
      <Text style={styles.header}>Selecciona una línea</Text>
      {sections.map((section) => (
        <Pressable
          key={section.line}
          accessibilityRole="button"
          style={styles.lineOption}
          onPress={() => {
            setSelectedLine(section.line);
            setSelectedDirection(undefined);
            setExpandedStops({});
          }}
        >
          <Text style={styles.lineTitle}>Línea {section.line}</Text>
          <Text style={styles.lineSummary}>Toca para elegir sentido</Text>
        </Pressable>
      ))}
    </View>
  );

  if (!selectedLineSection) {
    return renderLineSelection();
  }

  const renderDirectionSelection = () => (
    <View style={styles.card}>
      <View style={styles.selectionHeader}>
        <Pressable
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => {
            setSelectedLine(undefined);
            setSelectedDirection(undefined);
            setExpandedStops({});
          }}
        >
          <Text style={styles.backButtonText}>‹ Líneas</Text>
        </Pressable>
        <Text style={styles.header}>Línea {selectedLineSection.line}</Text>
      </View>
      {selectedLineSection.directions.map((direction) => {
        const schedule = directionSchedules[direction.directionId];
        const nextArrival = pickNextArrival(direction, schedule, nowMinutes);
        const summaryLabel = formatDirectionSummary(nextArrival, schedule, now, nowMinutes);

        return (
          <Pressable
            key={direction.directionId}
            accessibilityRole="button"
            style={styles.directionOption}
            onPress={() => {
              setSelectedDirection(direction.directionId);
              setExpandedStops({});
            }}
          >
            <View style={styles.directionOptionHeader}>
              <Text style={styles.directionTitle}>{direction.directionName}</Text>
              <Text style={styles.directionSubtitle}>{summaryLabel}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  if (!selectedDirectionSection) {
    return renderDirectionSelection();
  }

  return (
    <View style={styles.card}>
      <View style={styles.selectionHeader}>
        <Pressable
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => {
            setSelectedDirection(undefined);
            setExpandedStops({});
          }}
        >
          <Text style={styles.backButtonText}>‹ Sentidos</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.secondaryBackButton}
          onPress={() => {
            setSelectedLine(undefined);
            setSelectedDirection(undefined);
            setExpandedStops({});
          }}
        >
          <Text style={styles.secondaryBackButtonText}>Cambiar línea</Text>
        </Pressable>
      </View>
      <Text style={styles.header}>Línea {selectedLineSection.line}</Text>
      <Text style={styles.directionBreadcrumb}>{selectedDirectionSection.directionName}</Text>
      {selectedDirectionSection.stops.map((stop) => {
        const stopKey = `${selectedLineSection.line}:${selectedDirectionSection.directionId}:${stop.stopId}`;
        const isExpanded = Boolean(expandedStops[stopKey]);
        const hasCustomName = !stop.stopName.startsWith('Parada ');
        const stopLabel = hasCustomName ? `${stop.stopId} · ${stop.stopName}` : stop.stopId;
        const schedule = directionSchedules[selectedDirectionSection.directionId];

        return (
          <View key={stop.stopId} style={styles.stopSection}>
            <Pressable
              accessibilityRole="button"
              style={styles.stopToggle}
              onPress={() =>
                setExpandedStops((prev) => ({
                  ...prev,
                  [stopKey]: !prev[stopKey]
                }))
              }
            >
              <Text style={styles.stopLabel}>{stopLabel}</Text>
              <Text style={styles.toggleIcon}>{isExpanded ? 'v' : '>'}</Text>
            </Pressable>
            {isExpanded ? (
              stop.primaryArrivals.length ? (
                stop.primaryArrivals.map((item, index) => {
                  const arrivalLabel = formatArrivalLabel(item, schedule, now, nowMinutes);
                  const isArrivingNow = arrivalLabel === 'Llegando';
                  return (
                    <View key={`${item.stopId}-${index}`} style={styles.item}>
                      <View style={styles.itemContent}>
                        <Text style={styles.destination}>Línea {selectedLineSection.line}</Text>
                      </View>
                      <Text style={isArrivingNow ? styles.arrivingBadge : styles.minutes}>
                        {arrivalLabel}
                      </Text>
                    </View>
                  );
                })
              ) : schedule && !isWithinSchedule(nowMinutes, schedule) ? (
                <Text style={styles.scheduleInfo}>Primer servicio a las {schedule.start}</Text>
              ) : (
                <Text style={styles.stopEmpty}>
                  Sin próximas llegadas para la línea {selectedLineSection.line}
                </Text>
              )
            ) : null}
            {isExpanded && stop.otherLineArrivals.length ? (
              <View style={styles.otherLinesContainer}>
                {stop.otherLineArrivals.map((other) => (
                  <View key={`${stop.stopId}-${other.line}`} style={styles.otherLineSection}>
                    <Text style={styles.otherLineLabel}>También pasa línea {other.line}</Text>
                    {other.arrivals.map((item, index) => {
                      const arrivalLabel = formatArrivalLabel(item, undefined, now, nowMinutes);
                      const isArrivingNow = arrivalLabel === 'Llegando';
                      return (
                        <View key={`${item.line}-${item.stopId}-${index}`} style={styles.item}>
                          <View style={styles.itemContent}>
                            <Text style={styles.destination}>Línea {other.line}</Text>
                          </View>
                          <Text style={isArrivingNow ? styles.arrivingBadge : styles.minutes}>
                            {arrivalLabel}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing(2),
    gap: theme.spacing(2)
  },
  header: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: {
    alignSelf: 'flex-start'
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary
  },
  secondaryBackButton: {
    alignSelf: 'flex-start'
  },
  secondaryBackButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary
  },
  lineOption: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(1.5),
    gap: theme.spacing(0.5)
  },
  lineTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary
  },
  lineSummary: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary
  },
  directionOption: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(1.5)
  },
  directionOptionHeader: {
    gap: theme.spacing(0.25)
  },
  directionTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  directionSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary
  },
  stopList: {
    marginTop: theme.spacing(1),
    gap: theme.spacing(1)
  },
  stopSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing(1)
  },
  stopToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stopLabel: {
    fontSize: 15,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(1.5)
  },
  itemContent: {
    flex: 1,
    gap: theme.spacing(0.25)
  },
  stopName: {
    fontSize: 15,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary
  },
  destination: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary
  },
  stopEmpty: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1)
  },
  scheduleInfo: {
    fontSize: 13,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1)
  },
  otherLinesContainer: {
    marginTop: theme.spacing(1),
    gap: theme.spacing(1)
  },
  otherLineSection: {
    gap: theme.spacing(0.75)
  },
  otherLineLabel: {
    fontSize: 13,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary
  },
  minutes: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.success,
    marginLeft: theme.spacing(2)
  },
  arrivingBadge: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.onPrimary,
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing(0.5),
    paddingHorizontal: theme.spacing(1.5),
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden'
  },
  toggleIcon: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing(1)
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E4EA33',
    marginVertical: theme.spacing(1.5)
  },
  directionBreadcrumb: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary
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
