"use client";

import { useCallback, useState } from "react";
import IntroLoader from "@/components/loader/IntroLoader";
import MagneticCursor from "@/components/cursor/MagneticCursor";
import HeroSection from "@/components/hero/HeroSection";
import HorizontalCollection from "@/components/collection/HorizontalCollection";
import GroomSection from "@/components/wedding/GroomSection";
import StorySection from "@/components/story/StorySection";
import TestimonialCarousel from "@/components/testimonials/TestimonialCarousel";
import ContactSection from "@/components/contact/ContactSection";
import Footer from "@/components/footer/Footer";

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const handleLoaded = useCallback(() => setIntroDone(true), []);

  return (
    <>
      <IntroLoader onComplete={handleLoaded} />
      <MagneticCursor />

      <main>
        <HeroSection introReady={introDone} />
        <HorizontalCollection />
        <StorySection />
        <GroomSection />
        <TestimonialCarousel />
        <ContactSection />
        <Footer />
      </main>
    </>
  );
}
