type AdminStatusVariant =
  | "active"
  | "inactive"
  | "live"
  | "scheduled"
  | "ended"
  | "exhausted";

const VARIANT_CLASS: Record<AdminStatusVariant, string> = {
  active: "status-pill status-pill--success",
  live: "status-pill status-pill--success",
  inactive: "status-pill status-pill--muted",
  ended: "status-pill status-pill--muted",
  scheduled: "status-pill status-pill--info",
  exhausted: "status-pill status-pill--warning",
};

type AdminStatusBadgeProps = {
  variant: AdminStatusVariant;
  label: string;
  className?: string;
};

export default function AdminStatusBadge({ variant, label, className = "" }: AdminStatusBadgeProps) {
  return (
    <span className={`${VARIANT_CLASS[variant]} ${className}`.trim()}>
      {label}
    </span>
  );
}
