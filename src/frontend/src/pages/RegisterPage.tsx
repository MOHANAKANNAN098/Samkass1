import { useRef, useState } from "react";
import type { PageProps } from "../App";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";

const OTP_KEY = "kf_otp_pending";
const OTP_TTL_MS = 5 * 60 * 1000;

interface OtpPending {
  otp: string;
  phone: string;
  expiry: number;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function saveOtpPending(phone: string): string {
  const otp = generateOtp();
  const pending: OtpPending = { otp, phone, expiry: Date.now() + OTP_TTL_MS };
  localStorage.setItem(OTP_KEY, JSON.stringify(pending));
  return otp;
}

function getOtpPending(): OtpPending | null {
  try {
    const raw = localStorage.getItem(OTP_KEY);
    return raw ? (JSON.parse(raw) as OtpPending) : null;
  } catch {
    return null;
  }
}

function clearOtpPending(): void {
  localStorage.removeItem(OTP_KEY);
}

type RegisterView = "form" | "otp";

// PIN strength: returns 0-4 based on digits filled
function PinStrengthBar({ filled }: { filled: number }) {
  const pct = (filled / 4) * 100;
  let color = "var(--kf-danger)";
  let label = "";
  if (filled === 0) {
    color = "var(--kf-input-border)";
    label = "";
  } else if (filled < 4) {
    color = "var(--kf-amber)";
    label = filled < 3 ? "Weak" : "Almost";
  } else {
    color = "var(--kf-success)";
    label = "Strong";
  }

  return (
    <div className="pin-strength-row">
      <div className="pin-strength-track">
        <div
          className="pin-strength-fill"
          style={{
            width: `${pct}%`,
            background: color,
            transition: "width 0.3s ease, background 0.3s ease",
          }}
        />
      </div>
      {label && (
        <span className="pin-strength-label" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
}

export default function RegisterPage({ app }: PageProps) {
  const { register, t, language, isAuthLoading, updateSettings } = app;
  const { isDark } = useTheme();
  const isTamil = language === "ta";

  const [phone, setPhone] = useState("");
  const [financierName, setFinancierName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPinArr, setConfirmPinArr] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [view, setView] = useState<RegisterView>("form");
  const [displayOtp, setDisplayOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const confirmPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  function handlePinInput(
    i: number,
    val: string,
    arr: string[],
    setArr: (v: string[]) => void,
    refs: React.RefObject<HTMLInputElement | null>[],
  ) {
    if (!/^\d?$/.test(val)) return;
    const next = [...arr];
    next[i] = val;
    setArr(next);
    if (val && i < 3) refs[i + 1].current?.focus();
  }

  function handlePinKeyDown(
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    arr: string[],
    refs: React.RefObject<HTMLInputElement | null>[],
  ) {
    if (e.key === "Backspace" && !arr[i] && i > 0) refs[i - 1].current?.focus();
  }

  const pinStr = pin.join("");
  const cpStr = confirmPinArr.join("");
  const isFormValid =
    financierName.trim().length > 0 &&
    phone.length === 10 &&
    pinStr.length === 4 &&
    cpStr.length === 4 &&
    pinStr === cpStr;

  function handleRegister() {
    if (!financierName.trim()) {
      setError(isTamil ? "உங்கள் பெயரை உள்ளிடவும்" : "Enter your name");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError(
        isTamil
          ? "சரியான 10-இலக்க எண் உள்ளிடவும்"
          : "Enter a valid 10-digit phone number",
      );
      return;
    }
    if (pinStr.length < 4) {
      setError(isTamil ? "4-இலக்க PIN அமைக்கவும்" : "Set a 4-digit PIN");
      return;
    }
    if (cpStr.length < 4) {
      setError(isTamil ? "PIN உறுதிப்படுத்தவும்" : "Confirm your PIN");
      return;
    }
    if (pinStr !== cpStr) {
      setError(t("pinMismatch"));
      return;
    }
    setError("");
    const otp = saveOtpPending(phone.trim());
    setDisplayOtp(otp);
    setOtpInput("");
    setOtpError("");
    setOtpMessage("");
    setView("otp");
  }

  async function handleVerifyOtp() {
    const pending = getOtpPending();
    if (!pending) {
      setOtpError(t("otpExpired"));
      return;
    }
    if (Date.now() > pending.expiry) {
      clearOtpPending();
      setOtpError(t("otpExpired"));
      return;
    }
    if (otpInput.trim() !== pending.otp) {
      setOtpError(t("otpInvalid"));
      return;
    }
    clearOtpPending();
    setIsSubmitting(true);
    try {
      await register(
        phone.trim(),
        pin.join(""),
        financierName.trim(),
        businessName.trim() || `${financierName.trim()} Finance`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResendOtp() {
    const otp = saveOtpPending(phone.trim());
    setDisplayOtp(otp);
    setOtpInput("");
    setOtpError("");
    setOtpMessage(t("otpResent"));
  }

  const logoSrc = "/assets/generated/kaasflow-logo-transparent.dim_120x120.png";

  const AuthHeader = () => (
    <div className="auth-brand-area">
      <img src={logoSrc} alt="KaasFlow" className="auth-logo-img" />
      <div className="auth-brand-name">
        Kaas<span className="auth-brand-accent">Flow</span>
      </div>
      <p className="auth-brand-tagline">
        {isTamil
          ? "நிதி மேலாண்மை எளிதாக்கப்பட்டது"
          : "Finance management, simplified"}
      </p>
    </div>
  );

  // ── OTP verification screen ──
  if (view === "otp") {
    const noticeText = t("otpSentNotice").replace("{phone}", phone);
    return (
      <div className="auth-page">
        <div className="auth-theme-toggle-floating">
          <ThemeToggle />
        </div>
        <div className="auth-card auth-card-animate">
          <AuthHeader />
          <h2 className={`auth-title ${isTamil ? "tamil-text" : ""}`}>
            {t("otpVerification")}
          </h2>
          <p className={`auth-subtitle ${isTamil ? "tamil-text" : ""}`}>
            {t("otpVerificationSubtitle")}
          </p>

          {/* OTP display box */}
          <div data-ocid="register.otp_display" className="otp-display-box">
            <p className={`otp-notice-text ${isTamil ? "tamil-text" : ""}`}>
              {noticeText}
            </p>
            <div className="otp-code-display">{displayOtp}</div>
            <p className={`otp-expiry-text ${isTamil ? "tamil-text" : ""}`}>
              ⏱ {t("otpExpiry")}
            </p>
          </div>

          <div className="form-group">
            <label
              htmlFor="otp-input"
              className={`form-label ${isTamil ? "tamil-text" : ""}`}
            >
              {t("otpLabel")}
            </label>
            <input
              id="otp-input"
              data-ocid="register.otp_input"
              type="text"
              inputMode="numeric"
              className="form-input otp-entry-input"
              value={otpInput}
              onChange={(e) => {
                setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                setOtpError("");
              }}
              placeholder={t("otpPlaceholder")}
              maxLength={6}
            />
          </div>

          {otpError && (
            <div
              data-ocid="register.otp_error_state"
              className="auth-error-banner"
            >
              <span>⚠️</span>
              <span className={isTamil ? "tamil-text" : ""}>{otpError}</span>
            </div>
          )}
          {otpMessage && (
            <p
              data-ocid="register.otp_success_state"
              className="auth-success-msg"
            >
              {otpMessage}
            </p>
          )}

          <button
            type="button"
            className="btn-primary btn-primary--glow"
            onClick={handleVerifyOtp}
            disabled={isSubmitting || isAuthLoading || otpInput.length < 6}
            data-ocid="register.verify_otp_button"
          >
            {isSubmitting || isAuthLoading ? <LoadingDots /> : t("verifyOtp")}
          </button>

          <div className="auth-otp-actions">
            <button
              type="button"
              onClick={handleResendOtp}
              data-ocid="register.resend_otp_button"
              className={`auth-link-btn ${isTamil ? "tamil-text" : ""}`}
            >
              🔄 {t("resendOtp")}
            </button>
            <button
              type="button"
              onClick={() => setView("form")}
              data-ocid="register.back_button"
              className="auth-link-btn auth-link-btn--muted"
            >
              ← {t("back")}
            </button>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // ── Registration form ──
  return (
    <div className="auth-page" data-ocid="register.page">
      <div className="auth-theme-toggle-floating">
        <ThemeToggle />
      </div>

      {/* Language toggle */}
      <div className="auth-lang-toggle" data-ocid="register.language_toggle">
        <button
          type="button"
          data-ocid="register.lang_en"
          className={`lang-btn ${language === "en" ? "active" : ""}`}
          onClick={() => updateSettings({ language: "en" })}
        >
          EN
        </button>
        <button
          type="button"
          data-ocid="register.lang_ta"
          className={`lang-btn ${language === "ta" ? "active" : ""}`}
          onClick={() => updateSettings({ language: "ta" })}
        >
          தமிழ்
        </button>
      </div>

      <div className="auth-card auth-card-animate">
        <AuthHeader />
        <h2 className={`auth-title ${isTamil ? "tamil-text" : ""}`}>
          {isTamil ? "கணக்கை உருவாக்கு" : t("registerTitle")}
        </h2>
        <p className={`auth-subtitle ${isTamil ? "tamil-text" : ""}`}>
          {isTamil ? "தொடங்க உங்கள் தகவல்களை உள்ளிடவும்" : t("registerSubtitle")}
        </p>

        <form
          className="auth-form-section"
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          <div className="form-group">
            <label
              htmlFor="reg-fname"
              className={`form-label ${isTamil ? "tamil-text" : ""}`}
            >
              {t("financierName")}{" "}
              <span style={{ color: "var(--kf-amber)" }}>*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input
                id="reg-fname"
                data-ocid="register.financier_name_input"
                type="text"
                className="form-input form-input--with-icon"
                value={financierName}
                onChange={(e) => {
                  setFinancierName(e.target.value);
                  setError("");
                }}
                placeholder={isTamil ? "உங்கள் பெயர்" : "Your full name"}
              />
            </div>
          </div>

          <div className="form-group">
            <label
              htmlFor="reg-bname"
              className={`form-label ${isTamil ? "tamil-text" : ""}`}
            >
              {t("businessName")}
              <span className="optional-badge">
                {isTamil ? " (விருப்பம்)" : " (optional)"}
              </span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon">🏢</span>
              <input
                id="reg-bname"
                data-ocid="register.business_name_input"
                type="text"
                className="form-input form-input--with-icon"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={
                  isTamil ? "வணிக பெயர் (விருப்பம்)" : "Business name (optional)"
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label
              htmlFor="reg-phone"
              className={`form-label ${isTamil ? "tamil-text" : ""}`}
            >
              {t("phoneNumber")}{" "}
              <span style={{ color: "var(--kf-amber)" }}>*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon">📱</span>
              <input
                id="reg-phone"
                data-ocid="register.phone_input"
                type="tel"
                className="form-input form-input--with-icon"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder={
                  isTamil ? "10-இலக்க கைபேசி எண்" : "10-digit mobile number"
                }
                maxLength={10}
              />
            </div>
            {phone.length > 0 && (
              <div className="field-hint">
                <div
                  className="field-hint-bar"
                  style={{
                    width: `${(phone.length / 10) * 100}%`,
                    background:
                      phone.length === 10
                        ? "var(--kf-success)"
                        : "var(--kf-amber)",
                  }}
                />
                <span
                  className="field-hint-text"
                  style={{
                    color:
                      phone.length === 10
                        ? "var(--kf-success)"
                        : "var(--kf-text-muted)",
                  }}
                >
                  {phone.length}/10
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <div className="pin-label-row">
              <span className={`form-label ${isTamil ? "tamil-text" : ""}`}>
                {t("setupPin")}{" "}
                <span style={{ color: "var(--kf-amber)" }}>*</span>
              </span>
              <button
                type="button"
                className="pin-reveal-btn"
                onClick={() => setShowPin((v) => !v)}
                data-ocid="register.pin_reveal_toggle"
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="pin-inputs">
              {([0, 1, 2, 3] as const).map((i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  data-ocid={`register.pin_input.${i + 1}`}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  className={`pin-input ${pin[i] ? "pin-input--filled" : ""}`}
                  value={pin[i]}
                  onChange={(e) => {
                    handlePinInput(i, e.target.value, pin, setPin, pinRefs);
                    setError("");
                  }}
                  onKeyDown={(e) => handlePinKeyDown(i, e, pin, pinRefs)}
                />
              ))}
            </div>
            <PinStrengthBar filled={pinStr.length} />
          </div>

          <div className="form-group">
            <div className="pin-label-row">
              <span className={`form-label ${isTamil ? "tamil-text" : ""}`}>
                {t("confirmPin")}{" "}
                <span style={{ color: "var(--kf-amber)" }}>*</span>
              </span>
              <button
                type="button"
                className="pin-reveal-btn"
                onClick={() => setShowConfirmPin((v) => !v)}
                data-ocid="register.confirm_pin_reveal_toggle"
                aria-label={showConfirmPin ? "Hide PIN" : "Show PIN"}
              >
                {showConfirmPin ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="pin-inputs">
              {([0, 1, 2, 3] as const).map((i) => (
                <input
                  key={i}
                  ref={confirmPinRefs[i]}
                  data-ocid={`register.confirm_pin_input.${i + 1}`}
                  type={showConfirmPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  className={`pin-input ${confirmPinArr[i] ? "pin-input--filled" : ""} ${cpStr.length === 4 && pinStr !== cpStr ? "pin-input--mismatch" : ""} ${cpStr.length === 4 && pinStr === cpStr ? "pin-input--match" : ""}`}
                  value={confirmPinArr[i]}
                  onChange={(e) => {
                    handlePinInput(
                      i,
                      e.target.value,
                      confirmPinArr,
                      setConfirmPinArr,
                      confirmPinRefs,
                    );
                    setError("");
                  }}
                  onKeyDown={(e) =>
                    handlePinKeyDown(i, e, confirmPinArr, confirmPinRefs)
                  }
                />
              ))}
            </div>
            {cpStr.length === 4 && (
              <p
                className="pin-match-hint"
                style={{
                  color:
                    pinStr === cpStr ? "var(--kf-success)" : "var(--kf-danger)",
                  fontSize: "0.75rem",
                  marginTop: "4px",
                  textAlign: "center",
                }}
              >
                {pinStr === cpStr
                  ? isTamil
                    ? "✓ PIN பொருந்துகிறது"
                    : "✓ PINs match"
                  : isTamil
                    ? "✗ PIN பொருந்தவில்லை"
                    : "✗ PINs do not match"}
              </p>
            )}
          </div>

          {/* Validation summary */}
          {!isFormValid && (
            <div className="register-field-checklist">
              {[
                {
                  done: financierName.trim().length > 0,
                  label: isTamil ? "பெயர்" : "Your name",
                },
                {
                  done: phone.length === 10,
                  label: isTamil ? "10-இலக்க எண்" : "10-digit phone",
                },
                {
                  done: pinStr.length === 4,
                  label: isTamil ? "4-இலக்க PIN" : "4-digit PIN",
                },
                {
                  done: cpStr.length === 4 && pinStr === cpStr,
                  label: isTamil ? "PIN உறுதிப்பாடு" : "PIN confirmed",
                },
              ].map((item) => (
                <span
                  key={item.label}
                  className={`checklist-item ${item.done ? "done" : ""}`}
                >
                  {item.done ? "✓" : "○"} {item.label}
                </span>
              ))}
            </div>
          )}

          {error && (
            <div data-ocid="register.error_state" className="auth-error-banner">
              <span>⚠️</span>
              <span className={isTamil ? "tamil-text" : ""}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary btn-primary--glow"
            disabled={!isFormValid || isSubmitting}
            data-ocid="register.submit_button"
          >
            {isTamil ? "பதிவு செய் " : `${t("register")} `}
            <span className="btn-arrow">→</span>
          </button>
        </form>

        <div className={`auth-theme-indicator ${isDark ? "dark" : "light"}`}>
          <span>{isDark ? "🌙" : "☀️"}</span>
          <span className={isTamil ? "tamil-text" : ""}>
            {isDark ? t("darkMode") : t("lightMode")}
          </span>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="loading-dots">
      <span />
      <span />
      <span />
    </span>
  );
}

function AuthFooter() {
  return (
    <p className="auth-footer-text">
      © {new Date().getFullYear()}. Built with love using{" "}
      <a
        href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
        target="_blank"
        rel="noreferrer"
        className="auth-footer-link"
      >
        caffeine.ai
      </a>
    </p>
  );
}
