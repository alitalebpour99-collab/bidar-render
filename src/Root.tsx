import React from "react";
import { Composition } from "remotion";
import bordersSample from "../samples/borders-1.json";
import mythSample from "../samples/myth-1.json";
import wordSample from "../samples/word-1.json";
import bookSample from "../samples/book-1.json";
import coverSample from "../samples/borders-1.cover.json";
import flagSample from "../samples/flag-1.json";
import treatySample from "../samples/treaty-1.json";
import citySample from "../samples/city-1.json";
import { Book } from "./Book";
import { Borders } from "./Borders";
import { City } from "./City";
import { Cover } from "./Cover";
import { Flag } from "./Flag";
import { Myth } from "./Myth";
import { Treaty } from "./Treaty";
import { Word } from "./Word";
import type { Base, BookProps, BordersProps, CityProps, CoverProps, FlagProps, MythProps, ReelProps, TreatyProps, WordProps } from "./props";
import { timeline } from "./timeline";
import { adapt } from "./adapt";

// One composition per format (the id is the format the site names in a job,
// docs/contract.md), all 1080 × 1920 at 30 fps, plus the still grid tile.
// The samples are only what the studio shows when no content is passed; a
// render always gets its content from the site (or from samples/ by hand).
const frame = { width: 1080, height: 1920, fps: 30 };

/** A Reel's clock: its beats and captions from its narrator (timeline.ts), its length from the last word. */
const timed = <P extends Pick<Base, "beats" | "voiceIn">>({ props: given }: { props: P }) => {
  // the site's own shape (lib/social/props.ts of bidar) or the samples' (src/props.ts)
  const props = adapt<P & ReelProps>(given) as P;
  const tl = timeline(props.beats, props.voiceIn);
  return { durationInFrames: tl.total, props: { ...props, tl } as P };
};
const as = <T,>(x: unknown) => x as T;

export const Root: React.FC = () => (
  <>
    <Composition id="borders" component={Borders} {...frame} durationInFrames={900} defaultProps={as<BordersProps>(bordersSample)} calculateMetadata={(x: { props: BordersProps }) => timed(x)} />
    <Composition id="myth" component={Myth} {...frame} durationInFrames={900} defaultProps={as<MythProps>(mythSample)} calculateMetadata={(x: { props: MythProps }) => timed(x)} />
    <Composition id="word" component={Word} {...frame} durationInFrames={900} defaultProps={as<WordProps>(wordSample)} calculateMetadata={(x: { props: WordProps }) => timed(x)} />
    <Composition id="book" component={Book} {...frame} durationInFrames={1200} defaultProps={as<BookProps>(bookSample)} calculateMetadata={(x: { props: BookProps }) => timed(x)} />
    <Composition id="flag" component={Flag} {...frame} durationInFrames={1050} defaultProps={as<FlagProps>(flagSample)} calculateMetadata={(x: { props: FlagProps }) => timed(x)} />
    <Composition id="treaty" component={Treaty} {...frame} durationInFrames={1050} defaultProps={as<TreatyProps>(treatySample)} calculateMetadata={(x: { props: TreatyProps }) => timed(x)} />
    <Composition id="city" component={City} {...frame} durationInFrames={1050} defaultProps={as<CityProps>(citySample)} calculateMetadata={(x: { props: CityProps }) => timed(x)} />
    <Composition id="cover" component={Cover} {...frame} durationInFrames={1} defaultProps={as<CoverProps>(coverSample)} />
  </>
);
