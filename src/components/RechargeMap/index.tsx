import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import type { RechargePoint } from '../../services/rechargePoints';
import type { UserPosition } from '../../services/walkingStops';
import { useLanguage } from '../../i18n/Language';
import { buildRechargeMap } from './template';

export function RechargeMap({
  points,
  position,
  onNavigate,
  onError
}: {
  points: RechargePoint[];
  position?: UserPosition;
  onNavigate: (id: string) => void;
  onError: () => void;
}) {
  const { language } = useLanguage();
  const { height } = useWindowDimensions();
  const html = useMemo(
    () => buildRechargeMap(points, position, language),
    [points, position, language]
  );
  return (
    <View
      style={{
        height: Math.max(300, height - 270),
        borderRadius: 18,
        overflow: 'hidden'
      }}
    >
      <WebView
        testID="recharge-map"
        source={{ html }}
        originWhitelist={['about:blank']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        onError={onError}
        onHttpError={onError}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'error') onError();
            if (
              data.type === 'navigate' &&
              points.some((p) => p.id === data.id)
            )
              onNavigate(data.id);
          } catch {
            /* Ignore malformed messages. */
          }
        }}
      />
    </View>
  );
}
