import type { Client, Loan, Payment } from "../types";

// ---------- Permission ----------
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function getNextDueDateFromData(
  startDate: string,
  paymentsCount: number,
): Date {
  const start = new Date(startDate);
  const due = new Date(start);
  due.setMonth(due.getMonth() + paymentsCount + 1);
  return due;
}

function getPaymentCountForLoan(loanId: string, payments: Payment[]): number {
  return payments.filter((p) => p.loanId === loanId && p.status !== "missed")
    .length;
}

// ---------- Daily midnight notification ----------
let dailyNotifTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleDailyCollectionNotification(
  loans: Loan[],
  clients: Client[],
  payments: Payment[],
): void {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  if (dailyNotifTimeout) clearTimeout(dailyNotifTimeout);

  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
  );
  const msUntilMidnight = midnight.getTime() - now.getTime();

  dailyNotifTimeout = setTimeout(() => {
    // Fire notification at midnight
    const activeLoans = loans.filter((l) => l.status === "active");
    const dueLoans = activeLoans.filter((loan) => {
      const count = getPaymentCountForLoan(loan.id, payments);
      const due = getNextDueDateFromData(loan.startDate, count);
      return isToday(due.toISOString());
    });

    if (dueLoans.length > 0) {
      const lines = dueLoans.map((loan) => {
        const client = clients.find((c) => c.id === loan.clientId);
        return `${client?.name ?? "Unknown"}: ₹${loan.emi.toLocaleString("en-IN")}`;
      });

      try {
        new Notification("KaasFlow — Today's Collections", {
          body:
            dueLoans.length === 1
              ? `EMI due: ${lines[0]}`
              : `${dueLoans.length} EMIs due today:\n${lines.slice(0, 5).join("\n")}`,
          icon: "/favicon.ico",
          tag: "kaasflow-daily",
        });
      } catch {
        // Notification failed silently
      }
    }

    // Re-schedule for next midnight
    scheduleDailyCollectionNotification(loans, clients, payments);
  }, msUntilMidnight);
}

// ---------- Individual reminders at 9 AM ----------
const individualTimers: ReturnType<typeof setTimeout>[] = [];

export function scheduleIndividualCollectionReminders(
  loans: Loan[],
  clients: Client[],
  payments: Payment[],
): void {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  // Clear previous timers
  for (const t of individualTimers) clearTimeout(t);
  individualTimers.length = 0;

  const now = new Date();
  const today9am = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    9,
    0,
    0,
  );

  const activeLoans = loans.filter((l) => l.status === "active");

  for (const loan of activeLoans) {
    const count = getPaymentCountForLoan(loan.id, payments);
    const due = getNextDueDateFromData(loan.startDate, count);

    // Only schedule for today
    if (!isToday(due.toISOString())) continue;

    const client = clients.find((c) => c.id === loan.clientId);
    const clientName = client?.name ?? "Unknown";

    // Calculate ms until 9 AM today (or immediately if past 9 AM)
    const msUntil9am = Math.max(0, today9am.getTime() - now.getTime());

    const timer = setTimeout(() => {
      try {
        new Notification(`EMI Due — ${clientName}`, {
          body: `₹${loan.emi.toLocaleString("en-IN")} due today`,
          icon: "/favicon.ico",
          tag: `kaasflow-emi-${loan.id}`,
        });
      } catch {
        // Notification failed silently
      }
    }, msUntil9am);

    individualTimers.push(timer);
  }
}

// ---------- Init ----------
export async function initNotifications(
  loans: Loan[],
  clients: Client[],
  payments: Payment[],
): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  scheduleDailyCollectionNotification(loans, clients, payments);
  scheduleIndividualCollectionReminders(loans, clients, payments);
}
