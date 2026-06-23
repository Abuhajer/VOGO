const STATUS_VARIANT: Record<string, string> = {
  PENDING: "status-pill status-pill--warning",
  CONFIRMED: "status-pill status-pill--info",
  PAID: "status-pill status-pill--success",
  SHIPPED: "status-pill status-pill--info",
  DELIVERED: "status-pill status-pill--success",
  CANCELLED: "status-pill status-pill--muted",
};

type OrderStatusBadgeProps = {
  status: string;
  label: string;
};

export default function OrderStatusBadge({ status, label }: OrderStatusBadgeProps) {
  return (
    <span className={STATUS_VARIANT[status] ?? STATUS_VARIANT.PENDING}>
      {label}
    </span>
  );
}
