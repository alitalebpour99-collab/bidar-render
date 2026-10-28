// The still picture a Reel shows on the profile grid. Instagram cuts the tall
// frame to its middle (3:4, and 1:1 in places), so everything that must be
// read sits in the middle square. Each series keeps its own look on the grid
// too: lapis and gold, parchment, night teal.
import React from "react";
import { AbsoluteFill } from "remotion";
import { LAPIS } from "./Borders";
import { GULZAR, H, VAZIR, W } from "./kit";
import { PARCH } from "./Myth";
import type { CoverProps } from "./props";
import { NIGHT } from "./Word";

const LOOK: Record<string, { ground: string; ink: string; accent: string; sub: string; frame: string }> = {
  borders: { ground: `radial-gradient(1200px 1400px at 50% 45%, ${LAPIS.sea}, ${LAPIS.deep})`, ink: LAPIS.ink, accent: LAPIS.gold, sub: LAPIS.turq, frame: "rgba(232,197,106,.5)" },
  myth: { ground: `radial-gradient(1200px 1400px at 50% 45%, ${PARCH.paper}, ${PARCH.paper2})`, ink: PARCH.ink, accent: PARCH.red, sub: PARCH.ink2, frame: "rgba(43,30,18,.35)" },
  word: { ground: `radial-gradient(1200px 1400px at 50% 50%, ${NIGHT.sky}, ${NIGHT.deep})`, ink: NIGHT.ink, accent: NIGHT.mint, sub: NIGHT.muted, frame: "rgba(95,224,207,.45)" },
};

const TOP = (H - W) / 2;

export const Cover: React.FC<CoverProps> = ({ format, series, title, mark }) => {
  const l = LOOK[format] ?? LOOK.borders;
  const size = title.length > 40 ? 84 : title.length > 26 ? 100 : 122;
  return (
    <AbsoluteFill style={{ background: l.ground, direction: "rtl" }}>
      <div style={{ position: "absolute", top: TOP + 56, left: 56, right: 56, height: W - 112, borderRadius: 40, border: `3px solid ${l.frame}` }} />
      <div style={{ position: "absolute", top: TOP + 96, right: 116, left: 116, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: GULZAR, fontSize: 96, color: l.accent, lineHeight: 1.2 }}>بیدار</span>
        <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 36, color: l.sub }}>{series}</span>
      </div>
      <div style={{ position: "absolute", top: TOP + 290, bottom: H - TOP - W + 190, right: 116, left: 116, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: size, lineHeight: 1.35, color: l.ink }}>{title}</div>
        {mark ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 56, color: l.accent }}>{mark}</div> : null}
      </div>
      <div style={{ position: "absolute", top: TOP + W - 160, right: 116, left: 116, fontFamily: VAZIR, fontWeight: 700, fontSize: 34, color: l.ink, direction: "ltr", textAlign: "right" }}>bidar.ahura.cloud</div>
    </AbsoluteFill>
  );
};
