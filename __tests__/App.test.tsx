import React from 'react';
import { afterEach, expect, it, jest } from '@jest/globals';
import renderer, { act } from 'react-test-renderer';
import { AppRegistry, Text } from 'react-native';

import App from '../App';
import { name as appName } from '../app.json';

jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn()
}));
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: { IOS: {}, ANDROID: {} },
  RESULTS: {},
  request: jest.fn()
}));
jest.mock('react-native-webview', () => ({ WebView: 'WebView' }));

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('registers the native entry point under the shared application name', () => {
  const register = jest.spyOn(AppRegistry, 'registerComponent');
  // Load the entry point after installing the registration spy.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../index');
  expect(register).toHaveBeenCalledWith(appName, expect.any(Function));
  expect(register.mock.calls[0][1]()).toBe(App);
});

it('renders the home screen and cleans up the refresh timer on unmount', async () => {
  jest.useFakeTimers();
  const originalFetch = global.fetch;
  global.fetch = jest
    .fn<typeof fetch>()
    .mockResolvedValue({ ok: true, text: async () => '[]' } as Response);
  let tree: renderer.ReactTestRenderer | undefined;
  try {
    await act(async () => {
      tree = renderer.create(<App />);
    });
    expect(
      tree!.root
        .findAllByType(Text)
        .some((node) => node.props.children === 'Transportes')
    ).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
    const callsBeforeRefresh = jest.mocked(global.fetch).mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(60000);
    });
    expect(jest.mocked(global.fetch).mock.calls.length).toBeGreaterThan(
      callsBeforeRefresh
    );
  } finally {
    act(() => tree?.unmount());
    const callsAfterUnmount = jest.mocked(global.fetch).mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(60000);
    });
    const callsAfterWaiting = jest.mocked(global.fetch).mock.calls.length;
    global.fetch = originalFetch;
    expect(callsAfterWaiting).toBe(callsAfterUnmount);
  }
});
