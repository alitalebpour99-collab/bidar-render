// The source line of the quote, the figure and the quiz: «منبع:» and the source as the site holds it, then the
// address. A source written in Latin letters (most of the dictionary's: «Encyclopaedia Iranica, …») is set as its own
// left-to-right run, so its brackets and commas stay where they belong inside the Persian line.
import React from "react";
import { VAZIR } from "./kit";

const PERSIAN = /[؀-ۿ]/;
const strip = (s: string) => s.replace(/^\s*منبع\s*[:：]\s*/, "");

/** The source itself: a Latin source isolated left to right, a Persian one as it is. */
export const SourceText: React.FC<{ text: string }> = ({ text }) => {
  const t = strip(text);
  return PERSIAN.test(t) ? <>{t}</> : <span style={{ direction: "ltr", unicodeBidi: "isolate" }}>{t}</span>;
};

/** «منبع: …» and «bidar.ahura.cloud», in a block placed by its parent. */
export const SourceBlock: React.FC<{ text: string; font: string; size?: number; color: string; strong: string; style?: React.CSSProperties }> = ({ text, font, size = 28, color, strong, style }) => (
  <div style={{ direction: "rtl", ...style }}>
    <div style={{ fontFamily: font, fontSize: size, lineHeight: 1.55, color }}>
      منبع: <SourceText text={text} />
    </div>
    <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: size + 5, color: strong, direction: "ltr", textAlign: "right", marginTop: 4 }}>bidar.ahura.cloud</div>
  </div>
);
