// The still picture a Reel shows on the profile grid. Instagram cuts the tall
// frame to its middle (3:4, and 1:1 in places), so everything that must be
// read sits in the middle square. Each series keeps its own look on the grid
// too: lapis and gold, parchment, night teal.
import React from "react";
import { AbsoluteFill } from "remotion";
import { LEAF, NASKH } from "./Book";
import { LAPIS } from "./Borders";
import { CityTile } from "./City";
import { FlagTile } from "./Flag";
import { TreatyTile } from "./Treaty";
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

/**
 * The book's tile («از کتاب»): the book's lapis leather and gold tooling (the
 * site's BookCover3D), the passage's hook in the book's Naskh, the chapter.
 */
const BookTile: React.FC<CoverProps> = ({ title, mark, kicker, series }) => {
  const size = title.length > 44 ? 76 : title.length > 28 ? 90 : 108;
  return (
    <AbsoluteFill style={{ background: LEAF.leather, direction: "rtl" }}>
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 50%, rgba(232,197,106,.12), rgba(10,26,63,0) 75%)" }} />
      <div style={{ position: "absolute", top: TOP + 48, left: 48, right: 48, height: W - 96, borderRadius: 18, border: "4px solid rgba(214,176,92,.85)" }} />
      <div style={{ position: "absolute", top: TOP + 66, left: 66, right: 66, height: W - 132, borderRadius: 12, border: "2px solid rgba(201,162,77,.45)" }} />
      <div style={{ position: "absolute", top: TOP + 104, right: 116, left: 116, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: GULZAR, fontSize: 92, color: LEAF.gold, lineHeight: 1.2 }}>بیدار</span>
        <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 34, color: LEAF.gold2 }}>{kicker ?? series}</span>
      </div>
      <div style={{ position: "absolute", top: TOP + 280, bottom: H - TOP - W + 200, right: 120, left: 120, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 30, textAlign: "center" }}>
        <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: size, lineHeight: 1.55, color: LEAF.cream, textWrap: "balance", textShadow: "0 2px 6px rgba(0,0,0,.5)" } as React.CSSProperties}>{title}</div>
        {mark ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 52, color: LEAF.gold }}>{mark}</div> : null}
      </div>
      <div style={{ position: "absolute", top: TOP + W - 170, right: 116, left: 116, fontFamily: VAZIR, fontWeight: 700, fontSize: 34, color: LEAF.gold2, direction: "ltr", textAlign: "right" }}>bidar.ahura.cloud/book</div>
    </AbsoluteFill>
  );
};

export const Cover: React.FC<CoverProps> = (props) => {
  const { format, series, title, mark, kicker } = props;
  if (format === "book") return <BookTile {...props} />;
  if (format === "flag") return <FlagTile {...props} />;
  if (format === "treaty") return <TreatyTile {...props} />;
  if (format === "city") return <CityTile {...props} />;
  const l = LOOK[format] ?? LOOK.borders;
  const size = title.length > 40 ? 84 : title.length > 26 ? 100 : 122;
  return (
    <AbsoluteFill style={{ background: l.ground, direction: "rtl" }}>
      <div style={{ position: "absolute", top: TOP + 56, left: 56, right: 56, height: W - 112, borderRadius: 40, border: `3px solid ${l.frame}` }} />
      <div style={{ position: "absolute", top: TOP + 96, right: 116, left: 116, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: GULZAR, fontSize: 96, color: l.accent, lineHeight: 1.2 }}>بیدار</span>
        <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 36, color: l.sub }}>{kicker ?? series}</span>
      </div>
      <div style={{ position: "absolute", top: TOP + 290, bottom: H - TOP - W + 190, right: 116, left: 116, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: size, lineHeight: 1.35, color: l.ink, textWrap: "balance" } as React.CSSProperties}>{title}</div>
        {mark ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 56, color: l.accent }}>{mark}</div> : null}
      </div>
      <div style={{ position: "absolute", top: TOP + W - 160, right: 116, left: 116, fontFamily: VAZIR, fontWeight: 700, fontSize: 34, color: l.ink, direction: "ltr", textAlign: "right" }}>bidar.ahura.cloud</div>
    </AbsoluteFill>
  );
};
