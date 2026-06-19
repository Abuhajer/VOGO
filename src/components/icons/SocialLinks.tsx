import { FacebookIcon, InstagramIcon } from "@/components/icons/Icons";

export const SOCIAL_LINK_CLASS =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-muted/40 bg-surface/50 text-gold transition-all duration-300 hover:border-transparent hover:text-white light:border-gold-muted/50 light:bg-surface light:text-[#4A453F] light:hover:text-white";

type SocialLinksProps = {
  className?: string;
  isArabic?: boolean;
  iconSize?: number;
};

export default function SocialLinks({
  className = "",
  isArabic = false,
  iconSize = 18,
}: SocialLinksProps) {
  const iconClass = "block shrink-0";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a
        href="https://www.facebook.com/vogobyfame"
        target="_blank"
        rel="noopener noreferrer"
        className={`${SOCIAL_LINK_CLASS} hover:bg-[#1877F2]`}
        aria-label={isArabic ? "فيسبوك" : "Facebook"}
      >
        <FacebookIcon size={iconSize} className={iconClass} />
      </a>

      <a
        href="https://www.instagram.com/vogobyfame"
        target="_blank"
        rel="noopener noreferrer"
        className={`${SOCIAL_LINK_CLASS} hover:bg-[#E4405F]`}
        aria-label={isArabic ? "إنستغرام" : "Instagram"}
      >
        <InstagramIcon size={iconSize} className={iconClass} />
      </a>
    </div>
  );
}
