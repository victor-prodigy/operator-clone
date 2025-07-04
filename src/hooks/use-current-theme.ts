// para controlar o tema do site para o clerk
import { useTheme } from "next-themes";

export const useCurrentTheme = () => {
  const { theme, systemTheme } = useTheme();

  if (theme === "dark" || theme === "light") {
    return theme;
  }

  return systemTheme;
};
