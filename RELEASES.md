# Release notes

Newest first. One line per change. Written by `tools/bump-version.mjs` on each
release, and shown in the app under **About → What's new**.

Each line is tagged `fix:`, `new:` or `better:`, which the app shows as a label
beside it.

## 1.1.2 — 2026-11-12
- new: Germany or India: choose where you shop under About. Prices and weighed-item labels use € or ₹, and the buttons search idealo in Germany or Google Shopping and Amazon.in in India. Each product shows which country's GS1 issued its code.
- new: Medicines: German securPharm and PZN barcodes and the GS1 Data Matrix on Indian medicines show the PZN or product code, batch, expiry date and serial number, with a warning when a pack has expired.
- new: Books are looked up in Open Library. Carton codes (GS1-128, ITF-14), GS1 DataBar and GS1 Digital Link QR codes are read too, and the product inside is looked up.
- better: Indian products that aren't in Open Food Facts get Amazon.in and Google search buttons, and the price book reminds you that the MRP is printed on the pack, not in the barcode.

## 1.1.1 — 2026-11-12
- new: Weighed-item labels: the price in a shop's own label barcode (codes starting with 2, from the deli or fruit scales) is read offline and checked, with a button to save it to the price book. When a label's layout can't be checked, the app says so instead of guessing.
- new: Updates: an Update available badge appears when a newer version is on the website; the app only switches when you tap Update now. About shows your version and What's new.

## 1.1.0 — 2026-11-12
- new: Price book: save the shelf price after a scan, with an optional shop. Every later scan of that code lists the saved prices, newest first, with the lowest marked; edit or delete any of them.
- new: Compare prices opens an idealo.de search for the product name, or the barcode when no name was found.

## 1.0.0 — 2026-11-12
- new: Scan barcodes and QR codes with the back camera, or from a photo, and see the code and its type.
- new: Product codes are looked up in the free Open Food Facts databases: name, brand, size and a photo.
