import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  IndianRupee,
  MessageCircle,
  Search,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import type { PageProps } from "../App";
import PaymentModal from "../components/PaymentModal";
import {
  formatCurrency,
  formatDate,
  getDaysOverdue,
  getNextDueDate,
  getPaymentsCount,
  isOverdue,
} from "../lib/calculations";
import type { Loan } from "../types";

type CollectionFilter = "today" | "overdue" | "all";

export default function CollectionPage({ app }: PageProps) {
  const { clients, loans, payments, settings, savePayment, t, language } = app;
  const [filter, setFilter] = useState<CollectionFilter>("today");
  const [collectLoan, setCollectLoan] = useState<Loan | null>(null);
  const [missedLoan, setMissedLoan] = useState<Loan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isTamil = language === "ta";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const activeLoans = loans.filter((l) => l.status === "active");

  const withDue = activeLoans.map((loan) => {
    const count = getPaymentsCount(loan.id, payments);
    const due = getNextDueDate(loan.startDate, count);
    due.setHours(0, 0, 0, 0);
    const days = getDaysOverdue(due);
    const overdue = isOverdue(due);
    const dueToday = due.getTime() === todayTime;
    return { loan, due, days, overdue, dueToday };
  });

  const todayItems = withDue.filter(({ dueToday }) => dueToday);
  const overdueItems = withDue.filter(({ overdue }) => overdue);
  const allPendingItems = withDue.filter(
    ({ due, overdue: ov, dueToday: dt }) => due <= today || dt || ov,
  );

  // Today's collection progress
  const todayPaidCount = todayItems.filter(({ loan }) => {
    const todayPayments = payments.filter((p) => {
      const pDate = new Date(p.date);
      pDate.setHours(0, 0, 0, 0);
      return (
        p.loanId === loan.id &&
        pDate.getTime() === todayTime &&
        (p.status === "paid" || p.status === "partial")
      );
    });
    return todayPayments.length > 0;
  }).length;

  const todayTarget = todayItems.reduce((s, { loan }) => s + loan.emi, 0);
  const overdueTarget = overdueItems.reduce((s, { loan }) => s + loan.emi, 0);
  const progressPercent =
    todayItems.length > 0
      ? Math.round((todayPaidCount / todayItems.length) * 100)
      : 0;

  const getFiltered = () => {
    let items = withDue;
    if (filter === "today") items = todayItems;
    else if (filter === "overdue") items = overdueItems;
    else items = allPendingItems;
    return [...items].sort((a, b) => b.days - a.days);
  };

  const filtered = getFiltered().filter(({ loan }) => {
    if (!searchQuery.trim()) return true;
    const client = clients.find((c) => c.id === loan.clientId);
    return client?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  function sendReminder(loan: Loan) {
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

  function confirmMarkMissed() {
    if (!missedLoan) return;
    savePayment({
      id: `p_${Date.now()}`,
      loanId: missedLoan.id,
      amount: 0,
      date: new Date().toISOString(),
      mode: "cash",
      status: "missed",
    });
    setMissedLoan(null);
  }

  const getClientName = (cid: string) =>
    clients.find((c) => c.id === cid)?.name ?? "Unknown";
  const getClientPhone = (cid: string) =>
    clients.find((c) => c.id === cid)?.phone ?? "";

  const filterConfig: {
    key: CollectionFilter;
    label: string;
    count: number;
    ocid: string;
  }[] = [
    {
      key: "today",
      label: t("dueTodayFilter"),
      count: todayItems.length,
      ocid: "collection.filter_today",
    },
    {
      key: "overdue",
      label: t("overdueFilter"),
      count: overdueItems.length,
      ocid: "collection.filter_overdue",
    },
    {
      key: "all",
      label: t("allPending"),
      count: allPendingItems.length,
      ocid: "collection.filter_all",
    },
  ];

  const todayDateStr = new Date().toLocaleDateString(
    isTamil ? "ta-IN" : "en-IN",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <div style={{ paddingBottom: "8px" }}>
      {/* ── Collection Header ── */}
      <div
        data-ocid="collection.header"
        style={{
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "14px",
        }}
      >
        {/* Date row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          <Calendar
            size={13}
            style={{ color: "var(--kf-amber)", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "11px",
              color: "var(--kf-amber)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {todayDateStr}
          </span>
        </div>

        {/* Target row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "2px",
              }}
            >
              <Target size={12} style={{ color: "var(--kf-text-muted)" }} />
              <span
                className={`stat-label ${isTamil ? "tamil-text" : ""}`}
                style={{ marginBottom: 0, fontSize: "10px" }}
              >
                {t("todayTarget")}
              </span>
            </div>
            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "var(--kf-amber)",
                lineHeight: 1,
              }}
            >
              {formatCurrency(todayTarget)}
            </div>
          </div>

          {overdueTarget > 0 && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  justifyContent: "flex-end",
                  marginBottom: "2px",
                }}
              >
                <AlertTriangle
                  size={11}
                  style={{ color: "var(--kf-danger)" }}
                />
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--kf-danger)",
                    fontWeight: 600,
                  }}
                >
                  {t("overdueFilter")}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "var(--kf-danger)",
                  lineHeight: 1,
                }}
              >
                {formatCurrency(overdueTarget)}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--kf-text-muted)",
                fontWeight: 500,
              }}
            >
              {isTamil ? (
                <>
                  {todayPaidCount}/{todayItems.length}{" "}
                  <span className="tamil-text">வசூல் முடிந்தது</span>
                </>
              ) : (
                `${todayPaidCount} of ${todayItems.length} collected today`
              )}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color:
                  progressPercent === 100
                    ? "var(--kf-success)"
                    : "var(--kf-amber)",
              }}
            >
              {progressPercent}%
            </span>
          </div>
          <div
            data-ocid="collection.progress_bar"
            style={{
              height: "6px",
              background: "var(--kf-input-bg)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background:
                  progressPercent === 100
                    ? "var(--kf-success)"
                    : "linear-gradient(90deg, var(--kf-amber-dark), var(--kf-amber))",
                borderRadius: "3px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <Search
          size={15}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--kf-text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          data-ocid="collection.search_input"
          type="text"
          className="form-input"
          placeholder={
            isTamil ? "வாடிக்கையாளர் தேடு..." : "Search by client name..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: "36px", minHeight: "44px" }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--kf-text-muted)",
              cursor: "pointer",
              padding: "4px",
            }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="filter-tabs" style={{ marginBottom: "14px" }}>
        {filterConfig.map(({ key, label, count, ocid }) => (
          <button
            key={key}
            type="button"
            className={`filter-tab ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
            data-ocid={ocid}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span className={isTamil ? "tamil-text" : ""}>{label}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "20px",
                height: "20px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: 800,
                background:
                  filter === key
                    ? "rgba(0,0,0,0.2)"
                    : key === "overdue" && count > 0
                      ? "rgba(239,68,68,0.15)"
                      : "var(--kf-input-bg)",
                color:
                  filter === key
                    ? "var(--kf-bg)"
                    : key === "overdue" && count > 0
                      ? "var(--kf-danger)"
                      : "var(--kf-text-muted)",
                padding: "0 5px",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Collection Items ── */}
      {filtered.length === 0 ? (
        <div className="empty-state" data-ocid="collection.empty_state">
          <span className="empty-icon">🎉</span>
          <span
            className={`empty-text ${isTamil ? "tamil-text" : ""}`}
            style={{ fontWeight: 600 }}
          >
            {searchQuery
              ? isTamil
                ? "தேடல் பொருந்தவில்லை"
                : "No results found"
              : t("noDue")}
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--kf-text-muted)" }}>
            {searchQuery
              ? isTamil
                ? "வேறு பெயர் தேடவும்"
                : "Try a different name"
              : isTamil
                ? "அனைத்து தவணைகளும் தீர்க்கப்பட்டுள்ளன"
                : "All payments are up to date"}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(({ loan, days, overdue, dueToday }, i) => {
            const client = clients.find((c) => c.id === loan.clientId);
            const initials = (client?.name ?? "?").charAt(0).toUpperCase();
            const dueDate = (() => {
              const count = getPaymentsCount(loan.id, payments);
              const d = getNextDueDate(loan.startDate, count);
              return formatDate(d.toISOString());
            })();

            return (
              <div
                key={loan.id}
                data-ocid={`collection.item.${i + 1}`}
                className={overdue ? "card card-overdue" : "card card-glow"}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                {/* Red left border accent for overdue */}
                {overdue && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "4px",
                      height: "100%",
                      background: "var(--kf-danger)",
                      borderRadius: "12px 0 0 12px",
                    }}
                  />
                )}

                {/* Top row: avatar + name + EMI amount */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "10px",
                    paddingLeft: overdue ? "8px" : 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      minWidth: 0,
                    }}
                  >
                    <div
                      className="avatar"
                      style={{
                        flexShrink: 0,
                        background: overdue
                          ? "linear-gradient(135deg, #ef4444, #dc2626)"
                          : "linear-gradient(135deg, var(--kf-amber), var(--kf-amber-dark))",
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "var(--kf-text)",
                          fontFamily: "Space Grotesk, sans-serif",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getClientName(loan.clientId)}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--kf-text-muted)",
                          marginTop: "1px",
                        }}
                      >
                        +91 {getClientPhone(loan.clientId)}
                      </div>
                    </div>
                  </div>

                  {/* Right: EMI + badge */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <IndianRupee
                        size={13}
                        style={{
                          color: overdue
                            ? "var(--kf-danger)"
                            : "var(--kf-amber)",
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "1.1rem",
                          color: overdue
                            ? "var(--kf-danger)"
                            : "var(--kf-amber)",
                          fontFamily: "Space Grotesk, sans-serif",
                          lineHeight: 1,
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          Math.round(loan.emi),
                        )}
                      </span>
                    </div>
                    {days > 0 && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          marginTop: "4px",
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          borderRadius: "8px",
                          padding: "2px 6px",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--kf-danger)",
                        }}
                      >
                        <AlertTriangle size={9} />
                        {days} {t("daysOverdue")}
                      </div>
                    )}
                    {dueToday && days === 0 && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          marginTop: "4px",
                          background: "rgba(245,158,11,0.12)",
                          border: "1px solid rgba(245,158,11,0.25)",
                          borderRadius: "8px",
                          padding: "2px 6px",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--kf-amber)",
                        }}
                      >
                        <TrendingUp size={9} />
                        {t("dueToday")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Loan info row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "12px",
                    paddingLeft: overdue ? "8px" : 0,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--kf-text-muted)",
                      background: "var(--kf-input-bg)",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontWeight: 500,
                    }}
                  >
                    {isTamil ? "கடன்" : "Loan"}: {formatCurrency(loan.amount)}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--kf-text-muted)",
                      background: "var(--kf-input-bg)",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontWeight: 500,
                    }}
                  >
                    {loan.interest}% / {isTamil ? "மாதம்" : "mo"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: overdue
                        ? "rgba(239,68,68,0.8)"
                        : "var(--kf-text-muted)",
                      background: overdue
                        ? "rgba(239,68,68,0.08)"
                        : "var(--kf-input-bg)",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontWeight: 500,
                    }}
                  >
                    📅 {dueDate}
                  </span>
                </div>

                {/* Action buttons */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 48px",
                    gap: "8px",
                    paddingLeft: overdue ? "8px" : 0,
                  }}
                >
                  <button
                    type="button"
                    className="btn-collect"
                    onClick={() => setCollectLoan(loan)}
                    data-ocid={`collection.collect_button.${i + 1}`}
                    style={{
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      minHeight: "48px",
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span className={isTamil ? "tamil-text" : ""}>
                      {t("collect")}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-missed"
                    onClick={() => setMissedLoan(loan)}
                    data-ocid={`collection.missed_button.${i + 1}`}
                    style={{
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      minHeight: "48px",
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span className={isTamil ? "tamil-text" : ""}>
                      {t("missed")}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-reminder"
                    style={{
                      width: "48px",
                      minHeight: "48px",
                      padding: 0,
                      justifyContent: "center",
                      borderRadius: "10px",
                    }}
                    onClick={() => sendReminder(loan)}
                    data-ocid={`collection.reminder_button.${i + 1}`}
                    aria-label="WhatsApp Reminder"
                    title={t("sendReminder")}
                  >
                    <MessageCircle size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PaymentModal ── */}
      {collectLoan && (
        <PaymentModal
          loan={collectLoan}
          client={
            clients.find((c) => c.id === collectLoan.clientId) ?? {
              id: "",
              name: "Unknown",
              phone: "",
              createdAt: "",
            }
          }
          settings={settings}
          onSave={savePayment}
          onClose={() => setCollectLoan(null)}
          t={t}
          language={language}
        />
      )}

      {/* ── Mark Missed Confirmation Bottom Sheet ── */}
      {missedLoan && (
        <div
          className="modal-overlay"
          data-ocid="collection.missed_dialog"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setMissedLoan(null)}
          onKeyDown={(e) => e.key === "Escape" && setMissedLoan(null)}
          style={{ alignItems: "flex-end" }}
        >
          <div
            style={{
              background: "var(--kf-surface)",
              borderRadius: "20px 20px 0 0",
              padding: "24px 20px 32px",
              width: "100%",
              maxWidth: "430px",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
              borderTop: "1px solid var(--kf-border)",
            }}
          >
            {/* Handle pill */}
            <div
              style={{
                width: "36px",
                height: "4px",
                background: "var(--kf-border)",
                borderRadius: "2px",
                margin: "0 auto 20px",
              }}
            />

            {/* Icon + title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle
                  size={24}
                  style={{ color: "var(--kf-danger)" }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--kf-text)",
                    fontFamily: "Space Grotesk, sans-serif",
                    marginBottom: "4px",
                  }}
                >
                  {isTamil ? "தவறியது என்று பதிவு செய்யவா?" : "Mark as Missed?"}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--kf-text-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {isTamil ? (
                    <span className="tamil-text">
                      {getClientName(missedLoan.clientId)}-க்கான{" "}
                      {formatCurrency(missedLoan.emi)} தவறியது என பதிவாகும்
                    </span>
                  ) : (
                    <>
                      EMI of {formatCurrency(missedLoan.emi)} for{" "}
                      <strong style={{ color: "var(--kf-text)" }}>
                        {getClientName(missedLoan.clientId)}
                      </strong>{" "}
                      will be recorded as missed.
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                data-ocid="collection.missed_cancel_button"
                className="btn-secondary"
                style={{ flex: 1, minHeight: "48px", borderRadius: "12px" }}
                onClick={() => setMissedLoan(null)}
              >
                <span className={isTamil ? "tamil-text" : ""}>
                  {t("cancel")}
                </span>
              </button>
              <button
                type="button"
                data-ocid="collection.missed_confirm_button"
                style={{
                  flex: 1,
                  minHeight: "48px",
                  borderRadius: "12px",
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "var(--kf-danger)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
                onClick={confirmMarkMissed}
              >
                <AlertTriangle size={15} />
                <span className={isTamil ? "tamil-text" : ""}>
                  {isTamil ? "தவறியது பதிவு" : "Mark Missed"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
