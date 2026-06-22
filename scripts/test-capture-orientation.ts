import { getVideoCaptureRotation } from "../src/lib/captureVideoFrame";
import { getObjectCoverSourceRectInPixels } from "../src/lib/objectFitCrop";

let failed = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error("FAIL:", msg);
    failed++;
  } else {
    console.log("OK:", msg);
  }
}

// Landscape sensor buffer in portrait-held viewport
assert(
  getVideoCaptureRotation(1920, 1080, "user", true) === 270,
  "front camera landscape buffer → 270°"
);
assert(
  getVideoCaptureRotation(1920, 1080, "environment", true) === 90,
  "back camera landscape buffer → 90°"
);

// Native portrait buffer needs no rotation
assert(
  getVideoCaptureRotation(1080, 1920, "user", true) === 0,
  "portrait buffer (h > w) → 0°"
);
assert(
  getVideoCaptureRotation(1080, 1920, "environment", true) === 0,
  "portrait buffer back camera → 0°"
);

// Landscape viewport (desktop) — no rotation
assert(
  getVideoCaptureRotation(1920, 1080, "user", false) === 0,
  "landscape viewport → 0°"
);

// object-fit: cover + center top on landscape source in portrait viewport
const landscapeCrop = getObjectCoverSourceRectInPixels(1920, 1080, 360, 640, "top");
assert(landscapeCrop.sy === 0, "center top pins sy to 0 for landscape source");
assert(
  Math.abs(landscapeCrop.sw / landscapeCrop.sh - 360 / 640) < 0.001,
  "landscape crop matches viewport aspect"
);

// object-fit: cover + center top on portrait source in portrait viewport
const portraitCrop = getObjectCoverSourceRectInPixels(1080, 1920, 360, 640, "top");
assert(portraitCrop.sy === 0, "center top pins sy to 0 for portrait source");
assert(
  Math.abs(portraitCrop.sw / portraitCrop.sh - 360 / 640) < 0.001,
  "portrait crop matches viewport aspect"
);

// Wider viewport than source crops vertical strip from sides when source is landscape
const wideViewportCrop = getObjectCoverSourceRectInPixels(1920, 1080, 400, 640, "top");
assert(
  wideViewportCrop.sw < 1920,
  "landscape source crops horizontal edges for tall viewport"
);

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}

console.log("\nAll capture orientation checks passed.");
