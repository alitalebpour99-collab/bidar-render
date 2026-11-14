// Text that fits its slab: broken into lines at word boundaries and made
// smaller until it fits the width and the number of lines, measured in the
// browser with the real font (a canvas shapes Persian as the page does). Run
// in calculateMetadata after the fonts have loaded, so the plan holds the
// lines exactly as they are drawn, and the gate checks those.
import { GULZAR, VAZIR, fontsReady } from "../kit";
import type { Line } from "./space";
import { MIN_TEXT } from "./space";

let ctx: CanvasRenderingContext2D | null = null;
const canvas = () => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  return ctx!;
};

/** Width of a text in pixels, in Vazirmatn at a size and weight. */
export function measure(text: string, size: number, weight = 800, family = VAZIR) {
  const c = canvas();
  c.font = `${weight} ${size}px "${family}"`;
  c.direction = "rtl";
  return c.measureText(text).width;
}

/** The fonts, loaded before anything is measured. */
export async function ready() {
  await fontsReady();
  await document.fonts.ready;
  // load every weight the slabs use, so the canvas measures the real letters
  await Promise.all([400, 500, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px "${VAZIR}"`, "بیدار"))).catch(() => undefined);
  await document.fonts.load(`400 40px "${GULZAR}"`, "بیدار").catch(() => undefined);
}

/** Words into lines no wider than `width`, as evenly long as they can be. */
function breakLines(words: string[], size: number, weight: number, width: number): string[] {
  const lines: string[] = [];
  let cur: string[] = [];
  for (const w of words) {
    const next = [...cur, w].join(" ");
    if (cur.length && measure(next, size, weight) > width) {
      lines.push(cur.join(" "));
      cur = [w];
    } else cur.push(w);
  }
  if (cur.length) lines.push(cur.join(" "));
  // balance: move the last word of a line down while that makes the longest line shorter
  for (let i = lines.length - 2; i >= 0; i -= 1) {
    for (;;) {
      const a = lines[i].split(" ");
      if (a.length < 2) break;
      const b = [a[a.length - 1], ...lines[i + 1].split(" ")].join(" ");
      const a2 = a.slice(0, -1).join(" ");
      const before = Math.max(measure(lines[i], size, weight), measure(lines[i + 1], size, weight));
      const after = Math.max(measure(a2, size, weight), measure(b, size, weight));
      if (after < before && measure(b, size, weight) <= width) {
        lines[i] = a2;
        lines[i + 1] = b;
      } else break;
    }
  }
  return lines;
}

export type FitAsk = { text: string; width: number; maxLines: number; size: number; min?: number; weight?: number; color?: string; height?: number; lead?: number };

/**
 * The text as lines that fit: the size goes down two pixels at a time from
 * `size` to `min` (never under the frame's smallest, MIN_TEXT) until the lines
 * fit `width`, `maxLines` and, when given, `height` (at `lead` line height).
 * A text that does not fit even at `min` is cut into its lines at `min`; the
 * gate then sees lines wider than the slab (`overflow`).
 */
export function fit(a: FitAsk): { lines: Line[]; overflow: boolean } {
  const weight = a.weight ?? 800;
  const min = Math.max(MIN_TEXT, a.min ?? MIN_TEXT);
  const lead = a.lead ?? 1.45;
  const words = a.text.trim().split(/\s+/).filter(Boolean);
  for (let size = a.size; size >= min; size -= 2) {
    const lines = breakLines(words, size, weight, a.width);
    const wide = lines.some((l) => measure(l, size, weight) > a.width);
    const tall = a.height !== undefined && lines.length * size * lead > a.height;
    if (!wide && !tall && lines.length <= a.maxLines) return { lines: lines.map((text) => ({ text, size, weight, color: a.color })), overflow: false };
  }
  const lines = breakLines(words, min, weight, a.width);
  return { lines: lines.map((text) => ({ text, size: min, weight, color: a.color })), overflow: true };
}

/** One line, made smaller until it fits (a tag, a chip, an option). */
export function fitOne(text: string, width: number, size: number, weight = 800, min = MIN_TEXT): Line & { overflow: boolean } {
  let s = size;
  while (s > Math.max(MIN_TEXT, min) && measure(text, s, weight) > width) s -= 2;
  return { text, size: s, weight, overflow: measure(text, s, weight) > width };
}

/** Height of fitted lines at a line height. */
export const linesHeight = (lines: Line[], lead = 1.45) => lines.reduce((h, l) => h + l.size * lead, 0);
