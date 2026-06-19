import { ReactNode } from "react";
import type { Viewport } from "next";
import { getLocale } from "next-intl/server";
import { Cormorant_Garamond, Outfit, Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import "@/app/globals.css";

// Configure Google Fonts
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic-serif",
  display: "swap",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic-sans",
  display: "swap",
});

type Props = {
  children: ReactNode;
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Props) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const fontClasses = `${outfit.variable} ${cormorantGaramond.variable} ${amiri.variable} ${ibmPlexArabic.variable}`;

  return (
    <html lang={locale} dir={dir} className={`dark ${fontClasses}`} suppressHydrationWarning>
      <body className="bg-void text-ivory antialiased selection:bg-gold selection:text-void">
        {children}
      </body>
    </html>
  );
}

