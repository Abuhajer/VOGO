"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import { siteImages } from "@/lib/images";
import SectionLabel from "@/components/icons/SectionLabel";

const PRODUCTS_DATA = [
  { id: "classicBlack", imageSrc: siteImages.products.classicBlack, price: 280 },
  { id: "navyWedding", imageSrc: siteImages.products.navyWedding, price: 350 },
  { id: "businessGray", imageSrc: siteImages.products.businessGray, price: 290 },
  { id: "burgundyEvening", imageSrc: siteImages.products.burgundyEvening, price: 260 },
  { id: "ivorySummer", imageSrc: siteImages.products.ivorySummer, price: 180 },
] as const;

type ProductId = (typeof PRODUCTS_DATA)[number]["id"];

type SelectedProduct = {
  id: ProductId;
  name: string;
  description: string;
  price: number;
  imageSrc: string;
};

type QuickCache = {
  rotationY: gsap.QuickToFunc;
  rotationX: gsap.QuickToFunc;
  z: gsap.QuickToFunc;
  scaleX: gsap.QuickToFunc;
  scaleY: gsap.QuickToFunc;
  y: gsap.QuickToFunc;
  opacity: gsap.QuickToFunc;
};

type InnerQuickCache = {
  z: gsap.QuickToFunc;
};

const quickCache = new WeakMap<HTMLElement, QuickCache>();
const innerQuickCache = new WeakMap<HTMLElement, InnerQuickCache>();

const QUICK_OPTS = { duration: 0.45, ease: "power2.out" } as const;

function getQuickTweens(wrapper: HTMLElement): QuickCache {
  const existing = quickCache.get(wrapper);
  if (existing) return existing;

  gsap.set(wrapper, {
    transformPerspective: 1600,
    transformOrigin: "50% 50%",
    force3D: true,
  });

  const tweens: QuickCache = {
    rotationY: gsap.quickTo(wrapper, "rotationY", QUICK_OPTS),
    rotationX: gsap.quickTo(wrapper, "rotationX", QUICK_OPTS),
    z: gsap.quickTo(wrapper, "z", QUICK_OPTS),
    scaleX: gsap.quickTo(wrapper, "scaleX", QUICK_OPTS),
    scaleY: gsap.quickTo(wrapper, "scaleY", QUICK_OPTS),
    y: gsap.quickTo(wrapper, "y", QUICK_OPTS),
    opacity: gsap.quickTo(wrapper, "opacity", { duration: 0.35, ease: "power2.out" }),
  };

  quickCache.set(wrapper, tweens);
  return tweens;
}

function getInnerQuickTweens(inner: HTMLElement): InnerQuickCache {
  const existing = innerQuickCache.get(inner);
  if (existing) return existing;

  const tweens: InnerQuickCache = {
    z: gsap.quickTo(inner, "z", QUICK_OPTS),
  };

  innerQuickCache.set(inner, tweens);
  return tweens;
}

const MOBILE_MQ = "(max-width: 767px)";

function isMobileViewport() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function updateCards3D(
  track: HTMLElement | null,
  dotsRoot: HTMLElement | null,
  isMobile: boolean
) {
  if (!track) return;

  const wrappers = gsap.utils.toArray<HTMLElement>(".product-card-3d", track);
  const viewportCenter = window.innerWidth / 2;
  let activeIndex = 0;
  let minDistance = Number.POSITIVE_INFINITY;

  const rotateMax = isMobile ? 14 : 22;
  const zMax = isMobile ? 55 : 100;
  const zCenter = isMobile ? 70 : 95;

  wrappers.forEach((wrapper, index) => {
    const rect = wrapper.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const offset = (cardCenter - viewportCenter) / (window.innerWidth * (isMobile ? 0.48 : 0.36));
    const absOffset = Math.min(Math.abs(offset), 1);
    const isCenter = absOffset < (isMobile ? 0.2 : 0.15);

    if (absOffset < minDistance) {
      minDistance = absOffset;
      activeIndex = index;
    }

    const rotationY = offset * -rotateMax;
    const rotationX = 3 - absOffset * 5;
    const cardScale = isCenter ? 1.05 : 1 - absOffset * 0.08;
    const z = isCenter ? zCenter : -absOffset * zMax;
    const y = absOffset * (isMobile ? 8 : 12);
    const opacity = Math.max(0.82, 1 - absOffset * 0.15);
    const innerZ = isCenter ? (isMobile ? 40 : 50) : 10;

    wrapper.style.setProperty("--depth", absOffset.toFixed(3));

    const tweens = getQuickTweens(wrapper);
    tweens.rotationY(rotationY);
    tweens.rotationX(rotationX);
    tweens.z(z);
    tweens.scaleX(cardScale);
    tweens.scaleY(cardScale);
    tweens.y(y);
    tweens.opacity(opacity);

    const inner = wrapper.querySelector<HTMLElement>(".product-card-inner");
    if (inner) {
      getInnerQuickTweens(inner).z(innerZ);
    }
  });

  wrappers.forEach((wrapper, index) => {
    wrapper.classList.toggle("is-active", index === activeIndex && minDistance < 0.4);
    wrapper.classList.toggle("is-near", index !== activeIndex && Math.abs(index - activeIndex) === 1);
  });

  dotsRoot?.querySelectorAll("[data-carousel-dot]").forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
  });
}

export default function HorizontalCollection() {
  const t = useTranslations("Collection");
  const locale = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const snapRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

  const useCarousel3D = !prefersReducedMotion;

  const openProductDetails = useCallback((product: SelectedProduct) => {
    setSelectedProduct(product);
  }, []);

  const closeProductDetails = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const rafRef = useRef<number | null>(null);

  const handle3DUpdate = useCallback(() => {
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateCards3D(trackRef.current, dotsRef.current, isMobileViewport());
    });
  }, []);

  useGSAP(() => {
    if (prefersReducedMotion) return;

    const track = trackRef.current;
    const pin = pinRef.current;
    const snap = snapRef.current;
    if (!track || !pin || !snap) return;

    let scrollTween: gsap.core.Tween | null = null;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const getScrollAmount = () => {
        const trackWidth = track.scrollWidth;
        const windowWidth = window.innerWidth;
        return Math.max(trackWidth - windowWidth + 200, 0);
      };

      scrollTween = gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          pin,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: handle3DUpdate,
        },
      });

      handle3DUpdate();

      return () => {
        scrollTween?.scrollTrigger?.kill();
        scrollTween?.kill();
        scrollTween = null;
        gsap.set(track, { x: 0 });
      };
    });

    mm.add(MOBILE_MQ, () => {
      gsap.set(track, { x: 0 });
      handle3DUpdate();
      snap.addEventListener("scroll", handle3DUpdate, { passive: true });

      return () => {
        snap.removeEventListener("scroll", handle3DUpdate);
      };
    });

    const onResize = () => {
      ScrollTrigger.refresh();
      handle3DUpdate();
    };
    window.addEventListener("resize", onResize);

    return () => {
      mm.revert();
      window.removeEventListener("resize", onResize);
    };
  }, { scope: sectionRef, dependencies: [prefersReducedMotion, handle3DUpdate] });

  const renderProduct = (p: (typeof PRODUCTS_DATA)[number], index: number) => (
    <ProductCard
      key={p.id}
      id={p.id}
      name={t(`products.${p.id}.name`)}
      description={t(`products.${p.id}.description`)}
      price={p.price}
      imageSrc={p.imageSrc}
      index={index}
      carousel3d={useCarousel3D}
      onOpenDetails={() =>
        openProductDetails({
          id: p.id,
          name: t(`products.${p.id}.name`),
          description: t(`products.${p.id}.description`),
          price: p.price,
          imageSrc: p.imageSrc,
        })
      }
    />
  );

  const header = (
    <div
      className="container mx-auto px-4 sm:px-6 md:px-12 mb-4 sm:mb-6 md:mb-8 relative z-10 select-none"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <SectionLabel className="mb-2 text-gold font-light">{t("title")}</SectionLabel>
      <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-light text-ivory max-w-xl leading-tight">
        {t("subtitle")}
      </h2>
      {useCarousel3D && (
        <>
          <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-ivory-faint font-sans font-light leading-relaxed md:hidden">
            {t("carouselHintMobile")}
          </p>
          <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-ivory-faint font-sans font-light leading-relaxed hidden md:block">
            {t("carouselHint")}
          </p>
        </>
      )}
    </div>
  );

  const carouselTrack = (
    <div
      className="collection-3d-stage relative w-full flex flex-col items-center md:flex-1 md:justify-center md:min-h-[480px]"
      dir="ltr"
    >
      <div className="collection-3d-ambient pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 collection-3d-vignette" aria-hidden />
      <div className="collection-3d-floor pointer-events-none absolute left-1/2 bottom-[6%] -translate-x-1/2" aria-hidden />
      <div className="collection-3d-beam pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden />

      <div
        ref={snapRef}
        className="collection-snap-track relative z-10 w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth touch-pan-x py-2 md:overflow-hidden md:snap-none md:touch-auto"
      >
        <div
          ref={trackRef}
          className="flex items-stretch gap-4 ps-[max(1rem,calc(50vw-40vw))] pe-[max(1rem,calc(50vw-40vw))] py-2 md:items-center md:gap-6 lg:gap-10 md:px-[14vw] md:w-max"
          style={{ transformStyle: "preserve-3d" }}
        >
          {PRODUCTS_DATA.map((p, index) => (
            <div
              key={p.id}
              className="product-card-3d group flex-shrink-0 snap-center snap-always will-change-transform"
              style={{ transformStyle: "preserve-3d" }}
            >
              {renderProduct(p, index)}
            </div>
          ))}
        </div>
      </div>

      <div ref={dotsRef} className="relative z-10 mt-5 flex items-center justify-center gap-2.5">
        {PRODUCTS_DATA.map((p) => (
          <span
            key={p.id}
            data-carousel-dot
            className="carousel-dot h-1.5 w-1.5 rounded-full bg-gold-muted/30 transition-all duration-500"
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <section
        ref={sectionRef}
        className="relative bg-void w-full py-10 sm:py-14 md:py-0"
        id="collection"
      >
        <div
          ref={pinRef}
          className="w-full flex flex-col md:min-h-screen md:justify-center md:overflow-hidden"
        >
          {header}

          {!useCarousel3D ? (
            <div
              className="container mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              {PRODUCTS_DATA.map((p, index) => renderProduct(p, index))}
            </div>
          ) : (
            carouselTrack
          )}
        </div>
      </section>

      <ProductDetailModal
        open={selectedProduct !== null}
        onClose={closeProductDetails}
        name={selectedProduct?.name ?? ""}
        description={selectedProduct?.description ?? ""}
        price={selectedProduct?.price ?? 0}
        imageSrc={selectedProduct?.imageSrc ?? ""}
      />
    </>
  );
}
