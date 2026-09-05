import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Header } from '../components/Header';
import { PaywallModal } from '../components/PaywallModal';
import { checkProEntitlement, initRevenueCat } from '../lib/revenuecat';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { useAppFonts } from '../theme/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setPro = useBetStore((state) => state.setPro);
  const { tokens, scheme } = useTheme();
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    // Initialize RevenueCat, then restore Pro state for an already-entitled user
    // (e.g. reinstalling the app or launching on a new device) instead of leaving
    // everything locked until they manually tap "Restore Purchases".
    (async () => {
      await initRevenueCat();
      const isPro = await checkProEntitlement();
      if (isPro) setPro(true);
    })();
  }, [setPro]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background }]} onLayout={onLayoutRootView}>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} backgroundColor={tokens.colors.background} />
      <Header />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <PaywallModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
