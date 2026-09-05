import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../stores/useThemeStore';

export type MetricTone = 'primary' | 'secondary' | 'tertiary' | 'neutral';

interface Props {
  label: string;
  value: string;
  sublabel?: string;
  tone?: MetricTone;
  align?: 'center' | 'flex-start' | 'flex-end';
  style?: ViewStyle;
}

export function MetricTile({ label, value, sublabel, tone = 'neutral', align = 'center', style }: Props) {
  const { tokens } = useTheme();

  const valueColor: Record<MetricTone, string> = {
    primary: tokens.colors.primary,
    secondary: tokens.colors.secondary,
    tertiary: tokens.colors.tertiary,
    neutral: tokens.colors.textPrimary,
  };

  return (
    <View style={[{ flex: 1, alignItems: align }, style]}>
      <Text variant="label" tone="tertiary">
        {label}
      </Text>
      <Text variant="dataMd" style={{ color: valueColor[tone], marginTop: 2 }}>
        {value}
      </Text>
      {sublabel ? (
        <Text variant="dataSm" tone="tertiary" style={{ marginTop: 1 }}>
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}
