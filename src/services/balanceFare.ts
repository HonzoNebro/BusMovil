import type { TransitCardProfile } from './cardBalance';

/** Published reference fares; the NFC profile does not identify concessionary titles. */
export function balanceFare(
  profile: TransitCardProfile | undefined,
  now = new Date()
) {
  if (!profile || now.getFullYear() !== 2026) return undefined;
  return profile === 'bonobus-cadiz'
    ? {
        cents: 42,
        label: 'Bonobús ordinario · tarifa de referencia',
        note: 'Un transbordo a otra línea en 45 minutos.',
        source: 'https://tranviadecadizasanfernandoycarraca.es/tarifas'
      }
    : {
        cents: 77,
        label: 'Viaje urbano en Cádiz · sin transbordo',
        note: 'Con transbordo interurbano: 0,27 €. Otros trayectos y títulos pueden tener tarifas distintas.',
        source: 'https://siu.cmtbc.es/es/tarifa.php'
      };
}
