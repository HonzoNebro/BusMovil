import { Script } from 'vm';
import { expect, it } from '@jest/globals';
import { CLUSTER_SCRIPT, type ClusterPoint, type StopCluster } from '../src/services/mapClustering';
import { buildMapRoutes } from '../src/services/mapRoutes';

const clusterStops = new Script(`(${CLUSTER_SCRIPT})`).runInNewContext() as (points: ClusterPoint[], zoom: number) => StopCluster[];

it('counts unique physical stops, subdivides with zoom and reveals individual stops up close', () => {
  const { markers } = buildMapRoutes();
  const far = clusterStops(markers, 9);
  expect(far).toHaveLength(1);
  expect(far[0].stopIds).toHaveLength(markers.length);
  const middle = clusterStops(markers, 14);
  expect(middle.length).toBeGreaterThan(1);
  expect(middle.flatMap((group) => group.stopIds).sort()).toEqual(
    markers.map((stop) => stop.stopId).sort()
  );
  const near = clusterStops(markers, 17);
  expect(near).toHaveLength(markers.length);
  expect(near.every((group) => group.stopIds.length === 1)).toBe(true);
});
it('has exact counts after filtering a line and handles an empty selection', () => {
  const { markers } = buildMapRoutes('1');
  const group = clusterStops(markers, 9)[0];
  expect(group.stopIds.length).toBe(markers.length);
  expect(new Set(group.stopIds).size).toBe(group.stopIds.length);
  expect(clusterStops([], 15)).toEqual([]);
});
it('uses solid strokes toward Plaza España consistently and dotted strokes on the return direction', () => {
  for (const shape of buildMapRoutes().shapes) {
    if (shape.directionId.endsWith('plaza-espana'))
      expect(shape.alternate).toBe(false);
    else if (shape.lineId !== '7') expect(shape.alternate).toBe(true);
  }
});
