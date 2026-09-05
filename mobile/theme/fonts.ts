import {
  useFonts as useChivoFonts,
  Chivo_400Regular,
  Chivo_600SemiBold,
  Chivo_700Bold,
  Chivo_800ExtraBold,
} from '@expo-google-fonts/chivo';
import {
  useFonts as useSpaceGroteskFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  useFonts as useJetBrainsMonoFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

// Loads the three type families the design system relies on (see theme/tokens.ts).
// Returns false until every weight is ready so the app can hold the splash screen.
export function useAppFonts(): boolean {
  const [chivoLoaded] = useChivoFonts({
    Chivo_400Regular,
    Chivo_600SemiBold,
    Chivo_700Bold,
    Chivo_800ExtraBold,
  });
  const [spaceGroteskLoaded] = useSpaceGroteskFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const [jetBrainsMonoLoaded] = useJetBrainsMonoFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  return chivoLoaded && spaceGroteskLoaded && jetBrainsMonoLoaded;
}
