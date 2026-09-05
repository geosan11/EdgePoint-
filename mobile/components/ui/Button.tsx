import React, { ReactNode } from 'react';
import { ActivityIndicator, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../stores/useThemeStore';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...rest
}: Props) {
  const { tokens } = useTheme();

  const variants: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
    primary: { bg: tokens.colors.primary, border: tokens.colors.primary, text: tokens.colors.onPrimary },
    secondary: { bg: 'transparent', border: tokens.colors.secondary, text: tokens.colors.secondary },
    ghost: { bg: tokens.colors.surfaceInset, border: tokens.colors.border, text: tokens.colors.textPrimary },
    danger: { bg: tokens.colors.negativeSoft, border: tokens.colors.negative, text: tokens.colors.negative },
  };
  const v = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          backgroundColor: v.bg,
          borderWidth: 1,
          borderColor: v.border,
          borderRadius: tokens.radius.lg,
          paddingVertical: 12,
          paddingHorizontal: 16,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon}
          <Text variant="title" style={{ color: v.text }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
