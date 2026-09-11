import { compressImage, formatBytes, PRESETS } from "./compress.js";
import { validateFile } from "./images.js";
import { get, announce, setError, bindImageInput } from "./ui.js";

const dropZone = get("drop-zone");
const errorMessage = get("error-message");
const views = ["upload", "processing", "result"];
let sourceFile = null;
let resultUrl = null;
let jobId = 0;

function setView(view) {
  for (const name of views) get(`${name}-view`).hidden = name !== view;
  dropZone.setAttribute("aria-busy", String(view === "processing"));
}

function releaseResult() {
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = null;
  get("result-preview").removeAttribute("src");
  get("download-file").removeAttribute("href");
}

function showError(message) {
  setError("error-message", message);
}

function showResult(file, result) {
  releaseResult();
  resultUrl = URL.createObjectURL(result.blob);
  get("result-preview").src = resultUrl;
  get("file-name").textContent = file.name;
  get("original-size").textContent = formatBytes(file.size);
  get("compressed-size").textContent = formatBytes(result.blob.size);
  get("savings-badge").textContent = result.smaller
    ? `${result.savedPercent || "<1"}% smaller`
    : "original kept";
  get("result-label").textContent = result.smaller
    ? "file small now."
    : "file already small.";
  get("result-message").textContent = result.smaller
    ? "less baggage. same emotional support image."
    : "couldn’t make it smaller. keeping your original intact.";
  get("download-file").href = resultUrl;
  get("download-file").download = result.name;
  setView("result");
  announce(
    `${get("result-label").textContent} ${formatBytes(file.size)} to ${formatBytes(result.blob.size)}. Ready to download.`,
  );
}

export async function processFile(file) {
  if (!file) return;
  try {
    validateFile(file);
  } catch (error) {
    showError(error.message);
    return;
  }
  const currentJob = ++jobId;
  sourceFile = file;
  errorMessage.hidden = true;
  setView("processing");
  announce("making file small.");
  const preset = document.querySelector(
    'input[name="compression"]:checked',
  ).value;
  try {
    const result = await compressImage(file, preset);
    if (currentJob !== jobId) return;
    showResult(file, result);
  } catch (error) {
    if (currentJob !== jobId) return;
    releaseResult();
    sourceFile = null;
    setView("upload");
    announce("");
    showError(error.message || "something went un-gud. try another image.");
  }
}

get("start-over").addEventListener("click", () => {
  jobId++;
  sourceFile = null;
  releaseResult();
  errorMessage.hidden = true;
  announce("");
  setView("upload");
  get("choose-file").focus();
});

document.querySelectorAll('input[name="compression"]').forEach((input) => {
  input.addEventListener("change", () => {
    get("quality-note").textContent = PRESETS[input.value].note;
    if (sourceFile) processFile(sourceFile);
  });
});

bindImageInput({
  inputId: "file-input",
  buttonId: "choose-file",
  dropId: "drop-zone",
  errorId: "error-message",
  onFile: processFile,
});
