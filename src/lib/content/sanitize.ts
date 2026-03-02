const SCRIPT_STYLE_TAGS = /<(script|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi;
const EVENT_ATTRS = /\son\w+=(["']).*?\1/gi;
const JS_PROTOCOL = /(href|src)=["']\s*javascript:[^"']*["']/gi;

export function sanitizeHtml(input: string) {
  if (!input) return "";

  return input
    .replace(SCRIPT_STYLE_TAGS, "")
    .replace(EVENT_ATTRS, "")
    .replace(JS_PROTOCOL, '$1="#"');
}
