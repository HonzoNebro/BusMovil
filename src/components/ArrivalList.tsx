import { useLanguage } from '@/i18n/Language';
import { distanceLabel } from '@/services/distanceLabel';
import { Text, Pressable } from '@/i18n/Primitives';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import {
  findNearbyStop,
  isFreshPosition,
  type NearbyStopResult,
  type UserPosition
} from '@/services/walkingStops';
import type { BusStopArrival } from '@/types/bus';
import { cadizLines, stopMetadata } from '@/services/cadizApi';
import { lineColors, lineTextColor, Theme, useAppTheme } from '@/theme';

export interface ArrivalSelection {
  stopId: string;
  stopName: string;
  line: string;
  directionId: string;
}
interface Props {
  arrivals: BusStopArrival[];
  userPosition?: UserPosition;
  onRequestUserPosition?: () => Promise<UserPosition | undefined>;
  onSelectNearbyStop?: (stopId: string) => void;
  dataError?: string;
  onRefresh?: () => void;
  onRevealStop?: (node: View) => void;
  focusRequest?: { id: number; stopId: string; directionId?: string };
  linePriority?: string[];
  staleStopIds?: string[];
  onFocusStop?: (node: View) => void;
  onCancelFocus?: () => void;
  onManualSelectStop?: (stopId: string) => void;
  onSelectionChange?: (selection: ArrivalSelection) => void;
  isLoading?: boolean;
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

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return NaN;
  }
  return hours * 60 + minutes;
}

function isWithinSchedule(
  nowMinutes: number,
  schedule?: { start: string; end: string }
): boolean {
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
  nowMinutes: number,
  stale = false
): string {
  if (stale) {
    return `Dato anterior: ${arrival.arrivalInMinutes} min (consulta ${new Date(
      arrival.observedAt
    ).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})`;
  }
  if (schedule && !isWithinSchedule(nowMinutes, schedule)) {
    return schedule.start;
  }

  if (arrival.arrivalInMinutes >= 31) {
    return formatAbsoluteTime(
      arrival.arrivalInMinutes,
      new Date(arrival.observedAt)
    );
  }

  return `${arrival.arrivalInMinutes} min`;
}

function groupArrivals(arrivals: BusStopArrival[]): LineSection[] {
  const arrivalsByConfigKey = arrivals.reduce<Map<string, BusStopArrival[]>>(
    (acc, arrival) => {
      const key = arrivalsKey(
        arrival.configuredLine,
        arrival.directionId,
        arrival.stopId
      );
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key)?.push(arrival);
      return acc;
    },
    new Map()
  );

  return cadizLines.map((lineConfig) => {
    const directions = lineConfig.directions.map((directionConfig) => {
      const stops = directionConfig.stops.map((stopConfig) => {
        const key = arrivalsKey(
          lineConfig.line,
          directionConfig.id,
          stopConfig.stopId
        );
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

        const arrivalsByActualLine = stopArrivals.reduce<
          Map<string, BusStopArrival[]>
        >((acc, arrival) => {
          if (!acc.has(arrival.line)) {
            acc.set(arrival.line, []);
          }
          acc.get(arrival.line)?.push(arrival);
          return acc;
        }, new Map());

        const primaryArrivals = (
          arrivalsByActualLine.get(lineConfig.line) ?? []
        ).slice(0, 3);

        const otherLineArrivals = Array.from(arrivalsByActualLine.entries())
          .filter(([actualLine]) => actualLine !== lineConfig.line)
          .map(([actualLine, items]) => ({
            line: actualLine,
            arrivals: items.slice(0, 3)
          }))
          .sort((a, b) =>
            a.line.localeCompare(b.line, 'es', { numeric: true })
          );

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
  });
}

export function ArrivalList({
  arrivals,
  focusRequest,
  linePriority,
  staleStopIds = [],
  onFocusStop,
  onCancelFocus,
  userPosition,
  onRequestUserPosition,
  onSelectNearbyStop,
  onSelectionChange,
  onManualSelectStop,
  onRevealStop,
  onRefresh,
  dataError,
  isLoading = false
}: Props): JSX.Element {
  const { locale } = useLanguage();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const sections = useMemo(() => groupArrivals(arrivals), [arrivals]);
  const staleIds = useMemo(() => new Set(staleStopIds), [staleStopIds]);
  const [selectedLine, setSelectedLine] = useState<string | undefined>('1');
  const [selectedDirection, setSelectedDirection] = useState<
    string | undefined
  >('1-cortadura');
  const [selectedStopId, setSelectedStopId] = useState('1101');
  const [showAllStops, setShowAllStops] = useState(false);
  const [expandedStops, setExpandedStops] = useState<Record<string, boolean>>(
    {}
  );
  const [nearbyAccess, setNearbyAccess] = useState<NearbyStopResult>();
  const [directionLookup, setDirectionLookup] = useState<
    'locating' | 'routing' | 'error'
  >();
  const directionGeneration = useRef(0);
  const directionController = useRef<AbortController>();
  useEffect(
    () => () => {
      ++directionGeneration.current;
      directionController.current?.abort();
    },
    []
  );
  const consumedFocus = useRef<number>();
  const pendingScroll = useRef<number>();
  const heroRef = useRef<View>(null);
  const selectedRowRef = useRef<View>(null);
  const pendingReveal = useRef<number>();
  const revealSequence = useRef(0);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const linePriorityOrder = useMemo(
    () => (linePriority?.length ? linePriority : ['1', '2', '3', '5', '7']),
    [linePriority]
  );
  const line = sections.find((item) => item.line === selectedLine);
  const direction = line?.directions.find(
    (item) => item.directionId === selectedDirection
  );
  const currentStop = direction?.stops.find(
    (stop) => stop.stopId === selectedStopId
  );
  const color = lineColors[selectedLine ?? '1'] ?? theme.colors.primary;
  const cancelFocus = () => {
    ++directionGeneration.current;
    directionController.current?.abort();
    setDirectionLookup(undefined);
    consumedFocus.current = focusRequest?.id;
    pendingScroll.current = undefined;
    pendingReveal.current = undefined;
    onCancelFocus?.();
  };
  const scrollPending = useCallback(() => {
    const pending = pendingScroll.current;
    if (pending === undefined || !heroRef.current || !onFocusStop) return;
    requestAnimationFrame(() => {
      if (pendingScroll.current !== pending || !heroRef.current) return;
      pendingScroll.current = undefined;
      onFocusStop(heroRef.current);
    });
  }, [onFocusStop]);
  const revealPending = useCallback(() => {
    const pending = pendingReveal.current;
    if (pending === undefined || !selectedRowRef.current || !onRevealStop)
      return;
    requestAnimationFrame(() => {
      if (pendingReveal.current !== pending || !selectedRowRef.current) return;
      pendingReveal.current = undefined;
      onRevealStop(selectedRowRef.current);
    });
  }, [onRevealStop]);
  useEffect(() => {
    revealPending();
  }, [showAllStops, selectedStopId, revealPending]);
  useEffect(() => {
    if (!focusRequest || consumedFocus.current === focusRequest.id) return;
    const candidate = linePriorityOrder
      .map((id) =>
        sections.find(
          (item) =>
            item.line === id &&
            item.directions.some((d) =>
              d.stops.some((stop) => stop.stopId === focusRequest.stopId)
            )
        )
      )
      .find(Boolean);
    const choices = candidate?.directions.filter((d) =>
      d.stops.some((stop) => stop.stopId === focusRequest.stopId)
    );
    // At a terminus prefer the departure direction to the direction ending at that stop.
    const nextDirection =
      choices?.find((d) => d.directionId === focusRequest.directionId) ??
      choices?.find((d) => d.stops[0]?.stopId === focusRequest.stopId) ??
      choices?.[0];
    if (!candidate || !nextDirection) return;
    consumedFocus.current = focusRequest.id;
    pendingScroll.current = focusRequest.id;
    setSelectedLine(candidate.line);
    setSelectedDirection(nextDirection.directionId);
    ++directionGeneration.current;
    directionController.current?.abort();
    setDirectionLookup(undefined);
    setNearbyAccess(undefined);
    setSelectedStopId(focusRequest.stopId);
    pendingReveal.current = undefined;
    setShowAllStops(false);
    setExpandedStops({});
  }, [focusRequest, linePriorityOrder, sections]);
  useEffect(() => {
    scrollPending();
  }, [
    selectedLine,
    selectedDirection,
    selectedStopId,
    focusRequest,
    scrollPending
  ]);
  const stopName = currentStop?.stopName;
  const stopId = currentStop?.stopId;
  useEffect(() => {
    if (stopId && stopName && selectedLine && selectedDirection) {
      onSelectionChange?.({
        stopId,
        stopName,
        line: selectedLine,
        directionId: selectedDirection
      });
    }
  }, [stopId, stopName, selectedLine, selectedDirection, onSelectionChange]);

  const chooseDirection = async (next: DirectionSection) => {
    cancelFocus();
    setSelectedDirection(next.directionId);
    setShowAllStops(false);
    setExpandedStops({});
    setNearbyAccess(undefined);
    const generation = ++directionGeneration.current;
    const controller = new AbortController();
    directionController.current = controller;
    setDirectionLookup('locating');
    try {
      const position = isFreshPosition(userPosition)
        ? userPosition
        : await onRequestUserPosition?.();
      if (
        controller.signal.aborted ||
        generation !== directionGeneration.current
      )
        return;
      if (!position || !isFreshPosition(position)) {
        setDirectionLookup('error');
        return;
      }
      setDirectionLookup('routing');
      const stops = next.stops
        .map((stop) => stopMetadata[stop.stopId])
        .filter(Boolean);
      const result = await findNearbyStop(stops, position, controller.signal);
      if (
        controller.signal.aborted ||
        generation !== directionGeneration.current
      )
        return;
      if (!result) {
        setDirectionLookup('error');
        return;
      }
      setSelectedStopId(result.stop.stopId);
      setNearbyAccess(result);
      setDirectionLookup(undefined);
      onSelectNearbyStop?.(result.stop.stopId);
    } catch {
      if (
        !controller.signal.aborted &&
        generation === directionGeneration.current
      )
        setDirectionLookup('error');
    }
  };
  const chips = (
    <View style={styles.lineSelector}>
      <Text style={styles.heading}>Líneas</Text>
      <View style={styles.lines} accessibilityLabel="Seleccionar línea">
        {sections.map((item) => {
          const active = item.line === selectedLine;
          return (
            <Pressable
              key={item.line}
              accessibilityRole="button"
              accessibilityLabel={`Línea ${item.line}`}
              accessibilityState={{ selected: active }}
              testID={`line-${item.line}`}
              onPress={() => {
                cancelFocus();
                setSelectedLine(item.line);
                setSelectedDirection(undefined);
                setShowAllStops(false);
              }}
              style={({ pressed }) => [
                styles.chip,
                active && { backgroundColor: lineColors[item.line] },
                pressed && styles.pressed
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  active && { color: lineTextColor(item.line) }
                ]}
              >
                {item.line}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
  if (!line)
    return (
      <View style={styles.stack}>
        {chips}
        <Text style={styles.heading}>Selecciona una línea</Text>
      </View>
    );
  if (!direction) {
    return (
      <View style={styles.stack}>
        {chips}
        <Text style={styles.secondary}>Elige el sentido de tu viaje</Text>
        {line.directions.map((d) => {
          const summary = 'Buscar la parada más cercana en este sentido';
          return (
            <Pressable
              key={d.directionId}
              accessibilityRole="button"
              accessibilityLabel={d.directionName}
              onPress={() => chooseDirection(d)}
              style={({ pressed }) => [
                styles.directionOption,
                pressed && styles.pressed
              ]}
            >
              <View
                style={[styles.directionMark, { backgroundColor: color }]}
              />
              <View style={styles.flex}>
                <Text style={styles.destination}>{d.directionName}</Text>
                <Text style={styles.secondary}>{summary}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (directionLookup || !currentStop)
    return (
      <View style={styles.stack}>
        {chips}
        <Text style={styles.destination}>{direction.directionName}</Text>
        {directionLookup === 'locating' || directionLookup === 'routing' ? (
          <View style={styles.lookup}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.secondary}>
              {directionLookup === 'locating'
                ? 'Buscando tu ubicación…'
                : 'Buscando la parada más cercana para este sentido…'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.secondary}>
              No se pudo obtener una ubicación para buscar una parada de este
              sentido. Activa la ubicación y vuelve a intentarlo.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar búsqueda de parada cercana"
              onPress={() => void chooseDirection(direction)}
              style={styles.directionOption}
            >
              <Text style={styles.link}>Reintentar ubicación</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  const schedule = directionSchedules[direction.directionId];
  const stale =
    staleIds.has(currentStop.stopId) ||
    Boolean(dataError && !staleStopIds.length);
  const hasError = Boolean(dataError) || stale;
  const estimates = currentStop.primaryArrivals;
  const first = estimates[0];
  const label = first
    ? formatArrivalLabel(first, schedule, now, nowMinutes, stale)
    : '';
  const minuteLabel = /^\d+ min$/.test(label);
  const arriving = minuteLabel && first?.arrivalInMinutes === 0;
  const directionName = direction.directionName.replace(/^A\s+/, '');
  const currentIndex = direction.stops.findIndex(
    (stop) => stop.stopId === currentStop.stopId
  );
  const visibleStops = showAllStops ? direction.stops : [currentStop];
  const otherServices = sections
    .flatMap((section) =>
      section.directions.flatMap((d) => {
        const stop = d.stops.find((item) => item.stopId === currentStop.stopId);
        if (!stop || section.line === line.line) return [];
        return [
          {
            line: section.line,
            directionId: d.directionId,
            destination: d.directionName,
            arrival: stop.primaryArrivals[0]
          }
        ];
      })
    )
    .sort(
      (a, b) =>
        (stale ? Infinity : a.arrival?.arrivalInMinutes ?? Infinity) -
          (stale ? Infinity : b.arrival?.arrivalInMinutes ?? Infinity) ||
        Number(a.line) - Number(b.line)
    );

  return (
    <View style={styles.stack}>
      {chips}
      <View
        ref={heroRef}
        collapsable={false}
        onLayout={scrollPending}
        testID="arrival-hero"
        accessibilityLabel={`Parada ${currentStop.stopId}: ${currentStop.stopName}`}
        style={[styles.hero, { borderTopColor: color }]}
      >
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>LLEGADAS A ESTA PARADA</Text>
            <Text style={styles.destination}>
              {'Sentido: ' + directionName}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar llegadas"
            accessibilityHint={
              dataError ??
              'Se actualiza automáticamente cada minuto. Pulsa para actualizar ahora.'
            }
            disabled={isLoading}
            onPress={onRefresh}
            style={[styles.status, hasError && styles.staleStatus]}
          >
            <View
              style={[
                styles.liveDot,
                hasError && { backgroundColor: theme.colors.warning }
              ]}
            />
            <Text
              style={[
                styles.statusText,
                hasError && { color: theme.colors.warning }
              ]}
            >
              {hasError
                ? isLoading
                  ? 'Reintentando…'
                  : stale
                  ? 'Sin actualizar ↻'
                  : 'Actualización parcial ↻'
                : isLoading
                ? 'Actualizando'
                : first
                ? 'En directo ↻'
                : 'Sin llegadas ↻'}
            </Text>
          </Pressable>
        </View>
        {hasError ? (
          <Text accessibilityRole="alert" style={styles.warningCaption}>
            {stale
              ? 'Información sin actualizar. '
              : 'Algunas paradas no se han actualizado. '}
            Reintento automático cada minuto.
          </Text>
        ) : null}
        <Text style={styles.heroStop}>
          Parada {currentStop.stopId} · {currentStop.stopName}
        </Text>
        {nearbyAccess?.stop.stopId === currentStop.stopId ? (
          <View style={styles.accessInfo}>
            <Text style={styles.secondary}>
              {nearbyAccess.method === 'walking'
                ? (nearbyAccess.walkingSeconds! < 60
                    ? 'Menos de 1 min a pie'
                    : Math.ceil(nearbyAccess.walkingSeconds! / 60) +
                      ' min a pie') +
                  ' · ' +
                  distanceLabel(nearbyAccess.walkingMeters!, locale)
                : distanceLabel(nearbyAccess.straightDistanceMeters, locale)}
              {nearbyAccess.method === 'straight' ? (
                <Text>{' · '}En línea recta</Text>
              ) : null}
            </Text>
            {nearbyAccess.method === 'straight' ? (
              <Text style={styles.secondary}>
                {nearbyAccess.straightDistanceMeters > 5000
                  ? 'Ruta a pie no calculada para esta distancia.'
                  : 'Ruta a pie no disponible.'}
              </Text>
            ) : null}
            {nearbyAccess.position.accuracy === 'approximate' ? (
              <Text style={styles.secondary}>
                Ubicación aproximada: la parada sugerida puede variar
                {' · '}
                <Text>Desde tu ubicación de las</Text>{' '}
                {new Date(nearbyAccess.position.observedAt).toLocaleTimeString(
                  locale,
                  { hour: '2-digit', minute: '2-digit' }
                )}
              </Text>
            ) : null}
            {nearbyAccess.method === 'walking' ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => {
                  void Linking.openURL(
                    'https://www.openstreetmap.org/fixthemap'
                  ).catch(() => {});
                }}
                style={styles.touchLink}
              >
                <Text style={styles.routeAttribution}>
                  Ruta estimada · Valhalla / © OpenStreetMap · Corregir mapa ↗
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {stale ? (
          <View style={styles.historicalBox}>
            <Text style={styles.historicalTitle}>Datos anteriores</Text>
            <Text style={styles.historical}>
              {first
                ? label
                : 'No hay información actualizada para esta parada.'}
            </Text>
          </View>
        ) : first ? (
          <View style={styles.timeRow}>
            <Text
              testID="arrival-primary-time"
              style={[
                styles.time,
                (!minuteLabel || arriving) && styles.clockTime
              ]}
            >
              {arriving
                ? 'Llegando'
                : minuteLabel
                ? String(first.arrivalInMinutes)
                : label}
            </Text>
            {minuteLabel && !arriving ? (
              <Text style={styles.timeUnit}>min</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyHero}>
            <Text style={styles.noArrival}>
              {isLoading ? 'Consultando llegadas…' : 'Sin próximas llegadas'}
            </Text>
            {!isLoading &&
            schedule &&
            !isWithinSchedule(nowMinutes, schedule) ? (
              <Text style={styles.secondary}>
                Primer servicio a las {schedule.start}
              </Text>
            ) : null}
          </View>
        )}
        {!stale && estimates.length > 1 ? (
          <View style={styles.nextRow}>
            <Text style={styles.secondary}>Después</Text>
            {estimates.slice(1, 3).map((arrival, index) => (
              <Text
                key={`${arrival.observedAt}-${index}`}
                style={styles.nextTime}
              >
                {index ? '·  ' : ''}
                {formatArrivalLabel(arrival, schedule, now, nowMinutes)}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      {otherServices.length ? (
        <View style={styles.otherServices}>
          <Text style={styles.heading}>También pasan por esta parada</Text>
          {otherServices.map((service) => (
            <Pressable
              key={service.line + service.directionId}
              accessibilityRole="button"
              accessibilityLabel={
                'Ver línea ' + service.line + ' en esta parada'
              }
              style={styles.serviceRow}
              onPress={() => {
                cancelFocus();
                setSelectedLine(service.line);
                setSelectedDirection(service.directionId);
                setExpandedStops({});
                setShowAllStops(false);
              }}
            >
              <View
                style={[
                  styles.otherLineBadge,
                  { backgroundColor: lineColors[service.line] }
                ]}
              >
                <Text
                  style={{
                    color: lineTextColor(service.line),
                    fontWeight: '700'
                  }}
                >
                  {service.line}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.secondary}>{service.destination}</Text>
              </View>
              <Text style={styles.link}>
                {stale
                  ? 'Dato anterior'
                  : service.arrival
                  ? formatArrivalLabel(
                      service.arrival,
                      undefined,
                      now,
                      nowMinutes
                    )
                  : 'Sin llegadas'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.row}>
        <Text style={styles.heading}>Recorrido</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            showAllStops ? 'Mostrar menos paradas' : 'Ver todas las paradas'
          }
          accessibilityState={{ expanded: showAllStops }}
          onPress={() => {
            cancelFocus();
            pendingReveal.current = ++revealSequence.current;
            setShowAllStops(!showAllStops);
          }}
          style={styles.touchLink}
        >
          <Text style={styles.link}>
            {showAllStops ? 'Mostrar menos' : 'Ver recorrido →'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.timeline}>
        {visibleStops.length > 1 ? (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.routeShaft} />
            <View style={styles.routeArrowHead} />
          </View>
        ) : null}
        {visibleStops.map((stop) => {
          const key = `${line.line}:${direction.directionId}:${stop.stopId}`;
          const current = stop.stopId === currentStop.stopId;
          const expanded = !!expandedStops[key];
          const stopStale = staleIds.has(stop.stopId);
          return (
            <View
              key={key}
              testID={current ? 'selected-route-stop' : undefined}
              ref={current ? selectedRowRef : undefined}
              collapsable={false}
              onLayout={current ? revealPending : undefined}
              style={styles.stop}
            >
              <View
                style={[
                  styles.dot,
                  current && { backgroundColor: color, borderColor: color }
                ]}
              />
              <View style={styles.stopBody}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${stop.stopId} · ${stop.stopName}`}
                  accessibilityState={{ selected: current, expanded }}
                  onPress={() => {
                    cancelFocus();
                    setSelectedStopId(stop.stopId);
                    setNearbyAccess(undefined);
                    onManualSelectStop?.(stop.stopId);
                    setExpandedStops((previous) =>
                      previous[key] ? {} : { [key]: true }
                    );
                  }}
                  style={styles.stopButton}
                >
                  <View style={styles.flex}>
                    <Text
                      style={[styles.stopName, current && styles.selectedStop]}
                    >
                      {stop.stopName}
                    </Text>
                    <Text style={styles.stopMeta}>
                      Parada {stop.stopId}
                      {current ? ' · Seleccionada' : ''}
                    </Text>
                  </View>
                  <Text style={styles.stopAffordance}>
                    {expanded ? '−' : '+'}
                  </Text>
                </Pressable>
                {expanded ? (
                  <View style={styles.stopDetails}>
                    {stop.primaryArrivals.length ? (
                      stop.primaryArrivals.map((arrival, i) => (
                        <View key={i} style={styles.estimateRow}>
                          <Text style={styles.estimateLine}>
                            Línea {line.line}
                          </Text>
                          <Text
                            style={
                              stopStale
                                ? styles.historical
                                : styles.estimateTime
                            }
                          >
                            {formatArrivalLabel(
                              arrival,
                              schedule,
                              now,
                              nowMinutes,
                              stopStale
                            )}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.secondary}>
                        {stopStale
                          ? 'No hay información actualizada para esta parada.'
                          : `Sin próximas llegadas para la línea ${line.line}`}
                      </Text>
                    )}
                    {stop.otherLineArrivals.map((other) => (
                      <View key={other.line} style={styles.otherLine}>
                        <View style={styles.otherLineHeader}>
                          <Text style={styles.secondary}>También pasa</Text>
                          <View
                            style={[
                              styles.otherLineBadge,
                              {
                                backgroundColor:
                                  lineColors[other.line] ?? theme.colors.primary
                              }
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '700',
                                color: lineTextColor(other.line)
                              }}
                            >
                              Línea {other.line}
                            </Text>
                          </View>
                        </View>
                        {other.arrivals.map((arrival, i) => (
                          <Text
                            key={i}
                            style={
                              stopStale
                                ? styles.historical
                                : styles.estimateTime
                            }
                          >
                            {formatArrivalLabel(
                              arrival,
                              undefined,
                              now,
                              nowMinutes,
                              stopStale
                            )}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
        {!showAllStops && currentIndex === direction.stops.length - 1 ? (
          <Text style={styles.secondary}>
            Fin de este sentido. Puedes cambiar el sentido del recorrido.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    stack: { gap: 18 },
    lookup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16
    },
    accessInfo: { gap: 4 },
    routeAttribution: { fontSize: 11, color: theme.colors.textSecondary },
    warningCaption: {
      color: theme.colors.warning,
      fontSize: 12,
      lineHeight: 18
    },
    otherServices: { gap: 8 },
    serviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      minHeight: 48
    },
    routeShaft: {
      position: 'absolute',
      left: 6,
      top: 22,
      bottom: 10,
      width: 1.5,
      backgroundColor: theme.colors.textSecondary
    },
    routeArrowHead: {
      position: 'absolute',
      left: 2.5,
      bottom: 8,
      width: 8,
      height: 8,
      borderRightWidth: 1.5,
      borderBottomWidth: 1.5,
      borderColor: theme.colors.textSecondary,
      transform: [{ rotate: '45deg' }]
    },
    lineSelector: { gap: 10 },
    flex: { flex: 1, minWidth: 0 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8
    },
    lines: { flexDirection: 'row', gap: 9 },
    chip: {
      flex: 1,
      minHeight: 46,
      maxWidth: 62,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8
    },
    chipText: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textSecondary
    },
    pressed: { opacity: 0.7 },
    heading: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary
    },
    secondary: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      flexShrink: 1
    },
    hero: {
      borderTopWidth: 5,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 10,
      gap: 10
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap'
    },
    badge: {
      minWidth: 42,
      minHeight: 42,
      borderRadius: 11,
      padding: 6,
      alignItems: 'center',
      justifyContent: 'center'
    },
    badgeText: { fontSize: 24, fontWeight: '800' },
    eyebrow: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      letterSpacing: 1
    },
    destination: {
      fontSize: 19,
      color: theme.colors.textPrimary,
      fontWeight: '700',
      flexShrink: 1
    },
    heroStop: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 19
    },
    status: {
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
      minHeight: 44,
      paddingVertical: 8,
      paddingHorizontal: 9,
      borderRadius: 20,
      backgroundColor: theme.colors.successSurface
    },
    staleStatus: { backgroundColor: theme.colors.warningSurface },
    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.success
    },
    statusText: {
      color: theme.colors.success,
      fontSize: 11,
      fontWeight: '600'
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 9,
      flexWrap: 'wrap',
      paddingVertical: 6
    },
    time: {
      fontSize: 82,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -4,
      fontVariant: ['tabular-nums'],
      lineHeight: 92
    },
    clockTime: { fontSize: 43, lineHeight: 60, letterSpacing: -1 },
    timeUnit: { fontSize: 23, color: theme.colors.textSecondary },
    nextRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    nextTime: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary
    },
    touchLink: { minHeight: 44, justifyContent: 'center', flexShrink: 1 },
    link: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
    emptyHero: { paddingVertical: 18, gap: 6 },
    noArrival: {
      fontSize: 22,
      color: theme.colors.textPrimary,
      fontWeight: '600'
    },
    historicalBox: { paddingVertical: 15, gap: 8 },
    historicalTitle: {
      fontSize: 21,
      fontWeight: '700',
      color: theme.colors.textPrimary
    },
    historical: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      flexShrink: 1,
      lineHeight: 20
    },
    directionOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 18,
      borderRadius: 18,
      backgroundColor: theme.colors.surface
    },
    directionMark: { width: 4, alignSelf: 'stretch', borderRadius: 3 },
    arrow: { fontSize: 24, color: theme.colors.textSecondary },
    timeline: { gap: 0 },
    stop: { paddingLeft: 27, position: 'relative' },
    dot: {
      position: 'absolute',
      left: 1,
      top: 16,
      width: 12,
      height: 12,
      borderWidth: 2,
      borderRadius: 7,
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border
    },
    stopBody: { paddingBottom: 12 },
    stopButton: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      minHeight: 44,
      gap: 10,
      paddingVertical: 8
    },
    stopName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      flexShrink: 1
    },
    selectedStop: { color: theme.colors.textPrimary, fontWeight: '700' },
    stopMeta: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 3 },
    stopAffordance: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      paddingTop: 2
    },
    stopDetails: { gap: 6, paddingVertical: 4 },
    estimateRow: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.mutedSurface,
      borderRadius: 10
    },
    estimateLine: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      flexShrink: 0
    },
    estimateTime: {
      fontSize: 14,
      color: theme.colors.success,
      fontWeight: '600',
      flexShrink: 1
    },
    otherLine: {
      gap: 6,
      padding: 10,
      backgroundColor: theme.colors.mutedSurface,
      borderRadius: 10
    },
    otherLineHeader: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    otherLineBadge: {
      minHeight: 26,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 13,
      justifyContent: 'center'
    }
  });
}
