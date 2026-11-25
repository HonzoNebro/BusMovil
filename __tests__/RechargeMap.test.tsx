import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Linking, Modal, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { it, expect, jest, afterEach, beforeEach } from '@jest/globals';
import { RechargePoints } from '../src/components/RechargePoints';
import { buildRechargeMap } from '../src/components/RechargeMap/template';
import { navigateToPoint } from '../src/services/mapNavigation';
import { rechargePoints } from '../src/services/rechargePoints';
beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  jest.restoreAllMocks();
});
it('shows both networks without tabs, location button, list or external modal; delegates navigation', async () => {
  const point = rechargePoints.find(
    (p) => p.network === 'urban' && p.latitude !== undefined
  )!;
  const consortium = rechargePoints.find((p) => p.network === 'consortium')!;
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<RechargePoints />);
  });
  expect(tree.root.findAllByType(Modal)).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).not.toContain(
    'Elegir punto por nombre'
  );
  expect(JSON.stringify(tree.toJSON())).not.toContain('Cerca de mí');
  const map = tree.root.findByType(WebView);
  expect(map.props.source.html).toContain(point.id);
  expect(map.props.source.html).toContain(consortium.id);
  await act(async () => {
    map.props.onMessage({
      nativeEvent: { data: JSON.stringify({ type: 'navigate', id: 'invalid' }) }
    });
  });
  expect(open).not.toHaveBeenCalled();
  await act(async () => {
    map.props.onMessage({
      nativeEvent: { data: JSON.stringify({ type: 'navigate', id: point.id }) }
    });
  });
  expect(open).toHaveBeenCalledWith(expect.stringMatching(/^geo:/));
  act(() => tree.unmount());
});
it('does not invent coordinates and safely serializes labels in HTML', () => {
  const html = buildRechargeMap([
    {
      ...rechargePoints[0],
      latitude: 36.5,
      longitude: -6.2,
      name: '</script><script>bad()</script>'
    },
    { ...rechargePoints[0], id: 'unknown' }
  ]);
  expect(html).not.toContain('</script><script>bad()');
  expect(html).not.toContain('"id":"unknown"');
});
it('falls back to a normal maps link when there is no installed handler', async () => {
  const open = jest
    .spyOn(Linking, 'openURL')
    .mockRejectedValueOnce(new Error('No handler'))
    .mockResolvedValueOnce(undefined);
  await navigateToPoint(rechargePoints[0]);
  expect(open).toHaveBeenNthCalledWith(1, expect.stringMatching(/^geo:/));
  expect(open).toHaveBeenNthCalledWith(
    2,
    expect.stringMatching(/^https:\/\/www.google.com\/maps\/dir/)
  );
});

it('keeps details inside Leaflet, closes on map click and explicit button, and navigates with the selected ID', () => {
  // Execute the actual generated interaction script, with Leaflet/DOM boundaries stubbed.
  const points = [
    { ...rechargePoints[0], id: 'urban-test', latitude: 36.5, longitude: -6.2 },
    {
      ...rechargePoints[0],
      id: 'consortium-test',
      network: 'consortium' as const,
      latitude: 36.5,
      longitude: -6.2
    }
  ];
  const html = buildRechargeMap(points);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const closePopup = jest.fn();
  const handlers: Record<string, () => void> = {};
  const map = {
    setView: () => map,
    fitBounds: jest.fn(),
    invalidateSize: jest.fn(),
    closePopup,
    on: (event: string, fn: () => void) => {
      handlers[event] = fn;
    }
  };
  const bindPopup = jest.fn();
  const marker = { addTo: () => marker, bindPopup };
  const tile = { on: () => tile, addTo: () => tile };
  const addTo = jest.fn();
  const control = { onAdd: () => undefined, addTo };
  const postMessage = jest.fn();
  const createElement = () => ({
    children: [] as unknown[],
    textContent: '',
    appendChild(child: unknown) {
      this.children.push(child);
    }
  });
  const L = {
    map: () => map,
    tileLayer: () => tile,
    marker: () => marker,
    divIcon: jest.fn(),
    latLngBounds: jest.fn(),
    control: () => control
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { runInNewContext } = require('vm');
  runInNewContext(scripts.map((s) => s[1]).join('\n'), {
    window: { L, ReactNativeWebView: { postMessage } },
    L,
    document: { createElement },
    setTimeout: (fn: () => void) => fn()
  });
  expect(bindPopup).toHaveBeenCalledTimes(1); // Shared coordinate stays accessible as one combined marker.
  const [panel, options] = bindPopup.mock.calls[0] as unknown as [
    { children: { onclick?: () => void; textContent: string }[] },
    { closeOnClick: boolean }
  ];
  expect(options.closeOnClick).toBe(true);
  handlers.click();
  expect(closePopup).toHaveBeenCalledTimes(1);
  panel.children.find((n) => n.textContent === 'Cerrar detalle')!.onclick!();
  expect(closePopup).toHaveBeenCalledTimes(2);
  panel.children.find((n) => n.textContent === 'Cómo llegar ↗')!.onclick!();
  expect(postMessage).toHaveBeenCalledWith(
    JSON.stringify({ type: 'navigate', id: 'urban-test' })
  );
});
