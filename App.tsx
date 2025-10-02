import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from '@/screens/HomeScreen';
import { theme } from '@/theme';
import { BusDataProvider } from '@/services/BusDataContext';

export type RootStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <BusDataProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: theme.colors.onPrimary,
              headerTitleStyle: { fontFamily: theme.fonts.bold }
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'BusMovil' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </BusDataProvider>
    </SafeAreaProvider>
  );
}
