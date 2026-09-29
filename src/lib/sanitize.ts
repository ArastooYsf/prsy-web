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
