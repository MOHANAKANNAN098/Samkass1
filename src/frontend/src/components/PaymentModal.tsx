import { X } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "../lib/calculations";
import { generateReceipt, incrementReceiptNumber } from "../lib/receiptUtils";
import type { TranslationKey } from "../lib/translations";
import type { Client, Loan, Payment, Settings } from "../types";

interface PaymentModalProps {
  loan: Loan;
  client: Client;
  settings: Settings;
  onSave: (payment: Payment) => void;
  onClose: () => void;
  t: (key: TranslationKey) => string;
  language: "en" | "ta";
}

export default function PaymentModal({
  loan,
  client,
  settings,
  onSave,
  onClose,
  t,
  language,
}: PaymentModalProps) {
  const [amount, setAmount] = useState(String(Math.round(loan.emi)));
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [mode, setMode] = useState<Payment["mode"]>("cash");
  const [status, setStatus] = useState<Payment["status"]>("paid");
  const [note, setNote] = useState("");
  const [generatePdf, setGeneratePdf] = useState(false);

  const isTamil = language === "ta";

  function handleSave() {
    const payment: Payment = {
      id: `p_${Date.now()}`,
      loanId: loan.id,
      amount: status === "missed" ? 0 : Number.parseFloat(amount) || 0,
      date,
      mode,
      status,
      note: note.trim() || undefined,
    };
    onSave(payment);
    if (generatePdf && status !== "missed") {
      const receiptNo = incrementReceiptNumber();
      generateReceipt(payment, loan, client, settings, receiptNo);
    }
    onClose();
  }

  const modeLabels: Record<Payment["mode"], string> = {
    cash: t("cash"),
    upi: "UPI",
    bank: t("bank"),
    cheque: t("cheque"),
  };

  return (
    <div
      className="modal-overlay"
      data-ocid="payment_modal.dialog"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className={`modal-title ${isTamil ? "tamil-text" : ""}`}>
              {t("recordPayment")}
            </h3>
            <p className="modal-subtitle">
              {client.name} — {formatCurrency(loan.emi)} EMI
            </p>
          </div>
          <button
            type="button"
            data-ocid="payment_modal.close_button"
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Status */}
          <div className="form-group">
            <span className={`form-label ${isTamil ? "tamil-text" : ""}`}>
              {t("paymentStatus")}
            </span>
            <div className="status-toggle">
              {(["paid", "partial", "missed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  data-ocid={`payment_modal.status_${s}`}
                  className={`status-btn ${status === s ? `active-${s}` : ""}`}
                  onClick={() => setStatus(s)}
                >
                  {t(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          {status !== "missed" && (
            <div className="form-group">
              <label
                htmlFor="pm-amount"
                className={`form-label ${isTamil ? "tamil-text" : ""}`}
              >
                {t("paymentAmount")}
              </label>
              <input
                id="pm-amount"
                data-ocid="payment_modal.amount_input"
                type="number"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
              />
            </div>
          )}

          {/* Date */}
          <div className="form-group">
            <label
              htmlFor="pm-date"
              className={`form-label ${isTamil ? "tamil-text" : ""}`}
            >
              {t("paymentDate")}
            </label>
            <input
              id="pm-date"
              data-ocid="payment_modal.date_input"
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Mode */}
          {status !== "missed" && (
            <div className="form-group">
              <span className={`form-label ${isTamil ? "tamil-text" : ""}`}>
                {t("paymentMode")}
              </span>
              <div className="mode-grid">
                {(
                  Object.entries(modeLabels) as [Payment["mode"], string][]
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    data-ocid={`payment_modal.mode_${m}`}
                    className={`mode-btn ${mode === m ? "active" : ""}`}
                    onClick={() => setMode(m)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="form-group">
            <label
              htmlFor="pm-note"
              className={`form-label ${isTamil ? "tamil-text" : ""}`}
            >
              {t("note")}
            </label>
            <input
              id="pm-note"
              data-ocid="payment_modal.note_input"
              type="text"
              className="form-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
            />
          </div>

          {/* PDF toggle */}
          {status !== "missed" && (
            <div className="form-group pdf-toggle-row">
              <input
                data-ocid="payment_modal.generate_receipt_checkbox"
                type="checkbox"
                id="pdfToggle"
                checked={generatePdf}
                onChange={(e) => setGeneratePdf(e.target.checked)}
                className="checkbox-input"
              />
              <label
                htmlFor="pdfToggle"
                className={`form-label ${isTamil ? "tamil-text" : ""}`}
              >
                {t("generate")}
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            data-ocid="payment_modal.cancel_button"
            className="btn-secondary"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            data-ocid="payment_modal.save_button"
            className="btn-primary"
            onClick={handleSave}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
