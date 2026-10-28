import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../stores/useThemeStore';

interface OddsBadgeProps extends TouchableOpacityProps {
  label: string;
  odds: number | string;
  bookmaker?: string;
  isSelected?: boolean;
  hasEdge?: boolean;
  edgeText?: string;
}

export function OddsBadge({
  label,
  odds,
  bookmaker,
  isSelected = false,
  hasEdge = false,
  edgeText,
  style,
  ...rest
}: OddsBadgeProps) {
  const { tokens } = useTheme();

  const formattedOdds = typeof odds === 'number' ? odds.toFixed(2) : odds;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: isSelected
            ? tokens.colors.primary
            : tokens.colors.surfaceInset,
          borderColor: isSelected
            ? tokens.colors.primary
            : hasEdge
              ? 'rgba(0, 229, 153, 0.45)'
              : tokens.colors.border,
          borderLeftColor: hasEdge && !isSelected ? tokens.colors.primary : undefined,
          borderLeftWidth: hasEdge && !isSelected ? 2.5 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {/* Top Meta Line: Market/Line & Bookmaker */}
        <View style={styles.topRow}>
          <Text
            variant="label"
            numberOfLines={1}
            style={[
              styles.label,
              { color: isSelected ? '#000000' : tokens.colors.textSecondary },
            ]}
          >
            {label}
          </Text>
          {bookmaker ? (
            <View
              style={[
                styles.bookTag,
                {
                  backgroundColor: isSelected ? 'rgba(0,0,0,0.15)' : tokens.colors.surfaceElevated,
                  borderColor: isSelected ? 'rgba(0,0,0,0.2)' : tokens.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.bookText,
                  { color: isSelected ? '#000000' : tokens.colors.textTertiary },
                ]}
              >
                {bookmaker.slice(0, 4).toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Hero Odds & Edge Delta */}
        <View style={styles.bottomRow}>
          <Text
            variant="dataLg"
            style={[
              styles.odds,
              { color: isSelected ? '#000000' : tokens.colors.textPrimary },
            ]}
          >
            {formattedOdds}
          </Text>
          {edgeText ? (
            <View
              style={[
                styles.edgeTag,
                {
                  backgroundColor: isSelected ? '#000000' : 'rgba(0, 229, 153, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.edgeText,
                  { color: isSelected ? tokens.colors.primary : tokens.colors.primary },
                ]}
              >
                {edgeText}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    minWidth: 84,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  content: {
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bookTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  bookText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  odds: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  edgeTag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  edgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
