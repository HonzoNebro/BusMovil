import { useLanguage } from '../i18n/Language';
import { Text, Pressable } from '@/i18n/Primitives';
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  SafeAreaView,
  Share,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { balanceFare } from '../services/balanceFare';
import { diagnosticReport } from '../services/nfcDiagnostic';
import { useAppTheme } from '../theme';
import type { CardReading } from '../hooks/useCardReader';
export function CardBalance({
  visible,
  onClose,
  status,
  reading
}: {
  visible: boolean;
  onClose: () => void;
  status: string;
  reading?: CardReading;
}) {
  const theme = useAppTheme();
  const { locale } = useLanguage();
  const [showAbout, setShowAbout] = useState(false);
  const fare = balanceFare(reading?.profile);
  const success = reading?.status === 'success';
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [shareError, setShareError] = useState(false);
  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 22, gap: 22 },
    title: { fontSize: 28, fontWeight: '800', color: theme.colors.textPrimary },
    text: { fontSize: 16, lineHeight: 24, color: theme.colors.textSecondary },
    value: { fontSize: 52, fontWeight: '800', color: theme.colors.primary },
    button: { minHeight: 48, justifyContent: 'center' },
    fare: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    fareValue: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.textPrimary
    },
    note: { fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary },
    link: { fontSize: 16, fontWeight: '600', color: theme.colors.primary },
    error: { fontSize: 16, color: theme.colors.warning }
  });
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Líneas y llegadas"
            onPress={onClose}
            style={styles.button}
          >
            <Text style={styles.link}>‹ Líneas y llegadas</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            {success ? 'Saldo de tu tarjeta' : 'Consultar saldo'}
          </Text>
          {status === 'unavailable' ? (
            <Text style={styles.error}>
              Este dispositivo no dispone de un lector NFC compatible. La
              lectura necesita un teléfono Android físico con NFC.
            </Text>
          ) : status === 'disabled' ? (
            <>
              <Text style={styles.error}>
                Activa NFC en los ajustes del teléfono y vuelve a la aplicación.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void Linking.sendIntent(
                    'android.settings.NFC_SETTINGS'
                  ).catch(() => undefined);
                }}
                style={styles.button}
              >
                <Text style={styles.link}>Abrir ajustes NFC</Text>
              </Pressable>
            </>
          ) : !success && reading?.status !== 'reading' ? (
            <View style={styles.fare}>
              <Text style={styles.value} accessible={false}>
                ◎
              </Text>
              <Text style={styles.text}>
                Acerca la tarjeta a la parte trasera del teléfono.
              </Text>
            </View>
          ) : null}
          {reading?.status === 'reading' ? (
            <Text accessibilityLiveRegion="polite" style={styles.text}>
              Leyendo tarjeta…
            </Text>
          ) : null}
          {reading?.status === 'error' ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {reading.message}
            </Text>
          ) : null}
          {reading?.status === 'success' ? (
            <>
              <Text style={styles.text}>
                {reading.profile === 'bonobus-cadiz'
                  ? 'Bonobús urbano de Cádiz'
                  : 'Tarjeta del Consorcio de Transportes'}
              </Text>
              <Text
                testID="card-balance"
                accessibilityLiveRegion="polite"
                style={styles.value}
              >
                {reading.balance!.toLocaleString(locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 3
                })}{' '}
                €
              </Text>
              <Text style={styles.text}>
                Lectura: {new Date(reading.observedAt!).toLocaleString(locale)}
              </Text>
            </>
          ) : null}
          {success && fare ? (
            <View testID="balance-fare" style={styles.fare}>
              <Text style={styles.note}>Precio por viaje</Text>
              <Text style={styles.fareValue}>
                {(fare.cents / 100).toLocaleString(locale, {
                  style: 'currency',
                  currency: 'EUR'
                })}
              </Text>
              <Text style={styles.note}>{fare.label}</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sobre esta consulta"
            accessibilityState={{ expanded: showAbout }}
            onPress={() => setShowAbout(!showAbout)}
            style={styles.button}
          >
            <Text style={styles.link}>
              {showAbout ? '⌃ Sobre esta consulta' : '⌄ Sobre esta consulta'}
            </Text>
          </Pressable>
          {showAbout ? (
            <View style={{ gap: 12 }}>
              {fare ? (
                <>
                  <Text style={styles.note}>{fare.note}</Text>
                  <Text style={styles.note}>
                    Tarifas de referencia de 2026, válidas hasta el 31 de
                    diciembre. Consultadas el 4 de noviembre de 2026. El perfil
                    NFC no identifica bonificaciones personales.
                  </Text>
                  <Pressable
                    accessibilityRole="link"
                    style={styles.button}
                    onPress={() =>
                      void Linking.openURL(fare.source).catch(() =>
                        setShareError(true)
                      )
                    }
                  >
                    <Text style={styles.link}>Consultar tarifa oficial ↗</Text>
                  </Pressable>
                  {shareError ? (
                    <Text style={styles.error}>
                      No se pudo abrir la página oficial.
                    </Text>
                  ) : null}
                </>
              ) : success ? (
                <Text style={styles.note}>
                  Consulta las tarifas vigentes en Información.
                </Text>
              ) : null}
              <Text style={styles.note}>
                También puedes acercar la tarjeta desde el inicio. Mantén
                Transportes Cádiz visible y el teléfono desbloqueado.
              </Text>
              <Text style={styles.note}>
                Consulta local: no se guarda ni se envía información de la
                tarjeta.
              </Text>
              <Text style={styles.note}>
                Si falla, mantén la tarjeta quieta y fuera de la cartera.
                Algunos teléfonos no admiten este tipo de tarjeta.
              </Text>
              <Text style={styles.note}>Lector nfc-diag-3.</Text>
            </View>
          ) : null}
          {reading?.diagnostic && (reading.status === 'error' || showAbout) ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver diagnóstico NFC"
                accessibilityState={{ expanded: showDiagnostic }}
                onPress={() => setShowDiagnostic(!showDiagnostic)}
                style={styles.button}
              >
                <Text style={styles.link}>
                  {showDiagnostic
                    ? 'Ocultar diagnóstico NFC'
                    : 'Ver diagnóstico NFC'}
                </Text>
              </Pressable>
              {showDiagnostic ? (
                <>
                  <Text selectable testID="nfc-diagnostic" style={styles.text}>
                    {diagnosticReport(reading.diagnostic)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Compartir diagnóstico NFC"
                    style={styles.button}
                    onPress={() => {
                      setShareError(false);
                      void Share.share({
                        message: diagnosticReport(reading.diagnostic!)
                      }).catch(() => setShareError(true));
                    }}
                  >
                    <Text style={styles.link}>Compartir diagnóstico</Text>
                  </Pressable>
                  {shareError ? (
                    <Text style={styles.error}>
                      No se pudo abrir el menú de compartir. Puedes seleccionar
                      y copiar el texto del diagnóstico.
                    </Text>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
