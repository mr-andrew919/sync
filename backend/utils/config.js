import path from 'path';

const resolveFromRoot = (maybeRelativePath) => {
  if (!maybeRelativePath) {
    return null;
  }

  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(process.cwd(), maybeRelativePath);
};

export const watermarkConfig = {
  text: process.env.WATERMARK_TEXT || '© Watermark',
  imagePath: resolveFromRoot(process.env.WATERMARK_IMAGE),
  position: process.env.WATERMARK_POSITION || 'southeast',
  opacity: Number.isFinite(Number(process.env.WATERMARK_OPACITY))
    ? Number(process.env.WATERMARK_OPACITY)
    : 0.5,
  fontSize: Number.isFinite(Number(process.env.WATERMARK_FONT_SIZE))
    ? Number(process.env.WATERMARK_FONT_SIZE)
    : 36,
  padding: Number.isFinite(Number(process.env.WATERMARK_PADDING))
    ? Number(process.env.WATERMARK_PADDING)
    : 32,
  outputQuality: Number.isFinite(Number(process.env.WATERMARK_QUALITY))
    ? Number(process.env.WATERMARK_QUALITY)
    : 90,
};


