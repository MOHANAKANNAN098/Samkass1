import { useActor } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect, useState } from "react";
import { UserRole, createActor } from "../backend";
import { hashPin } from "../lib/hashPin";
import { generateSampleData } from "../lib/sampleData";
import {
  clearSession,
  getAuth,
  getClients,
  getLoans,
  getPayments,
  getSession,
  getSettings,
  saveAuth,
  saveClients,
  saveLoans,
  savePayments,
  saveSession,
  saveSettings,
} from "../lib/storage";
import { type TranslationKey, t as translate } from "../lib/translations";
import type { Client, Loan, Page, Payment, PlanType, Settings } from "../types";

export interface AppState {
  clients: Client[];
  loans: Loan[];
  payments: Payment[];
  settings: Settings;
  currentPage: Page;
  selectedClientId: string | null;
  selectedLoanId: string | null;
  isLoggedIn: boolean;
  hasAuth: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  language: "en" | "ta";
  role: "admin" | "staff";
  // Plan / trial
  isPro: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (v: boolean) => void;
  upgradePro: (planType: PlanType) => void;
  // Actions
  navigate: (page: Page, id?: string) => void;
  login: (phone: string, pin: string) => Promise<boolean>;
  logout: () => void;
  register: (
    phone: string,
    pin: string,
    financierName: string,
    businessName: string,
  ) => Promise<void>;
  resetPin: (phone: string, newPin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  checkPhoneExists: (phone: string) => Promise<boolean>;
  refreshData: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  saveClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  saveLoan: (loan: Loan) => void;
  deleteLoan: (id: string) => void;
  savePayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;
  t: (key: TranslationKey) => string;
}

const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

function ensureTrialEnd(s: Settings): Settings {
  if (!s.trialEnd) {
    return { ...s, trialEnd: Date.now() + TWO_MONTHS_MS };
  }
  return s;
}

const STAFF_ALLOWED_PAGES: Page[] = ["collection", "reports", "settings"];

export function useApp(): AppState {
  const { actor } = useActor(createActor);
  const [clients, setClients] = useState<Client[]>(() => getClients());
  const [loans, setLoans] = useState<Loan[]>(() => getLoans());
  const [payments, setPayments] = useState<Payment[]>(() => getPayments());
  const [settings, setSettings] = useState<Settings>(() => {
    const s = getSettings();
    const updated = ensureTrialEnd({ plan: "free", ...s });
    if (!s.trialEnd) saveSettings(updated);
    return updated;
  });
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const session = getSession();
    return session?.loggedIn ?? false;
  });
  const [hasAuth, setHasAuth] = useState<boolean>(() => getAuth() !== null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ── Derived role ──
  const storedAuth = getAuth();
  const role: "admin" | "staff" = settings.role ?? storedAuth?.role ?? "admin";

  // ── Computed plan state ──
  const now = Date.now();
  const plan = settings.plan ?? "free";
  const planExpiry = settings.planExpiry ?? null;
  const trialEnd = settings.trialEnd ?? null;
  const isPro = plan === "pro" && planExpiry !== null && planExpiry > now;
  const isTrialActive = plan === "free" && trialEnd !== null && trialEnd > now;
  const trialDaysRemaining = trialEnd
    ? Math.max(0, Math.ceil((trialEnd - now) / 86400000))
    : 0;

  const refreshData = useCallback(() => {
    setClients(getClients());
    setLoans(getLoans());
    setPayments(getPayments());
    setSettings(getSettings());
  }, []);

  const navigate = useCallback(
    (page: Page, id?: string) => {
      // Role-gated: staff can only access allowed pages
      const resolved =
        role === "staff" && !STAFF_ALLOWED_PAGES.includes(page)
          ? "collection"
          : page;
      setCurrentPage(resolved);
      if (resolved === "client-profile") setSelectedClientId(id ?? null);
      if (resolved === "loan-detail") setSelectedLoanId(id ?? null);
    },
    [role],
  );

  const upgradePro = useCallback((planType: PlanType) => {
    const expiryMap: Record<PlanType, number> = {
      monthly: 30 * 24 * 60 * 60 * 1000,
      quarterly: 90 * 24 * 60 * 60 * 1000,
      yearly: 365 * 24 * 60 * 60 * 1000,
    };
    const expiry = Date.now() + expiryMap[planType];
    const current = getSettings();
    const updated: Settings = {
      ...current,
      plan: "pro",
      planType,
      planExpiry: expiry,
    };
    saveSettings(updated);
    setSettings(updated);
    setShowUpgradeModal(false);
  }, []);

  const login = useCallback(
    async (phone: string, pin: string): Promise<boolean> => {
      setIsAuthLoading(true);
      setAuthError(null);
      try {
        const hashed = await hashPin(pin);
        // Try backend first
        if (actor) {
          try {
            const result = await actor.login(phone, hashed);
            if (result.__kind__ === "ok") {
              const profile = result.ok;
              const userRole: "admin" | "staff" =
                profile.role === UserRole.staff ? "staff" : "admin";
              const currentSettings = getSettings();
              const withTrial = ensureTrialEnd({
                plan: "free",
                ...currentSettings,
                financierName: profile.financierName,
                businessName: profile.businessName,
                phone: profile.phone,
                role: userRole,
              });
              saveSettings(withTrial);
              saveAuth({ phone, pin: hashed, role: userRole });
              const session = {
                loggedIn: true,
                loginTime: new Date().toISOString(),
              };
              saveSession(session);
              generateSampleData();
              setIsLoggedIn(true);
              setSettings(withTrial);
              refreshData();
              return true;
            }
            setAuthError(result.err || "Incorrect PIN. Please try again.");
            return false;
          } catch {
            // Fall through to localStorage
          }
        }
        // Offline fallback: localStorage
        const auth = getAuth();
        if (!auth || auth.phone !== phone) {
          setAuthError("Phone number not found.");
          return false;
        }
        const pinMatches = auth.pin === pin || auth.pin === hashed;
        if (!pinMatches) {
          setAuthError("Incorrect PIN. Please try again.");
          return false;
        }
        const session = { loggedIn: true, loginTime: new Date().toISOString() };
        saveSession(session);
        generateSampleData();
        setIsLoggedIn(true);
        refreshData();
        return true;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [actor, refreshData],
  );

  const logout = useCallback(() => {
    clearSession();
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
    setAuthError(null);
  }, []);

  const register = useCallback(
    async (
      phone: string,
      pin: string,
      financierName: string,
      businessName: string,
    ) => {
      setIsAuthLoading(true);
      setAuthError(null);
      try {
        const hashed = await hashPin(pin);
        // Try backend registration first
        if (actor) {
          try {
            const result = await actor.register(
              phone,
              hashed,
              financierName,
              businessName,
              UserRole.admin,
            );
            if (result.__kind__ === "err") {
              setAuthError(result.err || "Registration failed.");
              return;
            }
          } catch {
            // Fall through to localStorage only
          }
        }
        // Always save locally for offline support
        saveAuth({ phone, pin: hashed, role: "admin" });
        const newSettings: Settings = ensureTrialEnd({
          financierName,
          businessName,
          phone,
          language: "en",
          theme: "dark",
          plan: "free",
          planType: null,
          planExpiry: null,
          role: "admin",
        });
        saveSettings(newSettings);
        const session = { loggedIn: true, loginTime: new Date().toISOString() };
        saveSession(session);
        generateSampleData();
        setHasAuth(true);
        setIsLoggedIn(true);
        setSettings(newSettings);
        refreshData();
      } finally {
        setIsAuthLoading(false);
      }
    },
    [actor, refreshData],
  );

  const resetPin = useCallback(
    async (phone: string, newPin: string): Promise<boolean> => {
      setIsAuthLoading(true);
      setAuthError(null);
      try {
        const hashed = await hashPin(newPin);
        // Try backend first
        if (actor) {
          try {
            const result = await actor.resetPin(phone, hashed);
            if (result.__kind__ === "err") {
              setAuthError(result.err || "Phone number not found.");
              return false;
            }
          } catch {
            // Fall through to localStorage
          }
        }
        // Always update locally for offline support
        const auth = getAuth();
        if (!auth || auth.phone !== phone) {
          setAuthError("Phone number not found.");
          return false;
        }
        saveAuth({ ...auth, pin: hashed });
        return true;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [actor],
  );

  const changePin = useCallback(
    async (currentPin: string, newPin: string): Promise<boolean> => {
      setIsAuthLoading(true);
      setAuthError(null);
      try {
        const auth = getAuth();
        if (!auth) {
          setAuthError("Not authenticated.");
          return false;
        }
        const currentHashed = await hashPin(currentPin);
        const newHashed = await hashPin(newPin);
        // Verify current PIN matches
        if (auth.pin !== currentHashed) {
          setAuthError("Current PIN is incorrect.");
          return false;
        }
        // Try backend
        if (actor) {
          try {
            const result = await actor.changePin(
              auth.phone,
              currentHashed,
              newHashed,
            );
            if (result.__kind__ === "err") {
              setAuthError(result.err || "Failed to change PIN.");
              return false;
            }
          } catch {
            // Fall through to local-only update
          }
        }
        // Always update locally
        saveAuth({ ...auth, pin: newHashed });
        return true;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [actor],
  );

  const checkPhoneExists = useCallback(
    async (phone: string): Promise<boolean> => {
      // Try backend first
      if (actor) {
        try {
          return await actor.phoneExists(phone);
        } catch {
          // Fall through to localStorage
        }
      }
      const auth = getAuth();
      return auth !== null && auth.phone === phone;
    },
    [actor],
  );

  const updateSettings = useCallback((s: Partial<Settings>) => {
    const updated = { ...getSettings(), ...s };
    saveSettings(updated);
    setSettings(updated);
  }, []);

  const saveClient = useCallback((client: Client) => {
    const all = getClients();
    const idx = all.findIndex((c) => c.id === client.id);
    const next =
      idx >= 0
        ? all.map((c) => (c.id === client.id ? client : c))
        : [...all, client];
    saveClients(next);
    setClients(next);
  }, []);

  const deleteClient = useCallback((id: string) => {
    const next = getClients().filter((c) => c.id !== id);
    saveClients(next);
    setClients(next);
  }, []);

  const saveLoan = useCallback((loan: Loan) => {
    const all = getLoans();
    const idx = all.findIndex((l) => l.id === loan.id);
    const next =
      idx >= 0 ? all.map((l) => (l.id === loan.id ? loan : l)) : [...all, loan];
    saveLoans(next);
    setLoans(next);
  }, []);

  const deleteLoan = useCallback((id: string) => {
    const next = getLoans().filter((l) => l.id !== id);
    saveLoans(next);
    setLoans(next);
  }, []);

  const savePayment = useCallback((payment: Payment) => {
    const all = getPayments();
    const idx = all.findIndex((p) => p.id === payment.id);
    const next =
      idx >= 0
        ? all.map((p) => (p.id === payment.id ? payment : p))
        : [...all, payment];
    savePayments(next);
    setPayments(next);
  }, []);

  const deletePayment = useCallback((id: string) => {
    const next = getPayments().filter((p) => p.id !== id);
    savePayments(next);
    setPayments(next);
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handler = () => refreshData();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refreshData]);

  const lang = settings.language;
  const tFn = useCallback(
    (key: TranslationKey) => translate(key, lang),
    [lang],
  );

  return {
    clients,
    loans,
    payments,
    settings,
    currentPage,
    selectedClientId,
    selectedLoanId,
    isLoggedIn,
    hasAuth,
    isAuthLoading,
    authError,
    language: lang,
    role,
    isPro,
    isTrialActive,
    trialDaysRemaining,
    showUpgradeModal,
    setShowUpgradeModal,
    upgradePro,
    navigate,
    login,
    logout,
    register,
    resetPin,
    changePin,
    checkPhoneExists,
    refreshData,
    updateSettings,
    saveClient,
    deleteClient,
    saveLoan,
    deleteLoan,
    savePayment,
    deletePayment,
    t: tFn,
  };
}
