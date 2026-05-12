import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import {
  AlertTriangle,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import * as XLSX from "xlsx";
import type { PageProps } from "../App";
import { useTheme } from "../hooks/useTheme";
import {
  calculateTotalPayable,
  formatCurrency,
  formatDate,
  getTotalPaid,
} from "../lib/calculations";
import type { Client, Loan, Payment } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type DateRange = "30d" | "3m" | "12m" | "all";

interface ClientSummaryRow {
  client: Client;
  loanCount: number;
  totalGiven: number;
  totalCollected: number;
  totalPending: number;
  recoveryPct: number;
}

interface DefaulterRow {
  client: Client;
  overdueAmount: number;
  missedCount: number;
}

function getStartDate(range: DateRange): Date | null {
  const now = new Date();
  if (range === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (range === "3m") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return d;
  }
  if (range === "12m") {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  return null;
}

export default function ReportsPage({ app }: PageProps) {
  const { clients, loans, payments, t, language } = app;
  const isTamil = language === "ta";
  const [dateRange, setDateRange] = useState<DateRange>("12m");
  const { isDark } = useTheme();

  // Filter payments by date range
  const filteredPayments = useMemo(() => {
    const start = getStartDate(dateRange);
    if (!start) return payments;
    return payments.filter((p) => new Date(p.date) >= start);
  }, [payments, dateRange]);

  // ── KPI computations ──
  const totalDisbursed = useMemo(
    () => loans.reduce((s, l) => s + l.amount, 0),
    [loans],
  );

  const totalCollected = useMemo(
    () =>
      filteredPayments
        .filter((p) => p.status !== "missed")
        .reduce((s, p) => s + p.amount, 0),
    [filteredPayments],
  );

  const totalInterest = useMemo(
    () =>
      loans.reduce((s, l) => {
        const tp = calculateTotalPayable(l.amount, l.emi, l.duration);
        return s + (tp - l.amount);
      }, 0),
    [loans],
  );

  const recoveryRate = useMemo(() => {
    const totalDue = filteredPayments.length;
    const totalPaidCount = filteredPayments.filter(
      (p) => p.status === "paid" || p.status === "partial",
    ).length;
    return totalDue > 0 ? Math.round((totalPaidCount / totalDue) * 100) : 0;
  }, [filteredPayments]);

  // ── Monthly chart data (last 12 months) ──
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (11 - i));
      const m = d.getMonth();
      const y = d.getFullYear();
      const total = payments
        .filter((p) => {
          const pd = new Date(p.date);
          return (
            pd.getMonth() === m &&
            pd.getFullYear() === y &&
            p.status !== "missed"
          );
        })
        .reduce((s, p) => s + p.amount, 0);
      return {
        label: d.toLocaleString("en-IN", { month: "short" }),
        total,
        month: m,
        year: y,
      };
    });
  }, [payments]);

  // ── Theme-aware chart colors ──
  const gridLineColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#64748b" : "#94a3b8";
  const tooltipBg = isDark ? "#1e1a10" : "#fff";
  const tooltipBorder = "rgba(245,158,11,0.35)";

  const chartData = useMemo(
    () => ({
      labels: monthlyData.map((m) => m.label),
      datasets: [
        {
          label: t("collection"),
          data: monthlyData.map((m) => m.total),
          backgroundColor: monthlyData.map((_m, i) =>
            i === monthlyData.length - 1
              ? "rgba(245,158,11,0.9)"
              : "rgba(245,158,11,0.45)",
          ),
          hoverBackgroundColor: "rgba(245,158,11,0.9)",
          borderColor: "rgba(245,158,11,0.6)",
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    }),
    [monthlyData, t],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: "#f59e0b",
          bodyColor: isDark ? "#e2d9c8" : "#1a1614",
          borderColor: tooltipBorder,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          callbacks: {
            label: (ctx: { parsed: { y: number } }) =>
              `  ${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: tickColor, font: { size: 10 } },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          ticks: {
            color: tickColor,
            font: { size: 10 },
            // Chart.js tick callback signature: (value, index, ticks)
            callback: (val: number | string) => {
              const n = Number(val);
              return n >= 100000
                ? `₹${(n / 100000).toFixed(1)}L`
                : n >= 1000
                  ? `₹${Math.round(n / 1000)}k`
                  : `₹${n}`;
            },
          },
          grid: { color: gridLineColor },
          border: { display: false },
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark, tooltipBg, tickColor, gridLineColor],
  );

  // ── Client summary ──
  const clientSummary: ClientSummaryRow[] = useMemo(() => {
    return clients.map((c) => {
      const clientLoans = loans.filter((l) => l.clientId === c.id);
      const totalGiven = clientLoans.reduce((s, l) => s + l.amount, 0);
      const totalPaidAmount = clientLoans.reduce(
        (s, l) => s + getTotalPaid(l.id, filteredPayments),
        0,
      );
      const totalPayable = clientLoans.reduce(
        (s, l) => s + calculateTotalPayable(l.amount, l.emi, l.duration),
        0,
      );
      const totalPending = Math.max(0, totalPayable - totalPaidAmount);
      const recoveryPct =
        totalPayable > 0
          ? Math.round((totalPaidAmount / totalPayable) * 100)
          : 0;
      return {
        client: c,
        loanCount: clientLoans.length,
        totalGiven,
        totalCollected: totalPaidAmount,
        totalPending,
        recoveryPct,
      };
    });
  }, [clients, loans, filteredPayments]);

  // ── Top defaulters ──
  const topDefaulters: DefaulterRow[] = useMemo(() => {
    return clients
      .map((c) => {
        const clientLoans = loans.filter((l) => l.clientId === c.id);
        const missedPayments = payments.filter(
          (p) =>
            clientLoans.some((l) => l.id === p.loanId) && p.status === "missed",
        );
        const missedCount = missedPayments.length;
        const overdueAmount = missedPayments.reduce((s, p) => s + p.amount, 0);
        // Estimate overdue from EMIs if no recorded missed amounts
        const emiOverdue =
          overdueAmount === 0
            ? clientLoans.reduce((s, l) => s + l.emi * missedCount, 0)
            : overdueAmount;
        return { client: c, overdueAmount: emiOverdue, missedCount };
      })
      .filter((d) => d.missedCount > 0)
      .sort((a, b) => b.overdueAmount - a.overdueAmount)
      .slice(0, 5);
  }, [clients, loans, payments]);

  // ── Export Excel (multi-sheet) ──
  function exportExcel() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Clients
    const clientRows = clients.map((c) => ({
      Name: c.name,
      Phone: c.phone,
      Address: c.address ?? "",
      "ID No": c.idno ?? "",
      Occupation: c.occ ?? "",
      "Joined On": formatDate(c.createdAt),
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(clientRows),
      "Clients",
    );

    // Sheet 2: Loans
    const loanRows = loans.map((l) => {
      const client = clients.find((c) => c.id === l.clientId);
      return {
        Client: client?.name ?? "",
        Phone: client?.phone ?? "",
        "Principal (₹)": l.amount,
        "Interest (%)": l.interest,
        "Duration (mo)": l.duration,
        "EMI (₹)": Math.round(l.emi),
        "Total Payable (₹)": Math.round(
          calculateTotalPayable(l.amount, l.emi, l.duration),
        ),
        Type: l.type,
        Status: l.status,
        "Start Date": formatDate(l.startDate),
      };
    });
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(loanRows),
      "Loans",
    );

    // Sheet 3: Payments
    const paymentRows = payments.map((p) => {
      const loan = loans.find((l) => l.id === p.loanId);
      const client = clients.find((c) => c.id === loan?.clientId);
      return {
        Client: client?.name ?? "",
        "Loan ID": p.loanId,
        "Amount (₹)": p.amount,
        Date: formatDate(p.date),
        Mode: p.mode,
        Status: p.status,
        Note: p.note ?? "",
      };
    });
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(paymentRows),
      "Payments",
    );

    XLSX.writeFile(wb, "KaasFlow_Report.xlsx");
  }

  // ── Export CSV ──
  function exportCSV() {
    const headers = [
      "Client",
      "Loan ID",
      "Amount",
      "Date",
      "Mode",
      "Status",
      "Note",
    ];
    const rows = payments.map((p) => {
      const loan = loans.find((l) => l.id === p.loanId);
      const client = clients.find((c) => c.id === loan?.clientId);
      return [
        `"${client?.name ?? ""}"`,
        `"${p.loanId}"`,
        String(p.amount),
        formatDate(p.date),
        p.mode,
        p.status,
        `"${p.note ?? ""}"`,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "KaasFlow_Payments.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const dateRangeOptions: {
    value: DateRange;
    label: string;
    labelTa: string;
  }[] = [
    { value: "30d", label: "Last 30 Days", labelTa: "கடந்த 30 நாட்கள்" },
    { value: "3m", label: "Last 3 Months", labelTa: "கடந்த 3 மாதங்கள்" },
    { value: "12m", label: "Last 12 Months", labelTa: "கடந்த 12 மாதங்கள்" },
    { value: "all", label: "All Time", labelTa: "அனைத்து நேரமும்" },
  ];

  // ── KPI cards config ──
  const kpiCards = [
    {
      icon: IndianRupee,
      label: t("totalInterest"),
      value: formatCurrency(totalInterest),
      color: "var(--kf-amber)",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.22)",
      iconBg: "rgba(245,158,11,0.15)",
    },
    {
      icon: TrendingUp,
      label: t("recoveryRate"),
      value: `${recoveryRate}%`,
      color:
        recoveryRate >= 80
          ? "var(--kf-success)"
          : recoveryRate >= 50
            ? "var(--kf-amber)"
            : "var(--kf-danger)",
      bg:
        recoveryRate >= 80
          ? "rgba(16,185,129,0.08)"
          : recoveryRate >= 50
            ? "rgba(245,158,11,0.08)"
            : "rgba(239,68,68,0.08)",
      border:
        recoveryRate >= 80
          ? "rgba(16,185,129,0.25)"
          : recoveryRate >= 50
            ? "rgba(245,158,11,0.25)"
            : "rgba(239,68,68,0.25)",
      iconBg:
        recoveryRate >= 80
          ? "rgba(16,185,129,0.15)"
          : recoveryRate >= 50
            ? "rgba(245,158,11,0.15)"
            : "rgba(239,68,68,0.15)",
    },
    {
      icon: BarChart3,
      label: t("totalDisbursed"),
      value: formatCurrency(totalDisbursed),
      color: "#818cf8",
      bg: "rgba(129,140,248,0.08)",
      border: "rgba(129,140,248,0.22)",
      iconBg: "rgba(129,140,248,0.15)",
    },
    {
      icon: Users,
      label: t("totalCollected"),
      value: formatCurrency(totalCollected),
      color: "var(--kf-success)",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.22)",
      iconBg: "rgba(16,185,129,0.15)",
    },
  ];

  return (
    <div style={{ paddingBottom: "8px" }} data-ocid="reports.page">
      {/* Header */}
      <div
        className="page-title-row"
        style={{ marginBottom: "14px", gap: "8px" }}
      >
        <h1
          className={`page-title ${isTamil ? "tamil-text" : ""}`}
          style={{ fontSize: "1.15rem" }}
        >
          {t("reports")}
        </h1>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportCSV}
            data-ocid="reports.export_csv_button"
            style={{
              width: "auto",
              padding: "8px 12px",
              minHeight: "40px",
              fontSize: "0.78rem",
              gap: "5px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FileText size={13} />
            <span>CSV</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={exportExcel}
            data-ocid="reports.export_excel_button"
            style={{
              width: "auto",
              padding: "8px 12px",
              minHeight: "40px",
              fontSize: "0.78rem",
              gap: "5px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FileSpreadsheet size={13} />
            <span className={isTamil ? "tamil-text" : ""}>
              {t("exportExcel")}
            </span>
          </button>
        </div>
      </div>

      {/* Date range filter */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "2px",
          marginBottom: "16px",
          scrollbarWidth: "none",
        }}
        data-ocid="reports.date_range_filter"
      >
        {dateRangeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            data-ocid={`reports.filter_${opt.value}`}
            onClick={() => setDateRange(opt.value)}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              background:
                dateRange === opt.value
                  ? "var(--kf-amber)"
                  : "var(--kf-input-bg)",
              borderColor:
                dateRange === opt.value
                  ? "var(--kf-amber)"
                  : "var(--kf-divider)",
              color:
                dateRange === opt.value ? "#0a0700" : "var(--kf-text-muted)",
            }}
          >
            <span className={isTamil ? "tamil-text" : ""}>
              {isTamil ? opt.labelTa : opt.label}
            </span>
          </button>
        ))}
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "20px",
        }}
        data-ocid="reports.kpi_section"
      >
        {kpiCards.map(
          ({ icon: Icon, label, value, color, bg, border, iconBg }) => (
            <div
              key={label}
              className="stat-card"
              style={{ background: bg, borderColor: border, padding: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: iconBg,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
                <span
                  className="stat-label"
                  style={{ marginBottom: 0, fontSize: "10px", lineHeight: 1.3 }}
                >
                  <span className={isTamil ? "tamil-text" : ""}>{label}</span>
                </span>
              </div>
              <div
                className="stat-value"
                style={{
                  color,
                  fontSize: value.length > 10 ? "0.9rem" : "1.05rem",
                  lineHeight: 1.2,
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                }}
              >
                {value}
              </div>
            </div>
          ),
        )}
      </div>

      {/* Monthly Chart */}
      <div
        className="card card-glow"
        style={{ marginBottom: "20px", padding: "14px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <BarChart3
              size={15}
              style={{ color: "var(--kf-amber)", flexShrink: 0 }}
            />
            <h2
              className={`section-title ${isTamil ? "tamil-text" : ""}`}
              style={{ marginBottom: 0, fontSize: "0.9rem" }}
            >
              {t("monthlyChart")}
            </h2>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: "var(--kf-text-muted)",
              background: "var(--kf-input-bg)",
              padding: "3px 8px",
              borderRadius: "6px",
              flexShrink: 0,
            }}
          >
            {isTamil ? "கடந்த 12 மாதங்கள்" : "Last 12 months"}
          </span>
        </div>
        {/* key forces Bar to remount on theme change so all colors update */}
        <Bar
          key={isDark ? "dark" : "light"}
          data={chartData}
          options={chartOptions as Parameters<typeof Bar>[0]["options"]}
        />
        {/* Chart footer totals */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid var(--kf-divider)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--kf-text-muted)",
                marginBottom: "2px",
              }}
            >
              {isTamil ? "12 மாத மொத்தம்" : "12-month total"}
            </div>
            <div
              style={{
                fontWeight: 700,
                color: "var(--kf-amber)",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "0.88rem",
              }}
            >
              {formatCurrency(monthlyData.reduce((s, m) => s + m.total, 0))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "10px",
                color: "var(--kf-text-muted)",
                marginBottom: "2px",
              }}
            >
              {isTamil ? "இந்த மாதம்" : "This month"}
            </div>
            <div
              style={{
                fontWeight: 700,
                color: "var(--kf-success)",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "0.88rem",
              }}
            >
              {formatCurrency(monthlyData[monthlyData.length - 1]?.total ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Defaulters */}
      {topDefaulters.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              marginBottom: "10px",
            }}
          >
            <AlertTriangle
              size={15}
              style={{ color: "var(--kf-danger)", flexShrink: 0 }}
            />
            <h2
              className={`section-title ${isTamil ? "tamil-text" : ""}`}
              style={{ marginBottom: 0, fontSize: "0.9rem" }}
            >
              {t("topDefaulters")}
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topDefaulters.map((d, i) => (
              <DefaulterCard
                key={d.client.id}
                d={d}
                rank={i + 1}
                isTamil={isTamil}
                ocid={`reports.defaulter.${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Client Summary Table */}
      <div data-ocid="reports.client_summary_section">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            marginBottom: "10px",
          }}
        >
          <Download
            size={15}
            style={{ color: "var(--kf-amber)", flexShrink: 0 }}
          />
          <h2
            className={`section-title ${isTamil ? "tamil-text" : ""}`}
            style={{ marginBottom: 0, fontSize: "0.9rem" }}
          >
            {t("clientSummary")}
          </h2>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.78rem",
                minWidth: "420px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--kf-input-bg)",
                    borderBottom: "1px solid var(--kf-divider)",
                  }}
                >
                  {[
                    {
                      key: "name",
                      label: isTamil ? "பெயர்" : "Client",
                      align: "left" as const,
                    },
                    {
                      key: "loans",
                      label: isTamil ? "கடன்" : "Loans",
                      align: "center" as const,
                    },
                    {
                      key: "given",
                      label: isTamil ? "கொடுத்தது" : "Given ₹",
                      align: "right" as const,
                    },
                    {
                      key: "collected",
                      label: isTamil ? "வசூல்" : "Collected ₹",
                      align: "right" as const,
                    },
                    {
                      key: "pending",
                      label: isTamil ? "நிலுவை" : "Pending ₹",
                      align: "right" as const,
                    },
                    {
                      key: "recovery",
                      label: isTamil ? "மீட்பு" : "Recovery",
                      align: "right" as const,
                    },
                  ].map((h) => (
                    <th
                      key={h.key}
                      style={{
                        padding: "9px 10px",
                        textAlign: h.align,
                        color: "var(--kf-text-muted)",
                        fontWeight: 700,
                        fontSize: "9px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontFamily: "DM Sans, sans-serif",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientSummary.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "28px",
                        textAlign: "center",
                        color: "var(--kf-text-muted)",
                        fontSize: "0.85rem",
                      }}
                      data-ocid="reports.summary_empty_state"
                    >
                      <span className={isTamil ? "tamil-text" : ""}>
                        {t("noClients")}
                      </span>
                    </td>
                  </tr>
                )}
                {clientSummary.map((r, i) => (
                  <SummaryRow
                    key={r.client.id}
                    r={r}
                    i={i}
                    total={clientSummary.length}
                    isTamil={isTamil}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function DefaulterCard({
  d,
  rank,
  isTamil,
  ocid,
}: {
  d: DefaulterRow;
  rank: number;
  isTamil: boolean;
  ocid: string;
}) {
  return (
    <div
      data-ocid={ocid}
      className="list-row overdue"
      style={{ cursor: "default", gap: "10px" }}
    >
      <div
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.9rem",
          flexShrink: 0,
        }}
      >
        {d.client.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: "var(--kf-text)",
            fontSize: "0.88rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {d.client.name}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--kf-text-muted)" }}>
          +91 {d.client.phone}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            color: "var(--kf-danger)",
            fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "0.85rem",
          }}
        >
          {d.overdueAmount > 0 ? formatCurrency(d.overdueAmount) : "—"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "4px",
            marginTop: "3px",
          }}
        >
          <span className="badge badge-missed" style={{ fontSize: "10px" }}>
            {d.missedCount} {isTamil ? "தவறிய" : "missed"}
          </span>
          <span
            style={{
              fontSize: "9px",
              color: "var(--kf-text-muted)",
              background: "var(--kf-input-bg)",
              padding: "1px 5px",
              borderRadius: "4px",
            }}
          >
            #{rank}
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  r,
  i,
  total,
  isTamil,
}: {
  r: ClientSummaryRow;
  i: number;
  total: number;
  isTamil: boolean;
}) {
  const isLast = i === total - 1;
  return (
    <tr
      data-ocid={`reports.summary_row.${i + 1}`}
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--kf-divider)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background =
          "var(--kf-list-row-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = "";
      }}
    >
      <td
        style={{
          padding: "9px 10px",
          color: "var(--kf-text)",
          fontWeight: 600,
          maxWidth: "80px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: "0.8rem",
        }}
      >
        <span className={isTamil ? "tamil-text" : ""}>{r.client.name}</span>
      </td>
      <td
        style={{
          padding: "9px 10px",
          color: "var(--kf-text-muted)",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            background: "var(--kf-input-bg)",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--kf-text)",
          }}
        >
          {r.loanCount}
        </span>
      </td>
      <td
        style={{
          padding: "9px 10px",
          color: "var(--kf-text)",
          textAlign: "right",
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "0.78rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {formatCurrency(r.totalGiven)}
      </td>
      <td
        style={{
          padding: "9px 10px",
          color: "var(--kf-success)",
          textAlign: "right",
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "0.78rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {formatCurrency(r.totalCollected)}
      </td>
      <td
        style={{
          padding: "9px 10px",
          color: r.totalPending > 0 ? "var(--kf-danger)" : "var(--kf-success)",
          textAlign: "right",
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "0.78rem",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {formatCurrency(r.totalPending)}
      </td>
      <td
        style={{
          padding: "9px 10px",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        <RecoveryBadge pct={r.recoveryPct} />
      </td>
    </tr>
  );
}

function RecoveryBadge({ pct }: { pct: number }) {
  const color =
    pct >= 80
      ? "var(--kf-success)"
      : pct >= 50
        ? "var(--kf-amber)"
        : "var(--kf-danger)";
  const bg =
    pct >= 80
      ? "rgba(16,185,129,0.12)"
      : pct >= 50
        ? "rgba(245,158,11,0.12)"
        : "rgba(239,68,68,0.12)";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 6px",
        borderRadius: "8px",
        background: bg,
        color,
        fontWeight: 700,
        fontSize: "11px",
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      {pct}%
    </span>
  );
}
