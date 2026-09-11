import { test, expect } from "@playwright/test";

async function makeImage(
  page,
  { width = 2000, height = 1200, transparent = false } = {},
) {
  const base64 = await page.evaluate(
    ({ width, height, transparent }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      const pixels = context.createImageData(width, height);
      let seed = 42;
      for (let i = 0; i < pixels.data.length; i += 4) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        pixels.data[i] = seed & 255;
        pixels.data[i + 1] = (seed >>> 8) & 255;
        pixels.data[i + 2] = (seed >>> 16) & 255;
        pixels.data[i + 3] = transparent && i < width * 4 * 50 ? 0 : 255;
      }
      context.putImageData(pixels, 0, 0);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    { width, height, transparent },
  );
  return {
    name: "big-picture.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  };
}

async function outputInfo(page) {
  return page.evaluate(async () => {
    const blob = await (
      await fetch(document.getElementById("download-file").href)
    ).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0);
    const result = {
      size: blob.size,
      type: blob.type,
      width: bitmap.width,
      height: bitmap.height,
      alpha: context.getImageData(0, 0, 1, 1).data[3],
    };
    bitmap.close();
    return result;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/#file");
});

test("compresses, preserves transparency, changes size, and downloads", async ({
  page,
}) => {
  const file = await makeImage(page, { transparent: true });
  await page.locator("#file-input").setInputFiles(file);
  await expect(page.locator("#result-view")).toBeVisible();
  const balanced = await outputInfo(page);
  expect(balanced.size).toBeLessThan(file.buffer.length);
  expect(balanced.type).toBe("image/webp");
  expect(balanced.width).toBe(1600);
  expect(balanced.height).toBe(960);
  expect(balanced.alpha).toBe(0);
  await page.getByText("absolutely tiny", { exact: true }).click();
  await expect(page.locator("#result-view")).toBeVisible();
  const tiny = await outputInfo(page);
  expect(tiny.width).toBe(960);
  expect(tiny.size).toBeLessThan(balanced.size);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-file").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("big-picture-gud.webp");
  expect(await download.failure()).toBeNull();
  await page.locator("#start-over").click();
  await expect(page.locator("#upload-view")).toBeVisible();
  await expect(page.locator("#choose-file")).toBeFocused();
});

test("keeps the original when encoding would increase its size", async ({
  page,
}) => {
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      original.call(
        this,
        (blob) =>
          callback(
            new Blob([blob, new Uint8Array(100000)], { type: "image/webp" }),
          ),
        ...args,
      );
    };
  });
  const file = await makeImage(page, { width: 4, height: 4 });
  await page.locator("#file-input").setInputFiles(file);
  await expect(page.locator("#result-label")).toHaveText("file already small.");
  expect((await outputInfo(page)).size).toBe(file.buffer.length);
  await expect(page.locator("#download-file")).toHaveAttribute(
    "download",
    file.name,
  );
});

test("rejects unsupported, empty, and damaged files and can recover", async ({
  page,
}) => {
  await page.locator("#file-input").setInputFiles({
    name: "no.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(page.getByRole("alert")).toContainText("try a JPG");
  await page.locator("#file-input").setInputFiles({
    name: "empty.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(0),
  });
  await expect(page.getByRole("alert")).toContainText("empty");
  await page.locator("#file-input").setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.getByRole("alert")).toContainText("could not read");
  await expect(page.locator("#upload-view")).toBeVisible();
  await page
    .locator("#file-input")
    .setInputFiles(await makeImage(page, { width: 100, height: 100 }));
  await expect(page.locator("#result-view")).toBeVisible();
  await expect(page.getByRole("alert")).toBeHidden();
});

test("validates size and dimensions, and handles encoder failure", async ({
  page,
}) => {
  const sizeError = await page.evaluate(async () => {
    const { validateFile } = await import("/src/images.js");
    try {
      validateFile({ type: "image/png", size: 41 * 1024 * 1024 });
    } catch (error) {
      return error.message;
    }
  });
  expect(sizeError).toContain("40 MB");
  const dimensionError = await page.evaluate(async () => {
    const original = window.createImageBitmap;
    let closed = false;
    window.createImageBitmap = async () => ({
      width: 10000,
      height: 10000,
      close: () => {
        closed = true;
      },
    });
    try {
      const { compressImage } = await import("/src/compress.js");
      await compressImage(
        new File(["test"], "test.png", { type: "image/png" }),
        "balanced",
      );
    } catch (error) {
      return { message: error.message, closed };
    } finally {
      window.createImageBitmap = original;
    }
  });
  expect(dimensionError.message).toContain("60 megapixels");
  expect(dimensionError.closed).toBe(true);
  const file = await makeImage(page, { width: 100, height: 100 });
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = (callback) => callback(null);
  });
  await page.locator("#file-input").setInputFiles(file);
  await expect(page.getByRole("alert")).toContainText("pixels refused");
  await expect(page.locator("#upload-view")).toBeVisible();
});

test("a slow old job cannot replace the latest compression setting", async ({
  page,
}) => {
  const file = await makeImage(page);
  await page.evaluate(() => {
    const original = window.createImageBitmap.bind(window);
    let calls = 0;
    window.createImageBitmap = async (...args) => {
      const bitmap = await original(...args);
      if (++calls === 1)
        await new Promise((resolve) => setTimeout(resolve, 700));
      return bitmap;
    };
  });
  await page.locator("#file-input").setInputFiles(file);
  await page.getByText("absolutely tiny", { exact: true }).click();
  await expect(page.locator("#result-view")).toBeVisible();
  expect((await outputInfo(page)).width).toBe(960);
  await page.waitForTimeout(900);
  expect((await outputInfo(page)).width).toBe(960);
});

test("drop and clipboard input work", async ({ page }) => {
  const file = await makeImage(page, { width: 150, height: 100 });
  async function dispatch(kind) {
    await page.evaluate(
      ({ data, kind }) => {
        const transfer = new DataTransfer();
        transfer.items.add(
          new File(
            [Uint8Array.from(atob(data), (char) => char.charCodeAt(0))],
            "pasted.png",
            { type: "image/png" },
          ),
        );
        if (kind === "drop")
          document.getElementById("drop-zone").dispatchEvent(
            new DragEvent("drop", {
              dataTransfer: transfer,
              bubbles: true,
              cancelable: true,
            }),
          );
        else
          document.dispatchEvent(
            new ClipboardEvent("paste", {
              clipboardData: transfer,
              bubbles: true,
              cancelable: true,
            }),
          );
      },
      { data: file.buffer.toString("base64"), kind },
    );
  }
  await dispatch("drop");
  await expect(page.locator("#result-view")).toBeVisible();
  await page.locator("#start-over").click();
  await dispatch("paste");
  await expect(page.locator("#result-view")).toBeVisible();
});

test("mobile layout fits and the meme loads", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator("#choose-file")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator("#file-tool .meme-image")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/gud-tek-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({ path: "/tmp/gud-tek-desktop.png", fullPage: true });
});
