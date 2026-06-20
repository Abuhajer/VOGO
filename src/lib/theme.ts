export const THEME_STORAGE_KEY = "prime-theme";

export type Theme = "dark" | "light";

/** Runs before paint to prevent light/dark flash (inline in root layout). */
export const themeInitScript = `
(function () {
  try {
    var key = "${THEME_STORAGE_KEY}";
    var root = document.documentElement;
    var stored = localStorage.getItem(key);
    if (stored === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
      return;
    }
    if (stored === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`.trim();

export function readThemeFromDocument(): Theme {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.classList.contains("light") ? "light" : "dark";
}
