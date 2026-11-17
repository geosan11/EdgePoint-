import '../global.css';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Header, isLightScreenRoute } from '../components/Header';
import { PaywallModal } from '../components/PaywallModal';
import { checkProEntitlement, initRevenueCat } from '../lib/revenuecat';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { darkTokens, lightTokens } from '../theme/tokens';
import { useAppFonts } from '../theme/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setPro = useBetStore((state) => state.setPro);
  const { tokens, scheme } = useTheme();
  const fontsLoaded = useAppFonts();
  const pathname = usePathname();
  const segments = useSegments();

  const isLight = isLightScreenRoute(pathname, segments) || scheme === 'light';
  const activeBg = isLight ? lightTokens.colors.background : tokens.colors.background;

  useEffect(() => {
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
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: activeBg }]} onLayout={onLayoutRootView}>
        <StatusBar style={isLight ? 'dark' : 'light'} backgroundColor={activeBg} />
        <Header />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: activeBg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
        </Stack>
        <PaywallModal />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
