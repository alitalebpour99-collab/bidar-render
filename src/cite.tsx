// The source line of the quote, the figure and the quiz: «منبع:» and the source as the site holds it, then the
// address. A source written in Latin letters (most of the dictionary's: «Encyclopaedia Iranica, …») is set as its own
// left-to-right run, so its brackets and commas stay where they belong inside the Persian line.
import React from "react";
import { VAZIR, sourceParts } from "./kit";

const PERSIAN = /[؀-ۿ]/;

/**
 * The sources themselves, joined by a Persian comma (the site's join; an older
 * site's «·» is read as one): each Latin source isolated left to right, a
 * Persian one as it is.
 */
export const SourceText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {sourceParts(text).map((t, i) => (
      <React.Fragment key={i}>
        {i ? "، " : null}
        {PERSIAN.test(t) ? t : <span style={{ direction: "ltr", unicodeBidi: "isolate" }}>{t}</span>}
      </React.Fragment>
    ))}
  </>
);

/** «منبع: …» and «bidar.ahura.cloud», in a block placed by its parent. */
export const SourceBlock: React.FC<{ text: string; font: string; size?: number; color: string; strong: string; style?: React.CSSProperties }> = ({ text, font, size = 28, color, strong, style }) => (
  <div style={{ direction: "rtl", ...style }}>
    <div style={{ fontFamily: font, fontSize: size, lineHeight: 1.55, color }}>
      منبع: <SourceText text={text} />
    </div>
    <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: size + 5, color: strong, direction: "ltr", textAlign: "right", marginTop: 4 }}>bidar.ahura.cloud</div>
  </div>
);
