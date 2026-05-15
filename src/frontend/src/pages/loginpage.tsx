import { useRef, useState } from "react";
import type { PageProps } from "../App";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";

type LoginView = "login" | "forgotPhone" | "resetPin";

export default function LoginPage({ app }: PageProps) {
  const {
    login,
    resetPin: resetPinFn,
    checkPhoneExists,
    t,
    language,
    isAuthLoading,
    updateSettings,
  } = app;
  const { isDark } = useTheme();
  const isTamil = language === "ta";

  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [view, setView] = useState<LoginView>("login");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const newPinRefs = [
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

  const isLoginReady = phone.length === 10 && pin.join("").length === 4;

  async function handleLogin() {
    const pinStr = pin.join("");
    if (!phone.trim() || phone.length < 10) {
      setError(
        isTamil
          ? "சரியான 10-இலக்க எண் உள்ளிடவும்"
          : "Enter a valid 10-digit phone number",
      );
      return;
    }
    if (pinStr.length < 4) {
      setError(isTamil ? "4-இலக்க PIN உள்ளிடவும்" : "Enter your 4-digit PIN");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const ok = await login(phone.trim(), pinStr);
      if (!ok)
        setError(
          isTamil
            ? "தவறான தொலைபேசி எண் அல்லது PIN"
            : "Invalid phone number or PIN. Please try again.",
        );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyPhone() {
    if (!forgotPhone.trim() || forgotPhone.length < 10) {
      setForgotError(
        isTamil
          ? "சரியான 10-இலக்க எண் உள்ளிடவும்"
          : "Enter a valid 10-digit phone number",
      );
      return;
    }
    const exists = await checkPhoneExists(forgotPhone.trim());
    if (!exists) {
      setForgotError(t("phoneNotFound"));
      return;
    }
    setForgotError("");
    setView("resetPin");
  }

  async function handleResetPin() {
    const np = newPin.join("");
    const cp = confirmPin.join("");
    if (np.length < 4) {
      setResetError(
        isTamil ? "4-இலக்க புதிய PIN உள்ளிடவும்" : "Enter a 4-digit new PIN",
      );
      return;
    }
    if (np !== cp) {
      setResetError(t("pinMismatch"));
      return;
    }
    setIsResetting(true);
    setResetError("");
    try {
      const ok = await resetPinFn(forgotPhone.trim(), np);
      if (ok) setResetSuccess(true);
      else
        setResetError(
          isTamil
            ? "PIN மீட்டமைப்பு தோல்வியடைந்தது"
            : "Failed to reset PIN. Try again.",
        );
    } finally {
      setIsResetting(false);
    }
  }

  function goBackToLogin() {
    setView("login");
    setForgotPhone("");
    setForgotError("");
    setNewPin(["", "", "", ""]);
    setConfirmPin(["", "", "", ""]);
    setResetError("");
    setResetSuccess(false);
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

  // ── Success screen ──
  if (view !== "login" && resetSuccess) {
    return (
      <div className="auth-page" data-ocid="forgot_pin.success_state">
        <div className="auth-theme-toggle-floating">
          <ThemeToggle />
        </div>
        <div className="auth-card auth-card-animate">
          <AuthHeader />
          <div className="auth-success-block">
            <div className="auth-success-icon">✅</div>
            <h2
              className={`auth-title ${isTamil ? "tamil-text" : ""}`}
              style={{ color: "var(--kf-success)" }}
            >
              {t("pinResetSuccess")}
            </h2>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={goBackToLogin}
            data-ocid="forgot_pin.back_to_login_button"
          >
            {t("backToLogin")}
          </button>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // ── Reset PIN screen ──
  if (view === "resetPin") {
    return (
      <div className="auth-page">
        <div className="auth-theme-toggle-floating">
          <ThemeToggle />
        </div>
        <div className="auth-card auth-card-animate">
          <AuthHeader />
          <h2 className={`auth-title ${isTamil ? "tamil-text" : ""}`}>
            {t("forgotPinTitle")}
          </h2>
          <p className={`auth-subtitle ${isTamil ? "tamil-text" : ""}`}>
            {isTamil
              ? `${forgotPhone}-க்கு புதிய PIN அமைக்கவும்`
              : `Set a new PIN for ${forgotPhone}`}
          </p>

          <div className="form-group">
            <div className="pin-label-row">
              <span className={`form-label ${isTamil ? "tamil-text" : ""}`}>
                {t("newPin")}
              </span>
              <button
                type="button"
                className="pin-reveal-btn"
                onClick={() => setShowNewPin((v) => !v)}
                aria-label={showNewPin ? "Hide PIN" : "Show PIN"}
              >
                {showNewPin ? "🙈" : "👁"}
              </button>
            </div>
            <div className="pin-inputs">
              {([0, 1, 2, 3] as const).map((i) => (
                <input
                  key={i}
                  ref={newPinRefs[i]}
                  data-ocid={`forgot_pin.new_pin_input.${i + 1}`}
                  type={showNewPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  className={`pin-input ${newPin[i] ? "pin-input--filled" : ""}`}
                  value={newPin[i]}
                  onChange={(e) =>
                    handlePinInput(
                      i,
                      e.target.value,
                      newPin,
                      setNewPin,
                      newPinRefs,
                    )
                  }
                  onKeyDown={(e) => handlePinKeyDown(i, e, newPin, newPinRefs)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="pin-label-row">
              <span className={`form-label ${isTamil ? "tamil-text" : ""}`}>
                {t("confirmPin")}
              </span>
              <button
                type="button"
                className="pin-reveal-btn"
                onClick={() => setShowConfirmPin((v) => !v)}
                aria-label={showConfirmPin ? "Hide PIN" : "Show PIN"}
              >
                {showConfirmPin ? "🙈" : "👁"}
              </button>
            </div>
            <div className="pin-inputs">
              {([0, 1, 2, 3] as const).map((i) => (
                <input
                  key={i}
                  ref={confirmPinRefs[i]}
                  data-ocid={`forgot_pin.confirm_pin_input.${i + 1}`}
                  type={showConfirmPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  className={`pin-input ${confirmPin[i] ? "pin-input--filled" : ""}`}
                  value={confirmPin[i]}
                  onChange={(e) =>
                    handlePinInput(
                      i,
                      e.target.value,
                      confirmPin,
                      setConfirmPin,
                      confirmPinRefs,
                    )
                  }
                  onKeyDown={(e) =>
                    handlePinKeyDown(i, e, confirmPin, confirmPinRefs)
                  }
                />
              ))}
            </div>
          </div>

          {resetError && (
            <div
              data-ocid="forgot_pin.reset_error_state"
              className="auth-error-banner"
            >
              <span>⚠️</span>
              <span className={isTamil ? "tamil-text" : ""}>{resetError}</span>
            </div>
          )}

          <button
            type="button"
            className="btn-primary btn-primary--glow"
            onClick={handleResetPin}
            disabled={
              isResetting ||
              newPin.join("").length < 4 ||
              confirmPin.join("").length < 4
            }
            data-ocid="forgot_pin.reset_pin_button"
          >
            {isResetting ? <LoadingDots /> : t("resetPin")}
          </button>

          <button
            type="button"
            onClick={goBackToLogin}
            data-ocid="forgot_pin.cancel_button"
            className="auth-link-btn"
          >
            ← {t("backToLogin")}
          </button>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // ── Forgot phone screen ──
  if (view === "forgotPhone") {
    return (
      <div className="auth-page">
        <div className="auth-theme-toggle-floating">
          <ThemeToggle />
        </div>
        <div className="auth-card auth-card-animate">
          <AuthHeader />
          <h2 className={`auth-title ${isTamil ? "tamil-text" : ""}`}>
            {t("forgotPinTitle")}
          </h2>
          <p className={`auth-subtitle ${isTamil ? "tamil-text" : ""}`}>
            {t("forgotPinSubtitle")}
          </p>

          <div className="form-group">
            <label
              htmlFor="forgot-phone"
              className={`form-label ${isTamil ? "tamil-text" : ""}`}
            >
              {t("phoneNumber")}
            </label>
            <div className="input-with-icon">
              <span className="input-icon">📱</span>
              <input
                id="forgot-phone"
                data-ocid="forgot_pin.phone_input"
                type="tel"
                className="form-input form-input--with-icon"
                value={forgotPhone}
                onChange={(e) =>
                  setForgotPhone(e.target.value.replace(/\D/g, ""))
                }
                placeholder={t("enterRegisteredPhone")}
                maxLength={10}
              />
            </div>
          </div>

          {forgotError && (
            <div
              data-ocid="forgot_pin.phone_error_state"
              className="auth-error-banner"
            >
              <span>⚠️</span>
              <span className={isTamil ? "tamil-text" : ""}>{forgotError}</span>
            </div>
          )}

          <button
            type="button"
            className="btn-primary btn-primary--glow"
            onClick={handleVerifyPhone}
            disabled={forgotPhone.length < 10}
            data-ocid="forgot_pin.verify_phone_button"
          >
            {t("verifyPhone")}
          </button>

          <button
            type="button"
            onClick={goBackToLogin}
            data-ocid="forgot_pin.back_button"
            className="auth-link-btn"
          >
            ← {t("backToLogin")}
          </button>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // ── Main login screen ──
  return (
    <div className="auth-page" data-ocid="login.page">
      <div className="auth-theme-toggle-floating">
        <ThemeToggle />
      </div>

      {/* Language toggle */}
      <div className="auth-lang-toggle" data-ocid="login.language_toggle">
        <button
          type="button"
          data-ocid="login.lang_en"
          className={`lang-btn ${language === "en" ? "active" : ""}`}
          onClick={() => updateSettings({ language: "en" })}
        >
          EN
        </button>
        <button
          type="button"
          data-ocid="login.lang_ta"
          className={`lang-btn ${language === "ta" ? "active" : ""}`}
          onClick={() => updateSettings({ language: "ta" })}
        >
          தமிழ்
        </button>
      </div>

      <div className="auth-card auth-card-animate">
        <AuthHeader />

        <h2 className={`auth-title ${isTamil ? "tamil-text" : ""}`}>
          {isTamil ? "வணக்கம்!" : "Welcome Back"}
        </h2>
        <p className={`auth-subtitle ${isTamil ? "tamil-text" : ""}`}>
          {isTamil ? "தொடர உங்கள் PIN உள்ளிடவும்" : "Enter your PIN to continue"}
        </p>

        <form
          className="auth-form-section"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div className="form-group">
            <label
              htmlFor="login-phone"
              className={`form-label ${isTamil ? "tamil-text" : ""}`}
            >
              {t("phoneNumber")}
            </label>
            <div className="input-with-icon">
              <span className="input-icon">📱</span>
              <input
                id="login-phone"
                data-ocid="login.phone_input"
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
                onKeyDown={(e) =>
                  e.key === "Enter" && pinRefs[0].current?.focus()
                }
              />
            </div>
            {/* Phone progress indicator */}
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
                {t("pin")}
              </span>
              <button
                type="button"
                className="pin-reveal-btn"
                onClick={() => setShowPin((v) => !v)}
                data-ocid="login.pin_reveal_toggle"
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? (
                  <span title="Hide">
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
                  </span>
                ) : (
                  <span title="Show">
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
                  </span>
                )}
              </button>
            </div>
            <div className="pin-inputs">
              {([0, 1, 2, 3] as const).map((i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  data-ocid={`login.pin_input.${i + 1}`}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  className={`pin-input ${pin[i] ? "pin-input--filled" : ""}`}
                  value={pin[i]}
                  onChange={(e) => {
                    handlePinInput(i, e.target.value, pin, setPin, pinRefs);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    handlePinKeyDown(i, e, pin, pinRefs);
                    if (e.key === "Enter" && i === 3) handleLogin();
                  }}
                />
              ))}
            </div>
            {/* PIN dot indicator */}
            <div className="pin-progress">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`pin-dot ${pin[i] ? "filled" : ""}`} />
              ))}
            </div>
          </div>

          {error && (
            <div data-ocid="login.error_state" className="auth-error-banner">
              <span>⚠️</span>
              <span className={isTamil ? "tamil-text" : ""}>{error}</span>
            </div>
          )}

          <button
            type="button"
            className="btn-primary btn-primary--glow"
            onClick={handleLogin}
            disabled={isSubmitting || isAuthLoading || !isLoginReady}
            data-ocid="login.submit_button"
          >
            {isSubmitting || isAuthLoading ? (
              <LoadingDots />
            ) : (
              <>
                {isTamil ? "உள்நுழை" : t("login")}{" "}
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setView("forgotPhone");
            }}
            data-ocid="login.forgot_pin_button"
            className={`auth-link-btn ${isTamil ? "tamil-text" : ""}`}
          >
            {t("forgotPin")}
          </button>
        </form>

        <div className="auth-register-hint">
          <span
            className={`auth-register-hint-text ${isTamil ? "tamil-text" : ""}`}
          >
            {isTamil ? "புதிய பயனரா?" : "New user?"}
          </span>
          <span
            className={`auth-register-hint-sub ${isTamil ? "tamil-text" : ""}`}
          >
            {isTamil
              ? "வேறு சாதனத்தில் பதிவு செய்தால் இங்கே உள்நுழையலாம்"
              : "Registered on another device? Login with your credentials"}
          </span>
        </div>

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
