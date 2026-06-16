import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import { DrawerNavigator } from './src/navigation/DrawerNavigator';

export default function App() {
  useEffect(() => {
    const appId = Constants.expoConfig?.extra?.oneSignalAppId as string | undefined;
    if (appId && appId !== 'REPLACE_WITH_YOUR_ONESIGNAL_APP_ID') {
      OneSignal.initialize(appId);
      OneSignal.Notifications.requestPermission(true);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <NavigationContainer>
        <DrawerNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
