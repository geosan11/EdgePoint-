import { TextStyle } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceInset: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  secondary: string;
  secondarySoft: string;
  onSecondary: string;
  tertiary: string;
  tertiarySoft: string;
  onTertiary: string;
  negative: string;
  negativeSoft: string;
  onNegative: string;
  overlay: string;
}

export type TypographyVariant =
  | 'display'
  | 'headline'
  | 'headlineSm'
  | 'title'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'dataLg'
  | 'dataMd'
  | 'dataSm'
  | 'badge';

export type Typography = Record<TypographyVariant, TextStyle>;

export interface Spacing {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  base: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface Radius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  full: number;
}

export interface ThemeTokens {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  radius: Radius;
}

// Shared type scale — Chivo (display/headline), Space Grotesk (body/UI),
// JetBrains Mono (all odds/EV/% data — tabular figures keep live-updating
// numbers from jittering column width).
const typography: Typography = {
  display: { fontFamily: 'Chivo_800ExtraBold', fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  headline: { fontFamily: 'Chivo_700Bold', fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  headlineSm: { fontFamily: 'Chivo_700Bold', fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  title: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15, lineHeight: 20 },
  body: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: 13, lineHeight: 18 },
  bodySm: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: 11, lineHeight: 16 },
  label: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 10, lineHeight: 13, letterSpacing: 0.4 },
  dataLg: { fontFamily: 'JetBrainsMono_700Bold', fontSize: 18, lineHeight: 22, letterSpacing: -0.3 },
  dataMd: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 14, lineHeight: 18, letterSpacing: -0.2 },
  dataSm: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, lineHeight: 14 },
  badge: { fontFamily: 'JetBrainsMono_700Bold', fontSize: 10, lineHeight: 12, letterSpacing: 0.3 },
};

const spacing: Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

const radius: Radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  full: 9999,
};

// Dark — sportsbook terminal (adapted from DESIGN.md), keeping EdgePoint's
// existing green/cyan/amber brand hues.
export const darkTokens: ThemeTokens = {
  mode: 'dark',
  typography,
  spacing,
  radius,
  colors: {
    background: '#0A0D14',
    surface: '#121826',
    surfaceElevated: '#161D2E',
    surfaceInset: '#0C0F17',
    border: '#1E2536',
    borderStrong: '#2A344A',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#5E6C80',
    primary: '#00E676',
    primarySoft: '#0B291B',
    onPrimary: '#090A0F',
    secondary: '#00E5FF',
    secondarySoft: '#092733',
    onSecondary: '#090A0F',
    tertiary: '#FFB300',
    tertiarySoft: '#2A200A',
    onTertiary: '#090A0F',
    negative: '#FF5252',
    negativeSoft: '#2A1214',
    onNegative: '#FFFFFF',
    overlay: 'rgba(5, 6, 10, 0.85)',
  },
};

// Light — institutional fintech terminal (adapted from DESIGN22.md).
export const lightTokens: ThemeTokens = {
  mode: 'light',
  typography,
  spacing,
  radius,
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceInset: '#f1f5f9',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textTertiary: '#64748b',
    primary: '#059669',
    primarySoft: '#ecfdf5',
    onPrimary: '#ffffff',
    secondary: '#0284c7',
    secondarySoft: '#f0f9ff',
    onSecondary: '#ffffff',
    tertiary: '#d97706',
    tertiarySoft: '#fffbeb',
    onTertiary: '#ffffff',
    negative: '#dc2626',
    negativeSoft: '#fef2f2',
    onNegative: '#ffffff',
    overlay: 'rgba(15, 23, 42, 0.4)',
  },
};
