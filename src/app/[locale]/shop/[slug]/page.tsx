import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getProductBySlug } from "@/server/products";
import { localizeProduct } from "@/lib/products";
import { localizeCollectionName } from "@/lib/collections";
import { formatNumber } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import AddToCartButton from "@/components/shop/AddToCartButton";

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }

  const { name, description } = localizeProduct(product, locale);
  const title = `${name} | VOGO BY FAME`;
  const url = absoluteUrl(`/${locale}/shop/${slug}`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: absoluteUrl(product.imageSrc) }],
    },
  };
}

export default async function ProductPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("Shop");
  const { name, description } = localizeProduct(product, locale);

  return (
    <main
      className="container mx-auto px-6 md:px-12 py-28 md:py-36 grid lg:grid-cols-2 gap-12"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-gold-glow/15">
        <Image src={product.imageSrc} alt={name} fill className="object-cover" priority />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">
          {product.collection
            ? localizeCollectionName(product.collection, locale)
            : t("detailLabel")}
        </p>
        <h1 className="font-serif text-4xl text-ivory">{name}</h1>
        <p className="mt-4 text-gold text-2xl font-serif">
          {formatNumber(product.price, locale)} {locale === "ar" ? "د.أ" : "JOD"}
        </p>
        <p className="mt-6 text-ivory-muted leading-relaxed">{description}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <AddToCartButton product={product} />
          <Link
            href={`/fitting-room?product=${product.slug}`}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold border border-gold-muted text-gold hover:bg-gold/10 transition-all duration-300 uppercase tracking-[0.2em]"
          >
            {t("tryInFittingRoom")}
          </Link>
        </div>
      </div>
    </main>
  );
}
