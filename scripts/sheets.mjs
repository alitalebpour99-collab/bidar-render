// Frame strips of the stills in out/: one JPEG per sample, its frames in rows of six (needs ffmpeg).
// The Samples workflow keeps them as a small artifact of their own, so a look at a layout
// does not mean downloading every full-size PNG.
//   node scripts/sheets.mjs out sheets [cell width, default 300]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [dir = "out", to = "sheets", cellArg] = process.argv.slice(2);
const cell = Number(cellArg ?? 300);
fs.mkdirSync(to, { recursive: true });
const byName = new Map();
for (const f of fs.readdirSync(dir).filter((x) => /-\d{4}\.png$/.test(x)).sort()) {
  const name = f.replace(/-\d{4}\.png$/, "");
  byName.set(name, [...(byName.get(name) ?? []), f]);
}
for (const [name, files] of byName) {
  const cols = Math.min(6, files.length);
  const rows = Math.ceil(files.length / cols);
  const list = path.join(to, `${name}.txt`);
  fs.writeFileSync(list, files.map((f) => `file '${path.resolve(dir, f)}'\nduration 1`).join("\n") + "\n");
  const out = path.join(to, `${name}-sheet.jpg`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-vf", `scale=${cell}:-1,pad=iw+8:ih+8:4:4:color=0x222222,tile=${cols}x${rows}:color=0x222222`, "-frames:v", "1", "-q:v", "3", out]);
  fs.rmSync(list);
  // each frame as a JPEG too, at full size, for a close look
  for (const f of files) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(dir, f), "-q:v", "4", path.join(to, f.replace(/\.png$/, ".jpg"))]);
  console.log(`${out}: ${files.length} frames`);
}
