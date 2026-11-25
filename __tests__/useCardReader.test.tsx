import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  AppState,
  DeviceEventEmitter,
  NativeModules,
  Platform
} from 'react-native';
import { expect, it, jest } from '@jest/globals';
import { useCardReader, type CardReading } from '../src/hooks/useCardReader';
it('listens only in foreground and cleans up on unmount without persisting card data', async () => {
  const reader = {
    setActive: jest.fn(),
    getStatus: jest.fn<() => Promise<string>>().mockResolvedValue('ready'),
    addListener: jest.fn(),
    removeListeners: jest.fn()
  };
  const originalOS = Platform.OS;
  Object.defineProperty(Platform, 'OS', {
    value: 'android',
    configurable: true
  });
  NativeModules.TransitNfc = reader;
  const original = AppState.currentState;
  AppState.currentState = 'active';
  let stateChange!: () => void;
  const remove = jest.fn();
  const app = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, handler) => {
      stateChange = handler as () => void;
      return { remove };
    });
  const event = jest.fn<(reading: CardReading) => void>();
  let tree!: renderer.ReactTestRenderer;
  function Probe() {
    useCardReader(true, event);
    return null;
  }
  try {
    await act(async () => {
      tree = renderer.create(<Probe />);
    });
    expect(reader.setActive).toHaveBeenLastCalledWith(true);
    act(() =>
      DeviceEventEmitter.emit('TransitCard', {
        status: 'error',
        message: 'Prueba de tarjeta no compatible'
      })
    );
    expect(event).toHaveBeenCalledTimes(1);
    await act(async () => {
      AppState.currentState = 'background';
      stateChange();
    });
    expect(reader.setActive).toHaveBeenLastCalledWith(false);
    act(() => DeviceEventEmitter.emit('TransitCard', { status: 'reading' }));
    expect(event).toHaveBeenCalledTimes(1);
    await act(async () => {
      AppState.currentState = 'active';
      stateChange();
    });
    expect(reader.setActive).toHaveBeenLastCalledWith(true);
    act(() => tree.unmount());
    expect(remove).toHaveBeenCalled();
    expect(reader.setActive).toHaveBeenLastCalledWith(false);
    act(() => DeviceEventEmitter.emit('TransitCard', { status: 'reading' }));
    expect(event).toHaveBeenCalledTimes(1);
  } finally {
    app.mockRestore();
    AppState.currentState = original;
    delete NativeModules.TransitNfc;
    Object.defineProperty(Platform, 'OS', {
      value: originalOS,
      configurable: true
    });
  }
});

it('uses the authenticated urban profile and rejects a result missing identity or consistent reads', async () => {
  const reader = {
    setActive: jest.fn(),
    getStatus: jest.fn<() => Promise<string>>().mockResolvedValue('ready'),
    addListener: jest.fn(),
    removeListeners: jest.fn()
  };
  const appListener = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  const oldOS = Platform.OS;
  const oldState = AppState.currentState;
  Object.defineProperty(Platform, 'OS', {
    value: 'android',
    configurable: true
  });
  AppState.currentState = 'active';
  NativeModules.TransitNfc = reader;
  const event = jest.fn<(reading: CardReading) => void>();
  let tree!: renderer.ReactTestRenderer;
  function Probe() {
    useCardReader(true, event);
    return null;
  }
  try {
    await act(async () => {
      tree = renderer.create(<Probe />);
    });
    const block = new Array(16).fill(0);
    block[0] = 200;
    const diagnostic = {
      profile: 'bonobus-cadiz',
      urbanIdentityAuthenticated: true,
      urbanBalanceAuthenticated: true,
      consistentReads: true
    };
    act(() =>
      DeviceEventEmitter.emit('TransitCard', {
        status: 'read',
        block,
        diagnostic
      })
    );
    expect(event.mock.calls.at(-1)![0]).toMatchObject({
      status: 'success',
      profile: 'bonobus-cadiz',
      balance: 2
    });
    act(() =>
      DeviceEventEmitter.emit('TransitCard', {
        status: 'read',
        block,
        diagnostic: { ...diagnostic, urbanIdentityAuthenticated: false }
      })
    );
    expect(event.mock.calls.at(-1)![0].status).toBe('error');
    act(() =>
      DeviceEventEmitter.emit('TransitCard', {
        status: 'read',
        block,
        diagnostic: { ...diagnostic, consistentReads: false }
      })
    );
    expect(event.mock.calls.at(-1)![0].status).toBe('error');
    act(() =>
      DeviceEventEmitter.emit('TransitCard', {
        status: 'read',
        block,
        diagnostic: { profile: 'unsupported' }
      })
    );
    expect(event.mock.calls.at(-1)![0].status).toBe('error');
  } finally {
    act(() => tree?.unmount());
    appListener.mockRestore();
    AppState.currentState = oldState;
    Object.defineProperty(Platform, 'OS', { value: oldOS, configurable: true });
    delete NativeModules.TransitNfc;
  }
});
