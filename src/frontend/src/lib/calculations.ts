import type { Payment } from "../types";

export function calculateEMI(
  amount: number,
  interest: number,
  duration: number,
  type: "flat" | "reducing",
): number {
  if (type === "flat") {
    return (amount + amount * (interest / 100) * duration) / duration;
  }
  // Reducing balance
  const r = interest / 100;
  if (r === 0) return amount / duration;
  const pow = (1 + r) ** duration;
  return (amount * r * pow) / (pow - 1);
}

export function calculateTotalPayable(
  _amount: number,
  emi: number,
  duration: number,
): number {
  return emi * duration;
}

export function calculateTotalInterest(
  amount: number,
  totalPayable: number,
): number {
  return totalPayable - amount;
}

export function getNextDueDate(startDate: string, paymentsCount: number): Date {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + paymentsCount + 1);
  return date;
}

export function getTotalPaid(loanId: string, payments: Payment[]): number {
  return payments
    .filter((p) => p.loanId === loanId && p.status !== "missed")
    .reduce((sum, p) => sum + p.amount, 0);
}

export function getPaymentsCount(loanId: string, payments: Payment[]): number {
  return payments.filter(
    (p) =>
      p.loanId === loanId && (p.status === "paid" || p.status === "partial"),
  ).length;
}

export function isOverdue(nextDueDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return nextDueDate < today;
}

export function getDaysOverdue(nextDueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - nextDueDate.getTime();
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
