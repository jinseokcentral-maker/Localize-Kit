import { useEffect } from "react";
import { useThemeStore } from "~/stores/themeStores";

/**
 * useTheme hook
 * - Syncs theme state with DOM (html class)
 * - Provides theme state and toggle function
 */
export function useTheme() {
  const { theme, setTheme, toggleTheme } = useThemeStore();

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Initialize theme from system preference on first load
  useEffect(() => {
    const stored = localStorage.getItem("localizekit-theme");
    if (!stored) {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, [setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
  };
}

export default useTheme;
