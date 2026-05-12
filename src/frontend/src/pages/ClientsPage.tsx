import {
  Camera,
  Download,
  Edit2,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import type { PageProps } from "../App";
import { formatCurrency, formatDate } from "../lib/calculations";
import type { TranslationKey } from "../lib/translations";
import type { Client } from "../types";

// ── Avatar: photo or initial ─────────────────────────────────────────────────
function ClientAvatar({
  client,
  size = 44,
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
          border: "2px solid rgba(245,158,11,0.35)",
          boxShadow: "0 0 8px rgba(245,158,11,0.2)",
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
        fontWeight: 800,
        fontSize: size > 50 ? "1.4rem" : "1.1rem",
        color: "#0a0e1a",
        fontFamily: "'Space Grotesk', sans-serif",
        flexShrink: 0,
        boxShadow: "0 0 10px rgba(245,158,11,0.25)",
      }}
    >
      {initial}
    </div>
  );
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
function ClientSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "4px",
      }}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: "var(--kf-card)",
            border: "1px solid var(--kf-card-border)",
            borderRadius: "14px",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            className="skeleton"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div className="skeleton" style={{ height: 14, width: "55%" }} />
            <div className="skeleton" style={{ height: 11, width: "38%" }} />
          </div>
          <div
            className="skeleton"
            style={{ width: 48, height: 22, borderRadius: "20px" }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Individual client card ───────────────────────────────────────────────────
interface ClientCardProps {
  client: Client;
  loanCount: number;
  outstanding: number;
  latestPaymentDate: string | null;
  index: number;
  isTamil: boolean;
  onNavigate: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function ClientCard({
  client,
  loanCount,
  outstanding,
  latestPaymentDate,
  index,
  isTamil,
  onNavigate,
  onEdit,
  onDelete,
}: ClientCardProps) {
  return (
    <button
      type="button"
      data-ocid={`clients.item.${index}`}
      onClick={onNavigate}
      className="list-row hover-lift"
      style={{
        width: "100%",
        textAlign: "left",
        background: "var(--kf-list-row-bg)",
        border: "1px solid var(--kf-list-row-border)",
        cursor: "pointer",
        padding: "14px",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        transition: "all 0.2s ease",
      }}
    >
      {/* Avatar */}
      <ClientAvatar client={client} size={44} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "var(--kf-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "'Space Grotesk', sans-serif",
            marginBottom: "2px",
          }}
        >
          {client.name}
        </div>
        <div
          style={{
            fontSize: "0.78rem",
            color: "var(--kf-text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          📞 {client.phone}
          {client.occ ? ` · ${client.occ}` : ""}
        </div>
        {latestPaymentDate && (
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--kf-text-muted)",
              marginTop: "2px",
              opacity: 0.75,
            }}
          >
            {isTamil ? "கடைசி பணம்" : "Last paid"}: {latestPaymentDate}
          </div>
        )}
      </div>

      {/* Right meta */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            borderRadius: "20px",
            fontSize: "10px",
            fontWeight: 700,
            background:
              loanCount > 0 ? "rgba(245,158,11,0.15)" : "var(--kf-input-bg)",
            color: loanCount > 0 ? "var(--kf-amber)" : "var(--kf-text-muted)",
            border: `1px solid ${loanCount > 0 ? "rgba(245,158,11,0.3)" : "var(--kf-input-border)"}`,
            letterSpacing: "0.02em",
          }}
        >
          {loanCount} {loanCount === 1 ? "loan" : "loans"}
        </span>
        {outstanding > 0 && (
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--kf-danger)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {formatCurrency(outstanding)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          className="btn-icon"
          style={{ width: 36, height: 36, borderRadius: "9px" }}
          onClick={onEdit}
          data-ocid={`clients.edit_button.${index}`}
          aria-label="Edit client"
        >
          <Edit2 size={14} />
        </button>
        <button
          type="button"
          className="btn-icon danger"
          style={{ width: 36, height: 36, borderRadius: "9px" }}
          onClick={onDelete}
          data-ocid={`clients.delete_button.${index}`}
          aria-label="Delete client"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </button>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyClients({
  onAdd,
  isTamil,
  t,
}: {
  onAdd: () => void;
  isTamil: boolean;
  t: (k: TranslationKey) => string;
}) {
  return (
    <div
      className="empty-state"
      data-ocid="clients.empty_state"
      style={{ padding: "56px 24px" }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(245,158,11,0.08)",
          border: "2px dashed rgba(245,158,11,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "8px",
        }}
      >
        <Users size={32} style={{ color: "var(--kf-amber)", opacity: 0.6 }} />
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: "1rem",
          color: "var(--kf-text)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {isTamil ? "வாடிக்கையாளர்கள் இல்லை" : "No clients yet"}
      </div>
      <div
        style={{
          color: "var(--kf-text-muted)",
          fontSize: "0.85rem",
          maxWidth: 220,
        }}
      >
        {isTamil
          ? "புதிய வாடிக்கையாளரை சேர்க்க + அழுத்தவும்"
          : "Add your first borrower to get started"}
      </div>
      <button
        type="button"
        className="btn-primary"
        style={{ width: "auto", padding: "11px 28px", marginTop: "4px" }}
        onClick={onAdd}
        data-ocid="clients.empty_add_button"
      >
        <Plus size={16} />
        {t("addClient")}
      </button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ClientsPage({ app }: PageProps) {
  const {
    clients,
    loans,
    payments,
    saveClient,
    deleteClient,
    navigate,
    t,
    language,
    isPro,
    isTrialActive,
    setShowUpgradeModal,
  } = app;

  const isTamil = language === "ta";
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [idno, setIdno] = useState("");
  const [occ, setOcc] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(
    undefined,
  );
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowForm(false);
        setConfirmDelete(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query),
  );

  function getClientStats(clientId: string) {
    const clientLoans = loans.filter((l) => l.clientId === clientId);
    const outstanding = clientLoans
      .filter((l) => l.status === "active")
      .reduce((sum, l) => {
        const paid = payments
          .filter((p) => p.loanId === l.id && p.status !== "missed")
          .reduce((s, p) => s + p.amount, 0);
        return sum + Math.max(0, l.emi * l.duration - paid);
      }, 0);
    const loanIds = clientLoans.map((l) => l.id);
    const clientPayments = payments
      .filter((p) => loanIds.includes(p.loanId) && p.status !== "missed")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestPaymentDate = clientPayments[0]
      ? formatDate(clientPayments[0].date)
      : null;
    return { loanCount: clientLoans.length, outstanding, latestPaymentDate };
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function openAdd() {
    if (!isPro && !isTrialActive && clients.length >= 20) {
      setShowUpgradeModal(true);
      return;
    }
    setEditClient(null);
    setName("");
    setPhone("");
    setAddress("");
    setIdno("");
    setOcc("");
    setPhotoPreview(undefined);
    setNameError("");
    setPhoneError("");
    setShowForm(true);
  }

  function openEdit(c: Client) {
    setEditClient(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address ?? "");
    setIdno(c.idno ?? "");
    setOcc(c.occ ?? "");
    setPhotoPreview(c.photo);
    setNameError("");
    setPhoneError("");
    setShowForm(true);
  }

  function handleSave() {
    let valid = true;
    if (!name.trim()) {
      setNameError(isTamil ? "பெயர் தேவை" : "Name is required");
      valid = false;
    } else {
      setNameError("");
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setPhoneError(isTamil ? "சரியான எண் தேவை" : "Valid phone number required");
      valid = false;
    } else {
      setPhoneError("");
    }
    if (!valid) return;

    const client: Client = {
      id: editClient?.id ?? `c_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      idno: idno.trim() || undefined,
      occ: occ.trim() || undefined,
      photo: photoPreview,
      createdAt: editClient?.createdAt ?? new Date().toISOString(),
    };
    saveClient(client);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    deleteClient(id);
    setConfirmDelete(null);
  }

  function exportExcel() {
    const rows = clients.map((c) => {
      const { loanCount, outstanding } = getClientStats(c.id);
      return {
        [isTamil ? "பெயர்" : "Name"]: c.name,
        [isTamil ? "தொலைபேசி" : "Phone"]: c.phone,
        [isTamil ? "முகவரி" : "Address"]: c.address ?? "",
        [isTamil ? "அடையாள எண்" : "ID No."]: c.idno ?? "",
        [isTamil ? "தொழில்" : "Occupation"]: c.occ ?? "",
        [isTamil ? "கடன்கள்" : "Loans"]: loanCount,
        [isTamil ? "நிலுவை தொகை" : "Outstanding (₹)"]: outstanding,
        [isTamil ? "சேர்ந்த தேதி" : "Joined"]: formatDate(c.createdAt),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "KaasFlow_Clients.xlsx");
  }

  const clientToDelete = clients.find((c) => c.id === confirmDelete);

  return (
    <div style={{ animation: "fadeIn 0.25s ease-out" }}>
      {/* Client limit warning banner */}
      {!isPro && !isTrialActive && clients.length >= 20 && (
        <div
          data-ocid="clients.limit_banner"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--kf-amber)",
              fontWeight: 600,
            }}
          >
            {isTamil
              ? "20 வாடிக்கையாளர் வரம்பை எட்டிவிட்டீர்கள். மேலும் சேர்க்க மேம்படுத்துங்கள்."
              : "You've reached the 20-client limit. Upgrade to add more."}
          </div>
          <button
            type="button"
            data-ocid="clients.upgrade_button"
            onClick={() => setShowUpgradeModal(true)}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "var(--kf-amber)",
              fontWeight: 700,
              fontSize: "0.75rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isTamil ? "மேம்படுத்து" : "Upgrade"}
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="page-title-row" style={{ marginBottom: "14px" }}>
        <div>
          <h1
            className="page-title"
            style={{ fontSize: "1.2rem", marginBottom: "1px" }}
          >
            {isTamil ? "வாடிக்கையாளர்கள்" : t("clients")}
          </h1>
          <div style={{ fontSize: "0.75rem", color: "var(--kf-text-muted)" }}>
            {clients.length}{" "}
            {isTamil ? "பதிவுசெய்யப்பட்டவர்கள்" : "registered borrowers"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="btn-icon"
            onClick={exportExcel}
            data-ocid="clients.export_button"
            title={t("exportExcel")}
            aria-label="Export to Excel"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            className="btn-icon"
            style={{
              background: "rgba(245,158,11,0.12)",
              borderColor: "rgba(245,158,11,0.4)",
              color: "var(--kf-amber)",
            }}
            onClick={openAdd}
            data-ocid="clients.add_button"
            aria-label="Add client"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-wrapper" style={{ marginBottom: "14px" }}>
        <Search size={16} className="search-icon" />
        <input
          ref={searchRef}
          data-ocid="clients.search_input"
          type="text"
          className="search-input"
          placeholder={
            isTamil
              ? "பெயர் அல்லது தொலைபேசி தேடுக..."
              : "Search by name or phone..."
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--kf-text-muted)",
              cursor: "pointer",
              display: "flex",
              padding: 4,
            }}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {query && (
        <div
          style={{
            fontSize: "0.78rem",
            color: "var(--kf-text-muted)",
            marginBottom: "10px",
            paddingLeft: "2px",
          }}
        >
          {filtered.length}{" "}
          {isTamil ? "முடிவுகள்" : filtered.length === 1 ? "result" : "results"}{" "}
          for &ldquo;{query}&rdquo;
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <ClientSkeleton />
      ) : filtered.length === 0 && !query ? (
        <EmptyClients onAdd={openAdd} isTamil={isTamil} t={t} />
      ) : filtered.length === 0 ? (
        <div
          className="empty-state"
          data-ocid="clients.search_empty_state"
          style={{ padding: "40px 24px" }}
        >
          <Search
            size={32}
            style={{ color: "var(--kf-text-muted)", opacity: 0.4 }}
          />
          <div style={{ color: "var(--kf-text-muted)", fontSize: "0.9rem" }}>
            {isTamil
              ? `"${query}" க்கு பொருத்தமான முடிவு இல்லை`
              : `No matches found for "${query}"`}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((c, i) => {
            const { loanCount, outstanding, latestPaymentDate } =
              getClientStats(c.id);
            return (
              <ClientCard
                key={c.id}
                client={c}
                loanCount={loanCount}
                outstanding={outstanding}
                latestPaymentDate={latestPaymentDate}
                index={i + 1}
                isTamil={isTamil}
                onNavigate={() => navigate("client-profile", c.id)}
                onEdit={(e) => {
                  e.stopPropagation();
                  openEdit(c);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(c.id);
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showForm && (
        <div
          className="modal-overlay"
          data-ocid="client_form.dialog"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowForm(false)}
          role="presentation"
        >
          <div
            className="modal-box"
            style={{ animation: "slideUp 0.28s ease" }}
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
                <h3 className="modal-title">
                  {editClient
                    ? isTamil
                      ? "தகவல் திருத்து"
                      : "Edit Client"
                    : isTamil
                      ? "புதிய வாடிக்கையாளர்"
                      : "Add New Client"}
                </h3>
                <p className="modal-subtitle">
                  {editClient
                    ? isTamil
                      ? "விவரங்களை புதுப்பிக்கவும்"
                      : "Update borrower details"
                    : isTamil
                      ? "கடன் வழங்கல் விவரங்கள்"
                      : "Fill in borrower information"}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowForm(false)}
                data-ocid="client_form.close_button"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Photo capture */}
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
                  {photoPreview ? (
                    <img
                      src={photoPreview}
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
                    data-ocid="client_form.upload_button"
                    onClick={() => photoInputRef.current?.click()}
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
                    aria-label={isTamil ? "புகைப்படம் சேர்" : "Add photo"}
                  >
                    <Camera size={13} style={{ color: "#0a0e1a" }} />
                  </button>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                  aria-label="Photo input"
                />
                <div
                  style={{ fontSize: "0.72rem", color: "var(--kf-text-muted)" }}
                >
                  {isTamil ? "புகைப்படம் (விருப்பத்திற்கு)" : "Photo (optional)"}
                </div>
              </div>

              {/* Name */}
              <div className="form-group">
                <label htmlFor="cf-name" className="form-label">
                  {isTamil ? "பெயர்" : "Full Name"} *
                </label>
                <input
                  id="cf-name"
                  data-ocid="client_form.name_input"
                  type="text"
                  className="form-input"
                  placeholder={isTamil ? "வாடிக்கையாளர் பெயர்" : "e.g. Rajan Kumar"}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setNameError("");
                  }}
                  autoComplete="given-name"
                />
                {nameError && (
                  <span
                    data-ocid="client_form.name_field_error"
                    style={{ fontSize: "0.75rem", color: "var(--kf-danger)" }}
                  >
                    {nameError}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="cf-phone" className="form-label">
                  {isTamil ? "தொலைபேசி" : "Phone Number"} *
                </label>
                <input
                  id="cf-phone"
                  data-ocid="client_form.phone_input"
                  type="tel"
                  className="form-input"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    if (e.target.value.trim().length >= 10) setPhoneError("");
                  }}
                  maxLength={10}
                />
                {phoneError && (
                  <span
                    data-ocid="client_form.phone_field_error"
                    style={{ fontSize: "0.75rem", color: "var(--kf-danger)" }}
                  >
                    {phoneError}
                  </span>
                )}
              </div>

              {/* Address */}
              <div className="form-group">
                <label htmlFor="cf-address" className="form-label">
                  {isTamil ? "முகவரி" : "Address"}
                </label>
                <input
                  id="cf-address"
                  data-ocid="client_form.address_input"
                  type="text"
                  className="form-input"
                  placeholder={
                    isTamil ? "வீட்டு முகவரி" : "Street, city, district"
                  }
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* 2-col: ID + Occupation */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="cf-idno" className="form-label">
                    {isTamil ? "அடையாள எண்" : "ID Number"}
                  </label>
                  <input
                    id="cf-idno"
                    data-ocid="client_form.idno_input"
                    type="text"
                    className="form-input"
                    placeholder="Aadhaar / PAN"
                    value={idno}
                    onChange={(e) => setIdno(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="cf-occ" className="form-label">
                    {isTamil ? "தொழில்" : "Occupation"}
                  </label>
                  <input
                    id="cf-occ"
                    data-ocid="client_form.occ_input"
                    type="text"
                    className="form-input"
                    placeholder={isTamil ? "வேலை வகை" : "e.g. Farmer"}
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
                onClick={() => setShowForm(false)}
                data-ocid="client_form.cancel_button"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 2 }}
                onClick={handleSave}
                data-ocid="client_form.save_button"
              >
                {editClient
                  ? isTamil
                    ? "புதுப்பி"
                    : "Update Client"
                  : isTamil
                    ? "சேர்"
                    : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ──────────────────────────────────────────── */}
      {confirmDelete && (
        <div
          className="modal-overlay"
          data-ocid="delete_confirm.dialog"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmDelete(null)
          }
          onKeyDown={(e) => e.key === "Escape" && setConfirmDelete(null)}
          role="presentation"
        >
          <div
            className="modal-box"
            style={{
              borderRadius: "20px 20px 0 0",
              animation: "slideUp 0.25s ease",
            }}
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
                  className="modal-title"
                  style={{ color: "var(--kf-danger)" }}
                >
                  {isTamil ? "நீக்கு உறுதிப்படுத்து" : "Delete Client"}
                </h3>
                <p className="modal-subtitle">
                  {isTamil
                    ? "இந்த செயலை மீட்டெடுக்க முடியாது"
                    : "This cannot be undone"}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfirmDelete(null)}
                data-ocid="delete_confirm.close_button"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "12px",
                  padding: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <ClientAvatar client={clientToDelete!} size={40} />
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--kf-text)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {clientToDelete?.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--kf-text-muted)",
                    }}
                  >
                    {isTamil
                      ? "இந்த வாடிக்கையாளர் நிரந்தரமாக நீக்கப்படுவார்"
                      : "All associated data will be removed"}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setConfirmDelete(null)}
                data-ocid="delete_confirm.cancel_button"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn-missed"
                style={{ flex: 1 }}
                onClick={() => handleDelete(confirmDelete)}
                data-ocid="delete_confirm.confirm_button"
              >
                <Trash2 size={15} />
                {isTamil ? "நீக்கு" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
