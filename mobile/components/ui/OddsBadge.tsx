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
            ? tokens.colors.primarySoft
            : tokens.colors.surfaceInset,
          borderColor: isSelected
            ? tokens.colors.primary
            : hasEdge
              ? 'rgba(0, 229, 153, 0.4)'
              : tokens.colors.border,
        },
        style,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            variant="bodySm"
            tone={isSelected ? 'brand' : 'secondary'}
            numberOfLines={1}
            style={styles.label}
          >
            {label}
          </Text>
          {bookmaker ? (
            <Text variant="badge" tone="tertiary" style={styles.bookmaker}>
              {bookmaker}
            </Text>
          ) : null}
        </View>

        <View style={styles.bottomRow}>
          <Text
            variant="dataMd"
            tone={isSelected ? 'brand' : 'primary'}
            style={styles.odds}
          >
            {formattedOdds}
          </Text>
          {edgeText ? (
            <Text variant="badge" tone="brand" style={styles.edge}>
              {edgeText}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 80,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  content: {
    gap: 2,
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
    fontSize: 11,
    fontWeight: '500',
  },
  bookmaker: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
  odds: {
    fontSize: 14,
    fontWeight: '700',
  },
  edge: {
    fontSize: 10,
    fontWeight: '700',
  },
});
