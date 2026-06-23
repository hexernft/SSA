import type { ComponentType } from "react";
import {
  ArchiveRestore,
  ClipboardList,
  Files,
  Home,
  Package,
  Receipt,
  Search,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Page } from "../../types";
import logoLight from "../../assets/logo-light.png";

type SidebarProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
};

const items: Array<{
  label: string;
  page: Page;
  icon: ComponentType<{ size?: number }>;
}> = [
  { label: "Search", page: "search", icon: Search },
  { label: "Dashboard", page: "dashboard", icon: Home },
  { label: "Invoices", page: "invoices", icon: Files },
  { label: "Customers", page: "customers", icon: Users },
  { label: "Jobs", page: "orders", icon: ClipboardList },
  { label: "Receipts", page: "receipts", icon: Receipt },
  { label: "Reports", page: "reports", icon: TrendingUp },
  { label: "Products / Services", page: "products", icon: Package },
  { label: "Settings", page: "settings", icon: Settings },
  { label: "Backup", page: "backup", icon: ArchiveRestore },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar no-print">
      <div className="brand-block brand-logo-block">
        <img src={logoLight} alt="Sleek Stitch Atelier" className="sidebar-logo" />
      </div>

      <nav className="nav-list">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.page;

          return (
            <button
              key={item.page}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => onNavigate(item.page)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-note">
        <strong>Offline only</strong>
        <span>Sleek Stitch Atelier records are stored on this device. Export backups regularly.</span>
      </div>
    </aside>
  );
}
