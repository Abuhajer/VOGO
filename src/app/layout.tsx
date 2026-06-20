import { ReactNode } from "react";
import type { Viewport } from "next";
import { getLocale } from "next-intl/server";
import { fontVariables } from "@/lib/fonts";
import { themeInitScript } from "@/lib/theme";
import "@/app/globals.css";

type Props = {
  children: ReactNode;
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
  ],
};

export default async function RootLayout({ children }: Props) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-void text-ivory antialiased selection:bg-gold selection:text-void">
        {children}
      </body>
    </html>
  );
}
