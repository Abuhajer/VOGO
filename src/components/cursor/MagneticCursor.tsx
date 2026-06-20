"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";

export default function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const cursorTextRef = useRef("");
  const visibleRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [cursorText, setCursorTextState] = useState("");

  useEffect(() => {
    setEnabled(!window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useGSAP(() => {
    if (!enabled) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.16, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.16, ease: "power3.out" });
    const scaleXTo = gsap.quickTo(cursor, "scaleX", { duration: 0.22, ease: "power2.out" });
    const scaleYTo = gsap.quickTo(cursor, "scaleY", { duration: 0.22, ease: "power2.out" });

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      scaleX: 0,
      scaleY: 0,
      opacity: 0,
      force3D: true,
    });

    const updateCursorLabel = (text: string) => {
      if (cursorTextRef.current === text) return;
      cursorTextRef.current = text;
      setCursorTextState(text);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!visibleRef.current) {
        visibleRef.current = true;
        gsap.to(cursor, { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.25, overwrite: "auto" });
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest(".product-card")) {
        updateCursorLabel(locale === "ar" ? "عرض" : "View");
        scaleXTo(2.4);
        scaleYTo(2.4);
        gsap.to(cursor, {
          backgroundColor: "rgba(201, 168, 76, 0.2)",
          borderColor: "var(--color-gold)",
          duration: 0.22,
          overwrite: "auto",
        });
        return;
      }

      if (target.closest("a, button, input, textarea, select, [role='button'], [data-hover-magnetic]")) {
        updateCursorLabel("");
        scaleXTo(1.8);
        scaleYTo(1.8);
        gsap.to(cursor, {
          backgroundColor: "rgba(201, 168, 76, 0.12)",
          borderColor: "var(--color-gold)",
          duration: 0.22,
          overwrite: "auto",
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        target.closest(".product-card") ||
        target.closest("a, button, input, textarea, select, [role='button'], [data-hover-magnetic]")
      ) {
        updateCursorLabel("");
        scaleXTo(1);
        scaleYTo(1);
        gsap.to(cursor, {
          backgroundColor: "transparent",
          borderColor: "rgba(201, 168, 76, 0.4)",
          duration: 0.22,
          overwrite: "auto",
        });
      }
    };

    const handleMouseLeaveWindow = () => {
      visibleRef.current = false;
      gsap.to(cursor, { scaleX: 0, scaleY: 0, opacity: 0, duration: 0.25, overwrite: "auto" });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mouseout", handleMouseOut, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("mouseleave", handleMouseLeaveWindow);
    };
  }, [enabled, locale]);

  if (!enabled) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[80] flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-gold/40 select-none"
      style={{
        opacity: 0,
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
