import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Camera,
  CreditCard,
  Edit2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { PageProps } from "../App";
import PaymentModal from "../components/PaymentModal";
import {
  calculateTotalPayable,
  formatCurrency,
  formatDate,
  getNextDueDate,
  getPaymentsCount,
  getTotalPaid,
  isOverdue,
} from "../lib/calculations";
import type { TranslationKey } from "../lib/translations";
import type { Client, Loan } from "../types";

// ── Avatar ───────────────────────────────────────────────────────────────────
function ClientAvatar({
  client,
  size = 60,
}: { client: Client; size?: number }) {
  const initial = client.name.charAt(0).toUpperCase();
  if (client.photo) {
    return (
      <img
        src={client.photo}
        alt={client.name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "2px solid rgba(245,158,11,0.4)",
          boxShadow: "0 0 16px rgba(245,158,11,0.3)",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "linear-gradient(135deg, var(--kf-amber), var(--kf-amber-dark))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size > 50 ? "1.4rem" : "1.1rem",
        fontWeight: 800,
        color: "#0a0e1a",
        fontFamily: "'Space Grotesk', sans-serif",
        boxShadow: "0 0 16px rgba(245,158,11,0.35)",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

// ── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "amber" | "success" | "danger" | "muted";
}) {
  const colorMap = {
    amber: "var(--kf-amber)",
    success: "var(--kf-success)",
    danger: "var(--kf-danger)",
    muted: "var(--kf-text-muted)",
  };
  const c = colorMap[color ?? "muted"];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        flex: 1,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: "1rem",
          color: c,
          fontFamily: "'Space Grotesk', sans-serif",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "var(--kf-text-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Loan card ────────────────────────────────────────────────────────────────
interface LoanCardProps {
  loan: Loan;
  index: number;
  paid: number;
  totalPayable: number;
  pct: number;
  overdue: boolean;
  isTamil: boolean;
  t: (k: TranslationKey) => string;
  onNavigate: () => void;
  onCollect: (e: React.MouseEvent) => void;
  onReminder: (e: React.MouseEvent) => void;
}

function LoanCard({
  loan,
  index,
  paid,
  totalPayable,
  pct,
  overdue,
  isTamil,
  t,
  onNavigate,
  onCollect,
  onReminder,
}: LoanCardProps) {
  return (
    <button
      type="button"
      data-ocid={`client_profile.loan.${index}`}
      className={`card ${overdue ? "card-overdue" : "card-glow"} hover-lift`}
      style={{
        marginBottom: "10px",
        cursor: "pointer",
        padding: "16px",
        width: "100%",
        textAlign: "left",
        background: overdue ? undefined : "var(--kf-card)",
        display: "block",
      }}
      onClick={onNavigate}
      aria-label={`Loan of ${formatCurrency(loan.amount)}`}
    >
      {/* Top row: badges + EMI */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span className={`badge badge-${loan.status}`}>{t(loan.status)}</span>
          {overdue && (
            <span className="badge badge-overdue">{t("overdue")}</span>
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: 600,
              background: "var(--kf-input-bg)",
              color: "var(--kf-text-muted)",
              border: "1px solid var(--kf-input-border)",
            }}
          >
            {loan.type === "flat"
              ? isTamil
                ? "நேர்"
                : "Flat"
              : isTamil
                ? "குறை"
                : "Reducing"}
          </span>
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: "1.05rem",
            color: "var(--kf-amber)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {formatCurrency(loan.emi)}
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 500,
              color: "var(--kf-text-muted)",
            }}
          >
            /mo
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px 12px",
          marginBottom: "12px",
          fontSize: "0.8rem",
        }}
      >
        <div style={{ color: "var(--kf-text-muted)" }}>
          {isTamil ? "அசல்" : "Principal"}:{" "}
          <span style={{ color: "var(--kf-text)", fontWeight: 700 }}>
            {formatCurrency(loan.amount)}
          </span>
        </div>
        <div style={{ color: "var(--kf-text-muted)" }}>
          {isTamil ? "வட்டி" : "Rate"}:{" "}
          <span style={{ color: "var(--kf-text)", fontWeight: 700 }}>
            {loan.interest}% · {loan.duration}m
          </span>
        </div>
        <div style={{ color: "var(--kf-text-muted)" }}>
          {isTamil ? "செலுத்திய" : "Paid"}:{" "}
          <span style={{ color: "var(--kf-success)", fontWeight: 700 }}>
            {formatCurrency(paid)}
          </span>
        </div>
        <div style={{ color: "var(--kf-text-muted)" }}>
          {isTamil ? "நிலுவை" : "Balance"}:{" "}
          <span
            style={{
              color: overdue ? "var(--kf-danger)" : "var(--kf-text)",
              fontWeight: 700,
            }}
          >
            {formatCurrency(Math.max(0, totalPayable - paid))}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: loan.status === "active" ? "10px" : "0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
            fontSize: "10px",
            color: "var(--kf-text-muted)",
          }}
        >
          <span>{isTamil ? "செலுத்தல் முன்னேற்றம்" : "Repayment progress"}</span>
          <span
            style={{
              fontWeight: 700,
              color: overdue ? "var(--kf-danger)" : "var(--kf-amber)",
            }}
          >
            {pct}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${overdue ? "danger" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Action buttons */}
      {loan.status === "active" && (
        <div
          style={{ display: "flex", gap: "8px", marginTop: "2px" }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <button
            type="button"
            className="btn-collect"
            style={{ flex: 1, fontSize: "0.82rem", padding: "9px 12px" }}
            onClick={onCollect}
            data-ocid={`client_profile.collect_button.${index}`}
          >
            <CreditCard size={14} />
            {isTamil ? "வசூல் செய்" : t("collect")}
          </button>
          <button
            type="button"
            className="btn-reminder"
            onClick={onReminder}
            data-ocid={`client_profile.reminder_button.${index}`}
            aria-label="Send WhatsApp reminder"
            style={{
              width: 48,
              justifyContent: "center",
              borderRadius: "10px",
            }}
          >
            <MessageCircle size={16} />
          </button>
        </div>
      )}
    </button>
  );
}

// ── Edit client modal ────────────────────────────────────────────────────────
interface EditModalProps {
  client: Client;
  isTamil: boolean;
  t: (k: TranslationKey) => string;
  onSave: (updated: Client) => void;
  onClose: () => void;
}

function EditClientModal({
  client,
  isTamil,
  t,
  onSave,
  onClose,
}: EditModalProps) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [address, setAddress] = useState(client.address ?? "");
  const [idno, setIdno] = useState(client.idno ?? "");
  const [occ, setOcc] = useState(client.occ ?? "");
  const [photo, setPhoto] = useState<string | undefined>(client.photo);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    let valid = true;
    if (!name.trim()) {
      setNameError(isTamil ? "பெயர் தேவை" : "Name is required");
      valid = false;
    } else setNameError("");
    if (!phone.trim() || phone.trim().length < 10) {
      setPhoneError(isTamil ? "சரியான எண் தேவை" : "Valid phone required");
      valid = false;
    } else setPhoneError("");
    if (!valid) return;
    onSave({
      ...client,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      idno: idno.trim() || undefined,
      occ: occ.trim() || undefined,
      photo,
    });
  }

  return (
    <div
      className="modal-overlay"
      data-ocid="edit_client.dialog"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div className="modal-box" style={{ animation: "slideUp 0.28s ease" }}>
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
            <h3 className="modal-title">
              {isTamil ? "தகவல் திருத்து" : "Edit Client"}
            </h3>
            <p className="modal-subtitle">
              {isTamil ? "விவரங்களை புதுப்பிக்கவும்" : "Update borrower details"}
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            data-ocid="edit_client.close_button"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Photo */}
          <div
            className="form-group"
            style={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ position: "relative", display: "inline-block" }}>
              {photo ? (
                <img
                  src={photo}
                  alt="Preview"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid rgba(245,158,11,0.4)",
                    boxShadow: "0 0 12px rgba(245,158,11,0.25)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "rgba(245,158,11,0.08)",
                    border: "2px dashed rgba(245,158,11,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Camera
                    size={24}
                    style={{ color: "var(--kf-amber)", opacity: 0.6 }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--kf-amber)",
                  border: "2px solid var(--kf-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                data-ocid="edit_client.upload_button"
                aria-label={isTamil ? "புகைப்படம் மாற்று" : "Change photo"}
              >
                <Camera size={13} style={{ color: "#0a0e1a" }} />
              </button>
            </div>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
              aria-label="Photo input"
            />
            <div style={{ fontSize: "0.72rem", color: "var(--kf-text-muted)" }}>
              {isTamil ? "புகைப்படம் மாற்றவும்" : "Tap to change photo"}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ec-name" className="form-label">
              {isTamil ? "பெயர்" : "Full Name"} *
            </label>
            <input
              id="ec-name"
              data-ocid="edit_client.name_input"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
            />
            {nameError && (
              <span style={{ fontSize: "0.75rem", color: "var(--kf-danger)" }}>
                {nameError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ec-phone" className="form-label">
              {isTamil ? "தொலைபேசி" : "Phone"} *
            </label>
            <input
              id="ec-phone"
              data-ocid="edit_client.phone_input"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                if (e.target.value.trim().length >= 10) setPhoneError("");
              }}
              maxLength={10}
            />
            {phoneError && (
              <span style={{ fontSize: "0.75rem", color: "var(--kf-danger)" }}>
                {phoneError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ec-address" className="form-label">
              {isTamil ? "முகவரி" : "Address"}
            </label>
            <input
              id="ec-address"
              data-ocid="edit_client.address_input"
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="ec-idno" className="form-label">
                {isTamil ? "அடையாள எண்" : "ID No."}
              </label>
              <input
                id="ec-idno"
                data-ocid="edit_client.idno_input"
                type="text"
                className="form-input"
                value={idno}
                onChange={(e) => setIdno(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="ec-occ" className="form-label">
                {isTamil ? "தொழில்" : "Occupation"}
              </label>
              <input
                id="ec-occ"
                data-ocid="edit_client.occ_input"
                type="text"
                className="form-input"
                value={occ}
                onChange={(e) => setOcc(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={onClose}
            data-ocid="edit_client.cancel_button"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 2 }}
            onClick={handleSave}
            data-ocid="edit_client.save_button"
          >
            {isTamil ? "புதுப்பி" : "Update Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ClientProfilePage({ app }: PageProps) {
  const {
    clients,
    loans,
    payments,
    settings,
    selectedClientId,
    navigate,
    deleteClient,
    saveClient,
    savePayment,
    t,
    language,
  } = app;

  const isTamil = language === "ta";
  const client = clients.find((c) => c.id === selectedClientId);
  const [collectLoan, setCollectLoan] = useState<Loan | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!client) {
    return (
      <div className="empty-state" style={{ padding: "60px 24px" }}>
        <div style={{ fontSize: "3rem", opacity: 0.3 }}>👤</div>
        <div
          style={{ fontWeight: 700, color: "var(--kf-text)", fontSize: "1rem" }}
        >
          {isTamil ? "வாடிக்கையாளர் கிடைக்கவில்லை" : "Client not found"}
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ width: "auto", padding: "10px 24px" }}
          onClick={() => navigate("clients")}
        >
          <ArrowLeft size={16} />
          {isTamil ? "திரும்பு" : "Back to Clients"}
        </button>
      </div>
    );
  }

  const clientLoans = loans.filter((l) => l.clientId === client.id);
  const activeLoans = clientLoans.filter((l) => l.status === "active");

  const totalDisbursed = clientLoans.reduce((s, l) => s + l.amount, 0);
  const totalPaid = clientLoans.reduce(
    (s, l) =>
      s +
      payments
        .filter((p) => p.loanId === l.id && p.status !== "missed")
        .reduce((a, p) => a + p.amount, 0),
    0,
  );
  const totalOutstanding = clientLoans
    .filter((l) => l.status === "active")
    .reduce((s, l) => {
      const paid = payments
        .filter((p) => p.loanId === l.id && p.status !== "missed")
        .reduce((a, p) => a + p.amount, 0);
      return s + Math.max(0, l.emi * l.duration - paid);
    }, 0);

  function sendReminder(loan: Loan) {
    const msg = t("sendReminderMsg")
      .replace("{name}", client!.name)
      .replace("{amount}", formatCurrency(loan.emi));
    window.open(
      `https://wa.me/91${client!.phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  function handleDeleteClient() {
    deleteClient(client!.id);
    navigate("clients");
  }

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      saveClient({ ...client!, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ animation: "fadeIn 0.25s ease-out" }}>
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
        onClick={() => navigate("clients")}
        data-ocid="client_profile.back_button"
      >
        <ArrowLeft size={17} />
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          {isTamil ? "திரும்பு" : "Clients"}
        </span>
      </button>

      {/* ── Profile Hero Card ─────────────────────────────────────────────── */}
      <div
        className="card card-glow"
        style={{
          marginBottom: "14px",
          borderColor: "rgba(245,158,11,0.2)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative orb */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Header row: avatar + name + actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "14px",
          }}
        >
          {/* Tappable avatar for photo capture/replace */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ClientAvatar client={client} size={60} />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--kf-amber)",
                border: "2px solid var(--kf-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              data-ocid="client_profile.photo_button"
              aria-label={
                client.photo
                  ? isTamil
                    ? "புகைப்படம் மாற்று"
                    : "Replace photo"
                  : isTamil
                    ? "புகைப்படம் எடு"
                    : "Take photo"
              }
            >
              <Camera size={11} style={{ color: "#0a0e1a" }} />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handlePhotoCapture}
              aria-label="Capture photo"
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "1.2rem",
                color: "var(--kf-text)",
                fontFamily: "'Space Grotesk', sans-serif",
                marginBottom: "3px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {client.name}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--kf-text-muted)",
                fontSize: "0.85rem",
              }}
            >
              <Phone size={13} />
              <span>{client.phone}</span>
            </div>
          </div>

          {/* Header actions: edit + WhatsApp */}
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <button
              type="button"
              className="btn-icon"
              style={{ width: 40, height: 40 }}
              onClick={() => setShowEditModal(true)}
              data-ocid="client_profile.edit_button"
              aria-label={isTamil ? "திருத்து" : "Edit client"}
            >
              <Edit2 size={15} />
            </button>
            {activeLoans.length > 0 && (
              <button
                type="button"
                className="btn-reminder"
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: "center",
                  borderRadius: "10px",
                }}
                onClick={() => sendReminder(activeLoans[0])}
                data-ocid="client_profile.whatsapp_button"
                aria-label="Send WhatsApp message"
              >
                <MessageCircle size={17} />
              </button>
            )}
          </div>
        </div>

        {/* Details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "14px",
            paddingLeft: "4px",
          }}
        >
          {client.address && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "7px",
                fontSize: "0.83rem",
                color: "var(--kf-text-muted)",
              }}
            >
              <MapPin size={13} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{client.address}</span>
            </div>
          )}
          {client.occ && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "0.83rem",
                color: "var(--kf-text-muted)",
              }}
            >
              <Briefcase size={13} style={{ flexShrink: 0 }} />
              <span>{client.occ}</span>
            </div>
          )}
          {client.idno && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "0.83rem",
                color: "var(--kf-text-muted)",
              }}
            >
              <CreditCard size={13} style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  letterSpacing: "0.04em",
                  fontSize: "0.78rem",
                }}
              >
                {client.idno}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "0.75rem",
              color: "var(--kf-text-muted)",
              opacity: 0.7,
            }}
          >
            <Calendar size={12} style={{ flexShrink: 0 }} />
            <span>
              {isTamil ? "சேர்ந்த தேதி" : "Joined"}:{" "}
              {formatDate(client.createdAt)}
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--kf-divider)",
            paddingTop: "12px",
            gap: "8px",
          }}
        >
          <StatChip
            label={isTamil ? "கடன்கள்" : "Loans"}
            value={String(clientLoans.length)}
            color="amber"
          />
          <div style={{ width: 1, background: "var(--kf-divider)" }} />
          <StatChip
            label={isTamil ? "வழங்கியது" : "Disbursed"}
            value={formatCurrency(totalDisbursed)}
            color="muted"
          />
          <div style={{ width: 1, background: "var(--kf-divider)" }} />
          <StatChip
            label={isTamil ? "செலுத்தியது" : "Recovered"}
            value={formatCurrency(totalPaid)}
            color="success"
          />
          <div style={{ width: 1, background: "var(--kf-divider)" }} />
          <StatChip
            label={isTamil ? "நிலுவை" : "Pending"}
            value={formatCurrency(totalOutstanding)}
            color={totalOutstanding > 0 ? "danger" : "success"}
          />
        </div>
      </div>

      {/* ── Loans section ────────────────────────────────────────────────── */}
      <div className="page-title-row" style={{ marginBottom: "10px" }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          {isTamil ? "கடன்கள்" : "Loans"}{" "}
          <span
            style={{
              color: "var(--kf-text-muted)",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            ({clientLoans.length})
          </span>
        </h2>
        <button
          type="button"
          className="btn-icon"
          style={{
            background: "rgba(245,158,11,0.12)",
            borderColor: "rgba(245,158,11,0.4)",
            color: "var(--kf-amber)",
            width: 38,
            height: 38,
          }}
          onClick={() => navigate("loans")}
          data-ocid="client_profile.add_loan_button"
          aria-label="Add loan"
        >
          <Plus size={16} />
        </button>
      </div>

      {clientLoans.length === 0 ? (
        <div
          className="empty-state"
          data-ocid="client_profile.no_loans_empty_state"
          style={{ padding: "36px 24px" }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(245,158,11,0.08)",
              border: "2px dashed rgba(245,158,11,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp
              size={24}
              style={{ color: "var(--kf-amber)", opacity: 0.5 }}
            />
          </div>
          <div
            style={{
              fontWeight: 700,
              color: "var(--kf-text)",
              fontSize: "0.95rem",
            }}
          >
            {isTamil ? "கடன்கள் இல்லை" : "No loans yet"}
          </div>
          <div style={{ color: "var(--kf-text-muted)", fontSize: "0.82rem" }}>
            {isTamil ? "புதிய கடன் சேர்க்க + அழுத்தவும்" : "Tap + to add a new loan"}
          </div>
        </div>
      ) : (
        clientLoans.map((loan, i) => {
          const count = getPaymentsCount(loan.id, payments);
          const due = getNextDueDate(loan.startDate, count);
          const overdue = loan.status === "active" && isOverdue(due);
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

          return (
            <LoanCard
              key={loan.id}
              loan={loan}
              index={i + 1}
              paid={paid}
              totalPayable={totalPayable}
              pct={pct}
              overdue={overdue}
              isTamil={isTamil}
              t={t}
              onNavigate={() => navigate("loan-detail", loan.id)}
              onCollect={(e) => {
                e.stopPropagation();
                setCollectLoan(loan);
              }}
              onReminder={(e) => {
                e.stopPropagation();
                sendReminder(loan);
              }}
            />
          );
        })
      )}

      {/* ── Delete button ─────────────────────────────────────────────────── */}
      <hr className="divider" style={{ marginTop: "20px" }} />
      <button
        type="button"
        className="btn-missed"
        style={{
          width: "100%",
          background: "rgba(239,68,68,0.1)",
          color: "var(--kf-danger)",
          border: "1px solid rgba(239,68,68,0.3)",
          marginBottom: "8px",
        }}
        onClick={() => setShowDeleteConfirm(true)}
        data-ocid="client_profile.delete_button"
      >
        <Trash2 size={15} />
        {isTamil ? "வாடிக்கையாளரை நீக்கு" : "Delete Client"}
      </button>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {showEditModal && (
        <EditClientModal
          client={client}
          isTamil={isTamil}
          t={t}
          onSave={(updated) => {
            saveClient(updated);
            setShowEditModal(false);
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          data-ocid="client_profile_delete.dialog"
          onClick={(e) =>
            e.target === e.currentTarget && setShowDeleteConfirm(false)
          }
          onKeyDown={(e) => e.key === "Escape" && setShowDeleteConfirm(false)}
          role="presentation"
        >
          <div
            className="modal-box"
            style={{ animation: "slideUp 0.25s ease" }}
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
              <h3 className="modal-title" style={{ color: "var(--kf-danger)" }}>
                {isTamil ? "வாடிக்கையாளரை நீக்கு?" : "Delete this client?"}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
                data-ocid="client_profile_delete.close_button"
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
                  ? `${client.name} மற்றும் அவரது அனைத்து கடன் தரவும் நிரந்தரமாக நீக்கப்படும். இதை மீட்டெடுக்க முடியாது.`
                  : `${client.name} and all their loan data will be permanently deleted. This cannot be undone.`}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowDeleteConfirm(false)}
                data-ocid="client_profile_delete.cancel_button"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn-missed"
                style={{ flex: 1 }}
                onClick={handleDeleteClient}
                data-ocid="client_profile_delete.confirm_button"
              >
                <Trash2 size={14} />
                {isTamil ? "ஆம், நீக்கு" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {collectLoan && (
        <PaymentModal
          loan={collectLoan}
          client={client}
          settings={settings}
          onSave={savePayment}
          onClose={() => setCollectLoan(null)}
          t={t}
          language={language}
        />
      )}
    </div>
  );
}
