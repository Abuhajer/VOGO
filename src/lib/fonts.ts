import {
  Cormorant_Garamond,
  Outfit,
  Amiri,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";

export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic-serif",
  display: "swap",
});

export const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic-sans",
  display: "swap",
});

export const fontVariables = [
  outfit.variable,
  cormorantGaramond.variable,
  amiri.variable,
  ibmPlexArabic.variable,
].join(" ");
