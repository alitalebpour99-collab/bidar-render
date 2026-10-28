// Renders one Reel by hand, from a file of props (the content the site would send).
//   node render.mjs borders --props samples/borders-1.json --voice samples/borders-1.voice.json
//        → out/borders-1.mp4, narrated, with its bed, levelled to −14 LUFS
//   node render.mjs borders --props samples/borders-1.json --voice … --still 0,45,300
//        → out/borders-1-0000.png … (single frames, to look at a layout)
//   node render.mjs borders … --still auto      the first frames, the middle of every beat and the close
//   node render.mjs cover --props samples/borders-1.cover.json --still 0     the grid tile
//   --bundle dir   render from that bundle (default bundle/, made by node build.mjs)
//   --out name     the output's name (default: the props file's)
import fs from "node:fs";
import path from "node:path";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { finish } from "./finish.mjs";
import { score } from "./music.mjs";
import { dropVoice, duckOf, voiceFiles } from "./voice.mjs";

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const id = args[0];
if (!id || id.startsWith("--")) {
  console.error("usage: node render.mjs <composition> --props file.json [--voice voice.json] [--still f1,f2|auto] [--bundle dir] [--out name]");
  process.exit(2);
}
const propsFile = flag("--props") ?? `samples/${id}.json`;
const stillArg = flag("--still");
const serveUrl = path.resolve(flag("--bundle") ?? "bundle");
const name = flag("--out") ?? path.basename(propsFile).replace(/(\.cover)?\.json$/, (m, c) => (c ? "-tile" : ""));
const props = JSON.parse(fs.readFileSync(propsFile, "utf8"));
fs.mkdirSync("out", { recursive: true });
const publicDir = path.join(serveUrl, "public");
fs.mkdirSync(publicDir, { recursive: true });

const timeoutInMilliseconds = 120_000;
const t0 = Date.now();
const voiceFile = flag("--voice");
const lines = voiceFile ? [JSON.parse(fs.readFileSync(voiceFile, "utf8"))].flat() : [];
const voiceIn = voiceFiles(lines, publicDir, name, { baseDir: voiceFile ? path.dirname(voiceFile) : ".", format: id });
const first = await selectComposition({ serveUrl, id, inputProps: { ...props, voiceIn }, timeoutInMilliseconds });
const seconds = first.durationInFrames / first.fps;
const tl = first.props.tl;
if (tl) console.log(`${id}: ${first.durationInFrames} frames, ${seconds.toFixed(1)} s; beats ${tl.order.map((b) => `${b}@${(tl.beats[b].from / first.fps).toFixed(1)}`).join(" ")}`);

if (stillArg) {
  let frames;
  if (stillArg === "auto" && tl) {
    const mids = tl.order.flatMap((b) => {
      const { from, to } = tl.beats[b];
      return [from + 12, Math.round((from + to) / 2)];
    });
    frames = [0, 20, ...mids, first.durationInFrames - 40, first.durationInFrames - 1];
  } else frames = stillArg.split(",").map(Number);
  frames = [...new Set(frames.map((f) => Math.max(0, Math.min(first.durationInFrames - 1, f))))].sort((a, b) => a - b);
  for (const frame of frames) {
    const output = `out/${name}-${String(frame).padStart(4, "0")}.png`;
    await renderStill({ composition: first, serveUrl, output, frame, inputProps: { ...props, voiceIn }, timeoutInMilliseconds });
    console.log("wrote", output);
  }
} else {
  const music = `music-${name}.wav`;
  fs.writeFileSync(path.join(publicDir, music), score({ id, seconds, duck: duckOf(first) }));
  const inputProps = { ...props, voiceIn, music };
  const composition = await selectComposition({ serveUrl, id, inputProps, timeoutInMilliseconds });
  const outputLocation = `out/${name}.mp4`;
  let lastStep = -1;
  // a fixed bitrate keeps a 30–40 s Reel near 8–12 MB, what Instagram takes without a second squeeze
  await renderMedia({ composition, serveUrl, codec: "h264", videoBitrate: process.env.RENDER_VBR ?? "2300k", pixelFormat: "yuv420p", audioCodec: "aac", audioBitrate: "160k", inputProps, outputLocation, concurrency: Number(process.env.RENDER_CONCURRENCY ?? 3), timeoutInMilliseconds, chromiumOptions: { gl: process.env.RENDER_GL || undefined }, onProgress: ({ renderedFrames, encodedFrames, stitchStage }) => { const step = Math.floor((10 * renderedFrames) / composition.durationInFrames); if (step !== lastStep) { lastStep = step; console.log(`  ${renderedFrames}/${composition.durationInFrames} frames drawn, ${encodedFrames} encoded, ${stitchStage}, ${Math.round((Date.now() - t0) / 1000)} s`); } } });
  fs.rmSync(path.join(publicDir, music), { force: true });
  console.log(finish(outputLocation, seconds));
  console.log("wrote", outputLocation, composition.durationInFrames, "frames,", seconds.toFixed(1), "s,", (fs.statSync(outputLocation).size / 1e6).toFixed(1), "MB, in", Math.round((Date.now() - t0) / 1000), "s");
}
dropVoice(publicDir, name);
