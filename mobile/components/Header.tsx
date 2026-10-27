import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Crown, Layers, Moon, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Text } from './ui';

export function Header() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPro, openPaywall, slipLegs, currency, setCurrency } = useBetStore();
  const { tokens, scheme, setMode } = useTheme();

  const toggleScheme = () => setMode(scheme === 'dark' ? 'light' : 'dark');
  const toggleCurrency = () => setCurrency(currency === 'NGN' ? 'USD' : 'NGN');

  const topInset = Math.max(insets.top, 8);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.background,
          borderBottomColor: tokens.colors.border,
          paddingTop: topInset,
          height: 54 + topInset,
        },
      ]}
    >
      {/* Brand Logo & Live Pulse */}
      <View style={styles.brandRow}>
        <View style={styles.brandTitleWrap}>
          <Text variant="headline" style={styles.brandTitle}>
            EdgePoint<Text variant="headline" tone="brand">+</Text>
          </Text>
          <View style={styles.livePulse}>
            <View style={[styles.pulseDot, { backgroundColor: tokens.colors.primary }]} />
            <Text variant="badge" tone="brand" style={styles.liveText}>
              LIVE TERMINAL
            </Text>
          </View>
        </View>
      </View>

      {/* Right Action Controls: Currency Toggle, Theme, Pro Status, Betslip */}
      <View style={styles.rightControls}>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
          onPress={toggleCurrency}
          activeOpacity={0.7}
        >
          <Text variant="badge" tone="brand">
            {currency === 'NGN' ? '₦ NGN' : '$ USD'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
          onPress={toggleScheme}
          activeOpacity={0.7}
        >
          {scheme === 'dark' ? (
            <Moon size={15} color={tokens.colors.textSecondary} />
          ) : (
            <Sun size={15} color={tokens.colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={isPro ? undefined : openPaywall} activeOpacity={0.8}>
          {isPro ? (
            <Badge label="PRO" tone="positive" filled icon={<Crown size={11} color={tokens.colors.onPrimary} />} size="sm" />
          ) : (
            <Badge label="PRO" tone="neutral" icon={<Crown size={11} color={tokens.colors.primary} />} size="sm" />
          )}
        </TouchableOpacity>

        {/* Betslip quick-launcher with count badge */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor: tokens.colors.surface,
              borderColor: slipLegs.length > 0 ? tokens.colors.primary : tokens.colors.border,
            },
          ]}
          onPress={() => router.push('/(tabs)/tracker')}
          activeOpacity={0.7}
        >
          <Layers size={17} color={slipLegs.length > 0 ? tokens.colors.primary : tokens.colors.textSecondary} />
          {slipLegs.length > 0 ? (
            <View style={[styles.slipBubble, { backgroundColor: tokens.colors.primary }]}>
              <Text variant="badge" tone="onPrimary" style={styles.slipCount}>
                {slipLegs.length}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
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
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontWeight: '800',
  },
});
