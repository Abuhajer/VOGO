import {
  inferGarmentStyling,
  inferGarmentCoverage,
  shouldPreservePersonLowerBody,
} from "../src/lib/try-on/garment-styling";

const products = [
  {
    slug: "classic-black-tuxedo",
    nameEn: "Classic Black Evening Tuxedo",
    descEn: "Timeless elegance with an Italian cut and deep black finish.",
  },
  {
    slug: "royal-navy-wedding-tuxedo",
    nameEn: "Royal Navy Wedding Tuxedo",
    descEn: "Statement wedding tuxedo with black silk shawl lapels.",
  },
  {
    slug: "charcoal-double-breasted",
    nameEn: "Charcoal Double-Breasted Pinstripe",
    descEn: "Authoritative presence in superfine 150s wool.",
  },
  {
    slug: "burgundy-velvet-blazer",
    nameEn: "Burgundy Velvet Evening Blazer",
    descEn: "Bold velvet evening blazer for special occasions.",
  },
  {
    slug: "ivory-linen-blazer",
    nameEn: "Ivory Luxury Linen Blazer",
    descEn: "Light refined cut for Mediterranean summer luxury.",
  },
];

let ok = true;
for (const p of products) {
  const haystack = `${p.nameEn} ${p.descEn} ${p.slug}`.toLowerCase();
  const coverage = inferGarmentCoverage(haystack, p.slug);
  const styling = inferGarmentStyling(p.nameEn, p.descEn, p.slug);
  const preserve = shouldPreservePersonLowerBody(styling.coverage, p.slug);
  const expectedCoverage =
    p.slug.includes("blazer") && !/tuxedo|suit/.test(p.slug) ? "upper" : "full";
  const expectedPreserve = expectedCoverage === "upper";
  if (coverage !== expectedCoverage || preserve !== expectedPreserve) {
    ok = false;
    console.error("FAIL", p.slug, { coverage, expectedCoverage, preserve, expectedPreserve });
  } else {
    console.log(
      p.slug.padEnd(28),
      "coverage=" + coverage.padEnd(5),
      "preserveLower=" + preserve
    );
  }
}

process.exit(ok ? 0 : 1);
