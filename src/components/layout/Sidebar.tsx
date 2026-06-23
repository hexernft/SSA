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
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Page, UserRole } from "../../types";
import logoLight from "../../assets/logo-light.png";

type SidebarProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
  role?: UserRole;
};

const items: Array<{
  label: string;
  page: Page;
  icon: ComponentType<{ size?: number }>;
  adminOnly?: boolean;
}> = [
  { label: "Search", page: "search", icon: Search },
  { label: "Dashboard", page: "dashboard", icon: Home },
  { label: "Invoices", page: "invoices", icon: Files },
  { label: "Customers", page: "customers", icon: Users },
  { label: "Jobs", page: "orders", icon: ClipboardList },
  { label: "Receipts", page: "receipts", icon: Receipt },
  { label: "Reports", page: "reports", icon: TrendingUp, adminOnly: true },
  { label: "Products / Services", page: "products", icon: Package, adminOnly: true },
  { label: "Manage Staff", page: "manage-staff", icon: ShieldCheck, adminOnly: true },
  { label: "Settings", page: "settings", icon: Settings, adminOnly: true },
  { label: "Backup", page: "backup", icon: ArchiveRestore, adminOnly: true },
];

export function Sidebar({ activePage, onNavigate, role }: SidebarProps) {
  const visibleItems = items.filter((item) => !item.adminOnly || role === "admin");

  return (
    <aside className="sidebar no-print">
      <div className="brand-block brand-logo-block">
        <img src={logoLight} alt="Sleek Stitch Atelier" className="sidebar-logo" />
      </div>

      <nav className="nav-list">
        {visibleItems.map((item) => {
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
        <strong>Sleek Stitch Only</strong>
        <span>Staff access is controlled by admin through Manage Staff.</span>
      </div>
    </aside>
  );
}
