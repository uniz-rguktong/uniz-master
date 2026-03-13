const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(process.cwd(), 'public/assets/Ornate_LOGO.svg');
const outputDir = path.join(process.cwd(), 'public/icons');

async function convert() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await sharp(svgPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDir, 'icon-192x192.png'));

  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'icon-512x512.png'));

  console.log('Icons generated successfully');
}

convert().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
