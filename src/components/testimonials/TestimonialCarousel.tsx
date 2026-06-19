"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import SectionLabel from "@/components/icons/SectionLabel";
import { StarIcon } from "@/components/icons/Icons";

export default function TestimonialCarousel() {
  const t = useTranslations("Testimonials");
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load reviews length. We have 4 items in JSON.
  const reviewsCount = 4;

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % reviewsCount);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + reviewsCount) % reviewsCount);
  };

  // Autoplay functionality
  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(nextSlide, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      nextSlide();
    } else if (info.offset.x > swipeThreshold) {
      prevSlide();
    }
  };

  // Slide animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  // State to track direction for slide transition
  const [[, direction], setSlideDirection] = useState([0, 0]);

  const setPage = (newIndex: number) => {
    const dir = newIndex > index ? 1 : -1;
    setSlideDirection([newIndex, dir]);
    setIndex(newIndex);
  };

  useEffect(() => {
    setSlideDirection([index, 1]);
  }, [index]);

  return (
    <section
      className="relative w-full bg-obsidian py-20 md:py-32 flex flex-col items-center justify-center overflow-hidden border-b border-gold-glow/10"
      id="testimonials"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background ambient mesh glow */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-gold-glow filter blur-[100px] pointer-events-none opacity-20 z-0" />
      
      {/* Section Header */}
      <div 
        className="container mx-auto px-6 text-center mb-12 md:mb-16 z-10"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <SectionLabel className="mb-2 text-gold font-light block justify-center">{t("title")}</SectionLabel>
        <h2 className="text-3xl md:text-4xl font-serif font-light text-ivory">
          {t("subtitle")}
        </h2>
      </div>

      {/* Slide Carousel Track */}
      <div className="relative w-full max-w-4xl min-h-[250px] md:min-h-[220px] px-6 md:px-12 flex items-center justify-center z-10">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="w-full flex flex-col items-center text-center cursor-grab active:cursor-grabbing select-none"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {/* Magazine Pullquote aesthetic: Large Quotation mark */}
            <span className="font-serif text-5xl md:text-7xl text-gold-muted/30 leading-none h-6 select-none">
              “
            </span>

            {/* Quote text */}
            <blockquote className="text-lg md:text-2xl font-serif italic text-ivory max-w-2xl px-4 md:px-8 mt-2 md:mt-4 leading-relaxed text-balance">
              {t(`reviews.${index}.quote`)}
            </blockquote>

            {/* Star ratings */}
            <div className="flex gap-1 mt-6">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} size={16} className="text-gold" />
              ))}
            </div>

            {/* Author Name and Location */}
            <div className="mt-4 flex flex-col md:flex-row items-center gap-1 md:gap-3">
              <cite className="not-italic font-sans text-xs md:text-sm font-semibold tracking-wider text-gold">
                {t(`reviews.${index}.name`)}
              </cite>
              <span className="hidden md:inline text-ivory-faint">|</span>
              <span className="text-[10px] md:text-xs text-ivory-muted tracking-widest font-sans font-light">
                {t(`reviews.${index}.city`)}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Manual Indicators (Minimal gold dashes) */}
      <div className="flex gap-3 mt-10 z-10">
        {[...Array(reviewsCount)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`h-[2px] transition-all duration-300 ${
              i === index ? "w-8 bg-gold" : "w-3 bg-gold-glow hover:bg-gold-muted"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
