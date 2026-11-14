// The gate of the set style: the checks a Reel must pass before it is handed to
// the site, and so before the owner sees it (the hub's social audit of
// 2026-11-13 and the owner's rules). Each check fails, it does not warn:
//
//   hook-words  the words on screen in the first 1.5 s: at most 7, there from the first frame
//   hook-motion the picture moves in the first 1.5 s (measured on the file) and the camera has an event there
//   length      the Reel's length is inside its format's range
//   moves       a camera event at least every 3 s, and no 2.5 s of frozen picture (measured)
//   loop        the camera ends where it began, and the last frame looks like the first (measured)
//   safe        every text inside the frame and outside the apps' header, rail and caption rows
//   text-size   no text smaller than 1.5 % of the frame's height
//   source      every claim carries its source on screen, and the source line shows at the close
//   persian     no «·» and no «|» beside Persian in any text
//   badge       the channel badge: in the bottom safe area, never in the middle, 1.5 to 2.5 s, at the close
//   sound       at most two effects in any second; −14 LUFS within 1 LU; true peak −1 dBTP or lower (measured)
//   cover       the tile shows three or four big words
//
// The plan is the composition's own (src/set/space.ts, carried in its props),
// so the gate checks exactly what was drawn. The plan's checks are pure and
// tested (tests/gate.test.mjs); the measured ones need ffmpeg.
//   BIDAR_GATE=warn   report and go on      BIDAR_GATE=off   no gate at all
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { FinalCheck, TARGET, loudness } from "./finish.mjs";

const FPS = 30;
const W = 1080;
const H = 1920;
// the same numbers as src/set/space.ts ZONES (measured on the owner's screenshots of 2026-11-13)
const K = 2617 / H;
const CUT = (W * K - 1320) / 2;
export const ZONES = { top: Math.ceil((0.11 * 2868) / K), right: Math.floor((0.86 * 1320 + CUT) / K), left: Math.ceil(CUT / K), bottom: Math.floor(2158 / K) };
export const MIDDLE = { top: Math.round(H / 3), bottom: Math.round((2 * H) / 3) };
export const MIN_TEXT = Math.ceil(0.015 * H);
const HOOK_FRAMES = Math.round(1.5 * FPS);

export const wordsOf = (s) => String(s).replace(/[؟?!.،,؛:«»"()]/g, " ").split(/\s+/).filter(Boolean);
const inZones = (b) => b.x >= ZONES.left - 0.5 && b.y >= ZONES.top - 0.5 && b.x + b.w <= ZONES.right + 0.5 && b.y + b.h <= ZONES.bottom + 0.5;
const PERSIAN = /[؀-ۿ]/;
/** a «·» or «|» with Persian beside it (spaces between allowed) */
export const dotBeside = (s) => /[؀-ۿ]\s*[·|]|[·|]\s*[؀-ۿ]/.test(String(s));
const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const sec = (f) => (f / FPS).toFixed(1);

function textsOf(plan) {
  const out = [];
  for (const o of plan.objects) for (const t of [...(o.lines ?? []).map((l) => l.text), o.tag, o.chip?.text, o.word?.text]) if (t) out.push(t);
  for (const h of plan.hud) for (const l of h.lines ?? []) out.push(l.text);
  out.push(plan.hook.text);
  return out;
}

/** The checks that need only the plan (and the tile's words). Each: {id, ok, detail, fa}. */
export function planChecks(plan, cover) {
  const out = [];
  const add = (id, ok, detail, faText) => out.push({ id, ok, detail, fa: faText });
  const total = plan.total;

  const hw = wordsOf(plan.hook.text).length;
  add("hook-words", hw >= 1 && hw <= 7 && plan.hook.from === 0, `${hw} words from frame ${plan.hook.from}`, `جملهٔ قلابِ اول ${fa(hw)} واژه است (حداکثر ۷)`);

  const events = [...plan.shots.map((s) => s.at), ...plan.punches.map((p) => p.at)].filter((f) => f >= 0).sort((a, b) => a - b);
  const early = events.some((f) => f < HOOK_FRAMES) || (plan.shots[0]?.push ?? 0) > 0;
  add("hook-camera", early, early ? "the camera moves from the first frame" : "no camera event in the first 1.5 s", "تصویر در ثانیهٔ اول حرکت ندارد");

  const s = total / FPS;
  add("length", s >= plan.length[0] && s <= plan.length[1], `${s.toFixed(1)} s, allowed ${plan.length[0]}–${plan.length[1]} s`, `طولِ ویدیو ${fa(Math.round(s))} ثانیه است، بیرون از بازهٔ ${fa(plan.length[0])} تا ${fa(plan.length[1])}`);

  const marks = [0, ...events, total];
  let gap = 0;
  let at = 0;
  for (let i = 1; i < marks.length; i += 1) if (marks[i] - marks[i - 1] > gap) [gap, at] = [marks[i] - marks[i - 1], marks[i - 1]];
  add("moves", gap <= 3 * FPS, `longest stretch without a camera event: ${sec(gap)} s from ${sec(at)} s`, `از ثانیهٔ ${fa(Math.round(at / FPS))} بیش از ۳ ثانیه دوربین تکان نمی‌خورد`);

  const first = plan.shots[0]?.pose;
  const last = plan.shots[plan.shots.length - 1];
  const back = last && first && last.at + 18 <= total - 1 && ["x", "y", "z", "yaw"].every((k) => Math.abs(last.pose[k] - first[k]) < 0.01) && !(last.push ?? 0) && !(last.sway ?? 0);
  const stays = plan.objects.filter((o) => o.from === 0).every((o) => o.to >= total - 1);
  const gone = plan.objects.filter((o) => o.from > 0).every((o) => o.to <= total - 8);
  add("loop-plan", Boolean(back && stays && gone), `camera home: ${Boolean(back)}, first picture kept: ${stays}, the rest gone: ${gone}`, "پایانِ ویدیو به تصویرِ اولش برنمی‌گردد");

  const bad = plan.boxes.filter((b) => !inZones(b.box)).map((b) => `${b.id} ${Math.round(b.box.x)},${Math.round(b.box.y)} ${Math.round(b.box.w)}×${Math.round(b.box.h)}`);
  const hudBad = plan.hud.filter((h) => !inZones(h.box)).map((h) => h.id);
  add("safe", !bad.length && !hudBad.length, bad.length || hudBad.length ? `outside the zones: ${[...bad, ...hudBad].join("; ")}` : `${plan.boxes.length + plan.hud.length} text boxes inside x ${ZONES.left}–${ZONES.right}, y ${ZONES.top}–${ZONES.bottom}`, "متنی بیرون از قابِ امن است (زیرِ نوار یا دکمه‌های اینستاگرام)");

  const small = plan.boxes.filter((b) => b.minSize < MIN_TEXT - 0.5).map((b) => `${b.id} ${b.minSize.toFixed(1)} px`);
  const hudSmall = plan.hud.flatMap((h) => (h.lines ?? []).filter((l) => l.size < MIN_TEXT).map(() => h.id));
  add("text-size", !small.length && !hudSmall.length, small.length || hudSmall.length ? `smaller than ${MIN_TEXT} px: ${[...small, ...hudSmall].join(", ")}` : `every text ${MIN_TEXT} px or more`, "متنی ریزتر از حدِ خواندن است");

  const claims = plan.objects.filter((o) => o.claim);
  const unsourced = claims.filter((o) => !o.chip?.text);
  const src = plan.hud.find((h) => h.kind === "source");
  const srcShown = src && src.to - src.from >= 2 * FPS && (src.lines ?? []).some((l) => /منبع/.test(l.text));
  const pointer = src && (src.lines ?? []).some((l) => /زیرِ هر/.test(l.text));
  add("source", Boolean(srcShown) && (!unsourced.length || !pointer), `${claims.length} claims, ${unsourced.length} without a chip; source line ${srcShown ? `${sec(src.to - src.from)} s` : "missing"}`, "منبعِ یک ادعا روی ویدیو نیست");

  const dots = textsOf(plan).filter(dotBeside);
  add("persian", !dots.length, dots.length ? `«·» or «|» beside Persian: ${dots.length}` : "no «·» or «|» beside Persian", "کنارِ متنِ فارسی «·» یا «|» آمده است");

  const badge = plan.hud.find((h) => h.kind === "badge");
  if (plan.badge) {
    const len = badge ? badge.to - badge.from : 0;
    const middle = badge && badge.box.y < MIDDLE.bottom && badge.box.y + badge.box.h > MIDDLE.top;
    const closeAt = src?.from ?? total;
    const ok = badge && inZones(badge.box) && !middle && len >= 1.5 * FPS && len <= 2.5 * FPS && badge.from >= closeAt && badge.to <= total - 15;
    add("badge", Boolean(ok), badge ? `${sec(len)} s from ${sec(badge.from)} s at y ${badge.box.y}–${badge.box.y + badge.box.h}` : "no badge", "نشانِ کانال سرِ جایش نیست");
  } else add("badge", true, "switched off (BIDAR_BADGE=off)", "");

  let dense = 0;
  for (const a of plan.sfx) dense = Math.max(dense, plan.sfx.filter((b) => b.at >= a.at && b.at < a.at + FPS).length);
  add("sound-effects", dense <= 2, `at most ${dense} effects in a second, ${plan.sfx.length} in all`, "صداها بیش از اندازه پشتِ هم‌اند");

  if (cover !== undefined) {
    const cw = wordsOf(cover).length;
    add("cover", cw >= 3 && cw <= 4, `${cw} words on the tile`, `کاورِ ویدیو ${fa(cw)} واژه دارد (باید ۳ یا ۴ باشد)`);
  }
  return out;
}

function ff(args) {
  return spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).stderr ?? "";
}
/** Frozen stretches of the picture (ffmpeg freezedetect on a small copy): [[start, duration]]. */
export function freezes(file, { noise = 0.002, min = 2.5, until } = {}) {
  const log = ff([...(until ? ["-t", String(until)] : []), "-i", file, "-an", "-vf", `scale=270:-2,freezedetect=n=${noise}:d=${min}`, "-f", "null", "-"]);
  const starts = [...log.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const durs = [...log.matchAll(/freeze_duration: ([\d.]+)/g)].map((m) => Number(m[1]));
  return starts.map((s, i) => [s, durs[i] ?? Infinity]);
}
/** How alike two frames of a file are (SSIM, 1 = the same). */
export function likeness(file, a, b) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bidar-gate-"));
  const one = path.join(dir, "a.png");
  const two = path.join(dir, "b.png");
  const grab = (t, out) => (t === "last" ? ff(["-sseof", "-0.2", "-i", file, "-vf", "scale=540:-2", "-update", "1", "-frames:v", "1", "-y", out]) : ff(["-ss", String(t), "-i", file, "-vf", "scale=540:-2", "-frames:v", "1", "-y", out]));
  grab(a, one);
  grab(b, two);
  const log = ff(["-i", one, "-i", two, "-lavfi", "ssim", "-f", "null", "-"]);
  fs.rmSync(dir, { recursive: true, force: true });
  return Number(/All:([\d.]+)/.exec(log)?.[1] ?? NaN);
}

/** The checks measured on the finished file. */
export function fileChecks(file) {
  const out = [];
  const add = (id, ok, detail, faText) => out.push({ id, ok, detail, fa: faText });
  const early = freezes(file, { min: 0.8, until: 1.6 });
  const moved = likeness(file, 0, 1.2);
  add("hook-motion", !early.length && moved < 0.985, `first 1.5 s: ${early.length} frozen stretch(es); frame 0 against 1.2 s SSIM ${moved.toFixed(3)}`, "تصویر در ثانیهٔ اول ثابت است");
  const frozen = freezes(file);
  add("still", !frozen.length, frozen.length ? `frozen: ${frozen.map(([s, d]) => `${s.toFixed(1)} s for ${Number.isFinite(d) ? d.toFixed(1) : "to the end"}`).join(", ")}` : "no 2.5 s of frozen picture", "بیش از ۲٫۵ ثانیه تصویر ثابت مانده است");
  const loop = likeness(file, 0, "last");
  add("loop", loop >= 0.9, `first and last frame SSIM ${loop.toFixed(3)} (0.90 or more)`, "فریمِ آخر به فریمِ اول نمی‌خورد");
  const loud = loudness(file);
  add("loudness", Math.abs(loud.lufs - TARGET.lufs) <= TARGET.tolerance && loud.tp <= TARGET.tp, `${loud.lufs.toFixed(1)} LUFS, true peak ${loud.tp.toFixed(1)} dBTP`, "بلندیِ صدا اندازه نیست");
  return out;
}

/** The whole gate for a set Reel. Returns {ok, checks}; writes nothing. */
export function gate({ plan, file, cover }) {
  const checks = [...planChecks(plan, cover), ...(file ? fileChecks(file) : [])];
  return { ok: checks.every((c) => c.ok), checks };
}

/** The gate's verdict as the owner reads it, and as the worker hands it to the site. */
export function verdict(result) {
  const failed = result.checks.filter((c) => !c.ok);
  return failed.length ? `این ویدیو از بازبینیِ پیش از ارسال رد شد: ${failed.map((c) => c.fa).join("؛ ")}.` : "";
}

/** Runs the gate as the switch says; throws a FinalCheck when it fails and the switch is on. */
export function enforce({ plan, file, cover, mode = process.env.BIDAR_GATE ?? "on", log = console.log }) {
  if (mode === "off" || !plan) return null;
  const result = gate({ plan, file, cover });
  for (const c of result.checks) log(`gate ${c.ok ? "pass" : "FAIL"} ${c.id}: ${c.detail}`);
  if (!result.ok && mode !== "warn") throw new FinalCheck(verdict(result));
  return result;
}
