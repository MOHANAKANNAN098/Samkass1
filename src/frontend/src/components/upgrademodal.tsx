import { Check, Star, X } from "lucide-react";
import type { PlanType } from "../types";

interface PlanCardProps {
  planType: PlanType;
  title: string;
  price: string;
  period: string;
  badge?: string;
  badgeColor?: "amber" | "gold" | "green";
  features: string[];
  note?: string;
  savingsBadge?: string;
  monthlyEquiv?: string;
  highlighted?: boolean;
  onSelect: () => void;
  isTamil?: boolean;
}

function PlanCard({
  planType,
  title,
  price,
  period,
  badge,
  badgeColor = "amber",
  features,
  note,
  savingsBadge,
  monthlyEquiv,
  highlighted,
  onSelect,
  isTamil,
}: PlanCardProps) {
  const badgeColors = {
    amber: {
      bg: "rgba(245,158,11,0.15)",
      color: "var(--kf-amber)",
      border: "rgba(245,158,11,0.3)",
    },
    gold: {
      bg: "rgba(251,191,36,0.18)",
      color: "#f59e0b",
      border: "rgba(251,191,36,0.4)",
    },
    green: {
      bg: "rgba(16,185,129,0.12)",
      color: "var(--kf-success)",
      border: "rgba(16,185,129,0.3)",
    },
  };
  const bc = badgeColors[badgeColor];

  return (
    <div
      data-ocid={`upgrade.plan_card.${planType}`}
      style={{
        background: highlighted
          ? "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.06) 100%)"
          : "var(--kf-card)",
        border: highlighted
          ? "2px solid var(--kf-amber)"
          : "1px solid var(--kf-card-border)",
        borderRadius: "16px",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
        boxShadow: highlighted ? "0 0 24px rgba(245,158,11,0.18)" : "none",
        transition: "all 0.2s",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Best Value label */}
      {highlighted && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(90deg, #f59e0b, #d97706)",
            color: "#0a0e1a",
            fontSize: "0.7rem",
            fontWeight: 800,
            padding: "3px 12px",
            borderRadius: "20px",
            whiteSpace: "nowrap",
            letterSpacing: "0.04em",
          }}
        >
          ⭐ {isTamil ? "சிறந்த மதிப்பு" : "BEST VALUE"}
        </div>
      )}

      {/* Title + badge row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: highlighted ? "4px" : 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: "1rem",
            color: "var(--kf-text)",
          }}
        >
          {title}
        </span>
        {badge && (
          <span
            style={{
              background: bc.bg,
              color: bc.color,
              border: `1px solid ${bc.border}`,
              borderRadius: "20px",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 8px",
              letterSpacing: "0.03em",
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Price */}
      <div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: "1.6rem",
            color: highlighted ? "var(--kf-amber)" : "var(--kf-text)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {price}
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--kf-text-muted)",
            marginTop: "4px",
          }}
        >
          {period}
        </div>
        {monthlyEquiv && (
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--kf-text-muted)",
              marginTop: "2px",
            }}
          >
            {monthlyEquiv}
          </div>
        )}
        {savingsBadge && (
          <span
            style={{
              display: "inline-block",
              marginTop: "6px",
              background: "rgba(16,185,129,0.12)",
              color: "var(--kf-success)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: "20px",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "2px 10px",
            }}
          >
            {savingsBadge}
          </span>
        )}
      </div>

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {features.map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.8rem",
              color: "var(--kf-text-muted)",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "rgba(16,185,129,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Check size={10} style={{ color: "var(--kf-success)" }} />
            </div>
            {f}
          </div>
        ))}
      </div>

      {note && (
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--kf-text-muted)",
            fontStyle: "italic",
          }}
        >
          {note}
        </div>
      )}

      {/* CTA Button */}
      <button
        type="button"
        data-ocid={`upgrade.choose_${planType}_button`}
        onClick={onSelect}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "12px",
          border: highlighted ? "none" : "1px solid var(--kf-amber)",
          background: highlighted
            ? "linear-gradient(135deg, var(--kf-amber), var(--kf-amber-dark))"
            : "transparent",
          color: highlighted ? "#0a0e1a" : "var(--kf-amber)",
          fontWeight: 800,
          fontSize: "0.875rem",
          cursor: "pointer",
          fontFamily: "'Space Grotesk', sans-serif",
          transition: "all 0.2s",
          marginTop: "auto",
        }}
        onMouseEnter={(e) => {
          if (!highlighted) {
            (e.target as HTMLButtonElement).style.background =
              "rgba(245,158,11,0.08)";
          }
        }}
        onMouseLeave={(e) => {
          if (!highlighted) {
            (e.target as HTMLButtonElement).style.background = "transparent";
          }
        }}
      >
        {isTamil
          ? planType === "monthly"
            ? "மாதாந்திர தேர்வு"
            : planType === "quarterly"
              ? "காலாண்டு தேர்வு"
              : "ஆண்டு தேர்வு"
          : planType === "monthly"
            ? "Choose Monthly"
            : planType === "quarterly"
              ? "Choose Quarterly"
              : "Choose Yearly"}
      </button>
    </div>
  );
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planType: PlanType) => void;
  language?: "en" | "ta";
}

export default function UpgradeModal({
  isOpen,
  onClose,
  onSelectPlan,
  language = "en",
}: UpgradeModalProps) {
  const isTamil = language === "ta";

  if (!isOpen) return null;

  const plans: Omit<PlanCardProps, "onSelect">[] = [
    {
      planType: "monthly",
      title: isTamil ? "மாதாந்திர" : "Monthly",
      price: "₹270",
      period: isTamil ? "/ மாதம்" : "/ month",
      features: isTamil
        ? ["வரம்பற்ற வாடிக்கையாளர்கள்", "அனைத்து அம்சங்களும்", "எந்நேரமும் ரத்து"]
        : ["Unlimited clients", "All features unlocked", "Cancel anytime"],
    },
    {
      planType: "quarterly",
      title: isTamil ? "காலாண்டு" : "Quarterly",
      price: "₹850",
      period: isTamil ? "/ 3 மாதங்கள்" : "/ 3 months",
      badge: isTamil ? "நெகிழ்வான" : "Flexible",
      badgeColor: "amber",
      features: isTamil
        ? ["வரம்பற்ற வாடிக்கையாளர்கள்", "அனைத்து அம்சங்களும்", "தானியங்கி புதுப்பிப்பு இல்லை"]
        : [
            "Unlimited clients",
            "All features unlocked",
            "No auto-renewal pressure",
          ],
      note: isTamil ? "நெகிழ்வான 3-மாத திட்டம்" : "Flexible 3-month plan",
    },
    {
      planType: "yearly",
      title: isTamil ? "ஆண்டு" : "Yearly",
      price: "₹1,999",
      period: isTamil ? "/ ஆண்டு" : "/ year",
      badge: isTamil ? "மிகவும் பிரபலமானது" : "Most Popular ⭐",
      badgeColor: "gold",
      savingsBadge: isTamil ? "₹1,241 சேமிக்கவும்" : "Save ₹1,241",
      monthlyEquiv: isTamil ? "₹167/மாதம்" : "₹167/mo",
      features: isTamil
        ? ["வரம்பற்ற வாடிக்கையாளர்கள்", "அனைத்து அம்சங்களும்", "மாதத்திற்கு சிறந்த மதிப்பு"]
        : [
            "Unlimited clients",
            "All features unlocked",
            "Best value per month",
          ],
      highlighted: true,
    },
  ];

  return (
    <div
      data-ocid="upgrade.dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease",
      }}
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        style={{
          background: "var(--kf-bg)",
          borderRadius: "24px 24px 0 0",
          width: "100%",
          maxWidth: "430px",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "24px 16px 32px",
          animation: "slideUp 0.3s ease",
          border: "1px solid var(--kf-card-border)",
          borderBottom: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <Star size={20} style={{ color: "var(--kf-amber)" }} />
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  color: "var(--kf-text)",
                  margin: 0,
                }}
              >
                {isTamil ? "திட்டம் தேர்வு" : "Choose Your Plan"}
              </h2>
            </div>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--kf-text-muted)",
                margin: 0,
              }}
            >
              {isTamil
                ? "வரம்பற்ற வாடிக்கையாளர்களுக்கு மேம்படுத்துங்கள்"
                : "Upgrade to unlock unlimited clients"}
            </p>
          </div>
          <button
            type="button"
            data-ocid="upgrade.close_button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--kf-input-bg)",
              border: "1px solid var(--kf-input-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--kf-text-muted)",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Plan cards — stacked on mobile */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.planType}
              {...plan}
              isTamil={isTamil}
              onSelect={() => onSelectPlan(plan.planType)}
            />
          ))}
        </div>

        {/* Free plan note */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--kf-text-muted)",
            marginTop: "16px",
          }}
        >
          {isTamil
            ? "இலவச திட்டம்: 20 வாடிக்கையாளர்கள் • கிரெடிட் கார்டு தேவையில்லை"
            : "Free plan: 20 clients • No credit card required"}
        </p>
      </div>
    </div>
  );
}

// Export PlanCard for reuse in SettingsPage
export { PlanCard };
export type { PlanCardProps };
