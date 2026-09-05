import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '../../stores/useThemeStore';
import { TypographyVariant } from '../../theme/tokens';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'brand'
  | 'info'
  | 'warning'
  | 'negative'
  | 'onPrimary'
  | 'inherit';

interface Props extends RNTextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  style?: TextStyle | TextStyle[];
}

export function Text({ variant = 'body', tone = 'primary', style, children, ...rest }: Props) {
  const { tokens } = useTheme();

  const toneColor: Record<Exclude<TextTone, 'inherit'>, string> = {
    primary: tokens.colors.textPrimary,
    secondary: tokens.colors.textSecondary,
    tertiary: tokens.colors.textTertiary,
    brand: tokens.colors.primary,
    info: tokens.colors.secondary,
    warning: tokens.colors.tertiary,
    negative: tokens.colors.negative,
    onPrimary: tokens.colors.onPrimary,
  };

  const colorStyle: TextStyle | undefined = tone === 'inherit' ? undefined : { color: toneColor[tone] };

  return (
    <RNText style={[tokens.typography[variant], colorStyle, style]} {...rest}>
      {children}
    </RNText>
  );
}
