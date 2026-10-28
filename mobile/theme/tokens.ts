import { Platform, TextStyle } from 'react-native';

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
  warning: string;
  warningSoft: string;
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
  | 'dataHero'
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

const FONT_FAMILY = Platform.select({
  web: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  default: 'System',
});

// High-Conviction Typography: Inter with tabular figures for odds and metrics
const typography: Typography = {
  display: { fontFamily: FONT_FAMILY, fontWeight: '800', fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
  headline: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  headlineSm: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  title: { fontFamily: FONT_FAMILY, fontWeight: '600', fontSize: 13, lineHeight: 18, letterSpacing: -0.1 },
  body: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 13, lineHeight: 19 },
  bodySm: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 11, lineHeight: 16 },
  label: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 10, lineHeight: 13, letterSpacing: 0.7 },
  dataHero: { fontFamily: FONT_FAMILY, fontWeight: '800', fontSize: 24, lineHeight: 28, letterSpacing: -0.5 },
  dataLg: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 19, lineHeight: 24, letterSpacing: -0.3 },
  dataMd: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 15, lineHeight: 19, letterSpacing: -0.1 },
  dataSm: { fontFamily: FONT_FAMILY, fontWeight: '600', fontSize: 12, lineHeight: 16 },
  badge: { fontFamily: FONT_FAMILY, fontWeight: '800', fontSize: 10, lineHeight: 12, letterSpacing: 0.6 },
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
  xl: 10,
  xxl: 14,
  full: 9999,
};

// True-Black Obsidian Terminal Theme
export const darkTokens: ThemeTokens = {
  mode: 'dark',
  typography,
  spacing,
  radius,
  colors: {
    background: '#07080A',
    surface: '#0F1116',
    surfaceElevated: '#151820',
    surfaceInset: '#0A0B0E',
    border: '#1E222B',
    borderStrong: '#2E3442',
    textPrimary: '#FFFFFF',
    textSecondary: '#949CAE',
    textTertiary: '#5A6272',
    primary: '#00E599', // Electric Emerald / Neon Mint
    primarySoft: 'rgba(0, 229, 153, 0.12)',
    onPrimary: '#000000',
    secondary: '#38BDF8',
    secondarySoft: 'rgba(56, 189, 248, 0.12)',
    onSecondary: '#000000',
    tertiary: '#F59E0B',
    tertiarySoft: 'rgba(245, 158, 11, 0.12)',
    onTertiary: '#000000',
    warning: '#F59E0B',
    warningSoft: 'rgba(245, 158, 11, 0.12)',
    negative: '#EF4444',
    negativeSoft: 'rgba(239, 68, 68, 0.12)',
    onNegative: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.88)',
  },
};

// Clean Institutional White Mode
export const lightTokens: ThemeTokens = {
  mode: 'light',
  typography,
  spacing,
  radius,
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceInset: '#F1F5F9',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#64748B',
    primary: '#059669',
    primarySoft: 'rgba(5, 150, 105, 0.12)',
    onPrimary: '#FFFFFF',
    secondary: '#0284C7',
    secondarySoft: 'rgba(2, 132, 199, 0.12)',
    onSecondary: '#FFFFFF',
    tertiary: '#D97706',
    tertiarySoft: 'rgba(217, 119, 6, 0.12)',
    onTertiary: '#FFFFFF',
    warning: '#D97706',
    warningSoft: 'rgba(217, 119, 6, 0.12)',
    negative: '#DC2626',
    negativeSoft: 'rgba(220, 38, 38, 0.12)',
    onNegative: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.6)',
  },
};
