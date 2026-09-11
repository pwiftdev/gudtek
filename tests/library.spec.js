import { test, expect } from "@playwright/test";
import jsQR from "jsqr";

test("library links, back navigation, and narrow layouts work", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".tool-card")).toHaveCount(5);
  await page.getByRole("link", { name: /why text weird/ }).click();
  await expect(page.locator("#text-tool")).toBeVisible();
  await expect(page.locator("#file-tool")).toBeHidden();
  await page.goBack();
  await expect(page.locator("#library")).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: "/tmp/gud-tek-library-mobile.png",
    fullPage: true,
  });
  for (const id of ["", "file", "text", "link", "color", "qr"]) {
    await page.goto(`/#${id}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (id) await expect(page.locator(`#${id}-tool`)).toBeVisible();
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await page.screenshot({
    path: "/tmp/gud-tek-library-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("text cleanup preserves paragraphs, changes case, copies, and clears stale results", async ({
  page,
}) => {
  await page.goto("/#text");
  await page
    .locator("#text-input")
    .fill("  hELLO   WORLD!\n\n\n tHIS\tIS TEXT.  ");
  await page.locator("#text-mode").selectOption("sentence");
  await page.getByRole("button", { name: "make words normal" }).click();
  await expect(page.locator("#text-output")).toHaveValue(
    "Hello world!\n\nThis is text.",
  );
  await page.evaluate(() => {
    navigator.clipboard.writeText = async (text) => {
      window.copiedText = text;
    };
  });
  await page.locator("#text-copy").click();
  expect(await page.evaluate(() => window.copiedText)).toBe(
    "Hello world!\n\nThis is text.",
  );
  await page.locator("#text-mode").selectOption("invert");
  await expect(page.locator("#text-result")).toBeHidden();
  await page.locator("#text-input").fill("i ACCIDENTALLY tYPED lIKE tHIS");
  await page.getByRole("button", { name: "make words normal" }).click();
  await expect(page.locator("#text-output")).toHaveValue(
    "I accidentally Typed Like This",
  );
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error("denied");
    };
  });
  await page.locator("#text-copy").click();
  await expect(page.locator("#text-error")).toContainText("copy it manually");
  await expect(page.locator("#text-output")).toBeFocused();
  await page.locator("#text-input").fill(" ");
  await page.getByRole("button", { name: "make words normal" }).click();
  await expect(page.locator("#text-error")).toContainText("need some words");
  await expect(page.locator("#text-result")).toBeHidden();
});

test("plain text keeps case and spacing when requested, including literal markup", async ({
  page,
}) => {
  await page.goto("/#text");
  const value = '<script>alert("hello")</script>\n  Éléphant   CAT';
  await page.locator("#text-input").fill(value);
  await page.locator("#text-spaces").uncheck();
  await page.getByRole("button", { name: "make words normal" }).click();
  await expect(page.locator("#text-output")).toHaveValue(value);
  await page.locator("#text-mode").selectOption("lower");
  await page.getByRole("button", { name: "make words normal" }).click();
  await expect(page.locator("#text-output")).toHaveValue(value.toLowerCase());
  await page.locator("#text-mode").selectOption("upper");
  await page.getByRole("button", { name: "make words normal" }).click();
  await expect(page.locator("#text-output")).toHaveValue(value.toUpperCase());
});

test("link cleaner removes only known trackers and preserves encoded queries and anchors", async ({
  page,
}) => {
  await page.goto("/#link");
  await page
    .locator("#link-input")
    .fill(
      "https://example.com/a%2fb?utm_source=x&item=a%20b&item=a+b&ref=keep&%66bclid=no&UTM_MEDIUM=email&signature=x%2Fy%3D#part?utm_source=keep",
    );
  await page.getByRole("button", { name: "give link haircut" }).click();
  await expect(page.locator("#link-output")).toHaveValue(
    "https://example.com/a%2fb?item=a%20b&item=a+b&ref=keep&signature=x%2Fy%3D#part?utm_source=keep",
  );
  await expect(page.locator("#link-summary")).toContainText(
    "3 tracking parameters",
  );
  await page.locator("#link-input").fill("https://example.com/?q=a%20b#top");
  await expect(page.locator("#link-result")).toBeHidden();
  await page.getByRole("button", { name: "give link haircut" }).click();
  await expect(page.locator("#link-output")).toHaveValue(
    "https://example.com/?q=a%20b#top",
  );
  await expect(page.locator("#link-summary")).toContainText(
    "nothing to remove",
  );
  for (const value of [
    "javascript:alert(1)",
    "https://user:password@example.com",
    "not a link",
    "",
  ]) {
    await page.locator("#link-input").fill(value);
    await page.getByRole("button", { name: "give link haircut" }).click();
    await expect(page.locator("#link-error")).toBeVisible();
    await expect(page.locator("#link-result")).toBeHidden();
  }
});

async function colorImage(page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2000;
    canvas.height = 100;
    const context = canvas.getContext("2d");
    context.fillStyle = "#123456";
    context.fillRect(0, 0, 1000, 100);
    context.fillStyle = "#ABCDEF";
    context.fillRect(1000, 0, 1000, 100);
    context.clearRect(1001, 50, 1, 1);
    return canvas.toDataURL().split(",")[1];
  });
  return {
    name: "colors.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  };
}

test("color picker reads original pixels, supports keyboard and transparency, and recovers from bad files", async ({
  page,
}) => {
  await page.goto("/#color");
  await page.locator("#color-input").setInputFiles(await colorImage(page));
  await expect(page.locator("#color-result")).toBeVisible();
  await expect(page.locator("#color-hex")).toHaveValue("#ABCDEF");
  await expect(page.locator("#color-rgb")).toHaveValue("rgb(171, 205, 239)");
  await expect(page.locator("#color-canvas")).toHaveAttribute("width", "1200");
  await page.locator("#color-canvas").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#color-hex")).toHaveValue("#00000000");
  await expect(page.locator("#color-rgb")).toHaveValue("rgba(0, 0, 0, 0)");
  await page.keyboard.press("Shift+ArrowLeft");
  await expect(page.locator("#color-hex")).toHaveValue("#123456");
  const box = await page.locator("#color-canvas").boundingBox();
  await page
    .locator("#color-canvas")
    .click({ position: { x: box.width * 0.8, y: box.height * 0.5 } });
  await expect(page.locator("#color-hex")).toHaveValue("#ABCDEF");
  await page.evaluate(() => {
    navigator.clipboard.writeText = async (value) => {
      window.copiedText = value;
    };
  });
  await page.locator("#color-hex-copy").click();
  expect(await page.evaluate(() => window.copiedText)).toBe("#ABCDEF");
  await page.locator("#color-input").setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("broken"),
  });
  await expect(page.locator("#color-error")).toContainText("could not read");
  await page.locator("#color-input").setInputFiles(await colorImage(page));
  await expect(page.locator("#color-error")).toBeHidden();
  await page.screenshot({ path: "/tmp/gud-tek-color.png", fullPage: true });
});

test("QR PNG decodes to the exact input and stale results disappear", async ({
  page,
}) => {
  await page.goto("/#qr");
  const value = "https://example.com/gud?name=čudovit&thing=hello%20world#tek";
  await page.locator("#qr-input").fill(value);
  await page.getByRole("button", { name: "make square" }).click();
  await expect(page.locator("#qr-result")).toBeVisible();
  const pixels = await page.evaluate(async () => {
    const blob = await (
      await fetch(document.getElementById("qr-download").href)
    ).blob();
    const image = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    image.close();
    return {
      data: Array.from(pixels.data),
      width: pixels.width,
      height: pixels.height,
      type: blob.type,
    };
  });
  expect(pixels.type).toBe("image/png");
  expect(
    jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data,
  ).toBe(value);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#qr-download").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("gud-tek-qr.png");
  expect(await download.failure()).toBeNull();
  await page.screenshot({ path: "/tmp/gud-tek-qr.png", fullPage: true });
  await page.locator("#qr-input").fill("new value");
  await expect(page.locator("#qr-result")).toBeHidden();
  await expect(page.locator("#qr-download")).not.toHaveAttribute("href");
  await page.locator("#qr-input").fill("猫".repeat(700));
  await page.getByRole("button", { name: "make square" }).click();
  await expect(page.locator("#qr-error")).toContainText("2,000 UTF-8 bytes");
  await page.locator("#qr-input").fill("");
  await page.getByRole("button", { name: "make square" }).click();
  await expect(page.locator("#qr-error")).toContainText("needs something");
});

test("a pending QR encode cannot publish a result after its input changes", async ({
  page,
}) => {
  await page.goto("/#qr");
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      original.call(
        this,
        (blob) => {
          window.finishQr = () => callback(blob);
        },
        ...args,
      );
    };
  });
  await page.locator("#qr-input").fill("old square");
  await page.getByRole("button", { name: "make square" }).click();
  await page.waitForFunction(() => window.finishQr);
  await page.locator("#qr-input").fill("new square");
  await page.evaluate(() => window.finishQr());
  await expect(page.locator("#qr-result")).toBeHidden();
  await expect(page.locator("#qr-download")).not.toHaveAttribute("href");
});

test("color image paste stays in its own tool and a stale load cannot replace it", async ({
  page,
}) => {
  await page.goto("/#color");
  const file = await colorImage(page);
  await page.evaluate(() => {
    const original = window.createImageBitmap.bind(window);
    let calls = 0;
    window.createImageBitmap = async (...args) => {
      const call = ++calls;
      const bitmap = await original(...args);
      if (call === 1)
        await new Promise((resolve) => {
          window.finishOldColor = resolve;
        });
      return bitmap;
    };
  });
  await page
    .locator("#color-input")
    .setInputFiles({ ...file, name: "old.png" });
  await page.waitForFunction(() => window.finishOldColor);
  await page.evaluate((data) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(
        [Uint8Array.from(atob(data), (char) => char.charCodeAt(0))],
        "pasted.png",
        { type: "image/png" },
      ),
    );
    document.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: transfer,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, file.buffer.toString("base64"));
  await expect(page.locator("#color-result")).toBeVisible();
  await page.locator("#color-canvas").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#color-hex")).toHaveValue("#123456");
  await page.evaluate(() => window.finishOldColor());
  await expect(page.locator("#color-hex")).toHaveValue("#123456");
  await page
    .getByRole("link", { name: "image compressor", exact: true })
    .click();
  await expect(page.locator("#upload-view")).toBeVisible();
  await expect(page.locator("#result-view")).toBeHidden();
});

test("QR encoder failure leaves no download and allows another attempt", async ({
  page,
}) => {
  await page.goto("/#qr");
  await page.evaluate(() => {
    window.originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = (callback) => callback(null);
  });
  await page.locator("#qr-input").fill("hello gud tek");
  await page.getByRole("button", { name: "make square" }).click();
  await expect(page.locator("#qr-error")).toContainText("square machine");
  await expect(page.locator("#qr-result")).toBeHidden();
  await expect(page.locator("#qr-download")).not.toHaveAttribute("href");
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = window.originalToBlob;
  });
  await page.getByRole("button", { name: "make square" }).click();
  await expect(page.locator("#qr-result")).toBeVisible();
  await expect(page.locator("#qr-error")).toBeHidden();
});

test("project lore and header links are present, and COPY CA copies the exact address", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".lore")).toContainText("Gud Tek ($TEK)");
  await expect(page.locator(".lore")).toContainText("QQQx");
  await expect(page.locator(".lore a")).toHaveAttribute(
    "href",
    "https://www.stonkfun.xyz/",
  );
  await expect(
    page.getByRole("link", { name: "Gud Tek on X" }),
  ).toHaveAttribute("href", "https://x.com/gudtek_stonks");
  await page.evaluate(() => {
    navigator.clipboard.writeText = async (value) => {
      window.copiedCa = value;
    };
  });
  await page.locator("#copy-ca").click();
  await expect(page.locator("#ca-address")).toHaveValue(
    "4LUd8oKCfnwjutWi1bJ4oW5qsGXjdkwvwvAnEGLpzsKN",
  );
  await expect(page.locator("#ca-status")).toBeVisible();
  await expect(page.locator("#copy-ca")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(await page.evaluate(() => window.copiedCa)).toBe(
    "4LUd8oKCfnwjutWi1bJ4oW5qsGXjdkwvwvAnEGLpzsKN",
  );
  await expect(page.locator("#copy-ca [data-copy-label]")).toHaveText(
    "copied.",
  );
  await expect(page.locator("#copy-ca svg")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#ca-status")).toBeHidden();
  await expect(page.locator("#copy-ca")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error("denied");
    };
  });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#copy-ca").click();
  await expect(page.locator("#ca-error")).toContainText("copy it manually");
  await expect(page.locator("#ca-address")).toBeFocused();
  const bounds = await page.locator("#ca-status").boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
});
