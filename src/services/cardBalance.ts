/** Documented CTAN and Cádiz urban balance formats (see docs/nfc.md).
 * Independent, read-only decoder. Reject incomplete or inconsistent value blocks. */
export type TransitCardProfile = 'ctan' | 'bonobus-cadiz';
export function decodeCardBalance(
  block: number[],
  profile: TransitCardProfile = 'ctan'
): number {
  if (
    block.length !== 16 ||
    block.some((b) => !Number.isInteger(b) || b < 0 || b > 255)
  )
    throw new Error('Lectura incompleta de la tarjeta. Vuelve a acercarla.');
  const units = new DataView(
    Uint8Array.from(block.slice(0, 4)).buffer
  ).getInt32(0, true);
  if (units < 0)
    throw new Error('No se ha podido interpretar el saldo de esta tarjeta.');
  // Urban Cádiz stores cents, not CTAN half cents. Authentication/identity and
  // two identical hardware reads are checked before this decoder is called.
  if (profile === 'bonobus-cadiz') return units / 100;
  for (let i = 0; i < 4; i++)
    if (block[i] !== block[i + 8] || (block[i] ^ block[i + 4]) !== 255)
      throw new Error(
        'El saldo leído no es válido. Vuelve a acercar la tarjeta.'
      );
  if (
    block[12] !== block[14] ||
    block[13] !== block[15] ||
    (block[12] ^ block[13]) !== 255
  )
    throw new Error('Formato de tarjeta no reconocido.');
  return units / 200;
}
