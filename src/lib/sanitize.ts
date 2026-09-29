import sanitizeHtml from "sanitize-html";

/**
 * Whitelist for blog post rich-text content. Deliberately excludes
 * <script>, <style>, event handlers, and iframes — only the tags/attrs
 * the TipTap editor (StarterKit + Link) can actually produce are allowed.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "code",
      "pre",
      "img",
      "hr",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "loading", "decoding", "width", "height"],
      // span+style is what Tiptap's Color extension produces for text-color
      // marks — allowedStyles below restricts this to only the `color`
      // property with a hex/rgb value, not arbitrary CSS.
      span: ["style"],
    },
    // Restrictive on purpose: only `color`, only hex or rgb() values — this
    // is the one CSS property the editor's color picker can actually
    // produce, not a general "allow inline styles" escape hatch.
    allowedStyles: {
      span: {
        color: [/^#[0-9a-f]{3,6}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
      // These <img> tags come from the rich-text editor and are rendered via
      // dangerouslySetInnerHTML, so next/image isn't an option — this is the
      // closest equivalent for a plain <img>: lazy-load, and never block text
      // rendering on image decode.
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy", decoding: "async" }),
    },
  });
}

export function sanitizePlainText(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

// Structural/shape/text SVG elements only — no <script>, <foreignObject>,
// <image> (can embed external/base64 raster payloads), <animate*>/<set>
// (can point xlink:href at javascript:), or <a>/<iframe>/<object>/<embed>.
const SVG_ALLOWED_TAGS = [
  "svg",
  "g",
  "defs",
  "symbol",
  "title",
  "desc",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "textPath",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
  "pattern",
  "marker",
  "use",
  "style",
];

// "*" applies to every allowed tag in addition to any tag-specific list
// below — this is what actually blocks XSS: anything not named here
// (onload, onclick, onerror, ...) is stripped regardless of tag.
const SVG_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": [
    "id",
    "class",
    "style",
    "transform",
    "fill",
    "fill-rule",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-dasharray",
    "stroke-opacity",
    "opacity",
    "viewBox",
    "preserveAspectRatio",
    "width",
    "height",
    "x",
    "y",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "x1",
    "y1",
    "x2",
    "y2",
    "points",
    "d",
    "offset",
    "stop-color",
    "stop-opacity",
    "gradientUnits",
    "gradientTransform",
    "spreadMethod",
    "clipPathUnits",
    "maskUnits",
    "patternUnits",
    "patternContentUnits",
    "patternTransform",
    "markerWidth",
    "markerHeight",
    "refX",
    "refY",
    "orient",
    "font-family",
    "font-size",
    "font-weight",
    "text-anchor",
    "xmlns",
    "xmlns:xlink",
    "version",
  ],
  use: ["href", "xlink:href"],
};

/**
 * Strict allowlist sanitizer for uploaded SVGs (logos etc.) — removes any
 * script/event-handler/foreign-content vector while preserving the vector
 * markup a design tool actually exports. Callers must persist the SANITIZED
 * output, never the original uploaded bytes.
 *
 * ponytail: `style` attribute content and `<style>` tag CSS are not further
 * parsed — modern browsers don't execute JS via CSS, so this accepts a
 * residual (very low severity) CSS-injection surface rather than writing a
 * CSS parser. Revisit if that ever changes.
 */
export function sanitizeSvg(svg: string): string {
  return sanitizeHtml(svg, {
    allowedTags: SVG_ALLOWED_TAGS,
    allowedAttributes: SVG_ALLOWED_ATTRIBUTES,
    // SVG element/attribute names are case-sensitive (viewBox, clipPath,
    // linearGradient, textPath, ...) — sanitize-html's htmlparser2 backend
    // lowercases everything by default, which would silently break these.
    parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
    // No scheme is allowed on href/xlink:href, which blocks javascript:/data:
    // URIs. A same-document fragment ref like "#gradient-a" (what `use`
    // legitimately needs) has no scheme prefix, so it passes through — but so
    // would a scheme-less "//evil.com/x.svg", which the scheme check alone
    // can't catch. transformTags below closes that: `use` is only legitimate
    // for referencing this same document's own <defs>, so anything that
    // isn't a "#id" fragment is dropped rather than merely scheme-checked.
    allowedSchemes: [],
    allowedSchemesByTag: {},
    transformTags: {
      use: (tagName, attribs) => {
        const ref = attribs.href ?? attribs["xlink:href"];
        if (ref && !ref.startsWith("#")) {
          const rest = { ...attribs };
          delete rest.href;
          delete rest["xlink:href"];
          return { tagName, attribs: rest };
        }
        return { tagName, attribs };
      },
    },
    // sanitize-html flags <style> as inherently risky (CSS can be used for
    // passive data exfiltration, e.g. @import or attribute-selector probes)
    // and warns loudly unless this is set. Accepted per the ponytail note
    // above — this silences the warning, it doesn't add a new hole.
    allowVulnerableTags: true,
  });
}
