// A post of several pictures (a carousel), ported from Divan's src/Cards.tsx:
// the cards of one subject, 1080 by 1350, drawn one per frame and saved as
// stills (worker.mjs renderPictures). Each card is whole on its own, so the
// post reads card by card: the hook, the list, the figure, and at the end the
// source and why to save or send it. The cards wear the colours of the series
// their content comes from. Every word and figure comes from the props the
// site sends (lib/social/formats.ts, format «cards»).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { NASKH } from "./Book";
import { lookOf, type Look } from "./looks";
import { GULZAR, VAZIR } from "./kit";

export type CardView =
  | { kind: "hook"; kicker: string; figure: string | null; title: string; sub: string | null }
  | { kind: "list"; title: string; items: { k: string; v: string; s: string | null }[]; note: string | null }
  | { kind: "figure"; label: string; value: string; unit: string; explain: string; when: string; source: string }
  | { kind: "end"; title: string; lines: string[]; cta: string };

export type CardsProps = {
  format: "cards";
  /** the series' name */
  series: string;
  /** the format whose colours the cards wear */
  of: string;
  cards: CardView[];
};

export const CARD_W = 1080;
export const CARD_H = 1350;
const PAD = 84;

export const cardsLength = (p: CardsProps) => Math.max(1, p.cards.length);

const Shell: React.FC<{ l: Look; series: string; n: number; total: number; children: React.ReactNode }> = ({ l, series, n, total, children }) => (
  <AbsoluteFill style={{ background: l.ground, direction: "rtl" }}>
    <AbsoluteFill style={{ backgroundImage: `linear-gradient(${l.line} 1px, transparent 1px), linear-gradient(90deg, ${l.line} 1px, transparent 1px)`, backgroundSize: "108px 108px", opacity: 0.18 }} />
    {/* whose it is, and where in the post this card stands */}
    <div style={{ position: "absolute", top: 50, right: PAD, left: PAD, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontFamily: GULZAR, fontSize: 64, color: l.accent, lineHeight: 1.2 }}>بیدار</span>
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} style={{ width: i === n ? 34 : 12, height: 12, borderRadius: 6, background: i === n ? l.accent : l.line }} />
        ))}
      </div>
    </div>
    <div style={{ position: "absolute", top: 170, bottom: 100, right: PAD, left: PAD, display: "flex", flexDirection: "column" }}>{children}</div>
    <div style={{ position: "absolute", bottom: 40, right: PAD, left: PAD, display: "flex", justifyContent: "space-between", fontFamily: VAZIR, fontSize: 24, color: l.sub }}>
      <span>{series}</span>
      <span style={{ direction: "ltr", fontWeight: 700, color: l.ink }}>bidar.ahura.cloud</span>
    </div>
  </AbsoluteFill>
);

const Hook: React.FC<{ c: Extract<CardView, { kind: "hook" }>; l: Look }> = ({ c, l }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 30 }}>
    <span style={{ padding: "8px 28px 12px", borderRadius: 40, background: l.accent, color: l.onAccent, fontFamily: VAZIR, fontWeight: 800, fontSize: 38 }}>{c.kicker}</span>
    {c.figure ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: c.figure.length > 10 ? 120 : 170, lineHeight: 1.05, color: l.accent }}>{c.figure}</div> : null}
    <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: c.title.length > 60 ? 70 : 84, lineHeight: 1.45, color: l.ink, textWrap: "balance" } as React.CSSProperties}>{c.title}</div>
    {c.sub ? <div style={{ fontFamily: VAZIR, fontSize: 34, lineHeight: 1.6, color: l.sub }}>{c.sub}</div> : null}
    <div style={{ marginTop: 10, fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: l.accent }}>ورق بزن</div>
  </div>
);

/**
 * At Bidar `k` is the short label (a number, a language, a period) and `v`
 * the text, from a word's form to a whole sentence of the sources (Divan's
 * cards have it the other way round): the labels take one column, as wide as
 * the longest, and the texts wrap beside them.
 */
const List: React.FC<{ c: Extract<CardView, { kind: "list" }>; l: Look }> = ({ c, l }) => {
  const items = c.items.slice(0, 8);
  const kw = Math.min(300, Math.max(56, Math.max(0, ...items.map((it) => it.k.length)) * 24));
  const long = items.some((it) => it.v.length > 40);
  const size = long ? (items.length > 3 ? 32 : 36) : 40;
  return (
    <>
      <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: 56, lineHeight: 1.35, color: l.ink, marginBottom: 24 }}>{c.title}</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 22, padding: "18px 0", borderTop: `1.5px solid ${l.line}` }}>
          <span style={{ flex: "none", width: kw, fontFamily: VAZIR, fontWeight: 800, fontSize: 34, color: l.accent, whiteSpace: "nowrap" }}>{it.k}</span>
          <span style={{ flex: 1, minWidth: 0, fontFamily: VAZIR, fontWeight: long ? 500 : 800, fontSize: size, lineHeight: 1.6, color: l.ink }}>
            {it.v}
            {it.s ? <span style={{ display: "block", fontWeight: 400, fontSize: 26, color: l.sub, marginTop: 4 }}>{it.s}</span> : null}
          </span>
        </div>
      ))}
      {c.note ? <div style={{ marginTop: "auto", fontFamily: VAZIR, fontSize: 26, lineHeight: 1.6, color: l.sub }}>{c.note}</div> : null}
    </>
  );
};

const Figure: React.FC<{ c: Extract<CardView, { kind: "figure" }>; l: Look }> = ({ c, l }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
    <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: 54, lineHeight: 1.4, color: l.sub }}>{c.label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 22, flexWrap: "wrap" }}>
      <span style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: c.value.length > 9 ? 120 : 160, lineHeight: 1.05, color: l.accent, whiteSpace: "nowrap" }}>{c.value}</span>
      <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 44, color: l.ink }}>{c.unit}</span>
    </div>
    <div style={{ fontFamily: VAZIR, fontSize: 36, lineHeight: 1.7, color: l.ink }}>{c.explain}</div>
    {/* never «·» beside Persian: the date and the source are joined with a Persian comma */}
    <div style={{ fontFamily: VAZIR, fontSize: 26, lineHeight: 1.6, color: l.sub }}>{[c.when, c.source ? `منبع: ${c.source}` : ""].filter(Boolean).join("، ")}</div>
  </div>
);

const End: React.FC<{ c: Extract<CardView, { kind: "end" }>; l: Look }> = ({ c, l }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
    <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: 66, lineHeight: 1.4, color: l.ink }}>{c.title}</div>
    {c.lines.map((line, i) => (
      <div key={i} style={{ fontFamily: VAZIR, fontSize: 30, lineHeight: 1.7, color: l.sub }}>
        {line}
      </div>
    ))}
    <div style={{ marginTop: 20, alignSelf: "flex-start", padding: "16px 34px 20px", borderRadius: 40, background: l.accent, color: l.onAccent, fontFamily: VAZIR, fontWeight: 800, fontSize: 38 }}>{c.cta}</div>
  </div>
);

export const Cards: React.FC<CardsProps> = (p) => {
  const frame = useCurrentFrame();
  const l = lookOf(p.of);
  const n = Math.max(0, Math.min(frame, p.cards.length - 1));
  const c = p.cards[n];
  if (!c) return <AbsoluteFill style={{ background: l.ground }} />;
  return (
    <Shell l={l} series={p.series} n={n} total={p.cards.length}>
      {c.kind === "hook" ? <Hook c={c} l={l} /> : c.kind === "list" ? <List c={c} l={l} /> : c.kind === "figure" ? <Figure c={c} l={l} /> : <End c={c} l={l} />}
    </Shell>
  );
};
