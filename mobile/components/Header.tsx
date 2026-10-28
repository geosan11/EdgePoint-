import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Crown, Layers, Moon, Sun, Zap } from 'lucide-react-native';
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
          height: 56 + topInset,
        },
      ]}
    >
      {/* Brand Wordmark & Quantitative Terminal Status */}
      <View style={styles.brandRow}>
        <View style={styles.brandTitleWrap}>
          <Text variant="headline" style={styles.brandTitle}>
            EDGEPOINT<Text variant="headline" tone="brand" style={{ fontWeight: '900' }}>+</Text>
          </Text>
          <View style={[styles.terminalTag, { backgroundColor: 'rgba(0, 229, 153, 0.08)', borderColor: 'rgba(0, 229, 153, 0.25)' }]}>
            <View style={[styles.pulseDot, { backgroundColor: tokens.colors.primary }]} />
            <Text variant="label" tone="brand" style={styles.liveText}>
              QUANT ENGINE
            </Text>
          </View>
        </View>
      </View>

      {/* Right Controls: Currency, Theme, Pro Status, Watchlist */}
      <View style={styles.rightControls}>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}
          onPress={toggleCurrency}
          activeOpacity={0.7}
        >
          <Text variant="label" tone="brand">
            {currency === 'NGN' ? '₦ NGN' : '$ USD'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border }]}
          onPress={toggleScheme}
          activeOpacity={0.7}
        >
          {scheme === 'dark' ? (
            <Moon size={14} color={tokens.colors.textSecondary} />
          ) : (
            <Sun size={14} color={tokens.colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={isPro ? undefined : openPaywall} activeOpacity={0.8}>
          {isPro ? (
            <Badge label="PRO" tone="positive" filled icon={<Crown size={11} color={tokens.colors.onPrimary} />} size="sm" />
          ) : (
            <Badge label="FREE" tone="neutral" icon={<Crown size={11} color={tokens.colors.textTertiary} />} size="sm" />
          )}
        </TouchableOpacity>

        {/* Watchlist quick-launcher with count bubble */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor: slipLegs.length > 0 ? 'rgba(0, 229, 153, 0.12)' : tokens.colors.surfaceInset,
              borderColor: slipLegs.length > 0 ? tokens.colors.primary : tokens.colors.border,
            },
          ]}
          onPress={() => router.push('/(tabs)/tracker')}
          activeOpacity={0.7}
        >
          <Layers size={16} color={slipLegs.length > 0 ? tokens.colors.primary : tokens.colors.textSecondary} />
          {slipLegs.length > 0 ? (
            <View style={[styles.slipBubble, { backgroundColor: tokens.colors.primary }]}>
              <Text variant="badge" style={[styles.slipCount, { color: '#000000' }]}>
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
