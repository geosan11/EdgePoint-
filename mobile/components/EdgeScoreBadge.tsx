import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../stores/useThemeStore';
import { Text } from './ui';

interface EdgeScoreBadgeProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
}

export function EdgeScoreBadge({ score, size = 'md' }: EdgeScoreBadgeProps) {
  const { tokens } = useTheme();

  let color = tokens.colors.primary;
  let bg = tokens.colors.primarySoft;
  let ratingLabel = 'STRONG EDGE';

  if (score >= 85) {
    color = tokens.colors.primary;
    bg = tokens.colors.primarySoft;
    ratingLabel = 'ELITE +EV';
  } else if (score >= 75) {
    color = tokens.colors.secondary;
    bg = tokens.colors.secondarySoft;
    ratingLabel = 'PRIME EDGE';
  } else if (score >= 65) {
    color = tokens.colors.tertiary;
    bg = tokens.colors.tertiarySoft;
    ratingLabel = 'SOLID VALUE';
  } else {
    color = tokens.colors.textSecondary;
    bg = tokens.colors.surfaceInset;
    ratingLabel = 'MODERATE';
  }

  const variant = size === 'sm' ? 'dataSm' : size === 'lg' ? 'dataLg' : 'dataMd';

  return (
    <View
      style={{
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: bg,
        paddingHorizontal: tokens.spacing.sm,
        paddingVertical: tokens.spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text variant={variant} style={{ color }}>
          {score.toFixed(1)}
        </Text>
        <Text variant="dataSm" style={{ color, opacity: 0.6, marginLeft: 1 }}>
          /100
        </Text>
      </View>
      <Text variant="label" style={{ color, marginTop: -1 }}>
        {ratingLabel}
      </Text>
    </View>
  );
}
