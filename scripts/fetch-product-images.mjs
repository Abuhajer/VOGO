/**
 * Download curated menswear product photos (Pexels, free license) for every catalog item.
 * For the original VOGO suit renders, use: npm run products:restore-images
 *
 * Usage: npm run products:fetch-images
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { COLLECTION_PEXELS, SLUG_PEXELS, CATALOG_SLUGS } from "./curated-pexels-suits.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const productsDir = join(root, "public", "images", "products");

const SKU_BY_SLUG = {
  "classic-black-tuxedo": "VOGO-001",
  "royal-navy-wedding-tuxedo": "VOGO-002",
  "charcoal-double-breasted": "VOGO-003",
  "burgundy-velvet-blazer": "VOGO-004",
  "ivory-linen-blazer": "VOGO-005",
};

const catalog = CATALOG_SLUGS.map((slug) => {
  const meta = SLUG_PEXELS[slug];
  if (!meta) throw new Error(`Missing Pexels mapping for ${slug}`);
  return { slug, sku: SKU_BY_SLUG[slug] ?? slug, ...meta };
});

const poolCursor = Object.fromEntries(
  Object.keys(COLLECTION_PEXELS).map((key) => [key, 0]),
);

function resolvePhotoId(product) {
  const curated = SLUG_PEXELS[product.slug];
  if (curated) {
    return { id: curated.id, label: curated.label, source: "curated" };
  }

  const pool = COLLECTION_PEXELS[product.collectionSlug];
  if (!pool?.length) {
    throw new Error(`No Pexels pool for collection ${product.collectionSlug} (${product.slug})`);
  }
  const idx = poolCursor[product.collectionSlug]++;
  if (idx >= pool.length) {
    throw new Error(`Ran out of pool IDs for ${product.collectionSlug} at ${product.slug}`);
  }
  return { id: pool[idx], label: "collection pool", source: "pool" };
}

async function assertPexels200(photoId) {
  const url = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop`;
  const res = await fetch(url, { method: "HEAD", redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Pexels ${photoId} HTTP ${res.status}`);
  }
  return url;
}

async function downloadPexelsPhoto(photoId, destPath) {
  const url = await assertPexels200(photoId);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Pexels ${photoId} GET HTTP ${res.status}`);
  }
  const input = Buffer.from(await res.arrayBuffer());
  await sharp(input)
    .rotate()
    .resize(900, 1200, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(destPath);
}

mkdirSync(productsDir, { recursive: true });

const attribution = [
  "Product images in this folder were downloaded from Pexels (https://www.pexels.com).",
  "",
  "Pexels License: free for personal and commercial use; no attribution required,",
  "though credit to the photographer is appreciated. See https://www.pexels.com/license/",
  "",
  "To refresh images: npm run products:fetch-images",
  "",
  "Slug → Pexels ID mapping (curated men's suits / tuxedos / blazers only):",
  "",
];

let ok = 0;
for (const product of catalog) {
  const { id: photoId, label, source } = resolvePhotoId(product);
  const dest = join(productsDir, `${product.slug}.png`);
  process.stdout.write(
    `${product.sku} ${product.slug} <- pexels:${photoId} (${source}) … `,
  );
  try {
    await downloadPexelsPhoto(photoId, dest);
    console.log("ok");
    attribution.push(`${product.sku}\t${product.slug}\t${photoId}\t${label}`);
    ok++;
  } catch (err) {
    console.log("FAILED");
    console.error(err);
    process.exit(1);
  }
}

writeFileSync(join(productsDir, "ATTRIBUTION.txt"), `${attribution.join("\n")}\n`, "utf8");
console.log(`\nSaved ${ok} product images to public/images/products/`);
