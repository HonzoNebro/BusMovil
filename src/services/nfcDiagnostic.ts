/** Explicit allowlist: a shareable diagnostic must never contain raw blocks, UID or balance. */
const textKeys = [
  'readerRevision',
  'profile',
  'manufacturer',
  'model',
  'android',
  'stage',
  'code',
  'atqa',
  'exception'
] as const;
const numberKeys = [
  'sdk',
  'elapsedMs',
  'sak',
  'classicSize',
  'sectorCount'
] as const;
const boolKeys = [
  'urbanIdentityAuthenticated',
  'urbanBalanceAuthenticated',
  'ctanAuthenticated',
  'consistentReads',
  'connected',
  'authenticated',
  'valueCopiesValid',
  'valueComplementsValid',
  'addressValid',
  'blockLengthValid'
] as const;
export type NfcDiagnostic = Partial<
  Record<(typeof textKeys)[number], string> &
    Record<(typeof numberKeys)[number], number> &
    Record<(typeof boolKeys)[number], boolean>
> & { technologies?: string[] };
export function sanitizeNfcDiagnostic(value: unknown): NfcDiagnostic {
  if (!value || typeof value !== 'object') return {};
  const input = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of textKeys)
    if (typeof input[key] === 'string')
      result[key] = (input[key] as string).slice(0, 100);
  for (const key of numberKeys)
    if (typeof input[key] === 'number' && Number.isFinite(input[key]))
      result[key] = input[key];
  for (const key of boolKeys)
    if (typeof input[key] === 'boolean') result[key] = input[key];
  if (Array.isArray(input.technologies))
    result.technologies = input.technologies
      .filter((v) => typeof v === 'string')
      .slice(0, 12)
      .map((v) => v.slice(0, 50));
  return result as NfcDiagnostic;
}
export function inspectValueBlock(block: number[]) {
  const valid =
    block.length === 16 &&
    block.every((b) => Number.isInteger(b) && b >= 0 && b <= 255);
  return {
    blockLengthValid: valid,
    valueCopiesValid:
      valid && [0, 1, 2, 3].every((i) => block[i] === block[i + 8]),
    valueComplementsValid:
      valid && [0, 1, 2, 3].every((i) => (block[i] ^ block[i + 4]) === 255),
    addressValid:
      valid &&
      block[12] === block[14] &&
      block[13] === block[15] &&
      (block[12] ^ block[13]) === 255
  };
}
export function diagnosticReport(value: NfcDiagnostic): string {
  return (
    'Transportes Cádiz · Diagnóstico NFC\n' +
    JSON.stringify(sanitizeNfcDiagnostic(value), null, 2) +
    '\nSin UID, saldo, claves ni contenido de la tarjeta.'
  );
}
