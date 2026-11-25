import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLanguage } from '../../i18n/Language';
import { buildRailMap } from './template';
import {
  destinationForTrip,
  stopsForLines,
  type RailLine,
  type RailSnapshot
} from '../../services/rail';
export function RailMap({
  lines,
  snapshot,
  now,
  stationId,
  onStation,
  onError
}: {
  lines: RailLine[];
  snapshot: RailSnapshot;
  now: number;
  stationId?: string;
  onStation: (id: string) => void;
  onError: () => void;
}) {
  const { language } = useLanguage();
  const ref = useRef<WebView>(null);
  const html = useMemo(() => buildRailMap(lines, language), [lines, language]);
  const stops = useMemo(() => stopsForLines(lines), [lines]);
  const payload = JSON.stringify({
    type: 'vehicles',
    stale: snapshot.failed.includes('vehicles'),
    now,
    items: (snapshot.vehicles?.items ?? [])
      .filter((v) => lines.includes(v.line))
      .map((v) => ({ ...v, destination: destinationForTrip(v.tripId) }))
  });
  const send = useCallback(() => ref.current?.postMessage(payload), [payload]);
  useEffect(send, [send]);
  const focus = useCallback(() => {
    if (stationId)
      ref.current?.postMessage(
        JSON.stringify({ type: 'focus', id: stationId })
      );
  }, [stationId]);
  useEffect(focus, [focus]);
  return (
    <View style={{ height: 300, borderRadius: 14, overflow: 'hidden' }}>
      <WebView
        ref={ref}
        testID="rail-map"
        source={{ html }}
        originWhitelist={['about:blank']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onLoadEnd={() => {
          send();
          focus();
        }}
        onError={onError}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'ready') {
              send();
              focus();
            }
            if (data.type === 'error') onError();
            if (data.type === 'station' && stops.some((s) => s.id === data.id))
              onStation(data.id);
          } catch {
            /*Ignore malformed bridge messages.*/
          }
        }}
      />
    </View>
  );
}
