// Generates all PWA / favicon PNGs from the SPAL icon SVGs.
// Run: node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = join(__dirname, "..", "public");
const ICONS = join(PUB, "icons");

const iosSvg     = readFileSync(join(PUB, "ios-icon-src.svg"));
const androidSvg = readFileSync(join(PUB, "android-icon-src.svg"));
const faviconSvg = readFileSync(join(PUB, "favicon-src.svg"));

// Standard square icons — use the iOS source (highest res, balanced padding)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const s of sizes) {
  await sharp(iosSvg, { density: 400 })
    .resize(s, s, { fit: "contain", background: { r: 248, g: 247, b: 244, alpha: 1 } })
    .png()
    .toFile(join(ICONS, `icon-${s}.png`));
  console.log(`icon-${s}.png`);
}

// Maskable (Android adaptive) — needs safe-zone padding; android source has it
await sharp(androidSvg, { density: 400 })
  .resize(512, 512, { fit: "contain", background: { r: 248, g: 247, b: 244, alpha: 1 } })
  .png()
  .toFile(join(ICONS, "icon-512-maskable.png"));
console.log("icon-512-maskable.png");

// Apple touch icon — 180x180, no transparency (iOS rounds it itself)
await sharp(iosSvg, { density: 400 })
  .resize(180, 180, { fit: "contain", background: { r: 248, g: 247, b: 244, alpha: 1 } })
  .png()
  .toFile(join(ICONS, "apple-touch-icon.png"));
console.log("apple-touch-icon.png");

// Favicons — use the android source (filled white square) so it reads in a tab
void faviconSvg;
for (const s of [16, 32, 48, 96, 192]) {
  await sharp(androidSvg, { density: 400 })
    .resize(s, s, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(PUB, `favicon-${s}.png`));
}
await sharp(androidSvg, { density: 400 }).resize(32, 32).png().toFile(join(PUB, "favicon.png"));
console.log("favicons done");

// Write favicon.ico (use 32px png bytes — most browsers accept png-in-ico via .png link anyway)
writeFileSync(join(PUB, "favicon.ico"), readFileSync(join(PUB, "favicon-32.png")));
console.log("favicon.ico");

console.log("All icons generated.");
