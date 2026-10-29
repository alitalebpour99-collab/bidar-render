// Every Reel on one safe stage (Divan's answer to the owner's «متن‌های بالای
// تصاویر میره», 22 October 2026): the designed frame is drawn at STAGE_K, so
// that its first line lands at y 290 and its last at y 1590, inside the 4:5
// crop of Instagram's feed and clear of the caption and buttons of the
// full-screen viewers. Each look paints its own ground full-bleed under the
// stage (a map, the parchment, the night), so no edge of the smaller stage can
// show; the stage itself is transparent and does not clip.
//
// The burned-in captions sit on the stage too, inside the safe area.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { DESIGN_BOTTOM, H, RAIL, SIDE, STAGE_K, STAGE_X, STAGE_Y, VAZIR, W, clamped } from "./kit";
import type { Timeline } from "./props";
import { chunks } from "./timeline";

/** A Reel: its full-bleed ground, its designed frame on the stage, its score and its narrator. */
export const Stage: React.FC<{ ground: React.ReactNode; children: React.ReactNode; tl: Timeline; music?: string; offset?: readonly [number, number] }> = ({ ground, children, tl, music, offset = [0, 0] }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    {ground}
    <div style={{ position: "absolute", left: STAGE_X + offset[0], top: STAGE_Y + offset[1], width: W, height: H, transform: `scale(${STAGE_K})`, transformOrigin: "0 0" }}>{children}</div>
    {music ? <Audio src={staticFile(music)} /> : null}
    {tl.voice.map((v, i) => (
      // a take cut at a hold plays in pieces: each from its place in the file, for its length
      <Sequence key={`${v.file}-${i}`} from={v.from} durationInFrames={v.frames ?? Infinity} layout="none">
        <Audio src={staticFile(v.file)} {...(v.trim ? { trimBefore: v.trim } : {})} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

export type CaptionLook = {
  ink: string;
  /** the word being said */
  now: string;
  /** a band behind the line, or none */
  band?: string;
  border?: string;
  size?: number;
  weight?: number;
  shadow?: string;
};

/**
 * The narration, burned in: a few words at a time, the word being said in the
 * look's accent. They sit low in the safe area (design y ~1300–1460), clear of
 * the right rail where Instagram puts its buttons.
 */
export const Captions: React.FC<{ tl: Timeline; look: CaptionLook; bottom?: number; until?: number }> = ({ tl, look, bottom = DESIGN_BOTTOM - 150, until }) => {
  const frame = useCurrentFrame();
  const list = React.useMemo(() => chunks(tl.words), [tl.words]);
  const c = list.find((x) => frame >= x.from && frame < x.to);
  if (!c || (until !== undefined && frame >= until)) return null;
  const k = interpolate(frame, [c.from, c.from + 5], [0.9, 1], clamped);
  const o = interpolate(frame, [c.from, c.from + 3], [0.2, 1], clamped);
  const size = look.size ?? 64;
  return (
    <div style={{ position: "absolute", left: SIDE, right: RAIL - 20, bottom: H - bottom, display: "flex", justifyContent: "center", direction: "rtl" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.28em",
          padding: look.band ? "14px 34px 20px" : 0,
          borderRadius: 22,
          background: look.band,
          border: look.border,
          fontFamily: VAZIR,
          fontWeight: look.weight ?? 800,
          fontSize: size,
          lineHeight: 1.45,
          color: look.ink,
          textShadow: look.shadow,
          transform: `scale(${k})`,
          opacity: o,
          maxWidth: W - SIDE - RAIL,
        }}
      >
        {c.words.map((w, i) => (
          <span key={i} style={{ color: frame >= w.from - 2 && frame <= w.to + 2 ? look.now : look.ink, whiteSpace: "nowrap" }}>
            {w.text}
          </span>
        ))}
      </div>
    </div>
  );
};

/** The beats' frames as starts, for the layouts: when a beat begins, and how far into it the film is. */
export const beatAt = (tl: Timeline, id: string) => tl.beats[id] ?? { from: 0, to: tl.total };
/** The beat the film is in now. */
export const beatNow = (tl: Timeline, frame: number) => tl.order.findLast((id) => frame >= tl.beats[id].from) ?? tl.order[0];
