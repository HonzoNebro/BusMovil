import { it, expect } from '@jest/globals';
import {
  railCatalog,
  railArrivals,
  railTrip,
  destinationForTrip,
  lineForTrip,
  stopsForLines,
  catalogValid,
  madridDay,
  parseRailFeed,
  type RailSnapshot
} from '../src/services/rail';
const now = Date.parse('2026-11-04T12:00:00+01:00');
const empty: RailSnapshot = { failed: [] };
it('keeps the real partial routes and campus branch, rather than assigning one terminus to all trains', () => {
  expect(stopsForLines(['T1']).map((s) => s.name)).toContain('Pelagatos');
  expect(stopsForLines(['C1a']).map((s) => s.name)).toContain(
    'Universidad de Cádiz'
  );
  const partial = railCatalog.trips.find(
    (t) => lineForTrip(t.id) === 'T1' && t.stops[0][0] === '51419'
  )!;
  expect(partial).toBeDefined();
  expect(destinationForTrip(partial.id)).toBe('Pelagatos');
  expect(
    stopsForLines(['T1']).some((s) => s.name === 'Aeropuerto de Jerez')
  ).toBe(false);
});
it('respects Madrid dates independently of the phone timezone and excludes expired timetables', () => {
  expect(madridDay(new Date('2026-11-04T23:30:00Z'))).toBe('20261105');
  expect(catalogValid(now)).toBe(true);
  expect(catalogValid(Date.parse('2027-01-01T12:00:00Z'))).toBe(false);
  expect(
    railArrivals('51405', ['C1'], empty, Date.parse('2027-01-01T12:00:00Z'))
  ).toEqual([]);
});
it('distinguishes direct estimates from schedules and never propagates delay to unreported stations', () => {
  const planned = railArrivals('51405', ['C1'], empty, now)[0];
  expect(planned).toBeDefined();
  expect(planned.live).toBe(false);
  const snapshot: RailSnapshot = {
    failed: [],
    updates: {
      observedAt: now,
      items: [
        {
          tripId: planned.tripId,
          cancelled: false,
          stops: [{ id: '51405', skipped: false, time: planned.time + 120000 }]
        }
      ]
    }
  };
  const updated = railArrivals('51405', ['C1'], snapshot, now).find(
    (a) => a.tripId === planned.tripId
  )!;
  expect(updated.live).toBe(true);
  expect(updated.time).toBe(planned.time + 120000);
  const other = railTrip(planned.tripId)!.stops[1][0];
  const atOther = railArrivals(other, ['C1'], snapshot, now).find(
    (a) => a.tripId === planned.tripId
  )!;
  expect(atOther).toBeDefined();
  expect(atOther.live).toBe(false);
  snapshot.failed = ['updates'];
  expect(
    railArrivals('51405', ['C1'], snapshot, now).every((a) => !a.live)
  ).toBe(true);
  snapshot.failed = [];
  snapshot.updates!.observedAt = now - 91000;
  expect(
    railArrivals('51405', ['C1'], snapshot, now).every((a) => !a.live)
  ).toBe(true);
});
it('removes cancelled trips and skipped stops', () => {
  const tripId = railArrivals('51405', ['C1'], empty, now)[0].tripId;
  const snapshot: RailSnapshot = {
    failed: [],
    updates: {
      observedAt: now,
      items: [{ tripId, cancelled: true, stops: [] }]
    }
  };
  expect(
    railArrivals('51405', ['C1'], snapshot, now).some(
      (a) => a.tripId === tripId
    )
  ).toBe(false);
  snapshot.updates!.items[0] = {
    tripId,
    cancelled: false,
    stops: [{ id: '51405', skipped: true }]
  };
  expect(
    railArrivals('51405', ['C1'], snapshot, now).some(
      (a) => a.tripId === tripId
    )
  ).toBe(false);
});
it('accepts fresh direct arrivals even with an expired catalogue without inventing a destination', () => {
  const at = Date.parse('2027-01-01T12:00:00Z');
  const snapshot: RailSnapshot = {
    failed: [],
    updates: {
      observedAt: at,
      items: [
        {
          tripId: '31NEW-T1',
          cancelled: false,
          stops: [{ id: '51405', skipped: false, time: at + 120000 }]
        }
      ]
    }
  };
  const result = railArrivals('51405', ['T1'], snapshot, at);
  expect(result).toHaveLength(1);
  expect(result[0].live).toBe(true);
  expect(result[0].destination).toBeUndefined();
});
it('validates live feed timestamps, coordinates and nucleus instead of mixing other regions', () => {
  const timestamp = String(now / 1000);
  const valid = {
    id: 'train',
    vehicle: {
      trip: { tripId: '31TEST-T1' },
      timestamp,
      position: { latitude: 36.5, longitude: -6.2 },
      vehicle: { label: 'T1-123' }
    }
  };
  const parsed = parseRailFeed(
    {
      header: { timestamp },
      entity: [
        valid,
        {
          ...valid,
          vehicle: { ...valid.vehicle, trip: { tripId: '30TEST-T1' } }
        },
        {
          ...valid,
          vehicle: {
            ...valid.vehicle,
            position: { latitude: 99, longitude: 0 }
          }
        }
      ]
    },
    'vehicles',
    now
  );
  expect(parsed.items).toHaveLength(1);
  expect(parsed.items[0].line).toBe('T1');
  expect(() => parseRailFeed({}, 'vehicles', now)).toThrow();
  expect(() =>
    parseRailFeed(
      { header: { timestamp: now / 1000 + 9999 }, entity: [] },
      'updates',
      now
    )
  ).toThrow();
  expect(
    parseRailFeed({ header: { timestamp }, entity: [] }, 'updates', now).items
  ).toEqual([]);
});
