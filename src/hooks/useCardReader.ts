import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform
} from 'react-native';
import {
  sanitizeNfcDiagnostic,
  inspectValueBlock,
  type NfcDiagnostic
} from '../services/nfcDiagnostic';
import {
  decodeCardBalance,
  type TransitCardProfile
} from '../services/cardBalance';
export type CardReading = {
  status: 'reading' | 'success' | 'error';
  balance?: number;
  profile?: TransitCardProfile;
  message?: string;
  observedAt?: number;
  diagnostic?: NfcDiagnostic;
};
export function useCardReader(
  active: boolean,
  onCard: (reading: CardReading) => void
) {
  const [status, setStatus] = useState('unavailable');
  const handler = useRef(onCard);
  handler.current = onCard;
  useEffect(() => {
    const reader =
      Platform.OS === 'android' ? NativeModules.TransitNfc : undefined;
    if (!reader) return;
    let live = true;
    const update = () => {
      const foreground = AppState.currentState === 'active';
      reader.setActive(active && foreground);
      void reader
        .getStatus()
        .then((next: string) => {
          if (live) setStatus(next);
        })
        .catch(() => {
          if (live) setStatus('unavailable');
        });
    };
    const emitter = new NativeEventEmitter(reader);
    const event = emitter.addListener(
      'TransitCard',
      (data: {
        status: string;
        message?: string;
        block?: number[];
        diagnostic?: unknown;
      }) => {
        if (!live || !active || AppState.currentState !== 'active') return;
        const diagnostic = sanitizeNfcDiagnostic(data.diagnostic);
        if (data.status === 'reading')
          handler.current({ status: 'reading', diagnostic });
        else if (data.status === 'read') {
          try {
            const profile = diagnostic.profile ?? 'ctan';
            if (profile !== 'ctan' && profile !== 'bonobus-cadiz')
              throw new Error('Perfil de tarjeta no reconocido.');
            if (
              profile === 'bonobus-cadiz' &&
              (diagnostic.urbanIdentityAuthenticated !== true ||
                diagnostic.urbanBalanceAuthenticated !== true ||
                diagnostic.consistentReads !== true)
            )
              throw new Error(
                'La lectura del bonobús no está verificada. Vuelve a acercar la tarjeta.'
              );
            handler.current({
              status: 'success',
              balance: decodeCardBalance(data.block ?? [], profile),
              profile,
              observedAt: Date.now(),
              diagnostic: {
                ...diagnostic,
                ...(profile === 'ctan'
                  ? inspectValueBlock(data.block ?? [])
                  : { blockLengthValid: data.block?.length === 16 }),
                code: 'SUCCESS'
              }
            });
          } catch (error) {
            handler.current({
              status: 'error',
              diagnostic: {
                ...diagnostic,
                ...(diagnostic.profile === 'bonobus-cadiz'
                  ? { blockLengthValid: data.block?.length === 16 }
                  : inspectValueBlock(data.block ?? [])),
                code: 'INVALID_VALUE_BLOCK'
              },
              message:
                error instanceof Error
                  ? error.message
                  : 'No se pudo interpretar la tarjeta.'
            });
          }
        } else
          handler.current({
            status: 'error',
            diagnostic,
            message: data.message ?? 'No se pudo leer la tarjeta.'
          });
      }
    );
    const app = AppState.addEventListener('change', update);
    update();
    return () => {
      live = false;
      reader.setActive(false);
      event.remove();
      app.remove();
    };
  }, [active]);
  return status;
}
