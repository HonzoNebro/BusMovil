import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { it, expect } from '@jest/globals';
import { RailPlan } from '../src/components/RailPlan';
it('opens the local official image, enlarges it, resets its size and closes the viewer', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<RailPlan mode="commuter" />);
  });
  expect(tree.root.findByProps({ testID: 'rail-plan-preview' })).toBeDefined();
  expect(tree.root.findAllByType('WebView' as never)).toHaveLength(0);
  act(() =>
    tree.root
      .findByProps({ accessibilityLabel: 'Ampliar plano oficial' })
      .props.onPress()
  );
  expect(
    tree.root.findByProps({ testID: 'pinch-image-viewport' })
  ).toBeDefined();
  expect(
    tree.root.findAllByProps({ accessibilityLabel: 'Ampliar plano' })
  ).toHaveLength(0);
  act(() =>
    tree.root
      .findByProps({ accessibilityLabel: 'Ajustar plano' })
      .props.onPress()
  );
  act(() =>
    tree.root
      .findByProps({ accessibilityLabel: 'Volver al servicio ferroviario' })
      .props.onPress()
  );
  expect(tree.root.findAllByProps({ testID: 'rail-plan-full' })).toHaveLength(
    0
  );
  act(() => tree.unmount());
});
