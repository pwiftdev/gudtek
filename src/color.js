import { get, announce, setError, bindCopy, bindImageInput } from "./ui.js";
import { decodeImage, canvasContext, fitDimensions } from "./images.js";

export function initColor() {
  const canvas = get("color-canvas");
  let bitmap;
  let version = 0;
  let x = 0;
  let y = 0;
  const sample = document.createElement("canvas");
  sample.width = sample.height = 1;

  function pick(nextX, nextY) {
    if (!bitmap) return;
    x = Math.max(0, Math.min(bitmap.width - 1, Math.floor(nextX)));
    y = Math.max(0, Math.min(bitmap.height - 1, Math.floor(nextY)));
    const context = canvasContext(sample, { willReadFrequently: true });
    context.clearRect(0, 0, 1, 1);
    context.drawImage(bitmap, x, y, 1, 1, 0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    const hex =
      "#" +
      [r, g, b, ...(a < 255 ? [a] : [])]
        .map((channel) => channel.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
    const rgb =
      a === 255
        ? `rgb(${r}, ${g}, ${b})`
        : `rgba(${r}, ${g}, ${b}, ${Number((a / 255).toFixed(3))})`;
    get("color-hex").value = hex;
    get("color-rgb").value = rgb;
    get("color-swatch").style.backgroundColor = rgb;
    get("color-position").textContent =
      `pixel ${x}, ${y} · ${bitmap.width} × ${bitmap.height}`;
    announce(`color ${hex}, pixel ${x}, ${y}`);
  }

  async function load(file) {
    if (!file) return;
    const current = ++version;
    setError("color-error");
    get("color-drop").setAttribute("aria-busy", "true");
    announce("reading colorful thing.");
    let next;
    try {
      next = await decodeImage(file);
      if (current !== version) {
        next.close();
        return;
      }
      const size = fitDimensions(next.width, next.height, 1200);
      canvas.width = size.width;
      canvas.height = size.height;
      canvasContext(canvas).drawImage(next, 0, 0, size.width, size.height);
      bitmap?.close();
      bitmap = next;
      next = null;
      get("color-empty").hidden = true;
      get("color-image-wrap").hidden = false;
      get("color-result").hidden = false;
      get("color-choose").textContent = "choose another image";
      pick(bitmap.width / 2, bitmap.height / 2);
    } catch (error) {
      next?.close();
      if (current === version) setError("color-error", error.message);
    } finally {
      if (current === version)
        get("color-drop").setAttribute("aria-busy", "false");
    }
  }

  bindImageInput({
    inputId: "color-input",
    buttonId: "color-choose",
    dropId: "color-drop",
    errorId: "color-error",
    onFile: load,
  });
  canvas.addEventListener("click", (event) => {
    if (!bitmap) return;
    const bounds = canvas.getBoundingClientRect();
    pick(
      ((event.clientX - bounds.left) / bounds.width) * bitmap.width,
      ((event.clientY - bounds.top) / bounds.height) * bitmap.height,
    );
  });
  canvas.addEventListener("keydown", (event) => {
    const movement = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    pick(x + movement[0] * step, y + movement[1] * step);
  });
  bindCopy("color-hex-copy", "color-hex", "color-error");
  bindCopy("color-rgb-copy", "color-rgb", "color-error");
  return load;
}
