const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gold/10 text-gold border-gold/30",
  CONFIRMED: "bg-amber-500/10 text-amber-200 border-amber-500/20",
  PAID: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  SHIPPED: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  DELIVERED: "bg-teal-500/10 text-teal-300 border-teal-500/20",
  CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

type OrderStatusBadgeProps = {
  status: string;
  label: string;
};

export default function OrderStatusBadge({ status, label }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider border ${
        STATUS_STYLES[status] ?? STATUS_STYLES.PENDING
      }`}
    >
      {label}
    </span>
  );
}
