import type { AuthData, Client, Loan, Payment, Settings } from "../types";

const KEYS = {
  clients: "kf_clients",
  loans: "kf_loans",
  payments: "kf_payments",
  settings: "kf_settings",
  auth: "kf_auth",
  session: "kf_session",
  receiptCounter: "kf_receipt_counter",
} as const;

function parseJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Clients ----------
export function getClients(): Client[] {
  return parseJSON<Client[]>(KEYS.clients, []);
}
export function saveClients(clients: Client[]): void {
  setJSON(KEYS.clients, clients);
}

// ---------- Loans ----------
export function getLoans(): Loan[] {
  return parseJSON<Loan[]>(KEYS.loans, []);
}
export function saveLoans(loans: Loan[]): void {
  setJSON(KEYS.loans, loans);
}

// ---------- Payments ----------
export function getPayments(): Payment[] {
  return parseJSON<Payment[]>(KEYS.payments, []);
}
export function savePayments(payments: Payment[]): void {
  setJSON(KEYS.payments, payments);
}

// ---------- Settings ----------
const DEFAULT_SETTINGS: Settings = {
  financierName: "My Financier",
  businessName: "KaasFlow Finance",
  phone: "",
  language: "en",
  theme: "dark",
  plan: "free",
  planType: null,
  planExpiry: null,
  trialEnd: null,
  role: "admin",
};
export function getSettings(): Settings {
  return parseJSON<Settings>(KEYS.settings, DEFAULT_SETTINGS);
}
export function saveSettings(settings: Settings): void {
  setJSON(KEYS.settings, settings);
}

// ---------- Plan helpers ----------
export interface PlanSettings {
  plan: "free" | "pro";
  planType: "monthly" | "quarterly" | "yearly" | null | undefined;
  planExpiry: number | null | undefined;
  trialEnd: number | null | undefined;
}

export function getPlanSettings(): PlanSettings {
  const s = getSettings();
  return {
    plan: s.plan ?? "free",
    planType: s.planType,
    planExpiry: s.planExpiry,
    trialEnd: s.trialEnd,
  };
}

export function savePlanSettings(updates: Partial<PlanSettings>): void {
  const s = getSettings();
  saveSettings({ ...s, ...updates });
}

export interface TrialStatus {
  isTrialActive: boolean;
  daysRemaining: number;
  isExpired: boolean;
}

export function getTrialStatus(): TrialStatus {
  const { trialEnd, plan } = getPlanSettings();
  if (!trialEnd) {
    return { isTrialActive: false, daysRemaining: 0, isExpired: true };
  }
  const now = Date.now();
  const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / 86400000));
  const isTrialActive = trialEnd > now && plan === "free";
  return {
    isTrialActive,
    daysRemaining,
    isExpired: !isTrialActive && plan === "free",
  };
}

// ---------- Auth ----------
export function getAuth(): AuthData | null {
  return parseJSON<AuthData | null>(KEYS.auth, null);
}
export function saveAuth(auth: AuthData): void {
  setJSON(KEYS.auth, auth);
}

// ---------- Session ----------
export function getSession(): { loggedIn: boolean; loginTime: string } | null {
  return parseJSON<{ loggedIn: boolean; loginTime: string } | null>(
    KEYS.session,
    null,
  );
}
export function saveSession(session: {
  loggedIn: boolean;
  loginTime: string;
}): void {
  setJSON(KEYS.session, session);
}
export function clearSession(): void {
  localStorage.removeItem(KEYS.session);
}

// ---------- Receipt Counter ----------
export function getReceiptNumber(): number {
  return parseJSON<number>(KEYS.receiptCounter, 1);
}
export function incrementReceiptNumber(): number {
  const next = getReceiptNumber() + 1;
  setJSON(KEYS.receiptCounter, next);
  return next - 1;
}
export function setReceiptCounter(n: number): void {
  setJSON(KEYS.receiptCounter, n);
}

// ---------- Clear All ----------
export function clearAllData(): void {
  for (const key of Object.values(KEYS)) {
    localStorage.removeItem(key);
  }
}
