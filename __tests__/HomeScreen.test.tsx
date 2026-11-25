jest.mock('react-native-webview', () => ({ WebView: () => null }));
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Modal, Pressable, Text } from 'react-native';
import { afterEach, expect, it, jest } from '@jest/globals';
import { StopMap } from '../src/components/StopMap';
import HomeScreen from '../src/screens/HomeScreen';
import { useNearestStop, NearestStopResult } from '../src/hooks/useNearestStop';
import { stopMetadata } from '../src/services/cadizApi';

jest.mock('../src/hooks/useNearestStop', () => ({ useNearestStop: jest.fn() }));
jest.mock('../src/services/BusDataContext', () => ({
  useBusDataContext: () => ({
    snapshot: null,
    isLoading: false,
    refresh: jest.fn()
  })
}));
jest.mock('../src/components/StopMap', () => ({ StopMap: () => null }));
jest.mock('../src/services/walkingStops', () => {
  const actual = jest.requireActual<
    typeof import('../src/services/walkingStops')
  >('../src/services/walkingStops');
  return {
    ...actual,
    findNearbyStop: jest.fn(
      async (
        stops: import('../src/services/cadizApi').StopConfig[],
        position: import('../src/services/walkingStops').UserPosition
      ) => {
        const item = actual.closestCandidates(stops, position)[0];
        return item
          ? {
              stop: item.stop,
              straightDistanceMeters: item.distance,
              method: 'straight',
              candidateCount: 3,
              position
            }
          : undefined;
      }
    )
  };
});

let tree: renderer.ReactTestRenderer;
afterEach(() => {
  act(() => tree?.unmount());
  jest.clearAllMocks();
});
const label = (value: unknown) =>
  Array.isArray(value) ? value.join('') : value;
function button(text: string) {
  return tree.root
    .findAllByType(Pressable)
    .find(
      (node) =>
        node.props.accessibilityLabel === text ||
        node
          .findAllByType(Text)
          .some((node) => label(node.props.children) === text)
    )!;
}
it('does not override a manual line selection when a pending GPS request completes', async () => {
  let resolve!: (value: NearestStopResult) => void;
  const request = jest
    .fn<() => Promise<NearestStopResult | undefined>>()
    .mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
  jest.mocked(useNearestStop).mockReturnValue({
    requestLocation: request,
    status: 'idle',
    isRequesting: false
  });
  act(() => {
    tree = renderer.create(<HomeScreen />);
  });
  let pending: Promise<void>;
  act(() => {
    pending = button('Usar mi ubicación').props.onPress();
  });
  act(() => button('Línea 2').props.onPress());
  await act(async () => {
    resolve({
      ...stopMetadata['1101'],
      latitude: stopMetadata['1101'].latitude!,
      longitude: stopMetadata['1101'].longitude!,
      line: '1',
      directionId: '1-plaza-espana',
      directionName: 'A Plaza España',
      distanceMeters: 0,
      accuracy: 'precise',
      observedAt: Date.now()
    });
    await pending;
  });
  const labels = tree.root
    .findAllByType(Text)
    .map((node) => label(node.props.children));
  expect(
    tree.root.findByProps({ testID: 'line-2' }).props.accessibilityState
      .selected
  ).toBe(true);
  expect(labels).toContain('Elige el sentido de tu viaje');
  expect(tree.root.findAllByProps({ testID: 'arrival-hero' })).toHaveLength(0);
});

it('explains GPS selection, allows manual selection of the same stop, and exposes only one location action', async () => {
  const stop: NearestStopResult = {
    ...stopMetadata['1101'],
    latitude: stopMetadata['1101'].latitude!,
    longitude: stopMetadata['1101'].longitude!,
    line: '1',
    directionId: '1-cortadura',
    directionName: 'A Cortadura',
    distanceMeters: 0,
    accuracy: 'precise',
    observedAt: Date.now(),
    userPosition: {
      latitude: stopMetadata['1101'].latitude!,
      longitude: stopMetadata['1101'].longitude!,
      observedAt: Date.now(),
      accuracy: 'precise'
    }
  };
  const request = jest
    .fn<() => Promise<NearestStopResult>>()
    .mockResolvedValue(stop);
  jest.mocked(useNearestStop).mockReturnValue({
    nearestStop: stop,
    requestLocation: request,
    status: 'granted',
    isRequesting: false
  });
  await act(async () => {
    tree = renderer.create(<HomeScreen />);
  });
  expect(
    tree.root
      .findAllByType(Pressable)
      .filter((node) => node.props.accessibilityLabel === 'Usar mi ubicación')
  ).toHaveLength(1);
  await act(async () => {
    await button('Usar mi ubicación').props.onPress();
  });
  expect(
    tree.root.findAllByType(Text).map((node) => label(node.props.children))
  ).toContain('Sugerida automáticamente por proximidad');
  act(() => button('Línea 1').props.onPress());
  await act(async () => {
    await button('A Cortadura').props.onPress();
  });
  act(() => button('1101 · Plaza España').props.onPress());
  const text = tree.root
    .findAllByType(Text)
    .map((node) => label(node.props.children));
  expect(text).toContain('Elegida en el recorrido');
  expect(text).not.toContain('Sugerida automáticamente por proximidad');
});

it('returns from a stop to the map before returning to the main Lines and arrivals screen', async () => {
  jest.mocked(useNearestStop).mockReturnValue({
    requestLocation: jest
      .fn<() => Promise<undefined>>()
      .mockResolvedValue(undefined),
    status: 'idle',
    isRequesting: false
  });
  await act(async () => {
    tree = renderer.create(<HomeScreen />);
  });
  act(() => button('Ver mapa de paradas').props.onPress());
  const map = tree.root.findByType(StopMap);
  const back = jest.fn(() => {
    map.props.onDetailChange(false);
    return true;
  });
  act(() => {
    map.props.onBackHandlerChange(back);
    map.props.onDetailChange(true);
  });
  act(() => button('Volver al mapa').props.onPress());
  expect(back).toHaveBeenCalledTimes(1);
  expect(tree.root.findByType(Modal).props.visible).toBe(true);
  act(() => button('Volver a Líneas y llegadas').props.onPress());
  expect(tree.root.findByType(Modal).props.visible).toBe(false);
});

it('requests location once on startup and only repeats it after explicit user action', async () => {
  const request = jest
    .fn<() => Promise<undefined>>()
    .mockResolvedValue(undefined);
  jest.mocked(useNearestStop).mockReturnValue({
    requestLocation: request,
    status: 'idle',
    isRequesting: false
  });
  await act(async () => {
    tree = renderer.create(<HomeScreen />);
  });
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => {
    tree.update(<HomeScreen />);
  });
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => {
    await button('Usar mi ubicación').props.onPress();
  });
  expect(request).toHaveBeenCalledTimes(2);
});
it('exposes one Other transport entry and clearly labels the home content as city buses', async () => {
  jest
    .mocked(useNearestStop)
    .mockReturnValue({
      requestLocation: jest
        .fn<() => Promise<NearestStopResult | undefined>>()
        .mockResolvedValue(undefined),
      status: 'idle',
      isRequesting: false
    });
  await act(async () => {
    tree = renderer.create(<HomeScreen />);
  });
  expect(
    tree.root
      .findAllByType(Pressable)
      .filter((n) => n.props.accessibilityLabel === 'Otros transportes')
  ).toHaveLength(1);
  expect(
    tree.root
      .findAllByType(Pressable)
      .filter(
        (n) =>
          n.props.accessibilityLabel === 'Cercanías' ||
          n.props.accessibilityLabel === 'Trambahía'
      )
  ).toHaveLength(0);
  expect(
    tree.root
      .findAllByType(Text)
      .some((n) => n.props.children === 'Autobuses urbanos')
  ).toBe(true);
});
