// The renderer of Bidar's Reels. It asks the site for work, renders what it is
// given, and hands the files back; the site then shows each Reel to the owner
// and posts it at its hour. The contract is docs/contract.md (Divan's, renamed).
//
// It runs on GitHub's machines (.github/workflows/render.yml), one pass every
// quarter of an hour, and by hand on any machine with Node and room for a
// headless Chrome. It never runs on Ahura's shared server.
//
//   BIDAR_RENDER_SECRET=… node worker.mjs            one pass: take what waits, render, hand back, end
//   BIDAR_RENDER_SECRET=… node worker.mjs --loop     stays up: looks every two minutes
//   BIDAR_URL=http://localhost:3000                  another address (default https://bidar.ahura.cloud)
//
// Nothing of a Reel's content is printed: a Reel is the owner's to see first.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { makeCancelSignal, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { finish } from "./finish.mjs";
import { dropVoice, duckOf, voiceFiles } from "./voice.mjs";
import { score } from "./music.mjs";

const SITE = (process.env.BIDAR_URL ?? "https://bidar.ahura.cloud").replace(/\/+$/, "");
const SECRET = process.env.BIDAR_RENDER_SECRET ?? "";
const LOOP = process.argv.includes("--loop");
const POLL_MS = Math.max(30, Number(process.env.POLL_SECONDS) || 120) * 1000;
const CONCURRENCY = Math.max(1, Math.min(4, Number(process.env.RENDER_CONCURRENCY) || Math.min(4, os.cpus().length)));
const GL = process.env.RENDER_GL || undefined;
// what this bundle can draw beyond the Reels (docs/contract.md, `can`): nothing yet
const CAN = process.env.RENDER_CAN ?? "";
// the machine must have this much memory free before a Reel is started, and this much while it renders (Linux only)
const START_FREE_MB = Number(process.env.START_FREE_MB) || 2200;
const ABORT_FREE_MB = Number(process.env.ABORT_FREE_MB) || 450;
const HOLD_UNTIL = Date.parse(process.env.HOLD_UNTIL ?? "") || 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = { rendered: 0, failed: 0 };

async function call(query, init = {}, tries = 3) {
  let last = "";
  for (let n = 1; n <= tries; n += 1) {
    try {
      const res = await fetch(`${SITE}/api/social/work${query}`, { ...init, headers: { authorization: `Bearer ${SECRET}`, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(180_000) });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) return body;
      last = `HTTP ${res.status} ${body?.error ?? ""}`.trim();
      // a refusal will not change by asking again
      if (res.status >= 400 && res.status < 500) break;
    } catch (e) {
      last = e instanceof Error ? e.name : "error";
    }
    if (n < tries) await sleep(4000 * n);
  }
  throw new Error(`the site did not accept the call (${last})`);
}

/** Memory that can still be had (Linux), or null on a machine that does not say. */
function freeMb() {
  try {
    const mem = fs.readFileSync("/proc/meminfo", "utf8");
    const mb = Number(/^MemAvailable: *([0-9]+)/m.exec(mem)?.[1]) / 1024;
    return Number.isFinite(mb) ? mb : null;
  } catch {
    return null;
  }
}

let serveUrl = "";
async function site() {
  if (serveUrl) return serveUrl;
  serveUrl = fs.existsSync("bundle/index.html") ? path.resolve("bundle") : await bundle({ entryPoint: path.resolve("src/index.ts"), outDir: path.resolve("bundle"), publicDir: path.resolve("public") });
  fs.mkdirSync(path.join(serveUrl, "public"), { recursive: true });
  fs.mkdirSync("out", { recursive: true });
  return serveUrl;
}

async function render(job) {
  const t0 = Date.now();
  const serve = await site();
  const publicDir = path.join(serve, "public");
  const video = path.resolve("out", `${job.name}.mp4`);
  const cover = path.resolve("out", `${job.name}.jpg`);
  const music = `music-${job.name}.wav`;
  const chromiumOptions = { gl: GL };
  const timeoutInMilliseconds = 120_000;
  const { cancelSignal, cancel } = makeCancelSignal();
  let tight = 0;
  let gaveUp = false;
  const watch = setInterval(() => {
    const mb = freeMb();
    tight = mb !== null && mb < ABORT_FREE_MB ? tight + 1 : 0;
    if (tight >= 2 && !gaveUp) {
      gaveUp = true;
      console.log(`Reel ${job.id}: the machine has almost no memory left; giving this render up`);
      cancel();
    }
  }, 20_000);
  try {
    // the tile for the profile grid
    const tile = await selectComposition({ serveUrl: serve, id: "cover", inputProps: job.cover, chromiumOptions, timeoutInMilliseconds });
    await renderStill({ composition: tile, serveUrl: serve, output: cover, inputProps: job.cover, imageFormat: "jpeg", jpegQuality: 92, chromiumOptions, timeoutInMilliseconds });
    // the narrator first: its alignment sets every beat and the Reel's length (src/timeline.ts)
    const voiceIn = voiceFiles(job.voice, publicDir, job.name);
    const first = await selectComposition({ serveUrl: serve, id: job.format, inputProps: { ...job.props, voiceIn }, chromiumOptions, timeoutInMilliseconds });
    const seconds = first.durationInFrames / first.fps;
    fs.writeFileSync(path.join(publicDir, music), score({ id: job.format, seconds, duck: duckOf(first) }));
    const inputProps = { ...job.props, voiceIn, music };
    const composition = await selectComposition({ serveUrl: serve, id: job.format, inputProps, chromiumOptions, timeoutInMilliseconds });
    await renderMedia({ composition, serveUrl: serve, codec: "h264", videoBitrate: process.env.RENDER_VBR ?? "2300k", pixelFormat: "yuv420p", audioCodec: "aac", audioBitrate: "160k", inputProps, outputLocation: video, concurrency: CONCURRENCY, chromiumOptions, cancelSignal, timeoutInMilliseconds });
    console.log(`Reel ${job.id}: ${finish(video, seconds)}`);
    for (const [kind, file, type] of [
      ["video", video, "video/mp4"],
      ["cover", cover, "image/jpeg"],
    ]) {
      await call(`?id=${job.id}&file=${kind}`, { method: "POST", headers: { "content-type": type }, body: fs.readFileSync(file) });
    }
    await call(`?id=${job.id}&done=1`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seconds }) });
    state.rendered += 1;
    console.log(`Reel ${job.id} (${job.format}): ${seconds.toFixed(1)} s of video, ${(fs.statSync(video).size / 1e6).toFixed(1)} MB, rendered and handed back in ${Math.round((Date.now() - t0) / 1000)} s`);
  } catch (e) {
    state.failed += 1;
    // the message of a render error may quote the content: only its first line, cut short, goes to the site, and none of it to the log
    const reason = gaveUp ? "the machine ran short of memory; the render was given up and will be tried again" : String(e instanceof Error ? e.message : e).split("\n")[0].slice(0, 240);
    console.log(`Reel ${job.id} (${job.format}): failed after ${Math.round((Date.now() - t0) / 1000)} s`);
    await call(`?id=${job.id}&failed=1`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ error: reason }) }).catch(() => undefined);
  } finally {
    clearInterval(watch);
    for (const file of [video, cover, path.join(publicDir, music)]) fs.rmSync(file, { force: true });
    dropVoice(publicDir, job.name);
  }
}

/** One pass: the waiting Reels, one after another. Returns how many it took. */
async function pass() {
  let taken = 0;
  if (Date.now() < HOLD_UNTIL) return taken;
  for (;;) {
    // a look first: it costs the site nothing and claims nothing
    const { waiting } = await call(`?peek=1&can=${encodeURIComponent(CAN)}`);
    if (!waiting) return taken;
    const mb = freeMb();
    if (mb !== null && mb < START_FREE_MB) {
      console.log(`only ${Math.round(mb)} MB of memory is free; the Reel waits for the next look`);
      return taken;
    }
    const { jobs } = await call(`?max=1&can=${encodeURIComponent(CAN)}`);
    if (!jobs?.length) return taken;
    await render(jobs[0]);
    taken += 1;
    // never more than a handful in one pass: something that fails for ever must not spin
    if (taken >= 6) return taken;
  }
}

if (!SECRET) {
  console.error("BIDAR_RENDER_SECRET is not set");
  process.exitCode = 2;
} else if (!LOOP) {
  const taken = await pass();
  console.log(taken ? `${taken} Reel(s) taken` : "nothing to render");
  if (state.failed) process.exitCode = 1;
} else {
  console.log(`bidar video worker: looking at ${SITE} every ${POLL_MS / 1000} s, ${CONCURRENCY} tab(s)`);
  await site();
  for (;;) {
    try {
      await pass();
    } catch (e) {
      console.log("no pass:", e instanceof Error ? e.message.slice(0, 120) : "error");
    }
    await sleep(POLL_MS);
  }
}
