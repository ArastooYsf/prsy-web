import path from "path";
import { Font } from "@react-pdf/renderer";

// @react-pdf/renderer embeds fonts via fontkit, which can crash while
// subsetting the project's normal .woff2 files (verified directly — the
// same Shabnam-FD.woff2 used by the live site's CSS throws
// "RangeError: Offset is outside the bounds of the DataView" deep in
// fontkit's glyph encoder). Plain .ttf versions of the same font, converted
// once with `fonttools` and committed alongside this module, don't hit that
// path. These are for PDF embedding only — the website's own @font-face
// still uses the original .woff2 files in src/fonts/shabnam-fd, untouched.
const FONTS_DIR = path.join(process.cwd(), "src/lib/documents/pdf/fonts");

export const FONT_FAMILY = "Shabnam";

let registered = false;

// Font.register is process-global and idempotent-unsafe (calling it twice
// for the same family just adds duplicate sources) — guard so this can be
// called at the top of every render without caring about call order.
export function registerDocumentFonts() {
  if (registered) return;
  registered = true;
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: path.join(FONTS_DIR, "Shabnam-FD.ttf"), fontWeight: "normal" },
      { src: path.join(FONTS_DIR, "Shabnam-Bold-FD.ttf"), fontWeight: "bold" },
    ],
  });
}
