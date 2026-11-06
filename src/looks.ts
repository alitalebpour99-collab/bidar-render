// The look a Story or a carousel wears: the colours of the series it comes
// from (the format the site names in `of`), taken from that series' own Reel
// and tile, so a Story or a card reads as the same series on the page.
import { LEAF } from "./Book";
import { LAPIS } from "./Borders";
import { SWISS } from "./Figure";
import { PARCH } from "./Myth";
import { SHOW } from "./Quiz";
import { ILLUM } from "./Quote";
import { NIGHT } from "./Word";

export type Look = {
  /** the ground, a CSS background */
  ground: string;
  ink: string;
  /** the quieter text: the series' name, a note */
  sub: string;
  accent: string;
  /** text on the accent */
  onAccent: string;
  /** rules, frames, the grid */
  line: string;
};

const LAPIS_LOOK: Look = { ground: `radial-gradient(1200px 1600px at 50% 40%, ${LAPIS.sea}, ${LAPIS.deep})`, ink: LAPIS.ink, sub: LAPIS.muted, accent: LAPIS.gold, onAccent: LAPIS.deep, line: "rgba(232,197,106,.4)" };

export const LOOKS: Record<string, Look> = {
  borders: LAPIS_LOOK,
  flag: LAPIS_LOOK,
  treaty: LAPIS_LOOK,
  city: LAPIS_LOOK,
  myth: { ground: `radial-gradient(1200px 1600px at 50% 40%, ${PARCH.paper}, ${PARCH.paper2})`, ink: PARCH.ink, sub: PARCH.ink2, accent: PARCH.red, onAccent: PARCH.card, line: "rgba(43,30,18,.28)" },
  word: { ground: `radial-gradient(1200px 1600px at 50% 40%, ${NIGHT.sky}, ${NIGHT.deep})`, ink: NIGHT.ink, sub: NIGHT.muted, accent: NIGHT.mint, onAccent: NIGHT.deep, line: "rgba(95,224,207,.38)" },
  book: { ground: LEAF.leather, ink: "#f4ecd9", sub: "#d6b05c", accent: "#e8c56a", onAccent: LEAF.night2, line: "rgba(214,176,92,.45)" },
  quote: { ground: `radial-gradient(1100px 1500px at 50% 40%, #16307a 0%, ${ILLUM.lapis} 40%, ${ILLUM.night} 100%)`, ink: "#f5e9c9", sub: "#cdbf9c", accent: "#e8c56a", onAccent: ILLUM.night, line: "rgba(232,197,106,.42)" },
  figure: { ground: SWISS.paper, ink: SWISS.ink, sub: SWISS.ink2, accent: SWISS.ink, onAccent: SWISS.paper, line: "rgba(19,19,19,.22)" },
  quiz: { ground: `linear-gradient(180deg, ${SHOW.night2}, ${SHOW.night})`, ink: "#f4f6ff", sub: "rgba(244,246,255,.68)", accent: "#17d4a4", onAccent: SHOW.night, line: "rgba(244,246,255,.2)" },
  // the round of 2026-10-31, as their tiles (Cover.tsx)
  truefalse: { ground: "radial-gradient(1200px 1600px at 50% 40%, #12373d, #06171a)", ink: "#f4ecd9", sub: "#9fb8b5", accent: "#e2bd6b", onAccent: "#06171a", line: "rgba(244,236,217,.3)" },
  five: { ground: "radial-gradient(1200px 1600px at 50% 40%, #11254d, #040917)", ink: "#f5efe0", sub: "#9fb0d0", accent: "#e8c56a", onAccent: "#040917", line: "rgba(232,197,106,.42)" },
  sweep: { ground: "radial-gradient(1200px 1600px at 50% 40%, #2a2410, #05070d)", ink: "#f4f1ea", sub: "#a7adbb", accent: "#e8c56a", onAccent: "#05070d", line: "rgba(232,197,106,.4)" },
};

/** The look of a series, the lapis and gold of the maps when it has none of its own. */
export const lookOf = (of: string): Look => LOOKS[of] ?? LAPIS_LOOK;
