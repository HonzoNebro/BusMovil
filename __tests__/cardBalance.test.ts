import { expect, it } from '@jest/globals';
import { decodeCardBalance } from '../src/services/cardBalance';
function valueBlock(units: number) {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setInt32(0, units, true);
  const value = Array.from(new Uint8Array(buffer));
  return [...value, ...value.map((b) => b ^ 255), ...value, 37, 218, 37, 218];
}
it.each([0, 1, 200, 1234])(
  'decodes balance units %i without losing half cents',
  (units) => {
    expect(decodeCardBalance(valueBlock(units))).toBe(units / 200);
  }
);
it('rejects incomplete, corrupt, and negative values rather than showing a plausible balance', () => {
  expect(() => decodeCardBalance([])).toThrow();
  const bad = valueBlock(200);
  bad[8] = 0;
  expect(() => decodeCardBalance(bad)).toThrow();
  const address = valueBlock(200);
  address[15] = 0;
  expect(() => decodeCardBalance(address)).toThrow();
  expect(() => decodeCardBalance(valueBlock(-1))).toThrow();
});

it('decodes urban Cádiz cents separately from CTAN half cents', () => {
  expect(decodeCardBalance(valueBlock(1234), 'bonobus-cadiz')).toBe(12.34);
  expect(decodeCardBalance(valueBlock(1234), 'ctan')).toBe(6.17);
});
it('accepts the documented urban integer layout without assuming a CTAN value block', () => {
  const urban = new Array(16).fill(0);
  urban[0] = 123;
  urban[4] = 17;
  expect(decodeCardBalance(urban, 'bonobus-cadiz')).toBe(1.23);
  expect(() => decodeCardBalance(urban, 'ctan')).toThrow();
  expect(() => decodeCardBalance([123], 'bonobus-cadiz')).toThrow();
  expect(() => decodeCardBalance(valueBlock(-1), 'bonobus-cadiz')).toThrow();
});
