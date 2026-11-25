import { Text, Pressable } from '@/i18n/Primitives';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { useAppTheme } from '../theme';
import { RechargePoints } from './RechargePoints';
import { languageNames, useLanguage } from '../i18n/Language';
import type { UserPosition } from '../services/walkingStops';
import { OfficialTimetable } from './StopMap/OfficialTimetable';
const sections = [
  {
    id: 'fares',
    title: 'Tarifas',
    subtitle: 'Billete, bonobús y tarjeta del Consorcio'
  },
  {
    id: 'recharge',
    title: 'Puntos de recarga',
    subtitle: 'Bonobús urbano · Cádiz'
  },
  {
    id: 'frequencies',
    title: 'Frecuencias',
    subtitle: 'Intervalos de paso por línea'
  },
  {
    id: 'departures',
    title: 'Primeras y últimas salidas',
    subtitle: 'Horarios desde las cabeceras'
  }
] as const;
export function Information({
  visible,
  onClose,
  userPosition
}: {
  visible: boolean;
  onClose: () => void;
  userPosition?: UserPosition;
}) {
  const { choice, setChoice, error: languageError } = useLanguage();
  const theme = useAppTheme();
  const [section, setSection] = useState<string>();
  const [linkError, setLinkError] = useState(false);
  useEffect(() => {
    if (visible) {
      setSection(undefined);
      setLinkError(false);
    }
  }, [visible]);
  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 22, gap: 18 },
    title: { fontSize: 28, fontWeight: '800', color: theme.colors.textPrimary },
    heading: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.textPrimary
    },
    text: { fontSize: 15, lineHeight: 23, color: theme.colors.textSecondary },
    link: { fontSize: 16, fontWeight: '600', color: theme.colors.primary },
    button: {
      minHeight: 48,
      justifyContent: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface
    },
    card: {
      backgroundColor: theme.colors.surface,
      padding: 18,
      borderRadius: 20,
      gap: 8
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    amount: { fontSize: 22, fontWeight: '700', color: theme.colors.primary },
    input: {
      minHeight: 48,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      color: theme.colors.textPrimary
    }
  });
  const open = (url: string) => {
    void Linking.openURL(url).catch(() => setLinkError(true));
  };
  const back = () => (section ? setSection(undefined) : onClose());
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back}>
      <SafeAreaView style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              section
                ? 'Volver a Información y opciones'
                : 'Volver a Líneas y llegadas'
            }
            onPress={back}
            style={styles.button}
          >
            <Text style={styles.link}>
              ‹ {section ? 'Información y opciones' : 'Líneas y llegadas'}
            </Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            {sections.find((s) => s.id === section)?.title ??
              'Información y opciones'}
          </Text>
          {!section
            ? sections.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  onPress={() => {
                    setLinkError(false);
                    setSection(item.id);
                  }}
                  style={({ pressed }) => [
                    styles.card,
                    { borderWidth: 1, borderColor: theme.colors.border },
                    pressed && { backgroundColor: theme.colors.mutedSurface }
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <Text
                      accessible={false}
                      style={[styles.link, { fontSize: 26 }]}
                    >
                      {item.id === 'frequencies' || item.id === 'departures'
                        ? '◷'
                        : item.id === 'fares'
                        ? '€'
                        : '⌖'}
                    </Text>
                    <Text style={[styles.heading, { flex: 1 }]}>
                      {item.title}
                    </Text>
                    <Text
                      accessible={false}
                      style={[styles.link, { fontSize: 26 }]}
                    >
                      ›
                    </Text>
                  </View>
                  <Text style={styles.text}>{item.subtitle}</Text>
                </Pressable>
              ))
            : null}
          {section === 'fares' ? (
            <>
              <Text style={styles.text}>
                Autobuses urbanos de Cádiz · consultado el 29 de octubre de
                2026. Bonificaciones publicadas para 2026; los importes pueden
                cambiar al finalizar su vigencia.
              </Text>
              <View style={styles.card}>
                <Text style={styles.heading}>Billete ordinario</Text>
                <Text style={styles.amount}>1,10 €</Text>
                <Text style={styles.text}>
                  Un viaje. Se compra en el autobús.
                </Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.heading}>Bonobús urbano ordinario</Text>
                <Text style={styles.amount}>0,42 € / viaje</Text>
                <Text style={styles.text}>
                  Precio bonificado en 2026. Tarifa base publicada: 0,70 €. Un
                  transbordo a otra línea en 45 minutos. Fianza de la tarjeta:
                  1,50 €.
                </Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.heading}>Tarjeta del Consorcio</Text>
                <Text style={styles.amount}>0,77 € / viaje urbano</Text>
                <Text style={styles.text}>
                  En Cádiz, sin transbordo a o desde un modo interurbano. Con
                  ese transbordo: 0,27 €. No es el bonobús urbano ordinario. Los
                  viajes metropolitanos tienen tarifas distintas según los
                  saltos.
                </Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.heading}>Otros títulos urbanos</Text>
                <Text style={styles.text}>
                  Menores de 15 años: gratuito. Bonobús especial: 0,17 € por
                  viaje. Tarjeta joven: 10 € al mes. Universitarios/FP: 15 € al
                  mes. Sujetos a requisitos y bonificaciones de 2026. Mayores de
                  65: recarga anual de 5 €, según condiciones del operador.
                </Text>
              </View>
              <Pressable
                accessibilityRole="link"
                style={styles.button}
                onPress={() =>
                  open('https://tranviadecadizasanfernandoycarraca.es/tarifas')
                }
              >
                <Text style={styles.link}>Tarifas urbanas oficiales ↗</Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                style={styles.button}
                onPress={() =>
                  open(
                    'https://tranviadecadizasanfernandoycarraca.es/tarifas-3'
                  )
                }
              >
                <Text style={styles.link}>
                  Tarifas oficiales de la tarjeta del Consorcio ↗
                </Text>
              </Pressable>
            </>
          ) : null}
          {section === 'recharge' ? (
            <RechargePoints userPosition={userPosition} />
          ) : null}
          {!section ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.heading}>Idioma</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['system', 'es', 'en', 'fr', 'pt'] as const).map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={languageNames[value]}
                    accessibilityState={{ selected: choice === value }}
                    onPress={() => void setChoice(value)}
                    style={[
                      styles.button,
                      {
                        paddingHorizontal: 12,
                        borderWidth: choice === value ? 2 : 1,
                        borderColor: theme.colors.primary,
                        borderRadius: 12
                      }
                    ]}
                  >
                    <Text style={styles.link}>{languageNames[value]}</Text>
                  </Pressable>
                ))}
              </View>
              {languageError ? (
                <Text style={styles.text}>{languageError}</Text>
              ) : null}
            </View>
          ) : null}
          {linkError ? (
            <Text accessibilityRole="alert" style={styles.text}>
              No se pudo abrir la página oficial.
            </Text>
          ) : null}
        </ScrollView>
        <OfficialTimetable
          visible={section === 'frequencies' || section === 'departures'}
          singleSection
          initialSection={
            section === 'departures' ? 'departures' : 'frequencies'
          }
          onClose={() => setSection(undefined)}
          returnLabel="Volver a Información y opciones"
        />
      </SafeAreaView>
    </Modal>
  );
}
