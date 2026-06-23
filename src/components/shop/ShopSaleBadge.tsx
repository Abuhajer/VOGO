import { getCompactSaleBadge } from "@/lib/sale-badge";

type Props = {
  badge?: string | null;
  price: number;
  salePrice?: number;
  locale: string;
  className?: string;
};

export default function ShopSaleBadge({
  badge,
  price,
  salePrice,
  locale,
  className = "",
}: Props) {
  const compact = getCompactSaleBadge({ badge, price, salePrice, locale });
  if (!compact) return null;

  const isArabic = locale === "ar";

  return (
    <span
      className={`shop-sale-badge pointer-events-none absolute top-2.5 start-2.5 z-20 flex h-11 w-11 flex-col items-center justify-center rounded-full border border-[#0E0D12]/15 bg-gold text-center text-[#0E0D12] shadow-[0_6px_18px_rgba(0,0,0,0.32)] sm:top-3 sm:start-3 sm:h-12 sm:w-12 ${className}`}
      dir={isArabic ? "rtl" : "ltr"}
      aria-hidden
    >
      <span className="block whitespace-nowrap text-[10px] font-bold leading-none tracking-tight sm:text-[11px]">
        {compact.primary}
      </span>
      {compact.secondary ? (
        <span
          className={`mt-0.5 block whitespace-nowrap text-[7px] font-semibold leading-none sm:text-[8px] ${
            isArabic ? "" : "uppercase tracking-[0.08em]"
          }`}
        >
          {compact.secondary}
        </span>
      ) : null}
    </span>
  );
}
