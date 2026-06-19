"use client";

import { useEffect, useState } from "react";
import { scrollToSection } from "@/lib/scroll";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => scrollToSection("#hero")}
      className="fixed bottom-6 end-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-void/80 text-gold backdrop-blur-sm transition-all duration-300 hover:border-gold hover:bg-gold hover:text-[#0E0D12] shadow-lg"
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
