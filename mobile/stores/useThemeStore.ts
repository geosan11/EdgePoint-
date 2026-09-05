import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { darkTokens, lightTokens, ThemeTokens } from '../theme/tokens';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeScheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'edgepoint-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function useTheme(): {
  tokens: ThemeTokens;
  mode: ThemeMode;
  scheme: ThemeScheme;
  setMode: (mode: ThemeMode) => void;
} {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const systemScheme = useColorScheme();
  const scheme: ThemeScheme = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;
  const tokens = scheme === 'light' ? lightTokens : darkTokens;

  return { tokens, mode, scheme, setMode };
}
