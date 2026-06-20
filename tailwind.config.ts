import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "var(--color-void)",
        obsidian: "var(--color-obsidian)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        gold: "var(--color-gold)",
        "gold-muted": "var(--color-gold-muted)",
        "gold-glow": "var(--color-gold-glow)",
        ivory: "var(--color-ivory)",
        "ivory-muted": "var(--color-ivory-muted)",
        "ivory-faint": "var(--color-ivory-faint)",
        error: "var(--color-error)",
        success: "var(--color-success)",
      },
      fontFamily: {
        sans: ["var(--font-sans-active)", "sans-serif"],
        serif: ["var(--font-serif-active)", "serif"],
        "arabic-sans": ["var(--font-arabic-sans)", "sans-serif"],
        "arabic-serif": ["var(--font-arabic-serif)", "serif"],
      },
      transitionTimingFunction: {
        fabric: "var(--ease-fabric)",
        snappy: "var(--ease-snappy)",
        dramatic: "var(--ease-dramatic)",
        bounce: "var(--ease-bounce)",
      },
      transitionDuration: {
        micro: "var(--duration-micro)",
        standard: "var(--duration-standard)",
        cinematic: "var(--duration-cinematic)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-muted) 100%)",
        "dark-radial": "radial-gradient(circle at center, var(--color-surface) 0%, var(--color-void) 100%)",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
  ],
};
export default config;
