import QRCode from "qrcode";
import { get, announce, setError } from "./ui.js";
import { canvasContext } from "./images.js";

export function initQr() {
  let version = 0;
  let outputUrl;
  function clearResult() {
    version++;
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = null;
    get("qr-download").removeAttribute("href");
    get("qr-result").hidden = true;
    setError("qr-error");
  }
  get("qr-input").addEventListener("input", clearResult);
  get("qr-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearResult();
    const current = version;
    const text = get("qr-input").value;
    if (!text.trim()) {
      setError("qr-error", "the square needs something to say.");
      return;
    }
    if (new TextEncoder().encode(text).length > 2000) {
      setError(
        "qr-error",
        "too much wisdom for one square. keep it under 2,000 UTF-8 bytes.",
      );
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, text, {
        errorCorrectionLevel: "M",
        margin: 4,
        scale: 8,
        color: { dark: "#292a24", light: "#ffffff" },
      });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (current !== version) return;
      if (!blob) throw new Error("could not create the image");
      const preview = get("qr-canvas");
      preview.width = canvas.width;
      preview.height = canvas.height;
      canvasContext(preview).drawImage(canvas, 0, 0);
      outputUrl = URL.createObjectURL(blob);
      get("qr-download").href = outputUrl;
      get("qr-result").hidden = false;
      announce("made you a square. ready to download.");
    } catch {
      if (current === version)
        setError(
          "qr-error",
          "square machine had a moment. try shorter text or a newer browser.",
        );
    }
  });
}
