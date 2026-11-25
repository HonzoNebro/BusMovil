import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  PanResponder,
  type PanResponderCallbacks,
  type GestureResponderEvent,
  type PanResponderGestureState
} from 'react-native';
import { it, expect, jest } from '@jest/globals';
import { PinchImage } from '../src/components/PinchImage';
it('tracks two-finger zoom, switches smoothly to one-finger dragging and resets', () => {
  let callbacks!: PanResponderCallbacks;
  const spy = jest
    .spyOn(PanResponder, 'create')
    .mockImplementation((config) => {
      callbacks = config;
      return { panHandlers: {} };
    });
  const event = (points: number[][]) =>
    ({
      nativeEvent: {
        touches: points.map(([x, y]) => ({ locationX: x, locationY: y }))
      }
    } as unknown as GestureResponderEvent);
  const state = {} as PanResponderGestureState;
  let tree!: renderer.ReactTestRenderer;
  try {
    act(() => {
      tree = renderer.create(
        <PinchImage
          source={{ uri: 'test' }}
          imageWidth={400}
          imageHeight={600}
          label="Plano"
          resetKey={0}
        />
      );
    });
    act(() =>
      tree.root.findByProps({ testID: 'pinch-image-viewport' }).props.onLayout({
        nativeEvent: { layout: { width: 400, height: 600 } }
      })
    );
    act(() =>
      callbacks.onPanResponderGrant!(
        event([
          [100, 300],
          [300, 300]
        ]),
        state
      )
    );
    act(() =>
      callbacks.onPanResponderMove!(
        event([
          [0, 300],
          [400, 300]
        ]),
        state
      )
    );
    const transform = () =>
      tree.root.findByProps({ testID: 'rail-plan-full' }).props.style.transform;
    expect(transform()[2].scale.__getValue()).toBe(2);
    act(() => callbacks.onPanResponderEnd!(event([[200, 300]]), state));
    act(() => callbacks.onPanResponderMove!(event([[250, 350]]), state));
    expect(transform()[0].translateX.__getValue()).toBe(50);
    expect(transform()[1].translateY.__getValue()).toBe(50);
    act(() =>
      tree.update(
        <PinchImage
          source={{ uri: 'test' }}
          imageWidth={400}
          imageHeight={600}
          label="Plano"
          resetKey={1}
        />
      )
    );
    expect(transform()[2].scale.__getValue()).toBe(1);
    expect(transform()[0].translateX.__getValue()).toBe(0);
  } finally {
    act(() => tree?.unmount());
    spy.mockRestore();
  }
});
