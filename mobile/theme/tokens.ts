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

// Single Font: Inter with tight letter tracking on headers & tabular figures for odds and data
const typography: Typography = {
  display: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  headline: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  headlineSm: { fontFamily: FONT_FAMILY, fontWeight: '600', fontSize: 15, lineHeight: 20, letterSpacing: -0.2 },
  title: { fontFamily: FONT_FAMILY, fontWeight: '600', fontSize: 13, lineHeight: 18 },
  body: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 13, lineHeight: 18 },
  bodySm: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 11, lineHeight: 15 },
  label: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 10, lineHeight: 13, letterSpacing: 0.5 },
  dataLg: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 18, lineHeight: 22, letterSpacing: -0.2 },
  dataMd: { fontFamily: FONT_FAMILY, fontWeight: '600', fontSize: 14, lineHeight: 18, letterSpacing: -0.1 },
  dataSm: { fontFamily: FONT_FAMILY, fontWeight: '500', fontSize: 12, lineHeight: 15 },
  badge: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 10, lineHeight: 12, letterSpacing: 0.4 },
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

// Monochromatic dark baseline (pure black #000000, slate grays #111827, #1F2937, #9CA3AF, white text)
// Paired strictly with Electric Emerald (#00E599), Red (#EF4444), and Amber (#F59E0B)
export const darkTokens: ThemeTokens = {
  mode: 'dark',
  typography,
  spacing,
  radius,
  colors: {
    background: '#000000',
    surface: '#111827',
    surfaceElevated: '#1A2234',
    surfaceInset: '#0B0F19',
    border: '#1F2937',
    borderStrong: '#374151',
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
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
    negative: '#EF4444', // Solely for negative EV / losses / errors
    negativeSoft: 'rgba(239, 68, 68, 0.12)',
    onNegative: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.85)',
  },
};

// Light institutional terminal mode
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
