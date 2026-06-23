import { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  dir?: "ltr" | "rtl";
  width?: "default" | "narrow" | "medium" | "wide" | "cart";
};

const WIDTH_CLASS: Record<NonNullable<PageShellProps["width"]>, string> = {
  default: "max-w-[96rem]",
  narrow: "max-w-2xl",
  medium: "max-w-4xl",
  wide: "max-w-6xl",
  cart: "cart-page-shell max-w-6xl",
};

export default function PageShell({
  children,
  className = "",
  dir,
  width = "default",
}: PageShellProps) {
  return (
    <main
      className={`site-page-shell mx-auto w-full ${WIDTH_CLASS[width]} ${className}`.trim()}
      dir={dir}
    >
      {children}
    </main>
  );
}
