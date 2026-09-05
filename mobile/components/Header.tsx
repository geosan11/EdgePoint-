import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Crown, Layers, Moon, Sparkles, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useBetStore } from '../stores/useBetStore';
import { useTheme } from '../stores/useThemeStore';
import { Badge, Text } from './ui';

export function Header() {
  const router = useRouter();
  const { isPro, openPaywall, slipLegs } = useBetStore();
  const { tokens, scheme, setMode } = useTheme();

  const toggleScheme = () => setMode(scheme === 'dark' ? 'light' : 'dark');

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: tokens.colors.background, borderBottomColor: tokens.colors.border },
      ]}
    >
      {/* Brand Logo & Name */}
      <View style={styles.brandRow}>
        <View
          style={[
            styles.logoBadge,
            { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
          ]}
        >
          <Sparkles size={16} color={tokens.colors.primary} />
        </View>
        <Text variant="headline">
          EdgePoint<Text variant="headline" tone="brand">+</Text>
        </Text>
      </View>

      {/* Right Controls: Theme Toggle, Pro Badge, Slip Indicator */}
      <View style={styles.rightControls}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
          onPress={toggleScheme}
          activeOpacity={0.8}
        >
          {scheme === 'dark' ? (
            <Moon size={16} color={tokens.colors.textSecondary} />
          ) : (
            <Sun size={16} color={tokens.colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={isPro ? undefined : openPaywall} activeOpacity={0.8}>
          {isPro ? (
            <Badge label="PRO" tone="positive" filled icon={<Crown size={12} color={tokens.colors.onPrimary} />} />
          ) : (
            <Badge label="GET PRO" tone="warning" icon={<Crown size={12} color={tokens.colors.tertiary} />} />
          )}
        </TouchableOpacity>

        {/* Betslip quick-launcher */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
          onPress={() => router.push('/(tabs)/parlay')}
          activeOpacity={0.8}
        >
          <Layers size={18} color={tokens.colors.secondary} />
          {slipLegs.length > 0 && (
            <View style={[styles.slipCountBubble, { backgroundColor: tokens.colors.primary }]}>
              <Text variant="badge" tone="onPrimary" style={styles.slipCountText}>
                {slipLegs.length}
              </Text>
            </View>
          )}
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
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  slipCountBubble: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slipCountText: {
    fontSize: 10,
  },
});
