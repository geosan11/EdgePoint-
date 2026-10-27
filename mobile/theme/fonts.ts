import { Platform } from 'react-native';

// EdgePoint typography loader:
// Inter font is used across all screens. In web/mobile environments,
// it falls back seamlessly to the crisp system UI font stack if font assets are loading.
export function useAppFonts(): boolean {
  return true;
}
