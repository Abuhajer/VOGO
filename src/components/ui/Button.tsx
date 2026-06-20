import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "solid" | "outline" | "ghost";

type SharedProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  isArabic?: boolean;
};

const variantClass: Record<Variant, string> = {
  solid:
    "bg-gold text-[#0E0D12] hover:shadow-[0_0_25px_rgba(201,168,76,0.3)]",
  outline:
    "border border-gold-muted text-gold hover:bg-gold/10",
  ghost: "text-gold hover:text-ivory",
};

type ButtonAsButton = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({
  variant = "solid",
  children,
  className = "",
  isArabic = false,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300";
  const tracking = isArabic ? "" : "uppercase tracking-[0.2em]";
  const classes = `${base} ${variantClass[variant]} ${tracking} ${className}`;

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <a href={href} className={classes} {...linkProps}>
        {children}
      </a>
    );
  }

  const { ...buttonProps } = props as ButtonAsButton;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
