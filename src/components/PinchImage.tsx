import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  View,
  type ImageSourcePropType,
  type GestureResponderEvent
} from 'react-native';
import {
  initialZoom,
  moveZoom,
  boundZoom,
  type ZoomFrame,
  type ZoomPoint,
  type ZoomTransform
} from '../services/imageZoom';
import { useLanguage } from '../i18n/Language';
import { translate } from '../i18n/strings';
export function PinchImage({
  source,
  imageWidth,
  imageHeight,
  label,
  resetKey
}: {
  source: ImageSourcePropType;
  imageWidth: number;
  imageHeight: number;
  label: string;
  resetKey: number;
}) {
  const { language } = useLanguage();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const fit = Math.min(
    (size.width || 1) / imageWidth,
    (size.height || 1) / imageHeight
  );
  const frame: ZoomFrame = {
    ...size,
    imageWidth: imageWidth * fit,
    imageHeight: imageHeight * fit
  };
  const current = useRef<ZoomTransform>({ ...initialZoom }),
    gesture = useRef<{ points: ZoomPoint[]; value: ZoomTransform }>();
  const scale = useRef(new Animated.Value(1)).current,
    x = useRef(new Animated.Value(0)).current,
    y = useRef(new Animated.Value(0)).current;
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const apply = (value: ZoomTransform) => {
    current.current = value;
    scale.setValue(value.scale);
    x.setValue(value.x);
    y.setValue(value.y);
  };
  const applyRef = useRef(apply);
  applyRef.current = apply;
  React.useEffect(() => {
    gesture.current = undefined;
    applyRef.current({ ...initialZoom });
  }, [resetKey, size.width, size.height]);
  const responder = useMemo(() => {
    const points = (event: GestureResponderEvent) =>
      event.nativeEvent.touches
        .slice(0, 2)
        .map((t) => ({ x: t.locationX, y: t.locationY }));
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        gesture.current = {
          points: points(event),
          value: { ...current.current }
        };
      },
      onPanResponderStart: (event) => {
        const next = points(event);
        if (!gesture.current || gesture.current.points.length !== next.length)
          gesture.current = { points: next, value: { ...current.current } };
      },
      onPanResponderMove: (event) => {
        const next = points(event),
          base = gesture.current;
        if (!base || base.points.length !== next.length) {
          gesture.current = { points: next, value: { ...current.current } };
          return;
        }
        applyRef.current(
          moveZoom(base.value, base.points, next, frameRef.current)
        );
      },
      onPanResponderEnd: (event) => {
        gesture.current = {
          points: points(event),
          value: { ...current.current }
        };
      },
      onPanResponderRelease: () => {
        gesture.current = undefined;
      },
      onPanResponderTerminate: () => {
        gesture.current = undefined;
      }
    });
  }, []);
  return (
    <View
      testID="pinch-image-viewport"
      {...responder.panHandlers}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
      style={{ flex: 1, overflow: 'hidden', backgroundColor: '#fff' }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={translate(label, language)}
      accessibilityHint={translate(
        'Amplía con dos dedos y desplaza con uno.',
        language
      )}
      accessibilityActions={[
        { name: 'increment', label: translate('Ampliar plano', language) },
        { name: 'decrement', label: translate('Reducir plano', language) }
      ]}
      onAccessibilityAction={(event) =>
        apply(
          boundZoom(
            {
              ...current.current,
              scale:
                current.current.scale +
                (event.nativeEvent.actionName === 'increment' ? 0.5 : -0.5)
            },
            frame
          )
        )
      }
    >
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
      >
        <Animated.Image
          testID="rail-plan-full"
          accessible={false}
          source={source}
          resizeMode="contain"
          style={{
            position: 'absolute',
            left: (size.width - frame.imageWidth) / 2,
            top: (size.height - frame.imageHeight) / 2,
            width: frame.imageWidth,
            height: frame.imageHeight,
            transform: [{ translateX: x }, { translateY: y }, { scale }]
          }}
        />
      </View>
    </View>
  );
}
