const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outputDir = 'public';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Check if sharp is available
try {
  require.resolve('sharp');
} catch (e) {
  console.warn('⚠️ Sharp is not installed. Skipping favicon generation.');
  console.warn('To generate favicons, run: npm install --save-dev sharp');
  process.exit(0);
}

// SVG content for the favicon
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="24" fill="url(#grad)" />
  <path d="M50 26 L68 42 L62 42 L62 68 L38 68 L38 42 L32 42 L50 26Z" 
        fill="white" fill-opacity="0.95" />
  <path d="M38 42 L32 42 L32 48 L38 48 L38 42Z" fill="white" fill-opacity="0.6" />
  <path d="M62 42 L68 42 L68 48 L62 48 L62 42Z" fill="white" fill-opacity="0.6" />
  <path d="M42 52 L58 52 L58 58 L42 58 L42 52Z" fill="white" fill-opacity="0.6" />
</svg>
`;

// Save SVG
fs.writeFileSync(path.join(outputDir, 'favicon.svg'), svgContent);
console.log('✅ Generated favicon.svg');

// Generate PNGs for different sizes
const sizes = [16, 32, 192, 512];
const svgBuffer = Buffer.from(svgContent);

// Process each size
const promises = sizes.map(size => {
  const filename = size === 192 ? 'android-chrome-192x192.png' :
                   size === 512 ? 'favicon-512x512.png' :
                   `favicon-${size}x${size}.png`;
  
  return sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(outputDir, filename))
    .then(() => console.log(`✅ Generated ${filename}`))
    .catch(err => console.error(`❌ Failed to generate ${filename}:`, err));
});

// Generate apple-touch-icon (180x180)
promises.push(
  sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'))
    .then(() => console.log('✅ Generated apple-touch-icon.png'))
    .catch(err => console.error('❌ Failed to generate apple-touch-icon.png:', err))
);

// Generate favicon.ico as a PNG (modern browsers accept PNG as .ico)
promises.push(
  sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(outputDir, 'favicon.ico'))
    .then(() => console.log('✅ Generated favicon.ico (as 32x32 PNG)'))
    .catch(err => console.error('❌ Failed to generate favicon.ico:', err))
);

// Wait for all promises to complete
Promise.all(promises).then(() => {
  console.log('\n📁 All favicon files generated in /public folder');
  console.log('📝 Note: favicon.ico is saved as a PNG file with .ico extension');
  console.log('📝 This is supported by all modern browsers (Chrome, Firefox, Safari, Edge).');
});