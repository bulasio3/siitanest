const sharp = require('sharp');

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildWatermarkSvg(width, height, label, fontSize, margin, textWidth) {
  const paddingX = Math.round(fontSize * 0.5);
  const paddingY = Math.round(fontSize * 0.35);
  const chipHeight = fontSize + paddingY * 2;
  const chipWidth = textWidth + paddingX * 2;
  const chipX = width - margin - chipWidth;
  const chipY = height - margin - chipHeight;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="${chipX}"
        y="${chipY}"
        width="${chipWidth}"
        height="${chipHeight}"
        rx="${Math.round(chipHeight * 0.2)}"
        fill="#000000"
        fill-opacity="0.38"
      />
      <text
        x="${width - margin - paddingX}"
        y="${height - margin - paddingY}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="600"
        fill="#ffffff"
        text-anchor="end"
      >${escapeXml(label)}</text>
    </svg>`;
}

/**
 * Burns a small "© <text>" watermark into the bottom-right corner of an
 * already-sized image buffer, and returns a final JPEG buffer. Used for
 * Gallery photos so the organization's ownership stays visible even if
 * someone downloads or right-clicks the image — unlike a caption shown
 * only on the webpage, this is baked into the actual image file.
 *
 * Expects `buffer` to already be rotated/resized to its final dimensions.
 */
async function addWatermark(buffer, text, quality = 82) {
  const meta = await sharp(buffer).metadata();
  const width = meta.width || 1200;
  const height = meta.height || 800;

  const label = `© ${text}`;
  const margin = Math.max(12, Math.round(width * 0.022));
  let fontSize = Math.max(14, Math.min(28, Math.round(width * 0.024)));

  // Rough width estimate for a sans-serif font (~0.58x font size per
  // character on average), so a long org name on a narrow photo doesn't
  // get clipped off the left edge of the image.
  const maxTextWidth = width - margin * 2;
  const estimatedWidth = () => label.length * fontSize * 0.58;
  while (estimatedWidth() > maxTextWidth && fontSize > 10) {
    fontSize -= 1;
  }

  const svg = buildWatermarkSvg(width, height, label, fontSize, margin, estimatedWidth());

  return sharp(buffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality })
    .toBuffer();
}

module.exports = { addWatermark };
