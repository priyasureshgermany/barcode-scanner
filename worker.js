/* Decodes barcodes off the main thread so the camera preview stays smooth.

   The decoder is zxing-cpp compiled to WebAssembly (the zxing-wasm package),
   kept in vendor/ so scanning works offline and never fetches from a CDN.
   Messages in:  { id, image: ImageData | Blob, hard: bool }
   Messages out: { id, results: [{ text, format, bytes? }] } or { id, error } */
importScripts("vendor/zxing-reader.js");

ZXingWASM.prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) =>
      path.endsWith(".wasm") ? new URL("vendor/" + path, self.location.href).href : prefix + path
  },
  fireImmediately: true
});

/* The product codes and the common 2D ones. Leaving out the rare formats
   makes each frame faster and cuts down on false reads from random textures. */
const FORMATS = [
  "EAN13", "EAN8", "UPCA", "UPCE",
  "Code128", "Code39", "Code93", "ITF", "Codabar", "DataBar", "DataBarExp",
  "QRCode", "MicroQRCode", "DataMatrix", "PDF417", "Aztec"
];

self.onmessage = async (e) => {
  const { id, image, hard } = e.data;
  try {
    const results = await ZXingWASM.readBarcodes(image, {
      formats: FORMATS,
      tryHarder: true,
      tryRotate: !!hard,
      tryInvert: !!hard,
      tryDownscale: true,
      maxNumberOfSymbols: hard ? 8 : 1
    });
    self.postMessage({
      id,
      results: results.filter((r) => r.isValid).map((r) => ({
        text: r.text,
        format: r.format,
        contentType: r.contentType
      }))
    });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
