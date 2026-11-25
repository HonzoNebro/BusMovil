import { LanguageProvider } from '@/i18n/Language';
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

import HomeScreen from '@/screens/HomeScreen';
import { useAppTheme } from '@/theme';
import { BusDataProvider } from '@/services/BusDataContext';

export default function App(): JSX.Element {
  const theme = useAppTheme();
  return (
    <LanguageProvider>
      <BusDataProvider>
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: theme.colors.background }
          ]}
        >
          <StatusBar
            barStyle={theme.isDark ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.background}
          />
          <HomeScreen />
        </SafeAreaView>
      </BusDataProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
