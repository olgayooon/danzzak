import sharp from 'sharp';
import { mkdir } from 'fs/promises';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgBase = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7C3AED"/>
      <stop offset="100%" style="stop-color:#5B21B6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <text x="256" y="346" font-size="280" text-anchor="middle" font-family="serif">📖</text>
</svg>`;

await mkdir('public/icons', { recursive: true });

for (const size of sizes) {
  await sharp(Buffer.from(svgBase))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`✓ icon-${size}.png`);
}

console.log('Done!');
