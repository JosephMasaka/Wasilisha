// GSM-7 covers basic Latin letters, digits, and common punctuation. Any
// character outside this set (emoji, most accented characters, "smart
// quotes" from word processors) forces the whole message into Unicode
// encoding, which drops the per-segment limit from 160 to 70 characters —
// a message that looks like it fits can silently split into 2-3x the SMS
// segments (and cost) once it's actually encoded.
const GSM7_BASIC = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXTENDED = "^{}\\[~]|€";

export function isGsm7(text: string): boolean {
  return [...text].every((ch) => GSM7_BASIC.includes(ch) || GSM7_EXTENDED.includes(ch));
}

export function calculateSmsSegments(text: string): { segments: number; encoding: "GSM-7" | "Unicode"; limit: number } {
  const gsm7 = isGsm7(text);
  const limit = gsm7 ? 160 : 70;
  const perSegmentWhenMultipart = gsm7 ? 153 : 67; // multipart messages reserve header bytes
  if (text.length === 0) return { segments: 0, encoding: gsm7 ? "GSM-7" : "Unicode", limit };
  const segments = text.length <= limit ? 1 : Math.ceil(text.length / perSegmentWhenMultipart);
  return { segments, encoding: gsm7 ? "GSM-7" : "Unicode", limit };
}