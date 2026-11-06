import { Platform, TextStyle } from 'react-native';

export const todayTheme = {
  colors: {
    background: '#0b0e14',
    surface: '#111622',
    surfaceElevated: '#171e2e',
    surfaceInset: '#070a0f',
    surfaceMuted: '#0d111a',
    border: '#1e2638',
    borderSubtle: '#151b27',
    borderStrong: '#2b364e',
    primary: '#00e5a3', // Mockup neon mint
    primarySoft: 'rgba(0, 229, 163, 0.12)',
    primaryBorder: 'rgba(0, 229, 163, 0.35)',
    onPrimary: '#000000',
    liveCyan: '#22d3ee', // Mockup cyan for LIVE
    liveCyanSoft: 'rgba(34, 211, 238, 0.12)',
    liveCyanBorder: 'rgba(34, 211, 238, 0.35)',
    sampleAmber: '#f59e0b',
    sampleAmberSoft: 'rgba(245, 158, 11, 0.12)',
    sampleAmberBorder: 'rgba(245, 158, 11, 0.35)',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textTertiary: '#576479',
    textMuted: '#404a5c',
    textDisabled: '#2e3646',
  },
  fonts: {
    // Android requires per-weight family names; these match expo-google-fonts imports
    hanken: {
      regular: 'HankenGrotesk_400Regular',
      medium: 'HankenGrotesk_500Medium',
      semiBold: 'HankenGrotesk_600SemiBold',
      bold: 'HankenGrotesk_700Bold',
    },
    space: {
      medium: 'SpaceGrotesk_500Medium',
      semiBold: 'SpaceGrotesk_600SemiBold',
      bold: 'SpaceGrotesk_700Bold',
    },
    mono: {
      regular: 'JetBrainsMono_400Regular',
      medium: 'JetBrainsMono_500Medium',
      semiBold: 'JetBrainsMono_600SemiBold',
      bold: 'JetBrainsMono_700Bold',
    },
  },
};
