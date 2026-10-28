// What every Bidar Reel shares: the frame, the type, the safe stage's geometry,
// the «بیدار» mark, the motion helpers and the sound effects. The looks (colour,
// ground, motion) are each composition's own: Borders.tsx (lapis and gold),
// Myth.tsx (parchment), Word.tsx (night teal).
import React from "react";
import { Audio, Easing, Sequence, interpolate, staticFile } from "remotion";
import { loadFont as loadVazir } from "@remotion/google-fonts/Vazirmatn";
import { loadFont as loadGulzar } from "@remotion/google-fonts/Gulzar";

export const { fontFamily: VAZIR } = loadVazir("normal", { weights: ["400", "500", "700", "800", "900"], subsets: ["arabic", "latin"] });
// Gulzar (Nastaliq) is only for the «بیدار» mark, as on the site
export const { fontFamily: GULZAR } = loadGulzar("normal", { weights: ["400"], subsets: ["arabic"] });

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// ---------- the safe stage (Safe.tsx) ----------
// Instagram's home feed shows a Reel cropped to 4:5 (only y 285–1635 of the
// 1920 stay), and the full-screen viewers of Instagram, TikTok and YouTube
// Shorts lay their caption over the bottom and their buttons down the right.
// Every Reel is designed on the whole 1080 × 1920 frame and then drawn a
// little smaller, so that its highest line (DESIGN_TOP) lands at y 290 and its
// lowest (DESIGN_BOTTOM) at y 1590 (Divan's geometry, owner 2026-10-23).
export const DESIGN_TOP = 60;
export const DESIGN_BOTTOM = 1590;
const SCREEN_TOP = 290;
const SCREEN_BOTTOM = 1590;
export const STAGE_K = (SCREEN_BOTTOM - SCREEN_TOP) / (DESIGN_BOTTOM - DESIGN_TOP);
export const STAGE_X = (W - W * STAGE_K) / 2;
export const STAGE_Y = SCREEN_TOP - DESIGN_TOP * STAGE_K;
/** A point of the design as a point of the screen (for what the ground draws under the stage). */
export const toScreen = (x: number, y: number): [number, number] => [STAGE_X + x * STAGE_K, STAGE_Y + y * STAGE_K];
/** The side margin of the design, and the wider one on the right in the lower half (Instagram's buttons). */
export const SIDE = 76;
export const RAIL = 150;

// ---------- motion ----------
export const clamped = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
/** 0 → 1 from `from`, over `length` frames. */
export const fade = (frame: number, from: number, length = 10) => interpolate(frame, [from, from + length], [0, 1], clamped);
/** 1 → 0 over the `length` frames before `until`. */
export const leave = (frame: number, until: number, length = 10) => interpolate(frame, [until - length, until], [1, 0], clamped);
/** Visible between two frames, with a soft way in and out. */
export const during = (frame: number, from: number, until: number, length = 10) => Math.min(fade(frame, from, length), leave(frame, until, length));
/** `distance` → 0 from `from`: something settles into its place. */
export const rise = (frame: number, from: number, distance = 40, length = 16) => interpolate(frame, [from, from + length], [distance, 0], { ...clamped, easing: ease });
/** 0 → 1 eased. */
export const grow = (frame: number, from: number, length = 24) => interpolate(frame, [from, from + length], [0, 1], { ...clamped, easing: ease });
/** 0 → 1 eased both ways (a camera move). */
export const glide = (frame: number, from: number, length = 30) => interpolate(frame, [from, from + length], [0, 1], { ...clamped, easing: easeInOut });
/** A scale that overshoots and settles: a stamp, a badge. */
export const slam = (frame: number, at: number, from = 2.2) => interpolate(frame, [at, at + 6, at + 10, at + 15], [from, 0.94, 1.03, 1], clamped);
/** A small shake after an impact, in pixels. */
export const shake = (frame: number, at: number, strength = 10) => {
  const t = frame - at;
  if (t < 0 || t > 14) return [0, 0] as const;
  const k = strength * (1 - t / 14);
  return [Math.sin(t * 2.7) * k, Math.cos(t * 3.3) * k * 0.7] as const;
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const FA = "۰۱۲۳۴۵۶۷۸۹";
/** Persian digits, nothing else changed. */
export const faDigits = (v: number | string) => String(v).replace(/\d/g, (d) => FA[Number(d)]);

/** Persian diacritics: said by the narrator, not shown in the captions. */
export const DIACRITICS = /[ً-ٰٟ]/g;
export const plain = (s: string) => s.replace(DIACRITICS, "");

// ---------- the mark ----------
/** «بیدار» in Gulzar, as the site writes it, with the series' name under it. */
export const Mark: React.FC<{ color: string; sub?: string; subColor?: string; size?: number; style?: React.CSSProperties }> = ({ color, sub, subColor, size = 84, style }) => (
  <div style={{ position: "absolute", top: DESIGN_TOP + 4, right: SIDE, display: "flex", alignItems: "center", gap: 22, direction: "rtl", ...style }}>
    <span style={{ fontFamily: GULZAR, fontSize: size, lineHeight: 1.15, color, transform: "translateY(-6px)" }}>بیدار</span>
    {sub ? (
      <span style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: 30, color: subColor ?? color, opacity: 0.85, paddingRight: 22, borderRight: `2px solid ${subColor ?? color}`, lineHeight: 1.4 }}>{sub}</span>
    ) : null}
  </div>
);

/** The source line and the address: on screen in the last seconds of every Reel. */
export const SourceLine: React.FC<{ text: string; opacity: number; color: string; strong: string; y?: number }> = ({ text, opacity, color, strong, y = DESIGN_BOTTOM - 96 }) => (
  <div style={{ position: "absolute", top: y, left: SIDE, right: RAIL, direction: "rtl", opacity, transform: `translateY(${(1 - opacity) * 14}px)` }}>
    <div style={{ fontFamily: VAZIR, fontSize: 25, lineHeight: 1.55, color }}>منبع: {text}</div>
    <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 31, color: strong, direction: "ltr", textAlign: "right", marginTop: 4 }}>bidar.ahura.cloud</div>
  </div>
);

// ---------- sound ----------
/** The sound effects in public/sfx/ (made by sfx.mjs), each with the loudness it plays at. */
export const SFX = { whoosh: 0.3, hit: 0.5, tick: 0.2, pop: 0.26, rise: 0.32, swish: 0.26, stamp: 0.62, paper: 0.34, chime: 0.24, draw: 0.3 } as const;
export type SfxName = keyof typeof SFX;

/** One sound effect at a frame of the film. */
export const Sfx: React.FC<{ at: number; name: SfxName; volume?: number }> = ({ at, name, volume }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={Math.round(2.2 * FPS)} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume ?? SFX[name]} />
  </Sequence>
);
