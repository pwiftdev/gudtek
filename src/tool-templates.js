export const TOOLS = [
  {
    id: "file",
    name: "why file big",
    description: "Same picture. Less picture. Shrink an image in seconds.",
    line: "same picture. less picture. your storage says thank you.",
    icon: "M5 3h9l5 5v13H5z M14 3v6h5 M8 16l3-3 2 2 3-4",
    tag: "image compressor",
  },
  {
    id: "text",
    name: "why text weird",
    description: "Fix caps, weird spacing, and that font you never asked for.",
    line: "your caps lock had a moment. we understand.",
    icon: "M3 19 9 5l6 14 M5 14h8 M17 12c5-3 6 7 0 6-3-1-2-5 4-4 M21 11v8",
    tag: "text cleaner",
  },
  {
    id: "link",
    name: "why link long",
    description: "Give your link a haircut. Keep the destination.",
    line: "all that tracking. for a link to a sandwich.",
    icon: "M10 7l2-2a5 5 0 0 1 7 7l-2 2 M14 17l-2 2a5 5 0 0 1-7-7l2-2 M8 16l8-8",
    tag: "link cleaner",
  },
  {
    id: "color",
    name: "what color this",
    description: "Point at a pixel. Steal its color. Legally.",
    line: "that one. that color. now you know.",
    icon: "m14 5 5 5 M3 21l2-6L17 3a2 2 0 0 1 4 4L9 19z M5 15l4 4",
    tag: "color picker",
  },
  {
    id: "qr",
    name: "need qr",
    description: "A link or some words go in. A scannable square comes out.",
    line: "made you a square. it knows things.",
    icon: "M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h3v3h3v3h-6z M21 12v3 M12 3v3 M12 12h3 M12 18v3",
    tag: "qr generator",
  },
];

const icon = (path) =>
  `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${path}"/></svg>`;
const error = (id) =>
  `<p id="${id}-error" class="error-message" role="alert" hidden></p>`;
const copy = (id, label = "copy it") =>
  `<button id="${id}-copy" type="button" class="secondary-button" data-label="${label}">${label}</button>`;

function loreTemplate() {
  return `<section class="lore" aria-labelledby="lore-title">
    <div class="lore-heading"><span class="eyebrow"><span class="status-dot"></span> the lore</span><h2 id="lore-title">silly cat.<br>actual tek.</h2><span class="lore-ticker">Gud Tek · $TEK</span></div>
    <div class="lore-copy"><p>some people see a crying cat with a thumbs-up. we see a highly qualified technology department.</p><p>so we made a few useful little tools. and a crypto memecoin. meet <strong>Gud Tek ($TEK)</strong>, launched on <a href="https://www.stonkfun.xyz/" target="_blank" rel="noopener noreferrer">stonkfun.xyz <span aria-hidden="true">↗</span></a>.</p><p class="lore-actual">our actual tek uses stonkfun.xyz to distribute <strong>QQQx</strong> to <strong>$TEK holders</strong>. NASDAQ exposure, through QQQx.</p><p class="lore-signoff">that's the tek. gud tek.</p></div>
  </section>`;
}

export function libraryTemplate() {
  return `<section class="hero library-hero"><span class="eyebrow"><span class="status-dot"></span> a small collection of technological breakthroughs</span><h1>small problems. <span class="title-big">gud teks<svg viewBox="0 0 250 18" aria-hidden="true"><path d="M4 11 Q111 1 243 8 M18 16 Q122 7 223 12" /></svg></span>.</h1><p class="hero-description">useful little things for your very important computer life.</p></section>
    <section class="library-grid" aria-label="The Gud Tek tool library">${TOOLS.map((tool, index) => `<a class="tool-card" href="#${tool.id}"><div class="card-top"><span class="card-icon">${icon(tool.icon)}</span><span class="card-number">0${index + 1} /</span></div><span class="card-category">${tool.tag}</span><h2>${tool.name}.</h2><p>${tool.description}</p><span class="card-bottom">open tek <span aria-hidden="true">↗</span></span></a>`).join("")}<aside class="cat-card"><span class="hand-note">head of engineering</span><img src="/gud-tek-cat.jpg" alt="The Gud Tek cat giving a thumbs-up"/><p>five tools. one very qualified cat.</p></aside></section><p class="library-promise"><span class="status-dot"></span> no sign-ups. no uploads. just gud tek.</p>${loreTemplate()}`;
}

const panels = {
  text: `<form id="text-form"><label class="field-label" for="text-input">insert confusing words</label><textarea id="text-input" rows="7" placeholder="i ACCIDENTALLY tYPED lIKE tHIS" maxlength="200000"></textarea><div class="field-row"><label class="select-label" for="text-mode">make it<select id="text-mode"><option value="keep">same case, plain text</option><option value="sentence">Sentence case</option><option value="lower">lowercase</option><option value="upper">UPPERCASE</option><option value="invert">sWAP cASE</option></select></label></div><label class="checkbox-label"><input type="checkbox" id="text-spaces" checked /> tidy extra spaces and blank lines</label><p class="field-help">Pasting here automatically removes fonts, colors, and formatting.</p><button class="primary-button" type="submit">make words normal <span aria-hidden="true">↗</span></button></form><div id="text-result" class="tool-result" hidden><label class="field-label" for="text-output">words normal now.</label><textarea id="text-output" rows="6" readonly></textarea>${copy("text")}</div>${error("text")}`,
  link: `<form id="link-form"><label class="field-label" for="link-input">insert suspiciously long link</label><textarea id="link-input" rows="5" maxlength="16000" placeholder="https://example.com/cat?utm_source=everywhere&amp;fbclid=why" spellcheck="false" autocapitalize="off"></textarea><p class="field-help">Removes known trackers like utm_*, fbclid, and gclid. Keeps other parameters and page anchors exactly as written.</p><button class="primary-button" type="submit">give link haircut <span aria-hidden="true">↗</span></button></form><div id="link-result" class="tool-result" hidden><label id="link-summary" class="field-label" for="link-output"></label><textarea id="link-output" rows="4" readonly spellcheck="false"></textarea>${copy("link")}</div>${error("link")}<p class="field-help footnote">Some signed or special-purpose links need every parameter. Keep the original if a cleaned link stops working.</p>`,
  color: `<div id="color-drop" class="color-drop"><input id="color-input" type="file" accept="image/jpeg,image/png,image/webp" hidden/><div id="color-empty"><span class="big-tool-icon">${icon(TOOLS[3].icon)}</span><h2>drop colorful thing here</h2><p class="field-help">JPG, PNG, WEBP · up to 40 MB</p></div><button id="color-choose" type="button" class="primary-button">choose image <span aria-hidden="true">↗</span></button><div id="color-image-wrap" hidden><p id="color-instructions" class="field-help">Click a pixel, or focus the image and use arrow keys. Hold Shift to move 10 pixels.</p><canvas id="color-canvas" tabindex="0" aria-label="Pick a color from the image" aria-describedby="color-instructions"></canvas></div></div><div id="color-result" class="tool-result" hidden><div class="color-summary"><div id="color-swatch" class="color-swatch"></div><div><strong>that one. that color.</strong><p id="color-position" class="field-help"></p></div></div><div class="color-value-row"><label for="color-hex">HEX</label><input id="color-hex" readonly />${copy("color-hex", "copy hex")}</div><div class="color-value-row"><label for="color-rgb">RGB</label><input id="color-rgb" readonly />${copy("color-rgb", "copy rgb")}</div></div>${error("color")}`,
  qr: `<form id="qr-form"><label class="field-label" for="qr-input">what should the square know?</label><textarea id="qr-input" rows="5" maxlength="2000" placeholder="https://your-very-important-website.com" spellcheck="false"></textarea><p class="field-help">A full link (including https://) or plain text. Up to 2,000 UTF-8 bytes.</p><button class="primary-button" type="submit">make square <span aria-hidden="true">↗</span></button></form><div id="qr-result" class="tool-result" hidden><div class="qr-preview"><canvas id="qr-canvas" role="img" aria-label="Generated QR code"></canvas></div><p class="field-help">made you a square. scan it to check before sharing.</p><a id="qr-download" class="primary-button" download="gud-tek-qr.png">take square <span aria-hidden="true">↓</span></a><p class="field-help">Static QR. No expiry or tracking redirect. The linked destination still needs to exist.</p></div>${error("qr")}`,
};

export function toolsTemplate() {
  return TOOLS.filter((tool) => tool.id !== "file")
    .map(
      (tool) =>
        `<section id="${tool.id}-tool" hidden aria-labelledby="${tool.id}-title"><div class="hero small-tool-hero"><span class="eyebrow"><span class="status-dot"></span> ${tool.tag} · very advanced stuff</span><h1 id="${tool.id}-title" tabindex="-1">${tool.name}.</h1><p class="hero-description">${tool.line}</p></div><div class="workspace"><div><div class="utility-panel">${panels[tool.id]}</div><p class="privacy-note">stays in your browser. we don't want your stuff.</p></div><div class="shared-meme"></div></div></section>`,
    )
    .join("");
}
