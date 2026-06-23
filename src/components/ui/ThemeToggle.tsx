import { Moon, Sun } from "lucide-react";
import type { ThemeMode } from "../../lib/theme";

type ThemeToggleProps = {
  theme: ThemeMode;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isLight = theme === "light";

  return (
    <button
      type="button"
      className="theme-toggle no-print"
      onClick={onToggle}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <span className="theme-toggle-icon">
        {isLight ? <Sun size={16} /> : <Moon size={16} />}
      </span>
      <span>{isLight ? "Light" : "Dark"}</span>
    </button>
  );
}
