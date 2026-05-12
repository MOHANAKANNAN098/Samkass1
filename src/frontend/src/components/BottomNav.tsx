import {
  BarChart2,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import type { TranslationKey } from "../lib/translations";
import type { Page } from "../types";

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  t: (key: TranslationKey) => string;
  language: "en" | "ta";
  role?: "admin" | "staff";
}

const ADMIN_NAV_ITEMS: {
  page: Page;
  icon: React.ElementType;
  labelKey: TranslationKey;
}[] = [
  { page: "dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { page: "clients", icon: Users, labelKey: "clients" },
  { page: "loans", icon: CreditCard, labelKey: "loans" },
  { page: "collection", icon: Wallet, labelKey: "collection" },
  { page: "reports", icon: BarChart2, labelKey: "reports" },
];

const STAFF_NAV_ITEMS: {
  page: Page;
  icon: React.ElementType;
  labelKey: TranslationKey;
}[] = [
  { page: "collection", icon: Wallet, labelKey: "collection" },
  { page: "reports", icon: BarChart2, labelKey: "reports" },
  { page: "settings", icon: Settings, labelKey: "settings" },
];

const ACTIVE_PAGES: Record<Page, Page> = {
  dashboard: "dashboard",
  clients: "clients",
  loans: "loans",
  collection: "collection",
  reports: "reports",
  settings: "settings",
  "client-profile": "clients",
  "loan-detail": "loans",
};

export default function BottomNav({
  currentPage,
  onNavigate,
  t,
  language,
  role = "admin",
}: BottomNavProps) {
  const activePage = ACTIVE_PAGES[currentPage] ?? currentPage;
  const navItems = role === "staff" ? STAFF_NAV_ITEMS : ADMIN_NAV_ITEMS;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(({ page, icon: Icon, labelKey }) => {
        const isActive = activePage === page;
        return (
          <button
            key={page}
            type="button"
            data-ocid={`nav.${page}`}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
            onClick={() => onNavigate(page)}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && <span className="nav-active-dot" />}
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span
              className={`bottom-nav-label ${
                language === "ta" ? "tamil-text" : ""
              }`}
            >
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
