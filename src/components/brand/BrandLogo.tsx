"use client";

import Image from "next/image";
import { BRAND_LOGO } from "@/lib/brand";

type Props = {
  className?: string;
  /** ivory mark on dark surfaces; dark mark on light surfaces */
  tone?: "auto" | "on-dark" | "on-light";
  showAccent?: boolean;
  priority?: boolean;
};

export default function BrandLogo({
  className = "",
  tone = "auto",
  showAccent = false,
  priority = false,
}: Props) {
  const toneClass =
    tone === "on-dark"
      ? "brand-logo--on-dark"
      : tone === "on-light"
        ? "brand-logo--on-light"
        : "brand-logo--auto";

  return (
    <span
      className={`brand-logo ${toneClass} relative inline-flex h-full w-full items-center justify-center ${className}`}
    >
      <Image
        src={BRAND_LOGO.path}
        alt={BRAND_LOGO.alt}
        fill
        sizes="(max-width: 768px) 112px, 144px"
        priority={priority}
        className="brand-logo__image object-contain object-center"
      />
      {showAccent ? <span className="brand-logo__accent" aria-hidden /> : null}
    </span>
  );
}
