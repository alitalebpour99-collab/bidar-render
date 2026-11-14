// The grid tile of a set Reel: one object and three or four big words (the
// audit's rule), in the hall of arches, everything to be read inside the
// middle square that Instagram's grid keeps; the episode's number in its
// usual place above the square.
import React from "react";
import { AbsoluteFill } from "remotion";
import { GULZAR, VAZIR, W, H, noDot } from "../kit";
import type { CoverProps } from "../props";
import { EDGE, HallScene } from "./Hall";
import { ACCENT, NAVY, orbit, wordsOf, type Line } from "./space";

export type SetCoverProps = CoverProps & { big?: string; fitted?: Line[] };

const TOP = (H - W) / 2;

/** The words the tile shows: the site's `big`, else the title when it is short enough. */
export const coverWords = (c: CoverProps & { big?: string }) => noDot((c.big ?? c.title ?? "").trim());
export const coverWordCount = (c: CoverProps & { big?: string }) => wordsOf(coverWords(c)).length;

const Glyph: React.FC<{ format: string }> = ({ format }) => {
  if (format === "truefalse")
    return (
      <svg width={230} height={230} viewBox="0 0 100 100">
        <path d="M18 52 L34 68 L56 36" fill="none" stroke={ACCENT.right} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M62 40 L84 66 M84 40 L62 66" fill="none" stroke="#ff4d8d" strokeWidth={9} strokeLinecap="round" />
      </svg>
    );
  return <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 250, lineHeight: 1, color: format === "five" ? ACCENT.gold : ACCENT.turq, textShadow: "0 0 40px rgba(23,212,164,.6)", transform: "translateY(-8px)" }}>{format === "five" ? "۵" : "؟"}</span>;
};

export const CoverSet: React.FC<SetCoverProps> = (c) => {
  const lines = c.fitted ?? [{ text: coverWords(c), size: 110, weight: 900 }];
  return (
    <AbsoluteFill style={{ background: NAVY.deep, direction: "rtl" }}>
      <HallScene pose={orbit([-66, 0, 1000], 1300, 0, 120)} frame={0} />
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 46%, rgba(0,0,0,0) 60%, rgba(2,4,12,.6) 100%)" }} />
      {c.episode ? (
        <div style={{ position: "absolute", top: TOP - 118, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "6px 30px 14px", borderRadius: 36, background: "rgba(6,16,31,.85)", border: `3px solid ${ACCENT.turq}`, color: NAVY.ink, fontFamily: VAZIR, fontWeight: 800, fontSize: 44, whiteSpace: "nowrap" }}>{c.episode}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", top: TOP + 40, left: 0, right: 0, textAlign: "center", fontFamily: GULZAR, fontSize: 74, lineHeight: 1.3, color: ACCENT.turq }}>بیدار</div>
      {/* the one object: a glass medallion in the hall's light */}
      <div style={{ position: "absolute", top: TOP + 190, left: (W - 400) / 2, width: 400, height: 400, borderRadius: "50%", padding: 8, background: EDGE, boxShadow: "0 0 90px rgba(23,212,164,.45), 0 40px 80px rgba(0,0,0,.55)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: `radial-gradient(circle at 38% 32%, ${NAVY.panel2}, ${NAVY.night})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Glyph format={c.format} />
        </div>
      </div>
      <div style={{ position: "absolute", top: TOP + 630, left: 80, right: 80, height: 380, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: l.size, lineHeight: 1.3, color: NAVY.ink, whiteSpace: "nowrap", textShadow: "0 0 30px rgba(23,212,164,.45), 0 4px 12px rgba(0,0,0,.6)" }}>
            {l.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
