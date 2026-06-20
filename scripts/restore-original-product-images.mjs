/**
 * Restore VOGO original product renders from git history (initial commit).
 * Usage: node scripts/restore-original-product-images.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const productsDir = join(root, "public", "images", "products");

const ORIGINAL_TO_CATALOG = [
  ["public/images/products/suit_classic_black.png", "classic-black-tuxedo.png"],
  ["public/images/products/suit_navy_wedding.png", "royal-navy-wedding-tuxedo.png"],
  ["public/images/products/suit_charcoal_business.png", "charcoal-double-breasted.png"],
  ["public/images/products/suit_burgundy_evening.png", "burgundy-velvet-blazer.png"],
  ["public/images/products/suit_ivory_summer.png", "ivory-linen-blazer.png"],
];

const COMMIT = "a057d2a";

mkdirSync(productsDir, { recursive: true });

for (const [gitPath, destName] of ORIGINAL_TO_CATALOG) {
  const buffer = execFileSync("git", ["show", `${COMMIT}:${gitPath}`], {
    cwd: root,
    maxBuffer: 20 * 1024 * 1024,
  });
  const dest = join(productsDir, destName);
  writeFileSync(dest, buffer);
  if (buffer.length === 0) {
    throw new Error(`Restored ${destName} is empty — check git path ${gitPath}`);
  }
  console.log(`Restored ${destName} (${buffer.length} bytes) from ${gitPath}`);
}

const attribution = join(productsDir, "ATTRIBUTION.txt");
if (existsSync(attribution)) {
  unlinkSync(attribution);
  console.log("Removed Pexels ATTRIBUTION.txt");
}

console.log("\nDone — original VOGO suit renders restored.");
