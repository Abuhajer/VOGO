"use client";

import { useRef } from "react";
import { useRafScroll } from "@/hooks/useRafScroll";
import { scrollToSection } from "@/lib/scroll";

export default function ScrollToTop() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useRafScroll(() => {
    const button = buttonRef.current;
    if (!button) return;

    const show = window.scrollY > window.innerHeight * 0.6;
    button.classList.toggle("opacity-0", !show);
    button.classList.toggle("pointer-events-none", !show);
    button.classList.toggle("translate-y-2", !show);
  });

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => scrollToSection("#hero")}
      className="fixed bottom-6 end-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-void/80 text-gold backdrop-blur-sm transition-[opacity,transform,border-color,background-color] duration-300 hover:border-gold hover:bg-gold hover:text-[#0E0D12] shadow-lg opacity-0 pointer-events-none translate-y-2"
      aria-label="Scroll to top"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 19V5M12 5L6 11M12 5l6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
