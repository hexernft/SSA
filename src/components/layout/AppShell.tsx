import type { ReactNode } from "react";
import type { Page, StaffProfile, UserRole } from "../../types";
import type { ThemeMode } from "../../lib/theme";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  children: ReactNode;
  profile?: StaffProfile | null;
  role?: UserRole;
  onSignOut?: () => void;
};

export function AppShell({
  activePage,
  onNavigate,
  theme,
  onThemeToggle,
  children,
  profile,
  role,
  onSignOut,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} role={role} />
      <main className="main-content">
        <div className="app-topbar no-print">
          <div>
            <span className="topbar-kicker">Sleek Stitch Atelier</span>
            <strong>Business Console</strong>
          </div>

          <div className="topbar-actions">
            {profile ? (
              <div className="staff-chip">
                <span>{profile.fullName}</span>
                <strong>{profile.role}</strong>
              </div>
            ) : null}

            <ThemeToggle theme={theme} onToggle={onThemeToggle} />

            {onSignOut ? (
              <button type="button" className="btn btn-secondary signout-btn" onClick={onSignOut}>
                Sign Out
              </button>
            ) : null}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
