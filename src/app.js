import { TOOLS, libraryTemplate, toolsTemplate } from "./tool-templates.js";
import { get, announce, bindCopy } from "./ui.js";
import { initTextLink } from "./text-link.js";
import { initColor } from "./color.js";
import { initQr } from "./qr.js";
import { processFile } from "./main.js";
import "./library.css";

get("library").innerHTML = libraryTemplate();
get("extra-tools").innerHTML = toolsTemplate();
get("tool-nav").innerHTML =
  `<a href="#">← all teks</a><div>${TOOLS.map((tool) => `<a href="#${tool.id}" data-tool="${tool.id}">${tool.tag}</a>`).join("")}</div>`;
const meme = document.querySelector(".meme-column");
document
  .querySelectorAll(".shared-meme")
  .forEach((container) => container.replaceWith(meme.cloneNode(true)));
const status = document.createElement("p");
status.id = "tool-status";
status.className = "sr-only";
status.setAttribute("role", "status");
document.body.append(status);
initTextLink();
const loadColor = initColor();
initQr();

get("copy-ca").addEventListener("click", () => {
  get("ca-status").hidden = false;
  get("copy-ca").setAttribute("aria-expanded", "true");
});
bindCopy("copy-ca", "ca-address", "ca-error");
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !get("ca-status").hidden) {
    get("ca-status").hidden = true;
    get("copy-ca").setAttribute("aria-expanded", "false");
  }
});

function route(focus = false) {
  const id = location.hash.slice(1);
  const tool = TOOLS.find((item) => item.id === id);
  get("library").hidden = Boolean(tool);
  get("tool-nav").hidden = !tool;
  for (const item of TOOLS) get(`${item.id}-tool`).hidden = item !== tool;
  document.querySelectorAll("[data-tool]").forEach((link) => {
    if (link.dataset.tool === id) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.title = tool
    ? `${tool.name}. — gud tek`
    : "small problems. gud teks.";
  announce("");
  window.scrollTo(0, 0);
  if (focus) {
    const heading = tool
      ? get(`${id}-tool`).querySelector("h1")
      : get("library").querySelector("h1");
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}
window.addEventListener("hashchange", () => route(true));
document.addEventListener("dragover", (event) => event.preventDefault());
document.addEventListener("drop", (event) => event.preventDefault());
document.addEventListener("paste", (event) => {
  const handler = { "#file": processFile, "#color": loadColor }[location.hash];
  if (
    !handler ||
    (event.target instanceof Element &&
      event.target.closest('textarea, input, [contenteditable="true"]'))
  )
    return;
  const file = Array.from(event.clipboardData?.files ?? []).find((item) =>
    item.type.startsWith("image/"),
  );
  if (file) {
    event.preventDefault();
    handler(file);
  }
});
route();
