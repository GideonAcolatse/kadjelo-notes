import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, 'public', 'icon.svg');
const publicDir = path.join(__dirname, 'public');

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PNG icons from SVG...');

  // 1. Standard PWA 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Created icon-192.png');

  // 2. Standard PWA 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Created icon-512.png');

  // 3. Apple Touch Icon 180x180 (for iOS Safari Home Screen)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // 4. Favicon PNGs
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ Created favicon-32x32.png');

  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✓ Created favicon-16x16.png');

  // 5. Maskable Icon with safe area padding (Android adaptive icon requirement)
  // Maskable icons require 10-15% padding so circular/squircle cropping doesn't clip content
  const maskableSvg = fs.readFileSync(svgPath, 'utf8');
  // For maskable, render on a solid brand background with 80% inner size
  const innerSize512 = Math.round(512 * 0.82);
  const innerBuffer512 = await sharp(svgBuffer).resize(innerSize512, innerSize512).toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 55, g: 24, b: 64, alpha: 1 } // #371840 brand purple
    }
  })
    .composite([{ input: innerBuffer512, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✓ Created icon-maskable-512.png');

  const innerSize192 = Math.round(192 * 0.82);
  const innerBuffer192 = await sharp(svgBuffer).resize(innerSize192, innerSize192).toBuffer();
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 55, g: 24, b: 64, alpha: 1 } // #371840 brand purple
    }
  })
    .composite([{ input: innerBuffer192, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));
  console.log('✓ Created icon-maskable-192.png');

  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
