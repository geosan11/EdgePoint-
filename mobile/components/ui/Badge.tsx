import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../stores/useThemeStore';

export type BadgeTone = 'positive' | 'info' | 'warning' | 'negative' | 'neutral';

interface Props {
  label: string;
  tone?: BadgeTone;
  icon?: ReactNode;
  filled?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, tone = 'neutral', icon, filled = false, size = 'md', style }: Props) {
  const { tokens } = useTheme();

  const toneMap: Record<BadgeTone, { solid: string; soft: string; on: string }> = {
    positive: { solid: tokens.colors.primary, soft: tokens.colors.primarySoft, on: tokens.colors.onPrimary },
    info: { solid: tokens.colors.secondary, soft: tokens.colors.secondarySoft, on: tokens.colors.onSecondary },
    warning: { solid: tokens.colors.tertiary, soft: tokens.colors.tertiarySoft, on: tokens.colors.onTertiary },
    negative: { solid: tokens.colors.negative, soft: tokens.colors.negativeSoft, on: tokens.colors.onNegative },
    neutral: { solid: tokens.colors.border, soft: tokens.colors.surfaceInset, on: tokens.colors.textPrimary },
  };

  const c = toneMap[tone];
  const textColor = filled ? c.on : tone === 'neutral' ? tokens.colors.textSecondary : c.solid;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          backgroundColor: filled ? c.solid : c.soft,
          borderWidth: 1,
          borderColor: c.solid,
          borderRadius: tokens.radius.md,
          paddingHorizontal: size === 'sm' ? 6 : 8,
          paddingVertical: size === 'sm' ? 2 : 4,
        },
        style,
      ]}
    >
      {icon}
      <Text variant="badge" style={{ color: textColor }}>
        {label}
      </Text>
    </View>
  );
}
