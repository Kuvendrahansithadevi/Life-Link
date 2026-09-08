/* Small pure-function helpers shared across LIFE LINK components. */
import { TRIAGE_RULES, DEFAULT_TRIAGE } from "../data/constants";

/*  HELPERS                                                             */
/* ------------------------------------------------------------------ */

export function runTriage(text) {
  const lower = text.toLowerCase();
  for (const rule of TRIAGE_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return { urgency: rule.urgency, specialist: rule.specialist, guidance: rule.guidance };
    }
  }
  return DEFAULT_TRIAGE;
}

export const urgencyStyles = {
  High: { text: "text-red-700", bg: "bg-red-50", border: "border-red-600", dot: "bg-red-600" },
  Medium: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-500", dot: "bg-amber-500" },
  Low: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-600", dot: "bg-emerald-600" },
};

export const quantityStyles = {
  1: { bg: "bg-emerald-50", text: "text-emerald-700" },
  2: { bg: "bg-amber-50", text: "text-amber-700" },
  3: { bg: "bg-red-100", text: "text-red-700" },
};

export function initialsOf(name) {
  if (!name) return "?";
  return name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

/* Faint heartbeat-line + medical-cross motif, tiled as a light background watermark. */
const BG_PATTERN_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='260' height='90' viewBox='0 0 260 90'>
  <path d='M0 50 H70 L82 14 L100 82 L118 50 H160 L172 28 L188 66 L200 50 H260'
        fill='none' stroke='#0f9d63' stroke-width='2.5' stroke-opacity='0.09' stroke-linejoin='round' stroke-linecap='round'/>
  <path d='M28 74 h14 M35 67 v14' stroke='#e11d48' stroke-width='2.5' stroke-opacity='0.08' stroke-linecap='round'/>
  <path d='M228 18 h14 M235 11 v14' stroke='#e11d48' stroke-width='2.5' stroke-opacity='0.08' stroke-linecap='round'/>
</svg>`;
const BG_PATTERN_URL = `url("data:image/svg+xml,${encodeURIComponent(BG_PATTERN_SVG)}")`;
export { BG_PATTERN_URL };
