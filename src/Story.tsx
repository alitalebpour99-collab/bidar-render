// The Story that follows a Reel onto the page (ported from Divan's
// src/Story.tsx): nine and a half seconds that say a new video is up, in the
// colours of its series. Nothing in it is new content: the kicker, the title
// and the figure are the Reel's own tile, and every word comes from the props
// the site sends (lib/social/formats.ts storyProps).
//
// Instagram lays its own bars over a Story (the account's name on top, the
// message field at the bottom), so everything that must be read sits between.
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { NASKH } from "./Book";
import { lookOf } from "./looks";
import { FPS, GULZAR, H, VAZIR, W, clamped, ease, fade, grow, rise, seriesLine } from "./kit";

export type StoryProps = {
  format: "story";
  /** the series' name */
  series: string;
  /** the format of the Reel it announces: its colours */
  of: string;
  kicker: string;
  title: string;
  mark?: string;
  /** always false at Bidar (no model-written posts) */
  ai?: boolean;
  /** «@bidar.ahura» */
  handle: string;
  /** the bed (music.mjs), put in by the worker */
  music?: string;
};

const TOTAL = Math.round(9.5 * FPS);
export const storyDuration = () => TOTAL;

// what Instagram covers
const TOP_BAR = 250;
const BOTTOM_BAR = 340;
const SIDE = 84;
// the tile's block starts under the star and must end above the call at the foot
const TILE_TOP = TOP_BAR + 610;
const CALL_TOP = H - BOTTOM_BAR - 20 - 180;

/** A spring-like scale from 0 to 1 that overshoots a little. */
const pop = (frame: number, from: number, length = 20) => interpolate(frame, [from, from + length * 0.7, from + length], [0, 1.06, 1], clamped);

/** How many lines a title takes in Naskh at a size: words laid one after another, a letter counted half the size wide. */
function linesOf(text: string, size: number): number {
  const room = (W - 2 * SIDE) / (0.5 * size);
  let lines = 1;
  let used = 0;
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    const n = word.replace(/‌/g, "").length;
    if (used > 0 && used + 1 + n > room) {
      lines += 1;
      used = n;
    } else used += (used > 0 ? 1 : 0) + n;
  }
  return lines;
}

/** An eight-pointed star of the girih, drawn as one path. */
const starPath = (r: number, inner: number, cx: number, cy: number) =>
  Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const d = i % 2 ? inner : r;
    return `${i ? "L" : "M"}${(cx + d * Math.cos(a)).toFixed(1)} ${(cy + d * Math.sin(a)).toFixed(1)}`;
  }).join(" ") + "Z";

/** The title, word by word: each one rises into its place a little after the one before. */
const Words: React.FC<{ text: string; from: number; step: number; style: React.CSSProperties }> = ({ text, from, step, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...style, display: "flex", flexWrap: "wrap", columnGap: "0.28em" }}>
      {text
        .trim()
        .split(/\s+/)
        .map((w, i) => (
          <span key={i} style={{ display: "inline-block", opacity: fade(frame, from + i * step, 10), transform: `translateY(${rise(frame, from + i * step, 34)}px)` }}>
            {w}
          </span>
        ))}
    </div>
  );
};

export const Story: React.FC<StoryProps> = (p) => {
  const frame = useCurrentFrame();
  const l = lookOf(p.of);
  // a figure the title already says is not said twice
  const mark = p.mark && !p.title.includes(p.mark) ? p.mark : null;
  const markSize = mark && mark.length > 5 ? 96 : 124;
  // the largest title that leaves the kicker and the figure room above the call
  const room = CALL_TOP - TILE_TOP - 24;
  const fixed = 70 + 22 + (mark ? 22 + markSize * 1.1 : 0);
  const size = [124, 112, 100, 90, 80, 72, 64].find((s) => fixed + linesOf(p.title, s) * s * 1.42 <= room) ?? 58;
  // the star turns slowly for the whole Story
  const turn = (frame / TOTAL) * 140;
  const ring = pop(frame, 14, 26);
  // the call at the foot arrives last, and its arrow keeps moving
  const call = 150;
  const nudge = Math.sin(((frame - call) / FPS) * Math.PI * 1.6) * 12;

  return (
    <AbsoluteFill style={{ background: l.ground, direction: "rtl" }}>
      {p.music ? <Audio src={staticFile(p.music)} /> : null}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${l.line} 1px, transparent 1px), linear-gradient(90deg, ${l.line} 1px, transparent 1px)`,
          backgroundSize: "120px 120px",
          backgroundPosition: `${-(frame / TOTAL) * 60}px ${-(frame / TOTAL) * 120}px`,
          opacity: 0.22 * fade(frame, 0, 14),
        }}
      />

      {/* whose it is, and what kind of thing: under Instagram's own bar */}
      <div style={{ position: "absolute", top: TOP_BAR + 14, right: SIDE, left: SIDE, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: fade(frame, 4, 12), transform: `translateY(${rise(frame, 4, -24)}px)` }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: GULZAR, fontSize: 76, color: l.accent, lineHeight: 1.15 }}>بیدار</span>
          <span style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: 28, color: l.sub }}>{seriesLine(p.series)}</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 24px 10px", borderRadius: 30, border: `2px solid ${l.line}`, fontFamily: VAZIR, fontWeight: 700, fontSize: 34, color: l.ink }}>
          <span style={{ width: 16, height: 16, borderRadius: 8, background: l.accent, opacity: 0.45 + 0.55 * Math.abs(Math.sin((frame / FPS) * Math.PI)) }} />
          ویدیوی تازه
        </span>
      </div>

      {/* the girih star in a ring that turns */}
      <div style={{ position: "absolute", top: TOP_BAR + 150, left: 0, right: 0, height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="420" height="420" viewBox="0 0 420 420" style={{ position: "absolute", transform: `scale(${ring}) rotate(${turn}deg)` }}>
          <circle cx="210" cy="210" r="200" fill="none" stroke={l.line} strokeWidth="2.5" strokeDasharray="3 15" strokeLinecap="round" />
          <circle cx="210" cy="210" r="168" fill="none" stroke={l.accent} strokeWidth="3" strokeDasharray={`${1056 * grow(frame, 16, 40)} 1056`} transform="rotate(-90 210 210)" />
        </svg>
        <svg width="240" height="240" viewBox="0 0 240 240" style={{ opacity: fade(frame, 22, 14), transform: `scale(${pop(frame, 22, 24)}) rotate(${-turn / 2}deg)` }}>
          <path d={starPath(112, 62, 120, 120)} fill="none" stroke={l.accent} strokeWidth="5" strokeLinejoin="round" />
          <path d={starPath(56, 31, 120, 120)} fill={l.accent} opacity="0.35" />
        </svg>
      </div>

      {/* the Reel's own tile, in motion: its kicker, its title, its figure */}
      <div style={{ position: "absolute", top: TILE_TOP, right: SIDE, left: SIDE, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 22 }}>
        <span
          style={{
            padding: "8px 30px 12px",
            borderRadius: 40,
            background: l.accent,
            color: l.onAccent,
            fontFamily: VAZIR,
            fontWeight: 800,
            fontSize: 44,
            lineHeight: 1.5,
            whiteSpace: "nowrap",
            opacity: fade(frame, 44, 10),
            transform: `translateX(${interpolate(frame, [44, 62], [70, 0], { ...clamped, easing: ease })}px)`,
          }}
        >
          {p.kicker}
        </span>
        <Words text={p.title} from={60} step={4} style={{ fontFamily: NASKH, fontWeight: 700, fontSize: size, lineHeight: 1.42, color: l.ink }} />
        {mark ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: markSize, lineHeight: 1.1, color: l.accent, opacity: fade(frame, 112, 10), transform: `scale(${pop(frame, 112, 20)})`, transformOrigin: "right center" }}>{mark}</div> : null}
      </div>

      {/* where to see it: above Instagram's message field */}
      <div style={{ position: "absolute", bottom: BOTTOM_BAR + 20, right: SIDE, left: SIDE, opacity: fade(frame, call, 14), transform: `translateY(${rise(frame, call, 30)}px)` }}>
        <div style={{ height: 3, borderRadius: 2, background: l.line, transformOrigin: "right center", transform: `scaleX(${grow(frame, call, 30)})`, marginBottom: 26 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 46, color: l.ink, lineHeight: 1.4 }}>همین حالا در صفحه</span>
            <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 34, color: l.accent, direction: "ltr", textAlign: "right" }}>{p.handle}</span>
          </div>
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ flex: "none", transform: `translateY(${-nudge}px)` }}>
            <circle cx="55" cy="55" r="52" fill={l.accent} />
            <path d="M55 80V32M34 52l21-21 21 21" fill="none" stroke={l.onAccent} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
