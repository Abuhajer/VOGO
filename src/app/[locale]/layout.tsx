import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/context/ThemeProvider";
import AppProviders from "@/components/providers/AppProviders";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/navigation/Navbar";
import SiteChrome from "@/components/SiteChrome";
import { siteImages } from "@/lib/images";
import { getOrganizationSchema } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";
import { BRAND, BRAND_LOGO } from "@/lib/brand";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const isAr = locale === "ar";
  return {
    title: isAr
      ? `${BRAND.nameArShort} — فخامة ملابس الرجال الرسمية وبدلات العرسان في الأردن`
      : `${BRAND.name} — Premium Men's Luxury Suits & Groom Tuxedos in Amman`,
    description: isAr
      ? `${BRAND.nameAr} — الخيار الأول لكل رجل مميز يبحث عن الأناقة والفخامة والجودة لبدلات العرسان والملابس الرسمية بأرقى التصاميم وأحدث الموديلات في عمّان، الأردن.`
      : `Discover ${BRAND.name}, Amman's premier digital flagship for high-end luxury menswear. Handcrafted custom wedding tuxedos, formal blazers, and luxury suits.`,
    metadataBase: new URL(SITE_URL),
    icons: {
      icon: BRAND_LOGO.favicon,
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: "/ar",
        en: "/en",
      },
    },
    openGraph: {
      title: isAr
        ? `${BRAND.nameArShort} — فخامة ملابس الرجال الرسمية وبدلات العرسان`
        : `${BRAND.name} — Premium Men's Luxury Suits`,
      description: isAr 
        ? "ڤوچو — بدلات زفاف مصممة للمناسبة التي تميزك. تفصيل فاخر وأقمشة إيطالية حصرية في الأردن."
        : "Impeccably tailored luxury menswear in Amman. Explore our flagship collection.",
      images: [
        {
          url: siteImages.og,
          width: 1200,
          height: 630,
          alt: BRAND.name,
        },
      ],
      locale: isAr ? "ar_JO" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: isAr ? `${BRAND.nameArShort} — فخامة ملابس الرجال الرسمية` : `${BRAND.name} — Luxury Menswear`,
      description: isAr
        ? "بدلات زفاف وتفصيل فاخر في عمّان، الأردن."
        : "Bespoke suits and groom tuxedos in Amman, Jordan.",
      images: [siteImages.og],
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const organizationSchema = getOrganizationSchema(locale);

  return (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages}>
        <AppProviders>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            suppressHydrationWarning
          />
          <div className="grain-overlay" aria-hidden="true" />
          <Navbar />
          <SiteChrome>
            <div className="relative min-h-screen flex flex-col overflow-x-hidden">
              {children}
            </div>
          </SiteChrome>
        </AppProviders>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
