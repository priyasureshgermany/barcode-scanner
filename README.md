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
- **Germany and India:** under About, choose where you shop. That sets the currency (€ or ₹)
  for new prices and weighed-item labels, and the shopping buttons: idealo in Germany,
  Google Shopping and Amazon.in in India (both when the code comes from the other country).
  Each product shows which GS1 country issued its code (Germany 400–440, India 890).
  In India the MRP is printed on the pack, not in the barcode, so the price book suggests
  adding it.
- **Books** (ISBN 978/979) are looked up in Open Library. Magazines (977) and shops' own
  short codes are recognised and not looked up.
- **Medicines:** German packs' securPharm Data Matrix (both the GS1/NTIN and the IFA layout)
  and the older PZN Code 39 barcode, plus the GS1 Data Matrix used on Indian and export
  medicines, are shown as PZN / product code, batch, expiry date and serial, with a warning
  when the pack has expired or expires within 90 days.
- **GS1 data:** GS1-128 and ITF-14 on cartons, GS1 DataBar, GS1 QR codes and GS1 Digital
  Link QR codes (`…/01/<GTIN>/…`, from id.gs1.org or a brand's own site) are decoded into
  readable fields, and the product inside is looked up like a normal barcode.
- **Tabs:** Scan, History, Pantry and Compare.
- **Health and diet:** for food, the Nutri-Score, sugar/fat/salt levels (low, medium, high),
  values per 100 g, allergens and vegetarian/vegan from Open Food Facts. Under About you can
  tick your own warnings (vegetarian, vegan, peanuts, milk, gluten…); a product that matches
  turns red, and "may contain traces" or missing data shows in amber.
- **Cheapest shop:** the price book compares each shop's latest price in one currency,
  per kg or litre when the pack size is known (from Open Food Facts, or typed in with the price).
- **Pantry:** add a scanned item with its best-before or expiry date (filled in from GS1 and
  securPharm codes). Soonest first; expired items are red, those due within 7 days amber.
- **History:** every scan, searchable, and exported as an Excel-friendly CSV (semicolons,
  German decimal commas, barcodes kept as text).
- **Compare:** two products side by side: size, price, price per kg/litre, Nutri-Score and
  nutrition, with the better value in green.
- **Expense tracker:** "Add to shopping list" (German or Indian stores, following the country
  chip) and "Log as expense" (only with a euro price) add an item to `panappai.inbox` in the
  browser storage the two apps share on priyasureshgermany.github.io. The expense tracker picks
  it up the next time it opens. On iPhone this needs both apps open in Chrome: each Home Screen
  web app gets its own separate storage.
- **Loyalty cards (Cards tab):** scan or type Payback, DeutschlandCard, Lidl Plus, REWE, dm,
  DMart, Reliance and other cards, with a name and colour; edit, reorder, delete. Tapping one
  shows its barcode full screen on white, redrawn in the format it was scanned in (by the
  vendored zxing-wasm writer, `vendor/zxing-writer.js` + `zxing_writer.wasm`, same MIT licence),
  with the number below. The screen is kept on while it's open (Wake Lock); web pages can't raise
  the brightness, so the app says to turn it up. A scanned card that's saved here is recognised
  and never looked up as a product.
- **Shopping basket (Basket tab):** with Scan into basket on, every scan adds the item at its
  price-book or weighed-label price (or one typed in, which also goes into the price book).
  Quantities, a big running total, an optional basket budget, and, when the expense tracker's
  book is readable (not encrypted), its Groceries — German budget left this period (15th to
  14th), read only. A gentle warning when the total passes a budget. Finish logs the basket as
  one euro expense through `panappai.inbox` and saves it in History.
- **Still to get:** the Basket shows the expense tracker's shopping list for the current
  country (German or Indian stores), read only from `panappai.v1`. Items tick off when a scanned
  product's name matches (loose word match ignoring case, accents and ä/ae spellings) or by tap.
  Ticks belong to the basket and reset with it; the tracker's list is never changed. With an
  encrypted book the app says to open the tracker unencrypted to see the list.
- **Bills:** German GiroCode / EPC QR codes show payee, IBAN (grouped, checked, copyable),
  amount and reference, and can be added to the expense tracker as a bill with a due date
  (it files a future date as planned). Indian UPI QR codes show payee, UPI ID, amount and note;
  they aren't sent to the tracker, which keeps euros. The app never pays anything.
- **Wi-Fi QR codes:** network name, security and password (hidden until tapped), with copy
  buttons. Web apps can't join a network, so: copy the password, then pick the network in
  Settings. The password is masked in History and its CSV.
- **Parcels:** DHL (JJD…, 00340…, 12 and 20 digits), Hermes, DPD (including its 28-character
  label code), GLS, UPS (1Z…), India Post (XX123456789IN) and other postal numbers get
  "Track with …" buttons, one per carrier when a number could be several. No product lookup.
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

## Sharing a website with the expense tracker

Both apps are served from priyasureshgermany.github.io, and browsers give one storage area and
one set of offline caches per website. So this app keeps its data under `scanner.*` keys, only
deletes caches whose names start with `barcode-scanner-`, only updates its own service worker,
and never writes the expense tracker's `panappai.*` keys except appending to `panappai.inbox`.

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
