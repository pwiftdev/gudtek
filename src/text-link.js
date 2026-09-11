import { get, announce, setError, bindCopy } from "./ui.js";

const TRACKING_KEYS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "twclid",
  "ttclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "_ga",
  "_gl",
  "vero_id",
  "oly_anon_id",
  "oly_enc_id",
]);

export function cleanText(text, mode, trimSpaces) {
  let output = text.replace(/\r\n?/g, "\n");
  if (mode === "lower") output = output.toLowerCase();
  if (mode === "upper") output = output.toUpperCase();
  if (mode === "invert")
    output = Array.from(output, (letter) =>
      letter === letter.toUpperCase()
        ? letter.toLowerCase()
        : letter.toUpperCase(),
    ).join("");
  if (mode === "sentence")
    output = output
      .toLowerCase()
      .replace(
        /(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu,
        (_, prefix, letter) => prefix + letter.toUpperCase(),
      );
  if (trimSpaces)
    output = output
      .split("\n")
      .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  return output;
}

export function cleanLink(input) {
  const raw = input.trim();
  if (!raw) throw new Error("give us a link first.");
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      "that does not look like a full link. include https:// at the start.",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !url.hostname ||
    url.username ||
    url.password
  )
    throw new Error(
      "use an http or https link without a username or password.",
    );
  const hashIndex = raw.indexOf("#");
  const hash = hashIndex < 0 ? "" : raw.slice(hashIndex);
  const beforeHash = hashIndex < 0 ? raw : raw.slice(0, hashIndex);
  const queryIndex = beforeHash.indexOf("?");
  if (queryIndex < 0) return { value: raw, removed: 0 };
  let removed = 0;
  const parts = beforeHash
    .slice(queryIndex + 1)
    .split("&")
    .filter((part) => {
      const key = new URLSearchParams(part).keys().next().value?.toLowerCase();
      const tracking = key?.startsWith("utm_") || TRACKING_KEYS.has(key);
      if (tracking) removed++;
      return !tracking;
    });
  if (!removed) return { value: raw, removed };
  return {
    value:
      beforeHash.slice(0, queryIndex) +
      (parts.length && parts.some(Boolean) ? `?${parts.join("&")}` : "") +
      hash,
    removed,
  };
}

export function initTextLink() {
  const invalidate = (prefix) => {
    get(`${prefix}-result`).hidden = true;
    setError(`${prefix}-error`);
  };
  get("text-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = get("text-input").value;
    if (!value.trim()) {
      setError("text-error", "need some words first.");
      return;
    }
    get("text-output").value = cleanText(
      value,
      get("text-mode").value,
      get("text-spaces").checked,
    );
    get("text-result").hidden = false;
    setError("text-error");
    announce("words normal now. ready to copy.");
  });
  get("text-input").addEventListener("input", () => invalidate("text"));
  get("text-mode").addEventListener("change", () => invalidate("text"));
  get("text-spaces").addEventListener("change", () => invalidate("text"));
  get("link-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const result = cleanLink(get("link-input").value);
      get("link-output").value = result.value;
      get("link-summary").textContent = result.removed
        ? `link got haircut. ${result.removed} tracking ${result.removed === 1 ? "parameter" : "parameters"} removed.`
        : "already a tidy link. nothing to remove.";
      get("link-result").hidden = false;
      setError("link-error");
      announce(get("link-summary").textContent);
    } catch (error) {
      invalidate("link");
      setError("link-error", error.message);
    }
  });
  get("link-input").addEventListener("input", () => invalidate("link"));
  for (const tool of ["text", "link"])
    bindCopy(`${tool}-copy`, `${tool}-output`, `${tool}-error`);
}
