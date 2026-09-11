import { decodeImage, fitDimensions, canvasContext } from "./images.js";

export const PRESETS = {
  gentle: {
    maxDimension: 2560,
    quality: 0.88,
    note: "a little trim. keeps the finer details.",
  },
  balanced: {
    maxDimension: 1600,
    quality: 0.75,
    note: "the sweet spot. looks gud. weighs less.",
  },
  tiny: {
    maxDimension: 960,
    quality: 0.48,
    note: "maximum small. some pixels will be missed.",
  },
};

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const unit = bytes < 1024 * 1024 ? "KB" : "MB";
  const value = bytes / (unit === "KB" ? 1024 : 1024 * 1024);
  return `${Number(value.toFixed(value < 10 ? 2 : 1))} ${unit}`;
}

function encodeCanvas(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              new Error("the pixels refused to cooperate. try another image."),
            ),
      "image/webp",
      quality,
    );
  });
}

export async function compressImage(file, presetName) {
  const preset = PRESETS[presetName] ?? PRESETS.balanced;
  let bitmap;
  let canvas;
  try {
    bitmap = await decodeImage(file);
    const size = fitDimensions(
      bitmap.width,
      bitmap.height,
      preset.maxDimension,
    );
    canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvasContext(canvas);
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const encoded = await encodeCanvas(canvas, preset.quality);
    const smaller = encoded.size < file.size;
    const blob = smaller ? encoded : file;
    const extension = encoded.type === "image/webp" ? "webp" : "png";
    const name = smaller
      ? `${file.name.replace(/\.[^.]+$/, "") || "image"}-gud.${extension}`
      : file.name;
    return {
      blob,
      name,
      smaller,
      savedPercent: Math.min(99, Math.round((1 - blob.size / file.size) * 100)),
    };
  } catch (error) {
    if (error instanceof DOMException)
      throw new Error(
        "could not read that image. it may be damaged or unsupported. try another one.",
      );
    throw error;
  } finally {
    bitmap?.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
