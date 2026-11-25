import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { afterEach, expect, it, jest } from '@jest/globals';
import { Script, createContext } from 'vm';
import { StopMap } from '../src/components/StopMap/index.native';
import { buildMapRoutes } from '../src/services/mapRoutes';

const mockPostMessage = jest.fn();
jest.mock('react-native-webview', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactRuntime = require('react');
  return {
    WebView: ReactRuntime.forwardRef((props: object, ref: unknown) => {
      ReactRuntime.useImperativeHandle(ref, () => ({
        postMessage: mockPostMessage
      }));
      return ReactRuntime.createElement('WebView', props);
    })
  };
});
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(() => 8),
  clearWatch: jest.fn()
}));
let tree: renderer.ReactTestRenderer;
afterEach(() => {
  act(() => tree?.unmount());
  mockPostMessage.mockClear();
});

it('preserves both directions and the next stop, including the end of a route', () => {
  const { markers, shapes } = buildMapRoutes('1');
  expect(shapes).toHaveLength(2);
  const plaza = markers.find((stop) => stop.stopId === '1101')!;
  expect(plaza.services).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        directionId: '1-cortadura',
        destination: 'Cortadura',
        nextStop: 'Avenida del Puerto'
      }),
      expect.objectContaining({
        directionId: '1-plaza-espana',
        destination: 'Plaza España',
        nextStop: null
      })
    ])
  );
  expect(shapes[0].coordinates[shapes[0].coordinates.length - 1]).toEqual([
    plaza.latitude,
    plaza.longitude
  ]);
  expect(shapes[1].coordinates[0]).toEqual([plaza.latitude, plaza.longitude]);
});

it('filters multiple lines without reloading the map and restores all lines', () => {
  act(() => {
    tree = renderer.create(<StopMap />);
  });
  const web = () => tree.root.findByType('WebView' as never);
  const html = web().props.source.html;
  for (const id of ['2', '3']) {
    act(() =>
      tree.root.findByProps({ testID: `map-line-${id}` }).props.onPress()
    );
  }
  expect(web().props.source.html).toBe(html);
  expect(JSON.parse(mockPostMessage.mock.calls.at(-1)![0] as string)).toEqual({
    type: 'setVisibility',
    lines: ['1', '5', '7'],
    showMarkers: true
  });
  expect(
    tree.root.findByProps({ testID: 'map-line-2' }).props.accessibilityState
      .checked
  ).toBe(false);
  act(() =>
    tree.root
      .findByProps({ accessibilityLabel: 'Mostrar todas las líneas' })
      .props.onPress()
  );
  expect(
    JSON.parse(mockPostMessage.mock.calls.at(-1)![0] as string).lines
  ).toEqual(['1', '2', '3', '5', '7']);
});

it('executes the WebView map, groups stops and filters routes and clusters without moving the viewport', () => {
  act(() => {
    tree = renderer.create(<StopMap />);
  });
  const html: string = tree.root.findByType('WebView' as never).props.source
    .html;
  const code = html.match(/<script>([\s\S]*?)<\/script>/)![1];
  const listeners: Record<string, (event: unknown) => void> = {};
  interface Layer {
    coords?: unknown;
    options?: unknown;
    popup: string;
    addTo: (target: { items?: Layer[] }) => Layer;
    bindTooltip: () => Layer;
    bindPopup: (popup: string) => Layer;
    on: (event: string, callback: () => void) => Layer;
    events: Record<string, () => void>;
    setStyle: () => Layer;
    remove: () => void;
  }
  const groups: Array<{ items: Layer[]; clearLayers: () => void }> = [];
  const map = {
    items: [] as Layer[],
    getZoom: () => 10,
    panTo: jest.fn(),
    on: jest.fn(),
    setView: jest.fn(),
    fitBounds: jest.fn(),
    closePopup: jest.fn(),
    invalidateSize: jest.fn(),
    latLngToLayerPoint: ([lat, lon]: number[]) => ({
      x: lon * 100000,
      y: -lat * 100000,
      distanceTo: (b: { x: number; y: number }) =>
        Math.hypot(lon * 100000 - b.x, -lat * 100000 - b.y)
    }),
    layerPointToLatLng: (point: unknown) => point
  };
  const layer = (coords?: unknown, options?: unknown) => {
    const result: Layer = {
      coords,
      options,
      popup: '',
      addTo: (target: { items?: Layer[] }) => {
        target.items?.push(result);
        return result;
      },
      bindTooltip: () => result,
      bindPopup: (popup: string) => {
        result.popup = popup;
        return result;
      },
      events: {},
      on: (event, callback) => {
        result.events[event] = callback;
        return result;
      },
      setStyle: () => result,
      remove: () => {}
    };
    return result;
  };
  const L = {
    map: () => map,
    tileLayer: () => layer(),
    polyline: layer,
    marker: layer,
    circleMarker: layer,
    divIcon: (value: unknown) => value,
    point: (x: number, y: number) => ({ x, y }),
    latLngBounds: () => ({ pad: () => ({}) }),
    layerGroup: () => {
      const group = {
        items: [] as Layer[],
        addTo: () => group,
        clearLayers: () => {
          group.items = [];
        }
      };
      groups.push(group);
      return group;
    }
  };
  new Script(code).runInContext(
    createContext({
      L,
      window: {
        addEventListener: (
          name: string,
          callback: (event: unknown) => void
        ) => {
          listeners[name] = callback;
        },
        ReactNativeWebView: { postMessage: jest.fn() }
      },
      document: { addEventListener: jest.fn() },
      setTimeout: () => {}
    })
  );
  expect(groups[1].items).toHaveLength(1);
  groups[1].items[0].events.click();
  expect(map.panTo).toHaveBeenCalledTimes(1);
  const viewsBefore =
    map.fitBounds.mock.calls.length + map.setView.mock.calls.length;
  listeners.message({
    data: JSON.stringify({
      type: 'setVisibility',
      lines: ['1'],
      showMarkers: true
    })
  });
  expect(groups[0].items).toHaveLength(2);
  expect(groups[1].items).toHaveLength(1);
  expect(map.fitBounds.mock.calls.length + map.setView.mock.calls.length).toBe(
    viewsBefore
  );
  listeners.message({
    data: JSON.stringify({
      type: 'setVisibility',
      lines: [],
      showMarkers: true
    })
  });
  expect(groups.map((group) => group.items.length)).toEqual([0, 0]);
});

it('opens stop details without links that navigate away or repeat the timetable action', () => {
  const onSelectStop = jest.fn();
  act(() => {
    tree = renderer.create(<StopMap onSelectStop={onSelectStop} />);
  });
  act(() =>
    tree.root.findByType('WebView' as never).props.onMessage({
      nativeEvent: {
        data: JSON.stringify({
          type: 'openStop',
          stopId: '1101'
        })
      }
    })
  );
  expect(tree.root.findByProps({ testID: 'stop-detail' })).toBeDefined();
  expect(
    tree.root
      .findByProps({ testID: 'stop-detail' })
      .findAllByProps({ accessibilityLabel: 'Horarios y frecuencias' })
  ).toHaveLength(0);
  expect(onSelectStop).not.toHaveBeenCalled();
});

it('uses Android back to return from the stop detail without closing the map', () => {
  const register = jest.fn<(handler?: () => boolean) => void>();
  act(() => {
    tree = renderer.create(<StopMap onBackHandlerChange={register} />);
  });
  act(() =>
    tree.root.findByType('WebView' as never).props.onMessage({
      nativeEvent: {
        data: JSON.stringify({ type: 'openStop', stopId: '1101' })
      }
    })
  );
  expect(
    tree.root.findAllByProps({ testID: 'stop-detail' }).length
  ).toBeGreaterThan(0);
  let handled = false;
  act(() => {
    handled = register.mock.calls.at(-1)![0]!();
  });
  expect(handled).toBe(true);
  expect(tree.root.findAllByProps({ testID: 'stop-detail' })).toHaveLength(0);
  expect(register.mock.calls.at(-1)![0]!()).toBe(false);
});

it('toggles all lines off and back on from the visible filter action without changing the viewport', () => {
  act(() => {
    tree = renderer.create(<StopMap />);
  });
  const source = tree.root.findByType('WebView' as never).props.source.html;
  act(() =>
    tree.root
      .findByProps({ accessibilityLabel: 'Ocultar todas las líneas' })
      .props.onPress()
  );
  expect(
    JSON.parse(mockPostMessage.mock.calls.at(-1)![0] as string).lines
  ).toEqual([]);
  act(() =>
    tree.root
      .findByProps({ accessibilityLabel: 'Mostrar todas las líneas' })
      .props.onPress()
  );
  expect(
    JSON.parse(mockPostMessage.mock.calls.at(-1)![0] as string).lines
  ).toEqual(['1', '2', '3', '5', '7']);
  expect(tree.root.findByType('WebView' as never).props.source.html).toBe(
    source
  );
});

it('keeps all five filters visible without menu, favourite list or timetable shortcut', () => {
  act(() => {
    tree = renderer.create(<StopMap />);
  });
  expect(
    tree.root.findAllByProps({ accessibilityLabel: 'Opciones del mapa' })
  ).toHaveLength(0);
  expect(
    tree.root.findAllByProps({ accessibilityLabel: 'Horarios y frecuencias' })
  ).toHaveLength(0);
  for (const id of ['1', '2', '3', '5', '7'])
    expect(tree.root.findByProps({ testID: 'map-line-' + id })).toBeDefined();
  expect(
    tree.root.findByProps({ accessibilityLabel: 'Ocultar todas las líneas' })
  ).toBeDefined();
});
