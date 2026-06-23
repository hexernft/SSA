export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "sleek-stitch-theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return "dark";
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}
