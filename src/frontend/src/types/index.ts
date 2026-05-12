export interface Client {
  id: string; // "c_" + timestamp
  name: string;
  phone: string;
  address?: string;
  idno?: string;
  occ?: string;
  photo?: string; // base64
  createdAt: string; // ISO date
}

export interface Loan {
  id: string; // "l_" + timestamp
  clientId: string;
  amount: number;
  interest: number; // % per month
  duration: number; // months
  type: "flat" | "reducing";
  startDate: string; // ISO date
  emi: number; // auto-calculated
  status: "active" | "completed" | "defaulted";
}

export interface Payment {
  id: string; // "p_" + timestamp
  loanId: string;
  amount: number;
  date: string; // ISO date
  mode: "cash" | "upi" | "bank" | "cheque";
  status: "paid" | "partial" | "missed";
  note?: string;
}

export interface Settings {
  financierName: string;
  businessName: string;
  phone: string;
  language: "en" | "ta";
  theme?: "light" | "dark";
  plan?: "free" | "pro";
  planType?: "monthly" | "quarterly" | "yearly" | null;
  planExpiry?: number | null; // Unix timestamp ms
  trialEnd?: number | null; // Unix timestamp ms
  role?: "admin" | "staff";
}

export interface AuthData {
  phone: string;
  pin: string; // hashed SHA-256 hex
  role?: "admin" | "staff";
}

export type Page =
  | "dashboard"
  | "clients"
  | "loans"
  | "collection"
  | "reports"
  | "settings"
  | "client-profile"
  | "loan-detail";

export type PlanType = "monthly" | "quarterly" | "yearly";
