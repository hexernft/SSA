import { Moon, Sun } from "lucide-react";
import type { ThemeMode } from "../../lib/theme";

type ThemeToggleProps = {
  theme: ThemeMode;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className="theme-toggle icon-only"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      <Icon size={18} />
    </button>
  );
}
