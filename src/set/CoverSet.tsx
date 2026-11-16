// The grid tile of a set Reel: one object and three or four big words (the
// audit's rule), in the hall of arches, everything to be read inside the
// middle square that Instagram's grid keeps; the episode's number in its
// usual place above the square.
import React from "react";
import { AbsoluteFill } from "remotion";
import { GULZAR, VAZIR, W, H, noDot } from "../kit";
import type { CoverProps } from "../props";
import { HallScene } from "./Hall";
import { ACCENT, NAVY, orbit, wordsOf, type Emblem, type Line, type Model } from "./space";
import { Artifact, MODEL_SIZE } from "./models";
import { ERA, eraNamed, eraOf } from "./era";
import { MUSEUM, Plinth, Tazhib, Vitrine } from "./props/Museum";

export type SetCoverProps = CoverProps & { big?: string; fitted?: Line[]; model?: Model; emblem?: Emblem; /** the period the tile wears (era.ts); read from its words when left out */ era?: string };

const TOP = (H - W) / 2;

/** The words the tile shows: the site's `big`, else the title when it is short enough. */
export const coverWords = (c: CoverProps & { big?: string }) => noDot((c.big ?? c.title ?? "").trim());
export const coverWordCount = (c: CoverProps & { big?: string }) => wordsOf(coverWords(c)).length;

const Glyph: React.FC<{ format: string }> = ({ format }) => {
  if (format === "truefalse")
    return (
      <svg width={230} height={230} viewBox="0 0 100 100">
        <path d="M18 52 L34 68 L56 36" fill="none" stroke={ACCENT.right} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M62 40 L84 66 M84 40 L62 66" fill="none" stroke={ACCENT.wrong} strokeWidth={9} strokeLinecap="round" />
      </svg>
    );
  return <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 250, lineHeight: 1, color: format === "five" ? ACCENT.gold : ACCENT.turq, textShadow: "0 0 40px rgba(255,214,150,.5)", transform: "translateY(-8px)" }}>{format === "five" ? "۵" : "؟"}</span>;
};

/** The episode's own object in the medallion («باور یا سند؟», «مرز ایران»): the Cyrus Cylinder, a coin, a column. */
const TileObject: React.FC<{ model: Model; emblem?: Emblem }> = ({ model, emblem }) => {
  const [mw, mh] = MODEL_SIZE[model];
  const k = Math.min(400 / mw, 330 / mh);
  return <Artifact id="tile" model={model} emblem={emblem} w={Math.round(mw * k)} h={Math.round(mh * k)} turn={model === "coin" ? 18 : 12} frame={0} />;
};

export const CoverSet: React.FC<SetCoverProps> = (c) => {
  const lines = c.fitted ?? [{ text: coverWords(c), size: 110, weight: 900 }];
  // the period's colour is the tile's whole field (era.ts): the grid of the page is many colours, each tile still the hall
  const key = eraOf(c);
  const era = ERA[key];
  const named = eraNamed(c);
  return (
    <AbsoluteFill style={{ background: era.deep, direction: "rtl" }}>
      <HallScene pose={orbit([-66, 0, 1000], 1300, 0, 120)} frame={0} field={era} />
      {/* the lamp over the object, and the room's shadow at the edges */}
      <AbsoluteFill style={{ background: `radial-gradient(620px 560px at 50% ${TOP + 360}px, rgba(${MUSEUM.warm},.30), rgba(${MUSEUM.warm},0) 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 46%, rgba(0,0,0,0) 62%, rgba(0,0,0,.5) 100%)" }} />
      {c.episode ? (
        <div style={{ position: "absolute", top: TOP - 118, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "6px 30px 14px", borderRadius: 36, background: "rgba(6,16,31,.8)", border: `3px solid ${MUSEUM.gold}`, color: NAVY.ink, fontFamily: VAZIR, fontWeight: 800, fontSize: 44, whiteSpace: "nowrap" }}>{c.episode}</div>
        </div>
      ) : null}
      {/* «بیدار» on the upper left of the middle square: the upper right is where Instagram draws its Reel mark */}
      <div style={{ position: "absolute", top: TOP + 26, left: 70, fontFamily: GULZAR, fontSize: 78, lineHeight: 1.3, color: MUSEUM.goldLight, textShadow: "0 4px 14px rgba(0,0,0,.5)" }}>بیدار</div>
      {/* the one object, large: on its plinth, in its case, under the lamp */}
      <div style={{ position: "absolute", top: TOP + 130, left: (W - 560) / 2, width: 560, height: 480 }}>
        <div style={{ position: "absolute", left: 30, top: 0, width: 500, height: 410 }}>
          <Vitrine w={500} h={410} frame={40} />
        </div>
        <div style={{ position: "absolute", left: 0, top: 384, width: 560, height: 96 }}>
          <Plinth w={560} h={96} />
        </div>
        <div style={{ position: "absolute", left: 30, top: 30, width: 500, height: 360, display: "flex", alignItems: "center", justifyContent: "center", filter: "drop-shadow(0 24px 26px rgba(0,0,0,.55))" }}>
          {c.model ? <TileObject model={c.model} emblem={c.emblem} /> : <Glyph format={c.format} />}
        </div>
      </div>
      <div style={{ position: "absolute", top: TOP + 640, left: 70, right: 70, height: named ? 290 : 380, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: l.size, lineHeight: 1.3, color: NAVY.ink, whiteSpace: "nowrap", textShadow: "0 4px 14px rgba(0,0,0,.65)" }}>
            {l.text}
          </div>
        ))}
      </div>
      {/* the lower part of the square: the period's name on a parchment label with gilded corners */}
      {named ? (
        <div style={{ position: "absolute", top: TOP + 944, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", padding: "8px 78px 16px", borderRadius: 14, background: MUSEUM.parchment, boxShadow: "0 14px 30px rgba(0,0,0,.45)", fontFamily: VAZIR, fontWeight: 800, fontSize: 58, lineHeight: 1.3, color: era.deep, whiteSpace: "nowrap" }}>
            <div style={{ position: "absolute", top: 4, right: 4 }}><Tazhib size={40} turn={0} color={MUSEUM.goldDeep} /></div>
            <div style={{ position: "absolute", bottom: 4, left: 4 }}><Tazhib size={40} turn={2} color={MUSEUM.goldDeep} /></div>
            {era.fa}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
