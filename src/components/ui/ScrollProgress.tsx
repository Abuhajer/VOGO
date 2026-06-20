"use client";

import { useRef } from "react";
import { useRafScroll } from "@/hooks/useRafScroll";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useRafScroll(() => {
    const bar = barRef.current;
    if (!bar) return;

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0;
    bar.style.transform = `scaleX(${progress})`;
  });

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-px bg-transparent pointer-events-none"
      aria-hidden
    >
      <div
        ref={barRef}
        className="h-full w-full bg-gold origin-left will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
