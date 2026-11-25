import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Pressable, Text } from 'react-native';
import { afterEach, expect, it, jest } from '@jest/globals';
import {
  ArrivalList as ActualArrivalList,
  type ArrivalSelection
} from '../src/components/ArrivalList';
import { findNearbyStop } from '../src/services/walkingStops';
import type { BusStopArrival } from '../src/types/bus';
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

function ArrivalList(props: React.ComponentProps<typeof ActualArrivalList>) {
  return (
    <ActualArrivalList
      {...props}
      userPosition={
        props.userPosition ?? {
          latitude: 36.534149,
          longitude: -6.292969,
          observedAt: Date.now(),
          accuracy: 'precise'
        }
      }
    />
  );
}
let tree: renderer.ReactTestRenderer;
afterEach(() => {
  act(() => tree?.unmount());
  jest.useRealTimers();
});
async function press(label: string) {
  const button = tree.root
    .findAllByType(Pressable)
    .find(
      (node) =>
        node.props.accessibilityLabel === label ||
        node
          .findAllByType(Text)
          .some(
            (text) =>
              (Array.isArray(text.props.children)
                ? text.props.children.join('')
                : text.props.children) === label
          )
    );
  expect(button).toBeDefined();
  await act(async () => {
    await button!.props.onPress();
  });
}
const labels = () =>
  tree.root
    .findAllByType(Text)
    .map((node) =>
      Array.isArray(node.props.children)
        ? node.props.children.join('')
        : node.props.children
    );
it('consumes focus once and respects manual navigation across arrival refreshes', async () => {
  const props = { arrivals: [], focusRequest: { id: 1, stopId: '1101' } };
  act(() => {
    tree = renderer.create(<ArrivalList {...props} />);
  });
  expect(labels()).toContain('LLEGADAS A ESTA PARADA');
  await press('Línea 2');
  expect(labels()).toContain('Elige el sentido de tu viaje');
  act(() => tree.update(<ArrivalList {...props} arrivals={[]} />));
  expect(labels()).toContain('Elige el sentido de tu viaje');
  await press('Línea 2');
  expect(labels()).toContain('Elige el sentido de tu viaje');
  act(() => tree.update(<ArrivalList {...props} arrivals={[]} />));
  expect(labels()).toContain('Elige el sentido de tu viaje');
});
it('allows an explicit second request to refocus the same stop but does not trap the back button', async () => {
  act(() => {
    tree = renderer.create(
      <ArrivalList arrivals={[]} focusRequest={{ id: 1, stopId: '1101' }} />
    );
  });
  await press('Línea 1');
  expect(labels()).toContain('Elige el sentido de tu viaje');
  act(() =>
    tree.update(
      <ArrivalList arrivals={[]} focusRequest={{ id: 2, stopId: '1101' }} />
    )
  );
  expect(labels()).toContain('LLEGADAS A ESTA PARADA');
});
it('labels stale estimates as historical rather than live countdowns', async () => {
  const arrival: BusStopArrival = {
    stopId: '1101',
    stopName: 'Plaza España',
    line: '1',
    configuredLine: '1',
    directionId: '1-cortadura',
    directionName: 'A Cortadura',
    destination: 'Cortadura',
    arrivalInMinutes: 5,
    observedAt: '2026-10-28T10:00:00Z'
  };
  act(() => {
    tree = renderer.create(
      <ArrivalList arrivals={[arrival]} staleStopIds={['1101']} />
    );
  });
  await press('Línea 1');
  await press('A Cortadura');
  await press('1101 · Plaza España');
  expect(
    labels().some((label) => String(label).startsWith('Dato anterior: 5 min'))
  ).toBe(true);
  expect(labels()).not.toContain('5 min');
  expect(
    tree.root.findAllByProps({ testID: 'arrival-primary-time' })
  ).toHaveLength(0);
});

it('uses the selected stop arrival in the Urbano hero and changes it on manual selection', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-29T10:00:00'));
  const arrivals: BusStopArrival[] = [
    {
      stopId: '1101',
      stopName: 'Plaza España',
      line: '1',
      configuredLine: '1',
      directionId: '1-cortadura',
      directionName: 'A Cortadura',
      destination: 'Cortadura',
      arrivalInMinutes: 8,
      observedAt: '2026-10-29T09:00:00Z'
    },
    {
      stopId: '1102',
      stopName: 'Avenida del Puerto',
      line: '1',
      configuredLine: '1',
      directionId: '1-cortadura',
      directionName: 'A Cortadura',
      destination: 'Cortadura',
      arrivalInMinutes: 12,
      observedAt: '2026-10-29T09:00:00Z'
    }
  ];
  act(() => {
    tree = renderer.create(<ArrivalList arrivals={arrivals} />);
  });
  expect(
    tree.root.findByProps({ testID: 'arrival-primary-time' }).props.children
  ).toBe('8');
  await press('Ver todas las paradas');
  await press('1102 · Avenida del Puerto');
  expect(
    tree.root.findByProps({ testID: 'arrival-primary-time' }).props.children
  ).toBe('12');
  expect(
    tree.root.findByProps({ testID: 'arrival-hero' }).props.accessibilityLabel
  ).toBe('Parada 1102: Avenida del Puerto');
});

it('honors the specific direction selected in the map at a shared terminus', async () => {
  act(() => {
    tree = renderer.create(
      <ArrivalList
        arrivals={[]}
        focusRequest={{ id: 1, stopId: '1101', directionId: '1-plaza-espana' }}
      />
    );
  });
  expect(labels()).toContain('Sentido: Plaza España');
  expect(labels()).toContain(
    'Fin de este sentido. Puedes cambiar el sentido del recorrido.'
  );
});

it('shows only the selected stop when collapsed and closes the previous accordion in the full route', async () => {
  act(() => {
    tree = renderer.create(
      <ArrivalList
        arrivals={[]}
        linePriority={['3']}
        focusRequest={{ id: 1, stopId: '1311', directionId: '3-plaza-espana' }}
      />
    );
  });
  const rows = () =>
    tree.root
      .findAllByType(Pressable)
      .filter((node) => /^\d{4} ·/.test(node.props.accessibilityLabel ?? ''));
  expect(rows().map((node) => node.props.accessibilityLabel)).toEqual([
    '1311 · Avenida Marconi'
  ]);
  await press('Ver todas las paradas');
  const before = rows().map((node) => node.props.accessibilityLabel);
  await press('1311 · Avenida Marconi');
  await press('1312 · Avenida Guadalete');
  expect(rows().map((node) => node.props.accessibilityLabel)).toEqual(before);
  expect(
    rows()
      .filter((node) => node.props.accessibilityState.expanded)
      .map((node) => node.props.accessibilityLabel)
  ).toEqual(['1312 · Avenida Guadalete']);
  expect(
    rows().find(
      (node) => node.props.accessibilityLabel === '1311 · Avenida Marconi'
    )!.props.accessibilityState.expanded
  ).toBe(false);
});
it('keeps a stop selected outside the preview visible when the full route is collapsed', async () => {
  act(() => {
    tree = renderer.create(
      <ArrivalList
        arrivals={[]}
        linePriority={['3']}
        focusRequest={{ id: 1, stopId: '1311', directionId: '3-plaza-espana' }}
      />
    );
  });
  await press('Ver todas las paradas');
  await press('1315 · Brigadier Tofino');
  await press('Mostrar menos paradas');
  const selected = tree.root
    .findAllByType(Pressable)
    .find(
      (node) => node.props.accessibilityLabel === '1315 · Brigadier Tofino'
    );
  expect(selected?.props.accessibilityState).toEqual({
    selected: true,
    expanded: true
  });
});

it('automatically chooses nearby stop 1301 for line 3 toward Puntales from Plaza España 1101', async () => {
  const change = jest.fn<(selection: ArrivalSelection) => void>();
  act(() => {
    tree = renderer.create(
      <ArrivalList
        arrivals={[]}
        focusRequest={{ id: 1, stopId: '1101' }}
        onSelectionChange={change}
      />
    );
  });
  await press('Línea 3');
  await press('A Puntales');
  expect(change.mock.calls.at(-1)![0]).toEqual(
    expect.objectContaining({
      stopId: '1301',
      line: '3',
      directionId: '3-puntales'
    })
  );
  expect(labels().some((text) => String(text).includes('no pasa por'))).toBe(
    false
  );
  expect(
    tree.root.findByProps({ testID: 'arrival-hero' }).props.accessibilityLabel
  ).toBe('Parada 1301: Plaza España');
});
it('prioritizes line 1 at shared stop 1123, orders other services by arrival, and switches line without switching stop', async () => {
  const data = [
    ['1', '1-plaza-espana', 8],
    ['2', '2-plaza-espana', 2],
    ['3', '3-plaza-espana', 6],
    ['7', '7-simon-bolivar', 1]
  ].map(([line, directionId, minutes]) => ({
    stopId: '1123',
    stopName: 'Avenida de Andalucía (Vuelta)',
    line: String(line),
    configuredLine: String(line),
    directionId: String(directionId),
    directionName: 'A destino',
    destination: 'Destino',
    arrivalInMinutes: Number(minutes),
    observedAt: '2026-10-29T10:00:00Z'
  }));
  const change = jest.fn<(selection: ArrivalSelection) => void>();
  act(() => {
    tree = renderer.create(
      <ArrivalList
        arrivals={data}
        focusRequest={{ id: 1, stopId: '1123' }}
        onSelectionChange={change}
      />
    );
  });
  expect(change.mock.calls.at(-1)![0]).toEqual(
    expect.objectContaining({
      stopId: '1123',
      line: '1',
      directionId: '1-plaza-espana'
    })
  );
  const others = tree.root
    .findAllByType(Pressable)
    .map((node) => node.props.accessibilityLabel)
    .filter((text) => /^Ver línea/.test(text ?? ''));
  expect(others).toEqual([
    'Ver línea 7 en esta parada',
    'Ver línea 2 en esta parada',
    'Ver línea 3 en esta parada'
  ]);
  await press('Ver línea 7 en esta parada');
  expect(change.mock.calls.at(-1)![0]).toEqual(
    expect.objectContaining({
      stopId: '1123',
      line: '7',
      directionId: '7-simon-bolivar'
    })
  );
});
it('keeps stale estimates historical throughout a retry and allows the status pill to refresh', async () => {
  const onRefresh = jest.fn();
  const arrival: BusStopArrival = {
    stopId: '1101',
    stopName: 'Plaza España',
    line: '1',
    configuredLine: '1',
    directionId: '1-cortadura',
    directionName: 'A Cortadura',
    destination: 'Cortadura',
    arrivalInMinutes: 5,
    observedAt: '2026-10-29T10:00:00Z'
  };
  const props = {
    arrivals: [arrival],
    staleStopIds: ['1101'],
    dataError: 'offline',
    onRefresh
  };
  act(() => {
    tree = renderer.create(<ArrivalList {...props} />);
  });
  expect(labels()).toContain('Sin actualizar ↻');
  await press('Actualizar llegadas');
  expect(onRefresh).toHaveBeenCalledTimes(1);
  const previous = labels().find((text) =>
    String(text).startsWith('Dato anterior:')
  );
  act(() => tree.update(<ArrivalList {...props} isLoading />));
  expect(labels()).toContain('Reintentando…');
  expect(labels()).toContain(previous);
  expect(
    tree.root.findAllByProps({ testID: 'arrival-primary-time' })
  ).toHaveLength(0);
  act(() =>
    tree.update(
      <ArrivalList
        arrivals={[{ ...arrival, arrivalInMinutes: 4 }]}
        onRefresh={onRefresh}
      />
    )
  );
  expect(labels()).toContain('En directo ↻');
  expect(
    tree.root.findByProps({ testID: 'arrival-primary-time' }).props.children
  ).toBe('4');
});

it('requests a single reveal after expanding the route, not after arrival refreshes', async () => {
  jest.useFakeTimers();
  const reveal = jest.fn();
  const node = { selected: true };
  const props = {
    arrivals: [],
    focusRequest: { id: 1, stopId: '1123' },
    onRevealStop: reveal
  };
  act(() => {
    tree = renderer.create(<ArrivalList {...props} />, {
      createNodeMock: (element) =>
        element.props.testID === 'selected-route-stop' ? node : null
    });
  });
  expect(reveal).not.toHaveBeenCalled();
  await press('Ver todas las paradas');
  act(() => jest.runOnlyPendingTimers());
  expect(reveal.mock.calls.length).toBe(1);
  act(() => tree.update(<ArrivalList {...props} arrivals={[]} />));
  act(() => jest.runOnlyPendingTimers());
  expect(reveal).toHaveBeenCalledTimes(1);
});

it('ignores a direction lookup completed after the user switches lines', async () => {
  const routing = jest.mocked(findNearbyStop);
  let finish!: (value: Awaited<ReturnType<typeof findNearbyStop>>) => void;
  routing.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  act(() => {
    tree = renderer.create(
      <ArrivalList arrivals={[]} focusRequest={{ id: 1, stopId: '1101' }} />
    );
  });
  await press('Línea 3');
  act(() => {
    void tree.root
      .findAllByType(Pressable)
      .find((node) => node.props.accessibilityLabel === 'A Puntales')!
      .props.onPress();
  });
  await press('Línea 2');
  await act(async () => {
    finish(undefined);
  });
  expect(labels()).toContain('A Barriada Loreto');
  expect(tree.root.findAllByProps({ testID: 'arrival-hero' })).toHaveLength(0);
});

it.each(['precise', 'approximate'] as const)(
  'simplifies precise location text and preserves approximate reading time (%s)',
  async (accuracy) => {
    act(() => {
      tree = renderer.create(
        <ArrivalList
          arrivals={[]}
          userPosition={{
            latitude: 40.4168,
            longitude: -3.7038,
            observedAt: Date.now(),
            accuracy
          }}
        />
      );
    });
    await press('Línea 3');
    await press('A Puntales');
    const output = JSON.stringify(tree.toJSON());
    expect(output).toContain('Ruta a pie no calculada para esta distancia.');
    expect(output.includes('Desde tu ubicación de las')).toBe(
      accuracy === 'approximate'
    );
    expect(
      output.includes('Ubicación aproximada: la parada sugerida puede variar')
    ).toBe(accuracy === 'approximate');
  }
);
