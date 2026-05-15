import type React from "react";
import { useEffect } from "react";
import type { TranslationKey } from "../lib/translations";
import type { Page } from "../types";
import BottomNav from "./BottomNav";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  t: (key: TranslationKey) => string;
  language: "en" | "ta";
  role?: "admin" | "staff";
}

const ADMIN_ONLY_PAGES: Page[] = [
  "dashboard",
  "clients",
  "loans",
  "client-profile",
  "loan-detail",
];

export default function Layout({
  children,
  currentPage,
  onNavigate,
  t,
  language,
  role = "admin",
}: LayoutProps) {
  // Redirect staff away from admin-only pages
  useEffect(() => {
    if (role === "staff" && ADMIN_ONLY_PAGES.includes(currentPage)) {
      onNavigate("collection");
    }
  }, [role, currentPage, onNavigate]);

  return (
    <div className="layout-root">
      <div className="layout-content">{children}</div>
      <BottomNav
        currentPage={currentPage}
        onNavigate={onNavigate}
        t={t}
        language={language}
        role={role}
      />
    </div>
  );
}
