"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";

export default function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const [cursorText, setCursorText] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useGSAP(() => {
    if (!enabled) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.18, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.18, ease: "power3" });

    gsap.set(cursor, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) {
        setIsVisible(true);
        gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 });
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest("a, button, input, textarea, select, [role='button'], [data-hover-magnetic]")) {
        gsap.to(cursor, {
          scale: 1.8,
          backgroundColor: "rgba(201, 168, 76, 0.12)",
          borderColor: "var(--color-gold)",
          borderWidth: "1px",
          duration: 0.25,
          ease: "power2.out",
        });
      }

      if (target.closest(".product-card")) {
        setCursorText(locale === "ar" ? "عرض" : "View");
        gsap.to(cursor, {
          scale: 2.4,
          backgroundColor: "rgba(201, 168, 76, 0.2)",
          borderColor: "var(--color-gold)",
          borderWidth: "1px",
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest("a, button, input, textarea, select, [role='button'], [data-hover-magnetic]")) {
        gsap.to(cursor, {
          scale: 1,
          backgroundColor: "transparent",
          borderColor: "rgba(201, 168, 76, 0.4)",
          borderWidth: "1.5px",
          duration: 0.25,
          ease: "power2.out",
        });
      }

      if (target.closest(".product-card")) {
        setCursorText("");
        gsap.to(cursor, {
          scale: 1,
          backgroundColor: "transparent",
          borderColor: "rgba(201, 168, 76, 0.4)",
          borderWidth: "1.5px",
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleMouseLeaveWindow = () => {
      setIsVisible(false);
      gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.3 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("mouseleave", handleMouseLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("mouseleave", handleMouseLeaveWindow);
    };
  }, [enabled, locale, isVisible]);

  if (!enabled) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[80] flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-gold/40 select-none"
      style={{
        opacity: isVisible ? 1 : 0,
        backgroundColor: "transparent",
        boxShadow: cursorText ? "0 0 15px rgba(201, 168, 76, 0.2)" : "none",
      }}
    >
      {cursorText && (
        <span className="text-[7px] font-sans font-bold tracking-[0.1em] text-gold">
          {cursorText}
        </span>
      )}
    </div>
  );
}
