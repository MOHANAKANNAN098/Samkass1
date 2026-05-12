import {
  AlertCircle,
  ChevronRight,
  CreditCard,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { PageProps } from "../App";
import SkeletonCard from "../components/SkeletonCard";
import {
  calculateEMI,
  calculateTotalInterest,
  calculateTotalPayable,
  formatCurrency,
  formatDate,
  getDaysOverdue,
  getNextDueDate,
  getPaymentsCount,
  getTotalPaid,
  isOverdue,
} from "../lib/calculations";
import type { Loan } from "../types";

type FilterStatus = "all" | "active" | "overdue" | "completed" | "defaulted";

export default function LoansPage({ app }: PageProps) {
  const {
    clients,
    loans,
    payments,
    saveLoan,
    deleteLoan,
    navigate,
    t,
    language,
    role,
  } = app;

  const [showForm, setShowForm] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [loading] = useState(false);

  // Form state
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [interest, setInterest] = useState("2");
  const [duration, setDuration] = useState("12");
  const [loanType, setLoanType] = useState<"flat" | "reducing">("flat");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const isAdmin = role === "admin";
  const isTamil = language === "ta";

  const previewEMI =
    amount && interest && duration
      ? calculateEMI(
          Number(amount),
          Number(interest),
          Number(duration),
          loanType,
        )
      : null;

  const totalPayablePreview = previewEMI
    ? calculateTotalPayable(0, previewEMI, Number(duration))
    : 0;
  const totalInterestPreview =
    previewEMI && amount
      ? calculateTotalInterest(Number(amount), totalPayablePreview)
      : 0;

  // Derive overdue loans
  const overdueLoans = loans.filter((l) => {
    if (l.status !== "active") return false;
    const cnt = getPaymentsCount(l.id, payments);
    return isOverdue(getNextDueDate(l.startDate, cnt));
  });

  const filtered = loans
    .filter((l) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "overdue") {
        if (l.status !== "active") return false;
        const cnt = getPaymentsCount(l.id, payments);
        return isOverdue(getNextDueDate(l.startDate, cnt));
      }
      return l.status === filterStatus;
    })
    .filter((l) => {
      if (!search) return true;
      const client = clients.find((c) => c.id === l.clientId);
      return (
        client?.name.toLowerCase().includes(search.toLowerCase()) ||
        client?.phone.includes(search)
      );
    });

  const activeCount = loans.filter((l) => l.status === "active").length;
  const overdueCount = overdueLoans.length;
  const totalDisbursed = loans.reduce((sum, l) => sum + l.amount, 0);

  const TAB_CONFIG: { key: FilterStatus; labelKey: string; count: number }[] = [
    { key: "all", labelKey: "allLoans", count: loans.length },
    { key: "active", labelKey: "active", count: activeCount },
    { key: "overdue", labelKey: "overdue", count: overdueCount },
    {
      key: "completed",
      labelKey: "completed",
      count: loans.filter((l) => l.status === "completed").length,
    },
    {
      key: "defaulted",
      labelKey: "defaulted",
      count: loans.filter((l) => l.status === "defaulted").length,
    },
  ];

  function openAddForm() {
    setEditLoan(null);
    setClientId("");
    setAmount("");
    setInterest("2");
    setDuration("12");
    setLoanType("flat");
    setStartDate(new Date().toISOString().split("T")[0]);
    setShowForm(true);
  }

  function openEditForm(loan: Loan) {
    setEditLoan(loan);
    setClientId(loan.clientId);
    setAmount(String(loan.amount));
    setInterest(String(loan.interest));
    setDuration(String(loan.duration));
    setLoanType(loan.type);
    setStartDate(loan.startDate);
    setShowForm(true);
  }

  function handleSave() {
    if (!clientId || !amount || !interest || !duration) return;
    const emi = calculateEMI(
      Number(amount),
      Number(interest),
      Number(duration),
      loanType,
    );
    const loan: Loan = {
      id: editLoan ? editLoan.id : `l_${Date.now()}`,
      clientId,
      amount: Number(amount),
      interest: Number(interest),
      duration: Number(duration),
      type: loanType,
      startDate,
      emi,
      status: editLoan ? editLoan.status : "active",
    };
    saveLoan(loan);
    setShowForm(false);
    setEditLoan(null);
  }

  function getClientName(cid: string) {
    return clients.find((c) => c.id === cid)?.name ?? "Unknown";
  }

  function sendWhatsApp(loan: Loan) {
    const client = clients.find((c) => c.id === loan.clientId);
    if (!client) return;
    const msg = t("sendReminderMsg")
      .replace("{name}", client.name)
      .replace("{amount}", formatCurrency(loan.emi));
    window.open(
      `https://wa.me/91${client.phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  return (
    <div>
      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <div className="stat-card" style={{ padding: "12px" }}>
          <div className="stat-label" style={{ fontSize: "9px" }}>
            {isTamil ? "மொத்தம்" : "Total"}
          </div>
          <div className="stat-value" style={{ fontSize: "1rem" }}>
            {loans.length}
          </div>
        </div>
        <div className="stat-card" style={{ padding: "12px" }}>
          <div className="stat-label" style={{ fontSize: "9px" }}>
            {isTamil ? "செயலில்" : "Active"}
          </div>
          <div className="stat-value success" style={{ fontSize: "1rem" }}>
            {activeCount}
          </div>
        </div>
        <div
          className="stat-card"
          style={{ padding: "12px", position: "relative" }}
        >
          <div className="stat-label" style={{ fontSize: "9px" }}>
            {isTamil ? "தாமதம்" : "Overdue"}
          </div>
          <div className="stat-value danger" style={{ fontSize: "1rem" }}>
            {overdueCount}
          </div>
          {overdueCount > 0 && (
            <div
              style={{
                position: "absolute",
                top: "6px",
                right: "8px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--kf-danger)",
                animation: "pulse-red 1.5s infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Total Disbursed Banner */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={16} style={{ color: "var(--kf-amber)" }} />
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--kf-text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {isTamil ? "மொத்த வழங்கல்" : "Total Disbursed"}
          </span>
        </div>
        <span
          style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            color: "var(--kf-amber)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {formatCurrency(totalDisbursed)}
        </span>
      </div>

      {/* Page title row */}
      <div className="page-title-row">
        <h1
          className={`page-title ${isTamil ? "tamil-text" : ""}`}
          style={{ fontSize: "1.1rem" }}
        >
          {t("loans")}
        </h1>
        {isAdmin && (
          <button
            type="button"
            className="btn-icon"
            style={{
              background: "rgba(245,158,11,0.15)",
              borderColor: "var(--kf-amber)",
              color: "var(--kf-amber)",
            }}
            onClick={openAddForm}
            data-ocid="loans.add_button"
            aria-label={t("addLoan")}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={
            isTamil ? "கடன் தேடு..." : "Search by client name or phone..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="loans.search_input"
        />
      </div>

      {/* Filter tabs */}
      <div
        className="filter-tabs"
        data-ocid="loans.filter.tab"
        style={{ overflowX: "auto", gap: "4px" }}
      >
        {TAB_CONFIG.map(({ key, labelKey, count }) => (
          <button
            key={key}
            type="button"
            className={`filter-tab ${
              filterStatus === key ? "active" : ""
            } ${key === "overdue" && filterStatus === key ? "danger-tab" : ""}`}
            onClick={() => setFilterStatus(key)}
            data-ocid={`loans.filter_${key}`}
            style={{
              flexShrink: 0,
              borderColor:
                key === "overdue" && count > 0 && filterStatus !== key
                  ? "rgba(239,68,68,0.25)"
                  : undefined,
              color:
                key === "overdue" && count > 0 && filterStatus !== key
                  ? "var(--kf-danger)"
                  : undefined,
            }}
          >
            {key === "all"
              ? t("allLoans")
              : t(labelKey as Parameters<typeof t>[0])}
            {count > 0 && (
              <span
                style={{
                  marginLeft: "4px",
                  fontSize: "10px",
                  background:
                    filterStatus === key
                      ? key === "overdue"
                        ? "rgba(239,68,68,0.2)"
                        : "rgba(0,0,0,0.15)"
                      : "rgba(0,0,0,0.08)",
                  color:
                    key === "overdue" && filterStatus !== key
                      ? "var(--kf-danger)"
                      : undefined,
                  padding: "1px 5px",
                  borderRadius: "10px",
                }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" data-ocid="loans.empty_state">
          <CreditCard
            size={48}
            style={{ color: "var(--kf-text-muted)", opacity: 0.4 }}
          />
          <div
            style={{
              fontWeight: 700,
              color: "var(--kf-text)",
              fontSize: "1rem",
            }}
          >
            {search
              ? isTamil
                ? "தேடல் பொருந்தவில்லை"
                : "No loans match your search"
              : filterStatus === "overdue"
                ? isTamil
                  ? "தாமதமான கடன்கள் இல்லை"
                  : "No overdue loans"
                : t("noLoans")}
          </div>
          <div className="empty-text" style={{ maxWidth: "220px" }}>
            {search
              ? isTamil
                ? "வேறொரு பெயர் அல்லது தொலைபேசி எண் முயற்சிக்கவும்"
                : "Try a different name or phone number"
              : filterStatus === "overdue"
                ? isTamil
                  ? "அனைத்து கடன்களும் நவீனமாக உள்ளன"
                  : "All loans are current — great work!"
                : isTamil
                  ? "முதல் கடனை சேர்க்க + அழுத்தவும்"
                  : "Add your first loan to start tracking EMIs"}
          </div>
          {!search && filterStatus === "all" && isAdmin && (
            <button
              type="button"
              className="btn-primary"
              style={{ width: "auto", padding: "10px 24px", marginTop: "4px" }}
              onClick={openAddForm}
              data-ocid="loans.empty_add_button"
            >
              <Plus size={16} /> {t("addLoan")}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((loan, i) => {
            const count = getPaymentsCount(loan.id, payments);
            const due = getNextDueDate(loan.startDate, count);
            const overdue = loan.status === "active" && isOverdue(due);
            const daysOverdue = overdue ? getDaysOverdue(due) : 0;
            const paid = getTotalPaid(loan.id, payments);
            const totalPayable = calculateTotalPayable(
              loan.amount,
              loan.emi,
              loan.duration,
            );
            const pct = Math.min(
              100,
              Math.round((paid / (totalPayable || 1)) * 100),
            );
            const clientName = getClientName(loan.clientId);

            return (
              <button
                key={loan.id}
                type="button"
                className={`card card-glow ${overdue ? "card-overdue" : ""}`}
                data-ocid={`loans.item.${i + 1}`}
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                }}
                onClick={() => navigate("loan-detail", loan.id)}
              >
                {/* Top row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--kf-text)",
                        fontSize: "0.95rem",
                        fontFamily: "'Space Grotesk', sans-serif",
                        marginBottom: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {clientName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--kf-text-muted)",
                      }}
                    >
                      {loan.type === "flat" ? t("flat") : t("reducing")} ·{" "}
                      {loan.duration} mo · {loan.interest}%/mo ·{" "}
                      {isTamil ? "தொடக்கம்" : "Started"}{" "}
                      {formatDate(loan.startDate)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                      flexShrink: 0,
                      flexDirection: "column",
                    }}
                  >
                    {overdue ? (
                      <span
                        className="badge badge-overdue"
                        style={{ fontSize: "10px", whiteSpace: "nowrap" }}
                      >
                        <AlertCircle size={9} style={{ marginRight: "2px" }} />
                        {daysOverdue}d {t("overdue")}
                      </span>
                    ) : (
                      <span className={`badge badge-${loan.status}`}>
                        {t(loan.status)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    marginBottom: "10px",
                    background: "rgba(0,0,0,0.04)",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                >
                  {[
                    {
                      label: isTamil ? "அசல்" : "Principal",
                      value: formatCurrency(loan.amount),
                      color: "var(--kf-text)",
                    },
                    {
                      label: "EMI",
                      value: formatCurrency(loan.emi),
                      color: "var(--kf-amber)",
                    },
                    {
                      label: t("nextDue"),
                      value:
                        loan.status === "active"
                          ? formatDate(due.toISOString())
                          : "—",
                      color: overdue ? "var(--kf-danger)" : "var(--kf-text)",
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "9px",
                          color: "var(--kf-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          marginBottom: "2px",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{ fontWeight: 700, color, fontSize: "0.8rem" }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="progress-bar" style={{ marginBottom: "6px" }}>
                  <div
                    className={`progress-fill ${overdue ? "danger" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.72rem",
                    color: "var(--kf-text-muted)",
                  }}
                >
                  <span>
                    {count}/{loan.duration} EMIs · {pct}% {t("paidSoFar")}
                  </span>
                  <div
                    style={{ display: "flex", gap: "4px" }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    {loan.status === "active" && (
                      <button
                        type="button"
                        className="btn-reminder"
                        style={{
                          padding: "4px 8px",
                          minHeight: "30px",
                          fontSize: "0.7rem",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          sendWhatsApp(loan);
                        }}
                        data-ocid={`loans.reminder_button.${i + 1}`}
                        aria-label="Send WhatsApp Reminder"
                      >
                        <MessageCircle size={12} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-icon"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          color: "var(--kf-amber)",
                          borderColor: "rgba(245,158,11,0.3)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(loan);
                        }}
                        data-ocid={`loans.edit_button.${i + 1}`}
                        aria-label="Edit loan"
                      >
                        <Pencil size={11} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-icon danger"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(loan.id);
                        }}
                        data-ocid={`loans.delete_button.${i + 1}`}
                        aria-label="Delete loan"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                    <ChevronRight
                      size={14}
                      style={{
                        color: "var(--kf-text-muted)",
                        marginTop: "2px",
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add / Edit Loan Modal */}
      {showForm && (
        <div
          className="modal-overlay"
          data-ocid="loan_form.dialog"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowForm(false)}
        >
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h3 className={`modal-title ${isTamil ? "tamil-text" : ""}`}>
                  {editLoan ? `${t("edit")} ${t("loans")}` : t("addLoan")}
                </h3>
                <p className="modal-subtitle">
                  {editLoan
                    ? isTamil
                      ? "கடன் விவரங்களை திருத்துக"
                      : "Update the loan details below"
                    : isTamil
                      ? "கடன் விவரங்களை நிரப்புக"
                      : "Fill in the loan details below"}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowForm(false)}
                data-ocid="loan_form.close_button"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Client selector — hidden when editing */}
              {!editLoan && (
                <div className="form-group">
                  <label htmlFor="lf-client" className="form-label">
                    {t("clients")} *
                  </label>
                  <select
                    id="lf-client"
                    data-ocid="loan_form.client_select"
                    className="form-select"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    <option value="">
                      {isTamil ? "— வாடிக்கையாளர் தேர்வு —" : "— Select Client —"}
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="lf-amount" className="form-label">
                  {t("amount")} *
                </label>
                <input
                  id="lf-amount"
                  data-ocid="loan_form.amount_input"
                  type="number"
                  className="form-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  min={0}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div className="form-group">
                  <label htmlFor="lf-interest" className="form-label">
                    {t("interest")}
                  </label>
                  <input
                    id="lf-interest"
                    data-ocid="loan_form.interest_input"
                    type="number"
                    className="form-input"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    step="0.5"
                    min={0}
                    placeholder="2"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lf-duration" className="form-label">
                    {t("duration")}
                  </label>
                  <input
                    id="lf-duration"
                    data-ocid="loan_form.duration_input"
                    type="number"
                    className="form-input"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min={1}
                    placeholder="12"
                  />
                </div>
              </div>
              <div className="form-group">
                <span className="form-label">{t("loanType")}</span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  {(["flat", "reducing"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`mode-btn ${loanType === type ? "active" : ""}`}
                      onClick={() => setLoanType(type)}
                      data-ocid={`loan_form.type_${type}`}
                    >
                      {t(type)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="lf-start" className="form-label">
                  {t("startDate")}
                </label>
                <input
                  id="lf-start"
                  data-ocid="loan_form.start_date_input"
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* EMI Preview */}
              {previewEMI !== null && (
                <div
                  data-ocid="loan_form.emi_preview"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))",
                    border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: "12px",
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--kf-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "4px",
                    }}
                  >
                    {isTamil ? "மாதாந்திர தவணை" : "Monthly EMI"}
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "var(--kf-amber)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      marginBottom: "8px",
                    }}
                  >
                    {formatCurrency(previewEMI)}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      fontSize: "0.75rem",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--kf-text-muted)" }}>
                        {isTamil ? "மொத்த செலுத்த" : "Total Payable"}:{" "}
                      </span>
                      <span
                        style={{ color: "var(--kf-text)", fontWeight: 600 }}
                      >
                        {formatCurrency(totalPayablePreview)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "var(--kf-text-muted)" }}>
                        {isTamil ? "மொத்த வட்டி" : "Total Interest"}:{" "}
                      </span>
                      <span
                        style={{ color: "var(--kf-danger)", fontWeight: 600 }}
                      >
                        {formatCurrency(totalInterestPreview)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
                data-ocid="loan_form.cancel_button"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={!editLoan && (!clientId || !amount)}
                data-ocid="loan_form.save_button"
                style={{
                  opacity: !editLoan && (!clientId || !amount) ? 0.5 : 1,
                }}
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div
          className="modal-overlay"
          data-ocid="delete_confirm.dialog"
          role="presentation"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmDelete(null)
          }
          onKeyDown={(e) => e.key === "Escape" && setConfirmDelete(null)}
        >
          <div
            className="modal-box"
            style={{ borderRadius: "20px", margin: "20px" }}
          >
            <div className="modal-header">
              <div>
                <h3
                  className="modal-title"
                  style={{ color: "var(--kf-danger)" }}
                >
                  {isTamil ? "கடனை நீக்கு?" : "Delete Loan?"}
                </h3>
                <p className="modal-subtitle">
                  {isTamil
                    ? "இதை மீட்டெடுக்க முடியாது"
                    : "This action cannot be undone"}
                </p>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--kf-text-muted)", lineHeight: 1.6 }}>
                {isTamil
                  ? "இந்த கடன் மற்றும் அதன் அனைத்து பணம் பதிவுகளும் நிரந்தரமாக நீக்கப்படும்."
                  : `${t("confirmDelete")} All payments linked to this loan will also be removed.`}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmDelete(null)}
                data-ocid="delete_confirm.cancel_button"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn-missed"
                onClick={() => {
                  deleteLoan(confirmDelete);
                  setConfirmDelete(null);
                }}
                data-ocid="delete_confirm.confirm_button"
              >
                <Trash2 size={14} /> {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
