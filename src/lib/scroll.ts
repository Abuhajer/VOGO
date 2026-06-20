export function scrollToSection(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;

  const target = document.getElementById(id);
  if (!target) return;

  const headerOffset = 88;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({
    top,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

export function sectionHomeHref(hash: string, locale: string) {
  const id = hash.replace(/^#/, "");
  return `/${locale}#${id}`;
}

export function navigateToSection(
  hash: string,
  options: { isHome: boolean; locale: string }
) {
  const normalized = hash.startsWith("#") ? hash : `#${hash}`;

  if (options.isHome) {
    scrollToSection(normalized);
    return;
  }

  window.location.assign(sectionHomeHref(normalized, options.locale));
}
