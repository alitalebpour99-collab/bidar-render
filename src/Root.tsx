import React from "react";
import { Composition } from "remotion";
import bordersSample from "../samples/borders-1.json";
import mythSample from "../samples/myth-1.json";
import wordSample from "../samples/word-1.json";
import coverSample from "../samples/borders-1.cover.json";
import { Borders } from "./Borders";
import { Cover } from "./Cover";
import { Myth } from "./Myth";
import { Word } from "./Word";
import type { Base, BordersProps, CoverProps, MythProps, WordProps } from "./props";
import { timeline } from "./timeline";

// One composition per format (the id is the format the site names in a job,
// docs/contract.md), all 1080 × 1920 at 30 fps, plus the still grid tile.
// The samples are only what the studio shows when no content is passed; a
// render always gets its content from the site (or from samples/ by hand).
const frame = { width: 1080, height: 1920, fps: 30 };

/** A Reel's clock: its beats and captions from its narrator (timeline.ts), its length from the last word. */
const timed = <P extends Base>({ props }: { props: P }) => {
  const tl = timeline(props.beats, props.voiceIn);
  return { durationInFrames: tl.total, props: { ...props, tl } as P };
};
const as = <T,>(x: unknown) => x as T;

export const Root: React.FC = () => (
  <>
    <Composition id="borders" component={Borders} {...frame} durationInFrames={900} defaultProps={as<BordersProps>(bordersSample)} calculateMetadata={(x: { props: BordersProps }) => timed(x)} />
    <Composition id="myth" component={Myth} {...frame} durationInFrames={900} defaultProps={as<MythProps>(mythSample)} calculateMetadata={(x: { props: MythProps }) => timed(x)} />
    <Composition id="word" component={Word} {...frame} durationInFrames={900} defaultProps={as<WordProps>(wordSample)} calculateMetadata={(x: { props: WordProps }) => timed(x)} />
    <Composition id="cover" component={Cover} {...frame} durationInFrames={1} defaultProps={as<CoverProps>(coverSample)} />
  </>
);
