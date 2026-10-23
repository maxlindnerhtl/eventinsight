import DOMPurify from "dompurify";

// Only the markup the ReactQuill toolbar in EditText.jsx produces.
// Formatting (font, size, indent) is carried as ql-* classes.
const ALLOWED_TAGS = ["p", "br", "h1", "h2", "strong", "em", "u", "s", "blockquote", "ol", "ul", "li", "a", "span"];
const ALLOWED_ATTR = ["href", "target", "rel", "class"];

export function sanitizeHtml(html) {
    return DOMPurify.sanitize(html, {ALLOWED_TAGS, ALLOWED_ATTR});
}
