"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  
  // Set premium animation default easing and durations
  gsap.defaults({
    ease: "power3.out",
    duration: 0.9,
  });

  // Enable smooth scroll behaviors on scrollTrigger if required
  ScrollTrigger.config({
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
  });
}

export { gsap, ScrollTrigger };
export default gsap;
