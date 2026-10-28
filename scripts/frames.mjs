// Pulls frames out of rendered Reels to look at them (needs ffmpeg).
//   node scripts/frames.mjs <out dir> a.mp4 [b.mp4 …] [--n 8]
// Takes the first frame, one at 1.2 s (the hook), then frames spread over the
// rest, the last one a second before the end (the source line), and writes
// <name>-<seconds>.jpg into <out dir>.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const n = Number(args.includes("--n") ? args[args.indexOf("--n") + 1] : 8);
const [dir, ...videos] = args.filter((a, i) => a !== "--n" && args[i - 1] !== "--n");
fs.mkdirSync(dir, { recursive: true });
for (const video of videos) {
  const length = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).toString().trim());
  const name = path.basename(video).replace(/\.mp4$/, "");
  const rest = Math.max(1, n - 3);
  const times = [0, 1.2, ...Array.from({ length: rest }, (_, i) => 3 + ((length - 5) * i) / Math.max(1, rest - 1)), length - 1];
  for (const t of times) {
    const out = path.join(dir, `${name}-${t.toFixed(1).padStart(4, "0")}s.jpg`);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(2), "-i", video, "-frames:v", "1", "-q:v", "3", out]);
    console.log(out);
  }
}
