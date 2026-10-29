// The files the compositions draw on are copies of Bidar's own:
// public/data/iran-eras.json (period extents), public/data/countries-110m.json
// (Natural Earth), and the flags of /iran/flags (public/flags/flag_*.svg),
// split here into their layers in the file's order (src/data/flags.json: the
// field, the stripes, the emblem), so «پرچم‌های ایران» can build each flag
// layer by layer exactly as the site draws it. Run this after they change on
// the site.
//   node sync-data.mjs <path to a clone of bidar> [--check]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** The flag the lane never shows (after 1979, politics): its picture is not copied. */
const FLAG_OUT = new Set(["flag_10_iran_current.svg"]);
const NOT_DRAWN = /^(defs|metadata|title|desc|style|sodipodi:namedview|inkscape:[\w-]+)$/i;

const attrOf = (attrs, name) => new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`).exec(attrs)?.[1];

/** The box of a rect, or of a path drawn only with straight moves (M L H V Z), else null. */
function boxOf(name, attrs) {
  if (attrOf(attrs, "transform")) return null;
  if (name === "rect") {
    const n = (k, d = 0) => (attrOf(attrs, k) === undefined ? d : Number.parseFloat(attrOf(attrs, k)));
    return [n("x"), n("y"), n("width", NaN), n("height", NaN)];
  }
  if (name !== "path") return null;
  const d = attrOf(attrs, "d") ?? "";
  if (/[^MmLlHhVvZz\d\s.,eE+-]/.test(d)) return null;
  let x = 0;
  let y = 0;
  const xs = [];
  const ys = [];
  for (const [, cmd, args] of d.matchAll(/([MmLlHhVvZz])([^MmLlHhVvZz]*)/g)) {
    const v = (args.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi) ?? []).map(Number);
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === "H") for (const a of v) (x = rel ? x + a : a), xs.push(x), ys.push(y);
    else if (C === "V") for (const a of v) (y = rel ? y + a : a), xs.push(x), ys.push(y);
    else if (C === "M" || C === "L") for (let i = 0; i + 1 < v.length; i += 2) (x = rel ? x + v[i] : v[i]), (y = rel ? y + v[i + 1] : v[i + 1]), xs.push(x), ys.push(y);
  }
  if (!xs.length) return null;
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return [x0, y0, x1 - x0, y1 - y0];
}

/**
 * A flag's SVG as its box and its drawn layers, in order. A layer that covers
 * the whole flag is its field, one as wide as the flag a stripe, anything else
 * the emblem (and its ornaments).
 */
export function splitFlag(text) {
  const clean = text.replace(/<\?xml[\s\S]*?\?>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const open = /<svg\b([^>]*)>/i.exec(clean);
  if (!open) throw new Error("no <svg> element");
  const vb = attrOf(open[1], "viewBox")?.trim().split(/[\s,]+/).map(Number);
  const box = vb && vb.length === 4 ? vb : [0, 0, Number.parseFloat(attrOf(open[1], "width")), Number.parseFloat(attrOf(open[1], "height"))];
  if (!box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0) throw new Error("no size");
  const body = clean.slice(open.index + open[0].length, clean.lastIndexOf("</svg>"));
  const parts = [];
  let depth = 0;
  let start = -1;
  let head = null;
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
    const [all, close, name, attrs, self] = m;
    if (!close) {
      if (depth === 0) {
        start = m.index;
        head = { name, attrs };
      }
      if (self) {
        if (depth === 0) parts.push({ ...head, svg: body.slice(start, m.index + all.length) });
      } else depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) parts.push({ ...head, svg: body.slice(start, m.index + all.length) });
    }
  }
  const defs = parts.filter((p) => /^defs$/i.test(p.name)).map((p) => p.svg).join("");
  const [bx, by, bw, bh] = box;
  const near = (a, b) => Math.abs(a - b) <= Math.max(bw, bh) * 0.005;
  const layers = parts
    .filter((p) => !NOT_DRAWN.test(p.name))
    .map((p) => {
      const b = boxOf(p.name, p.attrs);
      const wide = b && near(b[0], bx) && near(b[0] + b[2], bx + bw);
      const tall = b && near(b[1], by) && near(b[1] + b[3], by + bh);
      const kind = wide && tall ? "field" : wide ? "stripe" : "emblem";
      return { kind, svg: p.svg.replace(/\s+/g, " ").trim(), ...(b && kind !== "emblem" ? { box: b.map((n) => Math.round(n * 100) / 100) } : {}) };
    });
  if (!layers.length) throw new Error("nothing drawn");
  return { box, defs, layers };
}

function main() {
  const repo = process.argv[2];
  if (!repo || repo.startsWith("--")) {
    console.error("usage: node sync-data.mjs <path to bidar> [--check]");
    process.exit(2);
  }
  const check = process.argv.includes("--check");
  let stale = 0;
  const put = (name, text) => {
    const to = path.resolve(import.meta.dirname, "src/data", name);
    if (fs.existsSync(to) && fs.readFileSync(to, "utf8") === text) return;
    stale += 1;
    if (check) console.log(`${name} differs from the site's`);
    else {
      fs.writeFileSync(to, text);
      console.log(`${name} written`);
    }
  };
  for (const name of ["iran-eras.json", "countries-110m.json"]) put(name, fs.readFileSync(path.join(repo, "public/data", name), "utf8"));
  const dir = path.join(repo, "public/flags");
  const flags = {};
  for (const file of fs.readdirSync(dir).filter((f) => /^flag_\d\d_[a-z_]+\.svg$/.test(f) && !FLAG_OUT.has(f)).sort()) flags[file] = splitFlag(fs.readFileSync(path.join(dir, file), "utf8"));
  put("flags.json", `${JSON.stringify(flags, null, 1)}\n`);
  if (!stale) console.log("the data files match the site's");
  else if (check) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
