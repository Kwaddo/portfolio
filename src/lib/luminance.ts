import sharp from 'sharp';
import type { ImageMetadata } from 'astro';

export const isDarkBuffer = (data: Uint8Array): boolean => {
  if (data.length === 0) return false;
  let sum = 0;
  for (const v of data) sum += v;
  return sum / data.length < 90;
};

const cache = new Map<string, Promise<boolean>>();

/** Build-time: true when the image's mean luminance is low, so the halftone overlay must lighten instead of multiply. */
export async function isDark(img: ImageMetadata): Promise<boolean> {
  // Astro attaches the source path as a non-enumerable property on imported images.
  const path = (img as ImageMetadata & { fsPath?: string }).fsPath;
  if (!path) return false;
  let pending = cache.get(path);
  if (!pending) {
    // Promise.resolve first so a synchronous throw from sharp lands in the catch too.
    pending = Promise.resolve()
      .then(() => sharp(path).resize(32, 32, { fit: 'fill' }).greyscale().raw().toBuffer())
      .then((buf) => isDarkBuffer(new Uint8Array(buf)))
      .catch(() => false);
    cache.set(path, pending);
  }
  return pending;
}
