import sharp from 'sharp';

export type ImagePreset = 'workerPhoto' | 'avatar' | 'contentImage';

type PresetConfig = {
  width: number;
  height: number | null;
  quality: number;
  // 'cover' hard-crops to exactly width x height (headshots/avatars).
  // 'inside' only caps the max width, preserving aspect ratio (article images).
  fit: 'cover' | 'inside';
};

const PRESETS: Record<ImagePreset, PresetConfig> = {
  workerPhoto:  { width: 400,  height: 400, quality: 85, fit: 'cover' },
  avatar:       { width: 200,  height: 200, quality: 80, fit: 'cover' },
  contentImage: { width: 1600, height: null, quality: 82, fit: 'inside' },
};

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

export type ImageFormat = 'jpeg' | 'webp';

// `format` defaults to JPEG so every existing caller (private passport /
// traveller photos, which are PII viewed back in the admin and may be
// embedded elsewhere) keeps its current output. Public website images opt
// in to 'webp'.
export async function processImage(
  buffer: Buffer,
  preset: ImagePreset,
  format: ImageFormat = 'jpeg',
): Promise<ProcessedImage> {
  const { width, height, quality, fit } = PRESETS[preset];
  const image = sharp(buffer).resize(width, height, {
    fit,
    position: 'center',
    withoutEnlargement: fit === 'inside',
  });
  const outBuffer = await (format === 'webp' ? image.webp({ quality }) : image.jpeg({ quality })).toBuffer();
  const { width: outWidth, height: outHeight } = await sharp(outBuffer).metadata();

  return { buffer: outBuffer, width: outWidth ?? width, height: outHeight ?? (height ?? width) };
}
