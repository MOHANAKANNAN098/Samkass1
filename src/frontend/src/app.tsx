import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import ThemeToggle from "./components/ThemeToggle";
import UpgradeModal from "./components/UpgradeModal";
import { useApp } from "./hooks/useApp";
import { useTheme } from "./hooks/useTheme";
import { initNotifications } from "./lib/notifications";
import type { Page } from "./types";

import ClientProfilePage from "./pages/ClientProfilePage";
import ClientsPage from "./pages/ClientsPage";
import CollectionPage from "./pages/CollectionPage";
import DashboardPage from "./pages/DashboardPage";
import LoanDetailPage from "./pages/LoanDetailPage";
import LoansPage from "./pages/LoansPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

export type AppInstance = ReturnType<typeof useApp>;
export interface PageProps {
  app: AppInstance;
}

const PAGE_COMPONENTS: Record<Page, React.ComponentType<PageProps>> = {
  dashboard: DashboardPage,
  clients: ClientsPage,
  loans: LoansPage,
  collection: CollectionPage,
  reports: ReportsPage,
  settings: SettingsPage,
  "client-profile": ClientProfilePage,
  "loan-detail": LoanDetailPage,
};

const HEADER_TITLES: Record<Page, string> = {
  dashboard: "Dashboard",
  clients: "Clients",
  loans: "Loans",
  collection: "Collection",
  reports: "Reports",
  settings: "Settings",
  "client-profile": "Client Profile",
  "loan-detail": "Loan Details",
};

export default function App() {
  const app = useApp();
  const { isLoggedIn, hasAuth } = app;

  // Auth gates
  if (!hasAuth) return <RegisterPage app={app} />;
  if (!isLoggedIn) return <LoginPage app={app} />;

  return <AppShell app={app} />;
}

function AppShell({ app }: { app: AppInstance }) {
  const {
    currentPage,
    navigate,
    t,
    language,
    settings,
    loans,
    clients,
    payments,
    showUpgradeModal,
    setShowUpgradeModal,
    upgradePro,
    updateSettings,
    role,
  } = app;
  const [showSettings, setShowSettings] = useState(false);
  const { isDark } = useTheme();

  // Initialize notifications on login
  useEffect(() => {
    void initNotifications(loans, clients, payments);
  }, [loans, clients, payments]);

  const activePage: Page = showSettings ? "settings" : currentPage;
  const PageComponent =
    PAGE_COMPONENTS[activePage] ?? PAGE_COMPONENTS.dashboard;
  const title =
    t(
      activePage === "client-profile"
        ? "clientProfile"
        : activePage === "loan-detail"
          ? "loanDetails"
          : activePage,
    ) || HEADER_TITLES[activePage];

  const handleNavigate = (page: Page, id?: string) => {
    setShowSettings(false);
    navigate(page, id);
  };

  const name = settings.financierName || "KF";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`app-wrapper ${isDark ? "" : "light-mode"}`}>
      <header className="app-header" data-ocid="app.header">
        <div className="header-inner">
          <button
            type="button"
            className="header-logo"
            onClick={() => {
              setShowSettings(false);
              navigate("dashboard");
            }}
            aria-label="Go to Dashboard"
          >
            Kaas<span className="header-logo-accent">Flow</span>
          </button>

          <div className="header-center">
            <span className="header-page-title">{title}</span>
            <div className="lang-toggle" data-ocid="app.language_toggle">
              <button
                type="button"
                data-ocid="app.lang_en"
                className={`lang-btn ${language === "en" ? "active" : ""}`}
                onClick={() => updateSettings({ language: "en" })}
              >
                EN
              </button>
              <button
                type="button"
                data-ocid="app.lang_ta"
                className={`lang-btn ${language === "ta" ? "active" : ""}`}
                onClick={() => updateSettings({ language: "ta" })}
              >
                தமிழ்
              </button>
            </div>
          </div>

          <div className="header-actions">
            <ThemeToggle />
            <button
              type="button"
              data-ocid="app.notifications_button"
              className="btn-icon header-icon-btn"
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              data-ocid="app.settings_button"
              className={`user-avatar ${activePage === "settings" ? "active" : ""}`}
              onClick={() => setShowSettings((v) => !v)}
              aria-label={t("settings")}
            >
              {initials}
            </button>
          </div>
        </div>
      </header>

      <Layout
        currentPage={activePage}
        onNavigate={handleNavigate}
        t={t}
        language={language}
        role={role}
      >
        <main className="page-main">
          <PageComponent app={app} />
        </main>
      </Layout>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={upgradePro}
        language={language}
      />
    </div>
  );
}
