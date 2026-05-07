import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the current color scheme.
 * Respects the user's theme preference (system / light / dark)
 * set via ThemeContext — overrides the device system setting when
 * the user has explicitly chosen a mode in Settings.
 */
export function useColors() {
  const { resolved } = useTheme();
  const palette =
    resolved === "dark" && "dark" in colors
      ? (colors as unknown as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
