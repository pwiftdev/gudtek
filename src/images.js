const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 40 * 1024 * 1024;

export function validateFile(file) {
  if (!SUPPORTED_TYPES.has(file.type))
    throw new Error(
      "this file is a little too mysterious. try a JPG, PNG, or WebP.",
    );
  if (file.size === 0)
    throw new Error("this file is empty. it is already too small.");
  if (file.size > MAX_FILE_SIZE)
    throw new Error("that is one very big file. try an image under 40 MB.");
}

export async function decodeImage(file) {
  validateFile(file);
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "could not read that image. it may be damaged or unsupported. try another one.",
    );
  }
  if (bitmap.width * bitmap.height > 60_000_000) {
    bitmap.close();
    throw new Error(
      "too many pixels for this little machine. try an image under 60 megapixels.",
    );
  }
  return bitmap;
}

export function fitDimensions(width, height, maximum) {
  const scale = Math.min(1, maximum / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function canvasContext(canvas, options) {
  const context = canvas.getContext("2d", options);
  if (!context)
    throw new Error(
      "your browser could not start the image tool. try a newer browser.",
    );
  return context;
}
