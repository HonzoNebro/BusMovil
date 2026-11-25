import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Linking, Text } from 'react-native';
import { afterEach, expect, it, jest } from '@jest/globals';
import { StopDetail } from '../src/components/StopMap/StopDetail';
import { buildMapRoutes } from '../src/services/mapRoutes';
import type { BusDataSnapshot } from '../src/types/bus';
jest.mock('react-native-webview', () => ({ WebView: 'WebView' }));
let tree: renderer.ReactTestRenderer;
afterEach(() => {
  act(() => tree?.unmount());
});
const stop = buildMapRoutes().markers.find((item) => item.stopId === '1101')!;
const snapshot: BusDataSnapshot = {
  generatedAt: '2026-10-29T10:00:00Z',
  failedStopIds: [],
  arrivals: [
    {
      stopId: '1101',
      stopName: 'Plaza España',
      line: '1',
      configuredLine: '1',
      directionId: '1-cortadura',
      directionName: 'A Cortadura',
      destination: 'Cortadura',
      arrivalInMinutes: 5,
      observedAt: '2026-10-29T10:00:00Z'
    }
  ]
};
const labels = () =>
  tree.root.findAllByType(Text).map((node) => String(node.props.children));
it('shows real upcoming arrivals, number, name, minimap and saves the selected stop', () => {
  const toggleFavorite = jest.fn<() => Promise<void>>().mockResolvedValue();
  act(() => {
    tree = renderer.create(
      <StopDetail
        stop={stop}
        snapshot={snapshot}
        favorites={{
          favoriteIds: [],
          ready: true,
          saving: false,
          error: undefined,
          toggleFavorite
        }}
      />
    );
  });
  expect(labels()).toContain('5 min');
  expect(labels()).toContain('Plaza España');
  expect(tree.root.findByType('WebView' as never).props.source.html).toContain(
    '36.534149'
  );
  act(() =>
    tree.root
      .findByProps({ accessibilityLabel: 'Guardar en favoritos' })
      .props.onPress()
  );
  expect(toggleFavorite).toHaveBeenCalledWith('1101');
});
it('shows old arrivals as dated history and keeps the original consultation time after an error', () => {
  act(() => {
    tree = renderer.create(
      <StopDetail
        stop={stop}
        snapshot={{ ...snapshot, failedStopIds: ['1101'] }}
        dataError="offline"
      />
    );
  });
  expect(labels()).not.toContain('5 min');
  expect(
    labels().some((label) =>
      label.startsWith('Dato anterior: 5 min · consulta ')
    )
  ).toBe(true);
  expect(
    labels().some((label) =>
      label.includes('No se pudo actualizar esta parada')
    )
  ).toBe(true);
});
it('treats a valid empty response as no upcoming arrivals, not as a network error', () => {
  act(() => {
    tree = renderer.create(
      <StopDetail stop={stop} snapshot={{ ...snapshot, arrivals: [] }} />
    );
  });
  expect(labels()).toContain('Sin próximas llegadas para esta parada.');
  expect(
    labels().some((label) => label.includes('No se pudo actualizar'))
  ).toBe(false);
});

it('hands the selected stop coordinates to the phone map application', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  act(() => {
    tree = renderer.create(<StopDetail stop={stop} />);
  });
  await act(async () => {
    await tree.root
      .findByProps({ accessibilityLabel: 'Cómo llegar' })
      .props.onPress();
  });
  expect(open).toHaveBeenCalledWith(
    expect.stringContaining(
      encodeURIComponent(`${stop.latitude},${stop.longitude}`)
    )
  );
  open.mockRestore();
});

it('does not offer navigation for a stop without coordinates', () => {
  act(() => {
    tree = renderer.create(
      <StopDetail
        stop={{ ...stop, latitude: undefined, longitude: undefined }}
      />
    );
  });
  expect(
    tree.root.findAllByProps({ accessibilityLabel: 'Cómo llegar' })
  ).toHaveLength(0);
});
