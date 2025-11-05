import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { promises as fs } from 'fs';

import { watermarkConfig } from '../utils/config.js';

const OUTPUT_DIR = path.resolve(process.cwd(), 'wat-img');
const ALLOWED_GRAVITY = new Set([
  'center',
  'north',
  'northeast',
  'northwest',
  'south',
  'southeast',
  'southwest',
  'east',
  'west',
]);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeGravity = (gravity) => {
  if (!gravity) return 'southeast';
  const normalized = gravity.toLowerCase();
  return ALLOWED_GRAVITY.has(normalized) ? normalized : 'southeast';
};

const escapeXml = (unsafe) =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const createSvgOverlay = (text, { fontSize, padding, opacity }, metadata) => {
  const resolvedText = String(text || '');
  const safeText = escapeXml(resolvedText);
  const approximateWidth = Math.ceil(safeText.length * fontSize * 0.6 + padding * 2);
  const approximateHeight = Math.ceil(fontSize + padding * 2);

  const baseWidth = Math.max(metadata.width || approximateWidth, 1);
  const baseHeight = Math.max(metadata.height || approximateHeight, 1);

  const widthScale = Math.min(1, baseWidth / approximateWidth);
  const heightScale = Math.min(1, baseHeight / approximateHeight);
  const scale = Math.max(Math.min(widthScale, heightScale), 0.01);

  const finalWidth = Math.max(Math.round(approximateWidth * scale), 1);
  const finalHeight = Math.max(Math.round(approximateHeight * scale), 1);
  const finalFontSize = Math.max(Math.round(fontSize * scale), 6);
  const finalPadding = Math.max(Math.round(padding * scale), 0);

  return `<?xml version="1.0"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${finalWidth}" height="${finalHeight}">
    <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,${opacity * 0.35})" rx="${Math.max(finalPadding / 2, 0)}" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,${clamp(opacity + 0.2, 0, 1)})" font-family="Arial, Helvetica, sans-serif" font-size="${finalFontSize}" font-weight="600">
      ${safeText}
    </text>
  </svg>`;
};

const ensureOutputDir = async () => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
};

const buildCompositeForText = async (metadata, config) => {
  const svgOverlay = createSvgOverlay(config.text, config, metadata);
  const normalizedWidth = metadata.width ? Math.max(Math.round(metadata.width), 1) : undefined;
  const normalizedHeight = metadata.height ? Math.max(Math.round(metadata.height), 1) : undefined;

  const overlayBuffer = await sharp(Buffer.from(svgOverlay))
    .ensureAlpha()
    .resize({
      width: normalizedWidth,
      height: normalizedHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  return {
    input: overlayBuffer,
    gravity: normalizeGravity(config.position),
  };
};

const buildCompositeForImage = async (metadata, config) => {
  const { width } = metadata;
  const targetWidth = width ? Math.round(width * 0.3) : 512;
  const overlayBuffer = await sharp(config.imagePath)
    .ensureAlpha()
    .resize({
      width: targetWidth,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer();

  return {
    input: overlayBuffer,
    gravity: normalizeGravity(config.position),
    blend: 'over',
    opacity: clamp(config.opacity, 0, 1),
  };
};

const getOutputFormat = (metadataFormat) => {
  if (metadataFormat === 'jpeg' || metadataFormat === 'png' || metadataFormat === 'webp') {
    return metadataFormat;
  }
  return 'png';
};

export const addWatermark = async (file, overrides = {}) => {
  await ensureOutputDir();

  if (!file?.buffer) {
    throw new Error('Invalid file buffer');
  }

  const config = {
    ...watermarkConfig,
    ...overrides,
  };

  const normalizedConfig = {
    ...config,
    opacity: clamp(Number.isFinite(Number(config.opacity)) ? Number(config.opacity) : watermarkConfig.opacity, 0, 1),
    fontSize: Number.isFinite(Number(config.fontSize)) && Number(config.fontSize) > 0
      ? Number(config.fontSize)
      : watermarkConfig.fontSize,
    padding: Number.isFinite(Number(config.padding)) && Number(config.padding) >= 0
      ? Number(config.padding)
      : watermarkConfig.padding,
  };

  if (!normalizedConfig.text && !normalizedConfig.imagePath) {
    throw new Error('Watermark configuration requires text or image');
  }

  const baseName = file.originalname?.replace(/\s+/g, '-').toLowerCase() || 'image.png';
  const extension = path.extname(baseName) || '.png';
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const outputPath = path.join(OUTPUT_DIR, uniqueName);

  const pipeline = sharp(file.buffer).ensureAlpha();
  const metadata = await pipeline.metadata();

  const composite = normalizedConfig.imagePath
    ? await buildCompositeForImage(metadata, normalizedConfig)
    : await buildCompositeForText(metadata, normalizedConfig);

  let output = pipeline.composite([composite]);

  const format = getOutputFormat(metadata.format);

  if (format === 'jpeg') {
    output = output.jpeg({ quality: clamp(normalizedConfig.outputQuality, 1, 100) });
  } else if (format === 'png') {
    output = output.png({ quality: clamp(normalizedConfig.outputQuality, 1, 100), compressionLevel: 9 });
  } else if (format === 'webp') {
    output = output.webp({ quality: clamp(normalizedConfig.outputQuality, 1, 100) });
  }

  await output.toFile(outputPath);

  return {
    filename: uniqueName,
    outputPath,
    relativePath: `/wat-img/${uniqueName}`,
  };
};

export const ensureWatermarkDir = ensureOutputDir;
