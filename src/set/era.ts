// One colour a period, for the tile of a set Reel (the owner's review of
// 2026-11-16: every tile was the same navy). The colour is the tile's whole
// field (the hall's wall and light), not a small mark, so the page's grid
// reads as many colours while every tile stays in the museum's night hall.
// The site may name the period (`era` in the cover's props); without it the
// period is read from the tile's own words, and a series that belongs to no
// period wears its series' colour.
export type EraKey = "elam" | "achaemenid" | "seleucid" | "parthian" | "sasanian" | "early-islam" | "seljuk" | "ilkhanid" | "safavid" | "afsharid" | "qajar" | "pahlavi" | "today";
export type EraLook = { fa: string; field: string; deep: string; light: string };

export const ERA: Record<EraKey, EraLook> = {
  elam: { fa: "عیلام", field: "#5c2f3a", deep: "#260f16", light: "#e6a9b6" },
  achaemenid: { fa: "هخامنشی", field: "#8a6412", deep: "#3a2805", light: "#f2cf6b" },
  seleucid: { fa: "سلوکی", field: "#5b5f66", deep: "#1f2125", light: "#d5d9e0" },
  parthian: { fa: "اشکانی", field: "#51601f", deep: "#1f2709", light: "#cfdc86" },
  sasanian: { fa: "ساسانی", field: "#8c2a1c", deep: "#3a0e08", light: "#f1a487" },
  "early-islam": { fa: "سده‌های نخست اسلامی", field: "#0f6247", deep: "#04261b", light: "#8fe0bd" },
  seljuk: { fa: "سلجوقی", field: "#1f6f9a", deep: "#082a3d", light: "#a6dcf2" },
  ilkhanid: { fa: "ایلخانی و تیموری", field: "#3d3f86", deep: "#15163a", light: "#b9bbf0" },
  safavid: { fa: "صفوی", field: "#0e6f74", deep: "#042c2f", light: "#8fe6e2" },
  afsharid: { fa: "افشار و زند", field: "#7a4a16", deep: "#301b05", light: "#f0c088" },
  qajar: { fa: "قاجار", field: "#8a3d4a", deep: "#36121a", light: "#f3b3bd" },
  pahlavi: { fa: "پهلوی", field: "#3a556f", deep: "#13202d", light: "#bcd3e6" },
  today: { fa: "امروز", field: "#12306e", deep: "#061230", light: "#a9c4ff" },
};

/** Words of a tile that name a period. The first that is found decides. */
const WORDS: [RegExp, EraKey][] = [
  [/عیلام|شوش|چغازنبیل/, "elam"],
  [/هخامنش|کوروش|داریوش|خشایارشا|تخت[ ‌]?جمشید|پاسارگاد/, "achaemenid"],
  [/سلوکی|اسکندر/, "seleucid"],
  [/اشکانی|پارت/, "parthian"],
  [/ساسانی|خسرو|شاپور|تیسفون|انوشیروان/, "sasanian"],
  [/سلجوق|خیام|نظام[ ‌]?الملک/, "seljuk"],
  [/ایلخان|مغول|تیمور/, "ilkhanid"],
  [/صفوی|شاه[ ‌]?عباس|اصفهان|چالدران/, "safavid"],
  [/افشار|نادر|زند|کریم[ ‌]?خان/, "afsharid"],
  [/قاجار|مشروطه|ترکمانچای|گلستان|ناصرالدین/, "qajar"],
  [/پهلوی|رضاشاه|مصدق/, "pahlavi"],
  [/خوارزمی|رازی|ابن[ ‌]?سینا|بیرونی|دانشمند|سامانی|فردوسی/, "early-islam"],
];
/** A series that belongs to no period: its own colour, so the quiz and the true-or-false differ from each other too. */
const SERIES: Record<string, EraKey> = { quiz: "safavid", truefalse: "sasanian", five: "achaemenid", belief: "today", frontier: "today" };

/** Whether the tile's period is a real one (named by the site or read from its words), not the colour a series falls back to: only then the tile shows the period's name. */
export function eraNamed(c: { era?: string; title?: string; big?: string }): boolean {
  if (c.era && c.era in ERA) return c.era !== "today";
  const text = `${c.title ?? ""} ${c.big ?? ""}`;
  return WORDS.some(([re]) => re.test(text));
}

export function eraOf(c: { era?: string; format: string; title?: string; big?: string; kicker?: string }): EraKey {
  if (c.era && c.era in ERA) return c.era as EraKey;
  const text = `${c.title ?? ""} ${c.big ?? ""}`;
  for (const [re, key] of WORDS) if (re.test(text)) return key;
  return SERIES[c.format] ?? "today";
}
