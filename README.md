# gud tek.

A library of five small tools. All processing happens in your browser; your images, text, and links stay on your device.

| Tool            | Link      | What it does                                                                                       |
| --------------- | --------- | -------------------------------------------------------------------------------------------------- |
| why file big    | `/#file`  | Compress JPG, PNG, and WebP images.                                                                |
| why text weird  | `/#text`  | Strip formatting, change case, and tidy whitespace.                                                |
| why link long   | `/#link`  | Remove known tracking parameters without rewriting remaining query values or anchors.              |
| what color this | `/#color` | Pick original image pixels using a mouse, touch, or arrow keys; copy HEX and RGB, including alpha. |
| need qr         | `/#qr`    | Generate a static QR code from text or a URL and download a PNG.                                   |

The homepage lists every tool. Hash links work on static hosting without server routing rules, and switching tools keeps your work until you refresh or close the tab.

## Run

```sh
npm install
npm run dev
```

## Check and build

```sh
npm test
npm run build
npx prettier --check .
```

Install the test browser once with `npx playwright install chromium`.

The three presets resize images to a maximum edge of 2560, 1600, or 960 pixels and encode as WebP. Transparency is preserved. Browsers without WebP encoding fall back to PNG. If the output would be larger, the original file is offered instead. Animated images are flattened to a still image. Files above 40 MB or 60 megapixels are rejected. Compression can remove embedded metadata.

The color picker uses a smaller display preview but samples the original decoded bitmap. Animated images use their first frame. QR codes use medium error correction with a four-module quiet zone and accept up to 2,000 UTF-8 bytes. They encode the exact input without a redirect service. Clipboard buttons require HTTPS or localhost; when clipboard access fails, the result remains selectable for manual copying.

Shared image decoding, validation, drag-and-drop, clipboard, and status helpers live in `src/images.js` and `src/ui.js`. Each tool has its own behavior module; shared tool metadata and markup live in `src/tool-templates.js`. Browser tests cover output correctness, QR decoding, errors, stale asynchronous results, downloads, and mobile navigation.

This is a static Vite site: `npm run build` creates `dist/` for hosting. Google Fonts supplies the typefaces; system fonts work offline. There is no backend, analytics, or image upload service.
