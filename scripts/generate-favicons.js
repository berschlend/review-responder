#!/usr/bin/env node
/**
 * Generate PNG favicons from SVG
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '../frontend/public');
const svgPath = path.join(publicDir, 'favicon.svg');

async function generateFavicons() {
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate different sizes
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Created: ${name}`);
  }

  // Also create favicon.ico (use 32x32 as base)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created: favicon.ico');

  console.log('\nAll favicons generated successfully!');
}

generateFavicons().catch(console.error);
