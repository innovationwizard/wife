const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateOGImage() {
  const svgPath = path.join(__dirname, '../public/message-circle-heart.svg');
  const outputPath = path.join(__dirname, '../public/og-image.png');
  
  // Read SVG
  const svgBuffer = fs.readFileSync(svgPath);
  
  // Create white background
  const whiteBackground = sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  });
  
  // Resize SVG icon to 600x600 (fits within 630px height)
  // Use white background to ensure no transparency issues
  const iconBuffer = await sharp(svgBuffer)
    .resize(600, 600, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 } // Solid white background
    })
    .png()
    .toBuffer();
  
  // Composite icon on white background
  // Ensure output has no alpha channel (solid RGB)
  await whiteBackground
    .composite([{
      input: iconBuffer,
      gravity: 'center'
    }])
    .removeAlpha() // Remove transparency to ensure solid image
    .png({
      compressionLevel: 9,
      quality: 100
    })
    .toFile(outputPath);
  
  console.log('OG image generated successfully at', outputPath);
}

generateOGImage().catch(console.error);
