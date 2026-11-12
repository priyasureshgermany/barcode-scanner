# Barcode Scanner

A phone-first web app that scans product barcodes and QR codes with the camera.
Single `index.html`, no build step, works offline once opened (except product lookups).

## What it does

- Opens the back camera and scans continuously inside the on-screen frame.
- Beeps on a hit (and vibrates on Android) and shows the code and its type.
- For product codes (EAN-13, EAN-8, UPC-A, UPC-E) it looks the product up in the
  free Open Food Facts databases: food, then beauty, pet food and general products.
- **Price book:** after a scan you can save the shelf price, with an optional shop name.
  Prices are kept on the phone only (browser storage) by barcode. Every later scan of that code
  lists them newest first, marks the lowest, and lets you edit or delete them.
- **Compare prices** opens an idealo.de search for the product name, or for the barcode when
  no name was found.
- **Weighed-item labels:** EAN-13s starting with 2 are a shop's own codes (deli, cheese,
  fruit scales). In the usual German layout `2X AAAAA P VVVV C` the price is the 4 digits
  before the last, guarded by a price-check digit `P`. When `P` checks out the app shows
  “Price on label” (offline) and offers to save it to the price book, filed under the
  item number so every pack of that item shares one list. When it doesn't, the app says the
  layout can't be read for sure and shows both readings (price or weight) to compare with
  the printed label. These codes are never sent to Open Food Facts.
- “Scan a photo” reads a code from a photo or screenshot, for when the camera can't be used.
- QR codes that are web links get an “Open link” button. Links never open by themselves.

Formats: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, Code 93, ITF, Codabar,
GS1 DataBar, QR, Micro QR, Data Matrix, PDF417, Aztec.

## How it works

- Camera: `getUserMedia`, which only works over **https** or on **localhost**.
- Decoder: [zxing-wasm](https://github.com/Sec-ant/zxing-wasm) 3.1.6 (zxing-cpp compiled to
  WebAssembly, MIT licence), copied into `vendor/` so it never loads from a CDN. It runs in
  `worker.js` so the camera preview stays smooth. iPhone browsers don't have the built-in
  `BarcodeDetector`, which is why the app brings its own decoder.
- Only the part of the picture inside the frame is decoded, which is faster and avoids
  picking up other codes nearby.
- `sw.js` keeps one copy of the app for offline use and never replaces it by itself. The app
  checks `version.json` on the website; when it's newer, an **Update available** badge shows,
  and **Update now** (under About) clears the copy and reloads onto the new version. About also
  shows the running version and What's new, read from `RELEASES.md`.

## Releasing

Same as the expense tracker. Run once per release, with one line per change:

```
node tools/bump-version.mjs --new "…" --fix "…" --better "…"
```

It sets the version in `index.html`, `sw.js` and `version.json` and adds the notes to
`RELEASES.md`. Phones see the badge once the release is pushed.

## On iPhone (Chrome or Safari)

- The first time, the browser asks “Allow camera?”. That popup comes from iOS/Chrome and the
  app can't hide or skip it. If it was denied: iPhone **Settings → Chrome → Camera** on, then reload.
- The beep follows the ring/silent switch. iPhones don't support vibration from web pages.
- The torch button only appears where the browser supports it (Android Chrome); not on iPhone.
- Hold the phone about 10–20 cm from small barcodes; very close codes can't be focused.

## Product lookup

Open Food Facts and its sister sites are free and allow calls from any website. UPCitemdb
was considered for general products, but it only accepts browser requests from its own
website, so it would need a small proxy server. Codes that aren't found get a
“Search the web” button instead.

## Run locally

```
python -m http.server 8765 --bind 127.0.0.1
```

Then open http://localhost:8765. `tests/samples/` has generated barcodes in every format
for testing on a desktop. `python tools/make-icons.py` regenerates the icons.
