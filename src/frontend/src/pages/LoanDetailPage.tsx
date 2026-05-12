import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageCircle,
  Receipt,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { PageProps } from "../App";
import PaymentModal from "../components/PaymentModal";
import {
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
import { generateReceipt, incrementReceiptNumber } from "../lib/receiptUtils";
import type { Payment } from "../types";

export default function LoanDetailPage({ app }: PageProps) {
  const {
    clients,
    loans,
    payments,
    settings,
    selectedLoanId,
    navigate,
    deleteLoan,
    savePayment,
    deletePayment,
    t,
    language,
    role,
  } = app;

  const loan = loans.find((l) => l.id === selectedLoanId);
  const [showPayment, setShowPayment] = useState(false);
  const [confirmDeleteLoan, setConfirmDeleteLoan] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [showMissedConfirm, setShowMissedConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "schedule">("history");
  const isAdmin = role === "admin";
  const isTamil = language === "ta";

  if (!loan) {
    return (
      <div className="empty-state">
        <CreditCard
          size={48}
          style={{ color: "var(--kf-text-muted)", opacity: 0.4 }}
        />
        <span style={{ fontWeight: 700, color: "var(--kf-text)" }}>
          {isTamil ? "கடன் கிடைக்கவில்லை" : "Loan not found"}
        </span>
        <button
          type="button"
          className="btn-primary"
          style={{ width: "auto", padding: "10px 24px" }}
          onClick={() => navigate("loans")}
        >
          {t("back")}
        </button>
      </div>
    );
  }

  const client = clients.find((c) => c.id === loan.clientId);
  const loanPayments = payments
    .filter((p) => p.loanId === loan.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const count = getPaymentsCount(loan.id, payments);
  const due = getNextDueDate(loan.startDate, count);
  const overdue = loan.status === "active" && isOverdue(due);
  const days = getDaysOverdue(due);
  const paid = getTotalPaid(loan.id, payments);
  const totalPayable = calculateTotalPayable(
    loan.amount,
    loan.emi,
    loan.duration,
  );
  const totalInterest = calculateTotalInterest(loan.amount, totalPayable);
  const pct = Math.min(100, Math.round((paid / (totalPayable || 1)) * 100));
  const remaining = Math.max(0, totalPayable - paid);
  const fromPage = client ? "client-profile" : "loans";

  // Last paid payment (for receipt regeneration)
  const lastPaidPayment = loanPayments.find((p) => p.status !== "missed");

  function sendReminder() {
    if (!client || !loan) return;
    const msg = t("sendReminderMsg")
      .replace("{name}", client.name)
      .replace("{amount}", formatCurrency(loan.emi));
    window.open(
      `https://wa.me/91${client.phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  function handleMarkMissed() {
    const payment: Payment = {
      id: `p_${Date.now()}`,
      loanId: loan!.id,
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      mode: "cash",
      status: "missed",
      note: isTamil ? "தவறிய தவணை" : "Missed installment",
    };
    savePayment(payment);
    setShowMissedConfirm(false);
  }

  function handleGenerateReceipt() {
    if (!client || !lastPaidPayment) return;
    const receiptNo = incrementReceiptNumber();
    generateReceipt(lastPaidPayment, loan!, client, settings, receiptNo);
  }

  // Generate payment schedule
  const schedule = Array.from({ length: loan.duration }, (_, i) => {
    const dueDate = getNextDueDate(loan.startDate, i);
    const isPaid = i < count;
    const isCurrent = i === count && loan.status === "active";
    return { installment: i + 1, dueDate, isPaid, isCurrent };
  });

  const paymentStatusIcon = (p: Payment) => {
    if (p.status === "paid")
      return <CheckCircle2 size={14} style={{ color: "var(--kf-success)" }} />;
    if (p.status === "partial")
      return <Clock size={14} style={{ color: "var(--kf-amber)" }} />;
    return <XCircle size={14} style={{ color: "var(--kf-danger)" }} />;
  };

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        className="btn-icon"
        style={{
          marginBottom: "14px",
          gap: "6px",
          width: "auto",
          paddingInline: "14px",
          display: "inline-flex",
        }}
        onClick={() => navigate(fromPage, client?.id)}
        data-ocid="loan_detail.back_button"
        aria-label={t("back")}
      >
        <ArrowLeft size={17} />
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          {fromPage === "client-profile"
            ? isTamil
              ? "சுயவிவரம்"
              : "Profile"
            : t("loans")}
        </span>
      </button>

      {/* Overdue Alert Banner */}
      {overdue && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          data-ocid="loan_detail.overdue_alert"
        >
          <AlertCircle
            size={16}
            style={{ color: "var(--kf-danger)", flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontWeight: 700,
                color: "var(--kf-danger)",
                fontSize: "0.85rem",
              }}
            >
              {isTamil ? "பணம் தாமதம்" : "Payment Overdue"}
            </span>
            <span
              style={{
                color: "var(--kf-text-muted)",
                fontSize: "0.8rem",
                marginLeft: "6px",
              }}
            >
              {days} {t("daysOverdue")} · {formatDate(due.toISOString())}
            </span>
          </div>
          <button
            type="button"
            className="btn-reminder"
            style={{ padding: "6px 10px", minHeight: "32px", flexShrink: 0 }}
            onClick={sendReminder}
            data-ocid="loan_detail.overdue_reminder_button"
            aria-label="Send WhatsApp reminder"
          >
            <MessageCircle size={14} />
          </button>
        </div>
      )}

      {/* Loan Header Card */}
      <div
        className={`card ${overdue ? "card-overdue" : "card-glow"}`}
        style={{ marginBottom: "12px", padding: "18px" }}
      >
        {/* Client + Status + Amount */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "14px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--kf-amber)",
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 1.1,
              }}
            >
              {formatCurrency(loan.amount)}
            </div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "var(--kf-text)",
                marginTop: "3px",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {client?.name ??
                (isTamil ? "தெரியாத வாடிக்கையாளர்" : "Unknown Client")}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--kf-text-muted)",
                marginTop: "2px",
              }}
            >
              {loan.type === "flat" ? t("flat") : t("reducing")} ·{" "}
              {isTamil ? "தொடக்கம்" : "Started"} {formatDate(loan.startDate)}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span className={`badge badge-${loan.status}`}>
              {t(loan.status)}
            </span>
            {overdue && (
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "10px",
                  color: "var(--kf-danger)",
                  fontWeight: 700,
                }}
              >
                {days}d {t("overdue")}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid — 3 columns on first row, 3 on second */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          {[
            {
              label: "EMI",
              value: formatCurrency(loan.emi),
              color: "var(--kf-amber)",
              icon: <Receipt size={11} />,
            },
            {
              label: `${loan.interest}%/mo`,
              value: `${loan.duration} ${isTamil ? "மாதம்" : "months"}`,
              color: "var(--kf-text)",
              icon: <Calendar size={11} />,
            },
            {
              label: t("totalInterestLabel"),
              value: formatCurrency(totalInterest),
              color: "var(--kf-danger)",
              icon: <TrendingUp size={11} />,
            },
            {
              label: t("totalPayable"),
              value: formatCurrency(totalPayable),
              color: "var(--kf-text)",
              icon: <CreditCard size={11} />,
            },
            {
              label: t("paidSoFar"),
              value: formatCurrency(paid),
              color: "var(--kf-success)",
              icon: <CheckCircle2 size={11} />,
            },
            {
              label: t("balance"),
              value: formatCurrency(remaining),
              color:
                remaining > 0 && overdue
                  ? "var(--kf-danger)"
                  : "var(--kf-text)",
              icon: <Clock size={11} />,
            },
          ].map(({ label, value, color, icon }) => (
            <div
              key={label}
              style={{
                background: "rgba(0,0,0,0.04)",
                borderRadius: "8px",
                padding: "8px 10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "9px",
                  color: "var(--kf-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "4px",
                }}
              >
                {icon} {label}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  color,
                  fontSize: "0.85rem",
                  fontFamily: "'Space Grotesk', sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div
          style={{
            marginBottom: "6px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.78rem",
            color: "var(--kf-text-muted)",
          }}
        >
          <span>{t("loanProgress")}</span>
          <span
            style={{
              color: overdue ? "var(--kf-danger)" : "var(--kf-success)",
              fontWeight: 700,
            }}
          >
            {pct}% ({count}/{loan.duration} EMIs)
          </span>
        </div>
        <div
          className="progress-bar"
          style={{ height: "8px", marginBottom: "14px" }}
        >
          <div
            className={`progress-fill ${overdue ? "danger" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Next due date */}
        {loan.status === "active" && (
          <div
            style={{
              marginBottom: "12px",
              fontSize: "0.75rem",
              textAlign: "center",
              color: overdue ? "var(--kf-danger)" : "var(--kf-text-muted)",
              fontWeight: overdue ? 600 : 400,
            }}
          >
            {overdue ? "⚠️ " : "📅 "}
            {t("nextDue")}: {formatDate(due.toISOString())}
          </div>
        )}

        {/* Action Buttons — row 1: primary actions */}
        {loan.status === "active" && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <button
              type="button"
              className="btn-collect"
              style={{ flex: 1 }}
              onClick={() => setShowPayment(true)}
              data-ocid="loan_detail.collect_button"
            >
              <CheckCircle2 size={15} />
              {t("recordPayment")}
            </button>
            {isAdmin && (
              <button
                type="button"
                className="btn-missed"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  color: "var(--kf-danger)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  flex: "0 0 auto",
                  minWidth: "44px",
                  justifyContent: "center",
                  padding: "0 12px",
                }}
                onClick={() => setShowMissedConfirm(true)}
                data-ocid="loan_detail.mark_missed_button"
                aria-label={isTamil ? "தவறியதாக குறி" : "Mark missed"}
              >
                <XCircle size={15} />
                <span style={{ fontSize: "0.78rem" }}>
                  {isTamil ? "தவறியது" : t("missed")}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Action Buttons — row 2: secondary actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="btn-reminder"
            onClick={sendReminder}
            data-ocid="loan_detail.reminder_button"
            style={{ flex: 1, justifyContent: "center" }}
            aria-label="Send WhatsApp Reminder"
          >
            <MessageCircle size={16} />
            <span style={{ fontSize: "0.8rem" }}>
              {isTamil ? "நினைவூட்டல்" : t("sendReminder")}
            </span>
          </button>
          {lastPaidPayment && (
            <button
              type="button"
              className="btn-icon"
              style={{
                flex: 1,
                background: "rgba(245,158,11,0.08)",
                borderColor: "rgba(245,158,11,0.3)",
                color: "var(--kf-amber)",
                justifyContent: "center",
                gap: "6px",
              }}
              onClick={handleGenerateReceipt}
              data-ocid="loan_detail.generate_receipt_button"
            >
              <Receipt size={15} />
              <span style={{ fontSize: "0.8rem" }}>
                {isTamil ? "ரசீது" : t("generate")}
              </span>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              className="btn-icon danger"
              onClick={() => setConfirmDeleteLoan(true)}
              data-ocid="loan_detail.delete_loan_button"
              aria-label={isTamil ? "கடன் நீக்கு" : "Delete loan"}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "rgba(0,0,0,0.04)",
          borderRadius: "12px",
          padding: "3px",
          marginBottom: "12px",
        }}
        data-ocid="loan_detail.tabs"
      >
        {(["history", "schedule"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`loan_detail.tab_${tab}`}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "8px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
              background: activeTab === tab ? "var(--kf-card)" : "transparent",
              color:
                activeTab === tab ? "var(--kf-text)" : "var(--kf-text-muted)",
              boxShadow: activeTab === tab ? "var(--kf-shadow)" : "none",
            }}
          >
            {tab === "history"
              ? `${t("paymentHistory")} (${loanPayments.length})`
              : isTamil
                ? `அட்டவணை (${loan.duration})`
                : `Schedule (${loan.duration})`}
          </button>
        ))}
      </div>

      {/* Payment History Tab */}
      {activeTab === "history" && (
        <div data-ocid="loan_detail.payment_history">
          {loanPayments.length === 0 ? (
            <div
              className="empty-state"
              data-ocid="loan_detail.no_payments_empty_state"
              style={{ padding: "24px" }}
            >
              <Receipt
                size={36}
                style={{ color: "var(--kf-text-muted)", opacity: 0.3 }}
              />
              <span style={{ fontWeight: 600, color: "var(--kf-text)" }}>
                {t("noPayments")}
              </span>
              <span className="empty-text">
                {isTamil ? "இன்னும் பணம் பதிவு இல்லை" : "No payments recorded yet"}
              </span>
              {loan.status === "active" && (
                <button
                  type="button"
                  className="btn-collect"
                  style={{ marginTop: "8px" }}
                  onClick={() => setShowPayment(true)}
                  data-ocid="loan_detail.first_payment_button"
                >
                  {isTamil ? "முதல் தவணை பதிவு" : "Record First Payment"}
                </button>
              )}
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {loanPayments.map((p, i) => (
                <div
                  key={p.id}
                  data-ocid={`loan_detail.payment.${i + 1}`}
                  className="list-row"
                  style={{ alignItems: "flex-start" }}
                >
                  <div style={{ marginTop: "2px" }}>{paymentStatusIcon(p)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          color: "var(--kf-text)",
                        }}
                      >
                        {formatDate(p.date)}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          color:
                            p.status === "missed"
                              ? "var(--kf-danger)"
                              : p.status === "partial"
                                ? "var(--kf-amber)"
                                : "var(--kf-success)",
                        }}
                      >
                        {p.status === "missed"
                          ? isTamil
                            ? "தவறியது"
                            : "Missed"
                          : formatCurrency(p.amount)}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "3px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        className={`badge badge-${p.status}`}
                        style={{ fontSize: "9px" }}
                      >
                        {t(p.status)}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--kf-text-muted)",
                        }}
                      >
                        {p.status !== "missed" ? p.mode.toUpperCase() : ""}
                        {p.note ? ` · ${p.note}` : ""}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: "4px", marginTop: "2px" }}
                  >
                    {/* Receipt for individual paid payment */}
                    {p.status !== "missed" && (
                      <button
                        type="button"
                        className="btn-icon"
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "6px",
                          color: "var(--kf-amber)",
                          borderColor: "rgba(245,158,11,0.3)",
                        }}
                        onClick={() => {
                          if (!client) return;
                          const receiptNo = incrementReceiptNumber();
                          generateReceipt(
                            p,
                            loan!,
                            client,
                            settings,
                            receiptNo,
                          );
                        }}
                        data-ocid={`loan_detail.payment_receipt.${i + 1}`}
                        aria-label="Generate receipt"
                      >
                        <Receipt size={12} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-icon danger"
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "6px",
                        }}
                        onClick={() => setDeletePaymentId(p.id)}
                        data-ocid={`loan_detail.delete_payment.${i + 1}`}
                        aria-label="Delete payment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div data-ocid="loan_detail.schedule">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {schedule.map(({ installment, dueDate, isPaid, isCurrent }) => (
              <div
                key={installment}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: isCurrent
                    ? "rgba(245,158,11,0.08)"
                    : isPaid
                      ? "transparent"
                      : "var(--kf-list-row-bg)",
                  border: isCurrent
                    ? "1px solid rgba(245,158,11,0.3)"
                    : "1px solid var(--kf-list-row-border)",
                  opacity: isPaid && !isCurrent ? 0.65 : 1,
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: isPaid
                      ? "rgba(16,185,129,0.15)"
                      : isCurrent
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isPaid ? (
                    <CheckCircle2
                      size={14}
                      style={{ color: "var(--kf-success)" }}
                    />
                  ) : isCurrent ? (
                    <Clock size={14} style={{ color: "var(--kf-amber)" }} />
                  ) : (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--kf-text-muted)",
                      }}
                    >
                      {installment}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: isPaid || isCurrent ? 600 : 400,
                      color: "var(--kf-text)",
                    }}
                  >
                    EMI #{installment}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--kf-text-muted)",
                    }}
                  >
                    {formatDate(dueDate.toISOString())}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: isPaid
                      ? "var(--kf-success)"
                      : isCurrent
                        ? "var(--kf-amber)"
                        : "var(--kf-text-muted)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {formatCurrency(loan.emi)}
                </div>
                {isCurrent && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      background: "rgba(245,158,11,0.15)",
                      color: "var(--kf-amber)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: "6px",
                      padding: "2px 5px",
                      flexShrink: 0,
                    }}
                  >
                    DUE
                  </span>
                )}
                {isPaid && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      background: "rgba(16,185,129,0.1)",
                      color: "var(--kf-success)",
                      border: "1px solid rgba(16,185,129,0.2)",
                      borderRadius: "6px",
                      padding: "2px 5px",
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          loan={loan}
          client={
            client ?? { id: "", name: "Unknown", phone: "", createdAt: "" }
          }
          settings={settings}
          onSave={savePayment}
          onClose={() => setShowPayment(false)}
          t={t}
          language={language}
        />
      )}

      {/* Mark Missed Confirm */}
      {showMissedConfirm && (
        <div
          className="modal-overlay"
          data-ocid="mark_missed.dialog"
          role="presentation"
          onClick={(e) =>
            e.target === e.currentTarget && setShowMissedConfirm(false)
          }
          onKeyDown={(e) => e.key === "Escape" && setShowMissedConfirm(false)}
        >
          <div
            className="modal-box"
            style={{ borderRadius: "20px", margin: "20px" }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                background: "var(--kf-input-border)",
                borderRadius: 4,
                margin: "12px auto 0",
              }}
            />
            <div className="modal-header" style={{ paddingTop: "14px" }}>
              <div>
                <h3
                  className={`modal-title ${isTamil ? "tamil-text" : ""}`}
                  style={{ color: "var(--kf-danger)" }}
                >
                  {isTamil ? "தவறியதாக குறிக்கவா?" : "Mark as Missed?"}
                </h3>
                <p className="modal-subtitle">
                  {isTamil
                    ? "இந்த தவணை தவறியதாக பதிவு செய்யப்படும்"
                    : "This installment will be recorded as missed"}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowMissedConfirm(false)}
                data-ocid="mark_missed.close_button"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p
                style={{
                  color: "var(--kf-text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}
              >
                {isTamil
                  ? `${client?.name ?? "இந்த வாடிக்கையாளர்"} ${formatCurrency(loan.emi)} தவணையை தவறியதாக பதிவு செய்யப்படும். பிறகு திருத்தலாம்.`
                  : `This will record a missed payment of ${formatCurrency(loan.emi)} for ${client?.name ?? "this client"}. You can delete it later if needed.`}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowMissedConfirm(false)}
                data-ocid="mark_missed.cancel_button"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn-missed"
                style={{ flex: 1 }}
                onClick={handleMarkMissed}
                data-ocid="mark_missed.confirm_button"
              >
                <XCircle size={14} />
                {isTamil ? "ஆம், தவறியது" : "Yes, Mark Missed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Confirm */}
      {deletePaymentId && (
        <div
          className="modal-overlay"
          data-ocid="delete_payment.dialog"
          role="presentation"
          onClick={(e) =>
            e.target === e.currentTarget && setDeletePaymentId(null)
          }
          onKeyDown={(e) => e.key === "Escape" && setDeletePaymentId(null)}
        >
          <div
            className="modal-box"
            style={{ borderRadius: "20px", margin: "20px" }}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {isTamil ? "தவணை நீக்கு" : "Delete Payment"}
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
                  ? "இந்த தவணை பதிவை நீக்க விரும்புகிறீர்களா?"
                  : "Are you sure you want to delete this payment record?"}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeletePaymentId(null)}
                data-ocid="delete_payment.cancel_button"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn-missed"
                onClick={() => {
                  deletePayment(deletePaymentId);
                  setDeletePaymentId(null);
                }}
                data-ocid="delete_payment.confirm_button"
              >
                <Trash2 size={14} />
                {isTamil ? "நீக்கு" : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Loan Confirm */}
      {confirmDeleteLoan && (
        <div
          className="modal-overlay"
          data-ocid="delete_loan.dialog"
          role="presentation"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmDeleteLoan(false)
          }
          onKeyDown={(e) => e.key === "Escape" && setConfirmDeleteLoan(false)}
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
                  {isTamil ? "கடன் நீக்கு?" : `${t("delete")} Loan`}
                </h3>
                <p className="modal-subtitle">
                  {isTamil
                    ? "நிரந்தரமாக நீக்கப்படும்"
                    : "Permanently remove this loan"}
                </p>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--kf-text-muted)", lineHeight: 1.6 }}>
                {isTamil
                  ? `${formatCurrency(loan.amount)} கடன் மற்றும் அதன் அனைத்து தவணை வரலாறும் நிரந்தரமாக நீக்கப்படும்.`
                  : "This will permanently delete the loan of "}
                {!isTamil && (
                  <strong style={{ color: "var(--kf-text)" }}>
                    {formatCurrency(loan.amount)}
                  </strong>
                )}
                {!isTamil && " and all its payment history."}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmDeleteLoan(false)}
                data-ocid="delete_loan.cancel_button"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn-missed"
                onClick={() => {
                  deleteLoan(loan.id);
                  navigate("loans");
                }}
                data-ocid="delete_loan.confirm_button"
              >
                <Trash2 size={14} />
                {isTamil ? "ஆம், நீக்கு" : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
