import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Pressable, Share } from 'react-native';
import { expect, it, jest } from '@jest/globals';
import { CardBalance } from '../src/components/CardBalance';
it('lets the user inspect and share the failure phase with no card contents', async () => {
  const share = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({ action: Share.dismissedAction });
  let tree!: renderer.ReactTestRenderer;
  try {
    act(() => {
      tree = renderer.create(
        <CardBalance
          visible
          status="ready"
          onClose={() => undefined}
          reading={{
            status: 'error',
            message: 'No autentica',
            diagnostic: {
              model: 'Test phone',
              code: 'AUTH_REJECTED',
              stage: 'authenticate',
              technologies: ['NfcA', 'MifareClassic']
            }
          }}
        />
      );
    });
    act(() =>
      tree.root
        .findAllByType(Pressable)
        .find((n) => n.props.accessibilityLabel === 'Ver diagnóstico NFC')!
        .props.onPress()
    );
    expect(
      tree.root.findByProps({ testID: 'nfc-diagnostic' }).props.children
    ).toContain('AUTH_REJECTED');
    await act(async () =>
      tree.root
        .findAllByType(Pressable)
        .find(
          (n) => n.props.accessibilityLabel === 'Compartir diagnóstico NFC'
        )!
        .props.onPress()
    );
    expect(share).toHaveBeenCalledWith({
      message: expect.stringContaining('authenticate')
    });
  } finally {
    act(() => tree?.unmount());
    share.mockRestore();
  }
});

it('replaces instructions with the balance and reference fare after a successful reading', () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 10, 4));
  let tree!: renderer.ReactTestRenderer;
  try {
    act(() => {
      tree = renderer.create(
        <CardBalance
          visible
          status="ready"
          onClose={() => undefined}
          reading={{
            status: 'success',
            profile: 'bonobus-cadiz',
            balance: 5.25,
            observedAt: Date.now()
          }}
        />
      );
    });
    expect(tree.root.findByProps({ testID: 'card-balance' })).toBeDefined();
    expect(JSON.stringify(tree.toJSON())).toContain('Precio por viaje');
    expect(JSON.stringify(tree.toJSON())).toContain('Bonobús ordinario');
    expect(JSON.stringify(tree.toJSON())).not.toContain('Acerca la tarjeta');
    expect(JSON.stringify(tree.toJSON())).not.toContain('nfc-diag-3');
    act(() =>
      tree.root
        .findAllByType(Pressable)
        .find((n) => n.props.accessibilityLabel === 'Sobre esta consulta')!
        .props.onPress()
    );
    expect(JSON.stringify(tree.toJSON())).toContain('nfc-diag-3');
  } finally {
    act(() => tree?.unmount());
    jest.useRealTimers();
  }
});
