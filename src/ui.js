export const get = (id) => document.getElementById(id);

export function announce(message) {
  get("tool-status").textContent = message;
}

export function setError(id, message = "") {
  const element = get(id);
  element.textContent = message;
  element.hidden = !message;
}

export function bindCopy(buttonId, valueId, errorId) {
  get(buttonId).addEventListener("click", async () => {
    const field = get(valueId);
    const value = field.value ?? field.textContent;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setError(errorId);
      announce("copied. go paste it somewhere.");
      const button = get(buttonId);
      const label = button.querySelector("[data-copy-label]") ?? button;
      label.textContent = "copied.";
      setTimeout(() => {
        label.textContent = button.dataset.label;
      }, 1800);
    } catch {
      field.focus();
      field.select?.();
      setError(
        errorId,
        "clipboard unavailable. select the result and copy it manually.",
      );
    }
  });
}

export function bindImageInput({ inputId, buttonId, dropId, errorId, onFile }) {
  const input = get(inputId);
  const zone = get(dropId);
  let depth = 0;
  get(buttonId).addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    onFile(input.files[0]);
    input.value = "";
  });
  zone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    depth++;
    zone.classList.add("is-dragging");
  });
  zone.addEventListener("dragover", (event) => event.preventDefault());
  zone.addEventListener("dragleave", () => {
    depth = Math.max(0, depth - 1);
    if (!depth) zone.classList.remove("is-dragging");
  });
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    depth = 0;
    zone.classList.remove("is-dragging");
    if (event.dataTransfer.files.length > 1) {
      setError(errorId, "one big file at a time. we are only a little cat.");
      return;
    }
    onFile(event.dataTransfer.files[0]);
  });
}
