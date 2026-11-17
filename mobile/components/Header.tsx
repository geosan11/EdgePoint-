import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Crown, Layers, Moon, Sun, Zap } from 'lucide-react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBetStore } from '../stores/useBetStore';
import { ThemeContext, useTheme } from '../stores/useThemeStore';
import { darkTokens, lightTokens } from '../theme/tokens';
import { Badge, Text } from './ui';

export function isLightScreenRoute(pathname?: string | null, segments?: string[] | null): boolean {
  if (pathname) {
    if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index') return true;
    if (pathname === '/profile' || pathname === '/(tabs)/profile') return true;
    if (pathname === '/scanner' || pathname === '/(tabs)/scanner') return true;
    if (pathname.startsWith('/match/') || pathname === '/match') return true;
  }
  if (segments && segments.length > 0) {
    if (segments[0] === 'match') return true;
    const last = segments[segments.length - 1];
    if (last === '(tabs)' || last === 'index') return true;
    if (last === 'profile') return true;
    if (last === 'scanner') return true;
  }
  if (!pathname || pathname === '') return true;
  return false;
}

export function Header() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const segments = useSegments();
  const { isPro, openPaywall, slipLegs, currency, setCurrency } = useBetStore();
  const { tokens, scheme, setMode } = useTheme();

  const isLight = isLightScreenRoute(pathname, segments) || scheme === 'light';
  const activeTokens = isLight ? lightTokens : darkTokens;

  const toggleScheme = () => setMode(scheme === 'dark' ? 'light' : 'dark');
  const toggleCurrency = () => setCurrency(currency === 'NGN' ? 'USD' : 'NGN');

  const topInset = Math.max(insets.top, 8);

  return (
    <ThemeContext.Provider value={activeTokens}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: activeTokens.colors.background,
            borderBottomColor: activeTokens.colors.border,
            paddingTop: topInset,
            height: 56 + topInset,
          },
        ]}
      >
        {/* Brand Wordmark & Quantitative Terminal Status */}
        <View style={styles.brandRow}>
          <View style={styles.brandTitleWrap}>
            <Text variant="headline" style={[styles.brandTitle, { color: activeTokens.colors.textPrimary }]}>
              EDGEPOINT<Text variant="headline" style={{ fontWeight: '900', color: activeTokens.colors.primary }}>+</Text>
            </Text>
            <View
              style={[
                styles.terminalTag,
                {
                  backgroundColor:
                    activeTokens.mode === 'light' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(0, 229, 153, 0.08)',
                  borderColor:
                    activeTokens.mode === 'light' ? 'rgba(5, 150, 105, 0.25)' : 'rgba(0, 229, 153, 0.25)',
                },
              ]}
            >
              <View style={[styles.pulseDot, { backgroundColor: activeTokens.colors.primary }]} />
              <Text variant="label" style={[styles.liveText, { color: activeTokens.colors.primary }]}>
                QUANT ENGINE
              </Text>
            </View>
          </View>
        </View>

        {/* Right Controls: Currency, Theme, Pro Status, Watchlist */}
        <View style={styles.rightControls}>
          <TouchableOpacity
            style={[
              styles.smallButton,
              { backgroundColor: activeTokens.colors.surfaceInset, borderColor: activeTokens.colors.border },
            ]}
            onPress={toggleCurrency}
            activeOpacity={0.7}
          >
            <Text variant="label" style={{ color: activeTokens.colors.primary }}>
              {currency === 'NGN' ? '₦ NGN' : '$ USD'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: activeTokens.colors.surfaceInset, borderColor: activeTokens.colors.border },
            ]}
            onPress={toggleScheme}
            activeOpacity={0.7}
          >
            {activeTokens.mode === 'dark' ? (
              <Moon size={14} color={activeTokens.colors.textSecondary} />
            ) : (
              <Sun size={14} color={activeTokens.colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={isPro ? undefined : openPaywall} activeOpacity={0.8}>
            {isPro ? (
              <Badge label="PRO" tone="positive" filled icon={<Crown size={11} color={activeTokens.colors.onPrimary} />} size="sm" />
            ) : (
              <Badge label="FREE" tone="neutral" icon={<Crown size={11} color={activeTokens.colors.textTertiary} />} size="sm" />
            )}
          </TouchableOpacity>

          {/* Watchlist quick-launcher with count bubble */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor:
                  slipLegs.length > 0
                    ? activeTokens.mode === 'light'
                      ? 'rgba(5, 150, 105, 0.12)'
                      : 'rgba(0, 229, 153, 0.12)'
                    : activeTokens.colors.surfaceInset,
                borderColor: slipLegs.length > 0 ? activeTokens.colors.primary : activeTokens.colors.border,
              },
            ]}
            onPress={() => router.push('/(tabs)/tracker')}
            activeOpacity={0.7}
          >
            <Layers size={16} color={slipLegs.length > 0 ? activeTokens.colors.primary : activeTokens.colors.textSecondary} />
            {slipLegs.length > 0 ? (
              <View style={[styles.slipBubble, { backgroundColor: activeTokens.colors.primary }]}>
                <Text variant="badge" style={[styles.slipCount, { color: '#FFFFFF' }]}>
                  {slipLegs.length}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  terminalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  liveText: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallButton: {
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  slipBubble: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  slipCount: {
    fontSize: 9,
    fontWeight: '900',
  },
});
