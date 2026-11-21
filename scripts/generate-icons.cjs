const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const logoPath = path.join(publicDir, 'images', 'logo.jpeg');
const img = fs.readFileSync(logoPath);
const b64 = img.toString('base64');

// 1. Update favicon.svg with embedded base64 circular logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
  <defs>
    <clipPath id="circleClip">
      <circle cx="256" cy="256" r="256"/>
    </clipPath>
  </defs>
  <image width="512" height="512" clip-path="url(#circleClip)" xlink:href="data:image/jpeg;base64,${b64}"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

// 2. Write favicon.ico wrapping the image
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Type 1 = ICO
header.writeUInt16LE(1, 4); // 1 image
header.writeUInt8(0, 6);    // Width (0 = 256)
header.writeUInt8(0, 7);    // Height (0 = 256)
header.writeUInt8(0, 8);    // Colors
header.writeUInt8(0, 9);    // Reserved
header.writeUInt16LE(1, 10); // Color planes
header.writeUInt16LE(32, 12); // Bits per pixel
header.writeUInt32LE(img.length, 14); // Image data size
header.writeUInt32LE(22, 18); // Offset to image data

const ico = Buffer.concat([header, img]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), img);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), img);

// 3. Create site.webmanifest for PWA and Google Chrome mobile searches
const manifest = {
  name: "Beacon Wings Foundation",
  short_name: "BWF",
  description: "Beacon Wings Foundation (BWF) - Empowering underprivileged communities across India.",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#166534",
  icons: [
    {
      src: "/images/logo.jpeg",
      sizes: "192x192",
      type: "image/jpeg"
    },
    {
      src: "/images/logo.jpeg",
      sizes: "512x512",
      type: "image/jpeg"
    },
    {
      src: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png"
    }
  ]
};

fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

console.log('All icons and manifest generated successfully!');
