type CompactSaleBadge = {
  primary: string;
  secondary?: string;
};

export function getCompactSaleBadge({
  badge,
  price,
  salePrice,
  locale,
}: {
  badge?: string | null;
  price: number;
  salePrice?: number;
  locale: string;
}): CompactSaleBadge | null {
  const isArabic = locale === "ar";

  if (salePrice != null && salePrice < price) {
    const percent = Math.round((1 - salePrice / price) * 100);
    if (percent > 0) {
      return isArabic
        ? { primary: `${percent}%`, secondary: "خصم" }
        : { primary: `${percent}%`, secondary: "OFF" };
    }
  }

  const percentMatch = badge?.match(/(\d+)\s*%/);
  if (percentMatch) {
    return isArabic
      ? { primary: `${percentMatch[1]}%`, secondary: "خصم" }
      : { primary: `${percentMatch[1]}%`, secondary: "OFF" };
  }

  const amountMatch = badge?.match(/(\d+)/);
  if (amountMatch) {
    return isArabic
      ? { primary: amountMatch[1], secondary: "د.أ" }
      : { primary: amountMatch[1], secondary: "OFF" };
  }

  if (!badge?.trim()) return null;

  const compact = badge.trim().replace(/\s+/g, " ");
  if (compact.length <= 8) {
    return { primary: compact };
  }

  return { primary: compact.slice(0, 7) + "…" };
}
