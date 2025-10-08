import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from '@/screens/HomeScreen';
import { theme } from '@/theme';
import { BusDataProvider } from '@/services/BusDataContext';

export default function App(): JSX.Element {
  return (
    <BusDataProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <HomeScreen />
      </SafeAreaView>
    </BusDataProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  }
});
