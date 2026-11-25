import { expect, it } from '@jest/globals';
import {
  diagnosticReport,
  inspectValueBlock,
  sanitizeNfcDiagnostic
} from '../src/services/nfcDiagnostic';
it('keeps useful failure metadata while excluding UID, keys, balance and card blocks', () => {
  const raw = {
    model: 'Test phone',
    stage: 'authenticate',
    code: 'AUTH_REJECTED',
    connected: true,
    authenticated: false,
    technologies: ['NfcA', 'MifareClassic'],
    uid: 'PRIVATE_UID',
    block: [1, 2, 3],
    key: 'PRIVATE_KEY',
    balance: 123.45,
    sdk: 36
  };
  const safe = sanitizeNfcDiagnostic(raw);
  expect(safe.code).toBe('AUTH_REJECTED');
  expect(safe.technologies).toEqual(['NfcA', 'MifareClassic']);
  const report = diagnosticReport(safe);
  expect(report).not.toContain('PRIVATE_');
  expect(report).not.toContain('123.45');
  expect(safe).not.toHaveProperty('block');
  expect(safe).not.toHaveProperty('uid');
});
it('reports structural failures without exposing the value bytes', () => {
  const valid = [
    200, 0, 0, 0, 55, 255, 255, 255, 200, 0, 0, 0, 37, 218, 37, 218
  ];
  expect(Object.values(inspectValueBlock(valid)).every(Boolean)).toBe(true);
  const corrupt = [...valid];
  corrupt[8] = 1;
  expect(inspectValueBlock(corrupt).valueCopiesValid).toBe(false);
  expect(inspectValueBlock([]).blockLengthValid).toBe(false);
  expect(inspectValueBlock(corrupt)).not.toHaveProperty('block');
});
