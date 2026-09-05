import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../stores/useThemeStore';

export type CardElevation = 'base' | 'raised' | 'inset';

interface Props extends ViewProps {
  elevation?: CardElevation;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ elevation = 'base', padded = true, style, children, ...rest }: Props) {
  const { tokens } = useTheme();

  const background =
    elevation === 'inset'
      ? tokens.colors.surfaceInset
      : elevation === 'raised'
        ? tokens.colors.surfaceElevated
        : tokens.colors.surface;

  return (
    <View
      style={[
        {
          backgroundColor: background,
          borderWidth: 1,
          borderColor: tokens.colors.border,
          borderRadius: tokens.radius.xl,
          padding: padded ? tokens.spacing.md : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
