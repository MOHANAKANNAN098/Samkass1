import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PageProps } from "../App";
import {
  formatCurrency,
  formatDate,
  getDaysOverdue,
  getNextDueDate,
  getPaymentsCount,
  isOverdue,
} from "../lib/calculations";
import type { TranslationKey } from "../lib/translations";
import type { Loan, Payment } from "../types";

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "amber" | "success" | "danger" | "neutral";
}

function KpiCard({ label, value, icon, accent }: KpiCardProps) {
  const accentMap = {
    amber: "#f59e0b",
    success: "#10b981",
    danger: "#ef4444",
    neutral: "var(--kf-text)",
  };

  return (
    <div
      className="stat-card hover-lift"
      style={{
        borderTop: `3px solid ${accentMap[accent]}`,
        boxShadow:
          accent === "amber"
            ? "0 0 18px rgba(245,158,11,0.1)"
            : accent === "success"
              ? "0 0 14px rgba(16,185,129,0.07)"
              : accent === "danger"
                ? "0 0 14px rgba(239,68,68,0.07)"
                : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span className="stat-label">{label}</span>
        <span style={{ color: accentMap[accent], opacity: 0.75 }}>{icon}</span>
      </div>
      <div
        className="stat-value"
        style={{ color: accentMap[accent], fontSize: "1.2rem" }}
      >
        {value}
      </div>
    </div>
  );
}

function DueTodayItem({
  index,
  clientName,
  amount,
  daysOverdue,
  isDue,
  onClick,
}: {
  index: number;
  clientName: string;
  amount: number;
  daysOverdue: number;
  isDue: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="list-row"
      data-ocid={`dashboard.due_item.${index}`}
      onClick={onClick}
      style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
    >
      <div
        className="avatar"
        style={{ width: 36, height: 36, fontSize: "0.8rem", flexShrink: 0 }}
      >
        {clientName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.875rem",
            color: "var(--kf-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {clientName}
        </div>
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--kf-text-muted)",
            marginTop: 1,
          }}
        >
          {isDue && daysOverdue === 0
            ? "Due today"
            : `${daysOverdue} days overdue`}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.875rem",
            color: "var(--kf-amber)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {formatCurrency(amount)}
        </span>
        {daysOverdue > 0 && (
          <span
            className="badge badge-overdue"
            style={{ fontSize: "10px", padding: "2px 6px" }}
          >
            {daysOverdue}d
          </span>
        )}
        {daysOverdue === 0 && isDue && (
          <span
            className="badge badge-active"
            style={{ fontSize: "10px", padding: "2px 6px" }}
          >
            Today
          </span>
        )}
      </div>
    </button>
  );
}

function RecentPaymentItem({
  index,
  clientName,
  amount,
  date,
  mode,
  status,
}: {
  index: number;
  clientName: string;
  amount: number;
  date: string;
  mode: Payment["mode"];
  status: Payment["status"];
}) {
  const modeIconMap: Record<Payment["mode"], string> = {
    cash: "💵",
    upi: "📱",
    bank: "🏦",
    cheque: "📄",
  };

  return (
    <div
      className="list-row"
      data-ocid={`dashboard.payment_item.${index}`}
      style={{ cursor: "default" }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(16,185,129,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
          flexShrink: 0,
        }}
      >
        {modeIconMap[mode]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "var(--kf-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {clientName}
        </div>
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--kf-text-muted)",
            marginTop: 1,
          }}
        >
          {formatDate(date)} · {mode.toUpperCase()}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 3,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.9rem",
            color: "var(--kf-success)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {formatCurrency(amount)}
        </span>
        <span
          className={`badge ${
            status === "paid"
              ? "badge-paid"
              : status === "partial"
                ? "badge-partial"
                : "badge-missed"
          }`}
          style={{ fontSize: "10px", padding: "2px 6px" }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function MonthlyChart({
  payments,
  t,
}: {
  payments: Payment[];
  t: (k: TranslationKey) => string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<{ destroy: () => void } | null>(null);
  const [chartReady, setChartReady] = useState(false);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const result: { label: string; value: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("en-IN", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const value = payments
        .filter((p) => {
          const pd = new Date(p.date);
          return (
            pd.getFullYear() === year &&
            pd.getMonth() === month &&
            p.status !== "missed"
          );
        })
        .reduce((sum, p) => sum + p.amount, 0);
      result.push({ label, value });
    }
    return result;
  }, [payments]);

  useEffect(() => {
    let mounted = true;
    // Destroy any existing chart before (re-)creating
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    void import("chart.js").then((mod) => {
      if (!mounted) return;
      const { Chart, CategoryScale, LinearScale, BarElement, Tooltip } = mod;
      Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Destroy again in case a prior async run left a stale instance
      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy();
        chartRef.current = null;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, "rgba(245,158,11,0.9)");
      gradient.addColorStop(1, "rgba(245,158,11,0.25)");

      chartRef.current = new Chart(canvas, {
        type: "bar",
        data: {
          labels: monthlyData.map((d) => d.label),
          datasets: [
            {
              label: t("monthlyChart"),
              data: monthlyData.map((d) => d.value),
              backgroundColor: gradient,
              borderColor: "rgba(245,158,11,0.8)",
              borderWidth: 1,
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => ` ${formatCurrency(c.parsed.y as number)}`,
              },
              backgroundColor: "rgba(17,24,39,0.95)",
              titleColor: "#f59e0b",
              bodyColor: "#f1f5f9",
              borderColor: "rgba(245,158,11,0.3)",
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: "rgba(148,163,184,0.8)",
                font: { size: 10, family: "'DM Sans', sans-serif" },
              },
              border: { display: false },
            },
            y: {
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: {
                color: "rgba(148,163,184,0.7)",
                font: { size: 10, family: "'DM Sans', sans-serif" },
                callback: (v) => {
                  const n = Number(v);
                  if (n >= 100000) return `${(n / 100000).toFixed(0)}L`;
                  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
                  return String(n);
                },
              },
              border: { display: false },
            },
          },
          animation: { duration: 800, easing: "easeOutQuart" },
        },
      });

      setChartReady(true);
    });

    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [monthlyData, t]);

  return (
    <div
      className="card card-glow"
      data-ocid="dashboard.chart_panel"
      style={{ padding: "16px 14px 10px", marginBottom: 0 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h3
          className="section-title"
          style={{ margin: 0, fontSize: "0.95rem" }}
        >
          {t("monthlyChart")}
        </h3>
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--kf-text-muted)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Last 12 months
        </span>
      </div>
      {!chartReady && (
        <div
          className="skeleton"
          style={{ height: 180, borderRadius: 8 }}
          data-ocid="dashboard.chart.loading_state"
        />
      )}
      {/* Canvas is always rendered in the DOM so Chart.js can measure it.
          Visibility is toggled via opacity/pointer-events instead of display:none
          to avoid zero-dimension canvas bugs with createLinearGradient. */}
      <canvas
        ref={canvasRef}
        style={{
          height: 180,
          width: "100%",
          display: "block",
          opacity: chartReady ? 1 : 0,
          pointerEvents: chartReady ? "auto" : "none",
          position: chartReady ? "static" : "absolute",
          visibility: chartReady ? "visible" : "hidden",
        }}
        aria-label="Monthly collections bar chart"
      />
    </div>
  );
}

function TrialBanner({
  isPro,
  isTrialActive,
  trialDaysRemaining,
  settings,
  t,
  onUpgrade,
}: {
  isPro: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  settings: { planType?: string | null; planExpiry?: number | null };
  t: (k: TranslationKey) => string;
  onUpgrade: () => void;
}) {
  if (isPro) {
    const expiry = settings.planExpiry
      ? new Date(settings.planExpiry).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";
    const planLabel =
      settings.planType === "yearly"
        ? "Yearly"
        : settings.planType === "quarterly"
          ? "Quarterly"
          : "Monthly";
    const isRenewSoon =
      settings.planExpiry != null &&
      settings.planExpiry - Date.now() < 30 * 24 * 60 * 60 * 1000;

    return (
      <div
        data-ocid="dashboard.plan_banner"
        style={{
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#10b981",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Pro · {planLabel}
          </span>
          {expiry && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--kf-text-muted)",
                marginLeft: 8,
              }}
            >
              {t("proExpiry")} {expiry}
            </span>
          )}
        </div>
        {isRenewSoon && (
          <button
            type="button"
            data-ocid="dashboard.renew_button"
            onClick={onUpgrade}
            style={{
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t("renew")}
          </button>
        )}
      </div>
    );
  }

  if (isTrialActive) {
    return (
      <div
        data-ocid="dashboard.trial_banner"
        style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <Zap size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--kf-amber)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {t("trialBanner")}
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--kf-text-muted)",
              marginLeft: 8,
            }}
          >
            {trialDaysRemaining} {t("daysRemaining")}
          </span>
        </div>
        <button
          type="button"
          data-ocid="dashboard.upgrade_button"
          onClick={onUpgrade}
          style={{
            background: "var(--kf-amber)",
            color: "#0a0e1a",
            border: "none",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {t("upgradeBtn")}
        </button>
      </div>
    );
  }

  return (
    <div
      data-ocid="dashboard.trial_expired_banner"
      style={{
        background: "rgba(239,68,68,0.07)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 12,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
      }}
    >
      <AlertTriangle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
      <span
        style={{
          flex: 1,
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "#ef4444",
          minWidth: 0,
        }}
      >
        {t("trialExpiredBanner")}
      </span>
      <button
        type="button"
        data-ocid="dashboard.upgrade_button"
        onClick={onUpgrade}
        style={{
          background: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: "0.75rem",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {t("upgradeBtn")}
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ animation: "fadeIn 0.25s ease-out" }}>
      <div
        className="skeleton"
        style={{ height: 44, borderRadius: 12, marginBottom: 16 }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {["d", "c", "p", "a", "o", "t"].map((k) => (
          <div key={k} className="stat-card skeleton-card">
            <div className="skeleton skeleton-title" />
            <div className="skeleton" style={{ height: 28, width: "70%" }} />
          </div>
        ))}
      </div>
      <div
        className="skeleton"
        style={{ height: 16, width: 120, marginBottom: 12 }}
      />
      {["r1", "r2", "r3"].map((k) => (
        <div
          key={k}
          className="list-row"
          style={{ cursor: "default", marginBottom: 8 }}
        >
          <div
            className="skeleton"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div className="skeleton" style={{ height: 12, width: "60%" }} />
            <div className="skeleton" style={{ height: 10, width: "40%" }} />
          </div>
          <div className="skeleton" style={{ width: 60, height: 16 }} />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage({ app }: PageProps) {
  const {
    clients,
    loans,
    payments,
    role,
    navigate,
    t,
    isPro,
    isTrialActive,
    trialDaysRemaining,
    settings,
    setShowUpgradeModal,
  } = app;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "staff") {
      navigate("collection");
      return;
    }
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [role, navigate]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const kpis = useMemo(() => {
    const activeLoans = loans.filter((l) => l.status === "active");
    const totalDisbursed = loans.reduce((s, l) => s + l.amount, 0);
    const totalCollected = payments
      .filter((p) => p.status !== "missed")
      .reduce((s, p) => s + p.amount, 0);
    const totalPending = activeLoans.reduce((s, l) => {
      const paid = payments
        .filter((p) => p.loanId === l.id && p.status !== "missed")
        .reduce((ps, p) => ps + p.amount, 0);
      const total = l.emi * l.duration;
      return s + Math.max(0, total - paid);
    }, 0);
    const activeClients = new Set(activeLoans.map((l) => l.clientId)).size;
    let overdueCount = 0;
    let todayTarget = 0;
    for (const loan of activeLoans) {
      const pCount = getPaymentsCount(loan.id, payments);
      const nextDue = getNextDueDate(loan.startDate, pCount);
      if (isOverdue(nextDue)) overdueCount++;
      const dueMs = nextDue.getTime();
      if (dueMs >= today.getTime() && dueMs < tomorrow.getTime())
        todayTarget += loan.emi;
    }
    return {
      totalDisbursed,
      totalCollected,
      totalPending,
      activeClients,
      overdueCount,
      todayTarget,
    };
  }, [loans, payments, today, tomorrow]);

  const dueItems = useMemo(() => {
    const activeLoans = loans.filter((l) => l.status === "active");
    const items: {
      loan: Loan;
      clientName: string;
      daysOverdue: number;
      isDueToday: boolean;
    }[] = [];
    for (const loan of activeLoans) {
      const pCount = getPaymentsCount(loan.id, payments);
      const nextDue = getNextDueDate(loan.startDate, pCount);
      const overdue = isOverdue(nextDue);
      const dueMs = nextDue.getTime();
      const isDueToday = dueMs >= today.getTime() && dueMs < tomorrow.getTime();
      if (isDueToday || overdue) {
        const client = clients.find((c) => c.id === loan.clientId);
        items.push({
          loan,
          clientName: client?.name ?? "Unknown",
          daysOverdue: getDaysOverdue(nextDue),
          isDueToday,
        });
      }
    }
    return items.sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 5);
  }, [loans, payments, clients, today, tomorrow]);

  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((p) => {
        const loan = loans.find((l) => l.id === p.loanId);
        const client = loan
          ? clients.find((c) => c.id === loan.clientId)
          : null;
        return { payment: p, clientName: client?.name ?? "Unknown" };
      });
  }, [payments, loans, clients]);

  if (role === "staff") return null;
  if (loading) return <DashboardSkeleton />;

  return (
    <div
      data-ocid="dashboard.page"
      style={{ animation: "fadeIn 0.25s ease-out" }}
    >
      <TrialBanner
        isPro={isPro}
        isTrialActive={isTrialActive}
        trialDaysRemaining={trialDaysRemaining}
        settings={settings}
        t={t}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* KPI Cards */}
      <div
        data-ocid="dashboard.kpi_section"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <KpiCard
          label={t("totalDisbursed")}
          value={formatCurrency(kpis.totalDisbursed)}
          icon={<TrendingUp size={15} />}
          accent="amber"
        />
        <KpiCard
          label={t("totalCollected")}
          value={formatCurrency(kpis.totalCollected)}
          icon={<CheckCircle2 size={15} />}
          accent="success"
        />
        <KpiCard
          label={t("totalPending")}
          value={formatCurrency(kpis.totalPending)}
          icon={<TrendingDown size={15} />}
          accent="danger"
        />
        <KpiCard
          label={t("activeClients")}
          value={String(kpis.activeClients)}
          icon={<Users size={15} />}
          accent="neutral"
        />
        <KpiCard
          label={t("overdueCount")}
          value={String(kpis.overdueCount)}
          icon={<AlertTriangle size={15} />}
          accent={kpis.overdueCount > 0 ? "danger" : "neutral"}
        />
        <KpiCard
          label={t("todayTarget")}
          value={formatCurrency(kpis.todayTarget)}
          icon={<CreditCard size={15} />}
          accent={kpis.todayTarget > 0 ? "amber" : "neutral"}
        />
      </div>

      {/* Due Today */}
      <div data-ocid="dashboard.due_today_section" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <h3
            className="section-title"
            style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Clock size={15} style={{ color: "var(--kf-amber)" }} />
            {t("dueList")}
          </h3>
          {dueItems.length > 0 && (
            <button
              type="button"
              data-ocid="dashboard.view_all_due_button"
              onClick={() => navigate("collection")}
              style={{
                background: "none",
                border: "none",
                color: "var(--kf-amber)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "4px 0",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {t("viewAll")} <ArrowRight size={13} />
            </button>
          )}
        </div>
        {dueItems.length === 0 ? (
          <div
            data-ocid="dashboard.due_list.empty_state"
            style={{
              background: "var(--kf-card)",
              border: "1px solid var(--kf-card-border)",
              borderRadius: 12,
              padding: "24px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: 6, opacity: 0.4 }}>
              ✅
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--kf-text-muted)",
                fontWeight: 500,
              }}
            >
              {t("noDue")}
            </div>
          </div>
        ) : (
          dueItems.map((item, i) => (
            <DueTodayItem
              key={item.loan.id}
              index={i + 1}
              clientName={item.clientName}
              amount={item.loan.emi}
              daysOverdue={item.daysOverdue}
              isDue={item.isDueToday}
              onClick={() => navigate("loan-detail", item.loan.id)}
            />
          ))
        )}
      </div>

      {/* Recent Payments */}
      <div
        data-ocid="dashboard.recent_payments_section"
        style={{ marginBottom: 20 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <h3 className="section-title" style={{ margin: 0 }}>
            {t("recentPayments")}
          </h3>
          {recentPayments.length > 0 && (
            <button
              type="button"
              data-ocid="dashboard.view_all_payments_button"
              onClick={() => navigate("reports")}
              style={{
                background: "none",
                border: "none",
                color: "var(--kf-amber)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "4px 0",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {t("viewAll")} <ArrowRight size={13} />
            </button>
          )}
        </div>
        {recentPayments.length === 0 ? (
          <div
            data-ocid="dashboard.payments_list.empty_state"
            style={{
              background: "var(--kf-card)",
              border: "1px solid var(--kf-card-border)",
              borderRadius: 12,
              padding: "24px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: 6, opacity: 0.4 }}>
              💳
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--kf-text-muted)",
                fontWeight: 500,
              }}
            >
              {t("noPayments")}
            </div>
          </div>
        ) : (
          recentPayments.map(({ payment, clientName }, i) => (
            <RecentPaymentItem
              key={payment.id}
              index={i + 1}
              clientName={clientName}
              amount={payment.amount}
              date={payment.date}
              mode={payment.mode}
              status={payment.status}
            />
          ))
        )}
      </div>

      {/* Monthly Chart */}
      <MonthlyChart payments={payments} t={t} />
    </div>
  );
}
