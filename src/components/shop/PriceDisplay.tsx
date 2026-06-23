import { formatNumber } from "@/lib/format";

type Props = {
  price: number;
  salePrice?: number;
  locale: string;
  size?: "sm" | "md" | "lg";
  /** Fixed light text for overlays on dark product imagery */
  surface?: "default" | "on-image";
  className?: string;
};

export default function PriceDisplay({
  price,
  salePrice,
  locale,
  size = "md",
  surface = "default",
  className = "",
}: Props) {
  const currency = locale === "ar" ? "د.أ" : "JOD";
  const onSale = salePrice != null && salePrice < price;
  const finalPrice = onSale ? salePrice : price;
  const onImage = surface === "on-image";

  const priceClass = onImage
    ? size === "lg"
      ? "carousel-card-price--sale font-serif text-2xl md:text-3xl"
      : size === "sm"
        ? "carousel-card-price--sale text-xs font-sans tracking-wide"
        : "carousel-card-price--sale text-lg font-serif"
    : size === "lg"
      ? "font-serif text-2xl md:text-3xl text-gold"
      : size === "sm"
        ? "text-xs text-gold font-sans tracking-wide"
        : "text-lg text-gold font-serif";

  const originalClass = onImage
    ? size === "lg"
      ? "carousel-card-price--original text-base line-through"
      : size === "sm"
        ? "carousel-card-price--original text-[10px] line-through"
        : "carousel-card-price--original text-sm line-through"
    : size === "lg"
      ? "text-base text-ivory-faint line-through"
      : size === "sm"
        ? "text-[10px] text-ivory-faint line-through"
        : "text-sm text-ivory-faint line-through";

  const layoutClass =
    onSale && size === "sm"
      ? "flex-col items-start gap-0.5"
      : size === "sm"
        ? "flex-row items-baseline gap-1.5 flex-nowrap"
        : onSale
          ? "flex-wrap items-baseline gap-2"
          : "flex-wrap items-baseline gap-2";

  return (
    <div
      className={`flex ${layoutClass} ${className}`}
      dir="ltr"
    >
      {onSale ? (
        <span className={originalClass}>
          {formatNumber(price, locale)} {currency}
        </span>
      ) : null}
      <span className={priceClass}>
        {formatNumber(finalPrice, locale)} {currency}
      </span>
    </div>
  );
}