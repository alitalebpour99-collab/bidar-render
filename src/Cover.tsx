// The still picture a Reel shows on the profile grid. Instagram cuts the tall
// frame to its middle (3:4, and 1:1 in places), so everything that must be
// read sits in the middle square. Each series keeps its own look on the grid
// too: lapis and gold, parchment, night teal.
import React from "react";
import { AbsoluteFill } from "remotion";
import { LEAF, NASKH } from "./Book";
import { LAPIS } from "./Borders";
import { SWISS, accentOf } from "./Figure";
import { SHOW } from "./Quiz";
import { ILLUM } from "./Quote";
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

/** «سخنِ ماندگار»: the lapis page, a double gold rule, the saying's first line in Nastaliq, the speaker in gold. */
const QuoteTile: React.FC<CoverProps> = ({ title, mark, kicker, series }) => {
  const size = title.length > 44 ? 66 : title.length > 30 ? 78 : 92;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1100px 1300px at 50% 46%, #16307a 0%, ${ILLUM.lapis} 40%, ${ILLUM.night} 100%)`, direction: "rtl" }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(83deg, rgba(245,233,201,.03) 0 1px, transparent 1px 7px), repeating-linear-gradient(-71deg, rgba(245,233,201,.024) 0 1px, transparent 1px 11px)" }} />
      <div style={{ position: "absolute", top: TOP + 48, left: 48, right: 48, height: W - 96, border: `5px solid ${ILLUM.gold}` }} />
      <div style={{ position: "absolute", top: TOP + 74, left: 74, right: 74, height: W - 148, border: `2px solid ${ILLUM.gold}`, opacity: 0.8 }} />
      <div style={{ position: "absolute", top: TOP + 110, right: 120, left: 120, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: GULZAR, fontSize: 88, color: ILLUM.gold, lineHeight: 1.2 }}>بیدار</span>
        <span style={{ fontFamily: GULZAR, fontSize: 50, color: ILLUM.goldLight }}>{kicker ?? series}</span>
      </div>
      <div style={{ position: "absolute", top: TOP + 270, bottom: H - TOP - W + 200, right: 130, left: 130, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 34, textAlign: "center" }}>
        <div style={{ fontFamily: GULZAR, fontSize: size, lineHeight: 2, color: ILLUM.cream, textWrap: "balance", textShadow: "0 2px 8px rgba(0,0,0,.5)" } as React.CSSProperties}>{title}</div>
        {mark ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 50, color: ILLUM.gold }}>— {mark}</div> : null}
      </div>
      <div style={{ position: "absolute", top: TOP + W - 168, right: 120, left: 120, fontFamily: VAZIR, fontWeight: 700, fontSize: 32, color: ILLUM.cream2, direction: "ltr", textAlign: "right" }}>bidar.ahura.cloud</div>
    </AbsoluteFill>
  );
};

/** The era's colour from the tile's mark («ح. ۶۰۰–۵۳۰ پ.م», «۱۹۳۴–۱۹۶۷ م»): its first year. */
const yearOfMark = (mark?: string) => {
  const m = /([۰-۹0-9]+)/.exec(mark ?? "");
  const y = m ? Number(m[1].replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))) : 1000;
  return /پ\.?\s?م/.test(mark ?? "") ? -y : y;
};

/** «چهره‌ها»: warm paper, the era's disc, the name huge in black, the years in the era's colour. */
const FigureTile: React.FC<CoverProps> = ({ title, mark, kicker, series }) => {
  const accent = accentOf(yearOfMark(mark));
  const n = title.length;
  const size = n <= 4 ? 250 : n <= 7 ? 200 : n <= 11 ? 150 : n <= 15 ? 120 : 100;
  return (
    <AbsoluteFill style={{ background: SWISS.paper, direction: "rtl" }}>
      <div style={{ position: "absolute", left: -110, top: TOP + 300, width: 540, height: 540, borderRadius: 270, background: accent }} />
      <div style={{ position: "absolute", top: TOP + 70, right: 90, left: 90, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: GULZAR, fontSize: 88, color: SWISS.ink, lineHeight: 1.2 }}>بیدار</span>
        <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 42, color: SWISS.ink }}>{kicker ?? series}</span>
      </div>
      <div style={{ position: "absolute", top: TOP + 210, right: 90, left: 90, height: 10, background: SWISS.ink }} />
      <div style={{ position: "absolute", top: TOP + 260, right: 90, left: 90, fontFamily: VAZIR, fontWeight: 900, fontSize: size, lineHeight: 1.08, color: SWISS.ink, textAlign: "right", textWrap: "balance" } as React.CSSProperties}>{title}</div>
      {mark ? <div style={{ position: "absolute", top: TOP + W - 260, right: 90, fontFamily: VAZIR, fontWeight: 900, fontSize: 70, color: accent }}>{mark}</div> : null}
      <div style={{ position: "absolute", top: TOP + W - 150, right: 90, left: 90, fontFamily: VAZIR, fontWeight: 700, fontSize: 32, color: SWISS.ink2, direction: "ltr", textAlign: "right" }}>bidar.ahura.cloud</div>
    </AbsoluteFill>
  );
};

/** «حدس بزن»: the dark stage, the show's pill, the question, its three options (none marked). */
const QuizTile: React.FC<CoverProps> = ({ title, mark, kicker, series }) => {
  const options = (mark ?? "").split(" · ").filter(Boolean).slice(0, 3);
  const size = title.length <= 24 ? 92 : title.length <= 36 ? 80 : 68;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${SHOW.night2}, ${SHOW.night})`, direction: "rtl" }}>
      <AbsoluteFill style={{ background: "radial-gradient(600px 700px at 30% 30%, rgba(23,212,164,.2), rgba(23,212,164,0) 70%), radial-gradient(640px 760px at 75% 40%, rgba(123,97,255,.2), rgba(123,97,255,0) 70%)" }} />
      <div style={{ position: "absolute", top: TOP + 80, right: 90, left: 90, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: GULZAR, fontSize: 84, color: SHOW.ink, lineHeight: 1.2 }}>بیدار</span>
        <span style={{ padding: "6px 26px 12px", borderRadius: 40, background: SHOW.teal, color: SHOW.dark, fontFamily: VAZIR, fontWeight: 900, fontSize: 44 }}>{kicker ?? series} ؟</span>
      </div>
      <div style={{ position: "absolute", top: TOP + 250, right: 100, left: 100, fontFamily: VAZIR, fontWeight: 900, fontSize: size, lineHeight: 1.4, color: SHOW.ink, textAlign: "center", textWrap: "balance" } as React.CSSProperties}>{title}</div>
      <div style={{ position: "absolute", top: TOP + 560, right: 130, left: 130, display: "flex", flexDirection: "column", gap: 22 }}>
        {options.map((o, i) => (
          <div key={i} style={{ height: 96, borderRadius: 48, background: SHOW.panel2, border: "3px solid rgba(244,246,255,.16)", display: "flex", alignItems: "center", gap: 22, padding: "0 12px 0 30px" }}>
            <span style={{ width: 70, height: 70, borderRadius: 35, display: "inline-flex", alignItems: "center", justifyContent: "center", background: [SHOW.teal, SHOW.yellow, SHOW.pink][i], color: SHOW.dark, fontFamily: VAZIR, fontWeight: 900, fontSize: 40 }}>{"۱۲۳"[i]}</span>
            <span style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 46, color: SHOW.ink, whiteSpace: "nowrap" }}>{o}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Cover: React.FC<CoverProps> = (props) => {
  const { format, series, title, mark, kicker } = props;
  if (format === "book") return <BookTile {...props} />;
  if (format === "quote") return <QuoteTile {...props} />;
  if (format === "figure") return <FigureTile {...props} />;
  if (format === "quiz") return <QuizTile {...props} />;
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
