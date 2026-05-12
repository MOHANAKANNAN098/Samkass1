interface SkeletonCardProps {
  lines?: number;
  height?: string;
  className?: string;
}

export default function SkeletonCard({
  lines = 3,
  height = "80px",
  className = "",
}: SkeletonCardProps) {
  return (
    <div
      className={`card skeleton-card ${className}`}
      style={{ minHeight: height }}
      aria-hidden="true"
    >
      <div className="skeleton skeleton-title" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no identity
          key={i}
          className="skeleton skeleton-line"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card" aria-hidden="true">
      <div
        className="skeleton"
        style={{ height: "12px", width: "60%", marginBottom: "10px" }}
      />
      <div className="skeleton" style={{ height: "28px", width: "80%" }} />
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="list-row" aria-hidden="true">
      <div
        className="skeleton"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div className="skeleton" style={{ height: "14px", width: "60%" }} />
        <div className="skeleton" style={{ height: "12px", width: "40%" }} />
      </div>
      <div className="skeleton" style={{ height: "20px", width: "70px" }} />
    </div>
  );
}
