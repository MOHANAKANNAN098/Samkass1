import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Database,
  Download,
  Key,
  LogOut,
  Palette,
  Save,
  Shield,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PageProps } from "../App";
import ThemeToggle from "../components/ThemeToggle";
import { PlanCard } from "../components/UpgradeModal";
import { useTheme } from "../hooks/useTheme";
import { requestNotificationPermission } from "../lib/notifications";
import { clearAllData } from "../lib/storage";

/* ── Types ────────────────────────────────────── */
type ToastType = "success" | "error";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

/* ── PinDigitInput ───────────────────────────── */
function PinDigitInput({
  values,
  onChange,
  id,
  disabled = false,
}: {
  values: string[];
  onChange: (vals: string[]) => void;
  id: string;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = (idx: number, val: string) => {
    // Only allow digits
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[idx] = digit;
    onChange(next);
    if (digit && idx < 3) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 3) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    const next = ["", "", "", ""];
    for (let i = 0; i < digits.length; i++) next[i] = digits[i];
    onChange(next);
    const focusIdx = Math.min(digits.length, 3);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      {[0, 1, 2, 3].map((idx) => (
        <input
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          id={idx === 0 ? id : undefined}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={values[idx]}
          disabled={disabled}
          onChange={(e) => handleInput(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`PIN digit ${idx + 1}`}
          style={{
            width: 52,
            height: 52,
            textAlign: "center",
            fontSize: "1.4rem",
            fontWeight: 800,
            fontFamily: "'Space Grotesk', monospace",
            borderRadius: "12px",
            border: `2px solid ${
              values[idx] ? "var(--kf-amber)" : "var(--kf-input-border)"
            }`,
            background: "var(--kf-input-bg)",
            color: "var(--kf-text)",
            outline: "none",
            transition: "border-color 0.15s",
            boxShadow: values[idx] ? "0 0 0 3px rgba(245,158,11,0.12)" : "none",
            letterSpacing: "0",
            caretColor: "var(--kf-amber)",
            opacity: disabled ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}

/* ── SectionCard ──────────────────────────────── */
function SectionCard({
  icon,
  title,
  subtitle,
  children,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className="settings-card"
      style={
        danger
          ? {
              borderColor: "rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.04)",
            }
          : {}
      }
    >
      <div className="settings-card-header">
        <div
          className="settings-card-icon"
          style={
            danger
              ? {
                  background: "rgba(239,68,68,0.12)",
                  color: "var(--kf-danger)",
                }
              : {}
          }
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="settings-card-title"
            style={danger ? { color: "var(--kf-danger)" } : {}}
          >
            {title}
          </div>
          {subtitle && <div className="settings-card-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="settings-card-body">{children}</div>
    </div>
  );
}

/* ── ActionRow ────────────────────────────────── */
function ActionRow({
  label,
  sublabel,
  onClick,
  ocid,
  icon,
  danger = false,
  loading = false,
  success = false,
}: {
  label: string;
  sublabel?: string;
  onClick: () => void;
  ocid: string;
  icon: React.ReactNode;
  danger?: boolean;
  loading?: boolean;
  success?: boolean;
}) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      disabled={loading}
      className={`settings-action-row ${danger ? "danger" : ""}`}
      style={{ width: "100%" }}
    >
      <span
        className="settings-row-icon"
        style={
          danger
            ? {
                background: "rgba(239,68,68,0.12)",
                color: "var(--kf-danger)",
              }
            : {}
        }
      >
        {success ? <Check size={16} /> : icon}
      </span>
      <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
        <div
          className="settings-row-label"
          style={danger ? { color: "var(--kf-danger)" } : {}}
        >
          {label}
        </div>
        {sublabel && <div className="settings-row-sublabel">{sublabel}</div>}
      </div>
      {!danger && (
        <ChevronRight
          size={16}
          style={{ color: "var(--kf-text-muted)", flexShrink: 0 }}
        />
      )}
    </button>
  );
}

/* ── ToggleRow ────────────────────────────────── */
function ToggleRow({
  label,
  sublabel,
  checked,
  onChange,
  ocid,
  icon,
  loading = false,
}: {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  ocid: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div
      className="settings-action-row"
      style={{
        width: "100%",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
      onClick={() => !loading && onChange(!checked)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !loading)
          onChange(!checked);
      }}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
    >
      <span className="settings-row-icon">{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="settings-row-label">{label}</div>
        {sublabel && <div className="settings-row-sublabel">{sublabel}</div>}
      </div>
      {/* KF custom toggle switch */}
      <div
        data-ocid={ocid}
        style={{
          width: 48,
          height: 26,
          borderRadius: 13,
          background: checked ? "var(--kf-amber)" : "var(--kf-input-border)",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
          border: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 25 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: checked ? "#0a0e1a" : "var(--kf-text-muted)",
            transition: "left 0.2s, background 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </div>
  );
}

/* ════════════════ MAIN PAGE ════════════════════ */
export default function SettingsPage({ app }: PageProps) {
  const {
    settings,
    updateSettings,
    logout,
    t,
    language,
    role,
    isPro,
    isTrialActive,
    trialDaysRemaining,
    upgradePro,
    setShowUpgradeModal,
    changePin,
    authError,
  } = app;
  const { isDark } = useTheme();
  const isTamil = language === "ta";
  const isAdmin = role === "admin";

  /* ── Profile state ── */
  const [financierName, setFinancierName] = useState(settings.financierName);
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [profileSaved, setProfileSaved] = useState(false);

  /* ── PIN state ── */
  const [currentPinDigits, setCurrentPinDigits] = useState(["", "", "", ""]);
  const [newPinDigits, setNewPinDigits] = useState(["", "", "", ""]);
  const [confirmPinDigits, setConfirmPinDigits] = useState(["", "", "", ""]);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  /* ── Notification state ── */
  const [notifEnabled, setNotifEnabled] = useState(
    () => "Notification" in window && Notification.permission === "granted",
  );
  const [notifLoading, setNotifLoading] = useState(false);

  /* ── Confirm dialogs ── */
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmClearStep2, setConfirmClearStep2] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  /* ── Import/export ── */
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  /* ── Toast ── */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync auth errors from app
  useEffect(() => {
    if (authError) setPinError(authError);
  }, [authError]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3500);
    },
    [],
  );

  /* ── Profile save ── */
  function handleSaveProfile() {
    updateSettings({ financierName, businessName });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
    showToast(
      isTamil ? "சுயவிவரம் சேமிக்கப்பட்டது ✓" : "Profile saved successfully",
    );
  }

  /* ── Language ── */
  function handleLanguage(lang: "en" | "ta") {
    updateSettings({ language: lang });
  }

  /* ── PIN change ── */
  async function handleChangePin() {
    const current = currentPinDigits.join("");
    const newP = newPinDigits.join("");
    const confirm = confirmPinDigits.join("");

    if (current.length < 4) {
      setPinError(
        isTamil
          ? "தற்போதைய PIN முழுமையாக உள்ளிடவும்"
          : "Please enter your current PIN",
      );
      return;
    }
    if (newP.length < 4) {
      setPinError(
        isTamil
          ? "புதிய PIN முழுமையாக உள்ளிடவும்"
          : "Please enter a new 4-digit PIN",
      );
      return;
    }
    if (newP !== confirm) {
      setPinError(t("pinMismatch"));
      return;
    }
    setPinError(null);
    setPinLoading(true);
    try {
      const ok = await changePin(current, newP);
      if (ok) {
        setCurrentPinDigits(["", "", "", ""]);
        setNewPinDigits(["", "", "", ""]);
        setConfirmPinDigits(["", "", "", ""]);
        setPinError(null);
        showToast(t("changePinSuccess"));
      } else {
        setPinError(t("currentPinIncorrect"));
      }
    } finally {
      setPinLoading(false);
    }
  }

  /* ── Notifications toggle ── */
  async function handleNotifToggle(enable: boolean) {
    if (!enable) {
      // Can't programmatically revoke — inform user
      showToast(
        isTamil
          ? "உலாவி அமைப்புகளில் அறிவிப்புகளை முடக்கவும்"
          : "To disable, block notifications in browser settings",
        "error",
      );
      return;
    }
    setNotifLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setNotifEnabled(granted);
      if (granted) {
        showToast(isTamil ? "அறிவிப்புகள் இயக்கப்பட்டன ✓" : "Notifications enabled");
      } else {
        showToast(
          isTamil ? "உலாவி அனுமதி மறுக்கப்பட்டது" : "Browser permission denied",
          "error",
        );
      }
    } finally {
      setNotifLoading(false);
    }
  }

  /* ── Export/Import ── */
  function handleExportBackup() {
    const data = {
      kf_clients: localStorage.getItem("kf_clients"),
      kf_loans: localStorage.getItem("kf_loans"),
      kf_payments: localStorage.getItem("kf_payments"),
      kf_settings: localStorage.getItem("kf_settings"),
      kf_auth: localStorage.getItem("kf_auth"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KaasFlow_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
    showToast(
      isTamil
        ? "காப்புப்பிரதி பதிவிறக்கம் செய்யப்பட்டது"
        : "Backup exported successfully",
    );
  }

  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Record<
          string,
          string | null
        >;
        for (const [key, value] of Object.entries(data)) {
          if (value) localStorage.setItem(key, value);
        }
        app.refreshData();
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
        showToast(
          isTamil ? "தரவு மீட்டமைக்கப்பட்டது ✓" : "Data restored successfully",
        );
      } catch {
        showToast(isTamil ? "தவறான கோப்பு" : "Invalid backup file", "error");
      } finally {
        setImportLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  function handleClearAll() {
    clearAllData();
    logout();
  }

  /* ── Label helpers ── */
  const lbl = {
    profile: isTamil ? "சுயவிவரம்" : "Profile",
    profileSub: isTamil ? "நிதியாளர் தகவல்" : "Financier information",
    preferences: isTamil ? "விருப்பத்தேர்வுகள்" : "Preferences",
    preferencesSub: isTamil ? "மொழி & தோற்றம்" : "Language & appearance",
    pinSection: isTamil ? "PIN மாற்று" : "Change PIN",
    pinSub: isTamil
      ? "உங்கள் 4-இலக்க PIN மாற்றவும்"
      : "Update your 4-digit security PIN",
    notifSection: isTamil ? "அறிவிப்புகள்" : "Notifications",
    notifSub: isTamil
      ? "தினசரி வசூல் நினைவூட்டல்கள்"
      : "Daily collection reminders",
    backup: isTamil ? "காப்பு & மீட்பு" : "Backup & Restore",
    backupSub: isTamil
      ? "தரவை ஏற்றுமதி / இறக்குமதி செய்"
      : "Export or import your data",
    security: isTamil ? "பாதுகாப்பு" : "Security",
    securitySub: isTamil ? "கணக்கு பாதுகாப்பு" : "Account security",
    danger: isTamil ? "ஆபத்து மண்டலம்" : "Danger Zone",
    dangerSub: isTamil ? "மீளமுடியாத செயல்கள்" : "Irreversible actions",
    financierNameLabel: isTamil ? "நிதியாளர் பெயர்" : "Financier Name",
    businessNameLabel: isTamil ? "வணிக பெயர்" : "Business Name",
    darkModeLabel: isTamil ? "இருண்ட பயன்முறை" : "Dark Mode",
    darkModeSub: isTamil ? "இருண்ட தீம் பயன்படுத்து" : "Use dark theme",
    currentPinLabel: isTamil ? "தற்போதைய PIN" : "Current PIN",
    newPinLabel: isTamil ? "புதிய PIN" : "New PIN",
    confirmPinLabel: isTamil ? "PIN உறுதிப்படுத்து" : "Confirm New PIN",
    notifLabel: isTamil ? "உலாவி அறிவிப்புகள்" : "Browser Notifications",
    notifLabelSub: isTamil
      ? "12:00 AM-ல் வசூல் நினைவூட்டல்"
      : "Collection reminder at 12:00 AM daily",
    exportLabel: isTamil ? "காப்புப்பிரதி ஏற்றுமதி" : "Export Backup",
    exportSub: isTamil ? "JSON கோப்பாக பதிவிறக்கம்" : "Download as JSON file",
    importLabel: isTamil ? "காப்புப்பிரதி இறக்குமதி" : "Import Backup",
    importSub: isTamil ? "JSON கோப்பிலிருந்து மீட்டமை" : "Restore from JSON file",
    logoutLabel: isTamil ? "வெளியேறு" : "Logout",
    logoutSub: isTamil ? "கணக்கிலிருந்து வெளியேறு" : "Sign out from this account",
    clearLabel: isTamil ? "அனைத்து தரவும் நீக்கு" : "Clear All Data",
    clearSub: isTamil
      ? "அனைத்தும் நிரந்தரமாக நீக்கப்படும்"
      : "Permanently delete all data",
    cancelLabel: t("cancel"),
    areYouSure: isTamil ? "நிச்சயமா?" : "Are you sure?",
    clearWarning: isTamil
      ? "இது அனைத்து வாடிக்கையாளர்கள், கடன்கள், பணம் வரலாறு மற்றும் உங்கள் கணக்கை நிரந்தரமாக நீக்கும்."
      : "This will permanently delete all clients, loans, payment history, and your account. This action cannot be undone.",
    clearFinalWarning: isTamil
      ? "கடைசி எச்சரிக்கை: இந்த செயலை மீளமுடியாது. தொடர விரும்புகிறீர்களா?"
      : "Final warning: This cannot be undone. Do you really want to delete everything?",
    logoutConfirmMsg: isTamil
      ? "வெளியேற விரும்புகிறீர்களா? உங்கள் தரவு பாதுகாப்பாக சேமிக்கப்பட்டிருக்கும்."
      : "Are you sure you want to logout? Your data is safely saved locally.",
    yesLogout: isTamil ? "ஆம், வெளியேறு" : "Yes, Logout",
    yesDelete: isTamil ? "ஆம், நீக்கு" : "Yes, Delete",
    step2Confirm: isTamil ? "ஆம், நிரந்தரமாக நீக்கு" : "Yes, Delete Permanently",
    changePinBtn: isTamil ? "PIN மாற்று" : "Change PIN",
    staffBadge: isTamil ? "பணியாளர் கணக்கு" : "Staff Account",
    staffLimitedMsg: isTamil
      ? "பணியாளர் கணக்குகள் வசூல், அறிக்கைகள், அமைப்புகளுக்கு மட்டுமே அணுகல் கொண்டுள்ளன."
      : "Staff accounts have limited access to Collections, Reports, and Settings.",
    adminBadge: isTamil ? "நிர்வாகி" : "Admin",
  };

  const name = settings.financierName || "KF";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const pinIsValid =
    currentPinDigits.every(Boolean) &&
    newPinDigits.every(Boolean) &&
    confirmPinDigits.every(Boolean);

  return (
    <div
      className={`settings-page ${isTamil ? "tamil-text" : ""}`}
      data-ocid="settings.page"
    >
      {/* ── Header profile banner ── */}
      <div className="settings-profile-banner">
        <div className="settings-profile-avatar">{initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="settings-profile-name">
            {settings.financierName || "KaasFlow User"}
          </div>
          <div className="settings-profile-sub">
            {settings.businessName && (
              <span>{settings.businessName} &nbsp;·&nbsp; </span>
            )}
            {settings.phone}
          </div>
        </div>
        {/* Role badge */}
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "0.7rem",
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "0.04em",
            flexShrink: 0,
            background: isAdmin
              ? "rgba(245,158,11,0.15)"
              : "rgba(99,102,241,0.15)",
            color: isAdmin ? "var(--kf-amber)" : "#818cf8",
            border: `1px solid ${
              isAdmin ? "rgba(245,158,11,0.3)" : "rgba(99,102,241,0.3)"
            }`,
          }}
        >
          {isAdmin ? lbl.adminBadge : lbl.staffBadge}
        </span>
      </div>

      {/* Staff role info banner */}
      {!isAdmin && (
        <div
          data-ocid="settings.staff_notice"
          style={{
            margin: "0 0 12px",
            padding: "10px 14px",
            background: "rgba(99,102,241,0.07)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "12px",
            fontSize: "0.8rem",
            color: "#818cf8",
            lineHeight: 1.5,
          }}
        >
          ℹ️ {lbl.staffLimitedMsg}
        </div>
      )}

      {/* ══════════════════════════════
           PROFILE SECTION
      ══════════════════════════════ */}
      <SectionCard
        icon={<User size={16} />}
        title={lbl.profile}
        subtitle={lbl.profileSub}
      >
        <div className="form-group">
          <label className="form-label" htmlFor="s-fname">
            {lbl.financierNameLabel}
          </label>
          <input
            id="s-fname"
            data-ocid="settings.financier_name_input"
            type="text"
            className="form-input"
            value={financierName}
            onChange={(e) => setFinancierName(e.target.value)}
            placeholder={lbl.financierNameLabel}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="s-bname">
            {lbl.businessNameLabel}
          </label>
          <input
            id="s-bname"
            data-ocid="settings.business_name_input"
            type="text"
            className="form-input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder={lbl.businessNameLabel}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="settings-phone-input">
            {isTamil ? "தொலைபேசி" : "Phone Number"}
          </label>
          <input
            id="settings-phone-input"
            type="tel"
            data-ocid="settings.phone_input"
            className="form-input"
            value={settings.phone}
            readOnly
            style={{ opacity: 0.65, cursor: "not-allowed" }}
          />
        </div>
        <button
          type="button"
          data-ocid="settings.save_profile_button"
          className="btn-primary"
          onClick={handleSaveProfile}
          style={{
            marginTop: 14,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {profileSaved ? (
            <>
              <Check size={15} /> {isTamil ? "சேமிக்கப்பட்டது" : "Saved"}
            </>
          ) : (
            <>
              <Save size={15} /> {t("save")}
            </>
          )}
        </button>
      </SectionCard>

      {/* ══════════════════════════════
           PREFERENCES
      ══════════════════════════════ */}
      <SectionCard
        icon={<Palette size={16} />}
        title={lbl.preferences}
        subtitle={lbl.preferencesSub}
      >
        {/* Language */}
        <div style={{ marginBottom: "14px" }}>
          <div className="form-label" style={{ marginBottom: "8px" }}>
            {t("language")}
          </div>
          <div className="lang-seg" data-ocid="settings.language_toggle">
            <button
              type="button"
              data-ocid="settings.language_en"
              className={`lang-seg-btn ${
                settings.language === "en" ? "active" : ""
              }`}
              onClick={() => handleLanguage("en")}
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              data-ocid="settings.language_ta"
              className={`lang-seg-btn ${
                settings.language === "ta" ? "active" : ""
              }`}
              onClick={() => handleLanguage("ta")}
            >
              🇮🇳 தமிழ்
            </button>
          </div>
        </div>

        <hr className="divider" style={{ margin: "12px 0" }} />

        {/* Dark mode toggle row */}
        <div className="settings-theme-row" data-ocid="settings.theme_row">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: 1,
            }}
          >
            <span className="settings-row-icon">{isDark ? "🌙" : "☀️"}</span>
            <div>
              <div className="settings-row-label">{lbl.darkModeLabel}</div>
              <div className="settings-row-sublabel">{lbl.darkModeSub}</div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SectionCard>

      {/* ══════════════════════════════
           PIN MANAGEMENT (all roles)
      ══════════════════════════════ */}
      <SectionCard
        icon={<Key size={16} />}
        title={lbl.pinSection}
        subtitle={lbl.pinSub}
      >
        <div className="form-group">
          <label className="form-label" htmlFor="pin-current">
            {lbl.currentPinLabel}
          </label>
          <PinDigitInput
            id="pin-current"
            values={currentPinDigits}
            onChange={setCurrentPinDigits}
            disabled={pinLoading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pin-new">
            {lbl.newPinLabel}
          </label>
          <PinDigitInput
            id="pin-new"
            values={newPinDigits}
            onChange={setNewPinDigits}
            disabled={pinLoading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="pin-confirm">
            {lbl.confirmPinLabel}
          </label>
          <PinDigitInput
            id="pin-confirm"
            values={confirmPinDigits}
            onChange={setConfirmPinDigits}
            disabled={pinLoading}
          />
        </div>

        {pinError && (
          <div
            data-ocid="settings.pin_error_state"
            style={{
              marginTop: 10,
              padding: "8px 12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px",
              fontSize: "0.8rem",
              color: "var(--kf-danger)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <X size={13} style={{ flexShrink: 0 }} />
            {pinError}
          </div>
        )}

        <button
          type="button"
          data-ocid="settings.change_pin_button"
          className="btn-primary"
          onClick={handleChangePin}
          disabled={pinLoading || !pinIsValid}
          style={{
            marginTop: 14,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: !pinIsValid ? 0.55 : 1,
          }}
        >
          {pinLoading ? (
            <span
              data-ocid="settings.pin_loading_state"
              style={{ opacity: 0.75 }}
            >
              {isTamil ? "மாற்றுகிறது..." : "Changing..."}
            </span>
          ) : (
            <>
              <Key size={15} /> {lbl.changePinBtn}
            </>
          )}
        </button>
      </SectionCard>

      {/* ══════════════════════════════
           NOTIFICATION SETTINGS (all roles)
      ══════════════════════════════ */}
      <SectionCard
        icon={<Bell size={16} />}
        title={lbl.notifSection}
        subtitle={lbl.notifSub}
      >
        <ToggleRow
          label={lbl.notifLabel}
          sublabel={lbl.notifLabelSub}
          checked={notifEnabled}
          onChange={handleNotifToggle}
          ocid="settings.notifications_toggle"
          icon={<Bell size={16} />}
          loading={notifLoading}
        />
        {!notifEnabled && (
          <p
            style={{
              marginTop: 10,
              fontSize: "0.75rem",
              color: "var(--kf-text-muted)",
              lineHeight: 1.5,
              padding: "8px 10px",
              background: "var(--kf-input-bg)",
              borderRadius: 8,
            }}
          >
            {isTamil
              ? "அறிவிப்புகளை இயக்க மேலே உள்ள சுவிட்சை தட்டவும். உலாவி அனுமதி கோரப்படும்."
              : "Tap the switch above to enable notifications. Browser permission will be requested."}
          </p>
        )}
      </SectionCard>

      {/* ══════════════════════════════
           SUBSCRIPTION (admin only)
      ══════════════════════════════ */}
      {isAdmin && (
        <SectionCard
          icon={<CreditCard size={16} />}
          title={isTamil ? "சந்தா" : "Subscription"}
          subtitle={
            isPro
              ? isTamil
                ? "தற்போதைய திட்டம்"
                : "Current plan"
              : isTrialActive
                ? isTamil
                  ? `${trialDaysRemaining} நாட்கள் மீதமுள்ளன`
                  : `${trialDaysRemaining} days remaining in trial`
                : isTamil
                  ? "சோதனை முடிந்தது"
                  : "Trial ended"
          }
        >
          {isPro ? (
            <div
              style={{
                padding: "12px",
                background: "rgba(16,185,129,0.07)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "10px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: "var(--kf-success)",
                  fontSize: "0.9rem",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ✅ Pro &bull;{" "}
                {settings.planType === "monthly"
                  ? isTamil
                    ? "மாதாந்திர"
                    : "Monthly"
                  : settings.planType === "quarterly"
                    ? isTamil
                      ? "காலாண்டு"
                      : "Quarterly"
                    : isTamil
                      ? "ஆண்டு"
                      : "Yearly"}
              </div>
              {settings.planExpiry && (
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--kf-text-muted)",
                    marginTop: "4px",
                  }}
                >
                  {isTamil ? "காலாவதி:" : "Expires:"}{" "}
                  {new Date(settings.planExpiry).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}
              {settings.planExpiry &&
                Math.ceil((settings.planExpiry - Date.now()) / 86400000) <=
                  30 &&
                Math.ceil((settings.planExpiry - Date.now()) / 86400000) >
                  0 && (
                  <button
                    type="button"
                    data-ocid="settings.renew_button"
                    onClick={() => setShowUpgradeModal(true)}
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      background: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      color: "var(--kf-amber)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    {isTamil ? "புதுப்பி" : "Renew Plan"}
                  </button>
                )}
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "10px 12px",
                  background: isTrialActive
                    ? "rgba(245,158,11,0.07)"
                    : "rgba(239,68,68,0.06)",
                  border: `1px solid ${
                    isTrialActive
                      ? "rgba(245,158,11,0.2)"
                      : "rgba(239,68,68,0.18)"
                  }`,
                  borderRadius: "10px",
                  marginBottom: "14px",
                  fontSize: "0.82rem",
                  color: isTrialActive ? "var(--kf-amber)" : "var(--kf-danger)",
                  fontWeight: 600,
                }}
              >
                {isTrialActive
                  ? `🎁 ${
                      isTamil ? "இலவச சோதனை" : "Free Trial"
                    } — ${trialDaysRemaining} ${
                      isTamil ? "நாட்கள் மீதமுள்ளன" : "days remaining"
                    }`
                  : `⏰ ${
                      isTamil
                        ? "சோதனை முடிந்தது — திட்டம் தேர்வு செய்யுங்கள்"
                        : "Trial Ended — choose a plan to continue"
                    }`}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <PlanCard
                  planType="monthly"
                  title={isTamil ? "மாதாந்திர" : "Monthly"}
                  price="₹270"
                  period={isTamil ? "/ மாதம்" : "/ month"}
                  features={
                    isTamil
                      ? [
                          "வரம்பற்ற வாடிக்கையாளர்கள்",
                          "அனைத்து அம்சங்களும்",
                          "எந்நேரமும் ரத்து",
                        ]
                      : ["Unlimited clients", "All features", "Cancel anytime"]
                  }
                  onSelect={() => upgradePro("monthly")}
                  isTamil={isTamil}
                />
                <PlanCard
                  planType="quarterly"
                  title={isTamil ? "காலாண்டு" : "Quarterly"}
                  price="₹850"
                  period={isTamil ? "/ 3 மாதங்கள்" : "/ 3 months"}
                  badge={isTamil ? "நெகிழ்வான" : "Flexible"}
                  badgeColor="amber"
                  features={
                    isTamil
                      ? [
                          "வரம்பற்ற வாடிக்கையாளர்கள்",
                          "அனைத்து அம்சங்களும்",
                          "தானியங்கி புதுப்பிப்பு இல்லை",
                        ]
                      : ["Unlimited clients", "All features", "No auto-renewal"]
                  }
                  onSelect={() => upgradePro("quarterly")}
                  isTamil={isTamil}
                />
                <PlanCard
                  planType="yearly"
                  title={isTamil ? "ஆண்டு" : "Yearly"}
                  price="₹1,999"
                  period={isTamil ? "/ ஆண்டு" : "/ year"}
                  badge={isTamil ? "மிகவும் பிரபலமானது" : "Most Popular ⭐"}
                  badgeColor="gold"
                  savingsBadge={isTamil ? "₹1,241 சேமிக்கவும்" : "Save ₹1,241"}
                  monthlyEquiv={isTamil ? "₹167/மாதம்" : "₹167/mo"}
                  features={
                    isTamil
                      ? [
                          "வரம்பற்ட வாடிக்கையாளர்கள்",
                          "அனைத்து அம்சங்களும்",
                          "சிறந்த மதிப்பு",
                        ]
                      : ["Unlimited clients", "All features", "Best value"]
                  }
                  highlighted
                  onSelect={() => upgradePro("yearly")}
                  isTamil={isTamil}
                />
              </div>
            </>
          )}
        </SectionCard>
      )}

      {/* ══════════════════════════════
           BACKUP & RESTORE (admin only)
      ══════════════════════════════ */}
      {isAdmin && (
        <SectionCard
          icon={<Database size={16} />}
          title={lbl.backup}
          subtitle={lbl.backupSub}
        >
          <input
            ref={fileInputRef}
            data-ocid="settings.import_backup_input"
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleImportBackup}
          />
          <ActionRow
            label={lbl.exportLabel}
            sublabel={lbl.exportSub}
            onClick={handleExportBackup}
            ocid="settings.export_backup_button"
            icon={<Download size={16} />}
            success={exportSuccess}
          />
          <div
            style={{
              height: 1,
              background: "var(--kf-divider)",
              margin: "4px 0",
            }}
          />
          <ActionRow
            label={lbl.importLabel}
            sublabel={lbl.importSub}
            onClick={() => fileInputRef.current?.click()}
            ocid="settings.import_backup_button"
            icon={<Upload size={16} />}
            loading={importLoading}
            success={importSuccess}
          />
        </SectionCard>
      )}

      {/* ══════════════════════════════
           SECURITY (all roles — logout)
      ══════════════════════════════ */}
      <SectionCard
        icon={<Shield size={16} />}
        title={lbl.security}
        subtitle={lbl.securitySub}
      >
        <ActionRow
          label={lbl.logoutLabel}
          sublabel={lbl.logoutSub}
          onClick={() => setConfirmLogout(true)}
          ocid="settings.logout_button"
          icon={<LogOut size={16} />}
        />
      </SectionCard>

      {/* ══════════════════════════════
           DANGER ZONE (admin only)
      ══════════════════════════════ */}
      {isAdmin && (
        <SectionCard
          icon={<Trash2 size={16} />}
          title={lbl.danger}
          subtitle={lbl.dangerSub}
          danger
        >
          <ActionRow
            label={lbl.clearLabel}
            sublabel={lbl.clearSub}
            onClick={() => setConfirmClear(true)}
            ocid="settings.clear_data_button"
            icon={<Trash2 size={16} />}
            danger
          />
        </SectionCard>
      )}

      {/* ── App version ── */}
      <div className="settings-version">
        KaasFlow &nbsp;·&nbsp; v2.0.0 &nbsp;·&nbsp;
        {isTamil ? " உள்ளூர் சேமிப்பு" : " Local Storage Mode"}
      </div>

      {/* ════ MODALS ════ */}

      {/* Logout confirm */}
      {confirmLogout && (
        <div className="modal-overlay" data-ocid="logout_confirm.dialog">
          <div
            className="modal-box"
            style={{ borderRadius: "20px", margin: "20px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">{lbl.logoutLabel}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfirmLogout(false)}
                data-ocid="logout_confirm.close_button"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--kf-text-muted)", lineHeight: 1.6 }}>
                {lbl.logoutConfirmMsg}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmLogout(false)}
                data-ocid="logout_confirm.cancel_button"
                style={{ flex: 1 }}
              >
                {lbl.cancelLabel}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setConfirmLogout(false);
                  logout();
                }}
                data-ocid="logout_confirm.confirm_button"
                style={{ flex: 1 }}
              >
                {lbl.yesLogout}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear all — step 1 */}
      {confirmClear && !confirmClearStep2 && (
        <div className="modal-overlay" data-ocid="clear_confirm.dialog">
          <div
            className="modal-box"
            style={{ borderRadius: "20px", margin: "20px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: "var(--kf-danger)" }}>
                ⚠️ {lbl.areYouSure}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfirmClear(false)}
                data-ocid="clear_confirm.close_button"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--kf-text-muted)", lineHeight: 1.6 }}>
                {lbl.clearWarning}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmClear(false)}
                data-ocid="clear_confirm.cancel_button"
                style={{ flex: 1 }}
              >
                {lbl.cancelLabel}
              </button>
              <button
                type="button"
                className="btn-missed"
                onClick={() => setConfirmClearStep2(true)}
                data-ocid="clear_confirm.confirm_button"
                style={{ flex: 1 }}
              >
                {lbl.yesDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear all — step 2 */}
      {confirmClear && confirmClearStep2 && (
        <div className="modal-overlay" data-ocid="clear_final.dialog">
          <div
            className="modal-box"
            style={{
              borderRadius: "20px",
              margin: "20px",
              borderColor: "rgba(239,68,68,0.4)",
            }}
          >
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: "var(--kf-danger)" }}>
                🚨 {lbl.areYouSure}
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--kf-text-muted)", lineHeight: 1.6 }}>
                {lbl.clearFinalWarning}
              </p>
            </div>
            <div
              className="modal-footer"
              style={{ flexDirection: "column", gap: 8 }}
            >
              <button
                type="button"
                className="btn-missed"
                onClick={handleClearAll}
                data-ocid="clear_final.confirm_button"
              >
                {lbl.step2Confirm}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setConfirmClear(false);
                  setConfirmClearStep2(false);
                }}
                data-ocid="clear_final.cancel_button"
              >
                {lbl.cancelLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notifications ── */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`kf-toast ${
              toast.type === "error" ? "error" : "success"
            }`}
            data-ocid="settings.toast"
          >
            {toast.type === "success" ? (
              <Check
                size={14}
                style={{ flexShrink: 0, color: "var(--kf-success)" }}
              />
            ) : (
              <X
                size={14}
                style={{ flexShrink: 0, color: "var(--kf-danger)" }}
              />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
