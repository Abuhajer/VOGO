"use client";

import { useCallback, useEffect, useState } from "react";
import IntroLoader from "@/components/loader/IntroLoader";
import MagneticCursor from "@/components/cursor/MagneticCursor";
import HeroSection from "@/components/hero/HeroSection";
import HorizontalCollection from "@/components/collection/HorizontalCollection";
import GroomSection from "@/components/wedding/GroomSection";
import StorySection from "@/components/story/StorySection";
import TestimonialCarousel from "@/components/testimonials/TestimonialCarousel";
import ContactSection from "@/components/contact/ContactSection";
import Footer from "@/components/footer/Footer";
import { scrollToSection } from "@/lib/scroll";
import type { CollectionCarouselProduct } from "@/types/catalog";

type HomePageClientProps = {
  carouselProducts: CollectionCarouselProduct[];
};

export default function HomePageClient({ carouselProducts }: HomePageClientProps) {
  const [introDone, setIntroDone] = useState(false);
  const handleLoaded = useCallback(() => setIntroDone(true), []);

  useEffect(() => {
    if (!introDone) return;
    const hash = window.location.hash;
    if (!hash) return;

    const timer = window.setTimeout(() => scrollToSection(hash), 120);
    return () => window.clearTimeout(timer);
  }, [introDone]);

  return (
    <>
      <IntroLoader onComplete={handleLoaded} />
      <MagneticCursor />

      <main>
        <HeroSection introReady={introDone} />
        <HorizontalCollection products={carouselProducts} />
        <StorySection />
        <GroomSection />
        <TestimonialCarousel />
        <ContactSection />
        <Footer />
      </main>
    </>
  );
}
