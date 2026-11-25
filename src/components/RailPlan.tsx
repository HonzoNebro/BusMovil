import React, { useState } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  View,
  StyleSheet,
  useWindowDimensions,
  Linking
} from 'react-native';
import { Text, Pressable } from '../i18n/Primitives';
import { PinchImage } from './PinchImage';
import { useAppTheme } from '../theme';
const plans = {
  commuter: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require('../assets/rail/plans/cercanias.png'),
    width: 2400,
    height: 2400,
    credit: 'Renfe',
    url: 'https://www.renfe.com/es/es/cercanias/cercanias-cadiz/mapas'
  },
  tram: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require('../assets/rail/plans/trambahia.png'),
    width: 1981,
    height: 2800,
    credit: 'Trambahía · Junta de Andalucía',
    url: 'https://trambahia.es/sites/default/files/Trambahia_mapa.pdf'
  }
};
export function RailPlan({ mode }: { mode: 'commuter' | 'tram' }) {
  const plan = plans[mode],
    theme = useAppTheme(),
    { width } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false),
    [resetKey, setResetKey] = useState(0),
    [error, setError] = useState(false);
  const previewWidth = Math.max(200, width - 40),
    previewHeight = Math.min(380, (previewWidth * plan.height) / plan.width);
  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    controls: { padding: 16, gap: 8 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    button: {
      minHeight: 44,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface
    },
    link: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
    note: { fontSize: 12, color: theme.colors.textSecondary },
    preview: {
      backgroundColor: 'white',
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border
    }
  });
  const caption =
    mode === 'tram'
      ? 'Plano oficial de Trambahía'
      : 'Plano oficial de Cercanías';
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ampliar plano oficial"
        style={styles.preview}
        onPress={() => {
          setResetKey((v) => v + 1);
          setExpanded(true);
        }}
      >
        <Image
          testID="rail-plan-preview"
          source={plan.source}
          accessibilityLabel={caption}
          resizeMode="contain"
          style={{ width: '100%', height: previewHeight }}
        />
      </Pressable>
      <Text style={styles.note}>
        Toca el plano para ampliarlo. Documento original en español.
      </Text>
      <Text style={styles.note}>{plan.credit}</Text>
      {expanded ? (
        <Modal
          visible
          animationType="slide"
          onRequestClose={() => setExpanded(false)}
        >
          <SafeAreaView style={styles.screen}>
            <View style={styles.controls}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Volver al servicio ferroviario"
                style={styles.button}
                onPress={() => setExpanded(false)}
              >
                <Text style={styles.link}>‹ Volver</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ajustar plano"
                style={styles.button}
                onPress={() => setResetKey((v) => v + 1)}
              >
                <Text style={styles.link}>Ajustar</Text>
              </Pressable>
              <Text style={styles.note}>
                Amplía con dos dedos y desplaza con uno.
              </Text>
            </View>
            <PinchImage
              source={plan.source}
              imageWidth={plan.width}
              imageHeight={plan.height}
              label={caption}
              resetKey={resetKey}
            />
            <View style={styles.controls}>
              <Text style={styles.note}>
                {plan.credit} · <Text>Documento original en español.</Text>
              </Text>
              <Pressable
                accessibilityRole="link"
                style={styles.button}
                onPress={() => {
                  setError(false);
                  void Linking.openURL(plan.url).catch(() => setError(true));
                }}
              >
                <Text style={styles.link}>Consultar plano original ↗</Text>
              </Pressable>
              {error ? (
                <Text accessibilityRole="alert" style={styles.note}>
                  No se pudo abrir la página oficial.
                </Text>
              ) : null}
            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
}
