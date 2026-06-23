import type { ReactNode } from "react";
import type { Page } from "../../types";
import type { ThemeMode } from "../../lib/theme";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  children: ReactNode;
};

export function AppShell({
  activePage,
  onNavigate,
  theme,
  onThemeToggle,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <main className="main-content">
        <div className="app-topbar no-print">
          <div>
            <span className="topbar-kicker">Sleek Stitch Atelier</span>
            <strong>Business Console</strong>
          </div>

          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>

        {children}
      </main>
    </div>
  );
}
