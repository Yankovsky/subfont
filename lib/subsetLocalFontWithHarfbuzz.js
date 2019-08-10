/* global WebAssembly */
const fs = require('fs');
const readFileAsync = require('util').promisify(fs.readFile);
const pathModule = require('path');
const once = require('lodash.once');
const ttf2woff = require('ttf2woff');
const wawoff2 = require('wawoff2');

const loadAndInitializeHarfbuzz = once(async () => {
  const {
    instance: { exports }
  } = await WebAssembly.instantiate(
    await readFileAsync(
      pathModule.resolve(__dirname, '..', 'vendor', 'hb-subset.wasm')
    )
  );
  exports.memory.grow(400); // each page is 64kb in size

  const heapu8 = new Uint8Array(exports.memory.buffer);
  return [exports, heapu8];
});

module.exports = async (originalFont, targetFormat, text) => {
  const [exports, heapu8] = await loadAndInitializeHarfbuzz();

  if (originalFont.slice(0, 4).toString() === 'wOF2') {
    originalFont = await wawoff2.decompress(originalFont);
  }

  const fontBuffer = exports.malloc(originalFont.byteLength);
  heapu8.set(new Uint8Array(originalFont), fontBuffer);

  /* Creating a face */
  const blob = exports.hb_blob_create(
    fontBuffer,
    originalFont.byteLength,
    2 /*HB_MEMORY_MODE_WRITABLE*/,
    0,
    0
  );
  const face = exports.hb_face_create(blob, 0);
  exports.hb_blob_destroy(blob);

  /* Add your glyph indices here and subset */
  const glyphs = exports.hb_set_create();

  for (let i = 0; i < text.length; i += 1) {
    exports.hb_set_add(glyphs, text.charCodeAt(i));
  }

  const input = exports.hb_subset_input_create_or_fail();
  const inputGlyphs = exports.hb_subset_input_unicode_set(input);
  exports.hb_set_union(inputGlyphs, glyphs);
  exports.hb_subset_input_set_drop_hints(input, true);
  const subset = exports.hb_subset(face, input);

  /* Clean up */
  exports.hb_subset_input_destroy(input);

  /* Get result blob */
  const result = exports.hb_face_reference_blob(subset);

  const offset = exports.hb_blob_get_data(result, 0);
  const subsetFontBlob = heapu8.slice(
    offset,
    offset + exports.hb_blob_get_length(result)
  );

  /* Clean up */
  exports.hb_blob_destroy(result);
  exports.hb_face_destroy(subset);

  // TODO: Encode as woff/woff2 if targetFormat says so
  let subsetFont;
  if (targetFormat === 'woff2') {
    subsetFont = Buffer.from(await wawoff2.compress(subsetFontBlob));
  } else if (targetFormat === 'woff') {
    subsetFont = Buffer.from(ttf2woff(Buffer.from(subsetFontBlob)));
  } else {
    // targetFormat === 'truetype'
    subsetFont = Buffer.from(subsetFontBlob);
  }
  return subsetFont;
};