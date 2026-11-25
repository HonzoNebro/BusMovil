import { distanceLabel } from '@/services/distanceLabel';
import { RailScreen } from '@/components/RailScreen';
import { StopAccess } from '@/components/StopAccess';
import { StopDetail } from '@/components/StopMap/StopDetail';
import type { SearchStop } from '@/services/stopSearch';
import { useLanguage } from '@/i18n/Language';
import { Text, Pressable } from '@/i18n/Primitives';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import { CardBalance } from '@/components/CardBalance';
import { Information } from '@/components/Information';
import { useCardReader, type CardReading } from '@/hooks/useCardReader';
import { ArrivalList, ArrivalSelection } from '@/components/ArrivalList';
import { useFavoriteStops } from '@/hooks/useFavoriteStops';
import { StopMap } from '@/components/StopMap';
import { useBusDataContext } from '@/services/BusDataContext';
import { useNearestStop } from '@/hooks/useNearestStop';
import { Theme, useAppTheme } from '@/theme';

export default function HomeScreen(): JSX.Element {
  const { locale } = useLanguage();
  const [showRail, setShowRail] = useState(false);
  const [accessStop, setAccessStop] = useState<SearchStop>();
  const scrollFocus = useRef(false);
  const favorites = useFavoriteStops();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selection, setSelection] = useState<ArrivalSelection>({
    stopId: '1101',
    stopName: 'Plaza España',
    line: '1',
    directionId: '1-cortadura'
  });
  const [selectionOrigin, setSelectionOrigin] = useState<{
    kind: 'initial' | 'gps' | 'map' | 'manual' | 'direction';
    stopId: string;
  }>({ kind: 'initial', stopId: '1101' });
  const handleSelectionChange = useCallback((next: ArrivalSelection) => {
    setSelection(next);
    setSelectionOrigin((previous) =>
      previous.stopId === next.stopId
        ? previous
        : { kind: 'manual', stopId: next.stopId }
    );
  }, []);
  const handleDirectionStop = useCallback(
    (stopId: string) => setSelectionOrigin({ kind: 'direction', stopId }),
    []
  );
  const handleManualSelectStop = useCallback(
    (stopId: string) => setSelectionOrigin({ kind: 'manual', stopId }),
    []
  );
  const { snapshot, isLoading, error, refresh } = useBusDataContext();
  const {
    nearestStop,
    isRequesting,
    error: locationError,
    requestLocation,
    status
  } = useNearestStop();
  const requestDirectionPosition = useCallback(
    async () => (await requestLocation())?.userPosition,
    [requestLocation]
  );
  const mapBackHandler = useRef<() => boolean>();
  const registerMapBackHandler = useCallback((handler?: () => boolean) => {
    mapBackHandler.current = handler;
  }, []);
  const [showInformation, setShowInformation] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [cardReading, setCardReading] = useState<CardReading>();
  const startupLocationRequested = useRef(false);
  const viewportHeight = useRef(0);
  const scrollOffset = useRef(0);
  const [isMapDetailVisible, setIsMapDetailVisible] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const nfcStatus = useCardReader(
    !isMapVisible && !showInformation && !accessStop && !showRail,
    (reading) => {
      setCardReading(reading);
      if (reading.status !== 'reading') setShowBalance(true);
    }
  );
  const [mapSelection, setMapSelection] = useState<
    { stopId: string; lineId: string } | undefined
  >();

  const defaultLinePriority = useMemo(() => ['1', '2', '3', '5', '7'], []);
  const [visibleMapLines, setVisibleMapLines] = useState(defaultLinePriority);
  const [focusRequest, setFocusRequest] = useState<{
    id: number;
    stopId: string;
    directionId?: string;
  }>();
  const nextFocusId = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const focusStopId = focusRequest?.stopId;
  const scrollToStop = useCallback((node: View) => {
    if (!scrollFocus.current || !contentRef.current) return;
    const generation = nextFocusId.current;
    node.measureLayout(
      contentRef.current,
      (_x, y) => {
        if (generation !== nextFocusId.current) return;
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
      },
      () => {}
    );
  }, []);
  const linePriority = useMemo(() => {
    if (!mapSelection) {
      return defaultLinePriority;
    }
    return [
      mapSelection.lineId,
      ...defaultLinePriority.filter((line) => line !== mapSelection.lineId)
    ];
  }, [defaultLinePriority, mapSelection]);

  const cancelPendingFocus = useCallback(() => {
    ++nextFocusId.current;
  }, []);
  const handleRequestLocation = useCallback(
    async (startup = false) => {
      scrollFocus.current = !startup;
      const requestId = ++nextFocusId.current;
      setMapSelection(undefined);
      const stop = await requestLocation();
      if (stop && nextFocusId.current === requestId) {
        setSelectionOrigin({ kind: 'gps', stopId: stop.stopId });
        setFocusRequest({ id: requestId, stopId: stop.stopId });
      }
    },
    [requestLocation]
  );
  useEffect(() => {
    if (startupLocationRequested.current) return;
    startupLocationRequested.current = true;
    void handleRequestLocation(true);
  }, [handleRequestLocation]);
  useEffect(
    () => () => {
      ++nextFocusId.current;
    },
    []
  );
  const revealSelectedStop = useCallback((node: View) => {
    if (!contentRef.current) return;
    const generation = nextFocusId.current;
    node.measureLayout(
      contentRef.current,
      (_x, y, _width, height) => {
        if (generation !== nextFocusId.current) return;
        const top = scrollOffset.current;
        const bottom = top + viewportHeight.current;
        const targetBottom = y + Math.min(height, 120);
        if (y < top + 16)
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - 16),
            animated: true
          });
        else if (targetBottom > bottom - 16)
          scrollRef.current?.scrollTo({
            y: Math.max(0, targetBottom - viewportHeight.current + 16),
            animated: true
          });
      },
      () => {}
    );
  }, []);

  const handleSelectStopFromMap = useCallback(
    ({
      stopId,
      lineId,
      directionId
    }: {
      stopId: string;
      lineId: string;
      directionId?: string;
    }) => {
      setMapSelection({ stopId, lineId });
      setSelectionOrigin({ kind: 'map', stopId });
      setFocusRequest({ id: ++nextFocusId.current, stopId, directionId });
      setIsMapVisible(false);
    },
    []
  );

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
        distance < 1000
          ? `${Math.round(distance)} m`
          : `${(distance / 1000).toFixed(1)} km`;

      return `Tu parada más cercana es ${nearestStop.label} (${formattedDistance}).`;
    }
    return 'Permite el acceso a la ubicación para sugerirte la parada más cercana.';
  })();

  const showLocationMessage =
    status === 'denied' ||
    status === 'unavailable' ||
    (selectionOrigin.kind === 'gps' && nearestStop?.accuracy === 'approximate');
  const selectedIsNearby =
    selectionOrigin.kind === 'gps' && nearestStop?.stopId === selection.stopId;

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        onLayout={(event) => {
          viewportHeight.current = event.nativeEvent.layout.height;
        }}
        onScroll={(event) => {
          scrollOffset.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View ref={contentRef} collapsable={false} style={styles.content}>
          <View style={styles.brandRow}>
            <View style={styles.brand}>
              <View
                style={styles.brandMark}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <View style={styles.busOutline}>
                  <View style={styles.busWindows}>
                    <View style={styles.busWindow} />
                    <View style={styles.busWindow} />
                  </View>
                  <View style={styles.busLights}>
                    <View style={styles.busLight} />
                    <View style={styles.busLight} />
                  </View>
                </View>
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text accessibilityRole="header" style={styles.wordmark}>
                  Transportes
                </Text>
                <Text
                  style={[styles.wordmark, { color: theme.colors.primary }]}
                >
                  Cádiz
                </Text>
              </View>
            </View>
          </View>
          <Text
            accessibilityRole="header"
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: theme.colors.textPrimary
            }}
          >
            Autobuses urbanos
          </Text>
          <StopAccess
            favorites={favorites}
            snapshot={snapshot}
            onBeginSearch={cancelPendingFocus}
            onSelect={(stop) => {
              cancelPendingFocus();
              setAccessStop(stop);
            }}
          />
          <View style={styles.locationCard}>
            <View style={styles.locationText}>
              <Text style={styles.eyebrow}>
                PARADA SELECCIONADA · {selection.stopId}
              </Text>
              <Text testID="selected-stop-name" style={styles.stopTitle}>
                {selection.stopName}
              </Text>
              <Text testID="selected-stop-origin" style={styles.distance}>
                {isRequesting
                  ? 'Buscando ubicación…'
                  : selectionOrigin.kind === 'gps'
                  ? 'Sugerida automáticamente por proximidad'
                  : selectionOrigin.kind === 'map'
                  ? 'Elegida en el mapa'
                  : selectionOrigin.kind === 'direction'
                  ? 'Sugerida por proximidad para este sentido'
                  : selectionOrigin.kind === 'manual'
                  ? 'Elegida en el recorrido'
                  : 'Selección inicial · usa tu ubicación para buscar la más cercana'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  favorites.favoriteIds.includes(selection.stopId)
                    ? 'Quitar de favoritos'
                    : 'Guardar en favoritos'
                }
                accessibilityState={{
                  selected: favorites.favoriteIds.includes(selection.stopId)
                }}
                disabled={!favorites.ready || favorites.saving}
                onPress={() => void favorites.toggleFavorite(selection.stopId)}
                style={({ pressed }) => ({
                  minHeight: 44,
                  justifyContent: 'center',
                  alignSelf: 'flex-start',
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: pressed
                    ? theme.colors.mutedSurface
                    : theme.colors.surface
                })}
              >
                <Text style={styles.dockLabel}>
                  {favorites.favoriteIds.includes(selection.stopId)
                    ? '★ Guardada'
                    : '☆ Guardar'}
                </Text>
              </Pressable>
              {selectedIsNearby && nearestStop ? (
                <Text testID="selected-stop-distance" style={styles.distance}>
                  {distanceLabel(nearestStop.distanceMeters, locale)} ·{' '}
                  {nearestStop.accuracy === 'approximate'
                    ? 'Ubicación aproximada'
                    : 'Parada cercana'}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Usar mi ubicación"
              disabled={isRequesting}
              onPress={() => handleRequestLocation()}
              style={styles.locationUpdate}
            >
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.targetIcon}
              >
                <View style={styles.targetDot} />
              </View>
              <Text style={styles.dockLabel}>
                {isRequesting ? 'Buscando…' : 'Actualizar ubicación'}
              </Text>
            </Pressable>
          </View>
          {showLocationMessage ? (
            <View style={styles.locationNotice}>
              {status === 'denied' || status === 'unavailable' ? (
                <Text style={styles.noticeText}>{locationStatusLabel}</Text>
              ) : null}
              {nearestStop?.accuracy === 'approximate' ? (
                <>
                  <Text style={styles.noticeText}>
                    Ubicación aproximada: la parada sugerida puede variar
                  </Text>
                  <Text style={styles.noticeText}>
                    Fecha de la ubicación aproximada:{' '}
                    {new Date(nearestStop.observedAt).toLocaleString(locale)}.
                    Puede no coincidir con tu posición actual.
                  </Text>
                </>
              ) : null}
              {locationError ? (
                <Text accessibilityRole="alert" style={styles.locationError}>
                  {locationError}
                </Text>
              ) : null}
            </View>
          ) : null}
          <ArrivalList
            arrivals={snapshot?.arrivals ?? []}
            focusRequest={focusRequest}
            onFocusStop={scrollToStop}
            onRevealStop={revealSelectedStop}
            onRefresh={refresh}
            dataError={error}
            onCancelFocus={cancelPendingFocus}
            staleStopIds={snapshot?.failedStopIds ?? []}
            linePriority={linePriority}
            userPosition={nearestStop?.userPosition}
            onRequestUserPosition={requestDirectionPosition}
            onSelectNearbyStop={handleDirectionStop}
            onSelectionChange={handleSelectionChange}
            onManualSelectStop={handleManualSelectStop}
            isLoading={isLoading}
          />
          {snapshot ? (
            <View style={styles.footer}>
              <Text style={styles.timestamp}>
                Última actualización:{' '}
                {new Date(snapshot.generatedAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.dock} testID="main-action-bar">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Consultar saldo de la tarjeta"
          onPress={() => {
            setCardReading(undefined);
            setShowBalance(true);
          }}
          style={styles.dockButton}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.cardGlyph}
          >
            <View style={styles.cardStripe} />
          </View>
          <Text style={styles.dockLabel}>Saldo</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver mapa de paradas"
          onPress={() => setIsMapVisible(true)}
          style={styles.dockButton}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.mapGlyph}
          >
            <View style={[styles.mapPanel, styles.mapPanelLeft]} />
            <View style={[styles.mapPanel, styles.mapPanelMiddle]} />
            <View style={[styles.mapPanel, styles.mapPanelLeft]} />
          </View>
          <Text style={styles.dockLabel}>Mapa</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Otros transportes"
          style={styles.dockButton}
          onPress={() => {
            cancelPendingFocus();
            setShowRail(true);
          }}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.busOutline,
              { borderColor: theme.colors.primary, width: 20, height: 22 }
            ]}
          >
            <View style={styles.busWindows}>
              <View
                style={[
                  styles.busWindow,
                  { backgroundColor: theme.colors.primary }
                ]}
              />
              <View
                style={[
                  styles.busWindow,
                  { backgroundColor: theme.colors.primary }
                ]}
              />
            </View>
            <View style={styles.busLights}>
              <View
                style={[
                  styles.busLight,
                  { backgroundColor: theme.colors.primary }
                ]}
              />
              <View
                style={[
                  styles.busLight,
                  { backgroundColor: theme.colors.primary }
                ]}
              />
            </View>
          </View>
          <Text style={styles.dockLabel}>Otros transportes</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Información y opciones"
          onPress={() => setShowInformation(true)}
          style={styles.dockButton}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.clockIcon}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: 13,
                fontWeight: '700'
              }}
            >
              i
            </Text>
          </View>
          <Text style={styles.dockLabel}>Información y opciones</Text>
        </Pressable>
      </View>
      {accessStop ? (
        <Modal
          visible
          animationType="slide"
          onRequestClose={() => setAccessStop(undefined)}
        >
          <View style={styles.mapModalContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver a Líneas y llegadas"
              style={styles.closeMapButton}
              onPress={() => setAccessStop(undefined)}
            >
              <Text style={styles.mapButtonText}>‹ Líneas y llegadas</Text>
            </Pressable>
            <StopDetail
              stop={accessStop}
              favorites={favorites}
              snapshot={snapshot}
              isLoading={isLoading}
              dataError={error}
              onRefresh={refresh}
            />
          </View>
        </Modal>
      ) : null}
      <CardBalance
        visible={showBalance}
        onClose={() => setShowBalance(false)}
        status={nfcStatus}
        reading={cardReading}
      />
      {showRail ? (
        <RailScreen
          position={nearestStop?.userPosition}
          onClose={() => setShowRail(false)}
        />
      ) : null}
      <Information
        userPosition={nearestStop?.userPosition}
        visible={showInformation}
        onClose={() => setShowInformation(false)}
      />

      <Modal
        visible={isMapVisible}
        animationType="slide"
        onRequestClose={() => {
          if (!mapBackHandler.current?.()) setIsMapVisible(false);
        }}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isMapDetailVisible
                  ? 'Volver al mapa'
                  : 'Volver a Líneas y llegadas'
              }
              onPress={() => {
                if (isMapDetailVisible) mapBackHandler.current?.();
                else setIsMapVisible(false);
              }}
              style={({ pressed }) => [
                styles.closeMapButton,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.mapButtonText}>
                ‹ {isMapDetailVisible ? 'Mapa de paradas' : 'Líneas y llegadas'}
              </Text>
            </Pressable>
            {!isMapDetailVisible ? (
              <Text style={styles.mapModalTitle}>Mapa de paradas</Text>
            ) : null}
          </View>
          <StopMap
            onDetailChange={setIsMapDetailVisible}
            onBackHandlerChange={registerMapBackHandler}
            favorites={favorites}
            snapshot={snapshot}
            isLoading={isLoading}
            dataError={error}
            onRefresh={refresh}
            visibleLineIds={visibleMapLines}
            onVisibleLinesChange={setVisibleMapLines}
            focusStopId={focusStopId}
            onSelectStop={handleSelectStopFromMap}
          />
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: { flex: 1 },
    dock: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 6,
      paddingHorizontal: 8,
      gap: 6
    },
    dockButton: {
      flex: 1,
      minHeight: 58,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 12
    },
    locationUpdate: {
      minHeight: 48,
      padding: 8,
      gap: 6,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 115
    },
    cardGlyph: {
      width: 25,
      height: 18,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 4,
      justifyContent: 'center'
    },
    cardStripe: { height: 3, backgroundColor: theme.colors.primary },
    dockLabel: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center'
    },
    clockIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center'
    },
    clockHand: {
      width: 6,
      height: 7,
      borderLeftWidth: 1.5,
      borderBottomWidth: 1.5,
      borderColor: theme.colors.primary,
      marginLeft: 3,
      marginBottom: 3
    },
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      paddingHorizontal: 22,
      paddingTop: 18,
      paddingBottom: 24,
      gap: 18
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      flexShrink: 1
    },
    brandMark: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center'
    },
    busOutline: {
      width: 16,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: theme.colors.onPrimary,
      padding: 2,
      justifyContent: 'space-between'
    },
    busWindows: { flexDirection: 'row', gap: 2 },
    busWindow: {
      flex: 1,
      height: 5,
      backgroundColor: theme.colors.onPrimary,
      borderRadius: 1
    },
    busLights: { flexDirection: 'row', justifyContent: 'space-between' },
    busLight: { width: 3, height: 2, backgroundColor: theme.colors.onPrimary },
    wordmark: {
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -1,
      color: theme.colors.textPrimary
    },
    city: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      color: theme.colors.textSecondary
    },
    locationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 15
    },
    locationText: { flex: 1, minWidth: 0, gap: 3 },
    eyebrow: {
      fontSize: 11,
      letterSpacing: 1,
      color: theme.colors.textSecondary,
      fontWeight: '600'
    },
    stopTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.4
    },
    distance: { fontSize: 12, color: theme.colors.textSecondary },
    locationNotice: { gap: 4, paddingHorizontal: 2 },
    noticeText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 18
    },
    locationError: {
      fontSize: 13,
      color: theme.colors.warning,
      lineHeight: 19
    },
    locationButton: {
      flexDirection: 'row',
      gap: 12,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      paddingVertical: 13,
      paddingHorizontal: 14
    },
    locationButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary
    },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.5 },
    mapButton: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 48,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    targetIcon: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center'
    },
    targetDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary
    },
    mapGlyph: { flexDirection: 'row', padding: 2 },
    mapPanel: {
      width: 7,
      height: 18,
      borderWidth: 1.5,
      borderColor: theme.colors.primary
    },
    mapPanelLeft: { transform: [{ skewY: '-15deg' }] },
    mapPanelMiddle: { transform: [{ skewY: '15deg' }] },
    mapButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary
    },
    errorBox: {
      gap: 6,
      padding: 15,
      borderRadius: 16,
      backgroundColor: theme.colors.warningSurface
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.warning
    },
    error: { fontSize: 13, color: theme.colors.warning, lineHeight: 20 },
    retry: { minHeight: 44, justifyContent: 'center' },
    retryText: { fontSize: 13, fontWeight: '700', color: theme.colors.warning },
    footer: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingTop: 2
    },
    timestamp: { fontSize: 11, color: theme.colors.textSecondary },
    mapModalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: 24,
      paddingHorizontal: 18,
      paddingBottom: 18,
      gap: 15
    },
    mapModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    closeMapButton: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.surface
    },
    mapModalTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      flex: 1
    }
  });
}
